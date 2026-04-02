'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Box,
  CheckCircle,
  Command,
  Cpu,
  Layers,
  Search,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';

export function Architecture() {
  const [hybrid, setHybrid] = useState(true);
  const [rrf, setRrf] = useState(true);
  const [caching, setCaching] = useState(true);
  const [queryExpansion, setQueryExpansion] = useState(true);

  const usesHybrid = hybrid || rrf;

  return (
    <section
      id="architecture"
      className="relative overflow-hidden border-b border-gray-200 bg-[radial-gradient(circle_at_top_left,rgba(255,208,97,0.22),transparent_30%),linear-gradient(180deg,#ffffff_0%,#fbf8f0_100%)] py-24"
    >
      <div className="absolute left-[-12%] top-12 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-[#1a1a1c]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-[#7b5a11]">
            <Sparkles className="h-4 w-4" />
            Runtime Architecture
          </span>
          <h2 className="mt-5 text-4xl font-bold tracking-tight text-[#1a1a1c] md:text-6xl">
            Live request flow, not a placeholder
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-600 md:text-lg">
            Toggle the runtime strategies and watch the request path change:
            cache hit or miss, query rewrite, dense and BM25 ranking, fusion, and
            response streaming.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#e8dcc2] bg-white/80 p-5 shadow-[0_18px_50px_-28px_rgba(26,26,28,0.45)] backdrop-blur">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d6a16]">
                  Strategy Controls
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#1a1a1c]">
                  Runtime toggles
                </h3>
              </div>

              <div className="space-y-3">
                <ToggleControl
                  label="Hybrid Search"
                  description="Adds the BM25 lane beside dense retrieval."
                  state={hybrid}
                  onToggle={() => setHybrid((value) => !value)}
                />
                <ToggleControl
                  label="RRF Fusion"
                  description="Promotes rank agreement when both lists converge."
                  state={rrf}
                  onToggle={() => setRrf((value) => !value)}
                />
                <ToggleControl
                  label="Keyword Caching"
                  description="Surfaces both hit bypass and miss continuation."
                  state={caching}
                  onToggle={() => setCaching((value) => !value)}
                />
                <ToggleControl
                  label="Query Expansion"
                  description="Rewrites the query before retrieval."
                  state={queryExpansion}
                  onToggle={() => setQueryExpansion((value) => !value)}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e8dcc2] bg-[#1a1713] p-5 text-white shadow-[0_18px_50px_-28px_rgba(26,26,28,0.55)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                Engine State
              </p>
              <div className="mt-4 space-y-3">
                <StatusRow
                  label="Cache"
                  value={caching ? 'Hit and miss paths visible' : 'Direct request path'}
                />
                <StatusRow
                  label="Rewrite"
                  value={queryExpansion ? 'Expansion before retrieval' : 'Raw query passes through'}
                />
                <StatusRow
                  label="Retrieval"
                  value={usesHybrid ? 'Dense + BM25 ranked lists' : 'Dense list only'}
                />
                <StatusRow
                  label="Fusion"
                  value={usesHybrid ? (rrf ? 'RRF highlighted' : 'Fusion layer active') : 'No merge stage'}
                />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border border-[#282019] bg-[#14110d] p-5 text-white shadow-[0_36px_90px_-42px_rgba(26,26,28,0.8)] md:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,208,97,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,208,97,0.08),transparent_32%)]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,208,97,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,208,97,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />

            <div className="relative">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Runtime Canvas
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Request lifecycle
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ModeChip label="Dense" active={true} />
                  <ModeChip label="BM25" active={usesHybrid} />
                  <ModeChip label="Cache" active={caching} />
                  <ModeChip label="Rewrite" active={queryExpansion} />
                </div>
              </div>

              {caching && (
                <div className="mb-5 rounded-[24px] border border-primary/30 bg-[linear-gradient(135deg,rgba(255,208,97,0.18),rgba(255,208,97,0.06))] p-4 shadow-[0_16px_30px_-24px_rgba(255,208,97,0.65)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f3c65b]">
                        Cache Hit Shortcut
                      </p>
                      <p className="mt-2 text-sm text-[#f8e8bf]">
                        When the query, attachments, and active strategy key already
                        exist, the engine bypasses retrieval and generation.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#1a1a1c]">
                      <ShortcutPill label="Keyword Cache" />
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <ShortcutPill label="Cached Response" strong />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 xl:flex-row xl:items-stretch xl:gap-4">
                <StageCard
                  icon={<Command className="h-5 w-5" />}
                  eyebrow="Input"
                  title="User Query"
                  description="The live prompt enters the runtime pipeline with the current strategy flags."
                  badges={['session scoped', 'attachments aware']}
                  active={true}
                />

                <FlowConnector label={caching ? 'lookup' : 'direct'} />

                <StageCard
                  icon={<Box className="h-5 w-5" />}
                  eyebrow="Decision"
                  title="Keyword Cache"
                  description={
                    caching
                      ? 'A miss keeps the request moving. A hit returns a stored assistant response immediately.'
                      : 'Cache checks are disabled, so the request continues directly into retrieval.'
                  }
                  badges={caching ? ['hit', 'miss'] : ['bypassed']}
                  active={caching}
                />

                <FlowConnector label={caching ? 'miss continues' : 'pass through'} />

                <StageCard
                  icon={<Settings className="h-5 w-5" />}
                  eyebrow="Rewrite"
                  title="Query Expansion"
                  description={
                    queryExpansion
                      ? 'An LLM rewrite normalizes vague or short prompts before the retrieval fan-out begins.'
                      : 'The raw user query passes unchanged into retrieval.'
                  }
                  badges={queryExpansion ? ['temp 0.50', 'pre-retrieval'] : ['disabled']}
                  active={queryExpansion}
                />

                <FlowConnector label="retrieve" />

                <RetrievalCard usesHybrid={usesHybrid} rrf={rrf} />

                <FlowConnector label="ground prompt" />

                <StageCard
                  icon={<Sparkles className="h-5 w-5" />}
                  eyebrow="Generation"
                  title="LLM Generator"
                  description="The selected context grounds the response, which is then streamed back token by token."
                  badges={['prompt build', 'stream']}
                  active={true}
                />

                <FlowConnector label="stream" />

                <StageCard
                  icon={<Zap className="h-5 w-5" />}
                  eyebrow="Output"
                  title="Final Response"
                  description="The assistant answer is returned to the chat UI and can be stored for future cache hits."
                  badges={caching ? ['cache writeback'] : ['live response']}
                  active={true}
                  emphasize
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <FutureCard
                  icon={<Cpu className="h-5 w-5" />}
                  title="HyDE"
                  description="A hypothetical answer could become a future retrieval guide before the dense and lexical search split."
                />
                <FutureCard
                  icon={<CheckCircle className="h-5 w-5" />}
                  title="Contextual Chunking"
                  description="Chunk-aware context shaping can sit beside retrieval as a future runtime assist without changing today's flow."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToggleControl({
  label,
  description,
  state,
  onToggle,
}: {
  label: string;
  description: string;
  state: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={state}
      className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all duration-300 ${
        state
          ? 'border-primary/50 bg-primary/10 shadow-[0_16px_30px_-24px_rgba(255,208,97,0.85)]'
          : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-[#1a1a1c]">{label}</div>
          <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
        </div>

        <div
          className={`mt-1 flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
            state ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              state ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
        {label}
      </div>
      <div className="mt-1 text-sm text-white/85">{value}</div>
    </div>
  );
}

function ModeChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
        active
          ? 'border-primary/40 bg-primary/10 text-[#f5d98c]'
          : 'border-white/10 bg-white/5 text-white/40'
      }`}
    >
      {label}
    </span>
  );
}

function ShortcutPill({
  label,
  strong = false,
}: {
  label: string;
  strong?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
        strong
          ? 'border-[#1a1a1c]/15 bg-[#1a1a1c] text-primary'
          : 'border-[#1a1a1c]/15 bg-white/80 text-[#1a1a1c]'
      }`}
    >
      {label}
    </span>
  );
}

function FlowConnector({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center xl:min-w-[62px]">
      <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span>{label}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function StageCard({
  icon,
  eyebrow,
  title,
  description,
  badges,
  active,
  emphasize = false,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  badges: string[];
  active: boolean;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`min-w-[220px] flex-1 rounded-[26px] border p-4 transition-all duration-300 md:p-5 ${
        emphasize
          ? 'border-primary/40 bg-[linear-gradient(180deg,rgba(255,208,97,0.16),rgba(255,255,255,0.03))] shadow-[0_18px_40px_-28px_rgba(255,208,97,0.95)]'
          : active
            ? 'border-primary/25 bg-white/5 shadow-[0_16px_36px_-28px_rgba(255,208,97,0.35)]'
            : 'border-white/10 bg-white/[0.03] text-white/65'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            active || emphasize
              ? 'bg-primary/15 text-primary'
              : 'bg-white/5 text-white/45'
          }`}
        >
          {icon}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            active || emphasize
              ? 'border-primary/25 bg-primary/10 text-primary/90'
              : 'border-white/10 bg-white/5 text-white/35'
          }`}
        >
          {eyebrow}
        </span>
      </div>

      <h4 className="mt-5 text-xl font-semibold text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              active || emphasize
                ? 'bg-white/10 text-white/80'
                : 'bg-white/5 text-white/35'
            }`}
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

function RetrievalCard({
  usesHybrid,
  rrf,
}: {
  usesHybrid: boolean;
  rrf: boolean;
}) {
  return (
    <div className="min-w-[320px] flex-[1.4] rounded-[30px] border border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_22px_44px_-34px_rgba(255,208,97,0.45)] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
            Retrieval Matrix
          </p>
          <h4 className="mt-2 text-xl font-semibold text-white">
            Ranked evidence assembly
          </h4>
        </div>

        <div className="flex flex-wrap gap-2">
          <ModeChip label="Dense A" active={true} />
          <ModeChip label="BM25 B" active={usesHybrid} />
          <ModeChip label="RRF" active={usesHybrid && rrf} />
        </div>
      </div>

      <div className={`mt-5 grid gap-3 ${usesHybrid ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        <SearchLane
          title="Dense Search"
          tone="gold"
          detail="Semantic retrieval builds ranked list A from vector similarity."
          badges={['ranked list A', 'always on']}
        />

        <SearchLane
          title="BM25 Search"
          tone={usesHybrid ? 'ink' : 'muted'}
          detail={
            usesHybrid
              ? 'Lexical retrieval builds ranked list B from exact term overlap.'
              : 'This lexical lane wakes up when hybrid retrieval is active.'
          }
          badges={usesHybrid ? ['ranked list B', 'hybrid lane'] : ['standby']}
          dim={!usesHybrid}
        />
      </div>

      <div
        className={`mt-4 rounded-[24px] border p-4 ${
          usesHybrid
            ? 'border-primary/20 bg-primary/10'
            : 'border-white/10 bg-white/5'
        }`}
      >
        {usesHybrid ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a1a1c] text-primary">
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <div className="text-lg font-semibold text-white">
                  {rrf ? 'RRF Fusion' : 'Fusion Layer'}
                </div>
                <div className="text-sm text-white/70">
                  Dense and BM25 rankings converge before generation.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d98c]">
              <span className="rounded-full border border-primary/20 bg-white/10 px-3 py-2">
                List A + List B
              </span>
              <span className="rounded-full border border-primary/20 bg-white/10 px-3 py-2">
                shared relevance
              </span>
              {rrf && (
                <span className="rounded-full border border-primary/30 bg-[#1a1a1c] px-3 py-2 text-primary">
                  1/(60+rA) + 1/(60+rB)
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm leading-6 text-white/70">
            With hybrid retrieval off, dense search alone supplies the ranked
            context that feeds generation.
          </div>
        )}
      </div>
    </div>
  );
}

function SearchLane({
  title,
  detail,
  badges,
  tone,
  dim = false,
}: {
  title: string;
  detail: string;
  badges: string[];
  tone: 'gold' | 'ink' | 'muted';
  dim?: boolean;
}) {
  const toneClasses =
    tone === 'gold'
      ? 'border-primary/30 bg-primary/10'
      : tone === 'ink'
        ? 'border-white/10 bg-white/5'
        : 'border-white/10 bg-white/[0.03]';

  return (
    <div
      className={`rounded-[22px] border p-4 transition-opacity ${
        toneClasses
      } ${dim ? 'opacity-45' : 'opacity-100'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            dim ? 'bg-white/5 text-white/45' : 'bg-[#1a1a1c]/70 text-primary'
          }`}
        >
          <Search className="h-4.5 w-4.5" />
        </span>
        <span className="rounded-full border border-white/10 bg-[#1a1a1c]/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {title.includes('BM25') ? 'lexical' : 'semantic'}
        </span>
      </div>

      <h5 className="mt-4 text-lg font-semibold text-white">{title}</h5>
      <p className="mt-2 text-sm leading-6 text-white/70">{detail}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full bg-[#1a1a1c]/55 px-3 py-1 text-xs font-medium text-white/70"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

function FutureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-primary/30 bg-[linear-gradient(180deg,rgba(255,208,97,0.07),rgba(255,255,255,0.02))] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5d98c]">
          Coming Soon
        </span>
      </div>

      <h4 className="mt-4 text-lg font-semibold text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
    </div>
  );
}
