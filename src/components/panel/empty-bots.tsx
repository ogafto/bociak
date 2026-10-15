import Link from "next/link";
import { Plus } from "lucide-react";
import { btn } from "@/components/ui/button";
import { Curtain } from "@/components/landing/curtain";
import { Logo3D } from "@/components/landing/three-d";

export function EmptyBots() {
  return (
    <div data-spot className="relative flex flex-col items-center overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111113] px-6 pb-14 pt-10 text-center">
      <Curtain strong base="17 17 19" className="inset-0" />
      <div className="relative animate-hover-y">
        <Logo3D size={110} />
      </div>
      <h3 className="relative mt-8 text-[1.6rem] font-medium tracking-[-0.03em] text-white">Nie masz jeszcze własnego bota</h3>
      <p className="relative mt-2 max-w-sm text-[14.5px] text-white/60">Stwórz pierwszego w kreatorze – nazwa, wygląd, moduły i gotowe. Hosting masz już w pakiecie.</p>
      <Link href="/panel/boty/nowy" className={btn("primary", "md", "relative mt-7")}>
        <Plus className="size-4" /> Stwórz pierwszego bota
      </Link>
    </div>
  );
}
