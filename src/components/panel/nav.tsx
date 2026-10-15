"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Bot, CreditCard, LayoutGrid, Server, UserRound } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { BotAvatar } from "@/components/ui/bot-avatar";

// Nawigacja panelu: pasek boczny na komputerze (grupy, płynnie przesuwane zaznaczenie),
// a na telefonie górny pasek + pływające dolne zakładki jak w aplikacji.

const GROUPS = [
  {
    label: "Zarządzanie",
    items: [
      { href: "/panel", label: "Przegląd", short: "Start", icon: LayoutGrid },
      { href: "/panel/serwery", label: "Serwery", short: "Serwery", icon: Server },
      { href: "/panel/boty", label: "Własny bot", short: "Mój bot", icon: Bot },
    ],
  },
  {
    label: "Konto",
    items: [
      { href: "/panel/pakiety", label: "Pakiety", short: "Pakiety", icon: CreditCard },
      { href: "/panel/konto", label: "Ustawienia konta", short: "Konto", icon: UserRound },
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.items);

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/panel" ? pathname === "/panel" : pathname.startsWith(href));
}

export function PanelNav({ footer, userName }: { footer: React.ReactNode; userName: string }) {
  const isActive = useActive();

  return (
    <>
      {/* komputer: pasek boczny */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0b0d] px-4 py-5 lg:flex">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="px-2 py-1">
          <Logo href="/panel" />
        </motion.div>
        <nav className="mt-8 flex-1 space-y-7">
          {GROUPS.map((g, gi) => (
            <div key={g.label}>
              <div className="px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/30">{g.label}</div>
              <ul className="mt-2 space-y-0.5">
                {g.items.map((item, i) => {
                  const active = isActive(item.href);
                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + (gi * 3 + i) * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={item.href}
                        className={`group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14.5px] transition-colors ${
                          active ? "text-white" : "text-white/55 hover:text-white"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="nav-active"
                            className="absolute inset-0 rounded-[12px] border border-white/[0.08] bg-white/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
                            transition={{ type: "spring", stiffness: 420, damping: 36 }}
                          >
                            <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-x-[13px] -translate-y-1/2 rounded-r-full bg-brand-400 shadow-[0_0_12px_rgb(138_147_255/0.9)]" />
                          </motion.span>
                        )}
                        <span
                          className={`relative grid size-8 place-items-center rounded-[9px] transition-colors ${
                            active ? "bg-brand-500 text-white shadow-[0_0_20px_-4px_rgb(88_101_242/0.9)]" : "bg-white/[0.04] text-white/55 group-hover:text-white"
                          }`}
                        >
                          <item.icon className="size-[16px]" />
                        </span>
                        <span className="relative">{item.label}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {footer}
      </aside>

      {/* telefon: górny pasek */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#0d0d0f]/80 px-4 backdrop-blur-xl lg:hidden">
        <Logo href="/panel" />
        <Link href="/panel/konto" aria-label="Konto">
          <BotAvatar name={userName} color="#5865f2" className="size-9 text-xs" />
        </Link>
      </header>

      {/* telefon: dolne zakładki */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-[20px] border border-white/[0.08] bg-[#121214]/85 p-1.5 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.9)] backdrop-blur-xl lg:hidden"
        aria-label="Panel"
      >
        <ul className="grid grid-cols-5">
          {ALL.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className="relative flex flex-col items-center gap-1 rounded-[14px] py-2 text-[10.5px] font-medium">
                  {active && <motion.span layoutId="tab-active" className="absolute inset-0 rounded-[14px] bg-white/[0.08]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <item.icon className={`relative size-5 transition-colors ${active ? "text-brand-300" : "text-white/45"}`} />
                  <span className={`relative ${active ? "text-white" : "text-white/45"}`}>{item.short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.nav>
    </>
  );
}
