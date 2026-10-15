import { GatewayIntentBits, MessageFlags, PermissionFlagsBits } from "discord.js";
import { state, timers } from "../store.ts";
import type { Command, ModuleImpl } from "../types.ts";
import { guildCommand, parsePairs, slug } from "./util.ts";

const MESSAGES = [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent];

// Nazwy zajęte przez wbudowane moduły – własna komenda ich nie nadpisze.
const RESERVED = new Set(["pomoc", "ban", "kick", "wycisz", "odcisz", "wyczysc", "rank", "ranking", "ticket-panel", "propozycja", "ankieta", "kosci", "moneta", "8ball", "kpn", "afk", "konkurs", "przypomnij", "embed"]);

export const commands: ModuleImpl = {
  id: "commands",
  commands: (cfg): Command[] =>
    parsePairs(cfg.list)
      .map(([name, reply]) => ({ name: slug(name), reply }))
      .filter((c) => c.name && !RESERVED.has(c.name))
      .map(({ name, reply }) => ({
        data: guildCommand(name, reply.slice(0, 100)).toJSON(),
        run: (i) => i.reply({ content: reply.slice(0, 2000), allowedMentions: { parse: [] } }),
      })),
};

const responderCooldown = new Map<string, number>();

export const autoresponder: ModuleImpl = {
  id: "autoresponder",
  intents: MESSAGES,
  priority: 60,
  onMessage: async (m, rt, cfg) => {
    const text = m.content.toLowerCase();
    const hit = parsePairs(cfg.list).find(([phrase]) => text.includes(phrase.toLowerCase()));
    if (!hit) return;
    const key = `${rt.id}:${m.channelId}:${hit[0]}`;
    if (Date.now() - (responderCooldown.get(key) ?? 0) < 10_000) return;
    responderCooldown.set(key, Date.now());
    await m.reply({ content: hit[1].slice(0, 2000), allowedMentions: { repliedUser: false, parse: [] } });
  },
};

export const embeds: ModuleImpl = {
  id: "embeds",
  commands: (_cfg, rt) => [
    {
      data: guildCommand("embed", "Wysyła ładne ogłoszenie na ten kanał", PermissionFlagsBits.ManageMessages)
        .addStringOption((o) => o.setName("tytul").setDescription("Tytuł").setRequired(true).setMaxLength(256))
        .addStringOption((o) => o.setName("tresc").setDescription("Treść (\\n = nowa linia)").setRequired(true).setMaxLength(4000))
        .addStringOption((o) => o.setName("kolor").setDescription("Kolor w HEX, np. #5865F2"))
        .addStringOption((o) => o.setName("obrazek").setDescription("Link do obrazka"))
        .toJSON(),
      run: async (i) => {
        if (!i.channel?.isSendable()) return;
        const embed = rt
          .embed()
          .setTitle(i.options.getString("tytul", true))
          .setDescription(i.options.getString("tresc", true).replaceAll("\\n", "\n"));
        const color = i.options.getString("kolor")?.replace("#", "");
        if (color && /^[0-9a-f]{6}$/i.test(color)) embed.setColor(parseInt(color, 16));
        const image = i.options.getString("obrazek");
        if (image?.startsWith("https://")) embed.setImage(image);
        await i.channel.send({ embeds: [embed] });
        await i.reply({ content: "✅ Wysłano.", flags: MessageFlags.Ephemeral });
      },
    },
  ],
};

export const reminders: ModuleImpl = {
  id: "reminders",
  commands: (_cfg, rt) => [
    {
      data: guildCommand("przypomnij", "Bot przypomni Ci o czymś za jakiś czas")
        .addIntegerOption((o) => o.setName("minuty").setDescription("Za ile minut").setMinValue(1).setMaxValue(43200).setRequired(true))
        .addStringOption((o) => o.setName("tresc").setDescription("O czym przypomnieć").setRequired(true).setMaxLength(500))
        .toJSON(),
      run: async (i) => {
        const minutes = i.options.getInteger("minuty", true);
        const due = Date.now() + minutes * 60_000;
        timers.add(rt.id, "reminder", due, { channelId: i.channelId, userId: i.user.id, text: i.options.getString("tresc", true) });
        await i.reply({ content: `⏰ Przypomnę <t:${Math.floor(due / 1000)}:R>.`, flags: MessageFlags.Ephemeral });
      },
    },
  ],
  onTimer: async (kind, payload, _id, rt) => {
    if (kind !== "reminder") return;
    const p = payload as { channelId: string; userId: string; text: string };
    await rt.send(p.channelId, { content: `⏰ <@${p.userId}> przypomnienie: ${p.text}`, allowedMentions: { users: [p.userId] } });
  },
};

const stickyTimers = new Map<string, NodeJS.Timeout>();

export const sticky: ModuleImpl = {
  id: "sticky",
  intents: [GatewayIntentBits.GuildMessages],
  priority: 90,
  onMessage: async (m, rt, cfg) => {
    const channelId = cfg.channel?.trim();
    if (!channelId || m.channelId !== channelId || !cfg.text?.trim()) return;
    // odczekujemy chwilę, żeby przy szybkiej rozmowie nie przeklejać wiadomości co sekundę
    const key = `${rt.id}:${channelId}`;
    clearTimeout(stickyTimers.get(key));
    stickyTimers.set(
      key,
      setTimeout(async () => {
        stickyTimers.delete(key);
        const previous = state.get(rt.id, m.guildId, `sticky:${channelId}`);
        if (previous) await m.channel.messages.delete(previous).catch(() => {});
        const msg = await m.channel.send({ embeds: [rt.embed().setDescription(cfg.text.slice(0, 4000)).setFooter({ text: "📌 Przyklejona wiadomość" })] }).catch(() => null);
        if (msg) state.set(rt.id, m.guildId, `sticky:${channelId}`, msg.id);
      }, 4000).unref(),
    );
  },
};
