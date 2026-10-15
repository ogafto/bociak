"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { BociakGlyph } from "@/components/ui/logo";
import { ModuleIcon } from "@/components/ui/module-icon";
import { Reveal } from "./motion";
import { CONTAINER, Card, SectionIntro } from "./ui";

// „Jak to działa”: trzy karty kroków ułożone schodkowo, każda z małą animacją tego, co się dzieje.

const STEPS = [
  { title: "Dodaj Bociaka", text: "Klikasz „Dodaj Bociaka”, wybierasz serwer i zatwierdzasz. Bez tokenów i Developer Portalu.", visual: <AddVisual /> },
  { title: "Połącz serwer", text: "Panel daje Ci kod. Wpisujesz /polacz na swoim serwerze i gotowe.", visual: <LinkVisual /> },
  { title: "Włącz moduły", text: "Przełącznikami włączasz to, czego potrzebujesz. Zmiany działają od razu.", visual: <ModulesVisual /> },
];

export function HowItWorks() {
  return (
    <section id="jak-to-dziala" className="scroll-mt-20 py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionIntro center label="Jak to działa" title="Od zera do działającego bota" muted="w dwie minuty." />
        <div className="mx-auto mt-14 grid max-w-[1000px] grid-cols-1 gap-4 md:grid-cols-3 md:pb-14">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} tilt className={i === 1 ? "md:translate-y-14" : ""}>
              <Card className="h-full p-6">
                <div className="text-[15px] text-brand-300">Krok {i + 1}</div>
                <div className="relative mt-5 grid h-44 place-items-center">{s.visual}</div>
                <h3 className="mt-6 text-[20px] font-normal tracking-[-0.02em] text-white">{s.title}</h3>
                <p className="mt-2 text-[15.5px] leading-[1.5] text-[#b0b0b0]">{s.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[270px] rounded-[12px] border border-white/[0.08] bg-[#18181b] p-4 shadow-[0_24px_50px_-20px_rgb(0_0_0/0.9)]">{children}</div>;
}

function AddVisual() {
  const [clicked, setClicked] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setClicked((c) => !c), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <Shell>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-500 text-white">
          <BociakGlyph className="size-6" />
        </span>
        <div className="text-[12.5px] leading-tight text-white/60">
          <b className="text-white">Bociak</b> chce dołączyć
          <br />
          do Twojego serwera
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-[12.5px] text-white/80">
        Kraina Graczy <ChevronDown className="size-3.5 text-white/40" />
      </div>
      <motion.div
        animate={clicked ? { scale: 0.96 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className={`mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium text-white transition-colors ${clicked ? "bg-dc-green text-ink-950" : "bg-brand-500"}`}
      >
        {clicked ? (
          <>
            <Check className="size-4" strokeWidth={3} /> Dodano
          </>
        ) : (
          "Autoryzuj"
        )}
      </motion.div>
    </Shell>
  );
}

const COMMAND = "/polacz kod:8VDNL6";

function LinkVisual() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x + 1) % (COMMAND.length + 14)), 110);
    return () => clearInterval(id);
  }, []);
  const typed = COMMAND.slice(0, Math.min(n, COMMAND.length));
  const done = n > COMMAND.length + 1;
  return (
    <Shell>
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 rounded-md border-l-4 border-dc-green bg-[#2b2d31] px-3 py-2 text-[12px] text-white"
          >
            ✅ <b>Serwer połączony!</b>
            <div className="text-[11px] text-white/50">Wróć do panelu i włącz moduły.</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2 rounded-lg bg-[#383a40] px-3 py-2.5 font-mono text-[12.5px] text-white">
        <span className="text-brand-300">{typed.split(" ")[0]}</span>
        <span>{typed.includes(" ") ? typed.slice(typed.indexOf(" ")) : ""}</span>
        <span className="-ml-1.5 h-4 w-px animate-blink bg-white" />
      </div>
    </Shell>
  );
}

const TOGGLES = [
  { name: "Powitania", icon: "party" },
  { name: "Moderacja", icon: "shield" },
  { name: "Tickety", icon: "ticket" },
];

function ModulesVisual() {
  const [on, setOn] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setOn((n) => (n % 3) + 1), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mx-auto w-full max-w-[270px] space-y-2">
      {TOGGLES.map((t, i) => {
        const active = i < on;
        return (
          <div key={t.name} className={`flex items-center gap-3 rounded-[10px] border px-3 py-2 transition-colors duration-300 ${active ? "border-brand-500/50 bg-brand-500/[0.12]" : "border-white/[0.08] bg-[#18181b]"}`}>
            <span className={`grid size-8 place-items-center rounded-lg transition-colors duration-300 ${active ? "bg-brand-500 text-white" : "bg-white/[0.06] text-white/50"}`}>
              <ModuleIcon name={t.icon} className="size-4" />
            </span>
            <span className="flex-1 text-[13.5px] font-medium text-white">{t.name}</span>
            <span className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors duration-300 ${active ? "bg-brand-500" : "bg-white/10"}`}>
              <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} className={`size-5 rounded-full bg-white ${active ? "ml-auto" : ""}`} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
