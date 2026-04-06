'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, HardDrive, SearchCheck } from 'lucide-react';
import { TENSION_OPACITY, TENSION_TRANSITION, RELEASE_OPACITY, RELEASE_TRANSITION, MOTION_DURATION, RESET_DELAY } from './constants';

export function Caching() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M17 30 C29 30 41 30 52 30"
          stroke="rgba(255, 208, 97, 0.8)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1, 1], opacity: TENSION_OPACITY }}
          transition={TENSION_TRANSITION}
        />
        <motion.path
          d="M52 30 C64 30 75 30 86 30"
          stroke="rgba(255, 208, 97, 0.95)"
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ pathLength: [0, 0, 1, 1, 1], opacity: RELEASE_OPACITY }}
          transition={RELEASE_TRANSITION}
        />
      </svg>

      <div className="absolute left-[10%] top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-primary/45 bg-[#0f1012]/95">
        <MessageSquareText className="h-5 w-5 text-primary" />
      </div>

      <motion.div
        className="absolute left-[44%] top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-lg border border-primary/50 bg-[#0f1012]/95"
        animate={{
          boxShadow: ['0 0 0px rgba(255,208,97,0)', '0 0 0px rgba(255,208,97,0)', '0 0 18px rgba(255,208,97,0.38)', '0 0 0px rgba(255,208,97,0)'],
          scale: [1, 1, 1.05, 1]
        }}
        transition={{ duration: MOTION_DURATION, repeat: Infinity, repeatDelay: RESET_DELAY, ease: 'easeInOut', times: [0, 0.68, 0.84, 1] }}
      >
        <HardDrive className="h-6 w-6 text-primary" />
      </motion.div>

      <div className="absolute left-[79%] top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-primary/45 bg-[#0f1012]/95">
        <SearchCheck className="h-5 w-5 text-primary" />
      </div>

      <div className="absolute left-[15%] top-[65%] -translate-x-1/2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">State</span>
      </div>

      <div className="absolute left-[49.6%] top-[65%] -translate-x-1/2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">Cache</span>
      </div>

      <div className="absolute left-[84%] top-[65%] -translate-x-1/2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">RAG</span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
        <span className="font-mono text-xs tracking-wide text-gray-500">Lookup, hit, instant return</span>
      </div>
    </div>
  );
}
