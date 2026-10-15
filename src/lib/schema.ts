import type { DatabaseSync } from "node:sqlite";

/** ID wspólnego bota „Bociak” (darmowy pakiet) w tabeli bots – trzyma jego dziennik i stan modułów. */
export const SHARED_BOT_ID = "shared";

// Wspólny schemat bazy dla strony (Next.js) i silnika botów (runner/).
// Bez importów z Next – runner ładuje ten plik bezpośrednio w Node.

export function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      plan          TEXT NOT NULL DEFAULT 'start',
      plan_until    TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bots (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      color         TEXT NOT NULL,
      prefix        TEXT NOT NULL DEFAULT '!',
      activity      TEXT NOT NULL DEFAULT '',
      client_id     TEXT NOT NULL DEFAULT '',
      token_enc     TEXT,
      modules       TEXT NOT NULL DEFAULT '{}',
      hosting       TEXT,
      hosting_until TEXT,
      status        TEXT NOT NULL DEFAULT 'offline',
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL,
      item       TEXT NOT NULL,
      bot_id     TEXT,
      amount     REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Dziennik zdarzeń bota widoczny w panelu (runner trzyma ostatnie ~200 wpisów na bota).
    CREATE TABLE IF NOT EXISTS bot_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id     TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
      level      TEXT NOT NULL,
      message    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Stan modułów: XP, liczenie itp. (klucz-wartość per bot i serwer).
    CREATE TABLE IF NOT EXISTS member_xp (
      bot_id   TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
      guild_id TEXT NOT NULL,
      user_id  TEXT NOT NULL,
      xp       INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (bot_id, guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS bot_state (
      bot_id   TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
      guild_id TEXT NOT NULL,
      key      TEXT NOT NULL,
      value    TEXT NOT NULL,
      PRIMARY KEY (bot_id, guild_id, key)
    );

    CREATE TABLE IF NOT EXISTS timers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id     TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL,            -- 'giveaway' | 'reminder'
      due_at     INTEGER NOT NULL,         -- ms od epoki
      payload    TEXT NOT NULL             -- JSON
    );

    -- Serwery Discord połączone z kontem przez wspólnego bota Bociak (darmowy pakiet).
    CREATE TABLE IF NOT EXISTS servers (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      guild_id      TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      icon          TEXT,
      modules       TEXT NOT NULL DEFAULT '{}',
      commands_hash TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Jednorazowe kody do komendy /polacz (ważne 15 minut).
    CREATE TABLE IF NOT EXISTS link_codes (
      code       TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    -- Kanały i role serwerów widziane przez bota (odświeżane przez runner) – do list wyboru w panelu.
    CREATE TABLE IF NOT EXISTS guild_snapshots (
      bot_id     TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
      guild_id   TEXT NOT NULL,
      data       TEXT NOT NULL,            -- JSON: GuildSnapshot (src/lib/guild.ts)
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (bot_id, guild_id)
    );

    CREATE INDEX IF NOT EXISTS bots_user ON bots(user_id);
    CREATE INDEX IF NOT EXISTS servers_user ON servers(user_id);
    CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS bot_logs_bot ON bot_logs(bot_id, id);
    CREATE INDEX IF NOT EXISTS timers_due ON timers(bot_id, due_at);
  `);

  // Kolumny dodane później – SQLite nie ma „ADD COLUMN IF NOT EXISTS”.
  const addColumn = (table: string, name: string, def: string) => {
    const columns = new Set((db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name));
    if (!columns.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
  };
  addColumn("bots", "runtime_status", "TEXT NOT NULL DEFAULT 'stopped'"); // stopped | starting | online | error
  addColumn("bots", "runtime_error", "TEXT");
  addColumn("bots", "runtime_info", "TEXT"); // JSON: { tag, guilds, ping }
  addColumn("bots", "heartbeat_at", "INTEGER"); // ms od epoki – ostatni znak życia z runnera
  // Bot Pro jest opłacany osobno: bots.hosting = okres ('month' | 'year' | 'trial'), bots.hosting_until = opłacony do (ISO).
  addColumn("bots", "showcase", "INTEGER NOT NULL DEFAULT 0"); // zgoda na pokazanie serwerów bota na stronie głównej
  addColumn("servers", "showcase", "INTEGER NOT NULL DEFAULT 0"); // zgoda na pokazanie serwera na stronie głównej
  addColumn("users", "trial_used", "INTEGER NOT NULL DEFAULT 0"); // okres próbny Bota Pro – raz na konto

  // Konto systemowe i wpis wspólnego bota – żeby dziennik i stan modułów miały do czego się odwołać.
  // Hasło „!” nie jest poprawnym hashem bcrypt, więc na to konto nie da się zalogować.
  db.exec(`
    INSERT OR IGNORE INTO users (id, email, name, password_hash, plan) VALUES ('system', 'system@bociak.local', 'Bociak', '!', 'enterprise');
    INSERT OR IGNORE INTO bots (id, user_id, name, color, status) VALUES ('${SHARED_BOT_ID}', 'system', 'Bociak', '#5865f2', 'offline');
  `);
}
