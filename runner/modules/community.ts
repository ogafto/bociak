import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  type OverwriteResolvable,
} from "discord.js";
import { state, xp } from "../store.ts";
import type { ModuleImpl } from "../types.ts";
import { guildCommand } from "./util.ts";
import { legacyText, memberVars, renderMessage } from "../render.ts";

const MEMBERS = [GatewayIntentBits.GuildMembers];
const MESSAGES = [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent];

export const welcome: ModuleImpl = {
  id: "welcome",
  intents: MEMBERS,
  onMemberAdd: async (m, rt, cfg) => {
    await rt.send(cfg.channel, renderMessage(rt, cfg.design ?? legacyText(cfg.message), "welcome", memberVars(m.user, m.guild), { mentionUsers: [m.id] }));
  },
};

export const goodbye: ModuleImpl = {
  id: "goodbye",
  intents: MEMBERS,
  onMemberRemove: async (m, rt, cfg) => {
    const vars = m.user ? memberVars(m.user, m.guild) : { username: "Ktoś", server: m.guild.name, count: m.guild.memberCount.toLocaleString("pl-PL") };
    await rt.send(cfg.channel, renderMessage(rt, cfg.design ?? legacyText(cfg.message), "goodbye", vars));
  },
};

export const autorole: ModuleImpl = {
  id: "autorole",
  intents: MEMBERS,
  onMemberAdd: async (m, rt, cfg) => {
    if (!cfg.role?.trim()) return;
    await m.roles.add(cfg.role.trim(), "Autorole").catch((e) => rt.log("warn", `Autorole: nie mogę nadać roli (${e.message}).`));
  },
};

// ---------- tickety ----------

const ticketButtons = (action: "open" | "close") =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    action === "open"
      ? new ButtonBuilder().setCustomId("tickets:open").setLabel("Otwórz ticket").setEmoji("📩").setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId("tickets:close").setLabel("Zamknij ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger),
  );

export const tickets: ModuleImpl = {
  id: "tickets",
  commands: (cfg, rt) => [
    {
      data: guildCommand("ticket-panel", "Wysyła panel do otwierania ticketów na ten kanał", PermissionFlagsBits.ManageGuild).toJSON(),
      run: async (i) => {
        if (!i.channel?.isSendable()) return;
        await i.channel.send(
          renderMessage(rt, cfg.designPanel, "ticketPanel", { server: i.guild.name, server_icon: i.guild.iconURL({ size: 256 }) ?? "" }, { actions: ticketButtons("open") }),
        );
        await i.reply({ content: "✅ Panel ticketów wysłany.", flags: MessageFlags.Ephemeral });
      },
    },
  ],
  onButton: async (action, _arg, i, rt, cfg) => {
    if (action === "open") {
      const existing = state.get(rt.id, i.guildId, `ticket:${i.user.id}`);
      if (existing && i.guild.channels.cache.has(existing)) {
        return i.reply({ content: `Masz już otwarty ticket: <#${existing}>`, flags: MessageFlags.Ephemeral });
      }
      const overwrites: OverwriteResolvable[] = [
        { id: i.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
        { id: i.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
      ];
      if (cfg.role?.trim()) overwrites.push({ id: cfg.role.trim(), allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

      const channel = await i.guild.channels.create({
        name: `ticket-${i.user.username}`.slice(0, 90),
        type: ChannelType.GuildText,
        parent: cfg.category?.trim() || undefined,
        permissionOverwrites: overwrites,
        reason: `Ticket od ${i.user.username}`,
      });
      state.set(rt.id, i.guildId, `ticket:${i.user.id}`, channel.id);
      state.set(rt.id, i.guildId, `ticketch:${channel.id}`, i.user.id);
      const opened = renderMessage(rt, cfg.designOpened, "ticketOpened", memberVars(i.user, i.guild), { actions: ticketButtons("close"), mentionUsers: [i.user.id] });
      await channel.send(opened);
      // rola supportu dostaje osobne powiadomienie (w Components V2 nie ma pola „content”)
      if (cfg.role?.trim()) await channel.send({ content: `<@&${cfg.role.trim()}>`, allowedMentions: { roles: [cfg.role.trim()] } }).catch(() => {});
      rt.log("info", `Ticket otwarty przez ${i.user.username}.`);
      return i.reply({ content: `✅ Ticket utworzony: ${channel}`, flags: MessageFlags.Ephemeral });
    }

    if (action === "close") {
      const owner = state.get(rt.id, i.guildId, `ticketch:${i.channelId}`);
      const canClose = owner === i.user.id || i.member.permissions.has(PermissionFlagsBits.ManageChannels);
      if (!canClose) return i.reply({ content: "Tylko autor ticketu lub administracja może go zamknąć.", flags: MessageFlags.Ephemeral });
      await i.reply({ embeds: [rt.embed().setDescription(`🔒 Ticket zamknięty przez ${i.user}. Kanał zniknie za 5 sekund.`)] });
      if (owner) state.delete(rt.id, i.guildId, `ticket:${owner}`);
      state.delete(rt.id, i.guildId, `ticketch:${i.channelId}`);
      setTimeout(() => i.channel?.delete("Ticket zamknięty").catch(() => {}), 5000).unref();
    }
  },
};

// ---------- propozycje i ankiety ----------

export const suggestions: ModuleImpl = {
  id: "suggestions",
  commands: (cfg, rt) => [
    {
      data: guildCommand("propozycja", "Zgłoś pomysł na serwer")
        .addStringOption((o) => o.setName("tresc").setDescription("Twój pomysł").setRequired(true).setMaxLength(1500))
        .toJSON(),
      run: async (i) => {
        const embed = rt
          .embed()
          .setAuthor({ name: i.user.username, iconURL: i.user.displayAvatarURL() })
          .setTitle("💡 Nowa propozycja")
          .setDescription(i.options.getString("tresc", true))
          .setFooter({ text: "Zagłosuj reakcją 👍 / 👎" });
        const msg = cfg.channel?.trim() ? await rt.send(cfg.channel, { embeds: [embed] }) : i.channel?.isSendable() ? await i.channel.send({ embeds: [embed] }) : null;
        if (!msg) return i.reply({ content: "Nie mogę wysłać propozycji – sprawdź kanał w ustawieniach bota.", flags: MessageFlags.Ephemeral });
        await msg.react("👍");
        await msg.react("👎");
        await i.reply({ content: `✅ Dzięki! Propozycja wysłana: ${msg.url}`, flags: MessageFlags.Ephemeral });
      },
    },
  ],
};

const NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export const polls: ModuleImpl = {
  id: "polls",
  commands: (_cfg, rt) => [
    {
      data: guildCommand("ankieta", "Tworzy ankietę z głosowaniem reakcjami")
        .addStringOption((o) => o.setName("pytanie").setDescription("O co pytasz?").setRequired(true).setMaxLength(250))
        .addStringOption((o) => o.setName("opcje").setDescription("Odpowiedzi oddzielone średnikiem, np. pizza; burger; sushi"))
        .toJSON(),
      run: async (i) => {
        const options = (i.options.getString("opcje") ?? "")
          .split(";")
          .map((o) => o.trim())
          .filter(Boolean)
          .slice(0, 10);
        const embed = rt
          .embed()
          .setTitle(`📊 ${i.options.getString("pytanie", true)}`)
          .setDescription(options.length ? options.map((o, n) => `${NUMBERS[n]} ${o}`).join("\n") : "👍 Tak  ·  👎 Nie")
          .setFooter({ text: `Ankieta od ${i.user.username}` });
        const res = await i.reply({ embeds: [embed], withResponse: true });
        const msg = res.resource?.message;
        if (!msg) return;
        for (const emoji of options.length ? NUMBERS.slice(0, options.length) : ["👍", "👎"]) await msg.react(emoji);
      },
    },
  ],
};

// ---------- poziomy ----------

/** XP potrzebne na przejście z poziomu n na n+1 (krzywa jak w popularnych botach). */
const needed = (n: number) => 5 * n * n + 50 * n + 100;

export function levelFromXp(total: number) {
  let level = 0;
  let rest = total;
  while (rest >= needed(level)) rest -= needed(level++);
  return { level, current: rest, next: needed(level) };
}

const cooldown = new Map<string, number>();

export const levels: ModuleImpl = {
  id: "levels",
  intents: MESSAGES,
  priority: 20,
  onMessage: async (m, rt, cfg) => {
    const key = `${rt.id}:${m.guildId}:${m.author.id}`;
    const now = Date.now();
    if (now - (cooldown.get(key) ?? 0) < 60_000) return;
    cooldown.set(key, now);

    const gained = 15 + Math.floor(Math.random() * 11);
    const total = xp.add(rt.id, m.guildId, m.author.id, gained);
    const before = levelFromXp(total - gained).level;
    const after = levelFromXp(total).level;
    if (after <= before) return;

    const msg = renderMessage(rt, cfg.design, "levelup", { ...memberVars(m.author, m.guild), level: String(after) }, { mentionUsers: [m.author.id] });
    if (cfg.channel?.trim()) await rt.send(cfg.channel, msg);
    else await m.channel.send(msg).catch(() => {});
  },
  commands: (_cfg, rt) => [
    {
      data: guildCommand("rank", "Pokazuje poziom i XP")
        .addUserOption((o) => o.setName("osoba").setDescription("Czyj poziom pokazać"))
        .toJSON(),
      run: async (i) => {
        const user = i.options.getUser("osoba") ?? i.user;
        const { xp: total, rank } = xp.get(rt.id, i.guildId, user.id);
        const l = levelFromXp(total);
        const filled = Math.round((l.current / l.next) * 12);
        await i.reply({
          embeds: [
            rt
              .embed()
              .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
              .setTitle(`Poziom ${l.level} · #${rank} na serwerze`)
              .setDescription(`${"🟦".repeat(filled)}${"⬛".repeat(12 - filled)}\n**${l.current} / ${l.next} XP** do następnego poziomu`),
          ],
        });
      },
    },
    {
      data: guildCommand("ranking", "Top 10 najaktywniejszych osób").toJSON(),
      run: async (i) => {
        const top = xp.top(rt.id, i.guildId);
        const medals = ["🥇", "🥈", "🥉"];
        const lines = top.map((r, n) => `${medals[n] ?? `**${n + 1}.**`} <@${r.user_id}> – poziom ${levelFromXp(r.xp).level} (${r.xp} XP)`);
        await i.reply({
          embeds: [rt.embed().setTitle(`🏆 Ranking ${i.guild.name}`).setDescription(lines.join("\n") || "Jeszcze nikt nie zdobył XP.")],
          allowedMentions: { parse: [] },
        });
      },
    },
  ],
};

setInterval(() => {
  const now = Date.now();
  for (const [k, t] of cooldown) if (now - t > 120_000) cooldown.delete(k);
}, 120_000).unref();
