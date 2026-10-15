import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Logowanie" };

export default function LoginPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-[2.4rem] font-normal leading-[1.06] tracking-[-0.04em] text-white">
        Witaj z powrotem.
      </h1>
      <p className="mb-9 mt-3 text-[15px] leading-relaxed text-[#8a8f98]">Zaloguj się, żeby zarządzać serwerami i modułami.</p>
      <LoginForm />
    </div>
  );
}
