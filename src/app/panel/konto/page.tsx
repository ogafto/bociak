import type { Metadata } from "next";
import Link from "next/link";
import { Crown, LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/bots";
import { logout } from "@/app/actions/auth";
import { btn } from "@/components/ui/button";
import { BotAvatar } from "@/components/ui/bot-avatar";
import { PageHeader } from "@/components/panel/page-header";
import { PasswordForm, ProfileForm } from "@/components/panel/account-forms";
import { Curtain } from "@/components/landing/curtain";
import { Enter } from "@/components/landing/motion";

export const metadata: Metadata = { title: "Konto" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader kicker="Konto" title="Ustawienia konta" description={`Członek od ${formatDate(user.createdAt)}.`} />

      <Enter delay={0.1}>
        <div data-spot className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] p-6">
          <Curtain base="17 17 19" className="inset-y-0 right-0 w-full opacity-70 [mask-image:linear-gradient(to_right,transparent_20%,#000)] sm:w-1/2" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <BotAvatar name={user.name} color="#5865f2" className="size-16 text-xl shadow-[0_10px_40px_-10px_rgb(88_101_242/0.8)]" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-heading text-[1.6rem] font-medium tracking-[-0.03em] text-white">{user.name}</div>
              <div className="truncate text-sm text-white/55">{user.email}</div>
            </div>
            <Link href="/panel/pakiety" className={btn("secondary", "sm")}>
              <Crown className="size-3.5 text-amber-300" /> Pakiet {user.plan.name}
            </Link>
          </div>
        </div>
      </Enter>

      <div className="grid gap-5 lg:grid-cols-2">
        <Enter delay={0.16}>
          <ProfileForm name={user.name} email={user.email} />
        </Enter>
        <Enter delay={0.22}>
          <PasswordForm />
        </Enter>
      </div>

      <Enter delay={0.28}>
        <form action={logout} className="flex flex-col gap-4 rounded-[16px] border border-white/[0.06] bg-[#111113] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium text-white">Wyloguj się</div>
            <div className="text-sm text-white/45">Zakończ sesję na tym urządzeniu.</div>
          </div>
          <button className={btn("secondary", "md")}>
            <LogOut className="size-4" /> Wyloguj się
          </button>
        </form>
      </Enter>
    </div>
  );
}
