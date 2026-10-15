import { Users } from "lucide-react";
import type { ShowcaseServer } from "@/lib/db";
import { count, plural } from "@/lib/plural";
import { CountUp, Reveal } from "./motion";
import { CONTAINER, Label } from "./ui";

// Slider serwerów, na których działa Bociak. Pokazujemy tylko serwery, których właściciel
// włączył „Pochwal się na stronie Bociaka” w panelu. Sumy (serwery, osoby) są bez nazw, więc liczymy wszystkie.

export const SHOWCASE_MIN = 3; // poniżej tego sekcja się nie pokazuje – pusty slider wygląda gorzej niż brak

export function Showcase({ servers, totalServers, totalMembers }: { servers: ShowcaseServer[]; totalServers: number; totalMembers: number }) {
  if (servers.length < SHOWCASE_MIN) return null;

  // pasek musi być szerszy niż ekran, żeby pętla była płynna – przy kilku serwerach powtarzamy listę
  const repeat = Math.max(2, Math.ceil(12 / servers.length));
  const row = Array.from({ length: repeat }, () => servers).flat();
  const half = Math.ceil(row.length / 2);
  const rows = servers.length >= 8 ? [row.slice(0, half), row.slice(half)] : [row];

  return (
    <section className="relative py-20 sm:py-24">
      <div className={`${CONTAINER} text-center`}>
        <Reveal y={10}>
          <Label>Zaufały nam serwery</Label>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-2xl font-heading text-[1.7rem] font-medium leading-tight tracking-[-0.03em] text-white sm:text-[2.2rem]">
            Bociak działa już na <CountUp to={totalServers} className="text-brand-300" /> {plural(totalServers, "serwerze", "serwerach", "serwerach")}, na których {plural(totalMembers, "jest", "są", "jest")}{" "}
            <CountUp to={totalMembers} className="text-brand-300" /> {plural(totalMembers, "osoba", "osoby", "osób")}
          </p>
        </Reveal>
      </div>

      <div className="mt-12 space-y-3 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        {rows.map((list, r) => (
          <div key={r} className="flex w-max animate-marquee gap-3 pr-3" style={{ animationDuration: `${Math.max(30, list.length * 4)}s`, animationDirection: r ? "reverse" : "normal" }}>
            {[...list, ...list].map((s, i) => (
              <ServerChip key={`${s.guildId}-${i}`} server={s} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function ServerChip({ server }: { server: ShowcaseServer }) {
  const initials = server.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex w-[260px] shrink-0 items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[#111113] p-3 pr-4 transition-colors hover:border-white/15">
      {server.icon ? (
        // eslint-disable-next-line @next/next/no-img-element -- ikona z CDN Discorda
        <img src={server.icon} alt="" className="size-11 shrink-0 rounded-[12px] object-cover" loading="lazy" />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-[linear-gradient(135deg,#eb459e,#5865f2)] text-[14px] font-semibold text-white">{initials}</span>
      )}
      <div className="min-w-0 text-left">
        <div className="truncate text-[14.5px] font-medium text-white">{server.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/45">
          <Users className="size-3.5" />
          {server.members > 0 ? count(server.members, "osoba", "osoby", "osób") : "nowy serwer"}
        </div>
      </div>
    </div>
  );
}
