import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listServers } from "@/lib/db";
import { toServerView } from "@/lib/bots";
import { btn } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/page-header";
import { AddServerTile, ServerCard } from "@/components/panel/server-card";
import { Curtain } from "@/components/landing/curtain";
import { Enter, Progress } from "@/components/landing/motion";
import { Logo3D } from "@/components/landing/three-d";

export const metadata: Metadata = { title: "Serwery" };

export default async function ServersPage() {
  const user = await requireUser();
  const servers = listServers(user.id).map(toServerView);
  const limit = user.plan.maxServers;
  const limited = Number.isFinite(limit);
  const canAdd = servers.length < limit;

  return (
    <div>
      <PageHeader
        kicker="Serwery"
        title="Serwery z Bociakiem"
        description={limited ? `Wykorzystano ${servers.length} z ${limit} w pakiecie ${user.plan.name}.` : `${servers.length} serwerów · bez limitu w pakiecie ${user.plan.name}.`}
        actions={
          canAdd ? (
            <Link href="/panel/serwery/dodaj" className={btn("primary", "md")}>
              <Plus className="size-4" /> Dodaj serwer
            </Link>
          ) : (
            <Link href="/panel/pakiety" className={btn("secondary", "md")}>
              Więcej serwerów w Pro
            </Link>
          )
        }
      />
      {limited && servers.length > 0 && (
        <Enter delay={0.15} className="-mt-4 mb-8">
          <Progress value={(servers.length / limit) * 100} className="max-w-sm" />
        </Enter>
      )}

      {servers.length === 0 ? (
        <Enter delay={0.1}>
          <div data-spot className="relative flex flex-col items-center overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] px-6 pb-14 pt-10 text-center">
            <Curtain strong base="17 17 19" className="inset-0" />
            <div className="relative animate-hover-y">
              <Logo3D size={120} />
            </div>
            <h3 className="relative mt-8 text-[1.6rem] font-medium tracking-[-0.03em] text-white">Dodaj Bociaka na swój serwer</h3>
            <p className="relative mt-2 max-w-sm text-[14.5px] text-white/60">Bez tokenu i Developer Portalu. Dwa kliknięcia, jedna komenda i moduły działają.</p>
            <Link href="/panel/serwery/dodaj" className={btn("primary", "md", "relative mt-7")}>
              <Plus className="size-4" /> Dodaj pierwszy serwer
            </Link>
          </div>
        </Enter>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {servers.map((s, i) => (
            <Enter key={s.id} delay={0.08 + i * 0.06}>
              <ServerCard server={s} />
            </Enter>
          ))}
          <Enter delay={0.08 + servers.length * 0.06}>
            <AddServerTile disabled={!canAdd} />
          </Enter>
        </div>
      )}
    </div>
  );
}
