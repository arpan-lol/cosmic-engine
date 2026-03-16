'use client';

import React, { useState } from 'react';

export function Architecture() {
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
