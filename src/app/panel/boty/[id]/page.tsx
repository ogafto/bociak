import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, PartyPopper, Terminal, Wifi } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getBot, listBotLogs, listBotSnapshots } from "@/lib/db";
import { formatDate, toBotView } from "@/lib/bots";
import { pickerPlan } from "@/lib/catalog";
import { deleteBotAction, updateBotAction } from "@/app/actions/panel";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { btn } from "@/components/ui/button";
import { BotForm } from "@/components/panel/bot-form";
import { StatusBadge } from "@/components/panel/bot-card";
import { DeleteBotButton, PowerButton } from "@/components/panel/actions";
import { AutoRefresh } from "@/components/panel/auto-refresh";
import { Curtain } from "@/components/landing/curtain";
import { Enter, Words } from "@/components/landing/motion";

export const metadata: Metadata = { title: "Ustawienia bota" };

export default async function BotPage({ params, searchParams }: PageProps<"/panel/boty/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { nowy } = await searchParams;
  const row = getBot(user.id, id);
  if (!row) notFound();
  const canHost = user.plan.maxBots > 0;
  const bot = toBotView(row, canHost);
  const logs = listBotLogs(user.id, bot.id);

  return (
    <div className="space-y-8">
      <Link href="/panel/boty" className="group inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Własny bot
      </Link>

      {nowy && (
        <Enter>
          <div className="flex items-center gap-3 rounded-[14px] border border-dc-green/25 bg-dc-green/[0.06] px-5 py-4 text-[14.5px] text-white">
            <PartyPopper className="size-5 shrink-0 text-dc-green" />
            Bot „{bot.name}” został utworzony! Kliknij „Uruchom bota”, a potem dodaj go na swój serwer.
          </div>
        </Enter>
      )}

      {/* nagłówek bota */}
      <Enter>
        <div data-spot className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] p-6 sm:p-7">
          <Curtain base="17 17 19" className="inset-y-0 right-0 w-full opacity-80 [mask-image:linear-gradient(to_right,transparent_20%,#000)] sm:w-[55%]" />
          <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full opacity-30 blur-3xl" style={{ background: bot.color }} />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <BotAvatar name={bot.name} color={bot.color} className="size-16 text-xl shadow-[0_10px_40px_-10px_rgb(0_0_0/0.9)]" />
              <span className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-[3px] border-[#111113] ${bot.online ? "bg-dc-green" : "bg-white/25"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-[2rem] font-medium leading-tight tracking-[-0.04em] text-white">
                  <Words onLoad text={bot.name} />
                </h1>
                <StatusBadge state={bot.runtime} />
              </div>
              <div className="mt-1 text-sm text-white/50">
                Utworzono {formatDate(bot.createdAt)} · {Object.keys(bot.modules).length} modułów · hosting w cenie {user.plan.name}
              </div>
            </div>
            <PowerButton botId={bot.id} online={bot.wanted} />
          </div>
        </div>
      </Enter>

      {!canHost && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-dc-yellow/25 bg-dc-yellow/[0.06] p-5 text-sm text-amber-50 sm:flex-row sm:items-center">
          <span className="flex-1">Twój pakiet nie obejmuje własnego bota, więc jest wyłączony. Konfiguracja zostaje zapisana.</span>
          <Link href="/panel/pakiety" className={btn("primary", "sm")}>Przejdź na Pro</Link>
        </div>
      )}

      {/* stan na żywo z runnera */}
      {bot.wanted && <AutoRefresh every={bot.runtime === "online" ? 15000 : 4000} />}
      <RuntimePanel bot={bot} />

      <BotForm
        mode="edit"
        action={updateBotAction.bind(null, bot.id)}
        tokenMask={bot.tokenMask}
        guilds={listBotSnapshots(user.id, bot.id)}
        initial={{
          name: bot.name,
          color: bot.color,
          prefix: bot.prefix,
          activity: bot.activity,
          clientId: bot.clientId,
          modules: bot.modules,
        }}
        plan={{ name: user.plan.name, ...pickerPlan(user.plan) }}
      />

      {/* dziennik */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-[20px] font-medium tracking-[-0.02em] text-white">
          <Terminal className="size-5 text-brand-300" /> Dziennik bota
        </h2>
        <div className="overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#0b0b0d]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-[#ed4245]/70" />
            <span className="size-2.5 rounded-full bg-[#fee75c]/70" />
            <span className="size-2.5 rounded-full bg-[#57f287]/70" />
            <span className="ml-2 font-mono text-[11.5px] text-white/35">{bot.name.toLowerCase().replace(/\s+/g, "-")} · na żywo</span>
          </div>
        <div className="max-h-80 overflow-y-auto p-2 font-mono text-[12.5px]">
          {logs.length === 0 ? (
            <p className="p-4 font-sans text-sm text-white/40">Tu pojawią się zdarzenia, gdy bot wystartuje.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex gap-3 rounded-lg px-3 py-1.5 hover:bg-white/[0.03]">
                <span className="shrink-0 text-white/30">{formatTime(l.created_at)}</span>
                <span className={l.level === "error" ? "text-rose-300" : l.level === "warn" ? "text-amber-300" : "text-white/70"}>{l.message}</span>
              </div>
            ))
          )}
        </div>
        </div>
      </section>

      {/* strefa niebezpieczna */}
      <section className="flex flex-col gap-4 rounded-[16px] border border-rose-500/15 bg-rose-500/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium text-white">Usuń bota</div>
          <div className="text-sm text-white/45">Konfiguracja i hosting tego bota zostaną trwale usunięte.</div>
        </div>
        <DeleteBotButton action={deleteBotAction.bind(null, bot.id)} name={bot.name} />
      </section>
    </div>
  );
}

function formatTime(sqlite: string) {
  const d = new Date(sqlite.replace(" ", "T") + "Z");
  return d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function RuntimePanel({ bot }: { bot: ReturnType<typeof toBotView> }) {
  const invite = bot.inviteUrl ? (
    <a href={bot.inviteUrl} target="_blank" rel="noreferrer" className={btn("secondary", "sm")}>
      Dodaj bota na serwer <ExternalLink className="size-3.5" />
    </a>
  ) : (
    <span className="text-[13px] text-white/40">Wpisz Client ID w zakładce „Połączenie”, aby dostać link zapraszający.</span>
  );

  if (bot.runtime === "online" && bot.info) {
    return (
      <div className="flex flex-col gap-4 rounded-[14px] border border-dc-green/20 bg-dc-green/[0.05] p-5 sm:flex-row sm:items-center">
        <Wifi className="size-5 shrink-0 text-dc-green" />
        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-sm text-white/70">
          <span>
            Zalogowany jako <b className="text-white">{bot.info.tag}</b>
          </span>
          <span>
            Serwery: <b className="text-white">{bot.info.guilds}</b>
          </span>
          <span>
            Ping: <b className="text-white">{bot.info.ping} ms</b>
          </span>
        </div>
        {invite}
      </div>
    );
  }
  if (bot.runtime === "starting") {
    return (
      <div className="flex items-center gap-3 rounded-[14px] border border-amber-400/20 bg-amber-400/[0.05] p-5 text-sm text-amber-100">
        <Loader2 className="size-5 shrink-0 animate-spin text-amber-300" />
        Uruchamiamy bota – połączenie z Discordem zajmuje zwykle kilka sekund.
      </div>
    );
  }
  if (bot.runtime === "error") {
    return (
      <div className="flex items-start gap-3 rounded-[14px] border border-rose-500/25 bg-rose-500/[0.07] p-5 text-sm text-rose-100">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-300" />
        <div>
          <div className="font-medium text-white">Bot nie działa</div>
          <div className="mt-0.5">{bot.runtimeError ?? "Nieznany błąd."}</div>
        </div>
      </div>
    );
  }
  if (bot.runtime === "runner-down") {
    return (
      <div className="flex items-start gap-3 rounded-[14px] border border-amber-400/20 bg-amber-400/[0.05] p-5 text-sm text-amber-100">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" />
        Serwer botów nie odpowiada od ponad 2 minut. Bot wróci automatycznie, gdy serwer się podniesie.
      </div>
    );
  }
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-white/55">Bot jest wyłączony. {invite}</div>;
}
