import type { ModuleImpl } from "../types.ts";
import { automod, antispam, logs, moderation } from "./moderation.ts";
import { autorole, goodbye, levels, polls, suggestions, tickets, welcome } from "./community.ts";
import { afk, counting, giveaways, minigames } from "./fun.ts";
import { autoresponder, commands, embeds, reminders, sticky } from "./tools.ts";

// Moduły, które silnik naprawdę obsługuje. Pozostałe z katalogu mają flagę `soon` („Wkrótce”).
export const IMPLEMENTATIONS: ModuleImpl[] = [
  moderation,
  automod,
  antispam,
  logs,
  welcome,
  goodbye,
  autorole,
  tickets,
  suggestions,
  polls,
  levels,
  minigames,
  counting,
  afk,
  giveaways,
  commands,
  autoresponder,
  embeds,
  reminders,
  sticky,
];
