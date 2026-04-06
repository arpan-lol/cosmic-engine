import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden pb-20 bg-[radial-gradient(circle_at_top_left,rgba(255,208,97,0.26),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(251,248,240,0.74)_56%,rgba(251,248,240,0)_100%)]">
      <div className="absolute inset-0 z-0">
        <div className="absolute left-[-12%] top-12 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10rem] left-1/2 h-96 w-[34rem] -translate-x-1/2 rounded-full bg-primary/14 blur-3xl pointer-events-none" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center text-center space-y-8">
        {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/30 text-yellow-600 bg-primary/10 font-semibold text-sm animate-pulse">
          <Zap className="w-4 h-4 fill-primary" />
          The Ultimate RAG Sandbox
        </div> */}

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#1a1a1c] leading-[1.1] flex flex-wrap justify-center items-center gap-4 md:gap-6">
          <Image src="/logo.png" alt="Cosmic Engine Logo" width={96} height={96} className="w-16 h-16 md:w-24 md:h-24 object-contain" />
          <span className="flex flex-col md:flex-row items-center">
            Cosmic <span className="text-[#1a1a1c] bg-primary transition-colors duration-500 inline-block px-4 py-1 rounded-md mt-2 md:mt-0 md:ml-4">Engine</span>
          </span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-gray-600 font-medium leading-relaxed">
          RAG experimentation platform for comparing 10+ retrieval, chunking, generation, and caching strategies.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full max-w-md justify-center">
          <Link href="/dashboard" className="group relative flex h-14 w-full items-center justify-center bg-primary text-[#1a1a1c] rounded-md font-semibold text-lg overflow-hidden transition-transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
            <span className="relative z-10 flex items-center gap-2">
              Start Building <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <a href="#architecture" className="flex h-14 w-full items-center justify-center border border-gray-300 rounded-md text-[#1a1a1c] font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-300 shadow-sm">
            View Architecture
          </a>
        </div>
      </div>
    </section>
  );
}
