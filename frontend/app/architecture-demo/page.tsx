'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
    MessageSquare, 
    Sparkles, 
    Search, 
    Database, 
    Blocks, 
    BrainCircuit, 
    Zap, 
    HardDrive, 
    Network,
    ArrowRight,
    FileText,
    ArrowDownRight,
    ArrowUpRight
} from 'lucide-react';

export default function ArchitectureDemo() {
  const [strategies, setStrategies] = useState({
    hybridSearch: false,
    rrf: false,
    caching: false,
    queryExpansion: false,
  });

  const toggleStrategy = (key: keyof typeof strategies) => {
    setStrategies(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Controls (Aligned to existing Cosmic Engine patterns) */}
      <div className="w-80 border-r border-border bg-sidebar p-6 flex flex-col gap-6 z-20 shrink-0">
        <div className="pb-4 border-b border-border">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                Pipeline Builder
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Configure RAG architecture strategies.</p>
        </div>
        
        <div className="space-y-4">
            <ControlToggle 
                id="expansion" 
                label="Query Expansion" 
                description="Expand query with LLM before fetching."
                checked={strategies.queryExpansion} 
                onChange={() => toggleStrategy('queryExpansion')} 
            />
            
            <ControlToggle 
                id="hybrid" 
                label="Hybrid Search" 
                description="Run Vector & Keyword (BM25) searches."
                checked={strategies.hybridSearch} 
                onChange={() => toggleStrategy('hybridSearch')} 
            />
            
            <ControlToggle 
                id="rrf" 
                label="Reciprocal Rank Fusion" 
                description="Blend results algorithmically."
                checked={strategies.rrf} 
                onChange={() => toggleStrategy('rrf')} 
            />
            
            <ControlToggle 
                id="cache" 
                label="Semantic Caching" 
                description="Cache queries to skip execution."
                checked={strategies.caching} 
                onChange={() => toggleStrategy('caching')} 
            />
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center justify-start p-12 bg-background/50">
        
        {/* Pipeline Flex Layout (Horizontal) */}
        <div className="flex items-center justify-start min-w-max pb-8 gap-4 px-8">
            
            {/* Stage 1: Input */}
            <div className="flex flex-col gap-4 justify-center items-center">
                <PipelineNode 
                    title="User Query" 
                    description="Raw user request"
                    icon={MessageSquare} 
                    id="node-query" 
                />
                
                <AnimatePresence mode="popLayout">
                    {strategies.queryExpansion && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90 my-[-8px]" />
                            </motion.div>
                            <PipelineNode 
                                title="Query Expansion" 
                                description="LLM generates variants"
                                icon={Sparkles} 
                                borderColor="border-blue-500/50"
                                id="node-expansion" 
                            />
                        </>
                    )}
                </AnimatePresence>
            </div>

            <Connector />

            {/* Stage 1.5: Cache Lookup */}
            <AnimatePresence mode="popLayout">
                {strategies.caching && (
                    <motion.div layout initial={{ opacity: 0, x: -20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -20, scale: 0.9 }} className="flex items-center gap-4">
                        <PipelineNode 
                            title="Cache Lookup" 
                            description="Compare to semantic cache"
                            icon={Search} 
                            borderColor="border-teal-500/50"
                            id="node-cache-lookup" 
                        />
                        <Connector />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stage 2: Retrieval */}
            <motion.div layout className="flex flex-col gap-4 justify-center border border-dashed border-border p-5 rounded-xl bg-card/30 relative items-center">
                <div className="absolute -top-2.5 left-4 text-[10px] font-semibold text-muted-foreground uppercase bg-background px-1">Retrieval</div>
                
                <div className="flex items-center gap-4">
                    {strategies.hybridSearch && <ArrowUpRight className="w-5 h-5 text-muted-foreground absolute -left-6 top-1/4" />}
                    <PipelineNode 
                        title="Vector Search" 
                        description="Cosine similarity"
                        icon={Database} 
                        borderColor="border-rose-500/50"
                        id="node-vector" 
                    />
                    
                    <FileArray count={3} />
                </div>
                
                <AnimatePresence mode="popLayout">
                    {strategies.hybridSearch && (
                        <div className="flex items-center gap-4">
                            <ArrowDownRight className="w-5 h-5 text-muted-foreground absolute -left-6 bottom-1/4" />
                            <PipelineNode 
                                title="BM25 Search" 
                                description="Lexical matching"
                                icon={Blocks} 
                                borderColor="border-rose-500/50"
                                id="node-bm25" 
                            />
                            
                            <FileArray count={2} />
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>

            <Connector />

            {/* Stage 3: Ranking */}
            <AnimatePresence mode="popLayout">
                {strategies.rrf && (
                    <motion.div layout initial={{ opacity: 0, x: -20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -20, scale: 0.9 }} className="flex items-center gap-4">
                        <PipelineNode 
                            title="RRF Ranker" 
                            description="Combines scores"
                            icon={Zap} 
                            borderColor="border-primary/50"
                            id="node-rrf" 
                        />
                        <Connector />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stage 4: Generation / Cache Save */}
            <motion.div layout className="flex flex-col gap-4 justify-center border border-dashed border-border p-5 rounded-xl bg-card/30 relative">
                <div className="absolute -top-2.5 left-4 text-[10px] font-semibold text-muted-foreground uppercase bg-background px-1">Synthesis</div>
                
                <PipelineNode 
                    title="LLM Synthesis" 
                    description="Generates output with chunks"
                    icon={BrainCircuit} 
                    id="node-llm" 
                />
                
                <AnimatePresence mode="popLayout">
                    {strategies.caching && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center my-[-8px]">
                                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                            </motion.div>
                            <PipelineNode 
                                title="Cache Hydration" 
                                description="Saves query + response"
                                icon={HardDrive} 
                                borderColor="border-teal-500/50"
                                id="node-cache-save" 
                            />
                        </>
                    )}
                </AnimatePresence>
            </motion.div>
            
            <Connector />
            
            <motion.div layout className="flex flex-col justify-center font-bold text-lg text-primary tracking-wide pr-8">
                Output
            </motion.div>

        </div>
      </div>
    </div>
  );
}

// Visual Connector Arrow
function Connector() {
    return (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center text-muted-foreground">
            <ArrowRight className="w-6 h-6 opacity-40 shrink-0" strokeWidth={1.5} />
        </motion.div>
    )
}

// Representing "Relevant Chunks" passed between stages
function FileArray({ count }: { count: number }) {
    return (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1">
            {Array.from({ length: count }).map((_, i) => (
                <FileText key={i} className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
            ))}
        </motion.div>
    );
}

function ControlToggle({ id, label, description, checked, onChange }: { id: string, label: string, description: string, checked: boolean, onChange: () => void }) {
    return (
        <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/10 px-2 rounded-md transition-colors">
            <div className="space-y-0.5">
                <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

function PipelineNode({ 
    title, 
    description, 
    icon: Icon, 
    borderColor = 'border-border', 
    id 
}: { 
    title: string; 
    description: string; 
    icon: React.ElementType; 
    borderColor?: string; 
    id: string; 
}) {
    return (
        <motion.div
            layout
            key={id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 500, damping: 30, mass: 1 }}
            className="shrink-0"
        >
            <Card className={`w-52 shadow-sm ${borderColor} border-l-[3px] bg-card transition-colors`}>
                <CardContent className="p-4 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                        <span className="font-semibold text-[13px] tracking-tight">{title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                        {description}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
