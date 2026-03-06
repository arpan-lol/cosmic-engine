"use client"

export default function LandingHero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 80% 45% at 50% -5%, rgba(255,208,97,0.09) 0%, transparent 65%), oklch(0.1 0 0)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,208,97,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,208,97,0.025) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,208,97,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          maxWidth: "860px",
          padding: "0 24px",
        }}
      >
        <div
          className="landing-fade-1"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "100px",
            border: "1px solid rgba(255,208,97,0.22)",
            background: "rgba(255,208,97,0.06)",
            color: "#ffd061",
            fontSize: "12px",
            fontWeight: 500,
            marginBottom: "40px",
            letterSpacing: "0.04em",
          }}
        >
          <span
            className="animate-pulse-beat"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ffd061",
              boxShadow: "0 0 8px rgba(255,208,97,0.8)",
              flexShrink: 0,
            }}
          />
          RAG Experimentation Platform &nbsp;·&nbsp; v1.0
        </div>

        <h1
          className="landing-fade-2"
          style={{
            fontSize: "clamp(60px, 10vw, 108px)",
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            color: "oklch(0.98 0 0)",
            marginBottom: "4px",
          }}
        >
          RAG.
        </h1>
        <h1
          className="landing-fade-3"
          style={{
            fontSize: "clamp(60px, 10vw, 108px)",
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            color: "#ffd061",
            marginBottom: "36px",
          }}
        >
          Dissected.
        </h1>

        <p
          className="landing-fade-4"
          style={{
            fontSize: "clamp(16px, 2.2vw, 19px)",
            color: "oklch(0.62 0 0)",
            lineHeight: 1.75,
            maxWidth: "540px",
            margin: "0 auto 48px",
          }}
        >
          A modular experimentation engine for comparing retrieval strategies,
          chunking methods, and caching architectures — all in one environment.
        </p>

        <div
          className="landing-fade-5"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "56px",
          }}
        >
          <a
            href="/auth/login"
            className="cta-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 32px",
              borderRadius: "8px",
              background: "#ffd061",
              color: "oklch(0.1 0 0)",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            Open the Engine <span>→</span>
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
              padding: "13px 32px",
              borderRadius: "8px",
              border: "1px solid oklch(0.28 0 0)",
              background: "oklch(0.14 0 0)",
              color: "oklch(0.82 0 0)",
              fontWeight: 500,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View Source
          </a>
        </div>

        <div
          className="landing-fade-6"
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {[
            { label: "BM25 Indexing", color: "#ffd061" },
            { label: "Hybrid Search", color: "#ffe08a" },
            { label: "Reciprocal Rank Fusion", color: "#ffea9f" },
            { label: "Query Expansion", color: "#ffd980" },
            { label: "Query Caching", color: "#ffe5a0" },
            { label: "Semantic Caching", color: "#ffd061" },
          ].map(({ label, color }) => (
            <span
              key={label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                borderRadius: "100px",
                background: "oklch(0.15 0 0)",
                border: "1px solid oklch(0.22 0 0)",
                color: "oklch(0.6 0 0)",
                fontSize: "12px",
                fontWeight: 450,
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "36px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          color: "oklch(0.35 0 0)",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Scroll
        </span>
        <div
          className="animate-pulse-beat-slow"
          style={{
            width: "1px",
            height: "36px",
            background: "linear-gradient(to bottom, currentColor, transparent)",
          }}
        />
      </div>
    </section>
  )
}
