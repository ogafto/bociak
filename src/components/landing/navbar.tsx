"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { Button } from "./ui";

// Nawigacja: na górze strony szeroka i przezroczysta, po przewinięciu kurczy się do pływającej
// „pigułki” z rozmytym tłem. Linki mają przesuwaną podświetlankę. Poniżej laptopa – menu na cały ekran.

const LINKS = [
  { href: "#funkcje", label: "Funkcje" },
  { href: "#moduly", label: "Moduły" },
  { href: "#jak-to-dziala", label: "Jak to działa" },
  { href: "#cennik", label: "Cennik" },
  { href: "#faq", label: "FAQ" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className={`fixed inset-x-0 top-0 z-50 px-3 transition-[padding] duration-500 sm:px-5 ${scrolled ? "pt-3" : "pt-0"}`}
      >
        <nav
          className={`mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            scrolled
              ? "h-14 max-w-[960px] rounded-2xl border border-white/[0.08] bg-[#121214]/75 pl-4 pr-2 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl"
              : "h-[72px] max-w-[1140px] border border-transparent px-2 sm:px-3"
          }`}
        >
          <Logo />

          <ul className="hidden items-center lg:flex" onMouseLeave={() => setHover(null)}>
            {LINKS.map((l) => (
              <li key={l.href} className="relative" onMouseEnter={() => setHover(l.href)}>
                {hover === l.href && <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-[10px] bg-white/[0.07]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                <a href={l.href} className="relative block px-3.5 py-2 text-[14.5px] text-white/70 transition-colors hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/logowanie" className="rounded-[10px] px-3.5 py-2 text-[14.5px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
              Zaloguj się
            </Link>
            <Button href="/rejestracja" size="sm" variant={scrolled ? "light" : "dark"}>
              Zacznij za darmo
            </Button>
          </div>

          <button
            className="relative z-10 grid size-10 place-items-center rounded-[10px] border border-white/[0.08] bg-[#141416] lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={open}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-[1.5px] w-full rounded bg-white transition-all duration-300 ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rounded bg-white transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-[1.5px] w-full rounded bg-white transition-all duration-300 ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"}`} />
            </span>
          </button>
        </nav>
      </motion.header>

      {/* menu na cały ekran */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="fixed inset-0 z-40 flex flex-col bg-[#0d0d0f]/95 px-6 pb-8 pt-28 backdrop-blur-xl lg:hidden"
          >
            <ul className="flex-1">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.6, ease: EASE }}
                >
                  <a
                    href={l.href}
                    onClick={() => {
                      // odblokuj przewijanie od razu, żeby kotwica zadziałała
                      document.documentElement.style.overflow = "";
                      setOpen(false);
                    }}
                    className="flex items-center justify-between border-b border-white/[0.06] py-5 font-heading text-[2rem] font-medium tracking-[-0.03em] text-white">
                    {l.label}
                    <span className="text-[13px] font-normal tracking-normal text-white/30">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6, ease: EASE }} className="grid gap-2">
              <Button href="/rejestracja" arrow className="w-full">
                Zacznij za darmo
              </Button>
              <Button href="/logowanie" variant="dark" className="w-full">
                Zaloguj się
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
