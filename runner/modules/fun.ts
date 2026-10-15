import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, MessageFlags, PermissionFlagsBits } from "discord.js";
import { state, timers } from "../store.ts";
import type { ModuleImpl } from "../types.ts";
import type { BotRuntime } from "../bot.ts";
import { renderMessage } from "../render.ts";
import { flash, guildCommand, random } from "./util.ts";

const MESSAGES = [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent];

const ANSWERS = [
  "Zdecydowanie tak.", "Bez wątpienia.", "Raczej tak.", "Wszystko na to wskazuje.", "Tak.",
  "Zapytaj później.", "Lepiej nie mówić.", "Nie da się przewidzieć.",
  "Nie licz na to.", "Moje źródła mówią nie.", "Bardzo wątpliwe.", "Nie.",
];

export const minigames: ModuleImpl = {
  id: "minigames",
  commands: (_cfg, rt) => [
    {
      data: guildCommand("kosci", "Rzut kością")
        .addIntegerOption((o) => o.setName("scianki").setDescription("Ile ścianek (domyślnie 6)").setMinValue(2).setMaxValue(1000))
        .toJSON(),
      run: (i) => {
        const sides = i.options.getInteger("scianki") ?? 6;
        return i.reply(`🎲 ${i.user} rzuca k${sides}… wypada **${1 + Math.floor(Math.random() * sides)}**!`);
      },
    },
    {
      data: guildCommand("moneta", "Rzut monetą").toJSON(),
      run: (i) => i.reply(`🪙 ${random(["Orzeł", "Reszka"])}!`),
    },
    {
      data: guildCommand("8ball", "Magiczna kula odpowiada na pytanie")
        .addStringOption((o) => o.setName("pytanie").setDescription("O co pytasz?").setRequired(true).setMaxLength(200))
        .toJSON(),
      run: (i) => i.reply({ embeds: [rt.embed().setTitle(`🎱 ${i.options.getString("pytanie", true)}`).setDescription(random(ANSWERS))] }),
    },
    {
      data: guildCommand("kpn", "Kamień, papier, nożyce z botem")
        .addStringOption((o) =>
          o.setName("wybor").setDescription("Twój wybór").setRequired(true).addChoices(
            { name: "🪨 Kamień", value: "kamien" },
            { name: "📄 Papier", value: "papier" },
            { name: "✂️ Nożyce", value: "nozyce" },
          ),
        )
        .toJSON(),
      run: (i) => {
        const names = { kamien: "🪨 kamień", papier: "📄 papier", nozyce: "✂️ nożyce" } as const;
        const beats = { kamien: "nozyce", papier: "kamien", nozyce: "papier" } as const;
        const you = i.options.getString("wybor", true) as keyof typeof names;
        const bot = random(Object.keys(names)) as keyof typeof names;
        const result = you === bot ? "Remis! 🤝" : beats[you] === bot ? "Wygrywasz! 🎉" : "Wygrywam ja! 😎";
        return i.reply(`Ty: ${names[you]} · Ja: ${names[bot]} → **${result}**`);
      },
    },
  ],
};

export const counting: ModuleImpl = {
  id: "counting",
  intents: MESSAGES,
  priority: 30,
  onMessage: async (m, rt, cfg) => {
    if (!cfg.channel?.trim() || m.channelId !== cfg.channel.trim()) return;
    if (!/^\d+$/.test(m.content.trim())) return;
    const n = Number(m.content.trim());
    const current = Number(state.get(rt.id, m.guildId, "count") ?? 0);
    const last = state.get(rt.id, m.guildId, "count:last");

    if (n === current + 1 && last !== m.author.id) {
      state.set(rt.id, m.guildId, "count", String(n));
      state.set(rt.id, m.guildId, "count:last", m.author.id);
      await m.react("✅").catch(() => {});
      return true;
    }
    state.set(rt.id, m.guildId, "count", "0");
    state.delete(rt.id, m.guildId, "count:last");
    await m.react("❌").catch(() => {});
    await m.channel.send(
      last === m.author.id
        ? `💥 ${m.author} nie można liczyć dwa razy z rzędu! Zaczynamy od **1**.`
        : `💥 ${m.author} zepsuł(a) na **${current}**! Następna liczba to **${current + 1}**… ale zaczynamy od **1**.`,
    );
    return true;
  },
};

const afkUsers = new Map<string, { reason: string; since: number }>();

export const afk: ModuleImpl = {
  id: "afk",
  intents: MESSAGES,
  priority: 40,
  commands: () => [
    {
      data: guildCommand("afk", "Ustawia status nieobecności")
        .addStringOption((o) => o.setName("powod").setDescription("Dlaczego Cię nie ma?").setMaxLength(100))
        .toJSON(),
      run: async (i, rt) => {
        const reason = i.options.getString("powod") ?? "AFK";
        afkUsers.set(`${rt.id}:${i.guildId}:${i.user.id}`, { reason, since: Date.now() });
        await i.reply(`💤 ${i.user} jest teraz AFK: ${reason}`);
      },
    },
  ],
  onMessage: async (m, rt) => {
    const own = `${rt.id}:${m.guildId}:${m.author.id}`;
    if (afkUsers.delete(own)) await flash(m.channel, `👋 Witaj z powrotem, ${m.author}! Zdjąłem status AFK.`);
    for (const user of m.mentions.users.values()) {
      const entry = afkUsers.get(`${rt.id}:${m.guildId}:${user.id}`);
      if (entry) await m.reply({ content: `💤 **${user.username}** jest AFK: ${entry.reason} (od <t:${Math.floor(entry.since / 1000)}:R>)`, allowedMentions: { repliedUser: false } });
    }
  },
};

// ---------- konkursy ----------

type Giveaway = {
  channelId: string;
  messageId?: string;
  prize: string;
  winners: number;
  entrants: string[];
  host: string;
  endsAt: number;
  design?: string; // szablon z chwili startu – zmiany w panelu nie psują trwającego konkursu
};

function giveawayMessage(rt: BotRuntime, g: Giveaway, timerId: number, ended?: { winners: string[] }) {
  return renderMessage(
    rt,
    g.design,
    "giveaway",
    {
      prize: g.prize,
      ends: ended ? "zakończony" : g.endsAt ? `<t:${Math.floor(g.endsAt / 1000)}:R>` : "wkrótce",
      winners: String(g.winners),
      host: `<@${g.host}>`,
      entries: String(g.entrants.length),
    },
    {
      actions: joinRow(timerId, g.entrants.length, !!ended),
      extraText: ended ? (ended.winners.length ? `🏆 Wygrali: ${ended.winners.map((w) => `<@${w}>`).join(", ")}` : "😢 Nikt nie wziął udziału") : undefined,
    },
  );
}

const joinRow = (timerId: number, count: number, disabled = false) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaways:join:${timerId}`)
      .setLabel(`Biorę udział · ${count}`)
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );

export const giveaways: ModuleImpl = {
  id: "giveaways",
  commands: (cfg, rt) => [
    {
      data: guildCommand("konkurs", "Startuje giveaway na tym kanale", PermissionFlagsBits.ManageGuild)
        .addStringOption((o) => o.setName("nagroda").setDescription("Co jest do wygrania?").setRequired(true).setMaxLength(200))
        .addIntegerOption((o) => o.setName("minuty").setDescription("Ile ma trwać (w minutach)").setMinValue(1).setMaxValue(43200).setRequired(true))
        .addIntegerOption((o) => o.setName("zwyciezcy").setDescription("Ilu zwycięzców (domyślnie 1)").setMinValue(1).setMaxValue(20))
        .toJSON(),
      run: async (i) => {
        if (!i.channel?.isSendable()) return;
        const minutes = i.options.getInteger("minuty", true);
        const endsAt = Date.now() + minutes * 60_000;
        const g: Giveaway = {
          channelId: i.channelId,
          prize: i.options.getString("nagroda", true),
          winners: i.options.getInteger("zwyciezcy") ?? 1,
          entrants: [],
          host: i.user.id,
          endsAt,
          design: cfg.design,
        };
        const id = timers.add(rt.id, "giveaway", endsAt, g);
        const msg = await i.channel.send(giveawayMessage(rt, g, id));
        timers.update(id, { ...g, messageId: msg.id });
        await i.reply({ content: "✅ Konkurs wystartował!", flags: MessageFlags.Ephemeral });
        rt.log("info", `Konkurs „${g.prize}” wystartował (${minutes} min).`);
      },
    },
  ],
  onButton: async (action, arg, i, rt) => {
    if (action !== "join") return;
    const timer = timers.get(Number(arg));
    if (!timer) return i.reply({ content: "Ten konkurs już się zakończył.", flags: MessageFlags.Ephemeral });
    const g = JSON.parse(timer.payload) as Giveaway;
    const joined = g.entrants.includes(i.user.id);
    g.entrants = joined ? g.entrants.filter((u) => u !== i.user.id) : [...g.entrants, i.user.id];
    timers.update(timer.id, g);
    await i.update({ components: giveawayMessage(rt, g, timer.id).components });
    await i.followUp({ content: joined ? "Wypisano Cię z konkursu." : "🎉 Bierzesz udział! Powodzenia.", flags: MessageFlags.Ephemeral });
  },
  onTimer: async (kind, payload, timerId, rt) => {
    if (kind !== "giveaway") return;
    const g = payload as unknown as Giveaway;
    const pool = [...g.entrants];
    const winners: string[] = [];
    while (winners.length < g.winners && pool.length) winners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);

    const channel = await rt.client?.channels.fetch(g.channelId).catch(() => null);
    if (!channel?.isSendable()) return;
    if (g.messageId && "messages" in channel) {
      const msg = await channel.messages.fetch(g.messageId).catch(() => null);
      await msg?.edit({ components: giveawayMessage(rt, g, timerId, { winners }).components, allowedMentions: { users: [] } }).catch(() => {});
    }
    await channel.send(winners.length ? `🎉 Gratulacje ${winners.map((w) => `<@${w}>`).join(", ")}! Wygrywacie **${g.prize}**!` : `Konkurs „${g.prize}” zakończony bez uczestników.`);
    rt.log("info", `Konkurs „${g.prize}” zakończony (${g.entrants.length} uczestników).`);
  },
};
