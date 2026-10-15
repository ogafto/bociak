# Bociak – kreator botów Discord (bociak.pl)

Landing page + system kont + panel klienta (pakiety, kreator botów, hosting).
Next.js 16 (App Router), Tailwind CSS 4, SQLite wbudowany w Node.js.

## Start

```bash
npm install
npm run dev      # strona i panel – http://localhost:3000
npm run runner   # silnik, który naprawdę uruchamia boty klientów (osobny terminal)
```

Plik `.env.local` z `APP_SECRET` jest już wygenerowany. Na nowej maszynie skopiuj `.env.example`
do `.env.local` i ustaw długi losowy sekret (np. `openssl rand -base64 48`). **Strona i runner muszą
mieć ten sam `APP_SECRET`** – runner odszyfrowuje nim tokeny botów. Baza tworzy się sama w `data/app.db`.

**Wspólny bot Bociak (darmowy pakiet):** utwórz w Discord Developer Portal aplikację „Bociak”, włącz
Server Members Intent i Message Content Intent, a potem wpisz w `.env.local` `SHARED_BOT_TOKEN`
i `SHARED_BOT_CLIENT_ID`. Bez tego darmowy pakiet nie ma bota do dodania na serwer.

Wymagany Node.js 24+ (wbudowany `node:sqlite` i uruchamianie TypeScriptu bez kompilacji).

## Silnik botów (runner/)

Jak działa:

- `runner/main.ts` – supervisor. Startuje `RUNNER_WORKERS` procesów (domyślnie 2) i podnosi każdy, który padnie.
- Pakiety: **Darmowy** = wspólny bot Bociak (jeden bot na wiele serwerów, serwer łączony komendą
  `/polacz KOD` z panelu, konfiguracja modułów osobno dla każdego serwera), **Pro** = własny bot klienta
  z hostingiem w cenie, **Enterprise** = wycena indywidualna przez Discorda (`BRAND.discordInvite`).
- `runner/worker.ts` – każdy worker hostuje swoją część botów (podział po ID) w jednym procesie.
  Co 5 s porównuje bazę ze stanem faktycznym: włącza boty z aktywnym hostingiem, wyłącza zatrzymane
  i wygasłe, a zmiany z panelu przeładowuje **bez restartu** (restart tylko przy zmianie tokenu/intencji).
- `runner/bot.ts` – jeden bot klienta: discord.js z minimalnym cache'em (mało RAM-u), rejestracja komend
  /slash, rozsyłanie zdarzeń do modułów, status i dziennik widoczne w panelu.
- `runner/modules/` – implementacje modułów. Moduł bez implementacji ma w katalogu flagę `soon`
  i w panelu oraz na landingu jest oznaczony „Wkrótce”.

- `runner/snapshot.ts` – zapisuje kanały i role serwerów (tabela `guild_snapshots`), żeby panel pokazywał
  listy wyboru zamiast pól na ID. Odświeża się przy każdej zmianie kanałów/ról na serwerze.
- `runner/render.ts` + `src/lib/message.ts` – wiadomości w **Components V2**. Klient projektuje je w panelu
  (kreator wyglądu z podglądem na żywo: tekst, sekcja z miniaturką, obrazek, separator, przyciski-linki,
  kolor paska, zmienne typu `{user}`), a runner zamienia szablon na komponenty discord.js.
  Na razie: powitania, pożegnania, awans na poziom, panel i nowy ticket, konkursy.

Zabezpieczenia: zły token albo brak intencji wyłącza bota z czytelnym komunikatem (bez pętli
logowań), błędy chwilowe są ponawiane z rosnącym odstępem, a bot wysyłający masę błędnych
zapytań jest zatrzymywany, żeby nie narazić wspólnego IP na blokadę Discorda.

### Jak przetestować z prawdziwym botem

1. https://discord.com/developers/applications → New Application → skopiuj **Application ID**.
2. Zakładka **Bot** → Reset Token → skopiuj token. Włącz **Server Members Intent** i **Message Content Intent**.
3. W panelu przejdź na Pro (płatność demo) → Własny bot → wklej Client ID i token → **Uruchom bota**.
4. Na stronie bota kliknij **Dodaj bota na serwer**, wybierz swój serwer i wpisz `/pomoc`.

## Co gdzie jest

| Ścieżka | Co to |
| --- | --- |
| `src/lib/catalog.ts` | **Oferta**: nazwa marki, pakiety, ceny, hosting, moduły botów. Zmieniasz tutaj → zmienia się landing i panel. |
| `src/app/page.tsx` + `src/components/landing/*` | Landing page (hero z animowanym kreatorem, moduły, cennik, FAQ) |
| `src/app/(auth)/*` | Logowanie i rejestracja |
| `src/app/panel/*` | Panel klienta: przegląd, boty, kreator, pakiety i hosting, konto |
| `src/app/actions/*` | Logika serwerowa (Server Actions): konta, zakupy, boty |
| `src/lib/db.ts`, `src/lib/schema.ts` | Baza danych (SQLite) – wspólny schemat dla strony i runnera |
| `runner/` | Silnik uruchamiający boty klientów (opis wyżej) |
| `src/lib/session.ts`, `src/lib/auth.ts` | Sesja w ciasteczku (JWT, httpOnly) i odczyt zalogowanego użytkownika |
| `src/lib/secrets.ts` | Szyfrowanie tokenów botów (AES-256-GCM) |

## Bezpieczeństwo

- Hasła: bcrypt (12 rund).
- Sesja: podpisany JWT w ciasteczku `httpOnly`, `sameSite=lax`, `secure` na produkcji.
- Tokeny botów Discord są w bazie zaszyfrowane, w panelu widać tylko maskę.
- Każda akcja serwerowa sama sprawdza zalogowanego użytkownika i właściciela bota.

## Co jest jeszcze atrapą (kolejne etapy)

1. **Płatności** – `chargeCustomer()` w `src/app/actions/panel.ts` od razu zwraca sukces.
   Tu podpinamy Stripe Checkout / Przelewy24; aktywację pakietu przenosimy do webhooka.
2. **15 modułów „Wkrótce”** (m.in. muzyka, ekonomia, anti-raid, alerty streamów) – są w katalogu,
   ale nie mają jeszcze implementacji w `runner/modules/`.
3. **Liczby na landingu** (`BRAND.stats` w `catalog.ts`) są przykładowe – podmień na prawdziwe.
4. Regulamin i polityka prywatności – checkbox jest, stron jeszcze nie ma.
