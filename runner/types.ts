import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GatewayIntentBits,
  GuildMember,
  Message,
  OmitPartialGroupDMChannel,
  PartialGuildMember,
  PartialMessage,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import type { BotRuntime } from "./bot.ts";

export type Settings = Record<string, string>;

export type Command = {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  run: (i: ChatInputCommandInteraction<"cached">, rt: BotRuntime, cfg: Settings) => Promise<unknown>;
};

export type GuildMessage = OmitPartialGroupDMChannel<Message<true>>;

/** Implementacja modułu z katalogu (src/lib/catalog.ts) w silniku botów. */
export type ModuleImpl = {
  id: string;
  /** Intencje Gatewaya, których moduł potrzebuje (Guilds jest zawsze). */
  intents?: GatewayIntentBits[];
  /** Czy moduł potrzebuje cache'u wiadomości (np. logi usuniętych wiadomości). */
  messageCache?: boolean;
  /** Kolejność przy wiadomościach – niższa wcześniej (automod przed resztą). */
  priority?: number;
  commands?: (cfg: Settings, rt: BotRuntime) => Command[];
  /** Zwróć true, jeśli wiadomość została usunięta i inne moduły mają ją pominąć. */
  onMessage?: (m: GuildMessage, rt: BotRuntime, cfg: Settings) => Promise<boolean | void>;
  onButton?: (action: string, arg: string, i: ButtonInteraction<"cached">, rt: BotRuntime, cfg: Settings) => Promise<unknown>;
  onMemberAdd?: (m: GuildMember, rt: BotRuntime, cfg: Settings) => Promise<unknown>;
  onMemberRemove?: (m: GuildMember | PartialGuildMember, rt: BotRuntime, cfg: Settings) => Promise<unknown>;
  onMessageDelete?: (m: Message | PartialMessage, rt: BotRuntime, cfg: Settings) => Promise<unknown>;
  onMessageUpdate?: (before: Message | PartialMessage, after: Message, rt: BotRuntime, cfg: Settings) => Promise<unknown>;
  onTimer?: (kind: string, payload: Record<string, unknown>, timerId: number, rt: BotRuntime) => Promise<unknown>;
};
