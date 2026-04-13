import { CtaSection } from "@/components/cta-section";
import { DevelopersSection } from "@/components/developers-section";
import { FeaturesSection } from "@/components/feature-section";
import { FooterSection } from "@/components/footer-section";
import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { InfrastructureSection } from "@/components/infrastructure-section";
import { IntegrationsSection } from "@/components/integrations-section";
import { MetricsSection } from "@/components/metrics-section";
import { Navigation } from "@/components/navigation";
import { PricingSection } from "@/components/pricing-section";
import { SecuritySection } from "@/components/security-section";
import { TestimonialsSection } from "@/components/testimonials-section";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      {/* <MetricsSection /> */}
      {/* <IntegrationsSection /> */}
      <SecuritySection />
      <DevelopersSection />
      <TestimonialsSection />
      <PricingSection />
      {/* <CtaSection /> */}
      <FooterSection />
    </main>
  );
}

