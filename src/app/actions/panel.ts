"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { BOT_COLORS, getModule, PLANS, type PlanId } from "@/lib/catalog";
import * as db from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";
import { toFreeTemplate, type MessageTemplate } from "@/lib/message";

export type FormState = { error?: string; success?: string };

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

// ---------- płatności (symulacja) ----------
// Tu w przyszłości: utworzenie sesji Stripe / Przelewy24 i aktywacja w webhooku.
async function chargeCustomer(user: CurrentUser, amount: number, description: string) {
  console.info(`[płatność demo] ${user.email}: ${description} – ${amount} zł`);
  return { ok: true as const };
}

export async function buyPlan(planId: PlanId) {
  const user = await requireUser();
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan || plan.price === null) return; // Enterprise wyceniamy indywidualnie na Discordzie

  if (plan.price === 0) {
    db.setUserPlan(user.id, "start", null);
  } else {
    const payment = await chargeCustomer(user, plan.price, `Pakiet ${plan.name}`);
    if (!payment.ok) return;
    // Przedłużenie liczymy od końca obecnego okresu, jeśli to ten sam pakiet.
    const base =
      user.plan.id === plan.id && user.planUntil ? Math.max(Date.now(), new Date(user.planUntil).getTime()) : Date.now();
    db.setUserPlan(user.id, plan.id, new Date(base + DAYS_30).toISOString());
    db.createOrder({ user_id: user.id, kind: "plan", item: plan.id, bot_id: null, amount: plan.price });
  }
  revalidatePath("/panel", "layout");
  redirect("/panel/pakiety?kupiono=" + plan.id);
}

// ---------- boty ----------

function parseModules(raw: string, user: CurrentUser): { modules?: db.ModuleConfig; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    return { error: "Nieprawidłowa konfiguracja modułów." };
  }
  if (!parsed || typeof parsed !== "object") return { modules: {} };

  const modules: db.ModuleConfig = {};
  for (const [id, settings] of Object.entries(parsed as Record<string, unknown>)) {
    const mod = getModule(id);
    if (!mod) continue;
    if (mod.soon) return { error: `Moduł „${mod.name}” będzie dostępny wkrótce.` };
    if (mod.premium && !user.plan.premiumModules) {
      return { error: `Moduł „${mod.name}” wymaga pakietu Pro.` };
    }
    const clean: Record<string, string> = {};
    for (const field of mod.fields ?? []) {
      const v = (settings as Record<string, unknown>)?.[field.key];
      if (typeof v !== "string") continue;
      if (field.type === "message" && field.message) {
        // szablon wiadomości to JSON – zapisujemy tylko poprawny
        let template: MessageTemplate | null = null;
        try {
          if (v.length <= 20000 && JSON.parse(v)?.v === 2) template = JSON.parse(v);
        } catch {}
        if (!template) continue;
        // bez Pro zapisujemy tylko gotowy styl – własny wzór zamieniamy na domyślny, kolor zostaje
        clean[field.key] = user.plan.premiumModules ? v : JSON.stringify(toFreeTemplate(v, field.message));
      } else clean[field.key] = v.slice(0, 4000);
    }
    modules[id] = clean;
  }
  if (Object.keys(modules).length > user.plan.maxModules) {
    return { error: `Pakiet ${user.plan.name} pozwala na maks. ${user.plan.maxModules} modułów. Wyłącz któryś albo przejdź na Pro.` };
  }
  return { modules };
}

function readBotForm(formData: FormData) {
  const color = String(formData.get("color") ?? "");
  return {
    name: String(formData.get("name") ?? "").trim().slice(0, 32),
    color: BOT_COLORS.includes(color) ? color : BOT_COLORS[0],
    prefix: String(formData.get("prefix") ?? "!").trim().slice(0, 5) || "!",
    activity: String(formData.get("activity") ?? "").trim().slice(0, 64),
    client_id: String(formData.get("clientId") ?? "").trim().slice(0, 32),
    token: String(formData.get("token") ?? "").trim(),
    modulesRaw: String(formData.get("modules") ?? "{}"),
  };
}

function validateBot(f: ReturnType<typeof readBotForm>): string | undefined {
  if (f.name.length < 2) return "Nazwa bota musi mieć min. 2 znaki.";
  if (f.client_id && !/^\d{17,20}$/.test(f.client_id)) return "Client ID to 17–20 cyfr (znajdziesz go w Discord Developer Portal).";
  if (f.token && f.token.length < 50) return "Token bota wygląda na niepełny.";
}

export async function createBotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (db.countBots(user.id) >= user.plan.maxBots) {
    return {
      error: user.plan.maxBots === 0 ? "Własny bot jest dostępny w pakiecie Pro." : `Osiągnięto limit botów w pakiecie ${user.plan.name}.`,
    };
  }

  const f = readBotForm(formData);
  const invalid = validateBot(f);
  if (invalid) return { error: invalid };
  const { modules, error } = parseModules(f.modulesRaw, user);
  if (error) return { error };

  const id = db.createBot(user.id, {
    name: f.name,
    color: f.color,
    prefix: f.prefix,
    activity: f.activity,
    client_id: f.client_id,
    token_enc: f.token ? encryptSecret(f.token) : null,
    modules: JSON.stringify(modules),
  });
  revalidatePath("/panel", "layout");
  redirect(`/panel/boty/${id}?nowy=1`);
}

export async function updateBotAction(botId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const bot = db.getBot(user.id, botId);
  if (!bot) return { error: "Nie znaleziono bota." };

  const f = readBotForm(formData);
  const invalid = validateBot(f);
  if (invalid) return { error: invalid };
  const { modules, error } = parseModules(f.modulesRaw, user);
  if (error) return { error };

  db.updateBot(user.id, botId, {
    name: f.name,
    color: f.color,
    prefix: f.prefix,
    activity: f.activity,
    client_id: f.client_id,
    modules: JSON.stringify(modules),
    // Pusty token = zostaw obecny.
    ...(f.token ? { token_enc: encryptSecret(f.token) } : {}),
  });
  revalidatePath("/panel", "layout");
  return { success: "Zmiany zapisane." };
}

export async function deleteBotAction(botId: string) {
  const user = await requireUser();
  db.deleteBot(user.id, botId);
  revalidatePath("/panel", "layout");
  redirect("/panel/boty");
}

export async function toggleBotAction(botId: string): Promise<FormState> {
  const user = await requireUser();
  const bot = db.getBot(user.id, botId);
  if (!bot) return { error: "Nie znaleziono bota." };

  if (bot.status === "online") {
    db.updateBot(user.id, botId, { status: "offline" });
  } else {
    if (user.plan.maxBots === 0) return { error: "Własny bot działa w pakiecie Pro – hosting jest w cenie." };
    if (!bot.token_enc) return { error: "Dodaj token bota, aby go uruchomić." };
    // Runner (npm run runner) zauważy zmianę w ciągu kilku sekund i zaloguje bota do Discorda.
    db.requestStart(user.id, botId);
  }
  revalidatePath("/panel", "layout");
  return {};
}

// ---------- serwery ze wspólnym botem Bociak ----------

export async function generateLinkCodeAction(): Promise<{ code: string; expiresAt: number }> {
  const user = await requireUser();
  return { code: db.createLinkCode(user.id), expiresAt: Date.now() + 15 * 60_000 };
}

export async function saveServerModulesAction(serverId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!db.getServer(user.id, serverId)) return { error: "Nie znaleziono serwera." };
  const { modules, error } = parseModules(String(formData.get("modules") ?? "{}"), user);
  if (error) return { error };
  db.updateServerModules(user.id, serverId, JSON.stringify(modules));
  revalidatePath("/panel", "layout");
  return { success: "Zapisano. Bociak wczyta zmiany w ciągu kilku sekund." };
}

export async function unlinkServerAction(serverId: string) {
  const user = await requireUser();
  db.deleteServer(user.id, serverId);
  revalidatePath("/panel", "layout");
  redirect("/panel/serwery");
}

// ---------- konto ----------

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Nazwa musi mieć min. 2 znaki." };
  db.updateUserName(user.id, name.slice(0, 48));
  revalidatePath("/panel", "layout");
  return { success: "Profil zaktualizowany." };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const row = db.findUserById(user.id);
  if (!row || !(await bcrypt.compare(current, row.password_hash))) return { error: "Obecne hasło jest nieprawidłowe." };
  if (next.length < 8) return { error: "Nowe hasło musi mieć min. 8 znaków." };
  db.updateUserPassword(user.id, await bcrypt.hash(next, 12));
  return { success: "Hasło zmienione." };
}
