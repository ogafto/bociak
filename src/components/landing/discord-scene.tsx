"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AtSign, Bell, ChevronDown, Hash, Headphones, Mic, Pin, Plus, Search, Settings, Users, Volume2 } from "lucide-react";
import { MESSAGE_KINDS } from "@/lib/message";
import { CV2Preview } from "@/components/ui/cv2-preview";
import { LogoMark } from "@/components/ui/logo";
import { ModuleIcon } from "@/components/ui/module-icon";

// Scena pod hero: okno Discorda, w którym Bociak „na żywo” obsługuje serwer – wita nową osobę,
// ogłasza konkurs, usuwa spam i gratuluje awansu (wiadomości w Components V2). Scenariusz się zapętla.
// Na komputerze okno ma stały rozmiar i jest skalowane, a przy przewijaniu prostuje się z 3D;
// po bokach unoszą się karty z panelu. Na telefonie zostaje sam czat w naturalnym rozmiarze.

const W = 1120;
const H = 640;

type Msg =
  | { id: number; kind: "join"; name: string }
  | { id: number; kind: "user"; name: string; color: string; text: string; spam?: boolean }
  | { id: number; kind: "bot"; card: "welcome" | "giveaway" | "level" | "mod" };

const SCRIPT: Msg[] = [
  { id: 1, kind: "join", name: "Kasia" },
  { id: 2, kind: "bot", card: "welcome" },
  { id: 3, kind: "user", name: "Michał", color: "#57f287", text: "ktoś wbija na giveaway? 🎁" },
  { id: 4, kind: "bot", card: "giveaway" },
  { id: 5, kind: "user", name: "nowy_user", color: "#fee75c", text: "darmowe nitro 👉 d1scord-gift.ru/claim", spam: true },
  { id: 6, kind: "bot", card: "mod" },
  { id: 7, kind: "user", name: "Ola", color: "#eb459e", text: "w końcu 12 lvl 😎" },
  { id: 8, kind: "bot", card: "level" },
];

const VARS = Object.fromEntries(Object.values(MESSAGE_KINDS).flatMap((k) => k.vars.map((v) => [v.key, v.example])));
const LEVEL_VARS = { ...VARS, user: "<@Ola>", username: "Ola", level: "12" };

/** Steruje scenariuszem: kolejne wiadomości, „Bociak pisze…” przed odpowiedzią bota, potem pętla. */
function useScript(active: boolean) {
  const [step, setStep] = useState(1);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!active) return;
    let t2: ReturnType<typeof setTimeout> | undefined;
    if (step >= SCRIPT.length) {
      const t = setTimeout(() => setStep(0), 4200);
      return () => clearTimeout(t);
    }
    const next = SCRIPT[step];
    const t1 = setTimeout(
      () => {
        if (next.kind === "bot") {
          setTyping(true);
          t2 = setTimeout(() => {
            setTyping(false);
            setStep((s) => s + 1);
          }, 950);
        } else setStep((s) => s + 1);
      },
      step === 0 ? 700 : 1700,
    );
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [step, active]);
  return { visible: SCRIPT.slice(0, step), typing, spamRemoved: step >= 6 };
}

export function DiscordScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(W);
  const inView = useInView(wrap, { margin: "200px" });
  const { visible, typing, spamRemoved } = useScript(inView);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [26, 0]);
  const scaleIn = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.88, 1]);
  const leftY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [140, 0]);
  const rightY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [220, 0]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = width < 760;
  const scale = Math.min(1, width / W);
  const chat = <Chat visible={visible} typing={typing} spamRemoved={spamRemoved} />;

  if (compact) {
    return (
      <div ref={wrap} className="mx-auto w-full max-w-[520px]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 60, rotateX: 18, transformPerspective: 1000 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-[18px] border border-white/[0.1] bg-[#313338] shadow-[0_40px_80px_-30px_rgb(0_0_0/1)]"
        >
          <ChatHeader />
          <div className="h-[520px]">{chat}</div>
          <ChatInput />
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={wrap} className="relative mx-auto w-full max-w-[1120px] [perspective:2200px]" style={{ height: H * scale }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <motion.div style={{ rotateX, scale: scaleIn, transformOrigin: "50% 0%" }} className="absolute inset-x-0 top-0 flex justify-center [transform-style:preserve-3d]">
          <div className="relative [transform-style:preserve-3d]" style={{ width: W * scale, height: H * scale }}>
            <div className="absolute left-0 top-0 origin-top-left [transform-style:preserve-3d]" style={{ width: W, height: H, transform: `scale(${scale})` }}>
              {/* okno Discorda */}
              <div className="absolute inset-0 overflow-hidden rounded-[18px] border border-white/[0.1] bg-[#313338] text-left shadow-[0_80px_160px_-40px_rgb(0_0_0/1),0_0_0_1px_rgb(0_0_0/0.6)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className="grid h-full grid-cols-[72px_232px_1fr_220px] grid-rows-[minmax(0,1fr)]">
                  <Rail />
                  <Channels />
                  <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                    <ChatHeader />
                    <div className="min-h-0 flex-1">{chat}</div>
                    <ChatInput />
                  </div>
                  <Members />
                </div>
              </div>

              {/* pływające karty z panelu */}
              <motion.div style={{ y: leftY }} className="absolute -left-16 top-[390px] w-[250px] [transform-style:preserve-3d]">
                <div className="animate-hover-y [transform:translateZ(90px)]">
                  <FloatCard>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-[9px] bg-brand-500 text-white">
                        <ModuleIcon name="party" className="size-4" />
                      </span>
                      <div className="flex-1">
                        <div className="text-[13.5px] font-medium text-white">Powitania</div>
                        <div className="text-[11.5px] text-white/45">Moduł włączony</div>
                      </div>
                      <span className="flex h-5 w-9 items-center rounded-full bg-brand-500 p-[2px]">
                        <span className="ml-auto size-4 rounded-full bg-white" />
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-[12px]">
                      {[
                        ["Kanał", "# witamy"],
                        ["Styl", "Z miniaturką"],
                        ["Rola", "@Nowy"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between rounded-[8px] bg-white/[0.04] px-2.5 py-1.5">
                          <span className="text-white/45">{k}</span>
                          <span className="text-white/85">{v}</span>
                        </div>
                      ))}
                    </div>
                  </FloatCard>
                </div>
              </motion.div>

              <motion.div style={{ y: rightY }} className="absolute -right-14 bottom-16 w-[230px] [transform-style:preserve-3d]">
                <div className="animate-hover-y [animation-delay:-2.5s] [transform:translateZ(130px)]">
                  <FloatCard>
                    <div className="flex items-center justify-between text-[12px] text-white/50">
                      Automod · dzisiaj
                      <span className="flex items-center gap-1 text-dc-green">
                        <span className="size-1.5 animate-pulse rounded-full bg-dc-green" /> aktywny
                      </span>
                    </div>
                    <div className="mt-1.5 font-heading text-[30px] font-medium tracking-[-0.04em] text-white">14</div>
                    <div className="text-[12px] text-white/45">usuniętych spamów i linków</div>
                    <div className="mt-3 flex h-10 items-end gap-1">
                      {[30, 55, 20, 70, 45, 90, 60, 35, 80, 50].map((h, i) => (
                        <motion.span
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="flex-1 rounded-sm bg-gradient-to-t from-brand-600 to-brand-300"
                        />
                      ))}
                    </div>
                  </FloatCard>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FloatCard({ children }: { children: ReactNode }) {
  return <div className="rounded-[16px] border border-white/[0.1] bg-[#18181b]/90 p-3.5 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.95),0_0_0_1px_rgb(0_0_0/0.4)] backdrop-blur-xl">{children}</div>;
}

function Rail() {
  return (
    <div className="flex flex-col items-center gap-2 bg-[#1e1f22] py-3">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#313338] text-white/80">
        <AtSign className="size-5" />
      </span>
      <span className="h-0.5 w-8 rounded bg-white/[0.06]" />
      <div className="relative">
        <span className="absolute -left-3 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r bg-white" />
        <span className="grid size-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#eb459e,#5865f2)] text-[14px] font-bold text-white">KG</span>
      </div>
      {["#57f287", "#fee75c"].map((c, i) => (
        <span key={c} className="grid size-12 place-items-center rounded-full bg-[#313338] text-[13px] font-semibold" style={{ color: c }}>
          {["MC", "AU"][i]}
        </span>
      ))}
      <span className="grid size-12 place-items-center rounded-full bg-[#313338] text-dc-green">
        <Plus className="size-5" />
      </span>
    </div>
  );
}

const CHANNELS: [string, [string, boolean?][]][] = [
  ["Informacje", [["witamy", true], ["zasady"], ["ogłoszenia"]]],
  ["Czat", [["ogólny"], ["memy"], ["konkursy"]]],
];

function Channels() {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden bg-[#2b2d31]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/30 px-4 text-[15px] font-semibold text-white">
        Kraina Graczy <ChevronDown className="size-4" />
      </div>
      <div className="flex-1 space-y-4 px-2 py-4">
        {CHANNELS.map(([cat, list]) => (
          <div key={cat}>
            <div className="flex items-center gap-1 px-1.5 text-[11.5px] font-semibold uppercase tracking-[0.02em] text-white/45">
              <ChevronDown className="size-3" /> {cat}
            </div>
            <div className="mt-1 space-y-px">
              {list.map(([name, on]) => (
                <div key={name} className={`flex items-center gap-1.5 rounded-[5px] px-2 py-1.5 text-[15px] ${on ? "bg-white/[0.08] text-white" : "text-white/50"}`}>
                  <Hash className="size-[18px] text-white/40" /> {name}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="flex items-center gap-1 px-1.5 text-[11.5px] font-semibold uppercase tracking-[0.02em] text-white/45">
            <ChevronDown className="size-3" /> Głosowe
          </div>
          <div className="mt-1 flex items-center gap-1.5 rounded-[5px] px-2 py-1.5 text-[15px] text-white/50">
            <Volume2 className="size-[18px] text-white/40" /> Lobby
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 bg-[#232428] px-2.5 py-2">
        <span className="relative grid size-8 place-items-center rounded-full bg-[#5865f2] text-[12px] font-bold text-white">
          K<span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-[2.5px] border-[#232428] bg-dc-green" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[13.5px] font-medium text-white">Kuba</div>
          <div className="text-[11.5px] text-white/45">Online</div>
        </div>
        <Mic className="size-[18px] text-white/60" />
        <Headphones className="size-[18px] text-white/60" />
        <Settings className="size-[18px] text-white/60" />
      </div>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-black/30 px-4">
      <Hash className="size-5 text-white/40" />
      <span className="text-[15px] font-semibold text-white">witamy</span>
      <span className="mx-2 hidden h-5 w-px bg-white/10 sm:block" />
      <span className="hidden truncate text-[13px] text-white/45 sm:block">Przywitaj się z nowymi osobami!</span>
      <div className="ml-auto flex items-center gap-3.5 text-white/55">
        <Bell className="size-[18px]" />
        <Pin className="size-[18px]" />
        <Users className="size-[18px]" />
        <span className="hidden items-center gap-1 rounded-[4px] bg-[#1e1f22] px-2 py-1 text-[12px] text-white/40 sm:flex">
          Szukaj <Search className="size-3" />
        </span>
      </div>
    </div>
  );
}

function ChatInput() {
  return (
    <div className="shrink-0 px-4 pb-5 pt-1">
      <div className="flex h-11 items-center gap-3 rounded-[8px] bg-[#383a40] px-4 text-[14.5px] text-white/35">
        <span className="grid size-6 place-items-center rounded-full bg-white/50 text-[#383a40]">
          <Plus className="size-4" strokeWidth={3} />
        </span>
        Napisz na #witamy
      </div>
    </div>
  );
}

function Chat({ visible, typing, spamRemoved }: { visible: Msg[]; typing: boolean; spamRemoved: boolean }) {
  return (
    <div className="relative flex h-full flex-col justify-end overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_70px)]">
      <div className="space-y-4 px-4 pb-3">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.slice(-5).map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.98, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <Message m={m} spamRemoved={spamRemoved} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="h-6 shrink-0 px-4 text-[12.5px] text-white/60">
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="size-1.5 rounded-full bg-white/70" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </span>
              <b className="font-semibold text-white">Bociak</b> pisze…
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Message({ m, spamRemoved }: { m: Msg; spamRemoved: boolean }) {
  if (m.kind === "join")
    return (
      <div className="flex items-center gap-3 pl-3 text-[14px] text-white/55">
        <span className="text-dc-green">→</span>
        <span>
          <b className="font-medium text-white">{m.name}</b> dołączyła do serwera. Witamy!
        </span>
        <span className="text-[11px] text-white/30">Dzisiaj o 18:42</span>
      </div>
    );

  if (m.kind === "user") {
    const removed = m.spam && spamRemoved;
    return (
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full text-[14px] font-bold text-[#1e1f22]" style={{ background: m.color }}>
          {m.name[0].toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-medium" style={{ color: m.color }}>
              {m.name}
            </span>
            <span className="text-[11px] text-white/35">Dzisiaj o 18:43</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {removed ? (
              <motion.div key="removed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[14.5px] italic text-white/35">
                Wiadomość usunięta przez Bociaka
              </motion.div>
            ) : (
              <motion.div key="text" exit={{ opacity: 0, x: 10, filter: "blur(4px)" }} className="text-[15px] text-[#dbdee1]">
                {m.spam ? (
                  <>
                    darmowe nitro 👉 <span className="text-[#00a8fc] underline">d1scord-gift.ru/claim</span>
                  </>
                ) : (
                  m.text
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (m.card === "mod")
    return (
      <div className="flex gap-3">
        <LogoMark round className="size-10" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[14px] leading-tight">
            <span className="font-medium text-white">Bociak</span>
            <span className="rounded-[4px] bg-[#5865f2] px-1 py-px text-[9px] font-semibold uppercase text-white">✓ Bot</span>
            <span className="text-[11px] text-white/35">Dzisiaj o 18:43</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-[#393a41]/60 px-3 py-2 text-[14px] text-[#dbdee1]" style={{ borderLeft: "4px solid #ed4245" }}>
            🛡️ Usunąłem podejrzany link od <span className="rounded bg-[#5865f2]/30 px-0.5 text-[#c9cdfb]">@nowy_user</span>
          </div>
        </div>
      </div>
    );

  if (m.card === "welcome") return <CV2Preview template={MESSAGE_KINDS.welcome.presets[0].template} vars={VARS} botName="Bociak" botColor="#5865f2" />;
  if (m.card === "giveaway") return <CV2Preview template={MESSAGE_KINDS.giveaway.presets[0].template} vars={VARS} botName="Bociak" botColor="#5865f2" actions={["🎉 Biorę udział"]} />;
  return <CV2Preview template={MESSAGE_KINDS.levelup.presets[0].template} vars={LEVEL_VARS} botName="Bociak" botColor="#5865f2" />;
}

function Members() {
  const people: [string, string, string][] = [
    ["Kasia", "#eb459e", "Nowa na serwerze"],
    ["Michał", "#57f287", "Gra w Minecraft"],
    ["Ola", "#fee75c", ""],
    ["Bartek", "#22d3ee", ""],
    ["Kuba", "#5865f2", ""],
  ];
  return (
    <div className="min-h-0 overflow-hidden bg-[#2b2d31] px-3 py-5">
      <div className="px-1 text-[11.5px] font-semibold uppercase tracking-[0.02em] text-white/45">Bot — 1</div>
      <div className="mt-2 flex items-center gap-2.5 rounded-[6px] bg-white/[0.04] px-2 py-1.5">
        <span className="relative">
          <LogoMark round className="size-8" />
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-[2.5px] border-[#2b2d31] bg-dc-green" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1 text-[14px] font-medium text-white">
            Bociak <span className="rounded-[3px] bg-[#5865f2] px-1 text-[8.5px] font-semibold uppercase leading-[14px]">✓ Bot</span>
          </div>
          <div className="truncate text-[11.5px] text-white/45">Pilnuje serwera</div>
        </div>
      </div>
      <div className="mt-5 px-1 text-[11.5px] font-semibold uppercase tracking-[0.02em] text-white/45">Online — {people.length}</div>
      <div className="mt-2 space-y-1">
        {people.map(([n, c, s]) => (
          <div key={n} className="flex items-center gap-2.5 px-2 py-1">
            <span className="relative grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold text-[#1e1f22]" style={{ background: c }}>
              {n[0]}
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-[2.5px] border-[#2b2d31] bg-dc-green" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-[14px] text-white/80">{n}</div>
              {s && <div className="truncate text-[11.5px] text-white/40">{s}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
