import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { ModulesIndex } from "@/components/landing/modules-index";
import { HowItWorks } from "@/components/landing/steps";
import { Compare, Perks } from "@/components/landing/why";
import { Pricing } from "@/components/landing/pricing";
import { Faq, FinalCta, Footer } from "@/components/landing/outro";
import { SpotlightTracker } from "@/components/landing/motion";
import { Showcase } from "@/components/landing/showcase";
import { getShowcase } from "@/lib/db";

// Strona główna jest statyczna (bez odczytu sesji). Slider serwerów odświeża się co 5 minut (ISR),
// więc baza jest czytana najwyżej raz na 5 minut, a nie przy każdym wejściu.
export const revalidate = 300;

export default function Home() {
  const showcase = getShowcase();
  return (
    <div className="flex-1 bg-[#0d0d0f]">
      <SpotlightTracker />
      <Navbar />
      <main className="overflow-x-clip">
        <Hero />
        <Showcase {...showcase} />
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
