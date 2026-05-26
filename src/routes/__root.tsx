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
import { StoreProvider, useStore } from "@/lib/store";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" },
      { name: "theme-color", content: "#16A34A" },
      { title: "Kadai Kanakku" },
      { name: "description", content: "Digital ledger for Tamil Nadu shop owners." },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Kadai Kanakku" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
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
      <body className="bg-background">
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
    if (!session && !isPublic) {
      router.navigate({ to: "/auth", replace: true });
    } else if (session && isPinSetup && !isUnlocked && !isPublic) {
      router.navigate({ to: "/pin-lock", replace: true });
    }
  }, [session, loading, isPinSetup, isUnlocked, router.state.location.pathname, router]);

  return <>{children}</>;
}

function GlobalSplash({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Minimum 2.2 seconds so user sees the full branding animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed && !loading) {
      setFadeOut(true);
      // 500ms smooth fade-out before removing splash from DOM
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [minTimeElapsed, loading]);

  return (
    <>
      {/* Dashboard pre-rendered silently in background so it's ready instantly */}
      <main
        className="w-full min-h-screen"
        style={{
          visibility: showSplash && !fadeOut ? 'hidden' : 'visible',
          position: showSplash && !fadeOut ? 'fixed' : 'static',
          inset: showSplash && !fadeOut ? '0' : 'auto',
          overflow: showSplash && !fadeOut ? 'hidden' : 'visible',
          opacity: fadeOut ? 1 : (showSplash ? 0 : 1),
          transition: fadeOut ? 'opacity 0.5s ease' : 'none',
        }}
      >
        {children}
      </main>

      {showSplash && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background: '#ffffff',
            opacity: fadeOut ? 0 : 1,
            transition: fadeOut ? 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            pointerEvents: fadeOut ? 'none' : 'auto',
          }}
        >
          <div className="absolute inset-0 w-full h-full flex items-center justify-center animate-splash-logo"
            style={{
              transform: fadeOut ? 'scale(1.15)' : 'scale(1)',
              transition: fadeOut ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            }}
          >
            <img
              src="/splash-logo.jpg"
              alt="Kadai Kanakku"
              className="w-[85vw] max-w-[320px] h-auto object-contain animate-splash-pulse mix-blend-multiply"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Loading indicator dots at bottom */}
          <div className="absolute bottom-16 left-0 right-0 flex gap-3 justify-center z-10">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="size-2.5 bg-primary/50 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <SettingsProvider>
            <I18nProvider>
              <GlobalSplash>
                <AppGuard>
                  <Outlet />
                </AppGuard>
              </GlobalSplash>
            </I18nProvider>
          </SettingsProvider>
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
