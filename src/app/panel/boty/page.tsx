import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Crown, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listBots } from "@/lib/db";
import { toBotView } from "@/lib/bots";
import { PLANS, formatPrice } from "@/lib/catalog";
import { btn } from "@/components/ui/button";
import { BotCard } from "@/components/panel/bot-card";
import { PageHeader } from "@/components/panel/page-header";
import { EmptyBots } from "@/components/panel/empty-bots";
import { Curtain } from "@/components/landing/curtain";
import { Enter, Progress } from "@/components/landing/motion";
import { Logo3D } from "@/components/landing/three-d";

export const metadata: Metadata = { title: "Własny bot" };

export default async function BotsPage() {
  const user = await requireUser();
  const canHost = user.plan.maxBots > 0;
  const bots = listBots(user.id).map((b) => toBotView(b, canHost));
  const canCreate = bots.length < user.plan.maxBots;
  const pro = PLANS.find((p) => p.id === "pro")!;

  return (
    <div>
      <PageHeader
        kicker="Własny bot"
        title={canHost ? "Twoje boty" : "Własny bot"}
        description={canHost ? `Wykorzystano ${bots.length} z ${user.plan.maxBots} w pakiecie ${user.plan.name}. Hosting 24/7 w cenie.` : "Bot z Twoją nazwą, avatarem i statusem – w pakiecie Pro."}
        actions={
          canCreate ? (
            <Link href="/panel/boty/nowy" className={btn("primary", "md")}>
              <Plus className="size-4" /> Nowy bot
            </Link>
          ) : canHost ? (
            <Link href="/panel/pakiety" className={btn("secondary", "md")}>
              Potrzebujesz więcej? Enterprise
            </Link>
          ) : null
        }
      />
      {canHost && (
        <Enter delay={0.15} className="-mt-4 mb-8">
          <Progress value={(bots.length / user.plan.maxBots) * 100} className="max-w-sm" />
        </Enter>
      )}

      {!canHost ? (
        <Enter delay={0.1}>
          <div data-spot className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] p-6 sm:p-10">
            <Curtain strong base="17 17 19" className="inset-y-0 right-0 w-full [mask-image:linear-gradient(to_right,transparent_10%,#000_70%)] sm:w-[60%]" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div className="max-w-lg">
                <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-dc-yellow/30 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-dc-yellow">
                  <Crown className="size-3" /> Pro
                </span>
                <h2 className="mt-4 text-[2rem] font-medium leading-tight tracking-[-0.04em] text-white">Twój bot, Twoja marka</h2>
                <ul className="mt-5 space-y-2.5">
                  {["Własna nazwa, avatar i status", "Wszystkie moduły, także Pro", "Pełny kreator wiadomości", "Hosting 24/7 w cenie, bez limitu serwerów"].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-[15px] text-white/80">
                      <span className="grid size-5 place-items-center rounded-full bg-brand-500/20 text-brand-300">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/panel/pakiety" className={btn("primary", "md", "mt-7")}>
                  Przejdź na Pro za {formatPrice(pro.price)} <ArrowRight className="size-4" />
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
      ) : bots.length === 0 ? (
        <Enter delay={0.1}>
          <EmptyBots />
        </Enter>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bots.map((b, i) => (
            <Enter key={b.id} delay={0.08 + i * 0.06}>
              <BotCard bot={b} />
            </Enter>
          ))}
        </div>
      )}
    </div>
  );
}
