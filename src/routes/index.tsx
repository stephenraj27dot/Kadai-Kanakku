import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")(({
  component: Splash,
}));

function Splash() {
  const { isPinSetup, isUnlocked } = useSettings();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"logo" | "text" | "loading" | "done">("logo");

  useEffect(() => {
    // Phase sequence: logo → text → loading → navigate
    const t1 = setTimeout(() => setPhase("text"), 400);
    const t2 = setTimeout(() => setPhase("loading"), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      const hasLang = typeof window !== "undefined" && localStorage.getItem("bb_lang");
      if (!hasLang) {
        navigate({ to: "/language", replace: true });
      } else if (!session) {
        navigate({ to: "/auth", replace: true });
      } else if (isPinSetup && !isUnlocked) {
        navigate({ to: "/pin-lock", replace: true });
      } else {
        navigate({ to: "/dashboard", replace: true });
      }
    }, 2600);
    return () => clearTimeout(timer);
  }, [navigate, isPinSetup, isUnlocked, session, loading]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, oklch(0.60 0.18 148) 0%, oklch(0.52 0.19 148) 100%)" }}
    >
      {/* Background circles */}
      <div
        className="absolute rounded-full"
        style={{
          width: 320, height: 320,
          top: -80, right: -80,
          background: "oklch(1 0 0 / 0.08)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 260, height: 260,
          bottom: -60, left: -60,
          background: "oklch(1 0 0 / 0.06)",
        }}
      />

      {/* Center content */}
      <div className="relative flex flex-col items-center z-10">

        {/* Shop icon */}
        <div
          style={{
            width: 120, height: 120,
            borderRadius: 32,
            background: "oklch(1 0 0 / 0.18)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px oklch(1 0 0 / 0.2)",
            opacity: 1,
            transform: "scale(1)",
            animation: "splashIcon 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          {/* Shop/Store SVG icon */}
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="28" width="48" height="28" rx="4" fill="white" fillOpacity="0.9"/>
            <path d="M8 28L14 10h36l6 18H8Z" fill="white" fillOpacity="0.7"/>
            <rect x="24" y="38" width="16" height="18" rx="3" fill="oklch(0.52 0.19 148)"/>
            <rect x="10" y="36" width="12" height="10" rx="2" fill="oklch(0.52 0.19 148)" fillOpacity="0.7"/>
            <rect x="42" y="36" width="12" height="10" rx="2" fill="oklch(0.52 0.19 148)" fillOpacity="0.7"/>
            <path d="M14 10L10 28" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
            <path d="M50 10L54 28" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
            <path d="M32 10V28" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
          </svg>
        </div>

        {/* App name */}
        <div
          style={{
            marginTop: 28,
            opacity: phase === "logo" ? 0 : 1,
            transform: phase === "logo" ? "translateY(16px)" : "translateY(0)",
            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <h1
            style={{
              fontFamily: "'Noto Sans Tamil', 'Baloo 2', sans-serif",
              fontSize: 40,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 8px oklch(0 0 0 / 0.15)",
            }}
          >
            கடை கணக்கு
          </h1>
          <p
            style={{
              fontFamily: "'Noto Sans Tamil', sans-serif",
              fontSize: 14,
              color: "oklch(1 0 0 / 0.75)",
              textAlign: "center",
              marginTop: 8,
              fontWeight: 500,
            }}
          >
            உங்கள் கடையின் நம்பகமான கணக்கு புத்தகம்
          </p>
        </div>
      </div>

      {/* Loading dots at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: phase === "loading" ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8, height: 8,
                borderRadius: "50%",
                background: "white",
                opacity: 0.7,
                animation: `loadingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "'Noto Sans Tamil', sans-serif",
            fontSize: 13,
            color: "oklch(1 0 0 / 0.65)",
            letterSpacing: "0.05em",
          }}
        >
          Loading...
        </span>
      </div>

      <style>{`
        @keyframes splashIcon {
          from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes loadingDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
