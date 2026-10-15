"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Check, Gift, Minus, Plus, Wallet } from "lucide-react";
import { BRAND, FREE_LIMITS, PLANS, PRO_TRIAL_DAYS, READY_MODULES, formatPrice } from "@/lib/catalog";
import { Reveal } from "./motion";
import { Button, CONTAINER, Card, SectionIntro } from "./ui";

// Cennik: Darmowy, Bot Pro (płatny osobno za każdego bota, miesięcznie albo rocznie) i Enterprise.
// Przełącznik okresu zmienia cenę Bota Pro, pod spodem rozwijane porównanie.

export function Pricing() {
  const [yearly, setYearly] = useState(true);
  const free = PLANS.find((p) => p.id === "start")!;
  const pro = PLANS.find((p) => p.id === "pro")!;
  const ent = PLANS.find((p) => p.id === "enterprise")!;
  const saving = Math.round((1 - pro.yearlyPrice! / (pro.price! * 12)) * 100);
  const perMonth = Number((pro.yearlyPrice! / 12).toFixed(2));
  const freeCount = READY_MODULES.filter((m) => !m.premium).length;
  const limit = FREE_LIMITS.commands.max;

  const rows: [string, string | boolean, string | boolean, string | boolean][] = [
    ["Bot", "Bociak (nasz)", "Twój własny", "Wiele własnych"],
    ["Serwery", "bez limitu", "bez limitu", "bez limitu"],
    [`Moduły podstawowe (${freeCount})`, true, true, true],
    [`Moduły Pro (${READY_MODULES.length - freeCount})`, false, true, true],
    ["Własne komendy i autoodpowiedzi", `do ${limit}`, "bez limitu", "bez limitu"],
    ["Wygląd wiadomości", "gotowe style", "pełny kreator", "pełny kreator"],
    ["Podpis „Bociak” pod wiadomościami", true, false, false],
    ["Własna nazwa, avatar i status", false, true, true],
    ["Hosting 24/7", true, true, true],
    ["Okres próbny", "—", `${PRO_TRIAL_DAYS} dni`, "—"],
    ["Funkcje na zamówienie", false, false, true],
  ];

  return (
    <section id="cennik" className="scroll-mt-20 py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionIntro center icon={Wallet} label="Cennik" title="Za darmo na start." muted={`Własny bot od ${formatPrice(perMonth)} / mies.`} />

        {/* miesięcznie / rocznie */}
        <Reveal delay={0.1} className="mt-10 flex justify-center">
          <div className="relative grid grid-cols-2 rounded-[14px] border border-white/[0.08] bg-[#111113] p-1">
            {[false, true].map((y) => (
              <button
                key={String(y)}
                type="button"
                onClick={() => setYearly(y)}
                className={`relative rounded-[10px] px-5 py-2 text-[14px] font-medium transition-colors ${yearly === y ? "text-[#0d0d0f]" : "text-white/60 hover:text-white"}`}
              >
                {yearly === y && <motion.span layoutId="price-period" className="absolute inset-0 rounded-[10px] bg-white" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                <span className="relative">
                  {y ? "Rocznie" : "Miesięcznie"}
                  {y && <span className={`ml-2 text-[12px] ${yearly ? "text-brand-600" : "text-dc-green"}`}>−{saving}%</span>}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Darmowy */}
          <Reveal delay={0} tilt>
            <Card className="flex h-full flex-col p-6 sm:p-7">
              <h3 className="text-[22px] font-normal tracking-[-0.02em] text-white">{free.name}</h3>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-[2.6rem] font-normal tracking-[-0.04em] text-white">0 zł</span>
                <span className="text-[14px] text-white/45">na zawsze</span>
              </div>
              <p className="mt-3 min-h-[3rem] text-[15px] leading-[1.5] text-[#b0b0b0]">Bociak na Twoich serwerach. Bez tokenu i bez konfiguracji w Discordzie.</p>
              <Button href="/rejestracja" variant="dark" className="mt-6 w-full">
                Zacznij za darmo
              </Button>
              <Features list={free.features} />
            </Card>
          </Reveal>

          {/* Bot Pro */}
          <Reveal delay={0.08} tilt className="ring-spin rounded-2xl">
            <Card tone="raised" className="flex h-full flex-col p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(88_101_242/0.2),transparent)]" />
              <div className="relative flex items-center justify-between">
                <h3 className="text-[22px] font-normal tracking-[-0.02em] text-white">{pro.name}</h3>
                <span className="flex items-center gap-1 rounded-[6px] border border-brand-400/50 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-brand-300">
                  <Gift className="size-3" /> {PRO_TRIAL_DAYS} dni gratis
                </span>
              </div>
              <div className="relative mt-4 flex items-baseline gap-1.5">
                <motion.span key={String(yearly)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[2.6rem] font-normal tracking-[-0.04em] text-white">
                  {formatPrice(yearly ? pro.yearlyPrice! : pro.price!)}
                </motion.span>
                <span className="text-[14px] text-white/45">/ {yearly ? "rok" : "mies."} za bota</span>
              </div>
              <p className="relative mt-3 min-h-[3rem] text-[15px] leading-[1.5] text-[#b0b0b0]">
                {yearly ? `Wychodzi ${formatPrice(perMonth)} miesięcznie. ` : ""}Twój bot z Twoją nazwą. Każdy kolejny bot to osobny pakiet.
              </p>
              <Button href="/rejestracja" arrow className="relative mt-6 w-full">
                Wypróbuj {PRO_TRIAL_DAYS} dni za darmo
              </Button>
              <Features list={pro.features.filter((f) => !f.includes("za darmo"))} hot />
            </Card>
          </Reveal>

          {/* Enterprise */}
          <Reveal delay={0.16} tilt>
            <Card className="flex h-full flex-col p-6 sm:p-7">
              <h3 className="text-[22px] font-normal tracking-[-0.02em] text-white">{ent.name}</h3>
              <div className="mt-4 text-[2.6rem] font-normal tracking-[-0.04em] text-white">Wycena</div>
              <p className="mt-3 min-h-[3rem] text-[15px] leading-[1.5] text-[#b0b0b0]">{ent.description}</p>
              <Button href={BRAND.discordInvite} external variant="dark" className="mt-6 w-full">
                Napisz na Discordzie
              </Button>
              <Features list={ent.features} />
            </Card>
          </Reveal>
        </div>

        <p className="mt-6 text-center text-[14px] text-white/45">Płacisz za każdego bota osobno, bez umów. Gdy przestaniesz płacić, bot się wyłączy, a konfiguracja zostanie.</p>

        <details className="group mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-[15px] text-white/75 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
            Porównaj pakiety punkt po punkcie
            <Plus className="size-4 transition-transform duration-300 group-open:rotate-45" />
          </summary>
          <div className="overflow-x-auto border-t border-white/[0.06]">
            <table className="w-full min-w-[620px] text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4" />
                  {[free, pro, ent].map((p) => (
                    <th key={p.id} className={`px-6 py-4 text-center font-normal ${p.highlighted ? "text-brand-300" : "text-white/70"}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, ...cells]) => (
                  <tr key={label} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-6 py-3.5 text-white/60">{label}</td>
                    {cells.map((c, i) => (
                      <td key={i} className="px-6 py-3.5 text-center text-white/80">
                        {c === true ? <Check className="mx-auto size-4 text-brand-300" strokeWidth={2.4} /> : c === false ? <Minus className="mx-auto size-4 text-white/20" /> : c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}

function Features({ list, hot = false }: { list: string[]; hot?: boolean }) {
  return (
    <ul className="relative mt-7 space-y-3 border-t border-white/[0.06] pt-7">
      {list.map((f) => (
        <li key={f} className="flex items-start gap-3 text-[15px] text-white/80">
          <Check className={`mt-[3px] size-4 shrink-0 ${hot ? "text-brand-300" : "text-white/50"}`} strokeWidth={2} />
          {f}
        </li>
      ))}
    </ul>
  );
}
