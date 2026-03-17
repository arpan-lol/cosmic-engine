import React from 'react';
import { ArrowRight, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export function CTA() {
  return (
    <section className="bg-transparent border-t border-gray-200 py-32 relative overflow-hidden">
      <div className="relative max-w-4xl mx-auto px-6 text-center z-10 flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-black text-[#1a1a1c] tracking-tight mb-6">
          Ready to benchmark?
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl font-medium">       
          Spin up your local sandbox today. Import your data, select your retrieval strategy, and measure everything.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-center">
          <Link href="/dashboard" className="group relative flex h-14 w-full items-center justify-center bg-primary text-[#1a1a1c] rounded-md font-semibold text-lg overflow-hidden transition-transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
            <span className="relative z-10 flex items-center gap-2">
              Start Building <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <a href="https://github.com/arpan-lol/cosmic-engine" target="_blank" rel="noreferrer" className="flex items-center w-full justify-center gap-2 h-14 bg-white border-2 border-gray-200 text-[#1a1a1c] rounded-md font-semibold text-lg hover:border-gray-300 hover:-translate-y-0.5 hover:bg-gray-50 transition-all px-8">
            <LinkIcon className="w-5 h-5" /> View Source
          </a>
        </div>
      </div>
    </section>
  );
}