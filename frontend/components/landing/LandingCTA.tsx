"use client"

const stats = [
  { value: "6", label: "RAG Strategies" },
  { value: "3", label: "Search Modes" },
  { value: "2", label: "Cache Layers" },
  { value: "∞", label: "Combinations" },
]

export default function LandingCTA() {
  return (
    <section
      style={{
        padding: "120px 24px 100px",
        background:
          "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(255,208,97,0.05) 0%, transparent 70%), oklch(0.1 0 0)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "24px",
            marginBottom: "80px",
            borderRadius: "16px",
            border: "1px solid oklch(0.22 0 0)",
            background: "oklch(0.13 0 0)",
            padding: "40px",
          }}
        >
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(40px, 5vw, 60px)",
                  fontWeight: 800,
                  color: "#ffd061",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  marginBottom: "8px",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "oklch(0.55 0 0)",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            padding: "80px 40px",
            borderRadius: "20px",
            border: "1px solid rgba(255,208,97,0.15)",
            background:
              "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,208,97,0.04) 0%, transparent 70%), oklch(0.13 0 0)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,208,97,0.3), transparent)",
            }}
          />

          <p
            style={{
              color: "#ffd061",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            Start Experimenting
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 800,
              color: "oklch(0.98 0 0)",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              marginBottom: "20px",
            }}
          >
            Your RAG pipeline.
            <br />
            <span style={{ color: "oklch(0.55 0 0)" }}>Fully understood.</span>
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "oklch(0.6 0 0)",
              maxWidth: "480px",
              margin: "0 auto 48px",
              lineHeight: 1.7,
            }}
          >
            Upload documents, configure strategies, and compare results in
            real time. Built for engineers who want to understand every layer.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/auth/login"
              className="cta-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 36px",
                borderRadius: "10px",
                background: "#ffd061",
                color: "oklch(0.1 0 0)",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
            >
              Open Cosmic Engine →
            </a>
            <a
              href="https://github.com/arpan-lol/cosmic-engine"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 36px",
                borderRadius: "10px",
                border: "1px solid oklch(0.28 0 0)",
                background: "oklch(0.16 0 0)",
                color: "oklch(0.78 0 0)",
                fontWeight: 500,
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div
          style={{
            marginTop: "64px",
            paddingTop: "32px",
            borderTop: "1px solid oklch(0.18 0 0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              className="animate-pulse-beat"
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#ffd061",
                boxShadow: "0 0 8px rgba(255,208,97,0.6)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "oklch(0.7 0 0)",
              }}
            >
              Cosmic Engine
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "oklch(0.4 0 0)" }}>
            RAG Experimentation Platform
          </span>
        </div>
      </div>
    </section>
  )
}
