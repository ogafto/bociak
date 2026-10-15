// Szablony wiadomości w stylu Components V2 (nowy układ wiadomości Discorda).
// Panel je edytuje, runner zamienia na komponenty discord.js. Bez importów – używają tego oba.

export type MessageBlock =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "section"; content: string; thumbnail: string } // tekst + miniaturka z prawej
  | { id: string; type: "image"; url: string }
  | { id: string; type: "separator"; divider: boolean; spacing: "small" | "large" }
  | { id: string; type: "buttons"; buttons: { label: string; url: string }[] }; // przyciski-linki

export type MessageTemplate = {
  v: 2;
  accent: string | null; // kolor paska kontenera, null = bez paska
  blocks: MessageBlock[];
};

export type TemplateVar = { key: string; label: string; example: string };

export type MessageKind = "welcome" | "goodbye" | "levelup" | "ticketPanel" | "ticketOpened" | "giveaway";

const V = {
  user: { key: "user", label: "Wzmianka osoby", example: "<@Kasia>" },
  username: { key: "username", label: "Nick", example: "Kasia" },
  avatar: { key: "avatar", label: "Avatar osoby (link)", example: "" },
  server: { key: "server", label: "Nazwa serwera", example: "Kraina Graczy" },
  server_icon: { key: "server_icon", label: "Ikona serwera (link)", example: "" },
  count: { key: "count", label: "Liczba osób", example: "1 285" },
  level: { key: "level", label: "Poziom", example: "8" },
  prize: { key: "prize", label: "Nagroda", example: "Nitro na miesiąc" },
  ends: { key: "ends", label: "Koniec (odliczanie)", example: "za 2 dni" },
  winners: { key: "winners", label: "Liczba zwycięzców", example: "1" },
  host: { key: "host", label: "Organizator", example: "<@Michał>" },
  entries: { key: "entries", label: "Liczba uczestników", example: "128" },
} satisfies Record<string, TemplateVar>;

const id = (n: number) => `b${n}`;

export const MESSAGE_KINDS: Record<MessageKind, { label: string; vars: TemplateVar[]; note?: string; presets: { name: string; template: MessageTemplate }[] }> = {
  welcome: {
    label: "Powitanie",
    vars: [V.user, V.username, V.server, V.count, V.avatar, V.server_icon],
    presets: [
      {
        name: "Z miniaturką",
        template: {
          v: 2,
          accent: "#5865f2",
          blocks: [
            { id: id(1), type: "section", content: "## Witaj, {username}! 👋\nCieszymy się, że wpadłeś(-aś) na **{server}**.", thumbnail: "{avatar}" },
            { id: id(2), type: "separator", divider: true, spacing: "small" },
            { id: id(3), type: "text", content: "📜 Przeczytaj regulamin\n🎭 Odbierz role\n💬 Przywitaj się na czacie" },
            { id: id(4), type: "text", content: "-# Jesteś {count}. osobą na serwerze" },
          ],
        },
      },
      {
        name: "Minimalny",
        template: { v: 2, accent: null, blocks: [{ id: id(1), type: "text", content: "Hej {user}, witaj na **{server}**! 🎉" }] },
      },
      {
        name: "Z banerem",
        template: {
          v: 2,
          accent: "#eb459e",
          blocks: [
            { id: id(1), type: "image", url: "" }, // klient wkleja link do swojego banera
            { id: id(2), type: "text", content: "# Witaj {username}!\nNa **{server}** jest nas już **{count}**." },
          ],
        },
      },
    ],
  },
  goodbye: {
    label: "Pożegnanie",
    vars: [V.username, V.server, V.count, V.avatar],
    presets: [
      {
        name: "Klasyczny",
        template: {
          v: 2,
          accent: "#4e5058",
          blocks: [{ id: id(1), type: "section", content: "**{username}** opuścił(a) serwer. Do zobaczenia! 👋\n-# Zostało nas {count}", thumbnail: "{avatar}" }],
        },
      },
      { name: "Minimalny", template: { v: 2, accent: null, blocks: [{ id: id(1), type: "text", content: "👋 {username} opuścił(a) serwer." }] } },
    ],
  },
  levelup: {
    label: "Awans na poziom",
    vars: [V.user, V.username, V.level, V.avatar, V.server],
    presets: [
      {
        name: "Z miniaturką",
        template: {
          v: 2,
          accent: "#fee75c",
          blocks: [{ id: id(1), type: "section", content: "### 🎉 Nowy poziom!\n{user} wbija **poziom {level}**. Tak trzymaj!", thumbnail: "{avatar}" }],
        },
      },
      { name: "Minimalny", template: { v: 2, accent: null, blocks: [{ id: id(1), type: "text", content: "🎉 {user} wbija **poziom {level}**!" }] } },
    ],
  },
  ticketPanel: {
    label: "Panel ticketów",
    vars: [V.server, V.server_icon],
    note: "Przycisk „Otwórz ticket” dodamy na dole automatycznie.",
    presets: [
      {
        name: "Klasyczny",
        template: {
          v: 2,
          accent: "#5865f2",
          blocks: [
            { id: id(1), type: "section", content: "## 📩 Potrzebujesz pomocy?\nKliknij przycisk poniżej – otworzymy prywatny kanał z administracją **{server}**.", thumbnail: "{server_icon}" },
          ],
        },
      },
    ],
  },
  ticketOpened: {
    label: "Nowy ticket",
    vars: [V.user, V.username, V.server],
    note: "Przycisk „Zamknij ticket” dodamy na dole automatycznie.",
    presets: [
      {
        name: "Klasyczny",
        template: {
          v: 2,
          accent: "#57f287",
          blocks: [{ id: id(1), type: "text", content: "### 🎫 Ticket otwarty\nCześć {user}! Opisz, w czym możemy pomóc – administracja odpowie najszybciej, jak się da." }],
        },
      },
    ],
  },
  giveaway: {
    label: "Konkurs",
    vars: [V.prize, V.ends, V.winners, V.host, V.entries],
    note: "Przycisk „Biorę udział” dodamy na dole automatycznie.",
    presets: [
      {
        name: "Klasyczny",
        template: {
          v: 2,
          accent: "#eb459e",
          blocks: [
            { id: id(1), type: "text", content: "# 🎁 {prize}" },
            { id: id(2), type: "separator", divider: true, spacing: "small" },
            { id: id(3), type: "text", content: "Koniec: **{ends}**\nZwycięzców: **{winners}** · Uczestników: **{entries}**\n-# Organizator: {host}" },
          ],
        },
      },
    ],
  },
};

export function defaultTemplate(kind: MessageKind): MessageTemplate {
  return structuredClone(MESSAGE_KINDS[kind].presets[0].template);
}

/** Bezpieczny odczyt szablonu z ustawień modułu; przy błędzie – domyślny. */
export function parseTemplate(raw: string | undefined, kind: MessageKind): MessageTemplate {
  if (!raw) return defaultTemplate(kind);
  try {
    const t = JSON.parse(raw) as MessageTemplate;
    if (t?.v === 2 && Array.isArray(t.blocks)) return t;
  } catch {}
  return defaultTemplate(kind);
}

/** Podstawia {zmienne}. Nieznane zostawia bez zmian. */
export function fillVars(text: string, vars: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (all, key: string) => (key in vars ? vars[key] : all));
}

export const MAX_BLOCKS = 10;

// ---------- darmowy pakiet: tylko gotowe style ----------

/** Czy szablon to jeden z gotowych stylów (kolor paska może być dowolny). */
export function isPresetTemplate(kind: MessageKind, t: MessageTemplate) {
  const blocks = JSON.stringify(t.blocks);
  return MESSAGE_KINDS[kind].presets.some((p) => JSON.stringify(p.template.blocks) === blocks);
}

/**
 * Szablon dozwolony w darmowym pakiecie: gotowy styl zostaje, własny wzór zamieniamy
 * na domyślny styl – kolor paska wybrany przez klienta zostaje.
 */
export function toFreeTemplate(raw: string | undefined, kind: MessageKind): MessageTemplate {
  const t = parseTemplate(raw, kind);
  if (isPresetTemplate(kind, t)) return t;
  return { ...defaultTemplate(kind), accent: t.accent };
}
