import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

if (typeof window !== "undefined") {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Force reload when a new update is available
      window.location.reload();
    },
  });
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground font-display">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground font-display">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground font-display">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#16A34A" },
      { title: "Kadai Kanakku — Shop Khata for Tamil Nadu" },
      { name: "description", content: "Simple digital baki notebook for local shop owners. Track customer balances in Tamil and English." },
    ],
    links: [
      { rel: "icon", href: "/logo.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Noto+Sans+Tamil:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppGuard({ children }: { children: React.ReactNode }) {
  const { isPinSetup, isUnlocked } = useSettings();
  const { session, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (loading) return;
    
    const path = router.state.location.pathname;
    const isPublic = path === "/" || path === "/language" || path === "/pin-setup" || path === "/pin-lock" || path === "/auth" || path.startsWith("/c/");
    
    // Auth Check
    if (!session && !isPublic) {
      router.navigate({ to: "/auth", replace: true });
      return;
    }

    // PIN Check
    if (session && isPinSetup && !isUnlocked && !isPublic) {
      router.navigate({ to: "/pin-lock", replace: true });
    }
  }, [session, loading, isPinSetup, isUnlocked, router.state.location.pathname, router]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary">...</div>;
  }

  return <>{children}</>;
}

function GlobalSplash({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [phase, setPhase] = useState<"logo" | "text" | "loading" | "done">("logo");

  useEffect(() => {
    // Faster animation sequence
    const t1 = setTimeout(() => setPhase("text"), 200);
    const t2 = setTimeout(() => setPhase("loading"), 400);
    const t3 = setTimeout(() => {
      setPhase("done");
      setTimeout(() => setShowSplash(false), 300); // quick fade out
    }, 1500); // 1.5s total splash time
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!showSplash) return <>{children}</>;

  return (
    <>
      {children}
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ 
          background: "linear-gradient(160deg, oklch(0.60 0.18 148) 0%, oklch(0.52 0.19 148) 100%)",
          opacity: phase === "done" ? 0 : 1,
          pointerEvents: phase === "done" ? "none" : "auto",
          transition: "opacity 0.3s ease"
        }}
      >
        <div className="absolute rounded-full" style={{ width: 320, height: 320, top: -80, right: -80, background: "oklch(1 0 0 / 0.08)" }} />
        <div className="absolute rounded-full" style={{ width: 260, height: 260, bottom: -60, left: -60, background: "oklch(1 0 0 / 0.06)" }} />

        <div className="relative flex flex-col items-center z-10">
          <div
            style={{
              width: 120, height: 120, borderRadius: 32,
              background: "oklch(1 0 0 / 0.18)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px oklch(1 0 0 / 0.2)",
              animation: "splashIcon 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              willChange: "transform, opacity"
            }}
          >
            {/* Using priority loading to ensure smooth animation */}
            <img fetchPriority="high" src="/logo.png" alt="Kadai Kanakku" style={{ width: 80, height: 80, borderRadius: 16 }} />
          </div>

          <div
            style={{
              marginTop: 28,
              opacity: phase === "logo" ? 0 : 1,
              transform: phase === "logo" ? "translateY(16px)" : "translateY(0)",
              transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "transform, opacity"
            }}
          >
            <h1 style={{ fontFamily: "'Noto Sans Tamil', 'Baloo 2', sans-serif", fontSize: 40, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2, letterSpacing: "-0.02em", textShadow: "0 2px 8px oklch(0 0 0 / 0.15)" }}>
              கடை கணக்கு
            </h1>
            <p style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: 14, color: "oklch(1 0 0 / 0.75)", textAlign: "center", marginTop: 8, fontWeight: 500 }}>
              உங்கள் கடையின் நம்பகமான கணக்கு புத்தகம்
            </p>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: phase === "loading" ? 1 : 0, transition: "opacity 0.3s ease", willChange: "opacity" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "white", opacity: 0.7, animation: `loadingDot 0.8s ease-in-out ${i * 0.15}s infinite`, willChange: "transform, opacity" }} />
            ))}
          </div>
        </div>

        <style>{`
          @keyframes splashIcon {
            from { opacity: 0; transform: scale(0.6) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes loadingDot {
            0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
            40%            { transform: scale(1.1); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <I18nProvider>
            <StoreProvider>
              <GlobalSplash>
                <AppGuard>
                  <Outlet />
                </AppGuard>
              </GlobalSplash>
            </StoreProvider>
          </I18nProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
