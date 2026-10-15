import Link from "next/link";
import { Crown, LogOut, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listBots } from "@/lib/db";
import { botPayment } from "@/lib/bots";
import { PLANS, PRO_TRIAL_DAYS, formatPrice } from "@/lib/catalog";
import { logout } from "@/app/actions/auth";
import { PanelNav } from "@/components/panel/nav";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { btn } from "@/components/ui/button";
import { Curtain } from "@/components/landing/curtain";
import { SpotlightTracker } from "@/components/landing/motion";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const bots = listBots(user.id);
  const paidBots = bots.filter((b) => botPayment(b).paid).length;
  const pro = PLANS.find((p) => p.id === "pro")!;

  const footer = (
    <div className="space-y-3">
      {paidBots === 0 && (
        <div className="relative overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#111113] p-4">
          <Curtain base="17 17 19" className="inset-0 opacity-70" />
          <div className="relative flex items-center gap-2 text-[14px] font-medium text-white">
            <Sparkles className="size-4 text-brand-300" />
            {user.trialUsed ? "Bot Pro" : `Bot Pro · ${PRO_TRIAL_DAYS} dni gratis`}
          </div>
          <p className="relative mt-1 text-[12.5px] leading-relaxed text-white/70">
            Twoja nazwa i avatar, wszystkie moduły i pełny kreator. {formatPrice(pro.price)} / mies. za bota.
          </p>
          <Link href={bots.length ? "/panel/boty" : "/panel/boty/nowy"} className={btn("primary", "sm", "relative mt-3 w-full")}>
            {bots.length ? "Moje boty" : "Stwórz Bota Pro"}
          </Link>
        </div>
      )}
      <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
        <BotAvatar name={user.name} color="#5865f2" className="size-9 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{user.name}</div>
          <div className="flex items-center gap-1 text-[12px] text-white/45">
            {paidBots > 0 && <Crown className="size-3 text-amber-300" />}
            {paidBots > 0 ? `${paidBots} ${paidBots === 1 ? "Bot Pro" : "Boty Pro"}` : "Darmowy Bociak"}
          </div>
        </div>
        <form action={logout}>
          <button className="grid size-8 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white" aria-label="Wyloguj się" title="Wyloguj się">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0f] lg:flex-row">
      <SpotlightTracker />
      <PanelNav footer={footer} userName={user.name} />
      <main className="relative min-w-0 flex-1 overflow-x-clip">
        {/* delikatna poświata u góry – ten sam motyw co na stronie głównej */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[360px] opacity-20 [mask-image:linear-gradient(to_bottom,#000,transparent)]">
          <Curtain className="inset-0 rotate-180" fadeTop={false} />
        </div>
        {/* na telefonie zostawiamy miejsce na dolne zakładki */}
        <div className="relative mx-auto max-w-[1180px] px-4 pb-32 pt-6 sm:px-8 sm:pt-10 lg:pb-14">{children}</div>
      </main>
    </div>
  );
}
