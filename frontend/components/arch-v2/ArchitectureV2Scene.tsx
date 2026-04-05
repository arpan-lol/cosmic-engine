'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Cpu,
  Database,
  FileText,
  GitMerge,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type StrategyState = {
  hybrid: boolean;
  rrf: boolean;
  caching: boolean;
  queryExpansion: boolean;
};

type NodeId =
  | 'query'
  | 'queryExpansion'
  | 'cacheLookup'
  | 'vector'
  | 'bm25'
  | 'merge'
  | 'ranker'
  | 'llm'
  | 'cacheStore'
  | 'output';

type AnchorSide = 'left' | 'right' | 'top' | 'bottom';
type EdgeStyle = 'curve' | 'elbow' | 'vertical';
type EdgeTone = 'base' | 'hybrid' | 'rrf' | 'cache' | 'hit' | 'query';
type NodeTone = 'base' | 'hybrid' | 'rrf' | 'cache' | 'query' | 'llm' | 'output';

type Point = {
  x: number;
  y: number;
};

type NodeSpec = {
  id: NodeId;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: NodeTone;
  x: number;
  y: number;
  w: number;
  h: number;
};

type EdgeSpec = {
  id: string;
  from: NodeId;
  to: NodeId;
  tone: EdgeTone;
  label?: string;
  dashed?: boolean;
  style?: EdgeStyle;
  fromSide?: AnchorSide;
  toSide?: AnchorSide;
  labelDx?: number;
  labelDy?: number;
};

type RenderedEdge = {
  id: string;
  tone: EdgeTone;
  dashed: boolean;
  path: string;
  label?: string;
  labelX: number;
  labelY: number;
};

const CANVAS = {
  width: 1520,
  height: 860,
} as const;

const NODES: Record<NodeId, NodeSpec> = {
  query: {
    id: 'query',
    title: 'Query',
    subtitle: 'User input',
    icon: Search,
    tone: 'base',
    x: 120,
    y: 330,
    w: 190,
    h: 130,
  },
  queryExpansion: {
    id: 'queryExpansion',
    title: 'Query Expansion',
    subtitle: 'Single rewritten query',
    icon: Sparkles,
    tone: 'query',
    x: 390,
    y: 330,
    w: 220,
    h: 130,
  },
  cacheLookup: {
    id: 'cacheLookup',
    title: 'Cache Lookup',
    subtitle: 'Hit or miss',
    icon: Database,
    tone: 'cache',
    x: 390,
    y: 140,
    w: 220,
    h: 96,
  },
  vector: {
    id: 'vector',
    title: 'Vector Retrieval',
    subtitle: 'Relevant chunks',
    icon: Cpu,
    tone: 'base',
    x: 680,
    y: 250,
    w: 260,
    h: 120,
  },
  bm25: {
    id: 'bm25',
    title: 'BM25 Retrieval',
    subtitle: 'Keyword chunks',
    icon: FileText,
    tone: 'hybrid',
    x: 680,
    y: 430,
    w: 260,
    h: 120,
  },
  merge: {
    id: 'merge',
    title: 'Fusion Gate',
    subtitle: 'Combined context',
    icon: Layers,
    tone: 'hybrid',
    x: 980,
    y: 350,
    w: 130,
    h: 100,
  },
  ranker: {
    id: 'ranker',
    title: 'RRF Ranker',
    subtitle: 'Reciprocal fusion',
    icon: GitMerge,
    tone: 'rrf',
    x: 970,
    y: 280,
    w: 200,
    h: 220,
  },
  llm: {
    id: 'llm',
    title: 'LLM',
    subtitle: 'Response synthesis',
    icon: Bot,
    tone: 'llm',
    x: 1210,
    y: 340,
    w: 220,
    h: 160,
  },
  cacheStore: {
    id: 'cacheStore',
    title: 'Cache Write',
    subtitle: 'Store response',
    icon: Database,
    tone: 'cache',
    x: 1210,
    y: 610,
    w: 220,
    h: 110,
  },
  output: {
    id: 'output',
    title: 'Output',
    subtitle: 'Final answer',
    icon: ArrowRight,
    tone: 'output',
    x: 1440,
    y: 375,
    w: 70,
    h: 90,
  },
};

const EDGE_COLORS: Record<EdgeTone, string> = {
  base: '#697079',
  hybrid: '#e0a321',
  rrf: '#b98511',
  cache: '#2f87b7',
  hit: '#1f9d5b',
  query: '#cb7a35',
};

function toPct(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function anchorPoint(node: NodeSpec, side: AnchorSide): Point {
  if (side === 'left') return { x: node.x, y: node.y + node.h / 2 };
  if (side === 'right') return { x: node.x + node.w, y: node.y + node.h / 2 };
  if (side === 'top') return { x: node.x + node.w / 2, y: node.y };
  return { x: node.x + node.w / 2, y: node.y + node.h };
}

function edgePath(spec: EdgeSpec) {
  const fromNode = NODES[spec.from];
  const toNode = NODES[spec.to];
  const start = anchorPoint(fromNode, spec.fromSide ?? 'right');
  const end = anchorPoint(toNode, spec.toSide ?? 'left');

  if ((spec.style ?? 'curve') === 'elbow') {
    const midX = start.x + (end.x - start.x) * 0.5;
    return {
      path: `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`,
      labelX: midX,
      labelY: (start.y + end.y) * 0.5,
    };
  }

  if ((spec.style ?? 'curve') === 'vertical') {
    const dy = Math.max(60, Math.abs(end.y - start.y) * 0.45);
    return {
      path: `M ${start.x} ${start.y} C ${start.x} ${start.y + dy} ${end.x} ${end.y - dy} ${end.x} ${end.y}`,
      labelX: (start.x + end.x) * 0.5,
      labelY: (start.y + end.y) * 0.5,
    };
  }

  const dx = Math.max(70, Math.abs(end.x - start.x) * 0.38);
  return {
    path: `M ${start.x} ${start.y} C ${start.x + dx} ${start.y} ${end.x - dx} ${end.y} ${end.x} ${end.y}`,
    labelX: (start.x + end.x) * 0.5,
    labelY: (start.y + end.y) * 0.5,
  };
}

function composeGraph(state: StrategyState) {
  const visibleNodes = new Set<NodeId>(['query', 'vector', 'llm', 'output']);
  const edges: EdgeSpec[] = [];

  if (state.queryExpansion) visibleNodes.add('queryExpansion');
  if (state.hybrid) visibleNodes.add('bm25');
  if (state.hybrid && !state.rrf) visibleNodes.add('merge');
  if (state.rrf) visibleNodes.add('ranker');
  if (state.caching) {
    visibleNodes.add('cacheLookup');
    visibleNodes.add('cacheStore');
  }

  if (state.caching) {
    edges.push({
      id: 'query-to-cache',
      from: 'query',
      to: 'cacheLookup',
      tone: 'cache',
      label: 'lookup',
      style: 'curve',
      labelDy: -18,
    });
    edges.push({
      id: 'cache-hit-to-output',
      from: 'cacheLookup',
      to: 'output',
      tone: 'hit',
      label: 'hit',
      dashed: true,
      style: 'elbow',
      labelDy: -14,
    });
  }

  let retrievalSource: NodeId = 'query';

  if (state.queryExpansion) {
    visibleNodes.add('queryExpansion');
    edges.push({
      id: state.caching ? 'cache-to-expansion' : 'query-to-expansion',
      from: state.caching ? 'cacheLookup' : 'query',
      to: 'queryExpansion',
      tone: 'query',
      label: state.caching ? 'miss' : 'rewrite',
      dashed: state.caching,
      style: 'curve',
      labelDy: -14,
    });
    retrievalSource = 'queryExpansion';
  } else if (state.caching) {
    retrievalSource = 'cacheLookup';
  }

  if (state.hybrid) {
    edges.push({
      id: 'entry-to-vector',
      from: retrievalSource,
      to: 'vector',
      tone: 'hybrid',
      label: 'dense',
      style: 'curve',
      labelDy: -16,
    });
    edges.push({
      id: 'entry-to-bm25',
      from: retrievalSource,
      to: 'bm25',
      tone: 'hybrid',
      label: 'keyword',
      style: 'curve',
      labelDy: 18,
    });

    if (state.rrf) {
      edges.push({
        id: 'vector-to-ranker',
        from: 'vector',
        to: 'ranker',
        tone: 'rrf',
        label: 'ranked list',
        style: 'elbow',
        labelDy: -12,
      });
      edges.push({
        id: 'bm25-to-ranker',
        from: 'bm25',
        to: 'ranker',
        tone: 'rrf',
        label: 'ranked list',
        style: 'elbow',
        labelDy: 12,
      });
      edges.push({
        id: 'ranker-to-llm',
        from: 'ranker',
        to: 'llm',
        tone: 'rrf',
        label: 'fused context',
        style: 'curve',
        labelDy: -16,
      });
    } else {
      edges.push({
        id: 'vector-to-merge',
        from: 'vector',
        to: 'merge',
        tone: 'hybrid',
        style: 'curve',
        label: 'context',
        labelDy: -10,
      });
      edges.push({
        id: 'bm25-to-merge',
        from: 'bm25',
        to: 'merge',
        tone: 'hybrid',
        style: 'curve',
        label: 'context',
        labelDy: 10,
      });
      edges.push({
        id: 'merge-to-llm',
        from: 'merge',
        to: 'llm',
        tone: 'hybrid',
        style: 'curve',
        label: 'merged context',
        labelDy: -14,
      });
    }
  } else {
    edges.push({
      id: 'entry-to-vector-only',
      from: retrievalSource,
      to: 'vector',
      tone: 'base',
      label: 'vector search',
      style: 'curve',
      labelDy: -12,
    });
    edges.push({
      id: 'vector-to-llm',
      from: 'vector',
      to: 'llm',
      tone: 'base',
      label: 'retrieved chunks',
      style: 'curve',
      labelDy: -12,
    });
  }

  edges.push({
    id: 'llm-to-output',
    from: 'llm',
    to: 'output',
    tone: 'base',
    label: 'answer',
    style: 'curve',
    labelDy: -10,
  });

  if (state.caching) {
    edges.push({
      id: 'llm-to-cache-store',
      from: 'llm',
      to: 'cacheStore',
      tone: 'cache',
      label: 'write-back',
      dashed: true,
      style: 'vertical',
      fromSide: 'bottom',
      toSide: 'top',
      labelDx: 24,
      labelDy: 8,
    });
  }

  const renderedEdges: RenderedEdge[] = edges.map((edge) => {
    const pathData = edgePath(edge);
    return {
      id: edge.id,
      tone: edge.tone,
      dashed: edge.dashed ?? false,
      path: pathData.path,
      label: edge.label,
      labelX: pathData.labelX + (edge.labelDx ?? 0),
      labelY: pathData.labelY + (edge.labelDy ?? 0),
    };
  });

  return { visibleNodes, edges: renderedEdges };
}

function StrategyToggle({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card/60 px-4 py-3 transition-all',
        checked ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border',
        disabled ? 'opacity-55' : ''
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor={id} className="cursor-pointer text-sm font-semibold">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function sectionStyle(visible: boolean) {
  return cn(
    'absolute rounded-3xl border transition-all duration-300',
    visible ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-[0.985]'
  );
}

function PipelineNode({
  node,
  visible,
}: {
  node: NodeSpec;
  visible: boolean;
}) {
  const Icon = node.icon;

  const toneClass: Record<NodeTone, string> = {
    base: 'border-zinc-400/60 bg-white/80 text-zinc-800',
    hybrid: 'border-amber-400/60 bg-amber-100/70 text-amber-900',
    rrf: 'border-yellow-500/60 bg-yellow-100/70 text-yellow-900',
    cache: 'border-sky-400/60 bg-sky-100/75 text-sky-900',
    query: 'border-orange-400/60 bg-orange-100/75 text-orange-900',
    llm: 'border-cyan-400/70 bg-cyan-100/80 text-cyan-900',
    output: 'border-zinc-400/60 bg-white/85 text-zinc-800',
  };

  return (
    <div
      className={cn(
        'absolute transition-all duration-300',
        visible ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-[0.92]'
      )}
      style={{
        left: toPct(node.x, CANVAS.width),
        top: toPct(node.y, CANVAS.height),
        width: toPct(node.w, CANVAS.width),
        height: toPct(node.h, CANVAS.height),
      }}
    >
      <div
        className={cn(
          'flex h-full w-full flex-col items-start justify-between rounded-2xl border p-3 shadow-[0_8px_28px_rgba(0,0,0,0.08)] backdrop-blur-[2px]',
          toneClass[node.tone]
        )}
      >
        <div className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
          <Icon className="h-3.5 w-3.5" />
          <span>{node.title}</span>
        </div>
        <p className="text-[11px] font-medium opacity-85">{node.subtitle}</p>
      </div>
    </div>
  );
}

export function ArchitectureV2Scene() {
  const [state, setState] = useState<StrategyState>({
    hybrid: false,
    rrf: false,
    caching: false,
    queryExpansion: false,
  });

  const graph = useMemo(() => composeGraph(state), [state]);

  const onHybridToggle = (next: boolean) => {
    setState((prev) => ({
      ...prev,
      hybrid: next,
      rrf: next ? prev.rrf : false,
    }));
  };

  const onRrfToggle = (next: boolean) => {
    setState((prev) => ({
      ...prev,
      rrf: prev.hybrid ? next : false,
    }));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f9f8f4_100%)] text-foreground">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
        <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-4xl">
              Architecture v2
            </h1>
            <p className="max-w-4xl text-sm text-muted-foreground md:text-base">
              Baseline starts with all toggles off. Each strategy adds only its own section to the
              same architecture so combinations stay consistent.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StrategyToggle
              id="hybrid-toggle"
              label="Hybrid Search"
              description="Enable dense + BM25 retrieval lanes."
              checked={state.hybrid}
              onCheckedChange={onHybridToggle}
            />
            <StrategyToggle
              id="rrf-toggle"
              label="Reciprocal Rank Fusion"
              description="Fuse hybrid lanes in a dedicated ranker."
              checked={state.rrf}
              disabled={!state.hybrid}
              onCheckedChange={onRrfToggle}
            />
            <StrategyToggle
              id="cache-toggle"
              label="Keyword Caching"
              description="Cache lookup before retrieval and write-back after generation."
              checked={state.caching}
              onCheckedChange={(next) => setState((prev) => ({ ...prev, caching: next }))}
            />
            <StrategyToggle
              id="query-expansion-toggle"
              label="Query Expansion"
              description="Rewrite query once before retrieval."
              checked={state.queryExpansion}
              onCheckedChange={(next) => setState((prev) => ({ ...prev, queryExpansion: next }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/70 p-3 shadow-sm md:p-5">
          <div className="relative mx-auto aspect-[1520/860] w-full max-w-[1520px] overflow-hidden rounded-xl border border-border bg-[radial-gradient(circle_at_top_right,rgba(255,208,97,0.10),transparent_52%),radial-gradient(circle_at_bottom_left,rgba(47,135,183,0.10),transparent_50%),#fff]">
            <div
              className={sectionStyle(true)}
              style={{
                left: toPct(60, CANVAS.width),
                top: toPct(200, CANVAS.height),
                width: toPct(930, CANVAS.width),
                height: toPct(420, CANVAS.height),
                background:
                  'repeating-linear-gradient(45deg, rgba(225, 128, 145, 0.10) 0px, rgba(225, 128, 145, 0.10) 2px, transparent 2px, transparent 16px), repeating-linear-gradient(-45deg, rgba(225, 128, 145, 0.10) 0px, rgba(225, 128, 145, 0.10) 2px, transparent 2px, transparent 16px)',
                borderColor: 'rgba(225, 128, 145, 0.5)',
              }}
            >
              <div className="absolute left-4 top-3 rounded-md border border-black/10 bg-white/75 px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-700">
                Retrieval
              </div>
            </div>

            <div
              className={sectionStyle(state.rrf)}
              style={{
                left: toPct(960, CANVAS.width),
                top: toPct(240, CANVAS.height),
                width: toPct(250, CANVAS.width),
                height: toPct(320, CANVAS.height),
                background:
                  'repeating-linear-gradient(45deg, rgba(224, 163, 33, 0.11) 0px, rgba(224, 163, 33, 0.11) 2px, transparent 2px, transparent 16px), repeating-linear-gradient(-45deg, rgba(224, 163, 33, 0.11) 0px, rgba(224, 163, 33, 0.11) 2px, transparent 2px, transparent 16px)',
                borderColor: 'rgba(224, 163, 33, 0.55)',
              }}
            >
              <div className="absolute left-4 top-3 rounded-md border border-black/10 bg-white/75 px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-700">
                Ranking
              </div>
            </div>

            <div
              className={sectionStyle(true)}
              style={{
                left: toPct(1180, CANVAS.width),
                top: toPct(240, CANVAS.height),
                width: toPct(280, CANVAS.width),
                height: toPct(370, CANVAS.height),
                background:
                  'repeating-linear-gradient(45deg, rgba(47, 135, 183, 0.10) 0px, rgba(47, 135, 183, 0.10) 2px, transparent 2px, transparent 16px), repeating-linear-gradient(-45deg, rgba(47, 135, 183, 0.10) 0px, rgba(47, 135, 183, 0.10) 2px, transparent 2px, transparent 16px)',
                borderColor: 'rgba(47, 135, 183, 0.5)',
              }}
            >
              <div className="absolute left-4 top-3 rounded-md border border-black/10 bg-white/75 px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-700">
                Generation
              </div>
            </div>

            <svg
              viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                {(Object.keys(EDGE_COLORS) as EdgeTone[]).map((tone) => (
                  <marker
                    key={tone}
                    id={`arrow-${tone}`}
                    markerWidth="9"
                    markerHeight="9"
                    refX="8"
                    refY="4.5"
                    orient="auto"
                  >
                    <path d="M0,0 L9,4.5 L0,9 z" fill={EDGE_COLORS[tone]} />
                  </marker>
                ))}
              </defs>
              {graph.edges.map((edge) => (
                <g key={edge.id}>
                  <path
                    d={edge.path}
                    fill="none"
                    stroke={EDGE_COLORS[edge.tone]}
                    strokeWidth={2.35}
                    strokeDasharray={edge.dashed ? '9 7' : undefined}
                    markerEnd={`url(#arrow-${edge.tone})`}
                    className="arch-v2-edge"
                  />
                  {edge.label ? (
                    <text
                      x={edge.labelX}
                      y={edge.labelY}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill={EDGE_COLORS[edge.tone]}
                      className="select-none"
                    >
                      {edge.label}
                    </text>
                  ) : null}
                </g>
              ))}
            </svg>

            {(Object.keys(NODES) as NodeId[]).map((nodeId) => (
              <PipelineNode key={nodeId} node={NODES[nodeId]} visible={graph.visibleNodes.has(nodeId)} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
