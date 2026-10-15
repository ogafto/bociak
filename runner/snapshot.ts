import { ChannelType, type Guild, type GuildBasedChannel } from "discord.js";
import type { GuildSnapshot, SnapshotChannel } from "../src/lib/guild.ts";
import { deleteSnapshot, saveSnapshot } from "./store.ts";

// Zapisuje kanały i role serwera do bazy, żeby panel mógł je pokazać w listach wyboru.

const KINDS: Partial<Record<ChannelType, SnapshotChannel["kind"]>> = {
  [ChannelType.GuildText]: "text",
  [ChannelType.GuildVoice]: "voice",
  [ChannelType.GuildCategory]: "category",
  [ChannelType.GuildAnnouncement]: "announcement",
  [ChannelType.GuildForum]: "forum",
  [ChannelType.GuildStageVoice]: "stage",
};

export function buildSnapshot(guild: Guild): GuildSnapshot {
  const me = guild.members.me;
  const channels: SnapshotChannel[] = [];
  for (const c of guild.channels.cache.values() as Iterable<GuildBasedChannel>) {
    const kind = KINDS[c.type];
    if (!kind || c.isThread()) continue;
    channels.push({ id: c.id, name: c.name, kind, parentId: c.parentId, position: "rawPosition" in c ? c.rawPosition : 0 });
  }
  return {
    guildId: guild.id,
    name: guild.name,
    icon: guild.iconURL({ size: 128 }),
    channels,
    roles: guild.roles.cache
      .filter((r) => r.id !== guild.id) // bez @everyone
      .map((r) => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position, managed: r.managed })),
    botRolePosition: me?.roles.highest.position ?? 0,
    botPermissions: (me?.permissions.bitfield ?? 0n).toString(),
    updatedAt: Date.now(),
  };
}

/** Odkłada zapis o kilka sekund – przy hurtowych zmianach (np. kreator serwera) zapisujemy raz. */
export class Snapshotter {
  private pending = new Map<string, NodeJS.Timeout>();
  private readonly botId: string;

  constructor(botId: string) {
    this.botId = botId;
  }

  schedule(guild: Guild, delay = 3000) {
    clearTimeout(this.pending.get(guild.id));
    this.pending.set(
      guild.id,
      setTimeout(() => {
        this.pending.delete(guild.id);
        try {
          saveSnapshot(this.botId, buildSnapshot(guild));
        } catch (e) {
          console.error(`[snapshot] ${guild.id}:`, e);
        }
      }, delay).unref(),
    );
  }

  forget(guildId: string) {
    clearTimeout(this.pending.get(guildId));
    this.pending.delete(guildId);
    deleteSnapshot(this.botId, guildId);
  }

  clear() {
    for (const t of this.pending.values()) clearTimeout(t);
    this.pending.clear();
  }
}
