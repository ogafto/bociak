import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/bots";
import { logout } from "@/app/actions/auth";
import { btn } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/page-header";
import { PasswordForm, ProfileForm } from "@/components/panel/account-forms";

export const metadata: Metadata = { title: "Konto" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="animate-fade-up">
      <PageHeader title="Konto" description={`Członek od ${formatDate(user.createdAt)}.`} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ProfileForm name={user.name} email={user.email} />
        <PasswordForm />
      </div>
      <form action={logout} className="mt-8">
        <button className={btn("secondary", "md")}>
          <LogOut className="size-4" /> Wyloguj się
        </button>
      </form>
    </div>
  );
}
