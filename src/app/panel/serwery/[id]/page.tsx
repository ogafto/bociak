import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Hash, Loader2, Shield, Unplug, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getServer, getSharedSnapshot } from "@/lib/db";
import { PERMISSIONS, hasPermission } from "@/lib/guild";
import { formatDate, toServerView } from "@/lib/bots";
import { FREE_RULES } from "@/lib/catalog";
import { plural } from "@/lib/plural";
import { saveServerModulesAction, unlinkServerAction } from "@/app/actions/panel";
import { btn } from "@/components/ui/button";
import { ServerIcon } from "@/components/panel/server-card";
import { ServerModulesForm } from "@/components/panel/server-ui";
import { AutoRefresh } from "@/components/panel/auto-refresh";
import { ShowcaseToggle } from "@/components/panel/billing";
import { Curtain } from "@/components/landing/curtain";
import { Enter, Words } from "@/components/landing/motion";

export const metadata: Metadata = { title: "Ustawienia serwera" };

export default async function ServerPage({ params }: PageProps<"/panel/serwery/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const row = getServer(user.id, id);
  if (!row) notFound();
  const server = toServerView(row);
  const snapshot = getSharedSnapshot(server.guildId);
  const missing = snapshot
    ? [
        ["Zarządzanie rolami", PERMISSIONS.ManageRoles],
        ["Zarządzanie kanałami", PERMISSIONS.ManageChannels],
        ["Zarządzanie wiadomościami", PERMISSIONS.ManageMessages],
        ["Wyciszanie członków", PERMISSIONS.ModerateMembers],
      ].filter(([, flag]) => !hasPermission(snapshot, flag as bigint))
    : [];
  const textChannels = snapshot ? snapshot.channels.filter((c) => c.kind === "text" || c.kind === "announcement").length : null;
  const roles = snapshot ? snapshot.roles.filter((r) => !r.managed).length : null;

  return (
    <div className="space-y-8">
      <Link href="/panel/serwery" className="group inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Serwery
      </Link>

      {/* nagłówek serwera */}
      <Enter>
        <div data-spot className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] p-6 sm:p-7">
          <Curtain base="17 17 19" className="inset-y-0 right-0 w-full opacity-80 [mask-image:linear-gradient(to_right,transparent_20%,#000)] sm:w-[55%]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <ServerIcon name={server.name} icon={server.icon} className="size-16 text-xl shadow-[0_10px_40px_-10px_rgb(88_101_242/0.8)]" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[2rem] font-medium leading-tight tracking-[-0.04em] text-white">
                <Words onLoad text={server.name} />
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-white/55">
                {snapshot ? (
                  <Pill>
                    <span className="size-1.5 rounded-full bg-dc-green shadow-[0_0_8px] shadow-dc-green" /> Bociak na serwerze
                  </Pill>
                ) : (
                  <Pill>
                    <span className="size-1.5 animate-pulse rounded-full bg-amber-400" /> Czekam na Bociaka
                  </Pill>
                )}
                {textChannels !== null && (
                  <Pill>
                    <Hash className="size-3.5" /> {textChannels} {plural(textChannels, "kanał", "kanały", "kanałów")}
                  </Pill>
                )}
                {roles !== null && (
                  <Pill>
                    <Users className="size-3.5" /> {roles} {plural(roles, "rola", "role", "ról")}
                  </Pill>
                )}
                <span className="text-white/35">połączono {formatDate(server.createdAt)}</span>
              </div>
            </div>
            <form action={unlinkServerAction.bind(null, server.id)}>
              <button className={btn("secondary", "sm")}>
                <Unplug className="size-4" /> Odłącz
              </button>
            </form>
          </div>
        </div>
      </Enter>

      {!snapshot && <AutoRefresh every={4000} />}
      {!snapshot && (
        <Enter delay={0.1}>
          <p className="flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-white/55">
            <Loader2 className="size-4 shrink-0 animate-spin text-brand-300" />
            Czekam, aż Bociak przekaże listę kanałów i ról tego serwera (zwykle kilka sekund po połączeniu).
          </p>
        </Enter>
      )}
      {missing.length > 0 && (
        <Enter delay={0.1}>
          <div className="flex items-start gap-3 rounded-[14px] border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <span>
              Bociak nie ma uprawnień: <b>{missing.map(([name]) => name).join(", ")}</b>. Niektóre moduły nie zadziałają – dodaj je jego roli w ustawieniach serwera.
            </span>
          </div>
        </Enter>
      )}

      <Enter delay={0.1}>
        <ShowcaseToggle kind="server" id={server.id} on={server.showcase} />
      </Enter>

      <Enter delay={0.12}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="kicker">Moduły</div>
            <h2 className="mt-3 flex items-center gap-2 text-[1.6rem] font-medium tracking-[-0.03em] text-white">
              <Shield className="size-5 text-brand-300" /> Co ma robić Bociak?
            </h2>
            <p className="mt-1 text-[14.5px] text-white/50">Włącz przełącznikiem, kliknij kafelek, żeby ustawić kanał, rolę albo wygląd wiadomości.</p>
          </div>
        </div>
        <ServerModulesForm action={saveServerModulesAction.bind(null, server.id)} initial={server.modules} plan={FREE_RULES} guilds={snapshot ? [snapshot] : []} />
      </Enter>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-white/70">{children}</span>;
}
