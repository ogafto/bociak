import { MessageCircleQuestion, Plus } from "lucide-react";
import { BRAND } from "@/lib/catalog";
import { Logo } from "@/components/ui/logo";
import { Curtain } from "./curtain";
import { Reveal } from "./motion";
import { Logo3D } from "./three-d";
import { Button, CONTAINER, Card, SectionIntro } from "./ui";

const FAQ = [
  {
    q: "Czym różni się Darmowy od Bota Pro?",
    a: "W Darmowym dodajesz na serwer naszego bota Bociak – na dowolną liczbę serwerów, z podstawowymi modułami i gotowymi stylami wiadomości. Bot Pro to Twój własny bot: Twoja nazwa, avatar i status, wszystkie moduły bez limitów, pełny kreator wiadomości i brak podpisu Bociaka.",
  },
  {
    q: "Ile kosztuje kilka botów?",
    a: "Każdy własny bot to osobny pakiet: 9,99 zł miesięcznie albo 99 zł za rok. Jeden bot może działać na dowolnej liczbie serwerów, więc większości osób wystarcza jeden.",
  },
  { q: "Czy mogę najpierw wypróbować Bota Pro?", a: "Tak. Pierwszy Bot Pro na koncie ma 7 dni za darmo – bez podawania karty. Po tym czasie opłacasz go albo bot się wyłącza." },
  { q: "Czy hosting jest osobno płatny?", a: "Nie. Darmowy Bociak działa na naszych serwerach, a hosting każdego Bota Pro 24/7 jest wliczony w jego cenę." },
  {
    q: "Czy muszę umieć programować?",
    a: "Nie. Wszystko wyklikasz w panelu: włączasz moduły, wybierasz kanały z listy i zapisujesz. Do Bota Pro potrzebny jest tylko token z Discord Developer Portal – prowadzimy krok po kroku, a token przechowujemy zaszyfrowany.",
  },
  { q: "Czy mogę zrezygnować w każdej chwili?", a: "Tak. Płacisz za bota, bez umów. Gdy go nie przedłużysz, bot się wyłączy, a jego konfiguracja zostanie zapisana – wrócisz, kiedy zechcesz." },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionIntro icon={MessageCircleQuestion} label="FAQ" title="Masz pytania?" muted="Mamy odpowiedzi." />
        <Reveal className="mt-14 grid grid-cols-1 items-start gap-3 md:grid-cols-2">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-white/[0.06] bg-[#111113] transition-colors open:bg-[#141416]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-[16px] text-white/90 [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus className="size-4 shrink-0 text-white/60 transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="-mt-1 px-5 pb-5 text-[15px] leading-[1.55] text-[#b0b0b0]">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// Finał: duża karta – po lewej hasło i przycisk, po prawej poświata z obracającym się logo 3D.
export function FinalCta() {
  return (
    <section className="pb-24 pt-8 sm:pb-32">
      <div className={CONTAINER}>
        <Reveal>
          <Card className="grid min-h-[380px] grid-cols-1 items-center md:grid-cols-[1fr_1fr]">
            <Curtain strong base="17 17 19" fadeTop={false} className="inset-y-0 right-0 w-full [mask-image:linear-gradient(to_right,transparent_5%,#000_55%)] md:w-[70%]" />
            <div className="relative p-7 sm:p-10">
              <h2 className="text-[2.2rem] font-normal leading-[1.06] tracking-[-0.04em] text-white sm:text-[2.8rem]">
                Serwer nie śpi.
                <br />
                <span className="text-[#8b8b93]">Bociak też nie.</span>
              </h2>
              <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-[#b0b0b0]">Załóż konto, dodaj Bociaka i włącz pierwsze moduły. Zajmie Ci to mniej niż dwie minuty.</p>
              <Button href="/rejestracja" className="mt-7">
                Zacznij za darmo
              </Button>
            </div>
            <div className="relative hidden justify-center md:flex">
              <div className="animate-hover-y">
                <Logo3D size={170} />
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className={`${CONTAINER} grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]`}>
        <div>
          <Logo />
          <p className="mt-4 max-w-[17rem] text-[15px] leading-relaxed text-[#9a9aa2]">Bot Discord, który ogarnia serwer za Ciebie. Konfigurujesz w panelu, hosting jest w cenie.</p>
        </div>
        <FooterCol title="Nawigacja" links={[["Funkcje", "#funkcje"], ["Moduły", "#moduly"], ["Cennik", "#cennik"], ["FAQ", "#faq"]]} />
        <FooterCol title="Konto" links={[["Załóż konto", "/rejestracja"], ["Zaloguj się", "/logowanie"]]} />
        <FooterCol title="Kontakt" links={[["Discord", BRAND.discordInvite], ["E-mail", `mailto:${BRAND.supportEmail}`]]} />
      </div>
      <div className={`${CONTAINER} flex flex-col justify-between gap-2 border-t border-white/[0.06] py-6 text-[13.5px] text-white/40 sm:flex-row`}>
        <span>© {new Date().getFullYear()} {BRAND.domain}</span>
        <span>Nie jesteśmy powiązani z Discord Inc.</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-[15px] text-white">{title}</div>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-[14.5px] text-[#9a9aa2] transition-colors hover:text-white">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
