import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n, type Lang } from "@/lib/i18n";
import { Check } from "lucide-react";

export const Route = createFileRoute("/language")({
  component: LanguagePage,
});

function LanguagePage() {
  const { lang, setLang, t } = useI18n();
  const [pick, setPick] = useState<Lang>(lang);
  const navigate = useNavigate();

  const options: { code: Lang; native: string; sub: string }[] = [
    { code: "ta", native: "தமிழ்", sub: "Tamil" },
    { code: "en", native: "English", sub: "English" },
  ];

  const confirm = () => {
    setLang(pick);
    navigate({ to: "/dashboard" });
  };

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col px-6 pt-14 pb-8">
        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-2xl">🌐</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold leading-tight">
          Choose your language
        </h1>
        <p className="mt-1 font-tamil text-muted-foreground">மொழியை தேர்ந்தெடுக்கவும்</p>

        <div className="mt-8 space-y-3">
          {options.map((o) => {
            const active = pick === o.code;
            return (
              <button
                key={o.code}
                onClick={() => setPick(o.code)}
                className={`w-full rounded-2xl border-2 px-5 py-5 flex items-center justify-between text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div>
                  <div className={`text-xl font-semibold ${o.code === "ta" ? "font-tamil" : ""}`}>
                    {o.native}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{o.sub}</div>
                </div>
                <div className={`size-7 rounded-full flex items-center justify-center transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "border-2 border-border"
                }`}>
                  {active && <Check className="size-4" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <button
          onClick={confirm}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold shadow-soft active:scale-[0.98] transition-transform"
        >
          <span className={pick === "ta" ? "font-tamil" : ""}>
            {pick === "ta" ? "தொடரவும்" : "Continue"}
          </span>
        </button>
      </div>
    </PhoneShell>
  );
}
