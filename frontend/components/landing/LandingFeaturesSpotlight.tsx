"use client"

import { useState } from "react"

const features = [
  {
    id: "bm25",
    title: "BM25 Search",
    stage: "Retrieval",
    stageColor: "#ffd061",
    description:
      "Scores documents using term-frequency and inverse-document-frequency signals. Works independently of embeddings, catching keyword-critical results that vector search misses.",
    bullets: [
      "Pre-built index for low-latency lookup",
      "Complements semantic search for hard queries",
      "Configurable k1 and b parameters",
    ],
    gifCaption: "BM25 scoring in real time",
  },
  {
    id: "hybrid",
    title: "Hybrid Search",
    stage: "Retrieval",
    stageColor: "#ffd061",
    description:
      "Runs both dense vector retrieval and sparse BM25 in a single pass, then merges their result sets. You get the semantic understanding of embeddings and the precision of keyword matching simultaneously.",
    bullets: [
      "Single-pass dual-strategy retrieval",
      "Configurable fusion weighting",
      "Best-of-both for production RAG",
    ],
    gifCaption: "Vector + BM25 fusion",
  },
  {
    id: "rrf",
    title: "Reciprocal Rank Fusion",
    stage: "Ranking",
    stageColor: "#ffea9f",
    description:
      "Merges multiple ranked result lists into one authoritative ranking by assigning scores based on reciprocal rank position. Robust to individual result list noise.",
    bullets: [
      "Works with any two ranked lists",
      "Mathematically optimal rank merging",
      "No training data required",
    ],
    gifCaption: "RRF rank merging",
  },
  {
    id: "qe",
    title: "Query Expansion",
    stage: "Query",
    stageColor: "#ffd980",
    description:
      "Uses an LLM to rewrite short or ambiguous queries into richer, more descriptive forms before retrieval. Dramatically improves recall for vague or underspecified user questions.",
    bullets: [
      "LLM-powered query rewriting",
      "Handles short and vague inputs",
      "Pluggable, opt-in strategy",
    ],
    gifCaption: "Query rewriting live",
  },
  {
    id: "cache",
    title: "Query Cache",
    stage: "Performance",
    stageColor: "#ffe5a0",
    description:
      "Exact-match caching layer that bypasses the entire retrieval and generation pipeline for previously seen queries. Eliminates redundant LLM spend and slashes latency to near-zero for repeated requests.",
    bullets: [
      "Zero-latency cache hits",
      "Persisted across sessions",
      "Deterministic cache key generation",
    ],
    gifCaption: "Cache hit demonstration",
  },
  {
    id: "semantic-cache",
    title: "Semantic Cache",
    stage: "Performance",
    stageColor: "#ffe5a0",
    description:
      "Vector-similarity cache that detects near-duplicate queries using embedding distance. Returns cached answers even when query phrasing changes — as long as semantic intent matches.",
    bullets: [
      "Similarity threshold tuning",
      "Handles paraphrased queries",
      "Reduces redundant embedding calls",
    ],
    gifCaption: "Semantic similarity matching",
  },
]

function GifPlaceholder({ caption }: { caption: string }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: "10px",
        background: "oklch(0.12 0 0)",
        border: "1px solid oklch(0.22 0 0)",
        overflow: "hidden",
      }}
    >
      <div className="gif-shimmer" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          color: "oklch(0.38 0 0)",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            border: "2px solid oklch(0.32 0 0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "9px solid transparent",
              borderBottom: "9px solid transparent",
              borderLeft: "15px solid oklch(0.38 0 0)",
              marginLeft: "4px",
            }}
          />
        </div>
        <span style={{ fontSize: "12px", letterSpacing: "0.06em" }}>
          {caption}
        </span>
      </div>
    </div>
  )
}

export default function LandingFeaturesSpotlight() {
  const [selected, setSelected] = useState(0)
  const active = features[selected]

  return (
    <section
      style={{
        padding: "120px 24px",
        background: "oklch(0.1 0 0)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "56px" }}>
          <p
            style={{
              color: "#ffd061",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Design Variant 03 / Strategy Spotlight
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              color: "oklch(0.98 0 0)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Deep Dive Each Strategy.
          </h2>
          <p
            style={{
              color: "oklch(0.55 0 0)",
              fontSize: "14px",
              marginTop: "10px",
              lineHeight: 1.6,
            }}
          >
            Select a strategy to explore how it fits into the pipeline.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.13 0 0)",
              overflow: "hidden",
            }}
          >
            {features.map((f, i) => (
              <button
                key={f.id}
                className="spotlight-item"
                onClick={() => setSelected(i)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  textAlign: "left",
                  background:
                    i === selected ? "rgba(255,208,97,0.08)" : "transparent",
                  borderLeft: `3px solid ${i === selected ? "#ffd061" : "transparent"}`,
                  borderTop: "none",
                  borderRight: "none",
                  borderBottom:
                    i < features.length - 1
                      ? "1px solid oklch(0.18 0 0)"
                      : "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color:
                      i === selected ? "oklch(0.96 0 0)" : "oklch(0.65 0 0)",
                    transition: "color 0.15s",
                  }}
                >
                  {f.title}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: i === selected ? f.stageColor : "oklch(0.42 0 0)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    transition: "color 0.15s",
                  }}
                >
                  {f.stage}
                </span>
              </button>
            ))}
          </div>

          <div
            key={active.id}
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(255,208,97,0.15)",
              background: "oklch(0.14 0 0)",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              animation: "landingFadeUp 0.35s ease-out both",
            }}
          >
            <GifPlaceholder caption={active.gifCaption} />

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <h3
                  style={{
                    fontSize: "26px",
                    fontWeight: 700,
                    color: "oklch(0.98 0 0)",
                    letterSpacing: "-0.015em",
                    margin: 0,
                  }}
                >
                  {active.title}
                </h3>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "100px",
                    background: "rgba(255,208,97,0.1)",
                    border: "1px solid rgba(255,208,97,0.2)",
                    color: active.stageColor,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {active.stage}
                </span>
              </div>

              <p
                style={{
                  fontSize: "15px",
                  color: "oklch(0.65 0 0)",
                  lineHeight: 1.75,
                  marginBottom: "24px",
                }}
              >
                {active.description}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {active.bullets.map((b) => (
                  <div
                    key={b}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#ffd061",
                        flexShrink: 0,
                        marginTop: "7px",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "oklch(0.72 0 0)",
                        lineHeight: 1.6,
                      }}
                    >
                      {b}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                paddingTop: "20px",
                borderTop: "1px solid oklch(0.2 0 0)",
                display: "flex",
                gap: "8px",
              }}
            >
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  style={{
                    width: i === selected ? "24px" : "8px",
                    height: "4px",
                    borderRadius: "2px",
                    background:
                      i === selected ? "#ffd061" : "oklch(0.28 0 0)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.2s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
