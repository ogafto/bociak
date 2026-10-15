"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Crown, Lock, Settings2, X } from "lucide-react";
import { FREE_LIMITS, MODULES, MODULE_CATEGORIES, type BotModule, type ModuleCategory, type ModuleField } from "@/lib/catalog";
import { ModuleIcon } from "@/components/ui/module-icon";
import { btn } from "@/components/ui/button";
import type { GuildSnapshot } from "@/lib/guild";
import { Curtain } from "@/components/landing/curtain";
import { DiscordSelect } from "./discord-select";
import { MessageField } from "./message-designer";

export type ModuleConfig = Record<string, Record<string, string>>;
export type PickerPlan = { maxModules: number | null; premiumModules: boolean };

// Moduły jako kafelki z przełącznikiem. Ustawienia otwierają się w panelu wysuwanym
// od dołu (telefon) albo z boku (komputer) – tak, żeby wszystko było proste.

export function ModulesPicker({
  value,
  onChange,
  plan,
  guilds = [],
  bot = { name: "Bociak", color: "#5865f2" },
}: {
  value: ModuleConfig;
  onChange: (next: ModuleConfig) => void;
  plan: PickerPlan;
  /** Kanały i role serwera(ów) – do list wyboru zamiast wpisywania ID. */
  guilds?: GuildSnapshot[];
  /** Nazwa i kolor bota w podglądzie wiadomości. */
  bot?: { name: string; color: string };
}) {
  const [category, setCategory] = useState<ModuleCategory | "all" | "on">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const enabledIds = Object.keys(value);
  const limitReached = plan.maxModules !== null && enabledIds.length >= plan.maxModules;

  const status = (m: BotModule) => {
    const on = !!value[m.id];
    if (m.soon) return { on, disabled: true, reason: "Wkrótce" };
    if (m.premium && !plan.premiumModules) return { on, disabled: true, reason: "PRO" };
    if (!on && limitReached) return { on, disabled: true, reason: "Limit" };
    return { on, disabled: false, reason: null };
  };

  function toggle(m: BotModule) {
    const next = { ...value };
    if (next[m.id]) delete next[m.id];
    else next[m.id] = {};
    onChange(next);
  }

  function setField(moduleId: string, key: string, v: string) {
    onChange({ ...value, [moduleId]: { ...value[moduleId], [key]: v } });
  }

  const list = MODULES.filter((m) => (category === "all" ? true : category === "on" ? !!value[m.id] : m.category === category));
  const open = MODULES.find((m) => m.id === openId) ?? null;

  return (
    <div>
      {/* filtr kategorii + licznik */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto rounded-[14px] border border-white/[0.06] bg-[#111113] p-1 px-1 [scrollbar-width:none]">
          {[
            { id: "all" as const, name: "Wszystkie" },
            { id: "on" as const, name: `Włączone · ${enabledIds.length}` },
            ...MODULE_CATEGORIES.map((c) => ({ id: c.id, name: c.name.split(" ")[0] })),
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`relative shrink-0 rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-colors ${category === c.id ? "text-[#0d0d0f]" : "text-white/55 hover:text-white"}`}
            >
              {category === c.id && <motion.span layoutId="module-tab" className="absolute inset-0 rounded-[10px] bg-white" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
              <span className="relative">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[13px]">
          {plan.maxModules !== null && (
            <span className="flex items-center gap-2 text-white/50">
              <span className="flex gap-0.5">
                {Array.from({ length: plan.maxModules }, (_, i) => (
                  <span key={i} className={`h-1.5 w-3 rounded-full transition-colors duration-300 ${i < enabledIds.length ? "bg-brand-400 shadow-[0_0_8px_rgb(138_147_255/0.8)]" : "bg-white/10"}`} />
                ))}
              </span>
              <b className="font-medium text-white">{enabledIds.length}</b> / {plan.maxModules}
            </span>
          )}
          {(!plan.premiumModules || limitReached) && (
            <Link href="/panel/boty" className="flex items-center gap-1 font-medium text-dc-yellow hover:opacity-80">
              <Crown className="size-3.5" /> Wszystko w Bocie Pro
            </Link>
          )}
        </div>
      </div>

      <motion.div layout className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((m, i) => {
            const s = status(m);
            const hasSettings = !!m.fields?.length;
            return (
              <motion.div
                layout
                key={m.id}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.025, ease: [0.16, 1, 0.3, 1] }}
                data-spot
                className={`group relative flex flex-col overflow-hidden rounded-[16px] border p-4 transition-[border-color,background-color,box-shadow] duration-300 ${
                  s.on
                    ? "border-brand-400/40 bg-[linear-gradient(160deg,rgb(88_101_242/0.14),rgb(17_17_19)_60%)] shadow-[0_0_0_1px_rgb(138_147_255/0.08),0_20px_40px_-24px_rgb(88_101_242/0.6)]"
                    : "border-white/[0.06] bg-[#111113] hover:border-white/[0.12]"
                } ${s.disabled && !s.on ? "opacity-55" : ""}`}
              >
                <div className="flex items-start gap-3.5">
                  <motion.span
                    key={s.on ? "on" : "off"}
                    initial={s.on ? { scale: 0.6, rotate: -12 } : false}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className={`grid size-11 shrink-0 place-items-center rounded-[12px] transition-colors ${
                      s.on ? "bg-brand-500 text-white shadow-[0_0_24px_-4px_rgb(88_101_242/0.9)]" : "border border-white/[0.07] bg-white/[0.03] text-white/55"
                    }`}
                  >
                    <ModuleIcon name={m.icon} className="size-5" />
                  </motion.span>
                  <button type="button" onClick={() => setOpenId(m.id)} className="min-w-0 flex-1 text-left">
                    <span className="flex flex-wrap items-center gap-1.5 text-[15px] font-medium text-white">
                      {m.name}
                      {m.soon && <span className="rounded-[5px] border border-white/10 px-1.5 text-[10px] font-medium text-white/55">Wkrótce</span>}
                      {m.premium && !m.soon && (
                        <span className="flex items-center gap-0.5 rounded-[5px] border border-dc-yellow/30 px-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-dc-yellow">
                          <Crown className="size-2.5" /> Pro
                        </span>
                      )}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-white/50">{m.description}</span>
                  </button>
                  {s.disabled && !s.on ? (
                    <Lock className="mt-1 size-4 shrink-0 text-white/35" aria-label={s.reason ?? undefined} />
                  ) : (
                    <Switch checked={s.on} onChange={() => toggle(m)} label={`${s.on ? "Wyłącz" : "Włącz"} moduł ${m.name}`} />
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {s.on && hasSettings && (
                    <motion.button
                      type="button"
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setOpenId(m.id)}
                      className="flex items-center justify-between overflow-hidden rounded-[10px] border border-white/[0.06] bg-black/25 px-3.5 py-2.5 text-[13px] font-medium text-white/80 transition-colors hover:border-brand-400/30 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Settings2 className="size-4 text-brand-300" /> Ustawienia
                      </span>
                      <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && <p className="mt-10 text-center text-sm text-white/40">Nic tu jeszcze nie ma – włącz moduły w zakładce „Wszystkie”.</p>}

      <ModuleSheet
        module={open}
        status={open ? status(open) : null}
        settings={open ? (value[open.id] ?? {}) : {}}
        onToggle={() => open && toggle(open)}
        onField={(k, v) => open && setField(open.id, k, v)}
        onClose={() => setOpenId(null)}
        guilds={guilds}
        bot={bot}
        fullEditor={plan.premiumModules}
      />
    </div>
  );
}

const subscribeNoop = () => () => {};

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-[background-color,box-shadow] duration-300 ${
        checked ? "bg-brand-500 shadow-[0_0_16px_-2px_rgb(88_101_242/0.9)]" : "bg-white/10 hover:bg-white/15"
      }`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} className={`size-5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.4)] ${checked ? "ml-auto" : ""}`} />
    </button>
  );
}

function ModuleSheet({
  module: m,
  status,
  settings,
  onToggle,
  onField,
  onClose,
  guilds,
  bot,
  fullEditor,
}: {
  module: BotModule | null;
  status: { on: boolean; disabled: boolean; reason: string | null } | null;
  settings: Record<string, string>;
  onToggle: () => void;
  onField: (key: string, v: string) => void;
  onClose: () => void;
  guilds: GuildSnapshot[];
  bot: { name: string; color: string };
  fullEditor: boolean;
}) {
  // portal tylko w przeglądarce (na serwerze nie ma document)
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  useEffect(() => {
    if (!m) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[role=dialog][aria-label^='Wygląd']") && onClose();
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [m, onClose]);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {m && status && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Moduł ${m.name}`}>
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ y: 60, x: 0, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, x: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.12, duration: 0.5 }}
            className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col overflow-hidden rounded-t-[24px] border border-white/[0.08] bg-[#111113] shadow-[0_40px_100px_-20px_rgb(0_0_0/1)] lg:inset-y-3 lg:left-auto lg:right-3 lg:max-h-none lg:w-[540px] lg:rounded-[20px]"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/15 lg:hidden" />
            <div className="relative flex items-start gap-4 overflow-hidden border-b border-white/[0.07] p-6">
              <Curtain base="17 17 19" className="inset-0 opacity-50" />
              <span className={`relative grid size-12 shrink-0 place-items-center rounded-[14px] ${status.on ? "bg-brand-500 text-white shadow-[0_0_24px_-4px_rgb(88_101_242/0.9)]" : "border border-white/[0.08] bg-white/[0.04] text-white/60"}`}>
                <ModuleIcon name={m.icon} className="size-6" />
              </span>
              <div className="relative min-w-0 flex-1">
                <h3 className="text-[1.4rem] font-medium tracking-[-0.03em] text-white">{m.name}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-white/55">{m.description}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Zamknij" className="relative grid size-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/60 transition-colors hover:text-white">
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
              <div className="flex items-center justify-between gap-4 rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4">
                <div>
                  <div className="font-medium text-white">{status.on ? "Moduł jest włączony" : "Moduł jest wyłączony"}</div>
                  <div className="text-[13px] text-white/45">
                    {status.disabled && !status.on
                      ? status.reason === "PRO"
                        ? "Ten moduł działa na Bocie Pro – Twoim własnym bocie."
                        : status.reason === "Limit"
                          ? "Osiągnięto limit modułów w Twoim pakiecie."
                          : "Pracujemy nad nim – będzie wkrótce."
                      : "Zmiany zapiszesz przyciskiem na dole strony."}
                  </div>
                </div>
                {status.disabled && !status.on ? (
                  status.reason !== "Wkrótce" && (
                    <Link href="/panel/boty" className={btn("primary", "sm")}>
                      <Crown className="size-3.5" /> Bot Pro
                    </Link>
                  )
                ) : (
                  <Switch checked={status.on} onChange={onToggle} label={`${status.on ? "Wyłącz" : "Włącz"} moduł ${m.name}`} />
                )}
              </div>

              {status.on &&
                m.fields?.map((f, i) => (
                  <motion.div key={f.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}>
                    <label className="label">{f.label}</label>
                    <FieldInput field={f} value={settings[f.key] ?? ""} onChange={(v) => onField(f.key, v)} guilds={guilds} bot={bot} fullEditor={fullEditor} />
                    {!fullEditor && FREE_LIMITS[m.id]?.field === f.key && <LineLimit value={settings[f.key] ?? ""} limit={FREE_LIMITS[m.id]} />}
                  </motion.div>
                ))}
              {status.on && !m.fields?.length && <p className="text-sm text-white/45">Ten moduł nie wymaga ustawień – działa od razu po włączeniu.</p>}
            </div>

            <div className="border-t border-white/[0.07] p-4">
              <button type="button" onClick={onClose} className={btn("primary", "lg", "w-full")}>
                Gotowe
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Licznik linii w modułach-listach darmowego Bociaka (np. 3/5 komend). */
function LineLimit({ value, limit }: { value: string; limit: { max: number; label: string } }) {
  const used = value.split("\n").filter((l) => l.trim()).length;
  const over = used > limit.max;
  return (
    <div className={`mt-2 flex items-center justify-between text-[12.5px] ${over ? "text-rose-300" : "text-white/45"}`}>
      <span>
        {used} / {limit.max} {limit.label}
        {over && " – usuń nadmiar albo przejdź na Bota Pro"}
      </span>
      <span className="flex gap-0.5">
        {Array.from({ length: limit.max }, (_, i) => (
          <span key={i} className={`h-1.5 w-3 rounded-full ${i < used ? (over ? "bg-rose-400" : "bg-brand-400") : "bg-white/10"}`} />
        ))}
      </span>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  guilds,
  bot,
  fullEditor,
}: {
  field: ModuleField;
  value: string;
  onChange: (v: string) => void;
  guilds: GuildSnapshot[];
  bot: { name: string; color: string };
  fullEditor: boolean;
}) {
  if (field.type === "message" && field.message) {
    return <MessageField kind={field.message} value={value} onChange={onChange} botName={bot.name} botColor={bot.color} fullEditor={fullEditor} />;
  }
  if (field.type === "channel" || field.type === "category" || field.type === "role") {
    return <DiscordSelect kind={field.type} value={value} onChange={onChange} guilds={guilds} />;
  }
  if (field.type === "textarea") {
    return <textarea rows={3} className="input resize-none" placeholder={field.placeholder} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input className="input" placeholder={field.placeholder} value={value} onChange={(e) => onChange(e.target.value)} />;
}
