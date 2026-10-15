import { createHash } from "node:crypto";
import { BotRuntime, FatalBotError, describeError } from "./bot.ts";
import { SHARED_BOT_ID, db, disableBot, listBots, listServers, log, setRuntime, shouldRun, timers, type BotRecord } from "./store.ts";

// Worker: obsługuje swoją część botów (podział po ID) w jednym procesie Node.
// Co kilka sekund porównuje bazę ze stanem faktycznym i włącza / wyłącza / przeładowuje boty.

const WORKER_ID = Number(process.env.WORKER_ID ?? 0);
const WORKER_COUNT = Number(process.env.WORKER_COUNT ?? 1);
const RECONCILE_MS = 5_000;
const TIMERS_MS = 10_000;
const MAX_STARTS_PER_TICK = 5; // rozkładamy logowania w czasie zamiast odpalać setki naraz

type Entry = { rt: BotRuntime; updatedAt: string; busy: boolean };
const running = new Map<string, Entry>();
const backoff = new Map<string, { until: number; failures: number }>();
let shuttingDown = false;

const say = (msg: string) => console.log(`[worker ${WORKER_ID}] ${msg}`);

function owns(botId: string) {
  return createHash("md5").update(botId).digest().readUInt32BE(0) % WORKER_COUNT === WORKER_ID;
}

async function start(record: BotRecord) {
  const rt = new BotRuntime(record);
  const entry: Entry = { rt, updatedAt: record.updated_at, busy: true };
  running.set(record.id, entry);
  try {
    await rt.start();
    entry.busy = false;
    backoff.delete(record.id);
    say(`▲ ${record.name} (${record.id.slice(0, 8)})`);
  } catch (e) {
    running.delete(record.id);
    const message = describeError(e);
    if (e instanceof FatalBotError) {
      disableBot(record.id, message);
      log(record.id, "error", message);
      say(`✖ ${record.name}: ${message}`);
      return;
    }
    // błąd chwilowy: ponawiamy z rosnącym odstępem (30 s, 1 min, 2 min… maks. 10 min)
    const failures = (backoff.get(record.id)?.failures ?? 0) + 1;
    const delay = Math.min(30_000 * 2 ** (failures - 1), 600_000);
    backoff.set(record.id, { until: Date.now() + delay, failures });
    setRuntime(record.id, "error", `${message} – ponowna próba za ${Math.round(delay / 1000)} s`);
    log(record.id, "warn", `Nie udało się uruchomić: ${message}`);
  }
}

async function stop(id: string, reason: string) {
  const entry = running.get(id);
  if (!entry) return;
  running.delete(id);
  await entry.rt.stop();
  log(id, "info", reason);
  say(`▼ ${entry.rt.record.name} – ${reason}`);
}

// ---------- wspólny bot Bociak (darmowy pakiet) ----------
// Działa w workerze 0, jeśli w .env.local jest SHARED_BOT_TOKEN.

const SHARED_TOKEN = WORKER_ID === 0 ? process.env.SHARED_BOT_TOKEN?.trim() : undefined;
let shared: BotRuntime | null = null;
let sharedBusy = false;
let sharedRetryAt = 0;
let sharedFailures = 0;

function sharedRecord(): BotRecord {
  const row = db.prepare("SELECT updated_at FROM bots WHERE id = ?").get(SHARED_BOT_ID) as { updated_at: string };
  return {
    id: SHARED_BOT_ID,
    name: "Bociak",
    color: "#5865f2",
    activity: "",
    client_id: "",
    token_enc: null,
    modules: "{}", // konfiguracja jest per serwer (tabela servers)
    hosting: null,
    hosting_until: null,
    status: "online",
    updated_at: row.updated_at,
    runtime_status: "starting",
    owner_plan: "enterprise",
    owner_plan_until: null,
  };
}

async function reconcileShared() {
  if (!SHARED_TOKEN || sharedBusy) return;
  if (shared) {
    await shared.reloadServers(listServers());
    return;
  }
  if (Date.now() < sharedRetryAt) return;
  sharedBusy = true;
  const rt = new BotRuntime(sharedRecord(), { sharedToken: SHARED_TOKEN });
  try {
    await rt.reloadServers(listServers());
    await rt.start();
    shared = rt;
    sharedFailures = 0;
    say(`▲ wspólny bot Bociak (${rt.client?.guilds.cache.size ?? 0} serwerów)`);
  } catch (e) {
    sharedFailures++;
    const delay = Math.min(30_000 * 2 ** (sharedFailures - 1), 600_000);
    sharedRetryAt = Date.now() + delay;
    setRuntime(SHARED_BOT_ID, "error", describeError(e));
    console.error(`[worker ${WORKER_ID}] ✖ wspólny bot Bociak: ${describeError(e)} – ponowna próba za ${Math.round(delay / 1000)} s`);
  } finally {
    sharedBusy = false;
  }
}

async function reconcile() {
  if (shuttingDown) return;
  await reconcileShared();
  const records = listBots().filter((b) => owns(b.id));
  const seen = new Set<string>();
  let starts = 0;

  for (const record of records) {
    seen.add(record.id);
    const want = shouldRun(record);
    const entry = running.get(record.id);

    if (want && !entry) {
      if ((backoff.get(record.id)?.until ?? 0) > Date.now() || starts >= MAX_STARTS_PER_TICK) continue;
      starts++;
      void start(record);
    } else if (!want && entry && !entry.busy) {
      const reason = record.status !== "online" ? "Bot zatrzymany z panelu." : "Okres opłacony minął – bot zatrzymany. Przedłuż go w panelu.";
      await stop(record.id, reason);
    } else if (want && entry && !entry.busy && entry.updatedAt !== record.updated_at) {
      entry.updatedAt = record.updated_at;
      entry.busy = true;
      try {
        const restart = await entry.rt.update(record);
        if (restart) {
          await stop(record.id, "Restart po zmianie tokenu lub uprawnień.");
          void start(record);
        }
      } finally {
        entry.busy = false;
      }
    } else if (!want && !entry && record.runtime_status !== "stopped" && record.runtime_status !== "error") {
      setRuntime(record.id, "stopped");
    }
  }

  // bot usunięty z panelu
  for (const id of running.keys()) if (!seen.has(id)) await stop(id, "Bot usunięty.");
}

async function fireTimers() {
  if (shuttingDown) return;
  const ready = [...running.entries()].filter(([, e]) => !e.busy && e.rt.client?.isReady()).map(([id]) => id);
  if (shared?.client?.isReady()) ready.push(SHARED_BOT_ID);
  for (const t of timers.due(ready)) {
    timers.delete(t.id);
    const rt = t.bot_id === SHARED_BOT_ID ? shared : running.get(t.bot_id)?.rt;
    if (!rt) continue;
    rt.runTimer(t.kind, JSON.parse(t.payload), t.id).catch((e) => rt.log("error", `Timer ${t.kind}: ${describeError(e)}`));
  }
}

function loop(fn: () => Promise<void>, ms: number) {
  const tick = () =>
    fn()
      .catch((e) => console.error(`[worker ${WORKER_ID}]`, e))
      .finally(() => !shuttingDown && setTimeout(tick, ms));
  void tick();
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  say(`zamykanie, zatrzymuję ${running.size} botów…`);
  await Promise.allSettled([...running.keys()].map((id) => stop(id, "Restart serwera botów.")));
  await shared?.stop();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("disconnect", shutdown); // supervisor padł – nie zostawiamy osieroconych botów
process.on("unhandledRejection", (e) => console.error(`[worker ${WORKER_ID}] unhandledRejection`, e));

setInterval(() => {
  const mb = Math.round(process.memoryUsage().rss / 1024 / 1024);
  say(`boty: ${running.size} · RAM procesu: ${mb} MB${running.size ? ` (~${Math.round(mb / running.size)} MB/bot)` : ""}`);
}, 60_000).unref();

say(`start (${WORKER_ID + 1}/${WORKER_COUNT})${SHARED_TOKEN ? " · obsługuję wspólnego bota Bociak" : ""}`);
loop(reconcile, RECONCILE_MS);
loop(fireTimers, TIMERS_MS);
