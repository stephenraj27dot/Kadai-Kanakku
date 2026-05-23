import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
    if (loading) return;
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
  }, [navigate, isPinSetup, isUnlocked, session, loading]);

  return null;
}
