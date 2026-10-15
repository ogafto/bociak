// „Jedwabne” tło Bociaka: smugi blurple i fuksji na czerni. Wspólne dla landingu, logowania i panelu.
export function Silk({ intensity = 1, className = "" }: { intensity?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} style={{ opacity: intensity }} aria-hidden>
      <div className="absolute left-1/2 top-[-30rem] h-[60rem] w-[110rem] -translate-x-1/2">
        <div className="absolute inset-x-[15%] top-[20%] h-[26rem] animate-sheen rounded-[50%] bg-[conic-gradient(from_200deg_at_50%_50%,transparent,rgb(88_101_242/0.55),rgb(235_69_158/0.25),transparent_60%)] blur-[90px]" />
        <div className="absolute left-[30%] top-[38%] h-[20rem] w-[40rem] animate-aurora rounded-full bg-[#5865f2] opacity-30 blur-[120px]" />
        <div className="absolute right-[18%] top-[30%] h-[16rem] w-[26rem] animate-aurora rounded-full bg-[#eb459e] opacity-20 blur-[120px] [animation-delay:-7s]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-ink-950" />
    </div>
  );
}
