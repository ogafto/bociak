"use client";

import { motion } from "motion/react";
import { useActionState, useState, useTransition } from "react";
import { CalendarClock, Crown, Gift, Sparkles } from "lucide-react";
import { buyBotAction, setBotShowcaseAction, setServerShowcaseAction, startTrialAction, type FormState } from "@/app/actions/panel";
import { btn } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { CheckoutButton } from "./actions";

const EASE = [0.16, 1, 0.3, 1] as const;

export type BotPaymentView = { paid: boolean; until: string | null; period: "month" | "year" | "trial" | null; daysLeft: number; trial: boolean };

function untilText(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Płatność za jednego Bota Pro: stan (opłacony / okres próbny / nieopłacony), wybór okresu
 * (miesiąc albo rok – rok wychodzi taniej) i przycisk okresu próbnego, jeśli konto go jeszcze nie użyło.
 */
export function BotBilling({ botId, botName, payment, trialAvailable, monthly, yearly, trialDays }: { botId: string; botName: string; payment: BotPaymentView; trialAvailable: boolean; monthly: number; yearly: number; trialDays: number }) {
  const [period, setPeriod] = useState<"month" | "year">("year");
  const [trialState, trialAction, trialPending] = useActionState<FormState>(() => startTrialAction(botId), {});
  const price = period === "year" ? yearly : monthly;
  const fmt = (n: number) => `${n.toFixed(2).replace(".", ",").replace(",00", "")} zł`;
  const saving = Math.round((1 - yearly / (monthly * 12)) * 100);

  return (
    <div data-spot className="card-glow relative overflow-hidden p-6 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-[10px] bg-brand-500 text-white shadow-[0_0_20px_-4px_rgb(88_101_242/0.9)]">
              <Crown className="size-4" />
            </span>
            <h2 className="text-[1.3rem] font-medium tracking-[-0.02em] text-white">Bot Pro</h2>
            {payment.paid ? (
              <span className="rounded-full border border-dc-green/30 bg-dc-green/10 px-2.5 py-0.5 text-[12px] font-medium text-dc-green">
                {payment.trial ? "Okres próbny" : "Opłacony"}
              </span>
            ) : (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[12px] font-medium text-amber-300">Nieopłacony</span>
            )}
          </div>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/60">
            {payment.paid ? (
              <>
                {payment.trial ? "Okres próbny" : "Bot jest opłacony"} do <b className="font-medium text-white">{untilText(payment.until)}</b> (jeszcze {payment.daysLeft}{" "}
                {payment.daysLeft === 1 ? "dzień" : "dni"}). Przedłużenie doliczy się do tej daty.
              </>
            ) : (
              <>
                Każdy własny bot to osobny pakiet: Twoja nazwa i avatar, wszystkie moduły, pełny kreator wiadomości i hosting 24/7. Bot ruszy zaraz po opłaceniu.
              </>
            )}
          </p>
          {payment.paid && (
            <div className="mt-4 h-1.5 max-w-sm overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (payment.daysLeft / (payment.period === "year" ? 365 : payment.period === "trial" ? trialDays : 30)) * 100)}%` }}
                transition={{ duration: 1, delay: 0.2, ease: EASE }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
              />
            </div>
          )}
        </div>

        <div className="w-full shrink-0 space-y-3 lg:w-[320px]">
          {/* miesiąc / rok */}
          <div className="relative grid grid-cols-2 rounded-[12px] border border-white/[0.07] bg-black/20 p-1">
            {(["month", "year"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)} className={`relative rounded-[9px] py-2 text-[13px] font-medium transition-colors ${period === p ? "text-[#0d0d0f]" : "text-white/60 hover:text-white"}`}>
                {period === p && <motion.span layoutId={`period-${botId}`} className="absolute inset-0 rounded-[9px] bg-white" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                <span className="relative">
                  {p === "month" ? "Miesięcznie" : "Rocznie"}
                  {p === "year" && <span className={`ml-1.5 text-[11px] ${period === p ? "text-brand-600" : "text-dc-green"}`}>−{saving}%</span>}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-baseline justify-between px-1">
            <span className="font-heading text-[1.8rem] font-medium tracking-[-0.03em] text-white">{fmt(price)}</span>
            <span className="text-[13px] text-white/45">{period === "year" ? `za rok · ${fmt(yearly / 12)} / mies.` : "za miesiąc"}</span>
          </div>
          <CheckoutButton
            action={buyBotAction.bind(null, botId, period)}
            title={`Bot Pro „${botName}”`}
            subtitle={period === "year" ? "Opłata za 12 miesięcy" : "Opłata za 1 miesiąc"}
            price={fmt(price)}
            days={period === "year" ? 365 : 30}
            label={
              <>
                <CalendarClock className="size-4" /> {payment.paid ? "Przedłuż" : "Opłać bota"}
              </>
            }
          />
          {trialAvailable && !payment.paid && (
            <form action={trialAction}>
              <button disabled={trialPending} className={btn("secondary", "md", "w-full")}>
                <Gift className="size-4 text-brand-300" /> {trialDays} dni za darmo
              </button>
            </form>
          )}
          {trialState.error && <Alert>{trialState.error}</Alert>}
        </div>
      </div>
    </div>
  );
}

/** Przełącznik zgody na pokazanie serwera (albo serwerów bota) w sliderze na stronie głównej. */
export function ShowcaseToggle({ kind, id, on, compact = false }: { kind: "server" | "bot"; id: string; on: boolean; compact?: boolean }) {
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  const toggle = () => {
    const next = !value;
    setValue(next);
    start(async () => {
      await (kind === "server" ? setServerShowcaseAction(id, next) : setBotShowcaseAction(id, next));
    });
  };
  return (
    <div data-spot className={`card flex items-center gap-4 ${compact ? "p-4" : "p-5"}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-[11px] transition-colors ${value ? "bg-brand-500 text-white shadow-[0_0_20px_-4px_rgb(88_101_242/0.9)]" : "border border-white/[0.08] bg-white/[0.03] text-white/55"}`}>
        <Sparkles className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-white">Pochwal się na stronie Bociaka</div>
        <div className="text-[13px] leading-snug text-white/50">
          {kind === "server" ? "Nazwa, ikona i liczba osób Twojego serwera pojawią się w sliderze na bociak.pl." : "Serwery tego bota (nazwa, ikona, liczba osób) pojawią się w sliderze na bociak.pl."} Możesz to wyłączyć w każdej chwili.
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="Pokaż na stronie głównej"
        disabled={pending}
        onClick={toggle}
        className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-[background-color,box-shadow] duration-300 ${
          value ? "bg-brand-500 shadow-[0_0_16px_-2px_rgb(88_101_242/0.9)]" : "bg-white/10 hover:bg-white/15"
        }`}
      >
        <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} className={`size-5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.4)] ${value ? "ml-auto" : ""}`} />
      </button>
    </div>
  );
}
