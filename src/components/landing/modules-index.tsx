"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Blocks, ChevronRight, Gavel, Hash, MessageSquareX, ShieldAlert, Trash2 } from "lucide-react";
import { MESSAGE_KINDS, type MessageKind } from "@/lib/message";
import { READY_MODULES } from "@/lib/catalog";
import { CV2Preview } from "@/components/ui/cv2-preview";
import { LogoMark } from "@/components/ui/logo";
import { ModuleIcon } from "@/components/ui/module-icon";
import { Curtain } from "./curtain";
import { Reveal } from "./motion";
import { CONTAINER, Card, SectionIntro } from "./ui";

// „Moduły”: jedna duża karta. Po lewej lista modułów (sama się przełącza), po prawej okno kanału
// Discorda na tle poświaty z wiadomością, którą wysyła wybrany moduł. Kolor akcentu można zmienić.

const DURATION = 5200;

type Item = { id: string; name: string; icon: string; channel: string; text: string; pro?: boolean; kind?: MessageKind; actions?: string[]; custom?: "mod" | "poll" };

const ITEMS: Item[] = [
  { id: "moderation", icon: "shield", name: "Moderacja i automod", channel: "logi-moderacji", custom: "mod", text: "Filtr linków, spamu i wulgaryzmów. Każda akcja trafia do logów, a /ban, /kick i /wycisz masz od ręki." },
  { id: "welcome", icon: "party", name: "Powitania", channel: "witamy", kind: "welcome", text: "Nowa osoba dostaje wiadomość w Twoim stylu: z avatarem, licznikiem i listą pierwszych kroków." },
  { id: "tickets", icon: "ticket", name: "Tickety", channel: "pomoc", kind: "ticketPanel", actions: ["📩 Otwórz ticket"], text: "Jeden przycisk otwiera prywatny kanał z administracją. Po rozmowie ticket zamyka się kliknięciem." },
  { id: "polls", icon: "vote", name: "Ankiety", channel: "ogłoszenia", custom: "poll", text: "Głosowanie przyciskami z wynikami na żywo. Bez reakcji emoji i liczenia ręcznie." },
  { id: "levels", icon: "trending", name: "Poziomy i XP", channel: "awanse", kind: "levelup", pro: true, text: "Aktywność na czacie daje XP. Za kolejne poziomy bot ogłasza awans i nadaje role." },
  { id: "giveaways", icon: "gift", name: "Konkursy", channel: "konkursy", kind: "giveaway", actions: ["🎉 Biorę udział"], pro: true, text: "Nagroda, czas i liczba zwycięzców. Bot zbiera zgłoszenia i sam losuje." },
];

const ACCENTS = ["#5865f2", "#eb459e", "#57f287", "#fee75c"];

const VARS = Object.fromEntries(Object.values(MESSAGE_KINDS).flatMap((k) => k.vars.map((v) => [v.key, v.example])));

export function ModulesIndex() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [accent, setAccent] = useState<string | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % ITEMS.length), DURATION);
    return () => clearTimeout(id);
  }, [active, paused]);

  const item = ITEMS[active];
  const rest = READY_MODULES.filter((m) => !ITEMS.some((i) => i.id === m.id) && m.id !== "automod");

  return (
    <section id="moduly" className="scroll-mt-20 py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionIntro icon={Blocks} label="Moduły" title="Jeden bot." muted="Wszystko, czego potrzebuje serwer." />

        <Reveal tilt className="mt-14">
          <Card className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="border-t border-white/[0.06] lg:border-r lg:border-t-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              {ITEMS.map((it, i) => {
                const on = i === active;
                return (
                  <div key={it.id} className="relative border-b border-white/[0.06] last:border-b-0">
                    <button onClick={() => setActive(i)} className="flex w-full items-start gap-4 px-5 py-5 text-left sm:px-6">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-[10px] border transition-colors ${on ? "border-brand-400/40 bg-brand-500/15 text-brand-300" : "border-white/[0.07] bg-white/[0.02] text-white/55"}`}>
                        <ModuleIcon name={it.icon} className="size-[17px]" />
                      </span>
                      <span className="min-w-0 flex-1 pt-1.5">
                        <span className="flex items-center gap-2">
                          <span className={`text-[17px] tracking-[-0.01em] transition-colors ${on ? "text-white" : "text-white/70"}`}>{it.name}</span>
                          {it.pro && <span className="rounded-[5px] border border-brand-400/40 px-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-brand-300">Pro</span>}
                        </span>
                        <AnimatePresence initial={false}>
                          {on && (
                            <motion.span
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              className="block overflow-hidden"
                            >
                              <span className="block pt-2 text-[15px] leading-[1.5] text-[#b0b0b0]">{it.text}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                      <ChevronRight className={`mt-2.5 size-4 shrink-0 transition-all ${on ? "rotate-90 text-white" : "text-white/35"}`} />
                    </button>
                    {on && (
                      <span
                        key={`${active}-${paused}`}
                        className={`absolute -bottom-px left-0 h-px w-full origin-left bg-brand-400 ${paused ? "opacity-0" : "animate-progress"}`}
                        style={{ animationDuration: `${DURATION}ms` }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* podgląd kanału na tle poświaty */}
            <div className="relative order-first flex min-h-[420px] items-center justify-center overflow-hidden p-4 sm:p-10 lg:order-none lg:min-h-[460px]">
              <Curtain base="17 17 19" className="inset-0" />
              <div className="relative w-full max-w-[470px] overflow-hidden rounded-[14px] border border-white/[0.1] bg-[#313338] shadow-[0_40px_80px_-30px_rgb(0_0_0/1)]">
                <div className="flex h-11 items-center gap-2 border-b border-black/30 bg-[#2b2d31] px-4 text-[14px] font-semibold text-white">
                  <Hash className="size-[18px] text-white/40" />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={item.channel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                      {item.channel}
                    </motion.span>
                  </AnimatePresence>
                  <span className="ml-auto text-[12px] font-normal text-white/35">Kraina Graczy</span>
                </div>
                <div className="min-h-[300px] p-4">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Message item={item} accent={accent} />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-3 border-t border-black/30 bg-[#2b2d31] px-4 py-2.5">
                  <span className="text-[12px] text-white/45">Kolor akcentu</span>
                  <div className="flex gap-2">
                    {ACCENTS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setAccent(c)}
                        aria-label={`Kolor ${c}`}
                        className={`size-[18px] rounded-full transition-transform hover:scale-110 ${accent === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#2b2d31]" : ""}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        <p className="mt-6 text-[14.5px] leading-relaxed text-[#8b8b93]">
          …i {rest.length} kolejnych: {rest.map((m) => m.name).join(", ")}.
        </p>
      </div>
    </section>
  );
}

function Message({ item, accent }: { item: Item; accent: string | null }) {
  if (item.kind) {
    const base = MESSAGE_KINDS[item.kind].presets[0].template;
    return <CV2Preview template={{ ...base, accent: accent ?? base.accent }} vars={VARS} botName="Bociak" botColor="#5865f2" actions={item.actions} />;
  }
  if (item.custom === "mod") return <ModLog accent={accent ?? "#ed4245"} />;
  return <Poll accent={accent ?? "#5865f2"} />;
}

function BotLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <LogoMark round className="size-10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[14px] leading-tight">
          <span className="font-medium text-white">Bociak</span>
          <span className="rounded-[4px] bg-[#5865f2] px-1 py-px text-[9px] font-semibold uppercase text-white">✓ Bot</span>
          <span className="text-[11px] text-white/35">Dzisiaj o 18:42</span>
        </div>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}

const MOD = [
  { icon: ShieldAlert, color: "#ed4245", text: "Usunięto zaproszenie na inny serwer", sub: "automod · #ogólny · discord.gg/…" },
  { icon: Trash2, color: "#fee75c", text: "Usunięto link phishingowy", sub: "@nowy_user · #ogólny · d1scord-gift.ru" },
  { icon: MessageSquareX, color: "#eb459e", text: "Wyciszono @flooder na 10 min", sub: "anti-spam · 6 wiadomości w 5 s" },
  { icon: Gavel, color: "#8a93ff", text: "@troll zbanowany", sub: "przez @Moderator · powód: obrażanie" },
];

function ModLog({ accent }: { accent: string }) {
  return (
    <BotLine>
      <div className="max-w-[440px] space-y-2 rounded-lg border border-white/[0.06] bg-[#393a41]/60 p-3" style={{ borderLeft: `4px solid ${accent}` }}>
        {MOD.map((e, i) => (
          <motion.div key={e.text} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-md" style={{ background: `${e.color}22`, color: e.color }}>
              <e.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold text-white">{e.text}</div>
              <div className="truncate text-[12px] text-white/45">{e.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </BotLine>
  );
}

const POLL = [
  ["Minecraft", 46],
  ["Among Us", 31],
  ["CS2", 23],
] as const;

function Poll({ accent }: { accent: string }) {
  return (
    <BotLine>
      <div className="max-w-[440px] rounded-lg border border-white/[0.06] bg-[#393a41]/60 p-3.5" style={{ borderLeft: `4px solid ${accent}` }}>
        <div className="text-[16px] font-bold text-white">📊 W co gramy w piątek?</div>
        <div className="mt-3 space-y-2.5">
          {POLL.map(([label, pct], i) => (
            <div key={label}>
              <div className="flex justify-between text-[13px] text-[#dbdee1]">
                <span>{label}</span>
                <span className="text-white/50">{pct}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/30">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: accent }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11.5px] text-white/45">48 głosów · koniec za 2 dni</div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {POLL.map(([label]) => (
          <span key={label} className="rounded-[4px] bg-[#4e5058] px-3.5 py-1.5 text-[13px] font-medium text-white">
            {label}
          </span>
        ))}
      </div>
    </BotLine>
  );
}
