import "server-only";
import type { BotRow, ModuleConfig, ServerRow } from "./db";
import { maskToken } from "./secrets";

// Bezpieczny widok bota dla UI – bez tokenu w jawnej postaci.
export type BotView = ReturnType<typeof toBotView>;

/** Stan bota widziany przez klienta – łączy to, czego chce (status), z tym, co zgłasza runner. */
export type RuntimeState = "offline" | "starting" | "online" | "error" | "runner-down";

const HEARTBEAT_STALE_MS = 120_000;

// Uprawnienia, o które prosi link zapraszający: moderacja, kanały ticketów, role, wiadomości.
const INVITE_PERMISSIONS = [
  1n << 1n, // KickMembers
  1n << 2n, // BanMembers
  1n << 4n, // ManageChannels
  1n << 6n, // AddReactions
  1n << 10n, // ViewChannel
  1n << 11n, // SendMessages
  1n << 13n, // ManageMessages
  1n << 14n, // EmbedLinks
  1n << 15n, // AttachFiles
  1n << 16n, // ReadMessageHistory
  1n << 18n, // UseExternalEmojis
  1n << 28n, // ManageRoles
  1n << 40n, // ModerateMembers
].reduce((a, b) => a | b, 0n);

export function inviteUrl(clientId: string) {
  if (!/^\d{17,20}$/.test(clientId)) return null;
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot+applications.commands&permissions=${INVITE_PERMISSIONS}`;
}

/** Link zapraszający wspólnego bota Bociak (SHARED_BOT_CLIENT_ID w .env.local). */
export function sharedInviteUrl() {
  return inviteUrl(process.env.SHARED_BOT_CLIENT_ID?.trim() ?? "");
}

/** Bot Pro jest opłacany osobno – działa do daty w hosting_until (opłata albo okres próbny). */
export function botPayment(bot: Pick<BotRow, "hosting" | "hosting_until">) {
  const until = bot.hosting_until ? new Date(bot.hosting_until) : null;
  const paid = !!until && until.getTime() > Date.now();
  const daysLeft = paid && until ? Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86_400_000)) : 0;
  return { paid, until: bot.hosting_until, period: (bot.hosting ?? null) as "month" | "year" | "trial" | null, daysLeft, trial: paid && bot.hosting === "trial" };
}

export function toBotView(bot: BotRow) {
  let modules: ModuleConfig = {};
  try {
    modules = JSON.parse(bot.modules);
  } catch {}
  let info: { tag: string; guilds: number; ping: number } | null = null;
  try {
    info = bot.runtime_info ? JSON.parse(bot.runtime_info) : null;
  } catch {}

  const payment = botPayment(bot);
  const wanted = payment.paid && bot.status === "online";
  const fresh = !!bot.heartbeat_at && Date.now() - bot.heartbeat_at < HEARTBEAT_STALE_MS;
  const runtime: RuntimeState =
    bot.runtime_status === "error"
      ? "error"
      : !wanted
        ? "offline"
        : bot.runtime_status === "online"
          ? fresh
            ? "online"
            : "runner-down"
          : "starting";
  return {
    id: bot.id,
    name: bot.name,
    color: bot.color,
    prefix: bot.prefix,
    activity: bot.activity,
    clientId: bot.client_id,
    tokenMask: maskToken(bot.token_enc),
    modules,
    wanted,
    runtime,
    runtimeError: bot.runtime_error,
    info: runtime === "online" ? info : null,
    online: runtime === "online",
    payment,
    showcase: bot.showcase === 1,
    inviteUrl: inviteUrl(bot.client_id),
    createdAt: bot.created_at,
  };
}

export function formatDate(iso: string | null) {
  if (!iso) return "—";
  // SQLite zapisuje „YYYY-MM-DD HH:MM:SS” w UTC.
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

export type ServerView = ReturnType<typeof toServerView>;

export function toServerView(row: ServerRow) {
  let modules: ModuleConfig = {};
  try {
    modules = JSON.parse(row.modules);
  } catch {}
  return { id: row.id, guildId: row.guild_id, name: row.name, icon: row.icon, modules, showcase: row.showcase === 1, createdAt: row.created_at };
}
