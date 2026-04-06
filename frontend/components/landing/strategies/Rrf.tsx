'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ListOrdered, Hash, Medal } from 'lucide-react';
import { FLOW_OPACITY, FLOW_TRANSITION } from './constants';

function RrfList({
  className,
  rows,
  highlightIndex,
}: {
  className: string;
  rows: string[];
  highlightIndex: number;
}) {
  return (
    <div className={`absolute w-[16%] rounded-md border border-primary/45 bg-[#0f1012]/95 ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-primary/20 px-2 py-1.5">
        <ListOrdered className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-500">rank</span>
      </div>
      <div className="space-y-1 p-2">
        {rows.map((row, index) => (
          <div
            key={`${row}-${index}`}
            className={`flex items-center gap-1 rounded-sm border px-1.5 py-1 ${index === highlightIndex ? 'border-primary/45 bg-primary/15' : 'border-primary/20'}`}
          >
            <Hash className={`h-3 w-3 ${index === highlightIndex ? 'text-primary' : 'text-gray-500'}`} />
            <span className={`font-mono text-[10px] ${index === highlightIndex ? 'text-primary' : 'text-gray-400'}`}>{row}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Rrf() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M62 26 L70 26"
          stroke="rgba(255, 208, 97, 0.9)"
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1, 1], opacity: FLOW_OPACITY }}
          transition={FLOW_TRANSITION}
        />
      </svg>

      <RrfList
        className="left-[8%] top-[20%]"
        rows={['D2', 'D7', 'D11']}
        highlightIndex={1}
      />
      <RrfList
        className="left-[26%] top-[20%]"
        rows={['D7', 'D5', 'D13']}
        highlightIndex={0}
      />
      <RrfList
        className="left-[44%] top-[20%]"
        rows={['D9', 'D1', 'D7']}
        highlightIndex={2}
      />

      <div className="absolute left-[72%] top-[20%] w-[18%] rounded-md border border-primary/45 bg-[#0f1012]/95">
        <div className="flex items-center gap-1.5 border-b border-primary/20 px-2 py-1.5">
          <ListOrdered className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-500">fused</span>
        </div>
        <div className="space-y-1 p-2">
          <div className="flex items-center gap-1 rounded-sm border border-primary/45 bg-primary/15 px-1.5 py-1">
            <Hash className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] text-primary">D7</span>
          </div>
          <div className="flex items-center gap-1 rounded-sm border border-primary/20 px-1.5 py-1">
            <Hash className="h-3 w-3 text-gray-500" />
            <span className="font-mono text-[10px] text-gray-400">D2</span>
          </div>
          <div className="flex items-center gap-1 rounded-sm border border-primary/20 px-1.5 py-1">
            <Hash className="h-3 w-3 text-gray-500" />
            <span className="font-mono text-[10px] text-gray-400">D9</span>
          </div>
        </div>
      </div>

      <div className="absolute left-[88%] top-[23%]">
        <Medal className="h-5 w-5 text-primary" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
        <span className="font-mono text-xs tracking-wide text-gray-500">Cross-list consensus winner</span>
      </div>
    </div>
  );
}
