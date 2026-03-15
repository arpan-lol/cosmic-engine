"use client"

function GifPlaceholder({
  height = 180,
  label,
}: {
  height?: number
  label?: string
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        borderRadius: "8px",
        background: "oklch(0.12 0 0)",
        border: "1px solid oklch(0.22 0 0)",
        overflow: "hidden",
        flexShrink: 0,
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
          gap: "10px",
          color: "oklch(0.38 0 0)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
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
              borderTop: "7px solid transparent",
              borderBottom: "7px solid transparent",
              borderLeft: "12px solid oklch(0.38 0 0)",
              marginLeft: "3px",
            }}
          />
        </div>
        <span style={{ fontSize: "11px", letterSpacing: "0.08em" }}>
          {label ?? "Preview GIF"}
        </span>
      </div>
    </div>
  )
}

export default function LandingFeaturesBento() {
  return (
    <section
      style={{
        padding: "120px 24px",
        background: "oklch(0.1 0 0)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "48px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
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
              Design Variant 01 / Bento Grid
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
              Six Strategies.
              <br />
              <span style={{ color: "oklch(0.5 0 0)" }}>
                Infinite Combinations.
              </span>
            </h2>
          </div>
          <p
            style={{
              color: "oklch(0.55 0 0)",
              fontSize: "14px",
              maxWidth: "280px",
              lineHeight: 1.6,
              textAlign: "right",
            }}
          >
            Mix and match retrieval, ranking, and caching strategies to build
            the perfect pipeline.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "auto auto auto",
            gap: "16px",
          }}
        >
          <div
            className="landing-card-hover"
            style={{
              gridColumn: "span 2",
              gridRow: "span 2",
              padding: "28px",
              borderRadius: "14px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.14 0 0)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <GifPlaceholder height={220} label="BM25 in action" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: "100px",
                    background: "rgba(255,208,97,0.1)",
                    border: "1px solid rgba(255,208,97,0.2)",
                    color: "#ffd061",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Retrieval
                </span>
              </div>
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "oklch(0.96 0 0)",
                  marginBottom: "8px",
                  letterSpacing: "-0.01em",
                }}
              >
                BM25 Search
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "oklch(0.58 0 0)",
                  lineHeight: 1.65,
                }}
              >
                Keyword-frequency scoring that retrieves documents beyond
                semantic similarity
              </p>
            </div>
          </div>

          <div
            className="landing-card-hover"
            style={{
              gridColumn: "span 1",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.14 0 0)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <GifPlaceholder height={100} label="Hybrid retrieval" />
            <div>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: "100px",
                  background: "rgba(255,224,138,0.1)",
                  border: "1px solid rgba(255,224,138,0.2)",
                  color: "#ffe08a",
                  fontSize: "10px",
                  fontWeight: 600,
                  display: "inline-block",
                  marginBottom: "8px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Retrieval
              </span>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "oklch(0.96 0 0)",
                  marginBottom: "6px",
                }}
              >
                Hybrid Search
              </h3>
              <p style={{ fontSize: "12px", color: "oklch(0.55 0 0)", lineHeight: 1.6 }}>
                Combines dense vectors and sparse BM25 into one retrieval pass
              </p>
            </div>
          </div>

          <div
            className="landing-card-hover"
            style={{
              gridColumn: "span 1",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.14 0 0)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <GifPlaceholder height={100} label="RRF fusion" />
            <div>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: "100px",
                  background: "rgba(255,234,159,0.1)",
                  border: "1px solid rgba(255,234,159,0.2)",
                  color: "#ffea9f",
                  fontSize: "10px",
                  fontWeight: 600,
                  display: "inline-block",
                  marginBottom: "8px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Ranking
              </span>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "oklch(0.96 0 0)",
                  marginBottom: "6px",
                }}
              >
                Reciprocal Rank Fusion
              </h3>
              <p style={{ fontSize: "12px", color: "oklch(0.55 0 0)", lineHeight: 1.6 }}>
                Merges multiple ranked lists into one authoritative ranking
              </p>
            </div>
          </div>

          <div
            className="landing-card-hover"
            style={{
              gridColumn: "span 2",
              padding: "24px 28px",
              borderRadius: "14px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.14 0 0)",
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <GifPlaceholder height={130} label="Query expansion" />
            <div>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: "100px",
                  background: "rgba(255,217,128,0.1)",
                  border: "1px solid rgba(255,217,128,0.2)",
                  color: "#ffd980",
                  fontSize: "10px",
                  fontWeight: 600,
                  display: "inline-block",
                  marginBottom: "10px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Query
              </span>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "oklch(0.96 0 0)",
                  marginBottom: "8px",
                }}
              >
                Query Expansion
              </h3>
              <p style={{ fontSize: "13px", color: "oklch(0.58 0 0)", lineHeight: 1.65 }}>
                Rewrites vague queries using an LLM to maximize retrieval recall
                across your corpus.
              </p>
            </div>
          </div>

          <div
            className="landing-card-hover"
            style={{
              gridColumn: "span 1",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.14 0 0)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <GifPlaceholder height={90} label="Cache hits" />
            <div>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: "100px",
                  background: "rgba(255,229,160,0.1)",
                  border: "1px solid rgba(255,229,160,0.2)",
                  color: "#ffe5a0",
                  fontSize: "10px",
                  fontWeight: 600,
                  display: "inline-block",
                  marginBottom: "8px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Performance
              </span>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "oklch(0.96 0 0)",
                  marginBottom: "6px",
                }}
              >
                Query Cache
              </h3>
              <p style={{ fontSize: "12px", color: "oklch(0.55 0 0)", lineHeight: 1.6 }}>
                Skip redundant LLM calls with exact-match response caching
              </p>
            </div>
          </div>

          <div
            className="landing-card-hover"
            style={{
              gridColumn: "span 3",
              padding: "24px 28px",
              borderRadius: "14px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.14 0 0)",
              display: "grid",
              gridTemplateColumns: "1fr 280px",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: "100px",
                  background: "rgba(255,208,97,0.1)",
                  border: "1px solid rgba(255,208,97,0.2)",
                  color: "#ffd061",
                  fontSize: "10px",
                  fontWeight: 600,
                  display: "inline-block",
                  marginBottom: "10px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Performance
              </span>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "oklch(0.96 0 0)",
                  marginBottom: "8px",
                  letterSpacing: "-0.01em",
                }}
              >
                Semantic Cache
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "oklch(0.58 0 0)",
                  lineHeight: 1.65,
                  maxWidth: "480px",
                }}
              >
                Similarity-based cache that serves results for near-duplicate
                queries — even when the exact text differs. Vector distance
                determines cache hits.
              </p>
            </div>
            <GifPlaceholder height={120} label="Semantic similarity" />
          </div>
        </div>
      </div>
    </section>
  )
}
