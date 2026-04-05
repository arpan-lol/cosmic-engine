'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
    MessageSquare, Sparkles, Search, Database, Blocks, 
    BrainCircuit, Zap, HardDrive, Network, FileText
} from 'lucide-react';

export default function ArchitectureDemo() {
  const [strategies, setStrategies] = useState({
    hybridSearch: false,
    rrf: false,
    caching: false,
    queryExpansion: false,
  });

  const toggleStrategy = (key: keyof typeof strategies) => setStrategies(prev => ({ ...prev, [key]: !prev[key] }));

  const getArchitectureTitle = () => {
      let parts = [];
      if (strategies.queryExpansion) parts.push("Expanded");
      if (strategies.hybridSearch) parts.push("Hybrid");
      let title = parts.length > 0 ? parts.join(" ") + " RAG" : "Baseline RAG";
      if (strategies.rrf && strategies.hybridSearch) title += " + RRF";
      if (strategies.caching) title = "Cached " + title;
      return title;
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card p-6 flex flex-col gap-6 z-20 shrink-0">
        <div className="pb-4 border-b border-border">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                Pipeline Builder
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Configure RAG architecture strategies.</p>
        </div>
        <div className="space-y-4">
            <ControlToggle id="expansion" label="Query Expansion" description="LLM variant generation." checked={strategies.queryExpansion} onChange={() => toggleStrategy('queryExpansion')} />
            <ControlToggle id="hybrid" label="Hybrid Search" description="Vector & BM25 parallel." checked={strategies.hybridSearch} onChange={() => toggleStrategy('hybridSearch')} />
            <ControlToggle id="rrf" label="Rank Fusion" description="Blend scoresets." checked={strategies.rrf} onChange={() => toggleStrategy('rrf')} />
            <ControlToggle id="cache" label="Cache" description="Cache query to skip execution." checked={strategies.caching} onChange={() => toggleStrategy('caching')} />
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col items-center pt-12 pb-32">
        
        <div className="mb-8 text-center max-w-3xl">
             <h1 className="text-2xl font-bold tracking-tight text-foreground transition-all duration-300">
                {getArchitectureTitle()}
             </h1>
        </div>

        {/* --- PIPELINE TREE --- */}
        <div className="flex flex-col items-center w-full max-w-4xl">
            
            {/* 1. QUERY */}
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="font-bold text-sm uppercase tracking-widest py-3 px-10 rounded-lg border border-border shadow-md bg-card z-10 flex items-center justify-center">
                <span className="bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent tracking-widest">INPUT</span>
            </motion.div>
            <VerticalEdge />

            {/* 2. CACHE & EXPANSION */}
            {strategies.caching && strategies.queryExpansion ? (
                <div className="flex flex-col w-full items-center">
                    <BranchDown />
                    <div className="flex justify-center w-full max-w-[500px]">
                        <div className="w-1/2 flex flex-col items-center">
                            <PipelineNode title="Cache Lookup" subtitle="Check queries" icon={Search} borderColor="border-teal-500/50" id="n-cache" />
                        </div>
                        <div className="w-1/2 flex flex-col items-center">
                            <PipelineNode title="Query Expansion" subtitle="LLM variants" icon={Sparkles} borderColor="border-blue-500/50" id="n-exp" />
                        </div>
                    </div>
                    <BranchUp />
                </div>
            ) : strategies.caching ? (
                <div className="flex flex-col items-center">
                    <PipelineNode title="Cache Lookup" subtitle="Check queries" icon={Search} borderColor="border-teal-500/50" id="n-cache" />
                    <VerticalEdge />
                </div>
            ) : strategies.queryExpansion ? (
                <div className="flex flex-col items-center">
                    <PipelineNode title="Query Expansion" subtitle="LLM variants" icon={Sparkles} borderColor="border-blue-500/50" id="n-exp" />
                    <VerticalEdge />
                </div>
            ) : null}

            {/* 3. RETRIEVAL BOUNDING BOX */}
            <motion.div layout transition={{ type: "spring", stiffness: 400, damping: 30 }} className="border border-dashed border-border/80 rounded-xl pt-8 pb-6 px-6 md:px-12 bg-muted/5 relative flex flex-col items-center w-full max-w-[650px]">
                <span className="absolute -top-2.5 left-6 px-2 bg-background text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Retrieval</span>
                
                {strategies.hybridSearch ? (
                    <div className="flex flex-col w-full items-center">
                        <BranchDown />
                        <div className="flex justify-center w-[500px]">
                            <div className="w-1/2 flex flex-col items-center relative">
                                <PipelineNode title="Vector Search" subtitle="Dense embeddings" icon={Database} borderColor="border-rose-500/50" id="n-vec" />
                                {/* If no RRF, docs flow straight out of here */}
                                {!strategies.rrf && <VerticalEdgeWithDocs count={3} />}
                            </div>
                            <div className="w-1/2 flex flex-col items-center relative">
                                <PipelineNode title="BM25 Search" subtitle="Lexical matching" icon={Blocks} borderColor="border-rose-500/50" id="n-bm25" />
                                {!strategies.rrf && <VerticalEdgeWithDocs count={2} />}
                            </div>
                        </div>
                        {/* Join back if RRF is active */}
                        {strategies.rrf && (
                            <div className="relative w-full flex flex-col items-center">
                                {/* The lines coming down before merging */}
                                <div className="flex w-[500px] h-6 relative">
                                     <div className="w-1/2 flex justify-center"><VerticalEdge length="h-6" arrow={false} /></div>
                                     <div className="w-1/2 flex justify-center"><VerticalEdge length="h-6" arrow={false} /></div>
                                     <div className="absolute top-2 left-1/4 -translate-x-1/2 bg-background p-1 outline outline-4 outline-background rounded-sm z-10"><FileText className="w-3.5 h-3.5 text-muted-foreground/80"/></div>
                                     <div className="absolute top-2 left-3/4 -translate-x-1/2 bg-background p-1 outline outline-4 outline-background rounded-sm z-10"><FileText className="w-3.5 h-3.5 text-muted-foreground/80"/></div>
                                </div>
                                <BranchUp />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <PipelineNode title="Vector Search" subtitle="Dense embeddings" icon={Database} borderColor="border-rose-500/50" id="n-vec" />
                        <VerticalEdgeWithDocs count={3} />
                    </div>
                )}
            </motion.div>

            {/* 4. RRF RANKING */}
            {strategies.rrf && (
                <div className="flex flex-col items-center">
                    <PipelineNode title="RRF Ranker" subtitle="Combines scores" icon={Zap} borderColor="border-primary/50" id="n-rrf" />
                    <VerticalEdgeWithDocs count={1} label="Ranked" />
                </div>
            )}
            {!strategies.rrf && strategies.hybridSearch && (
                <div className="flex flex-col items-center w-full">
                    {/* If no RRF, they just merge before Generation */}
                    <div className="flex w-[500px] justify-center mt-[-1px]">
                         <BranchUp />
                    </div>
                </div>
            )}

            {/* 5. GENERATION BOUNDING BOX */}
            <motion.div layout transition={{ type: "spring", stiffness: 400, damping: 30 }} className="border border-dashed border-border/80 rounded-xl pt-8 pb-6 px-6 md:px-12 bg-muted/5 relative flex flex-col items-center w-full max-w-[650px] mt-[-1px]">
                <span className="absolute -top-2.5 left-6 px-2 bg-background text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Generation</span>
                
                {strategies.caching ? (
                    <div className="flex flex-col w-full items-center">
                        <BranchDown />
                        <div className="flex justify-center w-[500px]">
                            <div className="w-1/2 flex flex-col items-center">
                                <PipelineNode title="LLM Generation" subtitle="Final answer" icon={BrainCircuit} id="n-llm" />
                            </div>
                            <div className="w-1/2 flex flex-col items-center">
                                <PipelineNode title="Cache Write" subtitle="Save payload" icon={HardDrive} borderColor="border-teal-500/50" id="n-cache-w" />
                            </div>
                        </div>
                        <BranchUp />
                    </div>
                ) : (
                    <PipelineNode title="LLM Generation" subtitle="Final answer" icon={BrainCircuit} id="n-llm" />
                )}
            </motion.div>

            {/* 6. OUTPUT */}
            <VerticalEdge />
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="font-bold text-sm uppercase tracking-widest py-3 px-10 rounded-lg border border-border shadow-md bg-card z-10 flex items-center justify-center">
                <span className="bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent tracking-widest">OUTPUT</span>
            </motion.div>
            
        </div>
      </div>
    </div>
  );
}

const lineClass = "border-muted-foreground/30";

function BranchDown() {
    return (
        <div className={`w-[250px] h-6 border-t-2 border-l-2 border-r-2 ${lineClass} relative mt-[-1px]`}>
            {/* tiny arrow heads */}
            <div className="absolute bottom-[-2px] left-[-6px] border-[5px] border-t-muted-foreground/60 border-l-transparent border-r-transparent border-b-transparent" />
            <div className="absolute bottom-[-2px] right-[-6px] border-[5px] border-t-muted-foreground/60 border-l-transparent border-r-transparent border-b-transparent" />
        </div>
    );
}

function BranchUp() {
    return (
        <div className={`w-[250px] h-6 border-b-2 border-l-2 border-r-2 ${lineClass} relative mb-[-1px]`}>
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 border-[5px] border-t-muted-foreground/60 border-l-transparent border-r-transparent border-b-transparent" />
        </div>
    );
}

function VerticalEdge({ length = "h-8", arrow = true }: { length?: string, arrow?: boolean }) {
    return (
        <div className={`w-[2px] bg-muted-foreground/30 relative mx-auto ${length} shrink-0`}>
            {arrow && <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 border-[5px] border-t-muted-foreground/60 border-l-transparent border-r-transparent border-b-transparent"/>}
        </div>
    );
}

function VerticalEdgeWithDocs({ count, label }: { count: number, label?: string }) {
    return (
        <div className="w-[2px] bg-muted-foreground/30 relative mx-auto h-12 shrink-0 flex items-center justify-center">
            <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 border-[5px] border-t-muted-foreground/60 border-l-transparent border-r-transparent border-b-transparent"/>
            
            {/* The Document Icons sit DIRECTLY on top of the line */}
            <div className="absolute bg-background p-1 py-0.5 outline outline-4 outline-background rounded-sm flex gap-0.5 items-center z-10 shadow-sm border border-border border-dashed">
                {Array.from({ length: count }).map((_, i) => (
                    <FileText key={i} className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
                ))}
                {label && <span className="ml-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>}
            </div>
        </div>
    );
}

function ControlToggle({ id, label, description, checked, onChange }: { id: string, label: string, description: string, checked: boolean, onChange: () => void }) {
    return (
        <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/10 px-2 rounded-md transition-colors">
            <div className="space-y-0.5 pr-4">
                <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-1" />
        </div>
    );
}

function PipelineNode({ title, subtitle, icon: Icon, borderColor = 'border-border/50', id }: { title: string; subtitle: string; icon: React.ElementType; borderColor?: string; id: string; }) {
    return (
        <motion.div layout key={id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0 z-10 w-[200px]">
            <Card className={`w-full shadow-none border ${borderColor} bg-card transition-colors rounded-lg overflow-hidden`}>
                <CardContent className="p-3 flex gap-3 items-center bg-muted/5">
                    <div className="text-foreground bg-background border border-border/50 p-2 rounded-md shadow-sm">
                        <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-xs tracking-tight text-foreground">{title}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{subtitle}</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
