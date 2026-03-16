import React from 'react';
import { Award } from 'lucide-react';

export function Journey() {
  return (
    <section className="relative w-full py-16">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-16 relative shadow-sm">
          <div className="relative">
            <span className="absolute -top-12 -left-4 md:-left-8 text-[8rem] font-serif text-primary/20 leading-none select-none">
              &quot;
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1a1a1c] leading-[1.1] relative z-10">
              I won a RAG hackathon. <br />
              <span className="text-gray-500 font-medium mt-2 block">Then, I got curious.</span>
            </h2>
          </div>

          <div className="w-16 h-1.5 bg-primary mx-auto rounded-md my-10" />    

          <p className="text-xl text-gray-600 leading-relaxed font-medium max-w-3xl mx-auto">
            Building a working RAG model under pressure is one thing. Understanding the infinite nuances of chunking strategies, retrieval algorithms, and caching layers is another. I built Cosmic Engine not just to use RAG, but to master it.
          </p>

          <Award className="w-10 h-10 text-gray-300 mx-auto mt-10" />
        </div>
      </div>
    </section>
  );
}