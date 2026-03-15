"use client"

import LandingHero from "./LandingHero"
import LandingPipelineComparison from "./LandingPipelineComparison"
import LandingArchitecture from "./LandingArchitecture"
import LandingFeaturesBento from "./LandingFeaturesBento"
import LandingFeaturesPipeline from "./LandingFeaturesPipeline"
import LandingFeaturesSpotlight from "./LandingFeaturesSpotlight"
import LandingCTA from "./LandingCTA"

export default function LandingPage() {
  return (
    <div
      className="dark"
      style={{
        minHeight: "100vh",
        background: "oklch(0.1 0 0)",
        color: "oklch(0.98 0 0)",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <LandingHero />
      <LandingPipelineComparison />
      <LandingArchitecture />

      <div
        style={{
          padding: "16px 24px 0",
          background: "oklch(0.1 0 0)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, oklch(0.22 0 0), transparent)",
            }}
          />
        </div>
      </div>

      <LandingFeaturesBento />

      <div
        style={{
          padding: "0 24px",
          background: "oklch(0.1 0 0)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, oklch(0.22 0 0), transparent)",
            }}
          />
        </div>
      </div>

      <LandingFeaturesPipeline />

      <div
        style={{
          padding: "0 24px",
          background: "oklch(0.1 0 0)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, oklch(0.22 0 0), transparent)",
            }}
          />
        </div>
      </div>

      <LandingFeaturesSpotlight />

      <div
        style={{
          padding: "0 24px",
          background: "oklch(0.1 0 0)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, oklch(0.22 0 0), transparent)",
            }}
          />
        </div>
      </div>

      <LandingCTA />
    </div>
  )
}
