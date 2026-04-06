'use client';

import React from 'react';

export function ComingSoon({ icon: Icon, subtitle }: { icon: React.ElementType; subtitle: string }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-1/2 flex w-[72%] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl px-6 py-7">
        <Icon className="h-10 w-10 text-primary" />
        <span className="mt-5 font-mono text-sm uppercase tracking-[0.2em] text-primary">
          Coming Soon
        </span>
        <span className="mt-3 font-mono text-xs tracking-wide text-gray-500">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
