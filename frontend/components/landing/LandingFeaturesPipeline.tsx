"use client"

function GifPlaceholder({ height = 120 }: { height?: number }) {
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
          gap: "8px",
          color: "oklch(0.38 0 0)",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "1.5px solid oklch(0.32 0 0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderLeft: "9px solid oklch(0.38 0 0)",
              marginLeft: "2px",
            }}
          />
        </div>
        <span style={{ fontSize: "10px", letterSpacing: "0.06em" }}>GIF</span>
      </div>
    </div>
  )
}

const pipelineGroups = [
  {
    stage: "Query",
    stageColor: "#ffd980",
    strategies: [
      {
        id: "qe",
        step: "01",
        title: "Query Expansion",
        desc: "Rewrites vague queries for better recall",
      },
    ],
  },
  {
    stage: "Retrieval",
    stageColor: "#ffd061",
    strategies: [
      {
        id: "hybrid",
        step: "02",
        title: "Hybrid Search",
        desc: "Fuses dense + sparse retrieval",
      },
      {
        id: "bm25",
        step: "03",
        title: "BM25 Search",
        desc: "Keyword-frequency document scoring",
      },
    ],
  },
  {
    stage: "Ranking",
    stageColor: "#ffea9f",
    strategies: [
      {
        id: "rrf",
        step: "04",
        title: "RRF",
        desc: "Merges ranked lists into one order",
      },
    ],
  },
  {
    stage: "Performance",
    stageColor: "#ffe5a0",
    strategies: [
      {
        id: "cache",
        step: "05",
        title: "Query Cache",
        desc: "Exact-match response caching",
      },
      {
        id: "semantic-cache",
        step: "06",
        title: "Semantic Cache",
        desc: "Vector-similarity cache hits",
      },
    ],
  },
]

function ArrowConnector() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        color: "oklch(0.35 0 0)",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "1px",
          background: "oklch(0.28 0 0)",
          borderTop: "1px dashed oklch(0.3 0 0)",
        }}
      />
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: "7px solid oklch(0.35 0 0)",
        }}
      />
    </div>
  )
}

export default function LandingFeaturesPipeline() {
  return (
    <section
      style={{
        padding: "120px 0",
        background:
          "radial-gradient(ellipse 100% 50% at 50% 100%, rgba(255,208,97,0.02) 0%, transparent 70%), oklch(0.1 0 0)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
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
            Design Variant 02 / Strategy Pipeline
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
            Execution Order, Visualised.
          </h2>
          <p
            style={{
              color: "oklch(0.55 0 0)",
              fontSize: "14px",
              marginTop: "10px",
              lineHeight: 1.6,
            }}
          >
            Each strategy activates at a specific stage of the RAG pipeline.
          </p>
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          paddingBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0",
            padding: "0 24px",
            minWidth: "max-content",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 20px",
              borderRadius: "12px",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.13 0 0)",
              minWidth: "100px",
              alignSelf: "center",
            }}
          >
            <span
              style={{ fontSize: "22px", color: "oklch(0.45 0 0)", lineHeight: 1 }}
            >
              ◎
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "oklch(0.5 0 0)",
                marginTop: "8px",
                textAlign: "center",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              Query In
            </span>
          </div>

          <ArrowConnector />

          {pipelineGroups.map((group, gi) => (
            <div
              key={group.stage}
              style={{ display: "flex", alignItems: "center" }}
            >
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: group.stageColor,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                    textAlign: "center",
                  }}
                >
                  {group.stage}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {group.strategies.map((s) => (
                    <div
                      key={s.id}
                      className="landing-card-hover"
                      style={{
                        width: "200px",
                        padding: "18px",
                        borderRadius: "12px",
                        border: "1px solid oklch(0.22 0 0)",
                        background: "oklch(0.15 0 0)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <GifPlaceholder height={110} />
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "28px",
                              fontWeight: 800,
                              color: "oklch(0.22 0 0)",
                              lineHeight: 1,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {s.step}
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "oklch(0.9 0 0)",
                              lineHeight: 1.2,
                            }}
                          >
                            {s.title}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "oklch(0.55 0 0)",
                            lineHeight: 1.55,
                            margin: 0,
                          }}
                        >
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {gi < pipelineGroups.length - 1 && (
                <div style={{ marginTop: "28px" }}>
                  <ArrowConnector />
                </div>
              )}
            </div>
          ))}

          <ArrowConnector />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 20px",
              borderRadius: "12px",
              border: "1px solid rgba(255,208,97,0.2)",
              background: "rgba(255,208,97,0.05)",
              minWidth: "100px",
              alignSelf: "center",
            }}
          >
            <span
              style={{ fontSize: "22px", color: "#ffd061", lineHeight: 1 }}
            >
              ◆
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#ffd061",
                marginTop: "8px",
                textAlign: "center",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              Response
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1100px",
          margin: "40px auto 0",
          padding: "0 24px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {["Query", "Retrieval", "Ranking", "Performance"].map((stage, i) => {
          const colors = ["#ffd980", "#ffd061", "#ffea9f", "#ffe5a0"]
          return (
            <div
              key={stage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "oklch(0.55 0 0)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  background: colors[i],
                  flexShrink: 0,
                }}
              />
              {stage} stage
            </div>
          )
        })}
      </div>
    </section>
  )
}
