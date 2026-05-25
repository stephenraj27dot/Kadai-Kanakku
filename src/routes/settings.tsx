import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell, TopBar } from "@/components/PhoneShell";
import { useI18n, type Lang } from "@/lib/i18n";
import { useSettings, type Theme } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Cloud, Lock, CheckCircle2, Moon, Sun, Monitor, Edit2, Check, LogOut, Share2, Copy, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const ta = lang === "ta";
  const { theme, setTheme, shopName, shopPhone, upiId, setUpiId, canPrice, setCanPrice, isPinSetup, setPinHash, setShopName, setShopPhone } = useSettings();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [editingProfile, setEditingProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tempName, setTempName] = useState(shopName);
  const [tempPhone, setTempPhone] = useState(shopPhone);
  const [tempUpi, setTempUpi] = useState(upiId);
  const [tempPrice, setTempPrice] = useState(canPrice.toString());

  const shopLink = typeof window !== 'undefined' ? `${window.location.origin}/c/${user?.id}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shopLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shopName,
          text: ta ? `எங்கள் கடையின் கணக்கை ஆன்லைனில் பார்க்கவும்:` : `View our shop account online:`,
          url: shopLink,
        });
      } catch (err) {
        console.log("Error sharing", err);
      }
    } else {
      copyLink();
    }
  };

  const saveProfile = async () => {
    setShopName(tempName);
    setShopPhone(tempPhone);
    setUpiId(tempUpi);
    const parsedPrice = parseInt(tempPrice, 10) || 30;
    setCanPrice(parsedPrice);
    setEditingProfile(false);
    
    if (user) {
      await supabase.rpc('upsert_shop_profile', {
        p_shop_name: tempName,
        p_phone: tempPhone,
        p_can_price: parsedPrice,
        p_upi_id: tempUpi
      });
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
      <TopBar title={<span className={`font-black font-display tracking-tight ${ta ? "font-tamil" : ""}`}>{t("settings")}</span>} />

      <div className="px-5 pt-4 pb-12 space-y-6">
        {/* Modern Profile Card */}
        <div className="rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-xl" />
          
          {editingProfile ? (
            <div className="space-y-3 relative z-10">
              <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-white/20 text-white placeholder-white/50 border-none rounded-xl px-3 py-2 outline-none font-bold" placeholder={t("shopName")} />
              <input value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="w-full bg-white/20 text-white placeholder-white/50 border-none rounded-xl px-3 py-2 outline-none text-sm" placeholder={t("shopPhone")} />
              <input value={tempUpi} onChange={(e) => setTempUpi(e.target.value)} className="w-full bg-white/20 text-white placeholder-white/50 border-none rounded-xl px-3 py-2 outline-none text-sm" placeholder="UPI ID" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase opacity-70">Can Price: ₹</span>
                <input type="number" value={tempPrice} onChange={(e) => setTempPrice(e.target.value)} className="w-20 bg-white/20 text-white rounded-xl px-3 py-1 outline-none font-bold" />
              </div>
              <button onClick={saveProfile} className="w-full bg-white text-primary font-black py-3 rounded-2xl mt-2 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                <Check className="size-5" /> {ta ? "சேமி" : "Save"}
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black shadow-inner border border-white/20">
                  {shopName ? shopName.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <h3 className="font-black text-xl font-display">{shopName || "Your Shop"}</h3>
                  <p className="text-xs font-bold opacity-70 mt-0.5 tracking-wider">{shopPhone || "No Phone"}</p>
                </div>
              </div>
              <button onClick={() => { setTempName(shopName); setTempPhone(shopPhone); setTempUpi(upiId); setTempPrice(canPrice.toString()); setEditingProfile(true); }} className="size-11 rounded-2xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors border border-white/10">
                <Edit2 className="size-5" />
              </button>
            </div>
          )}
        </div>

        {/* Customer Access - Moved from Dashboard */}
        <div className="bg-card border border-border rounded-[2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-accent/10 text-accent-foreground flex items-center justify-center">
              <Share2 className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{ta ? "வாடிக்கையாளர் லிங்க்" : "Customer Link"}</h4>
              <p className="text-[10px] text-muted-foreground font-medium">{ta ? "வாடிக்கையாளர்கள் ஆர்டர் செய்ய இதை அனுப்பவும்" : "Customers can use this link to order"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={shareLink} className="flex-1 h-12 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-soft active:scale-95 transition-all">
              <Share2 className="size-4" /> {ta ? "பகிர்க (Share)" : "Share Link"}
            </button>
            <button onClick={copyLink} className={`px-4 rounded-2xl font-bold transition-all border ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-background border-border'}`}>
              {copied ? <CheckCircle2 className="size-5" /> : <Copy className="size-5" />}
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <h5 className="px-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{ta ? "அமைப்புகள்" : "Preferences"}</h5>

          {/* Language Toggle */}
          <div className="bg-card border border-border rounded-[2rem] p-2 flex gap-2">
            <button onClick={() => setLang('ta')} className={`flex-1 h-12 rounded-3xl font-black text-sm transition-all ${lang === 'ta' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}>தமிழ்</button>
            <button onClick={() => setLang('en')} className={`flex-1 h-12 rounded-3xl font-black text-sm transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}>English</button>
          </div>

          {/* Security & Data */}
          <div className="bg-card border border-border rounded-[2rem] overflow-hidden divide-y divide-border shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><Lock className="size-5" /></div>
                <div>
                  <p className="font-bold text-sm">{ta ? "ஆப் லாக்" : "App Lock"}</p>
                  <p className="text-[10px] text-muted-foreground">{ta ? "PIN மூலம் பாதுகாப்பு" : "Secure with PIN"}</p>
                </div>
              </div>
              <button onClick={() => navigate({ to: "/pin-setup" })} className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isPinSetup ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`size-5 rounded-full bg-white shadow-sm transition-transform ${isPinSetup ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <button onClick={handleLogout} className="w-full p-4 flex items-center gap-4 hover:bg-destructive/5 transition-colors text-destructive">
               <div className="size-10 rounded-2xl bg-destructive/10 flex items-center justify-center"><LogOut className="size-5" /></div>
               <div className="text-left">
                  <p className="font-bold text-sm">{ta ? "வெளியேறு" : "Logout"}</p>
                  <p className="text-[10px] opacity-60">Sign out from your account</p>
               </div>
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-4">Kadai Kanakku v1.2</p>
      </div>
    </PhoneShell>
  );
}
