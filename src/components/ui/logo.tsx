import Link from "next/link";
import { useId } from "react";
import { BRAND } from "@/lib/catalog";

// Sygnet Bociaka: mała litera „b” z oczami w brzuszku. Oczy są wycięte maską,
// więc prześwituje przez nie tło kafelka.
export function BociakGlyph({ className = "size-full" }: { className?: string }) {
  const mask = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <mask id={mask}>
        <rect x="12" y="7" width="11" height="49" rx="5.5" fill="#fff" />
        <rect x="12" y="23" width="41" height="33" rx="16.5" fill="#fff" />
        <rect x="12" y="38" width="22" height="18" rx="5.5" fill="#fff" />
        <rect x="28" y="33" width="6.5" height="11" rx="3.25" fill="#000" />
        <rect x="40" y="33" width="6.5" height="11" rx="3.25" fill="#000" />
      </mask>
      <rect width="64" height="64" fill="currentColor" mask={`url(#${mask})`} />
    </svg>
  );
}

export function LogoMark({ className = "size-8", round = false }: { className?: string; round?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center ${round ? "rounded-full" : "rounded-[28%]"} bg-[linear-gradient(145deg,#8f98ff,#5865f2_50%,#4752c4)] text-white shadow-[0_0_24px_-6px_rgb(88_101_242/0.8),inset_0_1px_0_rgb(255_255_255/0.3)] ${className}`}
    >
      <BociakGlyph className="size-[80%]" />
    </span>
  );
}

// Napis „bociak” – kropka nad „i” świeci jak lampka na antenie.
export function Wordmark({ className = "text-[19px]" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-[-0.045em] ${className}`} aria-label={BRAND.name}>
      <span aria-hidden>
        boc
        <span className="relative">
          ı
          <span className="absolute left-1/2 top-[0.04em] size-[0.2em] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 shadow-[0_0_10px] shadow-brand-500" />
        </span>
        ak
      </span>
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-white">
      <LogoMark />
      <Wordmark />
    </Link>
  );
}
