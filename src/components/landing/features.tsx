"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown, Hash } from "lucide-react";
import { MESSAGE_KINDS } from "@/lib/message";
import { CV2Preview } from "@/components/ui/cv2-preview";
import { ModuleIcon } from "@/components/ui/module-icon";
import { Curtain } from "./curtain";
import { Reveal } from "./motion";
import { CONTAINER, Card, SectionIntro } from "./ui";

// „Funkcje”: trzy karty. Na górze każdej żyje mała scenka z panelu na tle poświaty, pod spodem opis.

export function Features() {
  return (
    <section id="funkcje" className="scroll-mt-20 py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionIntro label="Co robi Bociak" title="Mniej klikania w Discordzie." muted="Więcej czasu na społeczność." />
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCard delay={0} title="Ustawiasz w panelu" text="Kanały i role wybierasz z listy. Bez komend, bez kopiowania ID i bez szukania w ustawieniach Discorda." visual={<SettingsScene />} />
          <FeatureCard delay={0.08} title="Wygląda tak, jak chcesz" text="Gotowe style wiadomości i kolory za darmo, pełny kreator w Pro. Podgląd widzisz, zanim zapiszesz." visual={<StyleScene />} />
          <FeatureCard delay={0.16} title="Działa 24/7" text="Bociak pracuje na naszych serwerach. Nie musisz mieć włączonego komputera ani płacić za hosting." visual={<LiveScene />} />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, text, visual, delay }: { title: string; text: string; visual: ReactNode; delay: number }) {
  return (
    <Reveal delay={delay} tilt>
      <Card className="h-full p-2">
        <div className="relative grid h-[300px] place-items-center overflow-hidden rounded-[12px]">
          <Curtain base="17 17 19" className="inset-0" />
          <div className="relative w-full px-6">{visual}</div>
        </div>
        <div className="px-4 pb-5 pt-5">
          <h3 className="text-[20px] font-normal tracking-[-0.02em] text-white">{title}</h3>
          <p className="mt-2 text-[15.5px] leading-[1.5] text-[#b0b0b0]">{text}</p>
        </div>
      </Card>
    </Reveal>
  );
}

/** Mini okno: ciemne, z cienką ramką – jak wycinek prawdziwego panelu. */
function Window({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[270px] rounded-[12px] border border-white/[0.09] bg-[#121214]/95 p-3.5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-[12.5px] font-medium text-white">
        {title}
        {right}
      </div>
      {children}
    </div>
  );
}

const CHANNELS = ["ogólny", "witamy", "zasady", "memy"];

function SettingsScene() {
  const [pick, setPick] = useState(1);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let step = 0;
    const id = setInterval(() => {
      step = (step + 1) % 4;
      if (step === 1) setOpen(true);
      if (step === 2) setPick((p) => (p + 1) % CHANNELS.length);
      if (step === 3) setOpen(false);
    }, 900);
    return () => clearInterval(id);
  }, []);
  return (
    <Window
      title="Powitania"
      right={
        <span className="flex h-[18px] w-8 items-center rounded-full bg-brand-500 p-[2px]">
          <span className="ml-auto size-[14px] rounded-full bg-white" />
        </span>
      }
    >
      <div className="text-[11px] text-white/45">Kanał powitań</div>
      <div className="relative mt-1.5">
        <div className={`flex items-center gap-1.5 rounded-[8px] border bg-black/30 px-2.5 py-2 text-[12.5px] text-white transition-colors ${open ? "border-brand-400/60" : "border-white/[0.08]"}`}>
          <Hash className="size-3.5 text-white/40" />
          {CHANNELS[pick]}
          <ChevronDown className={`ml-auto size-3.5 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-x-0 top-[calc(100%+4px)] z-10 rounded-[8px] border border-white/[0.1] bg-[#1a1a1d] p-1 shadow-xl"
            >
              {CHANNELS.map((c, i) => (
                <div key={c} className={`flex items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[12px] ${i === pick ? "bg-brand-500/20 text-white" : "text-white/60"}`}>
                  <Hash className="size-3 text-white/35" /> {c}
                  {i === pick && <Check className="ml-auto size-3 text-brand-300" />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-3 text-[11px] text-white/45">Rola dla nowych osób</div>
      <div className="mt-1.5 flex items-center gap-1.5 rounded-[8px] border border-white/[0.08] bg-black/30 px-2.5 py-2 text-[12.5px] text-white">
        <span className="size-2.5 rounded-full bg-dc-green" /> Nowy
        <ChevronDown className="ml-auto size-3.5 text-white/40" />
      </div>
    </Window>
  );
}

const ACCENTS = ["#5865f2", "#eb459e", "#57f287", "#fee75c"];
const WELCOME_VARS = Object.fromEntries(MESSAGE_KINDS.welcome.vars.map((v) => [v.key, v.example]));

function StyleScene() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % ACCENTS.length), 1800);
    return () => clearInterval(id);
  }, []);
  const base = MESSAGE_KINDS.welcome.presets[0].template;
  return (
    <div className="mx-auto w-full max-w-[290px]">
      <div className="rounded-[12px] border border-white/[0.09] bg-[#313338] p-3.5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)] [zoom:0.8]">
        <CV2Preview template={{ ...base, accent: ACCENTS[i] }} vars={WELCOME_VARS} botName="Bociak" botColor="#5865f2" />
      </div>
      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-white/[0.09] bg-[#121214]/95 px-3 py-1.5">
        {ACCENTS.map((c, k) => (
          <span key={c} className={`size-3.5 rounded-full transition-transform duration-300 ${k === i ? "scale-125 ring-2 ring-white/80 ring-offset-2 ring-offset-[#121214]" : ""}`} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

const EVENTS = [
  ["shield", "Moderacja", "usunięto link phishingowy"],
  ["party", "Powitania", "przywitano @Kasia"],
  ["ticket", "Tickety", "otwarto ticket #0142"],
  ["trending", "Poziomy", "@Ola wbija poziom 12"],
  ["scroll", "Logi", "zapisano edycję w #memy"],
];

function LiveScene() {
  const [n, setN] = useState(2);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), 1700);
    return () => clearInterval(id);
  }, []);
  const rows = Array.from({ length: 3 }, (_, k) => ({ key: n - k, e: EVENTS[(n - k) % EVENTS.length] }));
  return (
    <Window
      title="Na żywo"
      right={
        <span className="flex items-center gap-1.5 rounded-full border border-dc-green/30 px-2 py-0.5 text-[10.5px] text-dc-green">
          <span className="size-1.5 animate-pulse rounded-full bg-dc-green" /> online
        </span>
      }
    >
      <div className="space-y-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map(({ key, e }) => (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 rounded-[8px] border border-white/[0.06] bg-black/25 px-2.5 py-2"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-[6px] bg-brand-500/20 text-brand-300">
                <ModuleIcon name={e[0]} className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-white">{e[1]}</div>
                <div className="truncate text-[11px] text-white/45">{e[2]}</div>
              </div>
              <span className="text-[10px] text-white/30">teraz</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Window>
  );
}
