import React from 'react';

export function Showcase() {
  return (
    <section className="w-full bg-white/0 relative pb-32 -mt-16 z-20 border-b border-gray-200 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-gray-200/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] group transition-transform duration-700 hover:scale-[1.02] cursor-default bg-gray-50 flex items-center justify-center">

          <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            <div className="flex flex-col items-center gap-4 text-gray-400">    
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center animate-pulse">
                <span className="text-xs font-bold uppercase">Demo</span>       
              </div>
              <p className="font-mono text-sm tracking-wide">[ Video Showcase: Autoplay / Loop ]</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}