import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell, TopBar } from "@/components/PhoneShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { LogOut, Globe, Check } from "lucide-react";

export const Route = createFileRoute("/c/$shopId/settings")({
  component: CustomerSettingsPage,
});

function CustomerSettingsPage() {
  const { shopId } = Route.useParams();
  const { lang, setLang } = useI18n();
  const ta = lang === "ta";
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm(ta ? "வெளியேற விரும்புகிறீர்களா?" : "Are you sure you want to log out?")) {
      await supabase.auth.signOut();
      navigate({ to: `/c/${shopId}/login`, replace: true });
    }
  };

  return (
    <PhoneShell>
      <TopBar
        title={<span className={ta ? "font-tamil" : "font-display"}>{ta ? "அமைப்புகள்" : "Settings"}</span>}
        back={`/c/${shopId}`}
      />

      <div className="px-4 pt-4 pb-12 space-y-5">
        {/* Language */}
        <div className="bg-background rounded-3xl p-5 border border-border shadow-sm animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-4 text-primary">
            <Globe className="size-5" />
            <h3 className={`font-bold ${ta ? "font-tamil" : "font-display"}`}>
              {ta ? "மொழி" : "Language"}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLang("ta")}
              className={`h-12 rounded-2xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                ta
                  ? "bg-primary/10 border-primary text-primary font-bold"
                  : "bg-muted border-transparent text-muted-foreground"
              }`}
            >
              {ta && <Check className="size-4" />}
              <span className="font-tamil">தமிழ்</span>
            </button>
            <button
              onClick={() => setLang("en")}
              className={`h-12 rounded-2xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                !ta
                  ? "bg-primary/10 border-primary text-primary font-bold"
                  : "bg-muted border-transparent text-muted-foreground"
              }`}
            >
              {!ta && <Check className="size-4" />}
              <span className="font-display">English</span>
            </button>
          </div>
        </div>

        {/* Feedback / Complaint */}
        <button
          onClick={() => navigate({ to: `/c/${shopId}/feedback` })}
          className="w-full h-14 bg-background border border-border rounded-3xl flex items-center gap-3 px-5 shadow-sm active:scale-[0.98] transition-all animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <span className={`font-bold ${ta ? "font-tamil" : "font-display"} text-foreground`}>
            {ta ? "புகார் / கருத்து தெரிவிக்கவும்" : "Send Feedback / Complaint"}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full h-14 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center gap-2 font-bold shadow-sm active:scale-[0.98] transition-all animate-fade-in-up border border-red-100"
          style={{ animationDelay: "0.2s" }}
        >
          <LogOut className="size-5" />
          <span className={ta ? "font-tamil" : "font-display"}>
            {ta ? "வெளியேறு" : "Log Out"}
          </span>
        </button>
      </div>
    </PhoneShell>
  );
}
