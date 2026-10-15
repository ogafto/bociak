import Link from "next/link";
import { ArrowUpRight, Server } from "lucide-react";
import type { BotView, RuntimeState } from "@/lib/bots";
import { getModule } from "@/lib/catalog";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { ModuleIcon } from "@/components/ui/module-icon";

const STATES: Record<RuntimeState, { label: string; cls: string; dot: string }> = {
  online: { label: "Online", cls: "border-dc-green/25 bg-dc-green/10 text-dc-green", dot: "bg-dc-green shadow-[0_0_8px] shadow-dc-green" },
  starting: { label: "Uruchamianie…", cls: "border-amber-400/25 bg-amber-400/10 text-amber-300", dot: "bg-amber-400 animate-pulse" },
  error: { label: "Błąd", cls: "border-rose-500/25 bg-rose-500/10 text-rose-300", dot: "bg-rose-400" },
  "runner-down": { label: "Brak połączenia", cls: "border-amber-400/25 bg-amber-400/10 text-amber-300", dot: "bg-amber-400" },
  offline: { label: "Offline", cls: "border-white/[0.08] bg-white/[0.03] text-white/50", dot: "bg-white/30" },
};

export function StatusBadge({ state }: { state: RuntimeState }) {
  const s = STATES[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function BotCard({ bot }: { bot: BotView }) {
  const mods = Object.keys(bot.modules)
    .map(getModule)
    .filter((m) => !!m);

  return (
    <Link
      href={`/panel/boty/${bot.id}`}
      data-spot
      className="group relative block overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#111113] p-5 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-white/[0.12]"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70" style={{ background: bot.color }} />
      <div className="relative flex items-start gap-4">
        <div className="relative">
          <BotAvatar name={bot.name} color={bot.color} className="size-12 text-base" />
          <span className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-[3px] border-[#111113] ${bot.online ? "bg-dc-green" : "bg-white/25"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-medium text-white">{bot.name}</div>
          <div className="truncate text-[13px] text-white/45">{bot.activity || `prefix ${bot.prefix}`}</div>
        </div>
        <span className="grid size-8 place-items-center rounded-full border border-white/[0.08] text-white/40 transition-all duration-300 group-hover:rotate-45 group-hover:border-white/20 group-hover:text-white">
          <ArrowUpRight className="size-4 -rotate-45" />
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-1.5">
        {mods.slice(0, 6).map((m) => (
          <span key={m.id} title={m.name} className="grid size-8 place-items-center rounded-[9px] border border-white/[0.07] bg-white/[0.03] text-white/65">
            <ModuleIcon name={m.icon} className="size-[15px]" />
          </span>
        ))}
        {mods.length > 6 && <span className="text-xs text-white/40">+{mods.length - 6}</span>}
        {mods.length === 0 && <span className="text-[13px] text-white/40">Brak modułów</span>}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
        <StatusBadge state={bot.runtime} />
        <span className={`flex items-center gap-1.5 text-[12px] ${bot.payment.paid ? "text-white/45" : "text-amber-300"}`}>
          <Server className="size-3.5" />
          {bot.payment.paid ? (bot.payment.trial ? `Próba · ${bot.payment.daysLeft} dni` : `Opłacony · ${bot.payment.daysLeft} dni`) : "Nieopłacony"}
        </span>
      </div>
    </Link>
  );
}
