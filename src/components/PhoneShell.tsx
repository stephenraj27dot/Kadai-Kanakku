import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Settings as SettingsIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function PhoneShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-6" style={{ backgroundColor: "oklch(0.22 0.02 256)" }}>
      <div className="relative w-full sm:w-[420px] sm:rounded-[2.5rem] sm:border sm:border-black/10 sm:shadow-2xl overflow-hidden bg-background flex flex-col" style={{ minHeight: "100vh", maxHeight: "100vh" }}>
        <div className="flex-1 overflow-y-auto pb-24">{children}</div>
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
    <nav className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-2 pt-2 pb-3 z-40">
      <div className="flex items-center justify-around">
        {items.map(({ to, icon: Icon, label }) => {
          const active = path === to || path.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`size-6 ${active ? "stroke-[2.4]" : ""}`} />
              <span className={`text-[11px] ${lang === "ta" ? "font-tamil" : ""} ${active ? "font-semibold" : "font-medium"}`}>
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
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
      {back && (
        <Link to={back} className="size-10 rounded-full flex items-center justify-center hover:bg-muted -ml-2">
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
