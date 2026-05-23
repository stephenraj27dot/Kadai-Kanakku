import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n } from "@/lib/i18n";
import { useSettings, hashPin } from "@/lib/settings";

export const Route = createFileRoute("/pin-setup")({
  component: PinSetupPage,
});

function PinSetupPage() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { setPinHash } = useSettings();
  const navigate = useNavigate();

  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState(false);

  const handleInput = (num: string) => {
    if (error) setError(false);
    
    if (step === 1) {
      if (pin1.length < 4) {
        const newVal = pin1 + num;
        setPin1(newVal);
        if (newVal.length === 4) {
          setTimeout(() => setStep(2), 300);
        }
      }
    } else {
      if (pin2.length < 4) {
        const newVal = pin2 + num;
        setPin2(newVal);
        if (newVal.length === 4) {
          setTimeout(() => verify(newVal), 300);
        }
      }
    }
  };

  const verify = async (finalPin2: string) => {
    if (pin1 === finalPin2) {
      const hash = await hashPin(pin1);
      setPinHash(hash);
      navigate({ to: "/dashboard", replace: true });
    } else {
      setError(true);
      setTimeout(() => {
        setPin1("");
        setPin2("");
        setStep(1);
        setError(false);
      }, 600);
    }
  };

  const handleBackspace = () => {
    if (error) return;
    if (step === 1) {
      setPin1(pin1.slice(0, -1));
    } else {
      setPin2(pin2.slice(0, -1));
    }
  };

  const currentPin = step === 1 ? pin1 : pin2;

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col items-center pt-24 pb-8 px-6">
        <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-8">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
        </div>
        
        <h1 className={`text-2xl font-bold font-display ${ta ? "font-tamil" : ""}`}>
          {step === 1 ? t("setupPin") : ta ? "மீண்டும் உள்ளிடுக" : "Confirm PIN"}
        </h1>
        
        <p className={`mt-2 text-sm text-muted-foreground ${ta ? "font-tamil" : ""}`}>
          {step === 1 ? t("pinHint") : error ? t("wrongPin") : ta ? "உறுதி செய்ய மீண்டும் டைப் செய்க" : "Type your PIN again to confirm"}
        </p>

        <div className={`mt-10 flex gap-4 ${error ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${i < currentPin.length ? "filled" : ""} ${error ? "error" : ""}`}
            />
          ))}
        </div>

        <div className="flex-1" />

        {/* Numpad */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-y-4 gap-x-6 mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleInput(String(n))}
              className="h-16 rounded-full text-3xl font-display font-medium active:bg-muted active:scale-95 transition-all"
            >
              {n}
            </button>
          ))}
          <div /> {/* Empty space */}
          <button
            onClick={() => handleInput("0")}
            className="h-16 rounded-full text-3xl font-display font-medium active:bg-muted active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-16 rounded-full flex items-center justify-center text-muted-foreground active:bg-muted active:scale-95 transition-all"
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
