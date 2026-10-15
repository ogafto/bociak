// Obraz serwera Discord (kanały i role), który silnik botów zapisuje w bazie,
// a panel pokazuje w listach wyboru. Bez importów – używa tego i Next, i runner.

export type SnapshotChannel = {
  id: string;
  name: string;
  kind: "text" | "voice" | "category" | "announcement" | "forum" | "stage";
  parentId: string | null;
  position: number;
};

export type SnapshotRole = {
  id: string;
  name: string;
  color: string; // #rrggbb, "#000000" = bez koloru
  position: number;
  managed: boolean; // rola integracji/bota – nie da się jej nadać
};

export type GuildSnapshot = {
  guildId: string;
  name: string;
  icon: string | null;
  channels: SnapshotChannel[];
  roles: SnapshotRole[]; // bez @everyone
  botRolePosition: number; // najwyższa rola bota – role wyżej są poza jego zasięgiem
  botPermissions: string; // bitfield jako string (BigInt)
  memberCount?: number; // liczba osób na serwerze (starsze zapisy jej nie mają)
  updatedAt: number;
};

/** Kanały pogrupowane po kategoriach, w kolejności jak w Discordzie. */
export function groupChannels(channels: SnapshotChannel[], kinds: SnapshotChannel["kind"][]) {
  const categories = channels.filter((c) => c.kind === "category").sort((a, b) => a.position - b.position);
  const pick = (parentId: string | null) =>
    channels.filter((c) => kinds.includes(c.kind) && c.parentId === parentId).sort((a, b) => a.position - b.position);
  const groups: { category: SnapshotChannel | null; channels: SnapshotChannel[] }[] = [];
  const loose = pick(null);
  if (loose.length) groups.push({ category: null, channels: loose });
  for (const cat of categories) {
    const inside = pick(cat.id);
    if (inside.length) groups.push({ category: cat, channels: inside });
  }
  return groups;
}

const ADMINISTRATOR = 1n << 3n;

export function hasPermission(snapshot: GuildSnapshot, flag: bigint) {
  try {
    const bits = BigInt(snapshot.botPermissions);
    return (bits & ADMINISTRATOR) === ADMINISTRATOR || (bits & flag) === flag;
  } catch {
    return false;
  }
}

export const PERMISSIONS = {
  ManageRoles: 1n << 28n,
  ManageChannels: 1n << 4n,
  KickMembers: 1n << 1n,
  BanMembers: 1n << 2n,
  ManageMessages: 1n << 13n,
  ModerateMembers: 1n << 40n,
} as const;
