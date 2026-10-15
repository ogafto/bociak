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

export const metadata: Metadata = { title: "Pakiety" };

export default async function PlansPage({ searchParams }: PageProps<"/panel/pakiety">) {
  const user = await requireUser();
  const { kupiono, limit } = await searchParams;
  const servers = countServers(user.id);
  const bots = countBots(user.id);
  const orders = listOrders(user.id);

  return (
    <div className="space-y-12 animate-fade-up">
      <PageHeader title="Pakiety" description="Hosting jest zawsze w cenie – płacisz tylko za pakiet." />

      {typeof kupiono === "string" && (
        <Alert kind="success">
          {kupiono === "start" ? "Wróciłeś do pakietu Darmowego." : `Pakiet ${getPlan(kupiono).name} aktywny! Możesz stworzyć własnego bota.`}
        </Alert>
      )}
      {limit && <Alert>Osiągnąłeś limit pakietu {user.plan.name}. Przejdź wyżej, żeby dodać więcej.</Alert>}

      {/* obecny pakiet */}
      <div className="card-glow flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_0_40px_-8px_rgb(88_101_242/0.9)]">
          <Crown className="size-6" />
        </span>
        <div className="flex-1">
          <div className="text-sm text-white/45">Twój pakiet</div>
          <div className="text-2xl font-semibold tracking-tight text-white">{user.plan.name}</div>
          <div className="mt-0.5 text-sm text-white/50">
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

      <section className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const current = plan.id === user.plan.id;
          const blocked = servers > plan.maxServers ? `Odłącz serwery, by zejść do ${plan.maxServers}` : bots > plan.maxBots ? "Usuń własnego bota, by zejść niżej" : null;
          return (
            <div key={plan.id} className={`${plan.highlighted && !current ? "card-glow" : "card"} flex flex-col p-6 ${current ? "!border-brand-400/50" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">{plan.name}</span>
                {current && <span className="rounded-full bg-brand-500/20 px-2.5 py-1 text-[11px] font-medium text-brand-300">Obecny</span>}
              </div>
              <p className="mt-1 text-sm text-white/45">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-white">{formatPrice(plan.price)}</span>
                {plan.price !== null && <span className="text-sm text-white/45">/ mies.</span>}
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/65">
                    <Check className="mt-0.5 size-4 shrink-0 text-dc-green" strokeWidth={2.5} /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
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
          );
        })}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Historia płatności</h2>
        <div className="card overflow-x-auto">
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-white/40">Brak płatności.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-[12px] uppercase tracking-wider text-white/35">
                <tr>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Usługa</th>
                  <th className="px-5 py-3 text-right font-medium">Kwota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {orders.map((o) => (
                  <tr key={o.id} className="text-white/70">
                    <td className="whitespace-nowrap px-5 py-3">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3 text-white">{o.kind === "plan" ? `Pakiet ${getPlan(o.item).name}` : "Hosting (stary model)"}</td>
                    <td className="px-5 py-3 text-right font-medium text-white">{formatPrice(o.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
