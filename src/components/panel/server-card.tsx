import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import type { ServerView } from "@/lib/bots";
import { getModule } from "@/lib/catalog";
import { ModuleIcon } from "@/components/ui/module-icon";

export function ServerIcon({ name, icon, className = "size-12 text-base" }: { name: string; icon: string | null; className?: string }) {
  if (icon) {
    // eslint-disable-next-line @next/next/no-img-element -- ikona z CDN Discorda, bez optymalizacji Next
    return <img src={icon} alt="" className={`shrink-0 rounded-[14px] object-cover ${className}`} />;
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`grid shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#eb459e,#5865f2)] font-semibold text-white ${className}`}>
      {initials}
    </span>
  );
}

/** Karta serwera: ikona, nazwa, liczba modułów i ich ikonki. Unosi się po najechaniu. */
export function ServerCard({ server }: { server: ServerView }) {
  const mods = Object.keys(server.modules)
    .map(getModule)
    .filter((m) => !!m);
  return (
    <Link
      href={`/panel/serwery/${server.id}`}
      data-spot
      className="group relative block overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#111113] p-5 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-white/[0.12]"
    >
      <div className="flex items-center gap-4">
        <ServerIcon name={server.name} icon={server.icon} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-medium text-white">{server.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-white/45">
            <span className="size-1.5 rounded-full bg-dc-green shadow-[0_0_8px] shadow-dc-green" />
            Bociak · {mods.length} {mods.length === 1 ? "moduł" : mods.length >= 2 && mods.length <= 4 ? "moduły" : "modułów"}
          </div>
        </div>
        <span className="grid size-8 place-items-center rounded-full border border-white/[0.08] text-white/40 transition-all duration-300 group-hover:rotate-45 group-hover:border-white/20 group-hover:text-white">
          <ArrowUpRight className="size-4 -rotate-45" />
        </span>
      </div>
      <div className="mt-5 flex items-center gap-1.5 border-t border-white/[0.05] pt-4">
        {mods.slice(0, 7).map((m, i) => (
          <span
            key={m.id}
            title={m.name}
            className="grid size-8 place-items-center rounded-[9px] border border-brand-400/20 bg-brand-500/10 text-brand-300 transition-transform duration-300 group-hover:-translate-y-0.5"
            style={{ transitionDelay: `${i * 30}ms` }}
          >
            <ModuleIcon name={m.icon} className="size-[15px]" />
          </span>
        ))}
        {mods.length > 7 && <span className="ml-1 text-[12px] text-white/40">+{mods.length - 7}</span>}
        {mods.length === 0 && <span className="text-[13px] text-white/40">Brak modułów – kliknij, aby włączyć</span>}
      </div>
    </Link>
  );
}

/** Kafelek „dodaj serwer” na końcu siatki. */
export function AddServerTile() {
  return (
    <Link
      href="/panel/serwery/dodaj"
      className="group flex min-h-[148px] flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-white/[0.12] p-5 text-center transition-colors hover:border-brand-400/50 hover:bg-brand-500/[0.04]"
    >
      <span className="grid size-11 place-items-center rounded-full border border-white/[0.1] bg-white/[0.03] text-white/60 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-400/50 group-hover:text-brand-300">
        <Plus className="size-5" />
      </span>
      <span className="text-[14px] text-white/60 group-hover:text-white">Dodaj serwer</span>
    </Link>
  );
}
