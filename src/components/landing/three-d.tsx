"use client";

import { useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { BociakGlyph } from "@/components/ui/logo";

// Efekty 3D zrobione samym CSS (perspektywa + transformacje) – lekkie, bez bibliotek WebGL.

/** Karta, która przechyla się w 3D za kursorem, z odblaskiem światła. */
export function Tilt({ children, className = "", max = 9 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  return (
    <div
      ref={ref}
      className={`group/tilt relative [transform-style:preserve-3d] transition-transform duration-300 ease-out will-change-transform ${className}`}
      onMouseMove={(e) => {
        if (reduce || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        ref.current.style.transform = `perspective(1100px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(0)`;
        ref.current.style.setProperty("--gx", `${x * 100}%`);
        ref.current.style.setProperty("--gy", `${y * 100}%`);
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
      {/* odblask światła */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [background:radial-gradient(500px_circle_at_var(--gx,50%)_var(--gy,50%),rgb(255_255_255/0.09),transparent_45%)] group-hover/tilt:opacity-100" />
    </div>
  );
}

/** Logo Bociaka jako bryła 3D – warstwy dają grubość, całość powoli się obraca. */
export function Logo3D({ size = 220 }: { size?: number }) {
  const layers = 14;
  return (
    <div className="[perspective:900px]" style={{ width: size, height: size }} aria-hidden>
      <div className="relative size-full animate-spin-3d [transform-style:preserve-3d]">
        {Array.from({ length: layers }, (_, i) => {
          const face = i === 0 || i === layers - 1; // przód i tył mają znak, środek to „grubość”
          return (
            <div
              key={i}
              className="absolute inset-0 grid place-items-center rounded-[28%]"
              style={{
                transform: `translateZ(${(i - (layers - 1) / 2) * 2.2}px)${i === 0 ? " rotateY(180deg)" : ""}`,
                background: face ? "linear-gradient(145deg,#9aa2ff,#5865f2 50%,#3c45a5)" : `rgb(${40 + i * 3} ${44 + i * 3} ${120 + i * 6})`,
                boxShadow: face ? "inset 0 2px 0 rgb(255 255 255 / 0.35)" : undefined,
              }}
            >
              {face && <BociakGlyph className="size-[64%] text-white drop-shadow-[0_6px_14px_rgb(0_0_0/0.35)]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
