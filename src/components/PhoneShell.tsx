import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Settings as SettingsIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function PhoneShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    // On mobile: full screen. On desktop: centered phone-like frame.
    <div className="min-h-screen bg-background flex items-start justify-center sm:bg-[oklch(0.22_0.02_256)] sm:items-center sm:p-6">
      <div
        className="relative w-full sm:w-[420px] bg-background flex flex-col
          sm:rounded-[2.5rem] sm:border sm:border-black/10 sm:shadow-2xl sm:overflow-hidden"
        style={{ minHeight: "100svh", maxHeight: "100svh" }}
      >
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: hideNav ? "0px" : "80px" }}>
          {children}
        </div>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}

function BottomNav() {
  const { t, lang } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/dashboard", icon: Home, label: t("dashboard") },
    { to: "/customers", icon: Users, label: t("customers") },
    { to: "/settings", icon: SettingsIcon, label: t("settings") },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:absolute bg-card/95 backdrop-blur border-t border-border px-2 pt-2 pb-safe z-40"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center justify-around max-w-[420px] mx-auto">
        {items.map(({ to, icon: Icon, label }) => {
          const active = path === to || path.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className={`relative flex items-center justify-center ${active ? "scale-110" : ""} transition-transform`}>
                <Icon className={`size-6 ${active ? "stroke-[2.4]" : ""}`} />
                {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />}
              </div>
              <span className={`text-[11px] ${lang === "ta" ? "font-tamil" : ""} ${active ? "font-bold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar({ title, back, right }: { title: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 flex items-center gap-3"
      style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))", paddingBottom: "0.75rem" }}
    >
      {back && (
        <Link to={back} className="size-10 rounded-full flex items-center justify-center hover:bg-muted -ml-2 active:scale-95 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
      <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>
      {right}
    </div>
  );
}
