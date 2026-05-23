import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const { t, lang } = useI18n();
  const { isPinSetup, isUnlocked } = useSettings();
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Wait until auth state is known

    const hasLang = typeof window !== "undefined" && localStorage.getItem("bb_lang");
    
    const timer = setTimeout(() => {
      if (!hasLang) {
        navigate({ to: "/language", replace: true });
      } else if (!session) {
        navigate({ to: "/auth", replace: true });
      } else if (isPinSetup && !isUnlocked) {
        navigate({ to: "/pin-lock", replace: true });
      } else {
        navigate({ to: "/dashboard", replace: true });
      }
    }, 1600);
    
    return () => clearTimeout(timer);
  }, [navigate, isPinSetup, isUnlocked, session, loading]);

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-gradient-to-b from-primary/95 to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-16 size-80 rounded-full bg-white/5" />

        <div className="relative flex flex-col items-center text-center animate-fade-in-up">
          <div className="size-24 rounded-[2rem] bg-white/15 backdrop-blur flex items-center justify-center shadow-pop ring-1 ring-white/20 animate-glow">
            <BookOpen className="size-12" strokeWidth={2.2} />
          </div>
          <h1 className={`mt-6 text-5xl font-bold tracking-tight font-display ${lang === "ta" ? "font-tamil" : ""}`}>
            {t("appName")}
          </h1>
          <p className={`mt-3 text-lg font-medium text-white/85 ${lang === "ta" ? "font-tamil" : ""}`}>
            {t("tagline")}
          </p>
        </div>

        <div className="absolute bottom-10 flex items-center gap-2 text-xs text-white/70 animate-fade-in">
          <span className="size-1.5 rounded-full bg-white/70 animate-pulse-dot" />
          <span>Made in Tamil Nadu</span>
        </div>

        <Link to="/language" className="sr-only">skip</Link>
      </div>
    </PhoneShell>
  );
}
