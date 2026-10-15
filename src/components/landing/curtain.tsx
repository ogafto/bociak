// Poświata za „żeberkowanym szkłem”: kilka miękkich plam światła w kolorach Bociaka powoli dryfuje,
// a nałożone pionowe paski rozbijają je na świecące listwy. Czysty CSS – animowany jest tylko
// transform, więc przeglądarka robi to na karcie graficznej, a serwer nic nie liczy.

type Props = {
  className?: string;
  /** Kolor tła pod spodem (r g b) – paski muszą się z nim zlewać. */
  base?: string;
  /** Wygaszenie od góry, żeby światło „wyrastało” z dołu. */
  fadeTop?: boolean;
  /** Mocniejsza wersja do hero. */
  strong?: boolean;
};

export function Curtain({ className = "", base = "13 13 15", fadeTop = true, strong = false }: Props) {
  const reeds = `repeating-linear-gradient(90deg, rgb(${base}) 0px, rgb(${base} / 0.2) 2px, rgb(${base} / 0) 4px, rgb(${base} / 0) 6px, rgb(${base} / 0.45) 8px, rgb(${base}) 10px)`;
  return (
    <div aria-hidden className={`pointer-events-none absolute overflow-hidden ${className}`}>
      <div className="absolute inset-0">
        <div
          className="absolute bottom-[-45%] left-[0%] h-[120%] w-[60%] animate-drift-a motion-reduce:animate-none"
          style={{ background: `radial-gradient(closest-side, rgb(138 147 255 / ${strong ? 0.95 : 0.8}), rgb(88 101 242 / 0.5) 45%, transparent)` }}
        />
        <div
          className="absolute bottom-[-50%] right-[-5%] h-[110%] w-[55%] animate-drift-b motion-reduce:animate-none"
          style={{ background: `radial-gradient(closest-side, rgb(88 101 242 / ${strong ? 0.9 : 0.75}), rgb(71 82 196 / 0.35) 50%, transparent)` }}
        />
        <div
          className="absolute bottom-[-35%] left-[30%] h-[80%] w-[40%] animate-drift-b [animation-delay:-7s] motion-reduce:animate-none"
          style={{ background: "radial-gradient(closest-side, rgb(201 205 251 / 0.55), rgb(138 147 255 / 0.15) 55%, transparent)" }}
        />
      </div>
      <div className="absolute inset-0" style={{ background: reeds }} />
      {fadeTop && <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgb(${base}) 0%, rgb(${base} / 0) 55%)` }} />}
    </div>
  );
}
