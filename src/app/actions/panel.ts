"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { BOT_COLORS, FREE_LIMITS, FREE_RULES, PLANS, PRO_RULES, PRO_TRIAL_DAYS, getModule } from "@/lib/catalog";
import * as db from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";
import { toFreeTemplate, type MessageTemplate } from "@/lib/message";
import { botPayment } from "@/lib/bots";

export type FormState = { error?: string; success?: string };

const DAY = 24 * 60 * 60 * 1000;
const MAX_BOTS_PER_ACCOUNT = 10; // zabezpieczenie przed spamem – więcej w Enterprise

// ---------- płatności (symulacja) ----------
// Tu w przyszłości: utworzenie sesji Stripe / PayU (BLIK) i aktywacja w webhooku.
async function chargeCustomer(user: CurrentUser, amount: number, description: string) {
  console.info(`[płatność demo] ${user.email}: ${description} – ${amount} zł`);
  return { ok: true as const };
}

/** Opłata Bota Pro za miesiąc albo rok. Kolejny okres liczy się od końca obecnego. */
export async function buyBotAction(botId: string, period: "month" | "year") {
  const user = await requireUser();
  const bot = db.getBot(user.id, botId);
  if (!bot) return;
  const pro = PLANS.find((p) => p.id === "pro")!;
  const amount = period === "year" ? pro.yearlyPrice! : pro.price!;
  const payment = await chargeCustomer(user, amount, `Bot Pro „${bot.name}” – ${period === "year" ? "rok" : "miesiąc"}`);
  if (!payment.ok) return;

  const current = botPayment(bot);
  const base = current.paid && current.until ? new Date(current.until).getTime() : Date.now();
  const until = new Date(base + (period === "year" ? 365 : 30) * DAY).toISOString();
  db.setBotPaid(user.id, botId, period, until);
  db.createOrder({ user_id: user.id, kind: "bot", item: period, bot_id: botId, amount });
  revalidatePath("/panel", "layout");
  redirect(`/panel/boty/${botId}?oplacono=1`);
}

/** Okres próbny Bota Pro – raz na konto, tylko dla nieopłaconego bota. */
export async function startTrialAction(botId: string): Promise<FormState> {
  const user = await requireUser();
  const bot = db.getBot(user.id, botId);
  if (!bot) return { error: "Nie znaleziono bota." };
  if (user.trialUsed) return { error: "Okres próbny został już wykorzystany na tym koncie." };
  if (botPayment(bot).paid) return { error: "Ten bot jest już opłacony." };
  db.setBotPaid(user.id, botId, "trial", new Date(Date.now() + PRO_TRIAL_DAYS * DAY).toISOString());
  db.markTrialUsed(user.id);
  revalidatePath("/panel", "layout");
  redirect(`/panel/boty/${botId}?proba=1`);
}

// ---------- strona główna: zgoda na pokazanie serwera ----------

export async function setServerShowcaseAction(serverId: string, on: boolean) {
  const user = await requireUser();
  db.setServerShowcase(user.id, serverId, on);
  revalidatePath("/panel", "layout");
  revalidatePath("/");
}

export async function setBotShowcaseAction(botId: string, on: boolean) {
  const user = await requireUser();
  db.setBotShowcase(user.id, botId, on);
  revalidatePath("/panel", "layout");
  revalidatePath("/");
}

// ---------- boty ----------

function parseModules(raw: string, rules: { premiumModules: boolean }): { modules?: db.ModuleConfig; error?: string } {
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
    if (mod.premium && !rules.premiumModules) {
      return { error: `Moduł „${mod.name}” działa na Bocie Pro.` };
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
        clean[field.key] = rules.premiumModules ? v : JSON.stringify(toFreeTemplate(v, field.message));
      } else clean[field.key] = v.slice(0, 4000);
    }
    // darmowy Bociak: limit linii w modułach-listach (komendy, autoodpowiedzi)
    const limit = FREE_LIMITS[id];
    if (!rules.premiumModules && limit) {
      const lines = (clean[limit.field] ?? "").split("\n").filter((l) => l.trim()).length;
      if (lines > limit.max) return { error: `Darmowy Bociak obsługuje do ${limit.max} ${limit.label}. Usuń nadmiar albo przejdź na Bota Pro.` };
    }
    modules[id] = clean;
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
  if (db.countBots(user.id) >= MAX_BOTS_PER_ACCOUNT) {
    return { error: `Na jednym koncie możesz mieć do ${MAX_BOTS_PER_ACCOUNT} botów. Potrzebujesz więcej? Napisz do nas (Enterprise).` };
  }

  const f = readBotForm(formData);
  const invalid = validateBot(f);
  if (invalid) return { error: invalid };
  const { modules, error } = parseModules(f.modulesRaw, PRO_RULES);
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
  const { modules, error } = parseModules(f.modulesRaw, PRO_RULES);
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
    if (!botPayment(bot).paid) return { error: "Opłać bota albo włącz okres próbny, żeby go uruchomić." };
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
  const { modules, error } = parseModules(String(formData.get("modules") ?? "{}"), FREE_RULES);
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
