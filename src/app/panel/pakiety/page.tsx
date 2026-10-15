import type { Metadata } from "next";
import { Check, CheckCircle2, Crown, MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { countBots, countServers, listOrders } from "@/lib/db";
import { formatDate } from "@/lib/bots";
import { BRAND, PLANS, formatPrice, getPlan } from "@/lib/catalog";
import { buyPlan } from "@/app/actions/panel";
import { btn } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { PageHeader } from "@/components/panel/page-header";
import { CheckoutButton } from "@/components/panel/actions";
import { Curtain } from "@/components/landing/curtain";
import { Enter } from "@/components/landing/motion";

export const metadata: Metadata = { title: "Pakiety" };

export default async function PlansPage({ searchParams }: PageProps<"/panel/pakiety">) {
  const user = await requireUser();
  const { kupiono, limit } = await searchParams;
  const servers = countServers(user.id);
  const bots = countBots(user.id);
  const orders = listOrders(user.id);

  return (
    <div className="space-y-12">
      <PageHeader kicker="Pakiety" title="Wybierz swój pakiet" description="Hosting jest zawsze w cenie – płacisz tylko za pakiet. Bez umów, co miesiąc." />

      {typeof kupiono === "string" && (
        <Alert kind="success">{kupiono === "start" ? "Wróciłeś do pakietu Darmowego." : `Pakiet ${getPlan(kupiono).name} aktywny! Możesz stworzyć własnego bota.`}</Alert>
      )}
      {limit && <Alert>Osiągnąłeś limit pakietu {user.plan.name}. Przejdź wyżej, żeby dodać więcej.</Alert>}

      {/* obecny pakiet */}
      <Enter delay={0.1}>
        <div data-spot className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] p-6">
          <Curtain base="17 17 19" className="inset-y-0 right-0 w-full opacity-80 [mask-image:linear-gradient(to_right,transparent_20%,#000)] sm:w-1/2" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="grid size-14 shrink-0 place-items-center rounded-[16px] bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_0_40px_-8px_rgb(88_101_242/0.9)]">
              <Crown className="size-6" />
            </span>
            <div className="flex-1">
              <div className="text-[13px] text-white/50">Twój pakiet</div>
              <div className="font-heading text-[1.8rem] font-medium tracking-[-0.03em] text-white">{user.plan.name}</div>
              <div className="mt-0.5 text-sm text-white/55">
                {user.planUntil ? `Aktywny do ${formatDate(user.planUntil)}` : "Bez limitu czasu"} · {servers} serwerów z Bociakiem
                {user.plan.maxBots > 0 && ` · ${bots}/${user.plan.maxBots} własnych botów`}
              </div>
            </div>
            {user.planUntil && user.plan.price !== null && (
              <CheckoutButton
                action={buyPlan.bind(null, user.plan.id)}
                title={`Przedłużenie pakietu ${user.plan.name}`}
                price={formatPrice(user.plan.price)}
                label="Przedłuż o 30 dni"
                variant="secondary"
                className=""
              />
            )}
          </div>
        </div>
      </Enter>

      <section className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan, i) => {
          const current = plan.id === user.plan.id;
          const hot = !!plan.highlighted && !current;
          const blocked = servers > plan.maxServers ? `Odłącz serwery, by zejść do ${plan.maxServers}` : bots > plan.maxBots ? "Usuń własnego bota, by zejść niżej" : null;
          return (
            <Enter key={plan.id} delay={0.15 + i * 0.07} className={hot ? "ring-spin rounded-[16px]" : ""}>
              <div data-spot className={`relative flex h-full flex-col overflow-hidden rounded-[16px] border p-6 ${current ? "border-brand-400/50 bg-[#141419]" : hot ? "border-white/[0.06] bg-[#141416]" : "border-white/[0.06] bg-[#111113]"}`}>
                {hot && <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(88_101_242/0.18),transparent)]" />}
                <div className="relative flex items-center justify-between">
                  <span className="font-heading text-[1.35rem] font-medium tracking-[-0.02em] text-white">{plan.name}</span>
                  {current ? (
                    <span className="rounded-[6px] border border-brand-400/50 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-brand-300">Obecny</span>
                  ) : (
                    hot && <span className="rounded-[6px] border border-brand-400/50 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-brand-300">Polecany</span>
                  )}
                </div>
                <p className="relative mt-1 text-sm text-white/50">{plan.description}</p>
                <div className="relative mt-5 flex items-baseline gap-1.5">
                  <span className="font-heading text-[2.4rem] font-medium tracking-[-0.04em] text-white">{plan.price === null ? "Wycena" : formatPrice(plan.price)}</span>
                  {plan.price !== null && <span className="text-sm text-white/45">/ mies.</span>}
                </div>
                <ul className="relative mt-5 flex-1 space-y-2.5 border-t border-white/[0.06] pt-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/75">
                      <Check className={`mt-0.5 size-4 shrink-0 ${hot || current ? "text-brand-300" : "text-white/40"}`} strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                </ul>
                <div className="relative mt-6">
                  {current ? (
                    <button disabled className={btn("secondary", "md", "w-full")}>
                      <CheckCircle2 className="size-4" /> Twój pakiet
                    </button>
                  ) : plan.price === null ? (
                    <a href={BRAND.discordInvite} target="_blank" rel="noreferrer" className={btn("secondary", "md", "w-full")}>
                      <MessageCircle className="size-4" /> Napisz na Discordzie
                    </a>
                  ) : blocked ? (
                    <button disabled className={btn("secondary", "md", "w-full")}>
                      {blocked}
                    </button>
                  ) : plan.price === 0 ? (
                    <form action={buyPlan.bind(null, plan.id)}>
                      <button className={btn("secondary", "md", "w-full")}>Przejdź na Darmowy</button>
                    </form>
                  ) : (
                    <CheckoutButton
                      action={buyPlan.bind(null, plan.id)}
                      title={`Pakiet ${plan.name}`}
                      subtitle={plan.description}
                      price={formatPrice(plan.price)}
                      label={`Przejdź na ${plan.name}`}
                    />
                  )}
                </div>
              </div>
            </Enter>
          );
        })}
      </section>

      <Enter delay={0.3}>
        <section>
          <h2 className="mb-4 text-[20px] font-medium tracking-[-0.02em] text-white">Historia płatności</h2>
          <div className="card overflow-x-auto">
            {orders.length === 0 ? (
              <p className="p-6 text-sm text-white/45">Brak płatności – korzystasz z darmowego pakietu.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-[11.5px] uppercase tracking-[0.1em] text-white/35">
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3.5 font-medium">Data</th>
                    <th className="px-5 py-3.5 font-medium">Usługa</th>
                    <th className="px-5 py-3.5 text-right font-medium">Kwota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {orders.map((o) => (
                    <tr key={o.id} className="text-white/70 transition-colors hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-5 py-3.5">{formatDate(o.created_at)}</td>
                      <td className="px-5 py-3.5 text-white">{o.kind === "plan" ? `Pakiet ${getPlan(o.item).name}` : "Hosting (stary model)"}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-white">{formatPrice(o.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </Enter>
    </div>
  );
}
