import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal, Words } from "./motion";

// Wspólne klocki landingu: kontener, etykieta sekcji, dwukolorowy nagłówek, przyciski i karta.

export const CONTAINER = "mx-auto w-full max-w-[1140px] px-5 sm:px-8";

/** Mała etykieta nad nagłówkiem: kreska w kolorze marki i tekst wersalikami. */
export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.12em] text-brand-300">
      <span className="h-[5px] w-3 rounded-full bg-brand-400 shadow-[0_0_10px_rgb(138_147_255/0.8)]" />
      {children}
    </div>
  );
}

/** Nagłówek sekcji: pierwsza linia biała, druga przygaszona; słowa wjeżdżają po kolei. */
export function SectionIntro({ label, title, muted, children, center = false, className = "" }: { label: string; title: string; muted?: string; children?: ReactNode; center?: boolean; className?: string }) {
  return (
    <div className={`${center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      <Reveal y={10}>
        <Label>{label}</Label>
      </Reveal>
      <h2 className="mt-5 text-balance text-[2.3rem] font-medium leading-[1.04] tracking-[-0.045em] text-white sm:text-[3.2rem]">
        <Words text={title} />
        {muted && (
          <>
            <br />
            <Words text={muted} delay={0.12} className="text-[#8b8b93]" />
          </>
        )}
      </h2>
      {children && (
        <Reveal delay={0.2} y={12}>
          <p className={`mt-5 max-w-lg text-[16.5px] leading-relaxed text-[#a0a0a8] ${center ? "mx-auto" : ""}`}>{children}</p>
        </Reveal>
      )}
    </div>
  );
}

const VARIANT = {
  light:
    "bg-[linear-gradient(180deg,#ffffff,#e9e9f0)] text-[#0d0d0f] shadow-[inset_0_-2px_0_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.5),0_0_0_1px_rgb(255_255_255/0.1)] hover:shadow-[inset_0_-2px_0_rgb(0_0_0/0.12),0_10px_40px_-10px_rgb(138_147_255/0.9),0_0_0_1px_rgb(255_255_255/0.25)]",
  dark: "border border-transparent text-white [background:linear-gradient(#141416,#141416)_padding-box,linear-gradient(180deg,rgb(255_255_255/0.2),rgb(255_255_255/0.05))_border-box] hover:[background:linear-gradient(#1a1a1e,#1a1a1e)_padding-box,linear-gradient(180deg,rgb(181_187_255/0.6),rgb(255_255_255/0.08))_border-box]",
};
const SIZE = {
  sm: "h-9 rounded-[10px] px-4 text-[14px]",
  md: "h-12 rounded-[12px] px-5 text-[15px]",
};

/**
 * Przycisk: po najechaniu tekst „przewija się” w górę (wjeżdża jego kopia), przez przycisk
 * przelatuje połysk, a strzałka przesuwa się w kółeczku.
 */
export function Button({ href, children, variant = "light", size = "md", arrow = false, external = false, className = "" }: { href: string; children: ReactNode; variant?: keyof typeof VARIANT; size?: keyof typeof SIZE; arrow?: boolean; external?: boolean; className?: string }) {
  const cls = `group/btn relative inline-flex items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap font-medium transition-[box-shadow,background] duration-300 active:scale-[0.98] ${VARIANT[variant]} ${SIZE[size]} ${className}`;
  const inner = (
    <>
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/btn:-translate-y-full">{children}</span>
        <span aria-hidden className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/btn:translate-y-0">
          {children}
        </span>
      </span>
      {arrow && (
        <span className={`relative grid size-6 place-items-center overflow-hidden rounded-full ${variant === "light" ? "bg-[#0d0d0f] text-white" : "bg-white text-[#0d0d0f]"}`}>
          <ArrowRight className="size-3.5 transition-transform duration-500 group-hover/btn:translate-x-[150%]" />
          <ArrowRight className="absolute size-3.5 -translate-x-[150%] transition-transform duration-500 group-hover/btn:translate-x-0" />
        </span>
      )}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent ${variant === "light" ? "via-white/80" : "via-white/10"} to-transparent opacity-0 transition-[left,opacity] duration-700 group-hover/btn:left-[120%] group-hover/btn:opacity-100`}
      />
    </>
  );
  if (external) return <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
  if (href.startsWith("#")) return <a href={href} className={cls}>{inner}</a>;
  return <Link href={href} className={cls}>{inner}</Link>;
}

/** Karta. `data-spot` daje reflektor i świecącą krawędź podążające za kursorem. */
export function Card({ children, className = "", tone = "base" }: { children: ReactNode; className?: string; tone?: "base" | "raised" }) {
  return (
    <div data-spot className={`relative overflow-hidden rounded-2xl border border-white/[0.06] ${tone === "raised" ? "bg-[#141416]" : "bg-[#111113]"} ${className}`}>
      {children}
    </div>
  );
}
