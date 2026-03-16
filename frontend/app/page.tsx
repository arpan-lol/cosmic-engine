import { Hero } from '@/components/landing/Hero';
import { Showcase } from '@/components/landing/Showcase';
import { Features } from '@/components/landing/Features';
import { Architecture } from '@/components/landing/Architecture';
import { Strategies } from '@/components/landing/Strategies';
import { Journey } from '@/components/landing/Journey';
import { CTA } from '@/components/landing/CTA';
import { Lazy } from '@/components/landing/LazySection';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-[#1a1a1c] selection:bg-primary selection:text-[#1a1a1c]">
      <Hero />
      <Lazy>
        <Showcase />
      </Lazy>
      <Lazy>
        <Strategies />
      </Lazy>
      <Lazy>
        <Architecture />
      </Lazy>
      <Lazy>
        <Features />
      </Lazy>
      <div className="py-24 bg-white text-[#1a1a1c] border-t border-gray-200 relative">
        <Lazy>
          <Journey />
        </Lazy>
      </div>
      <Lazy>
        <CTA />
      </Lazy>
    </div>
  );
}