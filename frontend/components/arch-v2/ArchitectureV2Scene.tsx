'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Cpu,
  Database,
  FileText,
  GitMerge,
  PenLine,
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
  | 'ranker'
  | 'llm'
  | 'cacheStore'
  | 'output';

type AnchorSide = 'left' | 'right' | 'top' | 'bottom';
type EdgeStyle = 'curve' | 'elbow' | 'vertical';
type EdgeTone = 'base' | 'hybrid' | 'rrf' | 'cache' | 'hit' | 'query';
type NodeTone = 'base' | 'hybrid' | 'rrf' | 'cache' | 'query' | 'llm' | 'output';
type EdgePayload = 'doc' | 'rewrite' | 'cache';

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
  payload?: EdgePayload;
  payloadDx?: number;
  payloadDy?: number;
};

type RenderedEdge = {
  id: string;
  tone: EdgeTone;
  dashed: boolean;
  path: string;
  label?: string;
  labelX: number;
  labelY: number;
  payload?: EdgePayload;
  payloadX: number;
  payloadY: number;
};

const CANVAS = {
  width: 1720,
  height: 900,
} as const;

const NODES: Record<NodeId, NodeSpec> = {
  query: {
    id: 'query',
    title: 'Query',
    subtitle: 'User input',
    icon: Search,
    tone: 'base',
    x: 120,
    y: 350,
    w: 220,
    h: 150,
  },
  queryExpansion: {
    id: 'queryExpansion',
    title: 'Query Expansion',
    subtitle: 'Single rewritten query',
    icon: Sparkles,
    tone: 'query',
    x: 430,
    y: 350,
    w: 280,
    h: 150,
  },
  cacheLookup: {
    id: 'cacheLookup',
    title: 'Cache Lookup',
    subtitle: 'Hit or miss',
    icon: Database,
    tone: 'cache',
    x: 430,
    y: 130,
    w: 280,
    h: 110,
  },
  vector: {
    id: 'vector',
    title: 'Vector Retrieval',
    subtitle: 'Relevant chunks',
    icon: Cpu,
    tone: 'base',
    x: 790,
    y: 250,
    w: 280,
    h: 130,
  },
  bm25: {
    id: 'bm25',
    title: 'BM25 Retrieval',
    subtitle: 'Keyword chunks',
    icon: FileText,
    tone: 'hybrid',
    x: 790,
    y: 470,
    w: 280,
    h: 130,
  },
  ranker: {
    id: 'ranker',
    title: 'RRF Ranker',
    subtitle: 'Reciprocal fusion',
    icon: GitMerge,
    tone: 'rrf',
    x: 1130,
    y: 320,
    w: 250,
    h: 220,
  },
  llm: {
    id: 'llm',
    title: 'LLM',
    subtitle: 'Generation',
    icon: Bot,
    tone: 'llm',
    x: 1410,
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
    x: 1410,
    y: 650,
    w: 220,
    h: 120,
  },
  output: {
    id: 'output',
    title: 'Output',
    subtitle: 'Final answer',
    icon: ArrowRight,
    tone: 'output',
    x: 1650,
    y: 390,
    w: 58,
    h: 102,
  },
};

const EDGE_COLORS: Record<EdgeTone, string> = {
  base: '#9aa1ab',
  hybrid: '#e5ab2a',
  rrf: '#cc8f1d',
  cache: '#3aa9e3',
  hit: '#31d184',
  query: '#e38c35',
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
  if (state.hybrid && state.rrf) visibleNodes.add('ranker');
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
      labelDy: -12,
      payload: 'cache',
      payloadDy: -34,
    });
    edges.push({
      id: 'cache-hit-to-output',
      from: 'cacheLookup',
      to: 'output',
      tone: 'hit',
      label: 'hit',
      dashed: true,
      style: 'elbow',
      labelDy: -22,
      fromSide: 'right',
      toSide: 'top',
      payload: 'doc',
      payloadDx: -16,
      payloadDy: -44,
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
      labelDy: -10,
      payload: 'rewrite',
      payloadDy: -30,
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
      labelDy: -12,
      payload: 'doc',
      payloadDy: -36,
    });
    edges.push({
      id: 'entry-to-bm25',
      from: retrievalSource,
      to: 'bm25',
      tone: 'hybrid',
      label: 'keyword',
      style: 'curve',
      labelDy: 18,
      payload: 'doc',
      payloadDy: 40,
    });

    if (state.rrf) {
      edges.push({
        id: 'vector-to-ranker',
        from: 'vector',
        to: 'ranker',
        tone: 'rrf',
        label: 'ranked list',
        style: 'elbow',
        fromSide: 'right',
        toSide: 'left',
        labelDy: -12,
        payload: 'doc',
        payloadDy: -34,
      });
      edges.push({
        id: 'bm25-to-ranker',
        from: 'bm25',
        to: 'ranker',
        tone: 'rrf',
        label: 'ranked list',
        style: 'elbow',
        fromSide: 'right',
        toSide: 'left',
        labelDy: 12,
        payload: 'doc',
        payloadDy: 34,
      });
      edges.push({
        id: 'ranker-to-llm',
        from: 'ranker',
        to: 'llm',
        tone: 'rrf',
        label: 'fused context',
        style: 'elbow',
        fromSide: 'right',
        toSide: 'left',
        labelDy: -14,
        payload: 'doc',
        payloadDy: -36,
      });
    } else {
      edges.push({
        id: 'vector-to-llm-hybrid',
        from: 'vector',
        to: 'llm',
        tone: 'hybrid',
        style: 'elbow',
        fromSide: 'right',
        toSide: 'left',
        label: 'dense context',
        labelDy: -24,
        payload: 'doc',
        payloadDy: -42,
      });
      edges.push({
        id: 'bm25-to-llm-hybrid',
        from: 'bm25',
        to: 'llm',
        tone: 'hybrid',
        style: 'elbow',
        fromSide: 'right',
        toSide: 'left',
        label: 'keyword context',
        labelDy: 22,
        payload: 'doc',
        payloadDy: 44,
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
      payload: 'doc',
      payloadDy: -36,
    });
    edges.push({
      id: 'vector-to-llm',
      from: 'vector',
      to: 'llm',
      tone: 'base',
      label: 'retrieved chunks',
      style: 'elbow',
      fromSide: 'right',
      toSide: 'left',
      labelDy: -12,
      payload: 'doc',
      payloadDy: -36,
    });
  }

  edges.push({
    id: 'llm-to-output',
    from: 'llm',
    to: 'output',
    tone: 'base',
    label: 'answer',
    style: 'elbow',
    fromSide: 'right',
    toSide: 'left',
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
      payload: 'doc',
      payloadDx: 34,
      payloadDy: 34,
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
      payload: edge.payload,
      payloadX: pathData.labelX + (edge.payloadDx ?? edge.labelDx ?? 0),
      payloadY: pathData.labelY + (edge.payloadDy ?? edge.labelDy ?? 0),
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
  const toggle = () => {
    if (!disabled) onCheckedChange(!checked);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onCheckedChange(!checked);
        }
      }}
      className={cn(
        'strategy-pill arch-v2-toggle rounded-md border px-4 py-3 transition-all',
        checked ? 'arch-v2-toggle-active border-primary/50' : 'border-gray-700',
        disabled ? 'opacity-55' : ''
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor={id} className="cursor-pointer text-sm font-semibold text-white">
            {label}
          </Label>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <Switch
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}

function sectionStyle(visible: boolean) {
  return cn(
    'arch-v2-region absolute rounded-[30px] border transition-all duration-300',
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
    base: 'arch-v2-node-base',
    hybrid: 'arch-v2-node-hybrid',
    rrf: 'arch-v2-node-rrf',
    cache: 'arch-v2-node-cache',
    query: 'arch-v2-node-query',
    llm: 'arch-v2-node-llm',
    output: 'arch-v2-node-output',
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
      {node.id === 'output' ? (
        <div
          className={cn(
            'arch-v2-node landing-card-hover flex h-full w-full flex-col items-center justify-center rounded-2xl border p-2 text-center shadow-[0_12px_28px_rgba(0,0,0,0.22)]',
            toneClass[node.tone]
          )}
        >
          <Icon className="h-4 w-4" />
          <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.08em]">{node.title}</p>
          <p className="arch-v2-node-subtitle mt-1 text-[11px] font-semibold leading-tight">{node.subtitle}</p>
        </div>
      ) : (
      <div
        className={cn(
          'arch-v2-node landing-card-hover flex h-full w-full flex-col items-start justify-between rounded-2xl border p-3 shadow-[0_12px_28px_rgba(0,0,0,0.22)]',
          toneClass[node.tone]
        )}
      >
        <div className="arch-v2-node-chip inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
          <Icon className="h-3.5 w-3.5" />
          <span>{node.title}</span>
        </div>
        <p className="arch-v2-node-subtitle text-[12px] font-semibold">{node.subtitle}</p>
      </div>
      )}
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

  const stateTitle = useMemo(() => {
    const active: string[] = [];
    if (state.queryExpansion) active.push('Query Expansion');
    if (state.hybrid) active.push('Hybrid Search');
    if (state.rrf) active.push('Reciprocal Rank Fusion');
    if (state.caching) active.push('Cache');
    if (active.length === 0) return 'Baseline RAG';
    return active.join(' + ');
  }, [state]);

  const payloadIcon: Record<EdgePayload, React.ComponentType<{ className?: string }>> = {
    doc: FileText,
    rewrite: PenLine,
    cache: Database,
  };

  return (
    <div className="arch-v2-page min-h-screen text-foreground">
      <main className="mx-auto flex w-full max-w-[1760px] flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
        <section className="arch-v2-panel rounded-md border p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-4xl">
              Architecture v2
            </h1>
            <p className="max-w-4xl text-sm text-gray-400 md:text-base">
              Baseline starts with all toggles off. Each strategy adds only its own section to the
              same architecture so combinations stay consistent.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="rounded-sm border border-primary/35 bg-primary/15 px-2 py-1 font-semibold uppercase tracking-[0.08em] text-primary">
              Current State
            </span>
            <span className="arch-v2-state-title rounded-sm border border-gray-700/80 px-2 py-1 font-semibold uppercase tracking-[0.08em] text-gray-200">
              {stateTitle}
            </span>
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
              label="Cache"
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

        <section className="arch-v2-panel rounded-md border p-3 md:p-5">
          <div className="mx-auto flex h-[clamp(360px,66vh,860px)] w-full max-w-[1720px] items-center justify-center">
            <div className="arch-v2-board relative aspect-[1720/900] h-full w-auto max-w-full overflow-hidden rounded-md border border-gray-700">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div
              className={cn(sectionStyle(true), 'arch-v2-region-retrieval')}
              style={{
                left: toPct(50, CANVAS.width),
                top: toPct(220, CANVAS.height),
                width: toPct(1080, CANVAS.width),
                height: toPct(500, CANVAS.height),
              }}
            >
              <div className="arch-v2-region-label absolute left-4 top-3 rounded-md border px-2 py-1 text-[11px] font-semibold tracking-wide">
                Retrieval
              </div>
            </div>

            <div
              className={cn(sectionStyle(state.rrf), 'arch-v2-region-ranking')}
              style={{
                left: toPct(1110, CANVAS.width),
                top: toPct(260, CANVAS.height),
                width: toPct(290, CANVAS.width),
                height: toPct(340, CANVAS.height),
              }}
            >
              <div className="arch-v2-region-label absolute left-4 top-3 rounded-md border px-2 py-1 text-[11px] font-semibold tracking-wide">
                Ranking
              </div>
            </div>

            <div
              className={cn(sectionStyle(true), 'arch-v2-region-generation')}
              style={{
                left: toPct(1390, CANVAS.width),
                top: toPct(260, CANVAS.height),
                width: toPct(260, CANVAS.width),
                height: toPct(430, CANVAS.height),
              }}
            >
              <div className="arch-v2-region-label absolute left-4 top-3 rounded-md border px-2 py-1 text-[11px] font-semibold tracking-wide">
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
                    strokeWidth={2.5}
                    strokeDasharray={edge.dashed ? '9 7' : undefined}
                    markerEnd={`url(#arrow-${edge.tone})`}
                    className={cn('arch-v2-edge', edge.dashed ? 'arch-v2-edge-dashed' : '')}
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

            {graph.edges.map((edge) => {
              if (!edge.payload) return null;
              const Icon = payloadIcon[edge.payload];
              return (
                <div
                  key={`${edge.id}-payload`}
                  className="arch-v2-cargo absolute"
                  style={{
                    left: toPct(edge.payloadX, CANVAS.width),
                    top: toPct(edge.payloadY, CANVAS.height),
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
              );
            })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
