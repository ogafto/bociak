import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Check, Crown, Plus, Server, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listBots, listOrders, listServers } from "@/lib/db";
import { formatDate, toBotView, toServerView } from "@/lib/bots";
import { PLANS, PRO_TRIAL_DAYS, formatPrice, getPlan } from "@/lib/catalog";
import { plural } from "@/lib/plural";
import { btn } from "@/components/ui/button";
import { BotCard } from "@/components/panel/bot-card";
import { AddServerTile, ServerCard } from "@/components/panel/server-card";
import { Curtain } from "@/components/landing/curtain";
import { CountUp, Enter, Progress, Words } from "@/components/landing/motion";
import { Logo3D } from "@/components/landing/three-d";

export const metadata: Metadata = { title: "Panel" };

function greeting() {
  const h = Number(new Date().toLocaleString("pl-PL", { hour: "numeric", timeZone: "Europe/Warsaw" }));
  return h < 5 || h >= 19 ? "Dobry wieczór" : "Dzień dobry";
}

export default async function PanelHome({ searchParams }: PageProps<"/panel">) {
  const user = await requireUser();
  const { witaj } = await searchParams;
  const servers = listServers(user.id).map(toServerView);
  const bots = listBots(user.id).map((b) => toBotView(b));
  const canHost = bots.length > 0;
  const orders = listOrders(user.id).slice(0, 5);
  const pro = PLANS.find((p) => p.id === "pro")!;
  const modulesOn = servers.reduce((n, s) => n + Object.keys(s.modules).length, 0);
  const paidBots = bots.filter((b) => b.payment.paid).length;

  // pierwsze kroki – lista, która sama się odhacza
  const steps = [
    { done: true, title: "Załóż konto", text: "Gotowe – witaj w Bociaku!", href: null },
    { done: servers.length > 0, title: "Dodaj Bociaka na serwer", text: "Dwa kliknięcia i komenda /polacz.", href: "/panel/serwery/dodaj" },
    { done: modulesOn > 0, title: "Włącz pierwsze moduły", text: "Powitania, moderacja, tickety…", href: servers[0] ? `/panel/serwery/${servers[0].id}` : "/panel/serwery/dodaj" },
    {
      done: paidBots > 0,
      title: "Wypróbuj Bota Pro",
      text: user.trialUsed ? "Twoja nazwa, avatar i wszystkie moduły." : `${PRO_TRIAL_DAYS} dni za darmo, potem ${formatPrice(pro.price)} / mies.`,
      href: bots[0] ? `/panel/boty/${bots[0].id}` : "/panel/boty/nowy",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-10">
      {witaj && (
        <Enter>
          <div className="card-glow flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-brand-500/20 text-brand-300">
              <Sparkles className="size-5" />
            </span>
            <div className="flex-1">
              <div className="text-[16px] font-medium text-white">Witaj na pokładzie, {user.name}! 🎉</div>
              <div className="text-[14px] text-white/55">Dodaj Bociaka na swój serwer – za darmo, bez tokenu, w minutę.</div>
            </div>
            <Link href="/panel/serwery/dodaj" className={btn("primary", "md")}>
              Dodaj serwer <ArrowRight className="size-4" />
            </Link>
          </div>
        </Enter>
      )}

      {/* powitanie z poświatą i logo 3D */}
      <Enter>
        <div data-spot className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] p-6 sm:p-9">
          <Curtain strong base="17 17 19" className="inset-y-0 right-0 w-full [mask-image:linear-gradient(to_right,transparent_10%,#000_70%)] sm:w-[65%]" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="kicker">{greeting()}</div>
              <h1 className="mt-4 text-[2.4rem] font-medium leading-[1] tracking-[-0.045em] text-white sm:text-[3.2rem]">
                <Words onLoad text={`${user.name} 👋`} delay={0.1} />
              </h1>
              <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/65">
                {servers.length} {plural(servers.length, "serwer", "serwery", "serwerów")} z Bociakiem · {modulesOn} {plural(modulesOn, "włączony moduł", "włączone moduły", "włączonych modułów")}
                {bots.length > 0 && ` · ${paidBots} ${plural(paidBots, "aktywny Bot Pro", "aktywne Boty Pro", "aktywnych Botów Pro")}`}
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link href="/panel/serwery/dodaj" className={btn("primary", "md")}>
                  <Plus className="size-4" /> Dodaj serwer
                </Link>
                <Link href={canHost ? "/panel/boty" : "/panel/boty/nowy"} className={btn("secondary", "md")}>
                  <Bot className="size-4" /> {canHost ? "Moje boty" : "Stwórz Bota Pro"}
                </Link>
              </div>
            </div>
            <div className="hidden pr-6 md:block">
              <div className="animate-hover-y">
                <Logo3D size={150} />
              </div>
            </div>
          </div>
        </div>
      </Enter>

      {/* liczniki */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Enter delay={0.08}>
          <Stat icon={Server} label="Serwery z Bociakiem">
            <CountUp to={servers.length} />
            <div className="mt-3 text-[12.5px] font-normal tracking-normal text-white/40">bez limitu, za darmo</div>
          </Stat>
        </Enter>
        <Enter delay={0.14}>
          <Stat icon={Sparkles} label="Włączone moduły">
            <CountUp to={modulesOn} />
            <div className="mt-3 text-[12.5px] font-normal tracking-normal text-white/40">na wszystkich serwerach</div>
          </Stat>
        </Enter>
        <Enter delay={0.2}>
          <Stat icon={Crown} label="Boty Pro">
            <CountUp to={paidBots} />
            {bots.length > 0 && <span className="text-white/35"> / {bots.length}</span>}
            <div className="mt-3 text-[12.5px] font-normal tracking-normal text-white/40">
              {bots.length ? "opłaconych botów" : user.trialUsed ? `${formatPrice(pro.price)} / mies. za bota` : `${PRO_TRIAL_DAYS} dni za darmo na start`}
            </div>
          </Stat>
        </Enter>
      </div>

      {/* pierwsze kroki */}
      {doneCount < steps.length && (
        <Enter delay={0.15}>
          <section className="card p-5 sm:p-6" data-spot>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[19px] font-medium tracking-[-0.02em] text-white">Pierwsze kroki</h2>
                <p className="text-[13.5px] text-white/45">
                  {doneCount} z {steps.length} gotowe
                </p>
              </div>
              <Progress value={(doneCount / steps.length) * 100} className="w-full sm:w-56" />
            </div>
            <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => {
                const inner = (
                  <>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                        s.done ? "bg-dc-green text-[#0d0d0f]" : "border border-white/15 text-white/50"
                      }`}
                    >
                      {s.done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[14.5px] ${s.done ? "text-white/45 line-through decoration-white/20" : "text-white"}`}>{s.title}</span>
                      <span className="block text-[12.5px] text-white/40">{s.text}</span>
                    </span>
                  </>
                );
                return (
                  <li key={s.title}>
                    {s.href && !s.done ? (
                      <Link href={s.href} className="flex h-full items-start gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-brand-400/40 hover:bg-brand-500/[0.05]">
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex h-full items-start gap-3 rounded-[12px] border border-white/[0.04] p-3.5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </Enter>
      )}

      {/* serwery z darmowym botem */}
      <section>
        <SectionTitle title="Serwery z Bociakiem" href={servers.length ? "/panel/serwery" : undefined} link="Wszystkie" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {servers.slice(0, 5).map((s, i) => (
            <Enter key={s.id} delay={0.1 + i * 0.06}>
              <ServerCard server={s} />
            </Enter>
          ))}
          <Enter delay={0.1 + Math.min(servers.length, 5) * 0.06}>
            <AddServerTile />
          </Enter>
        </div>
      </section>

      {/* własny bot (Pro) */}
      <section>
        <SectionTitle title="Własny bot" href={canHost && bots.length > 0 ? "/panel/boty" : undefined} link="Zarządzaj" />
        {!canHost ? (
          <Enter>
            <div data-spot className="relative overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#111113] p-6 sm:p-8">
              <Curtain base="17 17 19" className="inset-y-0 right-0 w-full [mask-image:linear-gradient(to_right,transparent,#000_80%)] sm:w-1/2" />
              <div className="relative max-w-lg">
                <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-dc-yellow/30 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-dc-yellow">
                  <Crown className="size-3" /> Pro
                </span>
                <h3 className="mt-4 text-[1.6rem] font-medium leading-tight tracking-[-0.03em] text-white">Bot z Twoją nazwą i avatarem</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-white/60">
                  Zamiast Bociaka – Twój własny bot. Wszystkie moduły, pełny kreator wiadomości, hosting 24/7 w cenie i bez limitu serwerów. Za {formatPrice(pro.price)} miesięcznie.
                </p>
                <Link href="/panel/boty/nowy" className={btn("primary", "md", "mt-6")}>
                  Stwórz Bota Pro <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </Enter>
        ) : bots.length === 0 ? (
          <Link href="/panel/boty/nowy" className="group flex items-center gap-4 rounded-[16px] border border-dashed border-white/[0.12] p-6 transition-colors hover:border-brand-400/50">
            <span className="grid size-12 place-items-center rounded-[12px] bg-brand-500/15 text-brand-300 transition-transform group-hover:scale-110">
              <Plus className="size-5" />
            </span>
            <div>
              <div className="font-medium text-white">Stwórz własnego bota</div>
              <div className="text-[13.5px] text-white/45">Nazwa, avatar, moduły – hosting już masz w pakiecie.</div>
            </div>
          </Link>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bots.map((b, i) => (
              <Enter key={b.id} delay={0.1 + i * 0.06}>
                <BotCard bot={b} />
              </Enter>
            ))}
          </div>
        )}
      </section>

      <section className="card p-6">
        <h3 className="text-[17px] font-medium text-white">Ostatnie płatności</h3>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">Brak płatności – korzystasz z darmowego pakietu.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="text-white/85">Pakiet {getPlan(o.item).name}</div>
                  <div className="text-[12px] text-white/35">{formatDate(o.created_at)}</div>
                </div>
                <span className="font-medium text-white">{formatPrice(o.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, children }: { icon: typeof Server; label: string; children: React.ReactNode }) {
  return (
    <div data-spot className="card h-full p-5">
      <div className="flex items-center justify-between text-[13px] text-white/50">
        {label}
        <span className="grid size-8 place-items-center rounded-[9px] border border-white/[0.07] bg-white/[0.03] text-white/60">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 font-heading text-[2rem] font-medium tracking-[-0.04em] text-white">{children}</div>
    </div>
  );
}

function SectionTitle({ title, href, link }: { title: string; href?: string; link: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[20px] font-medium tracking-[-0.02em] text-white">{title}</h2>
      {href && (
        <Link href={href} className="group flex items-center gap-1 text-[13.5px] text-white/50 transition-colors hover:text-white">
          {link} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
