import { fork, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { availableParallelism } from "node:os";

// Supervisor silnika botów Bociaka.
// Uruchamia kilka procesów-workerów; każdy hostuje swoją część botów. Jeśli worker padnie,
// padają tylko jego boty, a supervisor podnosi go ponownie.
//
//   npm run runner              – produkcja
//   RUNNER_WORKERS=4 npm run runner

for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);

if (!process.env.APP_SECRET || process.env.APP_SECRET.length < 32) {
  console.error("Brak APP_SECRET (min. 32 znaki) w .env.local – bez niego nie odszyfruję tokenów botów.");
  process.exit(1);
}

const { db } = await import("./store.ts");
// boty „online” z poprzedniego uruchomienia nie działają, dopóki workery ich nie podniosą
db.prepare("UPDATE bots SET runtime_status = 'stopped' WHERE runtime_status IN ('online', 'starting')").run();

const COUNT = Math.max(1, Number(process.env.RUNNER_WORKERS ?? Math.min(2, availableParallelism())));
const workers = new Map<number, ChildProcess>();
const restarts = new Map<number, number[]>();
let shuttingDown = false;

function spawn(id: number) {
  const child = fork(new URL("./worker.ts", import.meta.url), {
    env: { ...process.env, WORKER_ID: String(id), WORKER_COUNT: String(COUNT) },
  });
  workers.set(id, child);
  child.on("exit", (code, signal) => {
    workers.delete(id);
    if (shuttingDown) return;
    // ochrona przed pętlą restartów: maks. 5 w ciągu minuty, potem czekamy dłużej
    const now = Date.now();
    const recent = (restarts.get(id) ?? []).filter((t) => now - t < 60_000);
    recent.push(now);
    restarts.set(id, recent);
    const delay = recent.length > 5 ? 60_000 : 2_000;
    console.error(`[supervisor] worker ${id} zakończył się (${signal ?? code}) – restart za ${delay / 1000} s`);
    setTimeout(() => !shuttingDown && spawn(id), delay);
  });
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("[supervisor] zamykanie…");
  const exits = [...workers.values()].map((w) => new Promise((r) => w.once("exit", r)));
  for (const w of workers.values()) w.kill("SIGTERM");
  await Promise.race([Promise.all(exits), new Promise((r) => setTimeout(r, 15_000))]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`[supervisor] Bociak runner · ${COUNT} worker(y)`);
for (let i = 0; i < COUNT; i++) spawn(i);
