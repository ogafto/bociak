"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/app/actions/auth";
import { Alert, FieldError, SubmitButton } from "@/components/ui/form";

export function LoginForm() {
  const [state, action] = useActionState<AuthState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="ty@example.com" defaultValue={state.values?.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">Hasło</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" placeholder="••••••••" />
      </div>
      <SubmitButton variant="white" pendingText="Logowanie…">Zaloguj się</SubmitButton>
      <p className="border-t border-white/[0.07] pt-5 text-center text-[13.5px] text-white/45">
        Nie masz konta?{" "}
        <Link href="/rejestracja" className="font-medium text-white underline decoration-white/25 underline-offset-4 transition-colors hover:decoration-white">Załóż je za darmo</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState<AuthState, FormData>(register, {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      <div>
        <label htmlFor="name" className="label">Nazwa / nick</label>
        <input id="name" name="name" autoComplete="nickname" required className="input" placeholder="np. Kuba" defaultValue={state.values?.name} />
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </div>
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="ty@example.com" defaultValue={state.values?.email} />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>
      <div>
        <label htmlFor="password" className="label">Hasło</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" placeholder="Min. 8 znaków" />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>
      <label className="flex items-start gap-3 text-[13px] leading-relaxed text-white/55">
        <input type="checkbox" name="terms" className="mt-0.5 size-4 rounded-[4px] accent-brand-500" />
        Akceptuję regulamin i politykę prywatności.
      </label>
      <SubmitButton variant="white" pendingText="Tworzenie konta…">Załóż konto</SubmitButton>
      <p className="border-t border-white/[0.07] pt-5 text-center text-[13.5px] text-white/45">
        Masz już konto?{" "}
        <Link href="/logowanie" className="font-medium text-white underline decoration-white/25 underline-offset-4 transition-colors hover:decoration-white">Zaloguj się</Link>
      </p>
    </form>
  );
}
