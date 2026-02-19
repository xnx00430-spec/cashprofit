// app/(marketing)/page.jsx
import HeroSection from './components/home/HeroSection';
import HowItWorks from './components/home/HowItWorks';
import LevelsShowcase from './components/home/LevelsShowcase';
import ReferralProgram from './components/home/ReferralProgram';
import SecuritySection from './components/home/SecuritySection';
import CTASection from './components/home/CTASection';
import Testimonials from './components/home/Testimonials';
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Testimonials/>
      <HowItWorks />
      <LevelsShowcase />
      <ReferralProgram />
      <SecuritySection />
      <CTASection />
    </>
  );
}