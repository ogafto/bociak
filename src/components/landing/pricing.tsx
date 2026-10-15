import { Check, Minus, Plus } from "lucide-react";
import { BRAND, PLANS, READY_MODULES, formatPrice } from "@/lib/catalog";
import { Reveal } from "./motion";
import { Button, CONTAINER, Card, SectionIntro } from "./ui";

// Cennik: trzy karty, Pro odrobinę jaśniejszy z obrysowaną plakietką. Pod spodem rozwijane porównanie.

const SUBTITLE: Record<string, string> = {
  start: "Bociak na Twoim serwerze. Na start i małe społeczności.",
  pro: "Twój własny bot z Twoją nazwą i avatarem. Hosting w cenie.",
  enterprise: "Sieci serwerów, firmy i funkcje robione na zamówienie.",
};

export function Pricing() {
  const free = READY_MODULES.filter((m) => !m.premium).length;
  const rows: [string, ...(string | boolean)[]][] = [
    ["Bot", "Bociak", "Twój własny", "Kilka własnych"],
    ["Serwery", ...PLANS.map((p) => (Number.isFinite(p.maxServers) ? `do ${p.maxServers}` : "bez limitu"))],
    ["Moduły na serwer", ...PLANS.map((p) => (Number.isFinite(p.maxModules) ? `do ${p.maxModules}` : "bez limitu"))],
    [`Moduły darmowe (${free})`, true, true, true],
    [`Moduły Pro (${READY_MODULES.length - free})`, false, true, true],
    ["Wygląd wiadomości", "gotowe style", "pełny kreator", "pełny kreator"],
    ["Hosting 24/7", true, true, true],
    ["Własna nazwa, avatar i status", false, true, true],
    ["Funkcje na zamówienie", false, false, true],
  ];

  return (
    <section id="cennik" className="scroll-mt-20 py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionIntro center label="Cennik" title="Za darmo na start," muted="Pro za 9,99 zł miesięcznie." />

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const hot = !!plan.highlighted;
            return (
              <Reveal key={plan.id} delay={i * 0.08} tilt className={hot ? "ring-spin rounded-2xl" : ""}>
                <Card tone={hot ? "raised" : "base"} className="flex h-full flex-col p-6 sm:p-7">
                  {hot && <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(88_101_242/0.18),transparent)]" />}
                  <div className="flex items-center justify-between">
                    <h3 className="text-[22px] font-normal tracking-[-0.02em] text-white">{plan.name}</h3>
                    {hot && <span className="rounded-[6px] border border-brand-400/50 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-brand-300">Polecany</span>}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    {plan.price === null ? (
                      <span className="text-[2.6rem] font-normal tracking-[-0.04em] text-white">Wycena</span>
                    ) : (
                      <>
                        <span className="text-[2.6rem] font-normal tracking-[-0.04em] text-white">{formatPrice(plan.price)}</span>
                        <span className="text-[14px] text-white/45">/ mies.</span>
                      </>
                    )}
                  </div>
                  <p className="mt-3 min-h-[3rem] text-[15px] leading-[1.5] text-[#b0b0b0]">{SUBTITLE[plan.id]}</p>
                  <div className="mt-6">
                    {plan.price === null ? (
                      <Button href={BRAND.discordInvite} external variant="dark" className="w-full">
                        Napisz na Discordzie
                      </Button>
                    ) : (
                      <Button href="/rejestracja" variant={hot ? "light" : "dark"} className="w-full">
                        {plan.price === 0 ? "Zacznij za darmo" : `Przejdź na ${plan.name}`}
                      </Button>
                    )}
                  </div>
                  <ul className="mt-7 space-y-3 border-t border-white/[0.06] pt-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[15px] text-white/80">
                        <Check className="mt-[3px] size-4 shrink-0 text-white/50" strokeWidth={2} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <details className="group mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-[15px] text-white/75 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
            Porównaj pakiety punkt po punkcie
            <Plus className="size-4 transition-transform duration-300 group-open:rotate-45" />
          </summary>
          <div className="overflow-x-auto border-t border-white/[0.06]">
            <table className="w-full min-w-[560px] text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4" />
                  {PLANS.map((p) => (
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
