"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CreditCard, Loader2, Lock, Power, ShieldCheck, Trash2, X } from "lucide-react";
import { toggleBotAction, type FormState } from "@/app/actions/panel";
import { motion } from "motion/react";
import { btn } from "@/components/ui/button";
import { Curtain } from "@/components/landing/curtain";
import { SubmitButton } from "@/components/ui/form";

export function PowerButton({ botId, online }: { botId: string; online: boolean }) {
  const [state, action, pending] = useActionState<FormState>(() => toggleBotAction(botId), {});
  return (
    <div className="flex flex-col items-end gap-2">
      <form action={action}>
        <button disabled={pending} className={btn(online ? "secondary" : "primary", "md")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
          {online ? "Zatrzymaj bota" : "Uruchom bota"}
        </button>
      </form>
      {state.error && <p className="max-w-64 text-right text-[12.5px] text-rose-300">{state.error}</p>}
    </div>
  );
}

export function DeleteBotButton({ action, name }: { action: () => Promise<void>; name: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Na pewno usunąć bota „${name}”? Tej operacji nie można cofnąć.`)) e.preventDefault();
      }}
    >
      <button className={btn("danger", "sm")}>
        <Trash2 className="size-3.5" /> Usuń bota
      </button>
    </form>
  );
}

// Okno „kasy”. Na razie płatność jest symulowana – patrz chargeCustomer() w app/actions/panel.ts.
export function CheckoutButton({
  action,
  title,
  subtitle,
  price,
  label,
  variant = "primary",
  className = "w-full",
  days = 30,
}: {
  action: () => Promise<void>;
  title: string;
  subtitle?: string;
  price: string;
  label: React.ReactNode;
  variant?: Parameters<typeof btn>[0];
  className?: string;
  /** Długość opłacanego okresu – tylko do podsumowania. */
  days?: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btn(variant, "md", className)}>
        {label}
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Podsumowanie zamówienia">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              className="relative w-full max-w-md overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111113] p-7 shadow-[0_40px_100px_-20px_rgb(0_0_0/1)]"
            >
              <Curtain base="17 17 19" className="inset-x-0 top-0 h-40 opacity-60" />
              <button onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full text-white/40 hover:bg-white/5 hover:text-white" aria-label="Zamknij">
                <X className="size-4" />
              </button>
              <div className="relative flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.12em] text-brand-300">
                <CreditCard className="size-3.5" /> Podsumowanie
              </div>
              <h3 className="relative mt-3 text-[1.5rem] font-medium tracking-[-0.03em] text-white">{title}</h3>
              {subtitle && <p className="relative mt-1 text-sm text-white/55">{subtitle}</p>}

              <div className="relative mt-6 space-y-2.5 rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4 text-sm">
                <div className="flex justify-between text-white/55">
                  <span>Okres</span>
                  <span className="text-white/80">{days >= 365 ? "12 miesięcy" : `${days} dni`}</span>
                </div>
                <div className="flex justify-between border-t border-white/[0.06] pt-2.5">
                  <span className="text-white/55">Do zapłaty</span>
                  <span className="font-heading text-[1.3rem] font-medium text-white">{price}</span>
                </div>
              </div>

              <div className="relative mt-4 flex items-start gap-2 rounded-[12px] border border-amber-400/15 bg-amber-400/[0.06] px-3.5 py-3 text-[12.5px] text-amber-200/80">
                <ShieldCheck className="mt-px size-4 shrink-0" />
                Tryb demonstracyjny – płatność zostanie zasymulowana i usługa aktywuje się od razu.
              </div>

              <form
                action={async () => {
                  await action();
                  setOpen(false);
                }}
                className="relative mt-6"
              >
                <SubmitButton pendingText="Przetwarzanie płatności…">
                  <Lock className="size-4" /> Zapłać {price}
                </SubmitButton>
              </form>
            </motion.div>
          </div>,
          document.body,
        )}
    </>
  );
}
