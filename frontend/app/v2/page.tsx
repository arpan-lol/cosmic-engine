"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Box, Zap, Settings, Command, Search, Layers, Cpu, Award, FileText, FileImage, Database, ZapOff, CheckCircle, FileSpreadsheet, Presentation, Globe, Activity, MousePointerClick, Library, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function V2LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-[#1a1a1c] selection:bg-primary selection:text-[#1a1a1c]">
      <HeroSection />
      <ShowcaseVideoPlaceholder />
      <StrategyPreviewSection />
      <InteractiveRAGArchitecture />
      <FeaturesSection />

      <div className="py-24 bg-white text-[#1a1a1c] border-t border-gray-200 relative">
        <DeveloperJourney />
      </div>

      <CTASection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center bg-white overflow-hidden border-b border-gray-200">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary opacity-10 blur-[150px] rounded-full mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary opacity-10 blur-[150px] rounded-full mix-blend-multiply pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/30 text-yellow-600 bg-primary/10 font-semibold text-sm animate-pulse">
          <Zap className="w-4 h-4 fill-primary" />
          The Ultimate RAG Sandbox
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#1a1a1c] leading-[1.1] flex flex-wrap justify-center items-center gap-4 md:gap-6">
          <Image src="/logo.png" alt="Cosmic Engine Logo" width={96} height={96} className="w-16 h-16 md:w-24 md:h-24 object-contain" />
          <span className="flex flex-col md:flex-row items-center">
            Cosmic <span className="text-[#1a1a1c] bg-primary transition-colors duration-500 inline-block px-4 py-1 rounded-md mt-2 md:mt-0 md:ml-4">Engine</span>
          </span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-gray-600 font-medium leading-relaxed">
          Build, test, and understand AI chatbots that talk to your data. Mix and match different techniques to see exactly how your AI finds information and constructs its answers behind the scenes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full max-w-md justify-center">
          <Link href="/dashboard" className="group relative flex h-14 w-full items-center justify-center bg-primary text-[#1a1a1c] rounded-md font-semibold text-lg overflow-hidden transition-transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
            <span className="relative z-10 flex items-center gap-2">
              Start Building <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link href="#architecture" className="flex h-14 w-full items-center justify-center border border-gray-300 rounded-md text-[#1a1a1c] font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-300 shadow-sm">
            View Architecture
          </Link>
        </div>
      </div>
    </section>
  );
}


function ShowcaseVideoPlaceholder() {
  return (
    <section className="w-full bg-white relative pb-32 pt-16 border-b border-gray-200 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-gray-200/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] group transition-transform duration-700 hover:scale-[1.02] cursor-default bg-gray-50 flex items-center justify-center">

          {/* Mock UI overlay for the video/gif */}
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

function StrategyPreviewSection() {
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
      desc: "Hypothetical Document Embeddings (HyDE) generate a fake perfect answer to your query first, then use that to find the most relevant real documents.",
      icon: <Cpu className="w-8 h-8" />,
      align: "left"
    },
    {
      title: "Contextual Chunking",
      desc: "Instead of just cutting text blindly, smart chunking ensures each piece of data retains its surrounding context, preventing the AI from losing track of what it's reading.",
      icon: <CheckCircle className="w-8 h-8" />,
      align: "right"
    }
  ];

  return (
    <section className="bg-[#1a1a1c] w-full py-32 flex flex-col gap-32 overflow-hidden border-b border-gray-800">
      {strategies.map((strategy, i) => (
        <div key={i} className={`flex flex-col ${strategy.align === "left" ? "lg:flex-row" : "lg:flex-row-reverse"} items-center justify-between max-w-7xl mx-auto w-full px-6 gap-16`}>

          {/* Text Side */}
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

          {/* GIF / Image Side restoring the large layout but normal borders */}
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

function InteractiveRAGArchitecture() {
  const [hybrid, setHybrid] = useState(false);
  const [rrf, setRrf] = useState(false);
  const [caching, setCaching] = useState(false);
  const [queryExp, setQueryExp] = useState(false);

  return (
    <section id="architecture" className="bg-white w-full py-24 border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-[#1a1a1c] tracking-tight mb-4 inline-block px-5 py-2 bg-gray-50 rounded-md border border-gray-200">  
          Data Flow
        </h2>
        <p className="text-lg text-gray-500 w-full max-w-2xl mx-auto mt-2">     
          Toggle strategies to observe how data moves through the pipeline.     
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-8 items-start">

        <div className="flex flex-col space-y-4 bg-gray-50 p-6 border border-gray-200 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold text-[#1a1a1c] border-b border-gray-200 mb-2 pb-3">Strategies</h3>
          <ToggleControl label="Hybrid Search" state={hybrid} setState={setHybrid} />
          <ToggleControl label="RRF Fusion" state={rrf} setState={setRrf} />    
          <ToggleControl label="Keyword Caching" state={caching} setState={setCaching} />
          <ToggleControl label="Query Expansion" state={queryExp} setState={setQueryExp} />
        </div>

        <div className="w-full min-h-[450px] border border-gray-200 rounded-md relative p-8 flex flex-col justify-center gap-6 bg-gray-50 shadow-inner overflow-hidden">

          <div className="flex w-full items-center justify-between gap-3 overflow-x-auto pb-6">
            <DiagramNode label="User Query" active={true} />
            <FlowBar active={true} animating={true} showSplit={queryExp} />     

            <div className="flex flex-col gap-3 min-w-[140px]">
              {queryExp && <DiagramNode label="Expanded Query" active={true} secondary />}
              <DiagramNode label="Retrieval Engine" active={true} glow={hybrid} />
            </div>

            <FlowBar active={true} animating={true} showSplit={hybrid || rrf} />

            <div className="flex flex-col gap-3 min-w-[140px]">
              <DiagramNode label="Dense Vectors" active={true} />
              {(hybrid || rrf) && <DiagramNode label="BM25 Scores" active={true} secondary />}
            </div>

            <FlowBar active={true} animating={true} merge={hybrid || rrf} />    

            <div className="flex flex-col gap-3 min-w-[140px]">
              {rrf ? (
                <DiagramNode label="RRF Fusion" active={true} glow={true} secondary />
              ) : (
                <DiagramNode label="LLM Generator" active={true} />
              )}
            </div>

            {rrf && (
              <>
                <FlowBar active={true} animating={true} />
                <DiagramNode label="LLM Generator" active={true} />
              </>
            )}

            <FlowBar active={!caching} animating={!caching} />
            <DiagramNode label="Final Response" active={true} glow={caching} /> 
          </div>

          {caching && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-24 border border-dashed border-primary rounded-md flex items-center justify-center pointer-events-none animate-pulse bg-primary/5 backdrop-blur-sm">
                <span className="text-yellow-700 font-semibold px-4 py-2 text-base">Cache Hit: Bypass</span>
             </div>
          )}

        </div>
      </div>
    </section>
  );
}

function ToggleControl({ label, state, setState }: { label: string, state: boolean, setState: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer py-1.5" onClick={() => setState(!state)}>
      <span className={`text-sm font-medium transition-colors ${state ? "text-[#1a1a1c]" : "text-gray-500"}`}>
        {label}
      </span>
      <div className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-colors duration-300 ${state ? "bg-primary" : "bg-gray-300"}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${state ? "translate-x-5" : "translate-x-0"}`} />  
      </div>
    </div>
  );
}

function DiagramNode({ label, active, glow = false, secondary = false }: { label: string, active: boolean, glow?: boolean, secondary?: boolean }) {
  return (
    <div className={`relative px-3 py-2 border rounded-md flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-300 ${ 
      active
        ? secondary
          ? "border-primary/50 text-yellow-700 bg-primary/10"
          : "border-gray-300 bg-white text-[#1a1a1c] shadow-sm"
        : "border-gray-200 text-gray-400 bg-gray-100"
    } ${glow ? "ring-2 ring-primary ring-offset-2 z-10" : "hover:-translate-y-0.5 hover:shadow-md"}`}>
      {label}
    </div>
  );
}

function FlowBar({ active, animating, showSplit, merge }: { active: boolean, animating: boolean, showSplit?: boolean, merge?: boolean }) {
  return (
    <div className="flex-1 h-6 flex relative items-center justify-center min-w-[24px]">
       <div className={`w-full h-1.5 rounded-full overflow-hidden transition-colors ${active ? "bg-gray-200" : "bg-gray-100"}`}>
          {animating && active && (
            <div className="h-full bg-primary/80 w-full animate-[progress_1.5s_ease-in-out_infinite] origin-left" style={{ transformOrigin: '0% 50%' }} />      
          )}
       </div>
    </div>
  );
}

// --- NEW COMPONENTS RESTORED ---



function FeaturesSection() {
  const formats = [
    { icon: <FileText className="w-4 h-4" />, label: "PDF" },
    { icon: <FileText className="w-4 h-4" />, label: "DOCX" },
    { icon: <FileSpreadsheet className="w-4 h-4" />, label: "XLSX" },
    { icon: <Presentation className="w-4 h-4" />, label: "PPTX" },
    { icon: <Globe className="w-4 h-4" />, label: "HTML" },
    { icon: <FileImage className="w-4 h-4" />, label: "Images" },
  ];

  return (
    <section className="bg-[#1a1a1c] text-white w-full py-24 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1: Supported Formats */}
          <div className="p-8 rounded-md bg-[#252527] border border-gray-700 shadow-inner group hover:border-gray-500 transition-colors flex flex-col h-full hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-bold text-white tracking-tight">Broad Ingestion</h4>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-6 tracking-wide flex-grow leading-relaxed">
              Natively process a wide array of document types mapping directly to Markdown using advanced multimodality logic via MarkItDown.
            </p>
            <div className="flex flex-wrap gap-3 mt-auto">
              {formats.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1c] border border-gray-600 rounded-md text-xs font-semibold text-gray-300 shadow-sm border-b-2 border-b-gray-800">
                  {f.icon} {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Interactive Citations */}
          <div className="p-8 rounded-md bg-[#252527] border border-gray-700 shadow-inner group hover:border-gray-500 transition-colors flex flex-col h-full hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Library className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-bold text-white tracking-tight">Interactive Citations</h4>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-6 tracking-wide flex-grow leading-relaxed">
              Clickable, line-level source attribution tying LLM responses directly back to the original documents with an integrated file viewer.
            </p>
            <div className="mt-auto h-24 w-full rounded-md border border-gray-600 bg-[#1a1a1c] relative overflow-hidden flex flex-col p-4 justify-center gap-3 shadow-inner">
               <div className="h-2 w-3/4 bg-gray-700 rounded-full" />
               <div className="h-2 w-1/2 bg-gray-700 rounded-full" />
               <div className="ml-auto mt-2 flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-sm border border-primary/30 pointer-events-none shadow-sm">
                  <MousePointerClick className="w-3 h-3" /> [Source: layout.pdf]
               </div>
            </div>
          </div>

          {/* Card 3: Performance Breakdown */}
          <div className="p-8 rounded-md bg-[#252527] border border-gray-700 shadow-inner group hover:border-gray-500 transition-colors flex flex-col h-full hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-bold text-white tracking-tight">Performance Explorer</h4>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-6 tracking-wide flex-grow leading-relaxed">
              Granular analytics for every request. Trace millisecond-level timings for semantic splitting, chunk extraction, and generation.
            </p>
            <div className="mt-auto flex flex-col gap-3">
               <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="font-medium">Vector Search</span> <span className="text-white font-mono">85ms</span>
               </div>
               <div className="w-full bg-[#1a1a1c] h-2 rounded-full overflow-hidden shadow-inner border border-gray-800">
                  <div className="bg-primary/80 w-[65%] h-full rounded-full" /> 
               </div>
               <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                  <span className="font-medium">LLM Token Gen</span> <span className="text-white font-mono">840ms</span>
               </div>
               <div className="w-full bg-[#1a1a1c] h-2 rounded-full overflow-hidden shadow-inner border border-gray-800">
                  <div className="bg-primary w-[95%] h-full rounded-full" />    
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}


function DeveloperJourney() {
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

function CTASection() {
  return (
    <section className="bg-white border-t border-gray-200 py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="relative max-w-4xl mx-auto px-6 text-center z-10 flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-black text-[#1a1a1c] tracking-tight mb-6">
          Ready to benchmark?
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl font-medium">       
          Spin up your local sandbox today. Import your data, select your retrieval strategy, and measure everything.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
          <Link href="/dashboard" className="group relative flex h-14 w-full items-center justify-center bg-primary text-[#1a1a1c] rounded-md font-semibold text-lg overflow-hidden transition-transform hover:-translate-y-0.5 shadow-sm hover:shadow-md">
            <span className="relative z-10 flex items-center gap-2">
              Start Building <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 h-14 bg-white border-2 border-gray-200 text-[#1a1a1c] rounded-md font-semibold text-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <LinkIcon className="w-5 h-5" /> View GitHub
          </a>
        </div>
      </div>
    </section>
  );
}