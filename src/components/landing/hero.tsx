import { ArrowRight } from "lucide-react";
import { READY_MODULES } from "@/lib/catalog";
import { ModuleIcon } from "@/components/ui/module-icon";
import { Curtain } from "./curtain";
import { DiscordScene } from "./discord-scene";
import { Enter, Parallax, Words } from "./motion";
import { Button, CONTAINER } from "./ui";

// Hero: nagłówek wjeżdża słowo po słowie, za nim pas światła (z paralaksą), a pod spodem
// żywa scena Discorda, w której Bociak obsługuje serwer. Na końcu pasek przewijających się modułów.

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Parallax distance={220} className="pointer-events-none absolute inset-x-0 top-[240px] h-[820px] sm:top-[290px]">
        <Enter delay={0.3} y={80} className="absolute inset-0">
          <Curtain strong className="inset-0" />
        </Enter>
      </Parallax>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent to-[#0d0d0f]" />

      <div className={`${CONTAINER} relative pt-32 text-center sm:pt-40`}>
        <Enter delay={0.1}>
          <a
            href="#moduly"
            className="group inline-flex rounded-full p-px transition-[filter] [background:linear-gradient(90deg,rgb(138_147_255/0.7),rgb(255_255_255/0.1)_45%,rgb(255_255_255/0.1)_65%,rgb(235_69_158/0.45))] hover:brightness-125"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full bg-[#121214] py-1 pl-1 pr-3 text-[13px] text-white/80">
              <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[11.5px] font-medium text-white shadow-[0_0_16px_-2px_rgb(88_101_242/0.9)]">Nowe</span>
              Wiadomości w Components V2
              <ArrowRight className="size-3.5 text-white/50 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        </Enter>

        <h1 className="mx-auto mt-7 max-w-[17ch] text-balance text-[2.9rem] font-medium leading-[1.02] tracking-[-0.05em] text-[#fafafa] sm:text-[4.3rem] lg:text-[4.9rem]">
          <Words onLoad text="Twój serwer Discord," delay={0.2} />{" "}
          <Words onLoad text="na autopilocie." delay={0.45} className="[&>span]:bg-gradient-to-b [&>span]:from-white [&>span]:to-[#9aa2ff] [&>span]:bg-clip-text [&>span]:pb-[0.08em] [&>span]:text-transparent" />
        </h1>

        <Enter delay={0.7}>
          <p className="mx-auto mt-6 max-w-[36rem] text-[17px] leading-relaxed text-white/75 sm:text-[18.5px]">
            Moderacja, powitania, tickety i konkursy w jednym bocie. Włączasz moduły w panelu, a Bociak pilnuje serwera 24/7.
          </p>
        </Enter>

        <Enter delay={0.85} className="mt-9 flex flex-wrap justify-center gap-3">
          <Button href="/rejestracja" arrow>
            Dodaj Bociaka za darmo
          </Button>
          <Button href="#jak-to-dziala" variant="dark">
            Zobacz, jak to działa
          </Button>
        </Enter>
      </div>

      <div className="relative mt-20 px-4 sm:mt-24 sm:px-8">
        <DiscordScene />
      </div>

      <ModulesMarquee />
    </section>
  );
}

/** Dwa rzędy modułów przesuwające się w przeciwne strony, z wygaszonymi krawędziami. */
function ModulesMarquee() {
  const half = Math.ceil(READY_MODULES.length / 2);
  const rows = [READY_MODULES.slice(0, half), READY_MODULES.slice(half)];
  return (
    <div className="relative pb-6 pt-20 sm:pt-28">
      <Enter className="text-center text-[14.5px] text-white/50">
        Jeden bot, <span className="text-white">{READY_MODULES.length} modułów</span> gotowych do włączenia
      </Enter>
      <div className="mt-8 space-y-3 [mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="flex w-max animate-marquee gap-3 pr-3" style={{ animationDuration: `${50 + r * 8}s`, animationDirection: r ? "reverse" : "normal" }}>
            {[...row, ...row].map((m, i) => (
              <span key={`${m.id}-${i}`} className="flex items-center gap-2.5 rounded-[12px] border border-white/[0.06] bg-[#111113] py-2.5 pl-2.5 pr-4 text-[14px] text-white/80">
                <span className="grid size-7 place-items-center rounded-[8px] bg-brand-500/15 text-brand-300">
                  <ModuleIcon name={m.icon} className="size-[15px]" />
                </span>
                {m.name}
                {m.premium && <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-brand-300">Pro</span>}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
