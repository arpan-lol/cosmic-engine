import { Hero } from '@/components/landing/Hero';
import { Showcase } from '@/components/landing/Showcase';
import { Features } from '@/components/landing/Features';
import { Architecture } from '@/components/landing/Architecture';
import { StrategiesComponent } from '@/components/landing/strategies/Strategies';
import { Journey } from '@/components/landing/Journey';
import { CTA } from '@/components/landing/CTA';
import { Lazy } from '@/components/landing/LazySection';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="force-light flex flex-col min-h-screen font-sans bg-background text-foreground selection:bg-primary selection:text-[#1a1a1c] scroll-smooth relative">
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="relative z-10">
        <Hero />
        <Lazy>
          <Showcase />
        </Lazy>
        <Lazy>
          <StrategiesComponent />
        </Lazy>
        <div id="architecture" className="scroll-mt-8">
          <Lazy>
            <Architecture />
          </Lazy>
        </div>
        <Lazy>
          <Features />
        </Lazy>
        <div className="py-24 bg-transparent text-[#1a1a1c] border-t border-gray-200 relative">
          <Lazy>
            <Journey />
          </Lazy>
        </div>
        <Lazy>
          <CTA />
        </Lazy>
        <Footer />
      </div>
    </div>
  );
}
