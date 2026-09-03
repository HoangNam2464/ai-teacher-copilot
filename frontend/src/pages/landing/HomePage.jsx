import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CTASection } from '@/components/landing/CTASection';
import { FAQSection } from '@/components/landing/FAQSection';

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
