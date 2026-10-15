import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Crown, Gift, MessageCircle, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listBots, listOrders } from "@/lib/db";
import { formatDate, toBotView } from "@/lib/bots";
import { BRAND, PLANS, PRO_TRIAL_DAYS, formatPrice, getPlan } from "@/lib/catalog";
import { btn } from "@/components/ui/button";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { PageHeader } from "@/components/panel/page-header";
import { Curtain } from "@/components/landing/curtain";
import { Enter } from "@/components/landing/motion";

export const metadata: Metadata = { title: "Płatności" };

export default async function BillingPage() {
  const user = await requireUser();
  const bots = listBots(user.id).map((b) => toBotView(b));
  const names = new Map(bots.map((b) => [b.id, b.name]));
  const orders = listOrders(user.id);
  const free = PLANS.find((p) => p.id === "start")!;
  const pro = PLANS.find((p) => p.id === "pro")!;
  const saving = Math.round((1 - pro.yearlyPrice! / (pro.price! * 12)) * 100);

  return (
    <div className="space-y-12">
      <PageHeader kicker="Płatności" title="Płatności i pakiety" description="Darmowy Bociak jest za darmo na zawsze. Za każdego własnego bota płacisz osobno – miesięcznie albo rocznie." />

      {/* dwa pakiety obok siebie */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Enter delay={0.08}>
          <div data-spot className="card flex h-full flex-col p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[1.35rem] font-medium tracking-[-0.02em] text-white">Darmowy Bociak</span>
              <span className="rounded-[6px] border border-dc-green/40 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-dc-green">Aktywny</span>
            </div>
            <p className="mt-1 text-sm text-white/50">{free.description}</p>
            <div className="mt-5 font-heading text-[2.4rem] font-medium tracking-[-0.04em] text-white">0 zł</div>
            <ul className="mt-5 flex-1 space-y-2.5 border-t border-white/[0.06] pt-5">
              {free.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/70">
                  <Check className="mt-0.5 size-4 shrink-0 text-white/40" strokeWidth={2.5} /> {f}
                </li>
              ))}
            </ul>
            <Link href="/panel/serwery" className={btn("secondary", "md", "mt-6 w-full")}>
              Moje serwery
            </Link>
          </div>
        </Enter>

        <Enter delay={0.14} className="ring-spin rounded-[16px]">
          <div data-spot className="relative flex h-full flex-col overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#141416] p-6 sm:p-7">
            <Curtain base="20 20 22" className="inset-x-0 top-0 h-24 opacity-40" />
            <div className="relative flex items-center justify-between">
              <span className="font-heading text-[1.35rem] font-medium tracking-[-0.02em] text-white">{pro.name}</span>
              {!user.trialUsed && (
                <span className="flex items-center gap-1 rounded-[6px] border border-brand-400/50 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-brand-300">
                  <Gift className="size-3" /> {PRO_TRIAL_DAYS} dni gratis
                </span>
              )}
            </div>
            <p className="relative mt-1 text-sm text-white/55">{pro.description}</p>
            <div className="relative mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-heading text-[2.4rem] font-medium tracking-[-0.04em] text-white">{formatPrice(pro.price)}</span>
              <span className="text-sm text-white/45">/ mies. za bota</span>
              <span className="text-sm text-white/45">
                albo <b className="font-medium text-white">{formatPrice(pro.yearlyPrice!)}</b> / rok <span className="text-dc-green">(−{saving}%)</span>
              </span>
            </div>
            <ul className="relative mt-5 flex-1 space-y-2.5 border-t border-white/[0.06] pt-5">
              {pro.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/80">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-300" strokeWidth={2.5} /> {f}
                </li>
              ))}
            </ul>
            <Link href="/panel/boty/nowy" className={btn("primary", "md", "relative mt-6 w-full")}>
              <Plus className="size-4" /> {bots.length ? "Dodaj kolejnego bota" : "Stwórz Bota Pro"}
            </Link>
          </div>
        </Enter>
      </section>

      {/* boty i ich opłaty */}
      <Enter delay={0.2}>
        <section>
          <h2 className="mb-4 text-[20px] font-medium tracking-[-0.02em] text-white">Twoje Boty Pro</h2>
          {bots.length === 0 ? (
            <div className="card p-6 text-sm text-white/50">Nie masz jeszcze własnego bota. Stwórz go w kreatorze – płatność wybierzesz na końcu.</div>
          ) : (
            <div className="card divide-y divide-white/[0.05]">
              {bots.map((b) => (
                <div key={b.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <BotAvatar name={b.name} color={b.color} className="size-10 text-sm" />
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-medium text-white">{b.name}</div>
                      <div className={`text-[13px] ${b.payment.paid ? "text-white/50" : "text-amber-300"}`}>
                        {b.payment.paid
                          ? `${b.payment.trial ? "Okres próbny" : b.payment.period === "year" ? "Roczny" : "Miesięczny"} · do ${formatDate(b.payment.until)} (${b.payment.daysLeft} dni)`
                          : "Nieopłacony – bot nie działa"}
                      </div>
                    </div>
                  </div>
                  <Link href={`/panel/boty/${b.id}`} className={btn(b.payment.paid ? "secondary" : "primary", "sm")}>
                    {b.payment.paid ? "Przedłuż" : "Opłać"} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </Enter>

      {/* Enterprise */}
      <Enter delay={0.24}>
        <div className="flex flex-col gap-4 rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-5 sm:flex-row sm:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-[11px] border border-white/[0.08] bg-white/[0.03] text-white/70">
            <Crown className="size-[18px]" />
          </span>
          <div className="flex-1">
            <div className="text-[15px] font-medium text-white">Enterprise</div>
            <div className="text-[13.5px] text-white/50">Wiele botów na jednej fakturze, funkcje na zamówienie, pomoc przy weryfikacji bota w Discordzie.</div>
          </div>
          <a href={BRAND.discordInvite} target="_blank" rel="noreferrer" className={btn("secondary", "sm")}>
            <MessageCircle className="size-3.5" /> Napisz na Discordzie
          </a>
        </div>
      </Enter>

      <Enter delay={0.28}>
        <section>
          <h2 className="mb-4 text-[20px] font-medium tracking-[-0.02em] text-white">Historia płatności</h2>
          <div className="card overflow-x-auto">
            {orders.length === 0 ? (
              <p className="p-6 text-sm text-white/45">Brak płatności.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-[11.5px] uppercase tracking-[0.1em] text-white/35">
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3.5 font-medium">Data</th>
                    <th className="px-5 py-3.5 font-medium">Usługa</th>
                    <th className="px-5 py-3.5 text-right font-medium">Kwota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {orders.map((o) => (
                    <tr key={o.id} className="text-white/70 transition-colors hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-5 py-3.5">{formatDate(o.created_at)}</td>
                      <td className="px-5 py-3.5 text-white">
                        {o.kind === "bot"
                          ? `Bot Pro „${(o.bot_id && names.get(o.bot_id)) || "usunięty bot"}” – ${o.item === "year" ? "rok" : "miesiąc"}`
                          : o.kind === "plan"
                            ? `Pakiet ${getPlan(o.item).name}`
                            : "Hosting (stary model)"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-white">{formatPrice(o.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </Enter>
    </div>
  );
}
