import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { countBots } from "@/lib/db";
import { pickerPlan } from "@/lib/catalog";
import { createBotAction } from "@/app/actions/panel";
import { BotForm } from "@/components/panel/bot-form";
import { PageHeader } from "@/components/panel/page-header";

export const metadata: Metadata = { title: "Nowy bot" };

export default async function NewBotPage() {
  const user = await requireUser();
  if (countBots(user.id) >= user.plan.maxBots) redirect("/panel/pakiety?limit=1");
  const plan = pickerPlan(user.plan);

  return (
    <div>
      <Link href="/panel/boty" className="group mb-4 inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Własny bot
      </Link>
      <PageHeader kicker="Kreator" title="Stwórz nowego bota" description="Trzy kroki i gotowe. Podgląd po prawej zmienia się na żywo." />
      <BotForm
        mode="create"
        action={createBotAction}
        plan={{ name: user.plan.name, ...plan }}
      />
    </div>
  );
}
