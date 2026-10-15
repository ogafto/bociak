"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createUser, findUserByEmail } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
  values?: { name?: string; email?: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const accepted = formData.get("terms") === "on";

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Podaj nazwę (min. 2 znaki).";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Nieprawidłowy adres e-mail.";
  if (password.length < 8) fieldErrors.password = "Hasło musi mieć min. 8 znaków.";

  const values = { name, email };
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };
  if (!accepted) return { error: "Zaakceptuj regulamin, aby założyć konto.", values };
  if (findUserByEmail(email)) return { fieldErrors: { email: "Konto z tym e-mailem już istnieje." }, values };

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = createUser({ email, name, passwordHash });
  await createSession(userId);
  redirect("/panel?witaj=1");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = findUserByEmail(email);
  // Porównujemy hash nawet gdy konta nie ma, żeby czas odpowiedzi nie zdradzał istnienia e-maila.
  const ok = await bcrypt
    .compare(password, user?.password_hash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva")
    .catch(() => false);
  if (!user || !ok || user.id === "system") return { error: "Nieprawidłowy e-mail lub hasło.", values: { email } };

  await createSession(user.id);
  redirect("/panel");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
