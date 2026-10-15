// Centralna konfiguracja oferty: marka, pakiety i moduły botów.
import type { MessageKind } from "./message.ts";
// Zmieniasz tu – zmienia się landing page i panel klienta.

export const BRAND = {
  name: "Bociak",
  domain: "bociak.pl",
  tagline: "Własny bot Discord w 5 minut. Bez linijki kodu.",
  supportEmail: "kontakt@bociak.pl",
  // Zaproszenie na serwer Discord Bociaka (wsparcie, Enterprise) – podmień na swój link.
  discordInvite: "https://discord.gg/bociak",
  // Liczby marketingowe na landing page – podmień na prawdziwe.
  stats: [
    { value: "2 400+", label: "serwerów z naszymi botami" },
    { value: "99,9%", label: "uptime hostingu" },
    { value: "< 5 min", label: "od pomysłu do działającego bota" },
  ],
};

export type PlanId = "start" | "pro" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  price: number | null; // zł / miesiąc; null = wycena indywidualna
  description: string;
  maxServers: number; // serwery ze wspólnym botem Bociak; Infinity = bez limitu
  maxBots: number; // własne boty klienta (token z Developer Portal), hosting w cenie
  maxModules: number; // na serwer / bota; Infinity = bez limitu
  premiumModules: boolean;
  features: string[];
  highlighted?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "start",
    name: "Darmowy",
    price: 0,
    description: "Bot Bociak na Twoim serwerze.",
    maxServers: 3,
    maxBots: 0,
    maxModules: 5,
    premiumModules: false,
    features: [
      "Bot Bociak – nasza nazwa i logo",
      "Do 3 serwerów",
      "Do 5 modułów na serwer",
      "Darmowe moduły (moderacja, tickety, powitania…)",
      "Gotowe style wiadomości i kolory",
      "Bez tokenu i Developer Portalu",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    description: "Twój własny bot, hosting w cenie.",
    maxServers: Infinity,
    maxBots: 1,
    maxModules: Infinity,
    premiumModules: true,
    highlighted: true,
    features: [
      "Własny bot: Twoja nazwa, avatar i status",
      "Hosting 24/7 w cenie",
      "Wszystkie moduły, także PRO",
      "Pełny kreator wyglądu wiadomości",
      "Bociak bez limitu serwerów",
      "Priorytetowe wsparcie",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    description: "Coś szytego na miarę.",
    maxServers: Infinity,
    maxBots: 10,
    maxModules: Infinity,
    premiumModules: true,
    features: [
      "Kilka własnych botów",
      "Funkcje robione na zamówienie",
      "Dedykowane zasoby serwera",
      "Indywidualne warunki i faktura",
      "Kontakt bezpośrednio na Discordzie",
    ],
  },
];

export type ModuleField = {
  key: string;
  label: string;
  placeholder?: string;
  /** channel/category/role – wybór z listy kanałów i ról serwera (panel), w bazie zapisujemy ID. */
  type?: "text" | "textarea" | "channel" | "category" | "role" | "message";
  /** Dla type: "message" – która wiadomość (zmienne i gotowe style w src/lib/message.ts). */
  message?: MessageKind;
};

export type ModuleCategory = "moderacja" | "spolecznosc" | "zabawa" | "narzedzia" | "integracje";

export const MODULE_CATEGORIES: { id: ModuleCategory; name: string }[] = [
  { id: "moderacja", name: "Moderacja i bezpieczeństwo" },
  { id: "spolecznosc", name: "Społeczność" },
  { id: "zabawa", name: "Zabawa" },
  { id: "narzedzia", name: "Narzędzia" },
  { id: "integracje", name: "Integracje" },
];

export type BotModule = {
  id: string;
  name: string;
  description: string;
  icon: string; // nazwa ikony, patrz components/ui/module-icon.tsx
  category: ModuleCategory;
  premium: boolean;
  soon?: boolean; // jeszcze nie działa w silniku botów – pokazujemy jako „Wkrótce”
  fields?: ModuleField[];
};

export const MODULES: BotModule[] = [
  // --- moderacja ---
  { id: "moderation", category: "moderacja", premium: false, icon: "shield", name: "Moderacja", description: "Ban, kick, wyciszenia, ostrzeżenia i czyszczenie czatu.", fields: [{ key: "modRole", label: "Rola moderatora", type: "role" }] },
  { id: "automod", category: "moderacja", premium: false, icon: "filter", name: "Automoderacja", description: "Filtr wulgaryzmów, linków, zaproszeń i CAPS LOCKA.", fields: [{ key: "words", label: "Zakazane słowa (po przecinku)", placeholder: "słowo1, słowo2", type: "textarea" }] },
  { id: "antispam", category: "moderacja", premium: false, icon: "spam", name: "Anti-spam", description: "Wycisza osoby, które zalewają czat wiadomościami." },
  { id: "logs", category: "moderacja", premium: false, icon: "scroll", name: "Logi serwera", description: "Edycje, usunięcia, zmiany ról i nicków w jednym kanale.", fields: [{ key: "channel", label: "Kanał logów", type: "channel" }] },
  { id: "antiraid", soon: true, category: "moderacja", premium: true, icon: "shieldAlert", name: "Anti-raid", description: "Blokuje masowe wejścia, raidy i nowe podejrzane konta." },
  { id: "verification", soon: true, category: "moderacja", premium: true, icon: "shieldCheck", name: "Weryfikacja", description: "Captcha lub przycisk przy wejściu – koniec z botami-spamerami.", fields: [{ key: "role", label: "Rola po weryfikacji", type: "role" }] },
  { id: "backup", soon: true, category: "moderacja", premium: true, icon: "backup", name: "Kopia serwera", description: "Zapis ról i kanałów – odtworzysz serwer po ataku." },

  // --- społeczność ---
  { id: "welcome", category: "spolecznosc", premium: false, icon: "party", name: "Powitania", description: "Wiadomość lub grafika powitalna dla nowych osób.", fields: [{ key: "channel", label: "Kanał powitań", type: "channel" }, { key: "design", label: "Wygląd powitania", type: "message", message: "welcome" }] },
  { id: "goodbye", category: "spolecznosc", premium: false, icon: "door", name: "Pożegnania", description: "Informuje, gdy ktoś opuszcza serwer.", fields: [{ key: "channel", label: "Kanał", type: "channel" }, { key: "design", label: "Wygląd pożegnania", type: "message", message: "goodbye" }] },
  { id: "autorole", category: "spolecznosc", premium: false, icon: "userPlus", name: "Autorole", description: "Automatycznie nadaje role nowym osobom.", fields: [{ key: "role", label: "Rola", type: "role" }] },
  { id: "tickets", category: "spolecznosc", premium: false, icon: "ticket", name: "Tickety", description: "Zgłoszenia w prywatnych kanałach z zapisem rozmowy.", fields: [{ key: "category", label: "Kategoria ticketów", type: "category" }, { key: "role", label: "Rola supportu (opcjonalnie)", type: "role" }, { key: "designPanel", label: "Wygląd panelu ticketów", type: "message", message: "ticketPanel" }, { key: "designOpened", label: "Wygląd nowego ticketu", type: "message", message: "ticketOpened" }] },
  { id: "suggestions", category: "spolecznosc", premium: false, icon: "lightbulb", name: "Propozycje", description: "Członkowie zgłaszają pomysły, reszta głosuje.", fields: [{ key: "channel", label: "Kanał propozycji", type: "channel" }] },
  { id: "polls", category: "spolecznosc", premium: false, icon: "vote", name: "Ankiety", description: "Szybkie głosowania z przyciskami i wynikami na żywo." },
  { id: "reactionroles", soon: true, category: "spolecznosc", premium: true, icon: "smile", name: "Role za reakcje", description: "Samoobsługowe role po kliknięciu emoji lub przycisku." },
  { id: "levels", category: "spolecznosc", premium: true, icon: "trending", name: "Poziomy i XP", description: "Ranking aktywności i role za kolejne poziomy.", fields: [{ key: "channel", label: "Kanał ogłoszeń o awansie (opcjonalnie)", type: "channel" }, { key: "design", label: "Wygląd ogłoszenia o awansie", type: "message", message: "levelup" }] },
  { id: "birthdays", soon: true, category: "spolecznosc", premium: true, icon: "cake", name: "Urodziny", description: "Życzenia i specjalna rola w dniu urodzin." },
  { id: "applications", soon: true, category: "spolecznosc", premium: true, icon: "clipboard", name: "Rekrutacja", description: "Formularze podań do administracji z akceptacją jednym klikiem." },
  { id: "starboard", soon: true, category: "spolecznosc", premium: true, icon: "star", name: "Starboard", description: "Najlepsze wiadomości trafiają na tablicę sławy." },
  { id: "invites", soon: true, category: "spolecznosc", premium: true, icon: "link", name: "Śledzenie zaproszeń", description: "Kto kogo zaprosił – z nagrodami za zaproszenia." },

  // --- zabawa ---
  { id: "minigames", category: "zabawa", premium: false, icon: "gamepad", name: "Minigry", description: "Quiz, kości, kółko i krzyżyk, papier-kamień-nożyce." },
  { id: "counting", category: "zabawa", premium: false, icon: "hash", name: "Liczenie", description: "Klasyczna gra w liczenie na wyznaczonym kanale.", fields: [{ key: "channel", label: "Kanał do liczenia", type: "channel" }] },
  { id: "afk", category: "zabawa", premium: false, icon: "moon", name: "AFK", description: "Status nieobecności z automatyczną odpowiedzią." },
  { id: "music", soon: true, category: "zabawa", premium: true, icon: "music", name: "Muzyka", description: "Radio i kolejka utworów na kanałach głosowych." },
  { id: "giveaways", category: "zabawa", premium: true, icon: "gift", name: "Konkursy", description: "Giveawaye z losowaniem, wymaganiami i rerollem.", fields: [{ key: "design", label: "Wygląd konkursu", type: "message", message: "giveaway" }] },
  { id: "economy", soon: true, category: "zabawa", premium: true, icon: "coins", name: "Ekonomia", description: "Waluta serwera, praca, sklep z rolami i ranking bogaczy." },

  // --- narzędzia ---
  { id: "commands", category: "narzedzia", premium: false, icon: "terminal", name: "Własne komendy", description: "Twórz komendy /slash z własnymi odpowiedziami.", fields: [{ key: "list", label: "Komendy – jedna na linię: nazwa = odpowiedź", placeholder: "regulamin = Przeczytaj #regulamin, zanim zaczniesz pisać!", type: "textarea" }] },
  { id: "autoresponder", category: "narzedzia", premium: false, icon: "reply", name: "Autoodpowiedzi", description: "Bot odpowiada na wybrane słowa i pytania.", fields: [{ key: "list", label: "Frazy – jedna na linię: fraza = odpowiedź", placeholder: "jak zdobyć rolę = Napisz /pomoc albo zajrzyj na #role", type: "textarea" }] },
  { id: "embeds", category: "narzedzia", premium: false, icon: "layout", name: "Kreator embedów", description: "Ładne ogłoszenia z kolorem, obrazkiem i przyciskami." },
  { id: "reminders", category: "narzedzia", premium: false, icon: "alarm", name: "Przypomnienia", description: "„Przypomnij mi za 2h” – dla każdego na serwerze." },
  { id: "sticky", category: "narzedzia", premium: false, icon: "pin", name: "Przyklejone wiadomości", description: "Ważna wiadomość zawsze na dole kanału.", fields: [{ key: "channel", label: "Kanał", type: "channel" }, { key: "text", label: "Treść przyklejonej wiadomości", placeholder: "📌 Pamiętaj o regulaminie!", type: "textarea" }] },
  { id: "scheduler", soon: true, category: "narzedzia", premium: true, icon: "calendar", name: "Zaplanowane wiadomości", description: "Ogłoszenia wysyłane o konkretnej godzinie lub cyklicznie." },
  { id: "tempvoice", soon: true, category: "narzedzia", premium: true, icon: "headphones", name: "Tymczasowe kanały", description: "Każdy tworzy własny kanał głosowy, który znika po wyjściu." },
  { id: "stats", soon: true, category: "narzedzia", premium: true, icon: "chart", name: "Liczniki", description: "Kanały z liczbą członków, osób online i boostów." },

  // --- integracje ---
  { id: "rss", soon: true, category: "integracje", premium: false, icon: "rss", name: "RSS i newsy", description: "Nowe wpisy z dowolnej strony prosto na kanał.", fields: [{ key: "url", label: "Adres kanału RSS", placeholder: "https://example.com/feed" }] },
  { id: "streams", soon: true, category: "integracje", premium: true, icon: "radio", name: "Alerty streamów", description: "Powiadomienia o live na Twitchu, Kicku i YouTube.", fields: [{ key: "channels", label: "Kanały streamerów (po przecinku)", placeholder: "twitch.tv/nick, kick.com/nick" }] },
];

export const BOT_COLORS = ["#5865f2", "#eb459e", "#57f287", "#fee75c", "#ed4245", "#22d3ee", "#fb923c", "#a78bfa"];

/** Limity pakietu w postaci, którą da się przekazać do komponentów klienta (bez Infinity). */
export function pickerPlan(plan: Plan) {
  return { maxModules: Number.isFinite(plan.maxModules) ? plan.maxModules : null, premiumModules: plan.premiumModules };
}

/** Moduły, które silnik botów już obsługuje. */
export const READY_MODULES = MODULES.filter((m) => !m.soon);

export function getPlan(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function getModule(id: string): BotModule | undefined {
  return MODULES.find((m) => m.id === id);
}

export function formatPrice(price: number | null) {
  if (price === null) return "Indywidualnie";
  if (price === 0) return "0 zł";
  return `${price.toFixed(2).replace(".", ",")} zł`;
}
