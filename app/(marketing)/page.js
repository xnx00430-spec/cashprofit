// app/(marketing)/page.jsx
import HeroSection from './components/home/HeroSection';
import HowItWorks from './components/home/HowItWorks';
import LevelsShowcase from './components/home/LevelsShowcase';
import ReferralProgram from './components/home/ReferralProgram';
import SecuritySection from './components/home/SecuritySection';
import CTASection from './components/home/CTASection';
import Testimonials from './components/home/Testimonials';
import Demo from './components/home/Demo';
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Demo/>
      <Testimonials/>
      <HowItWorks />
      <LevelsShowcase />
      <ReferralProgram />
      <SecuritySection />
      <CTASection />
    </>
  );
}