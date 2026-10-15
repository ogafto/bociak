import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Załóż konto" };

export default function RegisterPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-[2.4rem] font-normal leading-[1.06] tracking-[-0.04em] text-white">
        Załóż konto.
        <br />
        <span className="text-[#8b8b93]">Bot czeka.</span>
      </h1>
      <p className="mb-9 mt-3 text-[15px] leading-relaxed text-[#8a8f98]">Plan Darmowy na start. Bociaka dodasz na serwer zaraz po rejestracji.</p>
      <RegisterForm />
    </div>
  );
}
