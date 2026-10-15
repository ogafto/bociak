import { GatewayIntentBits, MessageFlags, PermissionFlagsBits, type GuildMember } from "discord.js";
import type { ModuleImpl } from "../types.ts";
import { flash, guildCommand } from "./util.ts";

const MESSAGES = [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent];

export function isMod(member: GuildMember | null) {
  return !!member?.permissions.has(PermissionFlagsBits.ManageMessages);
}

export const moderation: ModuleImpl = {
  id: "moderation",
  commands: (_cfg, rt) => [
    {
      data: guildCommand("ban", "Banuje osobę z serwera", PermissionFlagsBits.BanMembers)
        .addUserOption((o) => o.setName("osoba").setDescription("Kogo zbanować").setRequired(true))
        .addStringOption((o) => o.setName("powod").setDescription("Powód"))
        .toJSON(),
      run: async (i) => {
        const user = i.options.getUser("osoba", true);
        const reason = i.options.getString("powod") ?? "Brak powodu";
        await i.guild.members.ban(user, { reason: `${reason} (przez ${i.user.username})` });
        await i.reply({ embeds: [rt.embed().setDescription(`🔨 **${user.username}** zbanowany. Powód: ${reason}`)] });
        rt.log("info", `Ban: ${user.username} (${reason}) – ${i.user.username}`);
      },
    },
    {
      data: guildCommand("kick", "Wyrzuca osobę z serwera", PermissionFlagsBits.KickMembers)
        .addUserOption((o) => o.setName("osoba").setDescription("Kogo wyrzucić").setRequired(true))
        .addStringOption((o) => o.setName("powod").setDescription("Powód"))
        .toJSON(),
      run: async (i) => {
        const member = await i.guild.members.fetch(i.options.getUser("osoba", true).id);
        const reason = i.options.getString("powod") ?? "Brak powodu";
        await member.kick(`${reason} (przez ${i.user.username})`);
        await i.reply({ embeds: [rt.embed().setDescription(`👢 **${member.user.username}** wyrzucony. Powód: ${reason}`)] });
        rt.log("info", `Kick: ${member.user.username} (${reason}) – ${i.user.username}`);
      },
    },
    {
      data: guildCommand("wycisz", "Wycisza osobę na określony czas", PermissionFlagsBits.ModerateMembers)
        .addUserOption((o) => o.setName("osoba").setDescription("Kogo wyciszyć").setRequired(true))
        .addIntegerOption((o) => o.setName("minuty").setDescription("Na ile minut").setMinValue(1).setMaxValue(40320).setRequired(true))
        .addStringOption((o) => o.setName("powod").setDescription("Powód"))
        .toJSON(),
      run: async (i) => {
        const member = await i.guild.members.fetch(i.options.getUser("osoba", true).id);
        const minutes = i.options.getInteger("minuty", true);
        const reason = i.options.getString("powod") ?? "Brak powodu";
        await member.timeout(minutes * 60_000, `${reason} (przez ${i.user.username})`);
        await i.reply({ embeds: [rt.embed().setDescription(`🔇 **${member.user.username}** wyciszony na ${minutes} min. Powód: ${reason}`)] });
      },
    },
    {
      data: guildCommand("odcisz", "Zdejmuje wyciszenie", PermissionFlagsBits.ModerateMembers)
        .addUserOption((o) => o.setName("osoba").setDescription("Kogo odciszyć").setRequired(true))
        .toJSON(),
      run: async (i) => {
        const member = await i.guild.members.fetch(i.options.getUser("osoba", true).id);
        await member.timeout(null);
        await i.reply({ embeds: [rt.embed().setDescription(`🔊 **${member.user.username}** może znowu pisać.`)] });
      },
    },
    {
      data: guildCommand("wyczysc", "Usuwa ostatnie wiadomości na kanale", PermissionFlagsBits.ManageMessages)
        .addIntegerOption((o) => o.setName("ile").setDescription("Ile wiadomości (1–100)").setMinValue(1).setMaxValue(100).setRequired(true))
        .toJSON(),
      run: async (i) => {
        if (!i.channel || !("bulkDelete" in i.channel)) return i.reply({ content: "Tu nie da się czyścić wiadomości.", flags: MessageFlags.Ephemeral });
        const deleted = await i.channel.bulkDelete(i.options.getInteger("ile", true), true);
        await i.reply({ content: `🧹 Usunięto ${deleted.size} wiadomości.`, flags: MessageFlags.Ephemeral });
      },
    },
  ],
};

const INVITE = /(discord\.gg|discord(?:app)?\.com\/invite)\/[\w-]+/i;

export const automod: ModuleImpl = {
  id: "automod",
  intents: MESSAGES,
  priority: 0,
  onMessage: async (m, rt, cfg) => {
    if (isMod(m.member)) return;
    const words = (cfg.words ?? "")
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    const text = m.content.toLowerCase();
    const letters = m.content.replace(/[^\p{L}]/gu, "");
    const caps = letters.length >= 12 && letters.replace(/[^\p{Lu}]/gu, "").length / letters.length > 0.7;

    let reason: string | null = null;
    if (INVITE.test(m.content)) reason = "zaproszenia na inne serwery są zabronione";
    else if (words.some((w) => text.includes(w))) reason = "ta wiadomość zawiera zakazane słowo";
    else if (caps) reason = "nie krzycz, wyłącz CAPS LOCK";
    if (!reason) return;

    await m.delete().catch(() => {});
    await flash(m.channel, `🛡️ ${m.author}, ${reason}.`);
    rt.log("info", `Automod: usunięto wiadomość od ${m.author.username} (${reason}).`);
    return true;
  },
};

const recent = new Map<string, number[]>();

export const antispam: ModuleImpl = {
  id: "antispam",
  intents: MESSAGES,
  priority: 1,
  onMessage: async (m, rt) => {
    if (isMod(m.member)) return;
    const key = `${rt.id}:${m.guildId}:${m.author.id}`;
    const now = Date.now();
    const times = (recent.get(key) ?? []).filter((t) => now - t < 5000);
    times.push(now);
    recent.set(key, times);
    if (times.length < 6) return;

    recent.delete(key);
    await m.delete().catch(() => {});
    if (m.member?.moderatable) await m.member.timeout(5 * 60_000, "Anti-spam: zalewanie czatu");
    await flash(m.channel, `🚫 ${m.author} wyciszony na 5 minut za spam.`);
    rt.log("info", `Anti-spam: wyciszono ${m.author.username}.`);
    return true;
  },
};

// sprzątanie mapy anty-spamu, żeby nie rosła w nieskończoność
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of recent) if (v.every((t) => now - t > 10_000)) recent.delete(k);
}, 60_000).unref();

export const logs: ModuleImpl = {
  id: "logs",
  intents: [...MESSAGES, GatewayIntentBits.GuildMembers],
  messageCache: true,
  onMemberAdd: (m, rt, cfg) =>
    rt.send(cfg.channel, { embeds: [rt.embed().setColor(0x57f287).setDescription(`📥 **${m.user.username}** dołączył(a) · konto z <t:${Math.floor(m.user.createdTimestamp / 1000)}:R>`)] }),
  onMemberRemove: (m, rt, cfg) =>
    rt.send(cfg.channel, { embeds: [rt.embed().setColor(0xed4245).setDescription(`📤 **${m.user?.username ?? m.id}** opuścił(a) serwer`)] }),
  onMessageDelete: async (m, rt, cfg) => {
    if (m.author?.bot || m.channelId === cfg.channel?.trim()) return;
    await rt.send(cfg.channel, {
      embeds: [
        rt
          .embed()
          .setColor(0xed4245)
          .setTitle("🗑️ Usunięto wiadomość")
          .setDescription(`${m.author ? `**${m.author.username}**` : "Nieznany autor"} w <#${m.channelId}>\n${m.content ? `> ${m.content.slice(0, 1500)}` : "_(treść niedostępna)_"}`),
      ],
    });
  },
  onMessageUpdate: async (before, after, rt, cfg) => {
    if (after.author.bot || !before.content || before.content === after.content) return;
    await rt.send(cfg.channel, {
      embeds: [
        rt
          .embed()
          .setTitle("✏️ Edytowano wiadomość")
          .setDescription(`**${after.author.username}** w <#${after.channelId}> · [przejdź](${after.url})`)
          .addFields({ name: "Przed", value: before.content.slice(0, 1000) }, { name: "Po", value: after.content.slice(0, 1000) || "—" }),
      ],
    });
  },
};
