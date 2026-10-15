import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { countServers, recentServers } from "@/lib/db";
import { sharedInviteUrl, toServerView } from "@/lib/bots";
import { btn } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/page-header";
import { LinkServer } from "@/components/panel/server-ui";
import { Enter } from "@/components/landing/motion";

export const metadata: Metadata = { title: "Dodaj serwer" };

export default async function AddServerPage() {
  const user = await requireUser();
  const fresh = recentServers(user.id).map(toServerView);
  if (countServers(user.id) >= user.plan.maxServers && fresh.length === 0) redirect("/panel/pakiety?limit=1");

  return (
    <div className="space-y-6">
      <Link href="/panel/serwery" className="group inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Serwery
      </Link>
      <PageHeader kicker="Nowy serwer" title="Dodaj Bociaka na serwer" description="Darmowy bot – bez tokenu i Developer Portalu. Dwa kroki i gotowe." />

      {fresh.map((s) => (
        <Enter key={s.id}>
          <div className="flex flex-col gap-4 rounded-[16px] border border-dc-green/25 bg-dc-green/[0.06] p-5 sm:flex-row sm:items-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-dc-green/15 text-dc-green">
              <PartyPopper className="size-5" />
            </span>
            <div className="flex-1 text-[15px] text-white">
              Połączono serwer <b>{s.name}</b>! Teraz wybierz moduły.
            </div>
            <Link href={`/panel/serwery/${s.id}`} className={btn("primary", "sm")}>
              Skonfiguruj <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Enter>
      ))}

      <LinkServer inviteUrl={sharedInviteUrl()} />
    </div>
  );
}
