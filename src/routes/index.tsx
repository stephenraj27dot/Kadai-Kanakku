import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const { isPinSetup, isUnlocked } = useSettings();
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Wait until auth status is fully determined
    if (loading) return;

    const checkNavigation = async () => {
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
    };

    checkNavigation();
  }, [navigate, isPinSetup, isUnlocked, session, loading]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      {/* Empty screen during initial logic check to prevent flicker */}
    </div>
  );
}
