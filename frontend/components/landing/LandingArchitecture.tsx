"use client"

import { useState } from "react"

const stages = [
  {
    id: "input",
    label: "User Query",
    icon: "◎",
    strategies: [],
    description: "Raw query input",
  },
  {
    id: "processing",
    label: "Query Processing",
    icon: "⚙",
    strategies: ["query-expansion"],
    description: "Normalise and expand",
  },
  {
    id: "retrieval",
    label: "Retrieval",
    icon: "⊞",
    strategies: ["hybrid-search", "bm25"],
    description: "Fetch relevant chunks",
  },
  {
    id: "ranking",
    label: "Re-ranking",
    icon: "◈",
    strategies: ["rrf"],
    description: "Merge and sort results",
  },
  {
    id: "assembly",
    label: "Context Assembly",
    icon: "⛭",
    strategies: [],
    description: "Build prompt context",
  },
  {
    id: "cache",
    label: "Cache Layer",
    icon: "⟲",
    strategies: ["caching", "semantic-caching"],
    description: "Short-circuit with cache",
  },
  {
    id: "output",
    label: "LLM Response",
    icon: "◆",
    strategies: [],
    description: "Generate final answer",
  },
]

const strategyMeta: Record<
  string,
  { label: string; shortDesc: string; color: string }
> = {
  "query-expansion": {
    label: "Query Expansion",
    shortDesc: "Rewrites vague queries via LLM for better coverage",
    color: "#ffe08a",
  },
  "hybrid-search": {
    label: "Hybrid Search",
    shortDesc: "Fuses dense vectors with sparse BM25 signals",
    color: "#ffd061",
  },
  bm25: {
    label: "BM25 Search",
    shortDesc: "Keyword-frequency scoring beyond semantics",
    color: "#ffd980",
  },
  rrf: {
    label: "Reciprocal Rank Fusion",
    shortDesc: "Merges ranked lists into a single authoritative order",
    color: "#ffea9f",
  },
  caching: {
    label: "Query Cache",
    shortDesc: "Skip LLM on exact-match repeated queries",
    color: "#ffe5a0",
  },
  "semantic-caching": {
    label: "Semantic Cache",
    shortDesc: "Serve similar-query results from vector cache",
    color: "#ffd061",
  },
}

function PipelineConnector({ active }: { active: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: "2px",
        height: "52px",
        margin: "0 auto",
        background: active
          ? "rgba(255,208,97,0.5)"
          : "oklch(0.25 0 0)",
        transition: "background 0.25s",
        overflow: "visible",
      }}
    >
      <div className="pipeline-dot" />
      <div className="pipeline-dot pipeline-dot-2" />
      <div className="pipeline-dot pipeline-dot-3" />
    </div>
  )
}

export default function LandingArchitecture() {
  const [hovered, setHovered] = useState<string | null>(null)

  function stageIsActive(stage: (typeof stages)[0]) {
    if (!hovered) return false
    return stage.strategies.includes(hovered)
  }

  return (
    <section
      style={{
        padding: "120px 24px",
        background:
          "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,208,97,0.03) 0%, transparent 70%), oklch(0.1 0 0)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <p
            style={{
              color: "#ffd061",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            System Architecture
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 700,
              color: "oklch(0.98 0 0)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: "16px",
            }}
          >
            The Pipeline, Orchestrated.
          </h2>
          <p
            style={{
              color: "oklch(0.55 0 0)",
              fontSize: "15px",
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            Hover a strategy to see where it activates in the pipeline.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "0 48px",
            alignItems: "start",
            maxWidth: "780px",
            margin: "0 auto",
          }}
        >
          <div />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {stages.map((stage, i) => (
              <div
                key={stage.id}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
              >
                <div
                  className={`pipeline-stage${stageIsActive(stage) ? " active" : ""}`}
                  style={{
                    width: "220px",
                    padding: "14px 20px",
                    borderRadius: "10px",
                    border: "1px solid oklch(0.25 0 0)",
                    background: stageIsActive(stage)
                      ? "rgba(255,208,97,0.05)"
                      : "oklch(0.15 0 0)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      color: stageIsActive(stage)
                        ? "#ffd061"
                        : "oklch(0.45 0 0)",
                      transition: "color 0.2s",
                      lineHeight: 1,
                    }}
                  >
                    {stage.icon}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: stageIsActive(stage)
                          ? "oklch(0.98 0 0)"
                          : "oklch(0.78 0 0)",
                        transition: "color 0.2s",
                      }}
                    >
                      {stage.label}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "oklch(0.48 0 0)",
                        marginTop: "2px",
                      }}
                    >
                      {stage.description}
                    </div>
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <PipelineConnector active={stageIsActive(stage)} />
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0",
              paddingTop: "0",
            }}
          >
            {stages.map((stage, i) => {
              const connectorHeight = i < stages.length - 1 ? 52 : 0
              const stageBoxHeight = 62
              const totalHeight = stageBoxHeight + connectorHeight
              return (
                <div
                  key={stage.id}
                  style={{
                    height: `${totalHeight}px`,
                    display: "flex",
                    alignItems: "flex-start",
                    paddingTop: "10px",
                    gap: "0",
                    position: "relative",
                  }}
                >
                  {stage.strategies.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: "-48px",
                          top: "22px",
                          width: "48px",
                          height: "1px",
                          background: hovered && stage.strategies.includes(hovered)
                            ? "rgba(255,208,97,0.5)"
                            : "oklch(0.28 0 0)",
                          borderTop: "1px dashed",
                          transition: "border-color 0.2s",
                          borderColor: hovered && stage.strategies.includes(hovered)
                            ? "rgba(255,208,97,0.5)"
                            : "oklch(0.28 0 0)",
                        }}
                      />
                      {stage.strategies.map((sId) => {
                        const meta = strategyMeta[sId]
                        return (
                          <div
                            key={sId}
                            className="strategy-pill"
                            onMouseEnter={() => setHovered(sId)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: `1px solid ${
                                hovered === sId
                                  ? "rgba(255,208,97,0.4)"
                                  : "oklch(0.25 0 0)"
                              }`,
                              background:
                                hovered === sId
                                  ? "rgba(255,208,97,0.1)"
                                  : "oklch(0.15 0 0)",
                              transition: "all 0.18s",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color:
                                  hovered === sId
                                    ? meta.color
                                    : "oklch(0.72 0 0)",
                                transition: "color 0.18s",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {meta.label}
                            </div>
                            {hovered === sId && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "oklch(0.58 0 0)",
                                  marginTop: "3px",
                                  maxWidth: "200px",
                                  lineHeight: 1.4,
                                }}
                              >
                                {meta.shortDesc}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
