import { DatabaseSync } from "node:sqlite";
import { createDecipheriv, createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { FREE_LIMITS, MODULES, getPlan } from "../src/lib/catalog.ts";
import { SHARED_BOT_ID, migrate } from "../src/lib/schema.ts";
import type { GuildSnapshot } from "../src/lib/guild.ts";
import { toFreeTemplate } from "../src/lib/message.ts";

export { SHARED_BOT_ID };

// Dostęp do tej samej bazy SQLite, z której korzysta panel.

const DATA_DIR = path.join(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });
export const db = new DatabaseSync(path.join(DATA_DIR, "app.db"));
migrate(db);

export type BotRecord = {
  id: string;
  name: string;
  color: string;
  activity: string;
  client_id: string;
  token_enc: string | null;
  modules: string;
  hosting: string | null;
  hosting_until: string | null;
  status: "online" | "offline";
  updated_at: string;
  runtime_status: string;
  owner_plan: string;
  owner_plan_until: string | null;
};

export type ModuleSettings = Record<string, Record<string, string>>;

/** Własne boty klientów (Pro/Enterprise). Wspólny bot Bociak jest obsługiwany osobno. */
export function listBots(): BotRecord[] {
  return db
    .prepare(
      `SELECT b.id, b.name, b.color, b.activity, b.client_id, b.token_enc, b.modules, b.hosting, b.hosting_until, b.status,
              b.updated_at, b.runtime_status, u.plan AS owner_plan, u.plan_until AS owner_plan_until
       FROM bots b JOIN users u ON u.id = b.user_id WHERE b.id != ?`,
    )
    .all(SHARED_BOT_ID) as BotRecord[];
}

/** Aktywny pakiet konta: wygasły płatny pakiet traktujemy jak darmowy. */
export function activePlan(plan: string, until: string | null) {
  if (plan === "start") return getPlan("start");
  if (until && new Date(until).getTime() < Date.now()) return getPlan("start");
  return getPlan(plan);
}

/** Bot Pro jest opłacany osobno – działa do daty w hosting_until (opłata albo okres próbny). */
export function isPaid(bot: Pick<BotRecord, "hosting_until">) {
  return !!bot.hosting_until && new Date(bot.hosting_until).getTime() > Date.now();
}

/** Czy bot powinien teraz działać: włączony przez klienta, z tokenem i opłacony. */
export function shouldRun(bot: BotRecord) {
  return bot.status === "online" && !!bot.token_enc && isPaid(bot);
}

/**
 * Przycina konfigurację modułów do tego, na co pozwala pakiet – np. po powrocie z Pro na Darmowy
 * moduły PRO przestają działać, nawet jeśli zostały zapisane wcześniej.
 */
export function filterByPlan(settings: ModuleSettings, plan: ReturnType<typeof getPlan>): ModuleSettings {
  const out: ModuleSettings = {};
  for (const [id, cfg] of Object.entries(settings)) {
    const mod = MODULES.find((m) => m.id === id);
    if (!mod || mod.soon || (mod.premium && !plan.premiumModules)) continue;
    if (Object.keys(out).length >= plan.maxModules) break;
    // bez Pro: wiadomości tylko w gotowych stylach (kolor paska zostaje) i limity w modułach-listach
    const sanitized = { ...cfg };
    if (!plan.premiumModules) {
      for (const f of mod.fields ?? []) {
        if (f.type === "message" && f.message) sanitized[f.key] = JSON.stringify(toFreeTemplate(cfg[f.key], f.message));
      }
      const limit = FREE_LIMITS[id];
      if (limit && sanitized[limit.field]) {
        sanitized[limit.field] = sanitized[limit.field]
          .split("\n")
          .filter((l) => l.trim())
          .slice(0, limit.max)
          .join("\n");
      }
    }
    out[id] = sanitized;
  }
  return out;
}

// ---------- serwery wspólnego bota ----------

export type ServerRecord = {
  guild_id: string;
  modules: string;
  updated_at: string;
  commands_hash: string | null;
  owner_plan: string;
  owner_plan_until: string | null;
};

export function listServers(): ServerRecord[] {
  return db
    .prepare(
      `SELECT s.guild_id, s.modules, s.updated_at, s.commands_hash, u.plan AS owner_plan, u.plan_until AS owner_plan_until
       FROM servers s JOIN users u ON u.id = s.user_id`,
    )
    .all() as ServerRecord[];
}

export function setCommandsHash(guildId: string, hash: string) {
  db.prepare("UPDATE servers SET commands_hash = ? WHERE guild_id = ?").run(hash, guildId);
}

export type LinkResult = { ok: true; created: boolean } | { ok: false; error: string };

/** Komenda /polacz: zamienia jednorazowy kod z panelu na powiązanie serwera z kontem. */
export function linkServer(code: string, guild: { id: string; name: string; icon: string | null }): LinkResult {
  const row = db.prepare("SELECT user_id, expires_at FROM link_codes WHERE code = ?").get(code.trim().toUpperCase()) as
    | { user_id: string; expires_at: number }
    | undefined;
  if (!row || row.expires_at < Date.now()) return { ok: false, error: "Kod jest nieprawidłowy albo wygasł. Wygeneruj nowy w panelu." };

  // darmowy Bociak działa bez limitu serwerów
  const existing = db.prepare("SELECT user_id FROM servers WHERE guild_id = ?").get(guild.id) as { user_id: string } | undefined;

  db.prepare("DELETE FROM link_codes WHERE code = ?").run(code.trim().toUpperCase());
  if (existing) {
    // admin serwera może przepiąć go na swoje konto – konfiguracja modułów zostaje
    db.prepare("UPDATE servers SET user_id = ?, name = ?, icon = ?, updated_at = datetime('now') WHERE guild_id = ?").run(row.user_id, guild.name, guild.icon, guild.id);
    return { ok: true, created: false };
  }
  db.prepare("INSERT INTO servers (id, user_id, guild_id, name, icon, modules) VALUES (?, ?, ?, ?, ?, ?)").run(
    crypto.randomUUID(),
    row.user_id,
    guild.id,
    guild.name,
    guild.icon,
    JSON.stringify({ welcome: {}, moderation: {} }),
  );
  return { ok: true, created: true };
}

export function setRuntime(botId: string, status: "stopped" | "starting" | "online" | "error", error: string | null = null) {
  db.prepare("UPDATE bots SET runtime_status = ?, runtime_error = ?, heartbeat_at = ? WHERE id = ?").run(status, error, Date.now(), botId);
}

export function heartbeat(botId: string, info: { tag: string; guilds: number; ping: number }) {
  db.prepare("UPDATE bots SET runtime_info = ?, heartbeat_at = ? WHERE id = ?").run(JSON.stringify(info), Date.now(), botId);
}

/** Wyłącza bota po stronie klienta (np. zły token) – żeby runner nie próbował go w kółko odpalać. */
export function disableBot(botId: string, error: string) {
  db.prepare("UPDATE bots SET status = 'offline', runtime_status = 'error', runtime_error = ? WHERE id = ?").run(error, botId);
}

export function log(botId: string, level: "info" | "warn" | "error", message: string) {
  try {
    db.prepare("INSERT INTO bot_logs (bot_id, level, message) VALUES (?, ?, ?)").run(botId, level, message.slice(0, 500));
    // co jakiś czas przycinamy dziennik do ostatnich 200 wpisów
    if (Math.random() < 0.05) {
      db.prepare(
        "DELETE FROM bot_logs WHERE bot_id = ? AND id < (SELECT MIN(id) FROM (SELECT id FROM bot_logs WHERE bot_id = ? ORDER BY id DESC LIMIT 200))",
      ).run(botId, botId);
    }
  } catch {
    // bot mógł zostać usunięty w międzyczasie
  }
}

// ---------- obraz serwerów (kanały i role) ----------

export function saveSnapshot(botId: string, snapshot: GuildSnapshot) {
  db.prepare(
    `INSERT INTO guild_snapshots (bot_id, guild_id, data, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(bot_id, guild_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).run(botId, snapshot.guildId, JSON.stringify(snapshot), snapshot.updatedAt);
}

export function deleteSnapshot(botId: string, guildId: string) {
  db.prepare("DELETE FROM guild_snapshots WHERE bot_id = ? AND guild_id = ?").run(botId, guildId);
}

// ---------- stan modułów ----------

export const state = {
  get(botId: string, guildId: string, key: string): string | undefined {
    const row = db.prepare("SELECT value FROM bot_state WHERE bot_id = ? AND guild_id = ? AND key = ?").get(botId, guildId, key) as
      | { value: string }
      | undefined;
    return row?.value;
  },
  set(botId: string, guildId: string, key: string, value: string) {
    db.prepare(
      "INSERT INTO bot_state (bot_id, guild_id, key, value) VALUES (?, ?, ?, ?) ON CONFLICT(bot_id, guild_id, key) DO UPDATE SET value = excluded.value",
    ).run(botId, guildId, key, value);
  },
  delete(botId: string, guildId: string, key: string) {
    db.prepare("DELETE FROM bot_state WHERE bot_id = ? AND guild_id = ? AND key = ?").run(botId, guildId, key);
  },
};

export const xp = {
  add(botId: string, guildId: string, userId: string, amount: number): number {
    const row = db
      .prepare(
        `INSERT INTO member_xp (bot_id, guild_id, user_id, xp) VALUES (?, ?, ?, ?)
         ON CONFLICT(bot_id, guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp RETURNING xp`,
      )
      .get(botId, guildId, userId, amount) as { xp: number };
    return row.xp;
  },
  get(botId: string, guildId: string, userId: string) {
    const row = db.prepare("SELECT xp FROM member_xp WHERE bot_id = ? AND guild_id = ? AND user_id = ?").get(botId, guildId, userId) as
      | { xp: number }
      | undefined;
    const rank = db
      .prepare("SELECT COUNT(*) + 1 AS r FROM member_xp WHERE bot_id = ? AND guild_id = ? AND xp > ?")
      .get(botId, guildId, row?.xp ?? 0) as { r: number };
    return { xp: row?.xp ?? 0, rank: rank.r };
  },
  top(botId: string, guildId: string, limit = 10) {
    return db
      .prepare("SELECT user_id, xp FROM member_xp WHERE bot_id = ? AND guild_id = ? ORDER BY xp DESC LIMIT ?")
      .all(botId, guildId, limit) as { user_id: string; xp: number }[];
  },
};

export const timers = {
  add(botId: string, kind: string, dueAt: number, payload: unknown) {
    const r = db.prepare("INSERT INTO timers (bot_id, kind, due_at, payload) VALUES (?, ?, ?, ?)").run(botId, kind, dueAt, JSON.stringify(payload));
    return Number(r.lastInsertRowid);
  },
  due(botIds: string[], now = Date.now()) {
    if (botIds.length === 0) return [];
    const marks = botIds.map(() => "?").join(",");
    return db
      .prepare(`SELECT id, bot_id, kind, payload FROM timers WHERE due_at <= ? AND bot_id IN (${marks}) ORDER BY due_at LIMIT 100`)
      .all(now, ...botIds) as { id: number; bot_id: string; kind: string; payload: string }[];
  },
  get(id: number) {
    return db.prepare("SELECT id, bot_id, kind, payload FROM timers WHERE id = ?").get(id) as
      | { id: number; bot_id: string; kind: string; payload: string }
      | undefined;
  },
  update(id: number, payload: unknown) {
    db.prepare("UPDATE timers SET payload = ? WHERE id = ?").run(JSON.stringify(payload), id);
  },
  delete(id: number) {
    db.prepare("DELETE FROM timers WHERE id = ?").run(id);
  },
};

// ---------- tokeny ----------
// Ten sam algorytm co src/lib/secrets.ts (AES-256-GCM z kluczem z APP_SECRET).

export function decryptToken(payload: string) {
  const key = createHash("sha256").update(`bot-token:${process.env.APP_SECRET}`).digest();
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
