'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Binary, TextSearch, BadgeCheck, Search } from 'lucide-react';
import { FLOW_OPACITY, FLOW_TRANSITION, CYCLE_DURATION } from './constants';

export function HybridSearch() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M30 23 C45 18 58 20 72 27"
          stroke="rgba(255, 208, 97, 0.8)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1, 1], opacity: FLOW_OPACITY }}
          transition={FLOW_TRANSITION}
        />
        <motion.path
          d="M30 37 C45 41 58 39 72 32"
          stroke="rgba(255, 208, 97, 0.8)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1, 1], opacity: FLOW_OPACITY }}
          transition={FLOW_TRANSITION}
        />
      </svg>

      <div className="absolute left-[11%] top-1/2 h-[54%] w-[20%] -translate-y-1/2 rounded-md border border-primary/40 bg-[#0f1012]/90 p-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">doc</span>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-[2px] w-full rounded-full bg-primary/30" />
          <div className="h-[2px] w-[78%] rounded-full bg-primary/25" />
          <div className="h-[2px] w-[92%] rounded-full bg-primary/20" />
          <div className="h-[2px] w-[70%] rounded-full bg-primary/15" />
        </div>
        
        <div className="absolute top-[60%] right-5 -translate-y-1/2 text-primary">
          <Search className="h-14 w-14" strokeWidth={1} />
        </div>

        <motion.div
          className="absolute left-2 right-2 h-[2px] rounded-full bg-primary/70"
          animate={{ y: [18, 44, 18], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: CYCLE_DURATION, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="absolute left-[31%] top-[24%] flex items-center gap-1 rounded-full border border-primary/45 bg-[#0d0d0e] px-2 py-1"
        animate={{ x: ['0%', '140%', '140%', '0%'], y: ['0%', '16%', '16%', '0%'], opacity: FLOW_OPACITY, scale: [0.95, 1, 1, 0.95] }}
        transition={FLOW_TRANSITION}
      >
        <Binary className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] text-gray-300">Vectors</span>
      </motion.div>

      <motion.div
        className="absolute left-[31%] top-[56%] flex items-center gap-1 rounded-full border border-primary/45 bg-[#0d0d0e] px-2 py-1"
        animate={{ x: ['0%', '138%', '138%', '0%'], y: ['0%', '-16%', '-16%', '0%'], opacity: FLOW_OPACITY, scale: [0.95, 1, 1, 0.95] }}
        transition={FLOW_TRANSITION}
      >
        <TextSearch className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] text-gray-300">Keywords</span>
      </motion.div>

      <motion.div
        className="absolute left-[74%] top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-primary/50 bg-[#0f1012]/95"
        animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0px rgba(255,208,97,0.0)', '0 0 22px rgba(255,208,97,0.35)', '0 0 0px rgba(255,208,97,0.0)'] }}
        transition={{ duration: CYCLE_DURATION, repeat: Infinity, ease: 'easeInOut', delay: 1.45 }}
      >
        <BadgeCheck className="h-6 w-6 text-primary" />
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
        <span className="font-mono text-xs tracking-wide text-gray-500">Scan + extract + fuse</span>
      </div>
    </div>
  );
}
