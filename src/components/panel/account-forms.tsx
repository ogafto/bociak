"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction, type FormState } from "@/app/actions/panel";
import { Alert, SubmitButton } from "@/components/ui/form";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, {});
  return (
    <form action={action} className="card space-y-5 p-6">
      <h2 className="font-semibold text-white">Profil</h2>
      {state.error && <Alert>{state.error}</Alert>}
      {state.success && <Alert kind="success">{state.success}</Alert>}
      <div>
        <label htmlFor="name" className="label">Nazwa</label>
        <input id="name" name="name" defaultValue={name} className="input" required />
      </div>
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" value={email} disabled className="input opacity-60" />
      </div>
      <SubmitButton className="" pendingText="Zapisywanie…">Zapisz</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="card space-y-5 p-6">
      <h2 className="font-semibold text-white">Zmiana hasła</h2>
      {state.error && <Alert>{state.error}</Alert>}
      {state.success && <Alert kind="success">{state.success}</Alert>}
      <div>
        <label htmlFor="current" className="label">Obecne hasło</label>
        <input id="current" name="current" type="password" autoComplete="current-password" className="input" required />
      </div>
      <div>
        <label htmlFor="next" className="label">Nowe hasło</label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </div>
      <SubmitButton className="" pendingText="Zmienianie…">Zmień hasło</SubmitButton>
    </form>
  );
}
