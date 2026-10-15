import { Check, Clock, Hash, LayoutGrid, LayoutTemplate, MousePointerClick, ShieldCheck, Trophy, X, Zap } from "lucide-react";
import { READY_MODULES } from "@/lib/catalog";
import { LogoMark } from "@/components/ui/logo";
import { Curtain } from "./curtain";
import { Reveal } from "./motion";
import { Button, CONTAINER, Card, SectionIntro } from "./ui";

// Dwie sekcje: siatka zalet z wysoką kartą-zachętą oraz porównanie „typowy bot” vs Bociak.

const PERKS = [
  { icon: MousePointerClick, title: "Bez kodu", text: "Każdą funkcję włączysz przełącznikiem. Nie musisz znać komend ani programować." },
  { icon: Clock, title: "Działa 24/7", text: "Hosting jest w cenie. Bot działa, nawet gdy wyłączysz komputer." },
  { icon: Hash, title: "Kanały i role z listy", text: "Panel widzi Twój serwer, więc niczego nie wpisujesz ręcznie." },
  { icon: LayoutTemplate, title: "Components V2", text: "Nowe wiadomości Discorda: kontenery, miniatury i przyciski." },
  { icon: Zap, title: "Zmiany od razu", text: "Zapisujesz i działa. Bez restartu bota i bez czekania." },
  { icon: ShieldCheck, title: "Bezpieczny token", text: "Token Twojego Bota Pro przechowujemy zaszyfrowany." },
];

export function Perks() {
  return (
    <section className="py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionIntro icon={LayoutGrid} label="Dla każdego serwera" title="Wszystko, czego potrzebujesz," muted="w jednym panelu." />
        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            {PERKS.map((p, i) => (
              <Reveal key={p.title} delay={(i % 2) * 0.08 + Math.floor(i / 2) * 0.06} tilt>
                <Card className="h-full p-6">
                  <span className="grid size-10 place-items-center rounded-[10px] border border-white/[0.08] bg-white/[0.02] text-white/80">
                    <p.icon className="size-[18px]" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-10 text-[19px] font-normal tracking-[-0.02em] text-white">{p.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-[1.5] text-[#b0b0b0]">{p.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="h-full">
            <Card className="flex h-full min-h-[420px] flex-col justify-end p-6">
              <Curtain base="17 17 19" className="inset-0" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#111113]" />
              <div className="relative">
                <h3 className="text-[2rem] font-normal leading-[1.08] tracking-[-0.04em] text-white">
                  Twój serwer.
                  <br />
                  Jeden bot.
                </h3>
                <Button href="/rejestracja" className="mt-6 w-full">
                  Zacznij za darmo
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const OTHERS = [
  "Konfiguracja komendami i wklejaniem ID",
  "Osobny bot do każdej funkcji",
  "Własny bot to własny serwer i hosting",
  "Stare embedy bez nowych komponentów",
  "Panel i komendy po angielsku",
];
const OURS = [
  "Wszystko wyklikasz w panelu",
  `${READY_MODULES.length} modułów w jednym bocie`,
  "Hosting w cenie, także dla własnego bota",
  "Components V2 z podglądem na żywo",
  "Po polsku, od początku do końca",
];

export function Compare() {
  return (
    <section className="py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionIntro center icon={Trophy} label="Dlaczego Bociak" title="Zwykle trzeba kombinować." muted="Z Bociakiem nie musisz." />
        <Reveal tilt className="mx-auto mt-14 max-w-[900px]">
          <Card className="grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
            <div className="p-6">
              <div className="text-[20px] tracking-[-0.02em] text-white/85">Typowy bot</div>
              <ul className="mt-6 space-y-3.5">
                {OTHERS.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[15px] text-[#9a9aa2]">
                    <X className="mt-0.5 size-4 shrink-0 text-white/35" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-[12px] border border-white/[0.06] bg-[#16161a] p-6">
              <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(88_101_242/0.25),transparent)]" />
              <div className="relative flex items-center gap-2.5 text-[20px] tracking-[-0.02em] text-white">
                <LogoMark className="size-6" /> Bociak
              </div>
              <ul className="relative mt-6 space-y-3.5">
                {OURS.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[15px] text-white/90">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-300" strokeWidth={2.4} /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
