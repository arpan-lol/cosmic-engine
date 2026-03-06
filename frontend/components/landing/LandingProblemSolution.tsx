"use client"

const vanillaSteps = [
  { label: "User Query", note: "No preprocessing" },
  { label: "Vector Search", note: "Single-strategy only" },
  { label: "Top-K Chunks", note: "No reranking" },
  { label: "LLM Response", note: "No caching" },
]

const cosmicSteps = [
  { label: "User Query", tag: "Query Expansion" },
  { label: "Hybrid Retrieval", tag: "BM25 + Dense" },
  { label: "Ranked Chunks", tag: "RRF Fusion" },
  { label: "LLM Response", tag: "Semantic Cache" },
]

export default function LandingProblemSolution() {
  return (
    <section
      style={{
        padding: "120px 24px",
        background: "oklch(0.1 0 0)",
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
            The Problem
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
            Most RAG pipelines are a black box.
          </h2>
          <p
            style={{
              color: "oklch(0.6 0 0)",
              fontSize: "17px",
              maxWidth: "480px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            You can't tune what you can't see. Cosmic Engine opens it up.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              borderRadius: "16px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.13 0 0)",
              padding: "36px",
              opacity: 0.7,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "32px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "oklch(0.45 0 0)",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "oklch(0.5 0 0)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Standard RAG
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0",
              }}
            >
              {vanillaSteps.map((step, i) => (
                <div key={step.label}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      borderRadius: "8px",
                      background: "oklch(0.17 0 0)",
                      border: "1px solid oklch(0.22 0 0)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "oklch(0.55 0 0)",
                      }}
                    >
                      {step.label}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "oklch(0.42 0 0)",
                        fontStyle: "italic",
                      }}
                    >
                      {step.note}
                    </span>
                  </div>
                  {i < vanillaSteps.length - 1 && (
                    <div
                      style={{
                        width: "1px",
                        height: "20px",
                        background: "oklch(0.25 0 0)",
                        margin: "0 auto",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "28px",
                padding: "14px 18px",
                borderRadius: "8px",
                background: "rgba(255,80,80,0.06)",
                border: "1px solid rgba(255,80,80,0.15)",
                color: "oklch(0.55 0 0)",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              ✗&nbsp; No observability, no strategy comparison, no control.
            </div>
          </div>

          <div
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(255,208,97,0.2)",
              background: "oklch(0.13 0 0)",
              padding: "36px",
              boxShadow: "0 0 40px rgba(255,208,97,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "32px",
              }}
            >
              <span
                className="animate-pulse-beat"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ffd061",
                  boxShadow: "0 0 8px rgba(255,208,97,0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#ffd061",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Cosmic Engine
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {cosmicSteps.map((step, i) => (
                <div key={step.label}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      borderRadius: "8px",
                      background: "oklch(0.17 0 0)",
                      border: "1px solid rgba(255,208,97,0.12)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "oklch(0.9 0 0)",
                      }}
                    >
                      {step.label}
                    </span>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "100px",
                        background: "rgba(255,208,97,0.1)",
                        border: "1px solid rgba(255,208,97,0.2)",
                        color: "#ffd061",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {step.tag}
                    </span>
                  </div>
                  {i < cosmicSteps.length - 1 && (
                    <div
                      style={{
                        width: "1px",
                        height: "20px",
                        background: "rgba(255,208,97,0.2)",
                        margin: "0 auto",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "28px",
                padding: "14px 18px",
                borderRadius: "8px",
                background: "rgba(255,208,97,0.05)",
                border: "1px solid rgba(255,208,97,0.15)",
                color: "oklch(0.75 0 0)",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              ✓&nbsp; Plug in strategies. Compare results. Understand your
              pipeline.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
