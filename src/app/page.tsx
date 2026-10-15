import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { ModulesIndex } from "@/components/landing/modules-index";
import { HowItWorks } from "@/components/landing/steps";
import { Compare, Perks } from "@/components/landing/why";
import { Pricing } from "@/components/landing/pricing";
import { Faq, FinalCta, Footer } from "@/components/landing/outro";
import { SpotlightTracker } from "@/components/landing/motion";

// Strona główna jest w pełni statyczna (bez odczytu sesji) – serwer tylko wysyła gotowy plik.
export default function Home() {
  return (
    <div className="flex-1 bg-[#0d0d0f]">
      <SpotlightTracker />
      <Navbar />
      <main className="overflow-x-clip">
        <Hero />
        <Features />
        <ModulesIndex />
        <HowItWorks />
        <Perks />
        <Compare />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
