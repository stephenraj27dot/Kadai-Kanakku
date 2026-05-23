import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell, TopBar } from "@/components/PhoneShell";
import { useI18n, type Lang } from "@/lib/i18n";
import { useSettings, type Theme } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { Cloud, Globe, Lock, CheckCircle2, Store, Moon, Sun, Monitor, Download, Edit2, Check, LogOut } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const ta = lang === "ta";
  const { theme, setTheme, shopName, setShopName, shopPhone, setShopPhone, isPinSetup, setPinHash } = useSettings();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [backedUp, setBackedUp] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(shopName);
  const [tempPhone, setTempPhone] = useState(shopPhone);

  const saveProfile = () => {
    setShopName(tempName);
    setShopPhone(tempPhone);
    setEditingProfile(false);
  };

  const togglePin = (enable: boolean) => {
    if (enable) {
      navigate({ to: "/pin-setup" });
    } else {
      if (confirm(ta ? "PIN Lock-ஐ நீக்க வேண்டுமா?" : "Remove PIN lock?")) {
        setPinHash(null);
      }
    }
  };

  const handleLogout = async () => {
    if (confirm(ta ? "வெளியேற விரும்புகிறீர்களா?" : "Are you sure you want to log out?")) {
      await signOut();
      window.location.href = "/";
    }
  };

  return (
    <PhoneShell>
      <TopBar title={<span className={`font-display ${ta ? "font-tamil" : ""}`}>{t("settings")}</span>} />

      <div className="px-4 pt-4 pb-12 space-y-5">
        {/* Profile */}
        <div className="rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/85 text-primary-foreground p-5 shadow-card relative overflow-hidden animate-fade-in-up">
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/10" />
          
          {editingProfile ? (
            <div className="space-y-3 relative z-10">
              <input 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
                className="w-full bg-white/20 text-white placeholder-white/50 border-none rounded-xl px-3 py-2 outline-none font-bold font-display"
                placeholder={t("shopName")}
              />
              <input 
                value={tempPhone} 
                onChange={(e) => setTempPhone(e.target.value)}
                className="w-full bg-white/20 text-white placeholder-white/50 border-none rounded-xl px-3 py-2 outline-none font-medium text-sm"
                placeholder={t("shopPhone")}
              />
              <button 
                onClick={saveProfile}
                className="w-full bg-white text-primary font-bold py-2 rounded-xl mt-2 flex items-center justify-center gap-2 press-scale"
              >
                <Check className="size-4" /> Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 relative z-10">
              <div className="size-14 rounded-full bg-white/15 ring-1 ring-white/20 flex items-center justify-center text-2xl font-bold font-display shadow-sm">
                {shopName ? shopName.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="flex-1">
                <div className={`font-bold text-lg font-display ${ta ? "font-tamil" : ""}`}>
                  {shopName || (ta ? "உங்கள் கடை" : "Your Shop")}
                </div>
                <div className="text-sm text-white/90 font-medium mt-0.5">{shopPhone || "Add phone number"}</div>
              </div>
              <button 
                onClick={() => { setTempName(shopName); setTempPhone(shopPhone); setEditingProfile(true); }}
                className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              >
                <Edit2 className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Theme */}
        <Section title={t("theme")} ta={ta} delay="60ms">
          <div className="p-1 grid grid-cols-3 gap-1 bg-muted rounded-[1.25rem]">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-[1rem] text-xs font-semibold transition-all ${
                theme === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              } ${ta ? "font-tamil" : ""}`}
            >
              <Sun className="size-5" />
              {t("lightMode")}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-[1rem] text-xs font-semibold transition-all ${
                theme === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              } ${ta ? "font-tamil" : ""}`}
            >
              <Moon className="size-5" />
              {t("darkMode")}
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-[1rem] text-xs font-semibold transition-all ${
                theme === "system" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              } ${ta ? "font-tamil" : ""}`}
            >
              <Monitor className="size-5" />
              {t("systemTheme")}
            </button>
          </div>
        </Section>

        {/* Language */}
        <Section title={t("language")} ta={ta} delay="120ms">
          <div className="p-1 grid grid-cols-2 gap-1 bg-muted rounded-[1.25rem]">
            {(["ta", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`h-12 rounded-[1rem] font-bold transition-all text-sm ${
                  lang === l ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                } ${l === "ta" ? "font-tamil" : ""}`}
              >
                {l === "ta" ? "தமிழ்" : "English"}
              </button>
            ))}
          </div>
        </Section>

        {/* Security */}
        <Section title={ta ? "பாதுகாப்பு" : "Security"} ta={ta} delay="180ms">
          <Row
            icon={<Lock className="size-5" />}
            tint="partial"
            title={t("appLock")}
            subtitle={t("appLockDesc")}
            ta={ta}
            right={<Toggle on={isPinSetup} onChange={togglePin} />}
          />
        </Section>

        {/* Data & Backup */}
        <Section title={ta ? "தரவுகள்" : "Data"} ta={ta} delay="240ms">
          <Row
            icon={<Cloud className="size-5" />}
            tint="primary"
            title={t("backup")}
            subtitle={user?.email ? `Synced to ${user.email}` : "Not logged in"}
            ta={ta}
            right={
              <button
                onClick={() => setBackedUp(true)}
                className={`px-4 h-9 rounded-full text-xs font-bold flex items-center gap-1.5 press-scale ${
                  backedUp ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground shadow-soft"
                }`}
              >
                {backedUp && <CheckCircle2 className="size-4" />}
                <span className={ta ? "font-tamil" : ""}>
                  {backedUp ? (ta ? "முடிந்தது" : "Done") : t("backupNow")}
                </span>
              </button>
            }
          />
        </Section>
        
        {/* Account Actions */}
        <Section title={ta ? "கணக்கு" : "Account"} ta={ta} delay="300ms">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <LogOut className="size-5" />
              </div>
              <div className="font-bold text-sm text-destructive">{ta ? "வெளியேறு" : "Logout"}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 h-9 rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow-soft press-scale"
            >
              {ta ? "வெளியேறு" : "Logout"}
            </button>
          </div>
        </Section>

        <p className="text-center text-xs font-medium text-muted-foreground pt-4 pb-8">
          Baki Book v2.0 · Made with ♥ in Tamil Nadu
        </p>
      </div>
    </PhoneShell>
  );
}

function Section({ title, ta, children, delay }: { title: string; ta: boolean; children: React.ReactNode; delay: string }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: delay }}>
      <h2 className={`px-2 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground ${ta ? "font-tamil" : ""}`}>
        {title}
      </h2>
      <div className="bg-card rounded-[1.25rem] border border-border shadow-card overflow-hidden">{children}</div>
    </div>
  );
}

function Row({ icon, tint, title, subtitle, right, ta }: {
  icon: React.ReactNode; tint: "primary" | "partial" | "pending";
  title: string; subtitle?: string; right?: React.ReactNode; ta: boolean;
}) {
  const tintCls =
    tint === "primary" ? "bg-primary/10 text-primary"
      : tint === "partial" ? "bg-partial/15 text-partial-foreground"
      : "bg-pending/10 text-pending";
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className={`size-11 rounded-[0.8rem] flex items-center justify-center shrink-0 ${tintCls}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm ${ta ? "font-tamil" : ""}`}>{title}</div>
        {subtitle && <div className={`text-xs text-muted-foreground mt-0.5 font-medium ${ta ? "font-tamil" : ""}`}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-12 h-7 rounded-full p-0.5 transition-colors press-scale ${on ? "bg-primary" : "bg-muted border border-border"}`}
    >
      <div className={`size-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-5" : "translate-x-0 border border-black/5"}`} />
    </button>
  );
}
