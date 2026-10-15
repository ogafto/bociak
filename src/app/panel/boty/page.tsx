import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Gift, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listBots } from "@/lib/db";
import { toBotView } from "@/lib/bots";
import { PLANS, PRO_TRIAL_DAYS, formatPrice } from "@/lib/catalog";
import { btn } from "@/components/ui/button";
import { BotCard } from "@/components/panel/bot-card";
import { PageHeader } from "@/components/panel/page-header";
import { Curtain } from "@/components/landing/curtain";
import { Enter } from "@/components/landing/motion";
import { Logo3D } from "@/components/landing/three-d";

export const metadata: Metadata = { title: "Boty Pro" };

export default async function BotsPage() {
  const user = await requireUser();
  const bots = listBots(user.id).map((b) => toBotView(b));
  const pro = PLANS.find((p) => p.id === "pro")!;
  const active = bots.filter((b) => b.payment.paid).length;

  return (
    <div>
      <PageHeader
        kicker="Bot Pro"
        title={bots.length ? "Twoje boty" : "Własny bot"}
        description={
          bots.length
            ? `${active} z ${bots.length} opłaconych · ${formatPrice(pro.price)} / mies. albo ${formatPrice(pro.yearlyPrice!)} / rok za każdego bota.`
            : "Bot z Twoją nazwą, avatarem i statusem. Płacisz osobno za każdego bota."
        }
        actions={
          bots.length > 0 ? (
            <Link href="/panel/boty/nowy" className={btn("primary", "md")}>
              <Plus className="size-4" /> Nowy bot
            </Link>
          ) : null
        }
      />

      {bots.length === 0 ? (
        <Enter delay={0.1}>
          <div data-spot className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] p-6 sm:p-10">
            <Curtain strong base="17 17 19" className="inset-y-0 right-0 w-full [mask-image:linear-gradient(to_right,transparent_10%,#000_70%)] sm:w-[60%]" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div className="max-w-lg">
                {!user.trialUsed && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/40 bg-brand-500/15 px-2.5 py-1 text-[12px] font-medium text-brand-300">
                    <Gift className="size-3.5" /> Pierwszy bot: {PRO_TRIAL_DAYS} dni za darmo
                  </span>
                )}
                <h2 className="mt-4 text-[2rem] font-medium leading-tight tracking-[-0.04em] text-white">Twój bot, Twoja marka</h2>
                <ul className="mt-5 space-y-2.5">
                  {["Własna nazwa, avatar i status", "Wszystkie moduły, bez limitów", "Pełny kreator wiadomości, bez podpisu Bociaka", "Hosting 24/7 w cenie, bez limitu serwerów"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-[15px] text-white/80">
                      <span className="grid size-5 place-items-center rounded-full bg-brand-500/20 text-brand-300">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[14px] text-white/50">
                  {formatPrice(pro.price)} / mies. albo {formatPrice(pro.yearlyPrice!)} / rok za bota. Rezygnujesz kiedy chcesz.
                </p>
                <Link href="/panel/boty/nowy" className={btn("primary", "md", "mt-6")}>
                  Stwórz bota <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="hidden pr-8 md:block">
                <div className="animate-hover-y">
                  <Logo3D size={160} />
                </div>
              </div>
            </div>
          </div>
        </Enter>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bots.map((b, i) => (
            <Enter key={b.id} delay={0.08 + i * 0.06}>
              <BotCard bot={b} />
            </Enter>
          ))}
          <Enter delay={0.08 + bots.length * 0.06}>
            <Link
              href="/panel/boty/nowy"
              className="group flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-white/[0.12] p-5 text-center transition-colors hover:border-brand-400/50 hover:bg-brand-500/[0.04]"
            >
              <span className="grid size-11 place-items-center rounded-full border border-white/[0.1] bg-white/[0.03] text-white/60 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-400/50 group-hover:text-brand-300">
                <Plus className="size-5" />
              </span>
              <span className="text-[14px] text-white/60 group-hover:text-white">Dodaj kolejnego bota</span>
              <span className="text-[12px] text-white/35">{formatPrice(pro.price)} / mies. za bota</span>
            </Link>
          </Enter>
        </div>
      )}
    </div>
  );
}
