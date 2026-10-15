import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { migrate, SHARED_BOT_ID } from "./schema";
import type { GuildSnapshot } from "./guild";

// Wbudowany w Node.js SQLite – zero zewnętrznych zależności.
// Plik bazy: data/app.db. Przy przejściu na Postgresa wystarczy podmienić ten moduł.

const DATA_DIR = path.join(process.cwd(), "data");

function open() {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "app.db"));
  migrate(db);
  return db;
}

const globalForDb = globalThis as unknown as { __db?: DatabaseSync };
export const db = globalForDb.__db ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

// ---------- typy ----------

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  plan: string;
  plan_until: string | null;
  trial_used: number;
  created_at: string;
};

export type BotRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  prefix: string;
  activity: string;
  client_id: string;
  token_enc: string | null;
  modules: string;
  /** Okres opłaconego Bota Pro: 'month' | 'year' | 'trial'. */
  hosting: string | null;
  /** Bot Pro opłacony do (ISO) – po tej dacie runner go nie uruchamia. */
  hosting_until: string | null;
  showcase: number;
  status: "online" | "offline";
  created_at: string;
  updated_at: string;
  runtime_status: "stopped" | "starting" | "online" | "error";
  runtime_error: string | null;
  runtime_info: string | null;
  heartbeat_at: number | null;
};

export type BotLogRow = { id: number; level: "info" | "warn" | "error"; message: string; created_at: string };

export type OrderRow = {
  id: string;
  user_id: string;
  kind: "plan" | "hosting" | "bot";
  item: string;
  bot_id: string | null;
  amount: number;
  created_at: string;
};

export type ModuleConfig = Record<string, Record<string, string>>;

// ---------- użytkownicy ----------

export function findUserByEmail(email: string) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
}

export function findUserById(id: string) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function createUser(data: { email: string; name: string; passwordHash: string }) {
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)").run(
    id,
    data.email,
    data.name,
    data.passwordHash,
  );
  return id;
}

export function updateUserName(id: string, name: string) {
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, id);
}

export function updateUserPassword(id: string, passwordHash: string) {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, id);
}

export function setUserPlan(id: string, plan: string, until: string | null) {
  db.prepare("UPDATE users SET plan = ?, plan_until = ? WHERE id = ?").run(plan, until, id);
}

// ---------- boty ----------

export function listBots(userId: string) {
  // wspólny bot należy do konta systemowego, więc nigdy nie trafi na listę klienta
  return db.prepare("SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC").all(userId) as BotRow[];
}

export function countBots(userId: string) {
  const row = db.prepare("SELECT COUNT(*) AS n FROM bots WHERE user_id = ?").get(userId) as { n: number };
  return row.n;
}

export function getBot(userId: string, botId: string) {
  return db.prepare("SELECT * FROM bots WHERE id = ? AND user_id = ?").get(botId, userId) as BotRow | undefined;
}

export function createBot(
  userId: string,
  data: Pick<BotRow, "name" | "color" | "prefix" | "activity" | "client_id" | "token_enc" | "modules">,
) {
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO bots (id, user_id, name, color, prefix, activity, client_id, token_enc, modules)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, data.name, data.color, data.prefix, data.activity, data.client_id, data.token_enc, data.modules);
  return id;
}

export function updateBot(
  userId: string,
  botId: string,
  data: Partial<Pick<BotRow, "name" | "color" | "prefix" | "activity" | "client_id" | "token_enc" | "modules" | "status" | "hosting" | "hosting_until">>,
) {
  const keys = Object.keys(data) as (keyof typeof data)[];
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => data[k] ?? null);
  db.prepare(`UPDATE bots SET ${sets}, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(
    ...values,
    botId,
    userId,
  );
}

/** Klient kliknął „Uruchom” – runner podchwyci to przy najbliższym przebiegu. */
export function requestStart(userId: string, botId: string) {
  db.prepare(
    "UPDATE bots SET status = 'online', runtime_status = 'starting', runtime_error = NULL, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
  ).run(botId, userId);
}

/** Bot Pro opłacony (albo w okresie próbnym) do podanej daty. */
export function setBotPaid(userId: string, botId: string, period: "month" | "year" | "trial", until: string) {
  db.prepare("UPDATE bots SET hosting = ?, hosting_until = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?").run(period, until, botId, userId);
}

export function setBotShowcase(userId: string, botId: string, on: boolean) {
  db.prepare("UPDATE bots SET showcase = ? WHERE id = ? AND user_id = ?").run(on ? 1 : 0, botId, userId);
}

/** Okres próbny Bota Pro przysługuje raz na konto. */
export function markTrialUsed(userId: string) {
  db.prepare("UPDATE users SET trial_used = 1 WHERE id = ?").run(userId);
}

export function deleteBot(userId: string, botId: string) {
  db.prepare("DELETE FROM bots WHERE id = ? AND user_id = ?").run(botId, userId);
}

export function listBotLogs(userId: string, botId: string, limit = 40) {
  return db
    .prepare(
      `SELECT l.id, l.level, l.message, l.created_at FROM bot_logs l
       JOIN bots b ON b.id = l.bot_id
       WHERE l.bot_id = ? AND b.user_id = ? ORDER BY l.id DESC LIMIT ?`,
    )
    .all(botId, userId, limit) as BotLogRow[];
}

// ---------- serwery ze wspólnym botem Bociak ----------

export type ServerRow = {
  id: string;
  user_id: string;
  guild_id: string;
  name: string;
  icon: string | null;
  modules: string;
  showcase: number;
  created_at: string;
  updated_at: string;
};

export function listServers(userId: string) {
  return db.prepare("SELECT * FROM servers WHERE user_id = ? ORDER BY created_at DESC").all(userId) as ServerRow[];
}

/** Serwery połączone w ostatnich minutach – panel pokazuje je jako sukces po komendzie /polacz. */
export function recentServers(userId: string, minutes = 15) {
  return db
    .prepare("SELECT * FROM servers WHERE user_id = ? AND created_at >= datetime('now', ?) ORDER BY created_at DESC")
    .all(userId, `-${minutes} minutes`) as ServerRow[];
}

export function countServers(userId: string) {
  return (db.prepare("SELECT COUNT(*) AS n FROM servers WHERE user_id = ?").get(userId) as { n: number }).n;
}

export function getServer(userId: string, id: string) {
  return db.prepare("SELECT * FROM servers WHERE id = ? AND user_id = ?").get(id, userId) as ServerRow | undefined;
}

export function updateServerModules(userId: string, id: string, modules: string) {
  db.prepare("UPDATE servers SET modules = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?").run(modules, id, userId);
}

export function setServerShowcase(userId: string, id: string, on: boolean) {
  db.prepare("UPDATE servers SET showcase = ? WHERE id = ? AND user_id = ?").run(on ? 1 : 0, id, userId);
}

export function deleteServer(userId: string, id: string) {
  db.prepare("DELETE FROM servers WHERE id = ? AND user_id = ?").run(id, userId);
}

/** Nowy kod do /polacz – stare kody tego konta przestają działać. */
export function createLinkCode(userId: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bez 0/O i 1/I, żeby nie było pomyłek
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const code = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  db.prepare("DELETE FROM link_codes WHERE user_id = ? OR expires_at < ?").run(userId, Date.now());
  db.prepare("INSERT INTO link_codes (code, user_id, expires_at) VALUES (?, ?, ?)").run(code, userId, Date.now() + 15 * 60_000);
  return code;
}

// ---------- obraz serwerów (kanały i role) ----------

function parseSnapshot(row: { data: string } | undefined) {
  if (!row) return null;
  try {
    return JSON.parse(row.data) as GuildSnapshot;
  } catch {
    return null;
  }
}

/** Kanały i role serwera połączonego ze wspólnym botem Bociak. */
export function getSharedSnapshot(guildId: string) {
  return parseSnapshot(db.prepare("SELECT data FROM guild_snapshots WHERE bot_id = ? AND guild_id = ?").get(SHARED_BOT_ID, guildId) as { data: string } | undefined);
}

/** Wszystkie serwery, na których jest własny bot klienta. */
export function listBotSnapshots(userId: string, botId: string) {
  const rows = db
    .prepare(
      `SELECT s.data FROM guild_snapshots s JOIN bots b ON b.id = s.bot_id
       WHERE s.bot_id = ? AND b.user_id = ? ORDER BY s.updated_at DESC LIMIT 50`,
    )
    .all(botId, userId) as { data: string }[];
  return rows.map(parseSnapshot).filter((s): s is GuildSnapshot => !!s);
}

// ---------- serwery na stronie głównej ----------

export type ShowcaseServer = { guildId: string; name: string; icon: string | null; members: number };

/**
 * Serwery do slidera na stronie głównej – tylko te, których właściciel się zgodził
 * (servers.showcase dla Bociaka, bots.showcase dla opłaconych botów Pro).
 * Do tego sumy wszystkich serwerów i osób (bez nazw, więc bez zgody).
 */
export function getShowcase(): { servers: ShowcaseServer[]; totalServers: number; totalMembers: number } {
  const now = new Date().toISOString();
  const rows = db
    .prepare(
      `SELECT g.guild_id, g.data,
              CASE WHEN g.bot_id = ? THEN COALESCE(s.showcase, 0) ELSE COALESCE(b.showcase, 0) END AS showcase
       FROM guild_snapshots g
       LEFT JOIN servers s ON g.bot_id = ? AND s.guild_id = g.guild_id
       LEFT JOIN bots b ON b.id = g.bot_id AND g.bot_id != ?
       WHERE (g.bot_id = ? AND s.id IS NOT NULL) OR (g.bot_id != ? AND b.hosting_until > ?)`,
    )
    .all(SHARED_BOT_ID, SHARED_BOT_ID, SHARED_BOT_ID, SHARED_BOT_ID, SHARED_BOT_ID, now) as { guild_id: string; data: string; showcase: number }[];

  const seen = new Map<string, ShowcaseServer & { showcase: boolean }>();
  for (const r of rows) {
    const snap = parseSnapshot(r);
    if (!snap) continue;
    const prev = seen.get(r.guild_id);
    seen.set(r.guild_id, {
      guildId: r.guild_id,
      name: snap.name,
      icon: snap.icon,
      members: Math.max(prev?.members ?? 0, snap.memberCount ?? 0),
      showcase: !!prev?.showcase || r.showcase === 1,
    });
  }
  const all = [...seen.values()];
  return {
    servers: all
      .filter((s) => s.showcase)
      .sort((a, b) => b.members - a.members)
      .slice(0, 40)
      .map((s) => ({ guildId: s.guildId, name: s.name, icon: s.icon, members: s.members })),
    totalServers: all.length,
    totalMembers: all.reduce((n, s) => n + s.members, 0),
  };
}

// ---------- zamówienia ----------

export function createOrder(data: Omit<OrderRow, "id" | "created_at">) {
  db.prepare("INSERT INTO orders (id, user_id, kind, item, bot_id, amount) VALUES (?, ?, ?, ?, ?, ?)").run(
    crypto.randomUUID(),
    data.user_id,
    data.kind,
    data.item,
    data.bot_id,
    data.amount,
  );
}

export function listOrders(userId: string) {
  return db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(userId) as OrderRow[];
}
