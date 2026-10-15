import { InteractionContextType, SlashCommandBuilder, type SendableChannels } from "discord.js";

/** Komenda /slash dostępna tylko na serwerach, opcjonalnie tylko dla osób z danym uprawnieniem. */
export function guildCommand(name: string, description: string, permission?: bigint) {
  const b = new SlashCommandBuilder().setName(name).setDescription(description).setContexts(InteractionContextType.Guild);
  if (permission !== undefined) b.setDefaultMemberPermissions(permission);
  return b;
}

/** Krótka informacja na kanale, która znika po kilku sekundach. */
export async function flash(channel: SendableChannels, content: string, ms = 6000) {
  const msg = await channel.send({ content, allowedMentions: { parse: ["users"] } }).catch(() => null);
  if (msg) setTimeout(() => msg.delete().catch(() => {}), ms).unref();
}

/** Linie „klucz = wartość” z pola tekstowego w panelu. */
export function parsePairs(text: string | undefined, max = 50) {
  return (text ?? "")
    .split("\n")
    .map((l) => l.split("="))
    .filter((p) => p.length >= 2)
    .map(([k, ...v]) => [k.trim(), v.join("=").trim()] as const)
    .filter(([k, v]) => k && v)
    .slice(0, max);
}

/** Nazwa komendy /slash z dowolnego tekstu: małe litery, bez polskich znaków. */
export function slug(text: string) {
  return text
    .toLowerCase()
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
}

export const random = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
