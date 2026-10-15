import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/catalog";
import { Logo } from "@/components/ui/logo";
import { Curtain } from "@/components/landing/curtain";
import { Logo3D } from "@/components/landing/three-d";

// Logowanie i rejestracja: po lewej formularz, po prawej karta z poświatą i logo 3D –
// ten sam język co na stronie głównej.

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 bg-[#0d0d0f] lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="flex items-center gap-1.5 text-[14px] text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="size-4" /> Strona główna
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-14">{children}</div>
        <div className="text-[13px] text-white/35">© {new Date().getFullYear()} {BRAND.domain}</div>
      </div>

      <div className="hidden p-3 lg:block">
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113] p-10">
          <Curtain strong base="17 17 19" className="inset-0" />
          <div className="relative flex items-center gap-2 text-[13px] text-white/60">
            <span className="size-1.5 animate-pulse rounded-full bg-dc-green" /> Bociak jest online
          </div>
          <div className="relative flex justify-center">
            <div className="animate-hover-y">
              <Logo3D size={190} />
            </div>
          </div>
          <div className="relative">
            <h2 className="text-[2.4rem] font-normal leading-[1.06] tracking-[-0.04em] text-white">
              Twój serwer Discord,
              <br />
              <span className="text-white/60">na autopilocie.</span>
            </h2>
            <p className="mt-3 max-w-sm text-[15.5px] leading-relaxed text-white/70">Moderacja, powitania, tickety i konkursy w jednym bocie. Hosting w cenie.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
