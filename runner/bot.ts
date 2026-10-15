import {
  ActivityType,
  Client,
  DiscordAPIError,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Options,
  Partials,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  type Guild,
  type Interaction,
  type MessageCreateOptions,
} from "discord.js";
import { createHash } from "node:crypto";
import { BRAND, MODULES as CATALOG } from "../src/lib/catalog.ts";
import { IMPLEMENTATIONS } from "./modules/index.ts";
import { guildCommand } from "./modules/util.ts";
import {
  activePlan,
  decryptToken,
  disableBot,
  filterByPlan,
  heartbeat,
  linkServer,
  log,
  setCommandsHash,
  setRuntime,
  type BotRecord,
  type ModuleSettings,
  type ServerRecord,
} from "./store.ts";
import type { Command, ModuleImpl, Settings } from "./types.ts";
import { Snapshotter } from "./snapshot.ts";

// Jeden bot w silniku. Dwa tryby:
// - własny bot klienta (Pro): jedna konfiguracja modułów na wszystkich serwerach, komendy globalne,
// - wspólny bot Bociak (Darmowy): osobna konfiguracja dla każdego połączonego serwera, komendy per serwer.

const READY_TIMEOUT = 60_000;
const MAX_INVALID_REQUESTS = 500; // ochrona wspólnego IP przed banem Cloudflare (limit Discorda: 10 000 / 10 min)

export class FatalBotError extends Error {}

type CommandEntry = { cmd: Command; mod: ModuleImpl | null };
type GuildConfig = { settings: ModuleSettings; key: string; hash: string | null };

export class BotRuntime {
  readonly id: string;
  readonly shared: boolean;
  record: BotRecord;
  settings: ModuleSettings = {};
  client: Client | null = null;
  private readonly sharedToken: string | null;
  private globalCommands = new Map<string, CommandEntry>();
  private guildCommands = new Map<string, Map<string, CommandEntry>>();
  private guilds = new Map<string, GuildConfig>();
  private commandsHash = "";
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private snapshots: Snapshotter;

  constructor(record: BotRecord, opts: { sharedToken?: string } = {}) {
    this.id = record.id;
    this.record = record;
    this.shared = !!opts.sharedToken;
    this.sharedToken = opts.sharedToken ?? null;
    if (!this.shared) this.settings = ownSettings(record);
    this.snapshots = new Snapshotter(record.id);
  }

  /** Wspólny bot zapisuje tylko serwery połączone z panelem; własny – wszystkie (z limitem). */
  private snapshot(guild: Guild, delay?: number) {
    if (this.shared && !this.guilds.has(guild.id)) return;
    this.snapshots.schedule(guild, delay);
  }

  get color() {
    return parseInt(this.record.color.replace("#", ""), 16) || 0x5865f2;
  }

  /** Konfiguracja modułów dla danego serwera. */
  settingsFor(guildId: string | null): ModuleSettings {
    if (!this.shared) return this.settings;
    return (guildId && this.guilds.get(guildId)?.settings) || {};
  }

  /** Moduły włączone na danym serwerze i zaimplementowane w silniku. */
  enabled(guildId: string | null): { mod: ModuleImpl; cfg: Settings }[] {
    const settings = this.settingsFor(guildId);
    return IMPLEMENTATIONS.filter((m) => settings[m.id]).map((mod) => ({ mod, cfg: settings[mod.id] ?? {} }));
  }

  /** Wspólny bot słucha wszystkiego, bo każdy serwer może mieć inne moduły. */
  private activeModules() {
    return this.shared ? IMPLEMENTATIONS : this.enabled(null).map(({ mod }) => mod);
  }

  intents() {
    const set = new Set<GatewayIntentBits>([GatewayIntentBits.Guilds]);
    for (const mod of this.activeModules()) for (const i of mod.intents ?? []) set.add(i);
    return [...set].sort((a, b) => a - b);
  }

  private needsMessageCache() {
    return this.activeModules().some((m) => m.messageCache);
  }

  log(level: "info" | "warn" | "error", message: string) {
    log(this.id, level, message);
  }

  embed() {
    const e = new EmbedBuilder().setColor(this.color);
    // darmowy pakiet: dyskretny podpis Bociaka (moduły z własną stopką go nadpisują)
    if (this.shared) e.setFooter({ text: `${BRAND.name} · ${BRAND.domain}` });
    return e;
  }

  /** Wysyła wiadomość na kanał po ID; zwraca null, jeśli kanał nie istnieje lub nie jest tekstowy. */
  async send(channelId: string | undefined, payload: string | MessageCreateOptions) {
    if (!channelId || !this.client) return null;
    try {
      const channel = await this.client.channels.fetch(channelId.trim());
      if (!channel || !channel.isSendable()) return null;
      return await channel.send(payload);
    } catch (e) {
      this.log("warn", `Nie mogę pisać na kanale ${channelId}: ${describeError(e)}`);
      return null;
    }
  }

  // ---------- cykl życia ----------

  async start() {
    let token = this.sharedToken;
    if (!token) {
      if (!this.record.token_enc) throw new FatalBotError("Brak tokenu bota.");
      try {
        token = decryptToken(this.record.token_enc);
      } catch {
        throw new FatalBotError("Nie mogę odszyfrować tokenu – wklej go ponownie w panelu.");
      }
    }

    setRuntime(this.id, "starting");
    const client = new Client({
      intents: this.intents(),
      partials: [Partials.GuildMember, Partials.Message, Partials.Channel],
      shards: this.shared ? "auto" : undefined, // wspólny bot rośnie – sharding od razu
      // Minimalny cache = mało RAM-u na bota. Trzymamy tylko to, czego moduły naprawdę potrzebują.
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        MessageManager: this.needsMessageCache() ? (this.shared ? 50 : 100) : 0,
        UserManager: { maxSize: 200, keepOverLimit: (u) => u.id === u.client.user.id },
        GuildMemberManager: { maxSize: 200, keepOverLimit: (m) => m.id === m.client.user.id },
        PresenceManager: 0,
        ReactionManager: 0,
        ReactionUserManager: 0,
        GuildEmojiManager: 0,
        BaseGuildEmojiManager: 0,
        GuildStickerManager: 0,
        GuildInviteManager: 0,
        GuildScheduledEventManager: 0,
        StageInstanceManager: 0,
        VoiceStateManager: 0,
        AutoModerationRuleManager: 0,
        ApplicationCommandManager: 0,
        GuildBanManager: 0,
        ThreadMemberManager: 0,
      }),
      sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: { interval: 300, lifetime: 1800 },
        users: { interval: 3600, filter: () => (u) => u.id !== u.client.user.id },
      },
      rest: { invalidRequestWarningInterval: 100 },
      presence: this.presence(),
    });
    this.client = client;
    this.attachEvents(client);

    client.rest.on("invalidRequestWarning", ({ count }) => {
      if (count < MAX_INVALID_REQUESTS) return;
      this.log("error", `Zatrzymano bota: ${count} błędnych zapytań w 10 min (ochrona serwera).`);
      if (!this.shared) disableBot(this.id, "Bot wysyłał zbyt wiele błędnych zapytań do Discorda i został zatrzymany. Sprawdź uprawnienia bota.");
      void this.stop();
    });

    const ready = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Discord nie odpowiedział w 60 s")), READY_TIMEOUT);
      client.once(Events.ClientReady, () => {
        clearTimeout(timer);
        resolve();
      });
    });

    try {
      await client.login(token);
      await ready;
    } catch (e) {
      await this.destroyClient();
      throw translateLoginError(e);
    }

    await this.syncGlobalCommands();
    for (const guildId of this.guilds.keys()) await this.syncGuild(guildId);
    [...client.guilds.cache.values()].slice(0, 200).forEach((g, n) => this.snapshot(g, 500 + n * 50));
    setRuntime(this.id, "online");
    this.beat();
    this.heartbeatTimer = setInterval(() => this.beat(), 30_000);
    this.log("info", `Bot ${client.user?.tag} online na ${client.guilds.cache.size} serwerach.`);
  }

  async stop() {
    await this.destroyClient();
    setRuntime(this.id, "stopped");
  }

  private async destroyClient() {
    this.snapshots.clear();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    const c = this.client;
    this.client = null;
    if (c) await c.destroy().catch(() => {});
  }

  /**
   * Nowa konfiguracja własnego bota z panelu. Zwraca true, jeśli trzeba pełnego restartu
   * (inny token albo inne intencje – tych nie da się zmienić w trakcie połączenia).
   */
  async update(record: BotRecord): Promise<boolean> {
    const oldIntents = this.intents().join(",");
    const oldMessages = this.needsMessageCache();
    const tokenChanged = record.token_enc !== this.record.token_enc;
    this.record = record;
    this.settings = ownSettings(record);
    if (tokenChanged || oldIntents !== this.intents().join(",") || oldMessages !== this.needsMessageCache()) return true;

    this.client?.user?.setPresence(this.presence());
    await this.syncGlobalCommands();
    this.log("info", "Konfiguracja przeładowana bez restartu.");
    return false;
  }

  /** Wspólny bot: nowa lista połączonych serwerów i ich konfiguracji z panelu. */
  async reloadServers(rows: ServerRecord[]) {
    const seen = new Set<string>();
    for (const row of rows) {
      seen.add(row.guild_id);
      const settings = filterByPlan(parseSettings(row.modules), activePlan(row.owner_plan, row.owner_plan_until));
      const key = JSON.stringify(settings);
      const current = this.guilds.get(row.guild_id);
      if (current?.key === key) continue;
      this.guilds.set(row.guild_id, { settings, key, hash: current?.hash ?? row.commands_hash });
      await this.syncGuild(row.guild_id);
      const guild = this.client?.guilds.cache.get(row.guild_id);
      if (!current && guild) this.snapshot(guild, 0); // świeżo połączony serwer – panel od razu dostaje kanały i role
    }
    for (const guildId of [...this.guilds.keys()]) {
      if (seen.has(guildId)) continue;
      this.guilds.delete(guildId);
      this.guildCommands.delete(guildId);
      this.snapshots.forget(guildId);
      await this.client?.guilds.cache.get(guildId)?.commands.set([]).catch(() => {});
    }
  }

  private presence() {
    const name = this.shared ? `/pomoc · ${BRAND.domain}` : this.record.activity.trim();
    return { status: "online" as const, activities: name ? [{ name, type: ActivityType.Playing }] : [] };
  }

  private beat() {
    const c = this.client;
    if (!c?.user) return;
    heartbeat(this.id, { tag: c.user.tag, guilds: c.guilds.cache.size, ping: Math.max(0, Math.round(c.ws.ping)) });
  }

  // ---------- komendy ----------

  private moduleCommands(guildId: string | null) {
    const map = new Map<string, CommandEntry>();
    for (const { mod, cfg } of this.enabled(guildId)) {
      for (const cmd of mod.commands?.(cfg, this) ?? []) if (!map.has(cmd.data.name)) map.set(cmd.data.name, { cmd, mod });
    }
    return map;
  }

  /** Komendy z modułów rejestrujemy globalnie (własny bot) albo per serwer (wspólny bot). */
  private async syncGlobalCommands() {
    const c = this.client;
    if (!c?.application) return;
    const map = this.shared ? new Map<string, CommandEntry>() : this.moduleCommands(null);
    map.set("pomoc", { cmd: this.helpCommand(), mod: null });
    if (this.shared) map.set("polacz", { cmd: this.linkCommand(), mod: null });
    this.globalCommands = map;

    const body = [...map.values()].map(({ cmd }) => cmd.data);
    const hash = hashOf(body);
    if (hash === this.commandsHash) return;
    try {
      await c.application.commands.set(body);
      this.commandsHash = hash;
      this.log("info", `Zarejestrowano ${body.length} komend /slash.`);
    } catch (e) {
      this.log("error", `Nie udało się zarejestrować komend: ${describeError(e)}`);
    }
  }

  private async syncGuild(guildId: string) {
    const config = this.guilds.get(guildId);
    const guild = this.client?.guilds.cache.get(guildId);
    if (!config || !guild) return; // bota jeszcze nie ma na serwerze – zsynchronizujemy przy GuildCreate
    const map = this.moduleCommands(guildId);
    this.guildCommands.set(guildId, map);
    const body = [...map.values()].map(({ cmd }) => cmd.data);
    const hash = hashOf(body);
    if (hash === config.hash) return;
    try {
      await guild.commands.set(body);
      config.hash = hash;
      setCommandsHash(guildId, hash);
    } catch (e) {
      this.log("warn", `Komendy na serwerze ${guild.name}: ${describeError(e)}`);
    }
  }

  private helpCommand(): Command {
    return {
      data: guildCommand("pomoc", "Lista komend bota").toJSON(),
      run: async (i) => {
        if (this.shared && !this.guilds.has(i.guildId)) {
          return i.reply({
            embeds: [
              this.embed()
                .setTitle(`👋 Cześć, tu ${BRAND.name}!`)
                .setDescription(
                  `Ten serwer nie jest jeszcze połączony z panelem.\n\n1. Załóż darmowe konto na **${BRAND.domain}**\n2. W panelu wejdź w **Serwery → Dodaj serwer** i skopiuj kod\n3. Wpisz tutaj \`/polacz kod\``,
                ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
        const commands = [...this.globalCommands.values(), ...(this.guildCommands.get(i.guildId)?.values() ?? [])];
        const lines = commands.map(({ cmd }) => `**/${cmd.data.name}** – ${cmd.data.description}`);
        const mods = this.enabled(i.guildId)
          .map(({ mod }) => CATALOG.find((c) => c.id === mod.id)?.name)
          .filter(Boolean)
          .join(", ");
        await i.reply({
          embeds: [
            this.embed()
              .setTitle(`📖 Komendy ${this.client?.user?.username ?? this.record.name}`)
              .setDescription(lines.join("\n").slice(0, 4000) || "Brak komend.")
              .addFields({ name: "Aktywne moduły", value: mods || "brak – włącz je w panelu" }),
          ],
          flags: MessageFlags.Ephemeral,
        });
      },
    };
  }

  private linkCommand(): Command {
    return {
      data: guildCommand("polacz", "Łączy ten serwer z Twoim kontem w panelu", PermissionFlagsBits.ManageGuild)
        .addStringOption((o) => o.setName("kod").setDescription("Kod z panelu (Serwery → Dodaj serwer)").setRequired(true).setMinLength(6).setMaxLength(6))
        .toJSON(),
      run: async (i) => {
        const result = linkServer(i.options.getString("kod", true), { id: i.guildId, name: i.guild.name, icon: i.guild.iconURL() });
        if (!result.ok) return i.reply({ content: `❌ ${result.error}`, flags: MessageFlags.Ephemeral });
        this.log("info", `Połączono serwer „${i.guild.name}”.`);
        await i.reply({
          embeds: [
            this.embed()
              .setTitle("✅ Serwer połączony!")
              .setDescription(`Wróć do panelu na **${BRAND.domain}** i włącz moduły. Komendy pojawią się tu w ciągu kilku sekund.`),
          ],
          flags: MessageFlags.Ephemeral,
        });
      },
    };
  }

  // ---------- zdarzenia ----------

  private attachEvents(client: Client) {
    const guarded =
      <A extends unknown[]>(name: string, fn: (...args: A) => Promise<unknown>) =>
      (...args: A) => {
        fn(...args).catch((e) => this.log("error", `${name}: ${describeError(e)}`));
      };

    client.on(Events.InteractionCreate, guarded("interakcja", (i: Interaction) => this.onInteraction(i)));

    client.on(
      Events.MessageCreate,
      guarded("wiadomość", async (m) => {
        if (m.author.bot || !m.inGuild()) return;
        const mods = this.enabled(m.guildId)
          .filter(({ mod }) => mod.onMessage)
          .sort((a, b) => (a.mod.priority ?? 50) - (b.mod.priority ?? 50));
        for (const { mod, cfg } of mods) {
          if (await mod.onMessage!(m, this, cfg)) return;
        }
      }),
    );

    client.on(
      Events.GuildMemberAdd,
      guarded("nowa osoba", async (m) => {
        for (const { mod, cfg } of this.enabled(m.guild.id)) await mod.onMemberAdd?.(m, this, cfg);
      }),
    );
    client.on(
      Events.GuildMemberRemove,
      guarded("wyjście osoby", async (m) => {
        for (const { mod, cfg } of this.enabled(m.guild.id)) await mod.onMemberRemove?.(m, this, cfg);
      }),
    );
    client.on(
      Events.MessageDelete,
      guarded("usunięcie wiadomości", async (m) => {
        for (const { mod, cfg } of this.enabled(m.guildId)) await mod.onMessageDelete?.(m, this, cfg);
      }),
    );
    client.on(
      Events.MessageUpdate,
      guarded("edycja wiadomości", async (before, after) => {
        for (const { mod, cfg } of this.enabled(after.guildId)) await mod.onMessageUpdate?.(before, after, this, cfg);
      }),
    );

    client.on(Events.Error, (e) => this.log("error", `Błąd klienta: ${describeError(e)}`));
    client.on(Events.ShardDisconnect, () => this.log("warn", "Rozłączono z Discordem – łączę ponownie…"));
    client.on(
      Events.GuildCreate,
      guarded("nowy serwer", async (g) => {
        this.log("info", `Dodano bota na serwer „${g.name}”.`);
        if (!this.shared) return void this.snapshot(g, 0);
        // bot mógł zostać wyrzucony i dodany ponownie – wtedy Discord kasuje komendy serwera
        const config = this.guilds.get(g.id);
        if (config) config.hash = null;
        await this.syncGuild(g.id);
        this.snapshot(g, 0);
      }),
    );
    client.on(Events.GuildDelete, (g) => {
      this.log("info", `Usunięto bota z serwera „${g.name ?? g.id}”.`);
      this.snapshots.forget(g.id);
    });

    // zmiany struktury serwera → odświeżamy listy kanałów i ról w panelu
    const refresh = (guild: Guild | null) => guild && this.snapshot(guild);
    client.on(Events.ChannelCreate, (c) => refresh(c.guild));
    client.on(Events.ChannelDelete, (c) => refresh("guild" in c ? c.guild : null));
    client.on(Events.ChannelUpdate, (_old, c) => refresh("guild" in c ? c.guild : null));
    client.on(Events.GuildRoleCreate, (r) => refresh(r.guild));
    client.on(Events.GuildRoleDelete, (r) => refresh(r.guild));
    client.on(Events.GuildRoleUpdate, (_old, r) => refresh(r.guild));
    client.on(Events.GuildUpdate, (_old, g) => refresh(g));
  }

  private async onInteraction(i: Interaction) {
    if (!i.inCachedGuild()) {
      if (i.isRepliable()) await i.reply({ content: "Ten bot działa tylko na serwerach.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (i.isChatInputCommand()) {
      const entry = this.guildCommands.get(i.guildId)?.get(i.commandName) ?? this.globalCommands.get(i.commandName);
      if (!entry) return void i.reply({ content: "Ta komenda jest wyłączona.", flags: MessageFlags.Ephemeral });
      const cfg = entry.mod ? (this.settingsFor(i.guildId)[entry.mod.id] ?? {}) : {};
      try {
        await entry.cmd.run(i, this, cfg);
      } catch (e) {
        await replyError(i, e);
        this.log("warn", `/${i.commandName}: ${describeError(e)}`);
      }
      return;
    }

    if (i.isButton()) {
      const [modId, action = "", arg = ""] = i.customId.split(":");
      const found = this.enabled(i.guildId).find(({ mod }) => mod.id === modId);
      if (!found?.mod.onButton) return void i.reply({ content: "Ta funkcja jest wyłączona.", flags: MessageFlags.Ephemeral });
      try {
        await found.mod.onButton(action, arg, i, this, found.cfg);
      } catch (e) {
        await replyError(i, e);
        this.log("warn", `Przycisk ${i.customId}: ${describeError(e)}`);
      }
    }
  }

  /** Timery (konkursy, przypomnienia) kończą się nawet, jeśli moduł w międzyczasie wyłączono. */
  async runTimer(kind: string, payload: Record<string, unknown>, timerId: number) {
    for (const mod of IMPLEMENTATIONS) if (mod.onTimer) await mod.onTimer(kind, payload, timerId, this);
  }
}

// ---------- pomocnicze ----------

function parseSettings(raw: string): ModuleSettings {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function ownSettings(record: BotRecord) {
  return filterByPlan(parseSettings(record.modules), activePlan(record.owner_plan, record.owner_plan_until));
}

const hashOf = (body: unknown) => createHash("sha1").update(JSON.stringify(body)).digest("hex");

export function describeError(e: unknown): string {
  if (e instanceof DiscordAPIError) {
    if (e.code === RESTJSONErrorCodes.MissingPermissions) return "brak uprawnień bota";
    if (e.code === RESTJSONErrorCodes.MissingAccess) return "bot nie ma dostępu do kanału";
    if (e.code === RESTJSONErrorCodes.UnknownChannel) return "kanał nie istnieje";
    if (e.code === RESTJSONErrorCodes.UnknownRole) return "rola nie istnieje";
    return `${e.message} (kod ${e.code})`;
  }
  return e instanceof Error ? e.message : String(e);
}

async function replyError(i: Interaction, e: unknown) {
  if (!i.isRepliable()) return;
  const msg =
    e instanceof DiscordAPIError && e.code === RESTJSONErrorCodes.MissingPermissions
      ? "❌ Bot nie ma uprawnień, żeby to zrobić. Sprawdź, czy jego rola jest wystarczająco wysoko."
      : `❌ Coś poszło nie tak: ${describeError(e)}`;
  const payload = { content: msg, flags: MessageFlags.Ephemeral } as const;
  await (i.replied || i.deferred ? i.followUp(payload) : i.reply(payload)).catch(() => {});
}

function translateLoginError(e: unknown): Error {
  const code = (e as { code?: string })?.code;
  if (code === "TokenInvalid") return new FatalBotError("Nieprawidłowy token bota – wygeneruj nowy w Developer Portal i wklej go w panelu.");
  if (code === "DisallowedIntents")
    return new FatalBotError(
      "Discord odrzucił uprawnienia. W Developer Portal → Bot włącz „Server Members Intent” i „Message Content Intent”.",
    );
  return e instanceof Error ? e : new Error(String(e));
}
