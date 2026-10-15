import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PLANS, PRO_RULES, PRO_TRIAL_DAYS } from "@/lib/catalog";
import { createBotAction } from "@/app/actions/panel";
import { BotForm } from "@/components/panel/bot-form";
import { PageHeader } from "@/components/panel/page-header";

export const metadata: Metadata = { title: "Nowy bot" };

export default async function NewBotPage() {
  const user = await requireUser();
  const pro = PLANS.find((p) => p.id === "pro")!;

  return (
    <div>
      <Link href="/panel/boty" className="group mb-4 inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Własny bot
      </Link>
      <PageHeader
        kicker="Kreator"
        title="Stwórz nowego bota"
        description={`Trzy kroki i gotowe – podgląd po prawej zmienia się na żywo. Płatność (albo ${user.trialUsed ? "opłatę" : `${PRO_TRIAL_DAYS} dni za darmo`}) wybierzesz po utworzeniu.`}
      />
      <BotForm mode="create" action={createBotAction} plan={{ name: pro.name, ...PRO_RULES }} />
    </div>
  );
}
