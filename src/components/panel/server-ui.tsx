"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useState } from "react";
import { Check, CheckCircle2, Copy, ExternalLink, KeyRound, Loader2 } from "lucide-react";
import { generateLinkCodeAction, type FormState } from "@/app/actions/panel";
import { btn } from "@/components/ui/button";
import { Alert, SubmitButton } from "@/components/ui/form";
import { BociakGlyph } from "@/components/ui/logo";
import { Curtain } from "@/components/landing/curtain";
import { AutoRefresh } from "./auto-refresh";
import { ModulesPicker, type ModuleConfig, type PickerPlan } from "./modules-picker";
import type { GuildSnapshot } from "@/lib/guild";

const EASE = [0.16, 1, 0.3, 1] as const;
const CODE_TTL = 15 * 60; // sekundy – tyle żyje kod z generateLinkCodeAction

/** Dwa kroki łączenia serwera: dodanie Bociaka i komenda /polacz z jednorazowym kodem. */
export function LinkServer({ inviteUrl }: { inviteUrl: string | null }) {
  const [code, setCode] = useState<{ code: string; expiresAt: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!code) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [code]);

  const left = code ? Math.max(0, Math.round((code.expiresAt - now) / 1000)) : 0;
  const command = code ? `/polacz kod:${code.code}` : "";
  const ttl = Math.max(left, CODE_TTL);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <StepCard n={1} title="Dodaj Bociaka na serwer" delay={0.1}>
        <p className="text-[14.5px] leading-relaxed text-white/60">Wybierz serwer, na którym masz uprawnienie „Zarządzanie serwerem”, i zatwierdź uprawnienia bota.</p>
        <div className="relative mt-6 flex items-center gap-4 overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d0f] p-4">
          <Curtain base="13 13 15" className="inset-0 opacity-60" />
          <span className="relative grid size-12 place-items-center rounded-[14px] bg-brand-500 text-white shadow-[0_0_30px_-6px_rgb(88_101_242/0.9)]">
            <BociakGlyph className="size-7" />
          </span>
          <div className="relative text-[13.5px] leading-tight text-white/70">
            <b className="text-white">Bociak</b> chce dołączyć
            <br />
            do Twojego serwera
          </div>
        </div>
        {inviteUrl ? (
          <a href={inviteUrl} target="_blank" rel="noreferrer" className={btn("primary", "md", "mt-5 w-full sm:w-auto")}>
            Dodaj Bociaka <ExternalLink className="size-4" />
          </a>
        ) : (
          <div className="mt-5">
            <Alert>Wspólny bot nie jest jeszcze skonfigurowany (brak SHARED_BOT_CLIENT_ID w .env.local).</Alert>
          </div>
        )}
      </StepCard>

      <StepCard n={2} title="Połącz serwer z panelem" delay={0.18}>
        <p className="text-[14.5px] leading-relaxed text-white/60">Wygeneruj kod i wpisz komendę na dowolnym kanale swojego serwera.</p>
        <AnimatePresence mode="wait" initial={false}>
          {code && left > 0 ? (
            <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: EASE }} className="mt-6 space-y-4">
              <AutoRefresh every={3000} />
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(command);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[14px] border border-brand-400/40 bg-brand-500/10 px-5 py-4 text-left transition-colors hover:bg-brand-500/15"
              >
                <span className="font-mono text-[17px] font-semibold tracking-wide text-white">
                  <span className="text-brand-300">/polacz</span> kod:{code.code}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-brand-300">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Skopiowano" : "Kopiuj"}
                </span>
              </button>
              <div className="flex items-center gap-3 text-[13px] text-white/50">
                <Countdown left={left} total={ttl} />
                <span>
                  Czekam na komendę… kod ważny jeszcze{" "}
                  <b className="font-mono font-medium text-white">
                    {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
                  </b>
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="gen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: EASE }}>
              <div className="mt-6 flex items-center gap-2 rounded-[14px] border border-white/[0.07] bg-[#0d0d0f] px-4 py-3.5 font-mono text-[14px] text-white/40">
                <span className="text-brand-300/70">/polacz</span> kod:••••••
                <span className="ml-0.5 h-4 w-px animate-blink bg-white/60" />
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={async () => {
                  setPending(true);
                  setCode(await generateLinkCodeAction());
                  setNow(Date.now());
                  setPending(false);
                }}
                className={btn("secondary", "md", "mt-5 w-full sm:w-auto")}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                {code ? "Kod wygasł – wygeneruj nowy" : "Wygeneruj kod"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </StepCard>
    </div>
  );
}

/** Kółko odliczające ważność kodu. */
function Countdown({ left, total }: { left: number; total: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 24 24" className="size-6 -rotate-90">
      <circle cx="12" cy="12" r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="2.5" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="#8a93ff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - left / Math.max(total, 1))}
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
    </svg>
  );
}

function StepCard({ n, title, delay, children }: { n: number; title: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: 10, transformPerspective: 1000 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      data-spot
      className="card p-6 sm:p-7"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full border border-brand-400/50 bg-brand-500/15 font-mono text-[13px] text-brand-300">{n}</span>
        <h2 className="text-[19px] font-medium tracking-[-0.02em] text-white">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

/** Moduły jednego serwera ze wspólnym botem. Pasek zapisu wysuwa się, gdy są niezapisane zmiany. */
export function ServerModulesForm({
  action,
  initial,
  plan,
  guilds,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: ModuleConfig;
  plan: PickerPlan;
  guilds: GuildSnapshot[];
}) {
  const [state, formAction] = useActionState(action, {});
  const [modules, setModules] = useState<ModuleConfig>(initial);
  const dirty = JSON.stringify(modules) !== JSON.stringify(initial);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="modules" value={JSON.stringify(modules)} />
      {state.error && <Alert>{state.error}</Alert>}
      <ModulesPicker value={modules} onChange={setModules} plan={plan} guilds={guilds} />

      <div className="pointer-events-none sticky bottom-24 z-30 flex justify-center lg:bottom-5">
        <motion.div
          layout
          className={`pointer-events-auto flex items-center gap-3 rounded-[16px] border p-2 pl-4 shadow-[0_24px_60px_-15px_rgb(0_0_0/0.95)] backdrop-blur-xl transition-colors ${
            dirty ? "border-brand-400/40 bg-[#16172a]/90" : "border-white/[0.08] bg-[#141416]/90"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={dirty ? "dirty" : state.success ? "saved" : "clean"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-[13.5px] text-white/75"
            >
              {dirty ? (
                <>
                  <span className="size-2 animate-pulse rounded-full bg-brand-400" /> Masz niezapisane zmiany
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-dc-green" /> {state.success ? "Zapisano – bot już działa z nowymi ustawieniami" : "Wszystko zapisane"}
                </>
              )}
            </motion.span>
          </AnimatePresence>
          <SubmitButton className={dirty ? "" : "opacity-60"} pendingText="Zapisywanie…">
            Zapisz
          </SubmitButton>
        </motion.div>
      </div>
    </form>
  );
}
