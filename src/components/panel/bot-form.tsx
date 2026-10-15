"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ExternalLink, KeyRound } from "lucide-react";
import { BOT_COLORS, MODULES } from "@/lib/catalog";
import { ModulesPicker } from "./modules-picker";
import { CV2Preview } from "@/components/ui/cv2-preview";
import { MESSAGE_KINDS, parseTemplate } from "@/lib/message";
import type { GuildSnapshot } from "@/lib/guild";
import type { FormState } from "@/app/actions/panel";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { btn } from "@/components/ui/button";
import { Alert, SubmitButton } from "@/components/ui/form";
import { DiscordEmbed, DiscordMessage, DiscordWindow, SystemJoin } from "@/components/ui/discord";

type ModuleConfig = Record<string, Record<string, string>>;

export type BotFormValues = {
  name: string;
  color: string;
  prefix: string;
  activity: string;
  clientId: string;
  modules: ModuleConfig;
};

type Props = {
  mode: "create" | "edit";
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: BotFormValues;
  tokenMask?: string | null;
  plan: { name: string; maxModules: number | null; premiumModules: boolean };
  /** Serwery, na których bot już jest – do list kanałów i ról. */
  guilds?: GuildSnapshot[];
};

const SECTIONS = [
  { id: "basics", label: "Podstawy", hint: "Nazwa, wygląd i status" },
  { id: "modules", label: "Moduły", hint: "Co ma robić bot" },
  { id: "discord", label: "Połączenie", hint: "Token z Discorda" },
] as const;

const EMPTY: BotFormValues = { name: "", color: BOT_COLORS[0], prefix: "!", activity: "", clientId: "", modules: { welcome: {} } };

export function BotForm({ mode, action, initial = EMPTY, tokenMask, plan, guilds = [] }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [step, setStep] = useState(0);
  const [v, setV] = useState<BotFormValues>(initial);
  const [showToken, setShowToken] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const set = <K extends keyof BotFormValues>(key: K, value: BotFormValues[K]) => setV((s) => ({ ...s, [key]: value }));
  function goTo(i: number) {
    if (i > 0 && v.name.trim().length < 2) {
      setStep(0);
      setStepError("Nadaj botowi nazwę (min. 2 znaki).");
      return;
    }
    setStepError(null);
    setStep(i);
  }

  const isCreate = mode === "create";
  const visible = (i: number) => step === i;

  // W kreatorze Enter przechodzi do kolejnego kroku zamiast od razu wysyłać formularz.
  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (isCreate && e.key === "Enter" && step < SECTIONS.length - 1 && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      goTo(step + 1);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
      <form action={formAction} onKeyDown={onKeyDown} className="min-w-0">
        <input type="hidden" name="modules" value={JSON.stringify(v.modules)} />
        <input type="hidden" name="color" value={v.color} />

        {/* nawigacja kroków / zakładek */}
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-[16px] border border-white/[0.06] bg-[#111113] p-1.5">
          {SECTIONS.map((s, i) => {
            const done = isCreate && i < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                className={`relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${step === i ? "" : "hover:bg-white/[0.03]"}`}
              >
                {step === i && (
                  <motion.span layoutId="bot-step" className="absolute inset-0 rounded-[12px] border border-white/[0.08] bg-white/[0.06]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                )}
                <span
                  className={`relative grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold transition-colors ${
                    done ? "bg-dc-green text-[#0d0d0f]" : step === i ? "bg-brand-500 text-white shadow-[0_0_16px_-2px_rgb(88_101_242/0.9)]" : "border border-white/15 text-white/40"
                  }`}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="relative hidden min-w-0 sm:block">
                  <span className={`block text-sm font-medium ${step === i ? "text-white" : "text-white/55"}`}>{s.label}</span>
                  <span className="block truncate text-[11.5px] text-white/35">{s.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {(stepError || state.error) && <Alert>{stepError ?? state.error}</Alert>}
          {state.success && <Alert kind="success">{state.success}</Alert>}
        </div>

        {/* KROK 1 – podstawy */}
        <section className={`card mt-4 space-y-6 p-6 ${visible(0) ? "animate-fade-up" : "hidden"}`}>
          <div className="flex items-center gap-5">
            <BotAvatar name={v.name || "?"} color={v.color} className="size-16 text-xl transition-all" />
            <div className="flex-1">
              <label htmlFor="name" className="label">Nazwa bota</label>
              <input
                id="name"
                name="name"
                className="input"
                placeholder="np. Strażnik"
                maxLength={32}
                value={v.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
          </div>

          <div>
            <span className="label">Kolor akcentu</span>
            <div className="flex flex-wrap gap-2.5">
              {BOT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  aria-label={`Kolor ${c}`}
                  className={`size-9 rounded-full transition-all hover:scale-110 ${
                    v.color === c ? "ring-2 ring-white ring-offset-[3px] ring-offset-[#111113]" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
            <div>
              <label htmlFor="prefix" className="label">Prefix</label>
              <input id="prefix" name="prefix" className="input font-mono" maxLength={5} value={v.prefix} onChange={(e) => set("prefix", e.target.value)} />
            </div>
            <div>
              <label htmlFor="activity" className="label">Status („Gra w…”)</label>
              <input
                id="activity"
                name="activity"
                className="input"
                placeholder="np. pilnowanie porządku"
                maxLength={64}
                value={v.activity}
                onChange={(e) => set("activity", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* KROK 2 – moduły */}
        <section className={`mt-4 ${visible(1) ? "animate-fade-up" : "hidden"}`}>
          <ModulesPicker value={v.modules} onChange={(modules) => set("modules", modules)} plan={plan} guilds={guilds} bot={{ name: v.name || "Twój bot", color: v.color }} />
        </section>

        {/* KROK 3 – połączenie z Discordem */}
        <section className={`mt-4 space-y-4 ${visible(2) ? "animate-fade-up" : "hidden"}`}>
          <div className="card space-y-5 p-6">
            <div>
              <label htmlFor="clientId" className="label">Application / Client ID</label>
              <input
                id="clientId"
                name="clientId"
                inputMode="numeric"
                className="input font-mono"
                placeholder="123456789012345678"
                value={v.clientId}
                onChange={(e) => set("clientId", e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <label htmlFor="token" className="label">Token bota</label>
              <div className="relative">
                <input
                  id="token"
                  name="token"
                  type={showToken ? "text" : "password"}
                  autoComplete="off"
                  className="input pr-11 font-mono"
                  placeholder={tokenMask ? `${tokenMask} (zostaw puste, aby nie zmieniać)` : "Wklej token z Developer Portal"}
                />
                <button
                  type="button"
                  onClick={() => setShowToken((s) => !s)}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-white/40 hover:text-white"
                  aria-label={showToken ? "Ukryj token" : "Pokaż token"}
                >
                  {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-white/40">
                <KeyRound className="size-3.5" /> Token szyfrujemy (AES-256) i nigdy go nie wyświetlamy w całości.
              </p>
            </div>
            {isCreate && <p className="text-[13px] text-white/45">Możesz pominąć ten krok i dodać token później w ustawieniach bota.</p>}
          </div>

          <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="text-sm font-medium text-white">Jak zdobyć token?</div>
            <ol className="mt-3 space-y-2 text-[13.5px] text-white/55">
              <li>1. Otwórz Discord Developer Portal i kliknij <b className="text-white/80">New Application</b>.</li>
              <li>2. Skopiuj <b className="text-white/80">Application ID</b> z zakładki General Information.</li>
              <li>3. W zakładce <b className="text-white/80">Bot</b> kliknij <b className="text-white/80">Reset Token</b> i skopiuj go tutaj.</li>
              <li>4. Włącz <b className="text-white/80">Server Members</b> i <b className="text-white/80">Message Content Intent</b>.</li>
            </ol>
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-300 hover:text-brand-400"
            >
              Otwórz Developer Portal <ExternalLink className="size-3.5" />
            </a>
          </div>
        </section>

        {/* akcje */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {isCreate ? (
            <>
              {step > 0 ? (
                <button type="button" onClick={() => goTo(step - 1)} className={btn("ghost", "md")}>
                  <ArrowLeft className="size-4" /> Wstecz
                </button>
              ) : (
                <Link href="/panel/boty" className={btn("ghost", "md")}>
                  Anuluj
                </Link>
              )}
              {step < SECTIONS.length - 1 ? (
                <button type="button" onClick={() => goTo(step + 1)} className={btn("primary", "md")}>
                  Dalej <ArrowRight className="size-4" />
                </button>
              ) : (
                <SubmitButton className="" pendingText="Tworzenie…">
                  Stwórz bota <Check className="size-4" />
                </SubmitButton>
              )}
            </>
          ) : (
            <div className="ml-auto">
              <SubmitButton className="" pendingText="Zapisywanie…">
                Zapisz zmiany
              </SubmitButton>
            </div>
          )}
        </div>
      </form>

      <BotPreview values={v} />
    </div>
  );
}

function BotPreview({ values: v }: { values: BotFormValues }) {
  const name = v.name.trim() || "Twój bot";
  const welcome = v.modules.welcome;
  const welcomeVars = Object.fromEntries(MESSAGE_KINDS.welcome.vars.map((x) => [x.key, x.example]));
  const mods = MODULES.filter((m) => v.modules[m.id]);

  return (
    <aside className="xl:sticky xl:top-8 xl:self-start">
      <div className="kicker mb-4">
        Podgląd na żywo
      </div>

      {/* profil bota */}
      <div className="overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#232428] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]">
        <div className="h-16" style={{ background: `linear-gradient(120deg, ${v.color}, color-mix(in oklab, ${v.color} 40%, #111))` }} />
        <div className="px-4 pb-4">
          <div className="-mt-8 inline-block rounded-full border-[5px] border-[#232428]">
            <BotAvatar name={name} color={v.color} className="size-16 text-lg" />
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-lg font-semibold text-white">{name}</span>
            <span className="rounded-[4px] bg-blurple px-1 py-px text-[9px] font-semibold uppercase text-white">✓ Bot</span>
          </div>
          {v.activity && <div className="mt-0.5 text-[13px] text-white/60">Gra w <b className="font-medium text-white/80">{v.activity}</b></div>}
        </div>
      </div>

      <DiscordWindow channel="ogólny" server="Twój serwer" className="mt-4">
        {welcome && (
          <>
            <SystemJoin user="Kasia" />
            <CV2Preview template={parseTemplate(welcome.design, "welcome")} vars={welcomeVars} botName={name} botColor={v.color} />
          </>
        )}
        <DiscordMessage author="Kasia" color="#f472b6">
          <span className="font-mono text-[12.5px]">{v.prefix || "!"}pomoc</span>
        </DiscordMessage>
        <DiscordMessage author={name} color={v.color} bot>
          <DiscordEmbed color={v.color} title={`📖 Komendy ${name}`} footer={`${mods.length} aktywnych modułów`}>
            {mods.length === 0 ? (
              <span className="text-white/50">Włącz moduły, aby zobaczyć komendy.</span>
            ) : (
              <ul className="space-y-0.5">
                {mods.slice(0, 6).map((m) => (
                  <li key={m.id}>
                    <span className="font-medium text-white">{m.name}</span> – {m.description.toLowerCase()}
                  </li>
                ))}
                {mods.length > 6 && <li className="text-white/50">…i {mods.length - 6} więcej</li>}
              </ul>
            )}
          </DiscordEmbed>
        </DiscordMessage>
      </DiscordWindow>
    </aside>
  );
}
