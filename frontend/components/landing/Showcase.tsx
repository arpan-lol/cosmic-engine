import React from 'react';

export function Showcase() {
  return (
    <section className="w-full bg-white/0 relative pb-32 -mt-16 z-20 border-b border-gray-200 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-gray-200/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] group transition-transform duration-700 hover:scale-[1.02] cursor-default bg-gray-50 flex items-center justify-center">

          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            src="https://github.com/user-attachments/assets/7102e201-af3e-4a65-afe8-06c677866127"
          />

        </div>
      </div>
    </section>
  );
}