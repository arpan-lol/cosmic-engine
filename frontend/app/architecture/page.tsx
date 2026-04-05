'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Search, Database, Blocks, BrainCircuit, Zap, HardDrive, Network, FileText } from 'lucide-react';

const lineFillClass = 'bg-foreground/25';
const dualWidth = 'min(560px, 92vw)';

export default function ArchitectureDemo() {
  const [strategies, setStrategies] = useState({
    hybridSearch: false,
    rrf: false,
    caching: false,
    queryExpansion: false,
  });

  const toggleStrategy = (key: keyof typeof strategies) => {
    setStrategies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showPreBranch = strategies.caching && strategies.queryExpansion;
  const showPreCacheOnly = strategies.caching && !strategies.queryExpansion;
  const showPreExpansionOnly = strategies.queryExpansion && !strategies.caching;
  const useHybrid = strategies.hybridSearch;
  const useRrf = strategies.rrf;
  const useGenerationBranch = strategies.caching;

  const getArchitectureTitle = () => {
    const parts: string[] = [];
    if (strategies.queryExpansion) parts.push('Expanded');
    if (strategies.hybridSearch) parts.push('Hybrid');
    let title = parts.length > 0 ? `${parts.join(' ')} RAG` : 'Baseline RAG';
    if (strategies.rrf) title += ' + RRF';
    if (strategies.caching) title = `Cached ${title}`;
    return title;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="z-20 flex w-80 shrink-0 flex-col gap-6 border-r border-border bg-card p-6">
        <div className="border-b border-border pb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Network className="h-4 w-4 text-primary" />
            Pipeline Builder
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Configure RAG architecture strategies.</p>
        </div>
        <div className="space-y-4">
          <ControlToggle
            id="expansion"
            label="Query Expansion"
            description="LLM variant generation."
            checked={strategies.queryExpansion}
            onChange={() => toggleStrategy('queryExpansion')}
          />
          <ControlToggle
            id="hybrid"
            label="Hybrid Search"
            description="Vector & BM25 parallel."
            checked={strategies.hybridSearch}
            onChange={() => toggleStrategy('hybridSearch')}
          />
          <ControlToggle
            id="rrf"
            label="Rank Fusion"
            description="Blend scoresets."
            checked={strategies.rrf}
            onChange={() => toggleStrategy('rrf')}
          />
          <ControlToggle
            id="cache"
            label="Cache"
            description="Cache query to skip execution."
            checked={strategies.caching}
            onChange={() => toggleStrategy('caching')}
          />
        </div>
      </div>

      <div className="relative flex h-full flex-1 flex-col items-center overflow-x-hidden overflow-y-auto pt-12 pb-32">
        <div className="mb-8 max-w-3xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground transition-all duration-300">{getArchitectureTitle()}</h1>
        </div>

        <div className="flex w-full max-w-4xl flex-col items-center">
          <TerminalNode label="QUERY" />

          {showPreBranch ? (
            <div className="flex flex-col items-center">
              <Line h={36} />
              <SplitConnector h={24} />
              <DualNodeRow
                leftNode={<PipelineNode title="Cache Lookup" subtitle="Check queries" icon={Search} borderColor="border-teal-500/50" id="n-cache" />}
                rightNode={<PipelineNode title="Query Expansion" subtitle="LLM variants" icon={Sparkles} borderColor="border-blue-500/50" id="n-exp" />}
              />
              <MergeConnector h={24} tail={16} />
            </div>
          ) : showPreCacheOnly ? (
            <div className="flex flex-col items-center">
              <Line h={36} />
              <PipelineNode title="Cache Lookup" subtitle="Check queries" icon={Search} borderColor="border-teal-500/50" id="n-cache" />
              <Line h={32} />
            </div>
          ) : showPreExpansionOnly ? (
            <div className="flex flex-col items-center">
              <Line h={36} />
              <PipelineNode title="Query Expansion" subtitle="LLM variants" icon={Sparkles} borderColor="border-blue-500/50" id="n-exp" />
              <Line h={32} />
            </div>
          ) : (
            <Line h={82} />
          )}

          <Stage title="Retrieval">
            {useHybrid ? (
              <div className="flex flex-col items-center">
                <Line h={34} />
                <SplitConnector h={24} />
                <DualNodeRow
                  leftNode={<PipelineNode title="Vector Search" subtitle="Dense embeddings" icon={Database} borderColor="border-rose-500/50" id="n-vec" />}
                  rightNode={<PipelineNode title="BM25 Search" subtitle="Lexical matching" icon={Blocks} borderColor="border-rose-500/50" id="n-bm25" />}
                />
                <HybridDocsMerge leftDocs={useRrf ? 1 : 3} rightDocs={useRrf ? 1 : 2} h={52} tail={18} />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Line h={34} />
                <Line h={14} />
                <PipelineNode title="Vector Search" subtitle="Dense embeddings" icon={Database} borderColor="border-rose-500/50" id="n-vec" />
                <VerticalDocs count={useRrf ? 1 : 3} h={58} />
              </div>
            )}
          </Stage>

          {useRrf ? (
            <div className="flex flex-col items-center">
              <Line h={20} />
              <PipelineNode title="RRF Ranker" subtitle="Combines scores" icon={Zap} borderColor="border-primary/50" id="n-rrf" />
              <VerticalDocs count={1} label="Ranked" h={60} />
              <Line h={18} />
            </div>
          ) : (
            <Line h={30} />
          )}

          <Stage title="Generation">
            {useGenerationBranch ? (
              <div className="flex flex-col items-center">
                <Line h={34} />
                <SplitConnector h={24} />
                <DualNodeRow
                  leftNode={<PipelineNode title="LLM Generation" subtitle="Final answer" icon={BrainCircuit} id="n-llm" />}
                  rightNode={<PipelineNode title="Cache Write" subtitle="Save payload" icon={HardDrive} borderColor="border-teal-500/50" id="n-cache-w" />}
                />
                <MergeConnector h={24} tail={18} />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Line h={34} />
                <Line h={14} />
                <PipelineNode title="LLM Generation" subtitle="Final answer" icon={BrainCircuit} id="n-llm" />
                <Line h={34} />
              </div>
            )}
          </Stage>

          <Line h={34} />
          <TerminalNode label="OUTPUT" />
        </div>
      </div>
    </div>
  );
}

function Stage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative flex w-full max-w-[650px] flex-col items-center rounded-xl border border-dashed border-border/80 bg-muted/5 px-6 pt-8 pb-0 md:px-12"
    >
      <span className="absolute -top-2.5 left-6 bg-background px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      <div className={`absolute -top-px left-1/2 h-[33px] w-[2px] -translate-x-1/2 ${lineFillClass}`} />
      {children}
    </motion.div>
  );
}

function Line({ h, className = '' }: { h: number; className?: string }) {
  return <div className={`mx-auto w-[2px] shrink-0 ${lineFillClass} ${className}`} style={{ height: `${h}px` }} />;
}

function SplitConnector({ h }: { h: number }) {
  return (
    <div className="relative shrink-0" style={{ width: dualWidth, height: `${h}px` }}>
      <div className={`absolute left-1/4 right-1/4 top-0 h-[2px] ${lineFillClass}`} />
      <div className={`absolute left-1/4 top-0 h-full w-[2px] -translate-x-1/2 ${lineFillClass}`} />
      <div className={`absolute left-3/4 top-0 h-full w-[2px] -translate-x-1/2 ${lineFillClass}`} />
    </div>
  );
}

function MergeConnector({ h, tail, joinBottom = false }: { h: number; tail: number; joinBottom?: boolean }) {
  return (
    <div className={`flex flex-col items-center ${joinBottom ? '-mb-px' : ''}`}>
      <div className="relative shrink-0" style={{ width: dualWidth, height: `${h}px` }}>
        <div className={`absolute bottom-0 left-1/4 right-1/4 h-[2px] ${lineFillClass}`} />
        <div className={`absolute left-1/4 top-0 h-full w-[2px] -translate-x-1/2 ${lineFillClass}`} />
        <div className={`absolute left-3/4 top-0 h-full w-[2px] -translate-x-1/2 ${lineFillClass}`} />
      </div>
      <Line h={tail} className="-mt-px" />
    </div>
  );
}

function DocBadge({ count, label, className }: { count: number; label?: string; className: string }) {
  return (
    <div className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-sm border border-dashed border-border bg-background p-1 py-0.5 shadow-sm outline outline-4 outline-background ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <FileText key={i} className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
      ))}
      {label && <span className="ml-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>}
    </div>
  );
}

function VerticalDocs({ count, label, h, joinBottom = false }: { count: number; label?: string; h: number; joinBottom?: boolean }) {
  return (
    <div className={`relative mx-auto w-[2px] shrink-0 ${lineFillClass} ${joinBottom ? '-mb-px' : ''}`} style={{ height: `${h}px` }}>
      <DocBadge count={count} label={label} className="left-1/2 top-1/2" />
    </div>
  );
}

function HybridDocsMerge({
  leftDocs,
  rightDocs,
  h,
  tail,
  joinBottom = false,
}: {
  leftDocs: number;
  rightDocs: number;
  h: number;
  tail: number;
  joinBottom?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center ${joinBottom ? '-mb-px' : ''}`}>
      <div className="relative shrink-0" style={{ width: dualWidth, height: `${h}px` }}>
        <div className={`absolute bottom-0 left-1/4 right-1/4 h-[2px] ${lineFillClass}`} />
        <div className={`absolute left-1/4 top-0 h-full w-[2px] -translate-x-1/2 ${lineFillClass}`} />
        <div className={`absolute left-3/4 top-0 h-full w-[2px] -translate-x-1/2 ${lineFillClass}`} />
        <DocBadge count={leftDocs} className="left-1/4 top-1/2" />
        <DocBadge count={rightDocs} className="left-3/4 top-1/2" />
      </div>
      <Line h={tail} className="-mt-px" />
    </div>
  );
}

function DualNodeRow({ leftNode, rightNode }: { leftNode: React.ReactNode; rightNode: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 shrink-0" style={{ width: dualWidth }}>
      <div className="flex items-center justify-center">{leftNode}</div>
      <div className="flex items-center justify-center">{rightNode}</div>
    </div>
  );
}

function TerminalNode({ label }: { label: string }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="z-10 flex items-center justify-center rounded-lg border border-border bg-card px-10 py-3 text-sm font-bold uppercase tracking-widest shadow-md"
    >
      <span className="tracking-widest text-primary">{label}</span>
    </motion.div>
  );
}

function ControlToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-md border-b border-border/50 px-2 py-2 transition-colors last:border-0 hover:bg-muted/10">
      <div className="space-y-0.5 pr-4">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-1" />
    </div>
  );
}

function PipelineNode({
  title,
  subtitle,
  icon: Icon,
  borderColor = 'border-border/50',
  id,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  borderColor?: string;
  id: string;
}) {
  return (
    <motion.div
      layout
      key={id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="z-10 w-[220px] max-w-[94%] shrink-0"
    >
      <Card className={`w-full overflow-hidden rounded-lg border bg-card shadow-none transition-colors ${borderColor}`}>
        <CardContent className="flex items-center gap-3 bg-muted/5 p-3">
          <div className="rounded-md border border-border/50 bg-background p-2 text-foreground shadow-sm">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-tight text-foreground">{title}</span>
            <span className="text-[10px] leading-tight text-muted-foreground">{subtitle}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
