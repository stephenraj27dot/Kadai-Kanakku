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
      { name: "description", content: "Simple digital baki notebook for local shop owners." },
    ],
    links: [
      { rel: "icon", href: "/logo.png", type: "image/png" },
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
    
    if (!session && !isPublic) {
      router.navigate({ to: "/auth", replace: true });
    } else if (session && isPinSetup && !isUnlocked && !isPublic) {
      router.navigate({ to: "/pin-lock", replace: true });
    }
  }, [session, loading, isPinSetup, isUnlocked, router.state.location.pathname, router]);

  return <>{children}</>;
}

function GlobalSplash({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [phase, setPhase] = useState<"logo" | "text" | "loading" | "done">("logo");

  useEffect(() => {
    if (sessionStorage.getItem('splash_shown') === 'true') {
      setShowSplash(false);
      return;
    }
    
    sessionStorage.setItem('splash_shown', 'true');
    const t1 = setTimeout(() => setPhase("text"), 300);
    const t2 = setTimeout(() => setPhase("loading"), 600);
    const t3 = setTimeout(() => {
      setPhase("done");
      setTimeout(() => setShowSplash(false), 500);
    }, 2000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <>
      {children}
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary text-white transition-opacity duration-500"
             style={{ opacity: phase === 'done' ? 0 : 1, pointerEvents: phase === 'done' ? 'none' : 'auto' }}>
          <div className="flex flex-col items-center animate-in zoom-in duration-500 text-center px-6">
            <div className="size-24 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-6 border border-white/30">
               <img src="/logo.png" alt="Logo" className="size-16 rounded-2xl" />
            </div>
            <h1 className="text-4xl font-black font-display text-white tracking-tight">கடை கணக்கு</h1>
            <p className="mt-3 text-white/90 font-bold text-base font-tamil">
              உங்கள் கடையின் நம்பிக்கையான கணக்குத் தோழன்
            </p>
          </div>
          <div className="absolute bottom-12 flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="size-2 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
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
