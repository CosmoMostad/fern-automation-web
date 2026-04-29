import { DemoProvider } from "@/components/DemoProvider";
import SiteHeader from "@/components/SiteHeader";
import MarketingHero from "@/components/MarketingHero";
import AgentDemos from "@/components/AgentDemos";
import ConsoleSection from "@/components/ConsoleSection";
import HowItWorks from "@/components/HowItWorks";
import Customization from "@/components/Customization";
import Reviews from "@/components/Reviews";
import { ClosingCTA, SiteFooter } from "@/components/PricingPilotFooter";

export default function HomePage() {
  return (
    <DemoProvider>
      <main className="min-h-screen">
        <SiteHeader variant="dark" />
        <MarketingHero />
        <AgentDemos />
        <ConsoleSection />
        <HowItWorks />
        <Customization />
        <Reviews />
        <ClosingCTA />
        <SiteFooter />
      </main>
    </DemoProvider>
  );
}
