import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n } from "@/lib/i18n";
import { useSettings, hashPin } from "@/lib/settings";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/pin-lock")({
  component: PinLockPage,
});

function PinLockPage() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { pinHash, setUnlocked, setPinHash } = useSettings();
  const navigate = useNavigate();

  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // If there's no PIN setup, redirect to dashboard automatically
  useEffect(() => {
    if (!pinHash) {
      setUnlocked(true);
      navigate({ to: "/dashboard", replace: true });
    }
  }, [pinHash, navigate, setUnlocked]);

  const handleInput = (num: string) => {
    if (error) setError(false);
    if (pin.length < 4) {
      const newVal = pin + num;
      setPin(newVal);
      if (newVal.length === 4) {
        setTimeout(() => verify(newVal), 300);
      }
    }
  };

  const verify = async (attempt: string) => {
    const hash = await hashPin(attempt);
    if (hash === pinHash) {
      setUnlocked(true);
      navigate({ to: "/dashboard", replace: true });
    } else {
      setError(true);
      setTimeout(() => {
        setPin("");
        setError(false);
      }, 600);
    }
  };

  const handleBackspace = () => {
    if (error) return;
    setPin(pin.slice(0, -1));
  };

  const resetPin = () => {
    if (confirm(ta ? "PIN மறந்துவிட்டதா? ஆப் தரவுகள் நீக்கப்படும். தொடரலாமா?" : "Forgot PIN? All app data will be reset. Continue?")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col items-center pt-24 pb-8 px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-soft">
          <Lock className="size-8" strokeWidth={2.5} />
        </div>
        
        <h1 className={`text-2xl font-bold font-display ${ta ? "font-tamil" : ""}`}>
          {t("enterPin")}
        </h1>
        
        <p className={`mt-2 text-sm text-muted-foreground ${ta ? "font-tamil" : ""}`}>
          {error ? <span className="text-pending font-medium">{t("wrongPin")}</span> : t("appLockDesc")}
        </p>

        <div className={`mt-10 flex gap-4 ${error ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${i < pin.length ? "filled" : ""} ${error ? "error" : ""}`}
            />
          ))}
        </div>

        <button 
          onClick={resetPin}
          className={`mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors ${ta ? "font-tamil" : ""}`}
        >
          {ta ? "PIN மறந்துவிட்டதா?" : "Forgot PIN?"}
        </button>

        <div className="flex-1" />

        {/* Numpad */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-y-4 gap-x-6 mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleInput(String(n))}
              className="h-16 rounded-full text-3xl font-display font-medium active:bg-muted active:scale-95 transition-all bg-card shadow-sm border border-border"
            >
              {n}
            </button>
          ))}
          <div /> {/* Empty space */}
          <button
            onClick={() => handleInput("0")}
            className="h-16 rounded-full text-3xl font-display font-medium active:bg-muted active:scale-95 transition-all bg-card shadow-sm border border-border"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-16 rounded-full flex items-center justify-center text-muted-foreground active:bg-muted active:scale-95 transition-all bg-card shadow-sm border border-border"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-7">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"></path>
              <line x1="18" y1="9" x2="12" y2="15"></line>
              <line x1="12" y1="9" x2="18" y2="15"></line>
            </svg>
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}
