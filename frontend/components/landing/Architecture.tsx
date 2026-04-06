'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Search, Database, Blocks, BrainCircuit, Zap, HardDrive, Network, FileText } from 'lucide-react';

const lineFillClass = 'bg-foreground/25';
const dualWidth = 'min(840px, 97vw)';

export function Architecture() {
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
    <section
      id="architecture-section"
      className="relative overflow-hidden border-b border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f0_100%)] py-24"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <h2 className="mt-5 text-4xl font-bold tracking-tight text-[#1a1a1c] md:text-6xl">
            Live request flow, tweak it yourself
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-600 md:text-lg">
            Toggle the runtime strategies and watch the request path change:
            cache hit or miss, query rewrite, dense and BM25 ranking, fusion, and
            hypothetical embeddings.
          </p>
        </div>

        <div className="relative mx-auto max-w-[1360px] lg:mt-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
            <div className="mx-auto w-full max-w-[380px] lg:mx-0 lg:-ml-10 lg:mt-16 lg:self-start lg:sticky lg:top-32">
              <div className="w-full rounded-2xl border border-border bg-card/95 p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-5 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                  <Network className="h-5 w-5 text-primary" />
                  Engine Options
                </div>
                <div className="space-y-2.5">
                  <ControlToggle
                    id="expansion"
                    label="Query Expansion"
                    description="Write a better prompt for more matches"
                    checked={strategies.queryExpansion}
                    onChange={() => toggleStrategy('queryExpansion')}
                  />
                  <ControlToggle
                    id="hybrid"
                    label="Hybrid Search"
                    description="Vector & BM25 parallel"
                    checked={strategies.hybridSearch}
                    onChange={() => toggleStrategy('hybridSearch')}
                  />
                  <ControlToggle
                    id="rrf"
                    label="Rank Fusion"
                    description="Blend All incoming scoresets"
                    checked={strategies.rrf}
                    onChange={() => toggleStrategy('rrf')}
                  />
                  <ControlToggle
                    id="cache"
                    label="Cache"
                    description="Caches query + engine options"
                    checked={strategies.caching}
                    onChange={() => toggleStrategy('caching')}
                  />
                  <ControlToggle
                    id="hypothetical-embeddings"
                    label="Hypothetical Embeddings"
                    description="Coming Soon"
                    checked={false}
                    onChange={() => {}}
                    disabled={true}
                  />
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="mb-10 max-w-4xl text-center">
                <h3 className="text-4xl font-bold tracking-tight text-foreground transition-all duration-300 md:text-5xl">
                {getArchitectureTitle()}
                </h3>
              </div>

              <div className="flex w-full max-w-6xl flex-col items-center">
                <TerminalNode label="QUERY" />

                {showPreBranch ? (
                  <div className="flex flex-col items-center">
                    <Line h={44} />
                    <SplitConnector h={24} />
                    <DualNodeRow
                      leftNode={<PipelineNode title="Cache Lookup" subtitle="Already happened?" icon={Search} borderColor="border-teal-500/50" id="n-cache" />}
                      rightNode={<PipelineNode title="Query Expansion" subtitle="More functionality" icon={Sparkles} borderColor="border-blue-500/50" id="n-exp" />}
                    />
                    <MergeConnector h={28} tail={22} />
                  </div>
                ) : showPreCacheOnly ? (
                  <div className="flex flex-col items-center">
                    <Line h={44} />
                    <PipelineNode title="Cache Lookup" subtitle="Already happened?" icon={Search} borderColor="border-teal-500/50" id="n-cache" />
                    <Line h={40} />
                  </div>
                ) : showPreExpansionOnly ? (
                  <div className="flex flex-col items-center">
                    <Line h={44} />
                    <PipelineNode title="Query Expansion" subtitle="More functionality" icon={Sparkles} borderColor="border-blue-500/50" id="n-exp" />
                    <Line h={40} />
                  </div>
                ) : (
                  <Line h={104} />
                )}

                <Stage title="Retrieval">
                  {useHybrid ? (
                    <div className="flex flex-col items-center">
                      <Line h={40} />
                      <SplitConnector h={28} />
                      <DualNodeRow
                        leftNode={<PipelineNode title="Vector Search" subtitle="Dense embeddings" icon={Database} borderColor="border-rose-500/50" id="n-vec" />}
                        rightNode={<PipelineNode title="BM25 Search" subtitle="Keyword Density" icon={Blocks} borderColor="border-rose-500/50" id="n-bm25" />}
                      />
                      <HybridDocsMerge leftDocs={useRrf ? 1 : 3} rightDocs={useRrf ? 1 : 2} leftLabel="chunks" rightLabel="chunks" h={62} tail={24} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Line h={40} />
                      <Line h={16} />
                      <PipelineNode title="Vector Search" subtitle="Dense embeddings" icon={Database} borderColor="border-rose-500/50" id="n-vec" />
                      <VerticalDocs count={useRrf ? 1 : 3} label="chunks" h={70} />
                    </div>
                  )}
                </Stage>

                {useRrf ? (
                  <div className="flex flex-col items-center">
                    <Line h={26} />
                    <PipelineNode title="RRF Ranker" subtitle="Combines scores" icon={Zap} borderColor="border-primary/50" id="n-rrf" />
                    <VerticalDocs count={1} label="Ranked" h={74} />
                    <Line h={24} />
                  </div>
                ) : (
                  <Line h={40} />
                )}

                <Stage title="Generation">
                  {useGenerationBranch ? (
                    <div className="flex flex-col items-center">
                      <Line h={40} />
                      <SplitConnector h={28} />
                      <DualNodeRow
                        leftNode={<PipelineNode title="LLM Generation" subtitle="Final Context" icon={BrainCircuit} id="n-llm" />}
                        rightNode={<PipelineNode title="Cache Write" subtitle="Save state" icon={HardDrive} borderColor="border-teal-500/50" id="n-cache-w" />}
                      />
                      <MergeConnector h={28} tail={24} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Line h={40} />
                      <Line h={16} />
                      <PipelineNode title="LLM Generation" subtitle="Final Context" icon={BrainCircuit} id="n-llm" />
                      <Line h={40} />
                    </div>
                  )}
                </Stage>

                <Line h={40} />
                <TerminalNode label="RESPONSE" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative flex w-full max-w-[900px] flex-col items-center rounded-xl border border-dashed border-border/80 bg-muted/5 px-8 pt-12 pb-0 md:px-16"
    >
      <span className="absolute -top-2.5 left-8 bg-background px-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      <div className={`absolute -top-px left-1/2 h-[49px] w-[2px] -translate-x-1/2 ${lineFillClass}`} />
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

function MergeConnector({ h, tail }: { h: number; tail: number }) {
  return (
    <div className="flex flex-col items-center">
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
    <div className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-sm border border-dashed border-border bg-background p-1.5 py-1 shadow-sm outline outline-4 outline-background ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <FileText key={i} className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
      ))}
      {label && <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>}
    </div>
  );
}

function VerticalDocs({ count, label, h }: { count: number; label?: string; h: number }) {
  return (
    <div className={`relative mx-auto w-[2px] shrink-0 ${lineFillClass}`} style={{ height: `${h}px` }}>
      <DocBadge count={count} label={label} className="left-1/2 top-1/2" />
    </div>
  );
}

function HybridDocsMerge({
  leftDocs,
  rightDocs,
  leftLabel,
  rightLabel,
  h,
  tail,
}: {
  leftDocs: number;
  rightDocs: number;
  leftLabel?: string;
  rightLabel?: string;
  h: number;
  tail: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative shrink-0" style={{ width: dualWidth, height: `${h}px` }}>
        <div className={`absolute bottom-0 left-1/4 right-1/4 h-[2px] ${lineFillClass}`} />
        <div className={`absolute left-1/4 top-0 h-full w-[2px] -translate-x-1/2 ${lineFillClass}`} />
        <div className={`absolute left-3/4 top-0 h-full w-[2px] -translate-x-1/2 ${lineFillClass}`} />
        <DocBadge count={leftDocs} label={leftLabel} className="left-1/4 top-1/2" />
        <DocBadge count={rightDocs} label={rightLabel} className="left-3/4 top-1/2" />
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
      className="z-10 flex items-center justify-center rounded-lg border border-border bg-card px-14 py-[18px] text-lg font-bold uppercase tracking-widest shadow-md"
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
  disabled = false,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between rounded-md border-b border-border/50 py-3 transition-colors last:border-0 ${disabled ? '' : 'hover:bg-muted/10'}`}>
      <div className="space-y-0.5 pr-3">
        <Label htmlFor={id} className={`text-base font-medium ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
          {label}
        </Label>
        <p className={`text-sm leading-relaxed text-muted-foreground ${disabled ? 'opacity-80' : ''}`}>{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-1" disabled={disabled} />
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
      className="z-10 w-[320px] max-w-[96%] shrink-0"
    >
      <Card className={`w-full overflow-hidden rounded-lg border bg-card shadow-none transition-colors ${borderColor}`}>
        <CardContent className="flex items-center gap-4 bg-muted/5 p-5">
          <div className="rounded-md border border-border/50 bg-background p-3 text-foreground shadow-sm">
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-foreground">{title}</span>
            <span className="text-sm leading-tight text-muted-foreground">{subtitle}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
