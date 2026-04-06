'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Layers, Box, Settings, Cpu, CheckCircle, Command, FileText, Binary, TextSearch, BadgeCheck, ListOrdered, Hash, Link2, Medal } from 'lucide-react';

export function Strategies() {
  const strategies = [
    {
      title: "Hybrid Search",
      desc: "Combine BM25 keyword matching with dense vector embeddings to capture both exact terminology and deep semantic meaning.",
      icon: <Search className="w-8 h-8" />,
      align: "left"
    },
    {
      title: "Reciprocal Rank Fusion",
      desc: "Merge and re-rank results from multiple retrieval algorithms to push the most consistently relevant chunks to the very top.",
      icon: <Layers className="w-8 h-8" />,
      align: "right"
    },
    {
      title: "Keyword Caching",
      desc: "Instantly serve exact-match queries without re-computing embeddings, drastically slashing latency and cost for repeated questions.",
      icon: <Box className="w-8 h-8" />,
      align: "left"
    },
    {
      title: "Query Expansion",
      desc: "Intelligently rewrite and broaden vague user inputs before retrieval, ensuring comprehensive coverage of the knowledge base.",
      icon: <Settings className="w-8 h-8" />,
      align: "right"
    },
    {
      title: "HyDE",
      desc: "Hypothetical Document Embeddings (HyDE) generate a fake perfect answer to your query first, then use that to find the most relevant real documents. Coming Soon!",
      icon: <Cpu className="w-8 h-8" />,
      align: "left"
    },
    {
      title: "Contextual Chunking",
      desc: "Instead of just cutting text blindly, smart chunking ensures each piece of data retains its surrounding context, preventing the AI from losing track of what it's reading. Coming Soon!",
      icon: <CheckCircle className="w-8 h-8" />,
      align: "right"
    }
  ];

  return (
    <section className="relative -mt-12 bg-[#1a1a1c] w-full pt-36 pb-32 flex flex-col gap-32 overflow-hidden border-b border-gray-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(26,26,28,0)_0%,rgba(26,26,28,0.42)_65%,#1a1a1c_100%)]" />
      <div className="max-w-7xl mx-auto w-full px-6 text-center relative">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-semibold text-white tracking-[-0.04em] leading-none whitespace-nowrap">
            <span>Where </span>
            <span className="text-primary [text-shadow:0_0_32px_rgba(255,208,97,0.22)]">enterprise RAG</span>
            <span> begins!</span>
          </h2>
          {/* <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-1 w-20 rounded-full bg-primary" />
            <div className="h-1 w-8 rounded-full bg-white/20" />
          </div> */}
        </div>
      </div>
      
      {strategies.map((strategy, i) => (
        <div key={i} className={`flex flex-col ${strategy.align === "left" ? "lg:flex-row" : "lg:flex-row-reverse"} items-center justify-between max-w-7xl mx-auto w-full px-6 gap-16`}>

          <div className="w-full lg:w-1/2 flex flex-col space-y-6">
            <div className="text-primary bg-primary/10 w-16 h-16 rounded-md flex items-center justify-center">
              {strategy.icon}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {strategy.title}
            </h2>
            <div className="w-16 h-1.5 bg-primary rounded-md" />
            <p className="text-xl text-gray-400 leading-relaxed font-medium">   
              {strategy.desc}
            </p>
          </div>

          <div className="w-full lg:w-1/2 relative group">
            <div className="absolute inset-0 translate-x-4 translate-y-4 border border-primary/30 rounded-md z-0 transition-transform duration-300 group-hover:translate-x-6 group-hover:translate-y-6" />
            <div className="relative z-10 w-full aspect-video bg-[#0d0d0e] rounded-md flex items-center justify-center overflow-hidden border border-gray-800 shadow-2xl">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#ffd061_1px,transparent_1px),linear-gradient(to_bottom,#ffd061_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
              <StrategyVisualization title={strategy.title} />
            </div>
          </div>

        </div>
      ))}
    </section>
  );
}

function StrategyVisualization({ title }: { title: string }) {
  if (title === 'Hybrid Search') return <HybridSearchVisualization />;
  if (title === 'Reciprocal Rank Fusion') return <RrfVisualization />;

  return (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <Command className="w-12 h-12 text-primary" />
      <span className="text-primary font-mono text-lg tracking-wide">[ GIF Placeholder ]</span>
      <span className="text-gray-500 font-mono text-sm">Visualizing {title}</span>
    </div>
  );
}

const LOOP_DURATION = 6;

function HybridSearchVisualization() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M30 23 C45 18 58 20 72 27"
          stroke="rgba(255, 208, 97, 0.8)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut', times: [0, 0.55, 1] }}
        />
        <motion.path
          d="M30 37 C45 41 58 39 72 32"
          stroke="rgba(255, 208, 97, 0.8)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut', times: [0, 0.55, 1], delay: 0.35 }}
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
        <motion.div
          className="absolute left-2 right-2 h-[2px] rounded-full bg-primary/70"
          animate={{ y: [18, 44, 18], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="absolute left-[31%] top-[24%] flex items-center gap-1 rounded-full border border-primary/45 bg-[#0d0d0e] px-2 py-1"
        animate={{ x: ['0%', '140%'], y: ['0%', '16%'], opacity: [0, 1, 1, 0], scale: [0.95, 1, 1, 0.98] }}
        transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'linear', times: [0, 0.12, 0.82, 1] }}
      >
        <Binary className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] text-gray-300">Vectors</span>
      </motion.div>

      <motion.div
        className="absolute left-[31%] top-[56%] flex items-center gap-1 rounded-full border border-primary/45 bg-[#0d0d0e] px-2 py-1"
        animate={{ x: ['0%', '138%'], y: ['0%', '-16%'], opacity: [0, 1, 1, 0], scale: [0.95, 1, 1, 0.98] }}
        transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'linear', times: [0, 0.12, 0.82, 1], delay: 0.7 }}
      >
        <TextSearch className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] text-gray-300">Keywords</span>
      </motion.div>

      <motion.div
        className="absolute left-[74%] top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-primary/50 bg-[#0f1012]/95"
        animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0px rgba(255,208,97,0.0)', '0 0 22px rgba(255,208,97,0.35)', '0 0 0px rgba(255,208,97,0.0)'] }}
        transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut', delay: 1.45 }}
      >
        <BadgeCheck className="h-6 w-6 text-primary" />
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
        <span className="font-mono text-xs tracking-wide text-gray-500">Scan + extract + fuse</span>
      </div>
    </div>
  );
}

function RrfVisualization() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M16 44 C26 56 46 52 62 30"
          stroke="rgba(255, 208, 97, 0.7)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut', times: [0, 0.52, 1] }}
        />
        <motion.path
          d="M34 20 C44 8 54 10 62 30"
          stroke="rgba(255, 208, 97, 0.7)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut', times: [0, 0.52, 1], delay: 0.22 }}
        />
        <motion.path
          d="M60 30 L62 30"
          stroke="rgba(255, 208, 97, 0.7)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut', times: [0, 0.52, 1], delay: 0.38 }}
        />
        <motion.path
          d="M62 30 C69 30 74 27 79 24"
          stroke="rgba(255, 208, 97, 0.9)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut', times: [0, 0.58, 1], delay: 0.55 }}
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

      <div className="absolute left-[61.5%] top-[50%] flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-primary/45 bg-[#0f1012]">
        <Link2 className="h-3.5 w-3.5 text-primary" />
      </div>

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

      <motion.div
        className="absolute left-[88%] top-[23%]"
        animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.12, 1, 0.95], y: [8, 0, 0, -2] }}
        transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: 'easeInOut', times: [0.45, 0.65, 0.85, 1] }}
      >
        <Medal className="h-5 w-5 text-primary" />
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
        <span className="font-mono text-xs tracking-wide text-gray-500">Cross-list consensus winner</span>
      </div>
    </div>
  );
}

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
