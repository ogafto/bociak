"use client";

import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Pojawianie się elementu przy przewijaniu: wjazd z dołu i wyostrzenie. `tilt` dodaje przechył 3D. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  tilt = false,
  className = "",
  id,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  tilt?: boolean;
  className?: string;
  id?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      id={id}
      className={className}
      initial={reduce ? false : { opacity: 0, y: tilt ? y + 20 : y, filter: "blur(8px)", rotateX: tilt ? 16 : 0, transformPerspective: 1100 }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0, transitionEnd: { filter: "none" } }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: tilt ? 1.1 : 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Tekst odsłaniany słowo po słowie (wjazd z dołu, rozmycie → ostrość). */
export function Words({ text, delay = 0, className = "", onLoad = false }: { text: string; delay?: number; className?: string; onLoad?: boolean }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const anim = { opacity: 1, y: "0%", filter: "blur(0px)" };
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block will-change-transform"
          initial={reduce ? false : { opacity: 0, y: "40%", filter: "blur(10px)" }}
          {...(onLoad ? { animate: anim } : { whileInView: anim, viewport: { once: true, margin: "-40px" } })}
          transition={{ duration: 0.9, delay: delay + i * 0.06, ease: EASE }}
        >
          {w}
          {i < words.length - 1 && " "}
        </motion.span>
      ))}
    </span>
  );
}

/** Ustawia --mx/--my na karcie pod kursorem – z tego korzysta reflektor [data-spot] w CSS. */
export function SpotlightTracker() {
  useEffect(() => {
    let last: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-spot]") as HTMLElement | null;
      if (!el) return;
      if (last && last !== el) last.style.removeProperty("--mx");
      last = el;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}

/** Element przesuwający się wolniej niż strona (paralaksa) – np. poświata w hero. */
export function Parallax({ children, distance = 200, className = "" }: { children: ReactNode; distance?: number; className?: string }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, reduce ? 0 : distance]);
  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Pojawienie się przy wejściu na stronę (bez czekania na przewinięcie). */
export function Enter({ children, delay = 0, y = 16, className = "" }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Licznik, który „nabija się” do wartości, gdy pojawi się na ekranie. */
export function CountUp({ to, className = "" }: { to: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(0, to, { duration: 1.4, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [to, reduce, inView]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {n.toLocaleString("pl-PL")}
    </span>
  );
}

/** Pasek postępu, który wypełnia się płynnie. */
export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
        className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300 shadow-[0_0_12px_rgb(138_147_255/0.7)]"
      />
    </div>
  );
}
