import React from 'react';
import { Search, Layers, Box, Settings, Cpu, CheckCircle, Command } from 'lucide-react';

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
    <section className="relative bg-[#1a1a1c] w-full py-32 flex flex-col gap-32 overflow-hidden border-b border-gray-800">
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

              <div className="flex flex-col items-center gap-4 animate-pulse">  
                <Command className="w-12 h-12 text-primary" />
                <span className="text-primary font-mono text-lg tracking-wide">[ GIF Placeholder ]</span>
                <span className="text-gray-500 font-mono text-sm">Visualizing {strategy.title}</span>
              </div>
            </div>
          </div>

        </div>
      ))}
    </section>
  );
}
