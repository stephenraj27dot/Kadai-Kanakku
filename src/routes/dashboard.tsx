import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Users, ShoppingBag, Settings as SettingsIcon, QrCode, X, Copy, Share2, BarChart3 } from "lucide-react";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { user } = useAuth();
  const { customers, totals, balanceOf, statusOf } = useStore();
  const { shopName } = useSettings();

  const [showQR, setShowQR] = useState(false);
  const { pending, pendingCount, salesToday, settledToday } = totals();
  const [pendingOrders, setPendingOrders] = useState(0);

  const fetchOrderCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_owner_id', user.id)
      .eq('status', 'pending');
    setPendingOrders(count || 0);
  };

  useEffect(() => {
    fetchOrderCount();
    const channel = supabase.channel('dashboard_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrderCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const recent = [...customers]
    .filter((c) => c.txns.length)
    .sort((a, b) => Math.max(...b.txns.map((t) => t.at)) - Math.max(...a.txns.map((t) => t.at)))
    .slice(0, 5);

  return (
    <PhoneShell>
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-16 rounded-b-[2.5rem] relative shadow-lg overflow-hidden">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-white/70">{ta ? "வணக்கம் 👋" : "Welcome back 👋"}</p>
            <p className="text-2xl font-black font-display tracking-tight leading-none mt-1">{shopName || (ta ? "உங்கள் கடை" : "Your Shop")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowQR(true)} className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md press-scale">
              <QrCode className="size-6 text-white" />
            </button>
            <Link to="/settings" className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md press-scale">
              <SettingsIcon className="size-6 text-white" />
            </Link>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-foreground">
            <div className="bg-background rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center relative">
              <button 
                onClick={() => setShowQR(false)} 
                className="absolute top-4 right-4 p-2 bg-muted rounded-full"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
              
              <h3 className={`text-xl font-bold text-center mt-2 mb-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'உங்கள் கடையின் QR கோட்' : 'Your Shop QR Code'}
              </h3>
              <p className={`text-xs text-center text-muted-foreground mb-6 ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'வாடிக்கையாளர்கள் இதை ஸ்கேன் செய்து தங்கள் கணக்கை பார்க்கலாம்.' : 'Customers can scan this to view their account.'}
              </p>
              
              <div className="p-4 bg-white rounded-2xl border-4 border-primary/20 shadow-lg mb-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://kadai-kanakku.vercel.app/c/${user?.id}`} 
                  alt="Shop QR Code" 
                  className="w-48 h-48"
                />
              </div>

              <div className="w-full">
                <div className="bg-muted p-3 rounded-xl flex items-center justify-between mb-4 border border-border">
                  <span className="text-xs truncate text-muted-foreground font-mono mr-3">
                    kadai-kanakku.vercel.app/c/{user?.id?.slice(0, 8)}...
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://kadai-kanakku.vercel.app/c/${user?.id}`)
                      alert(ta ? 'லிங்க் காப்பி செய்யப்பட்டது!' : 'Link copied to clipboard!')
                    }}
                    className="p-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 press-scale"
                  >
                    <Copy className="size-4" />
                    <span className="text-xs font-bold">{ta ? 'காப்பி' : 'Copy'}</span>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    const text = ta 
                      ? `வணக்கம்! எங்கள் கடையின் உங்களது பாக்கி விவரங்களை இங்கே பார்க்கலாம்: https://kadai-kanakku.vercel.app/c/${user?.id}`
                      : `Hello! Check your account balance at our shop here: https://kadai-kanakku.vercel.app/c/${user?.id}`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  className={`w-full h-12 rounded-xl bg-[#25D366] text-white font-bold shadow-soft flex items-center justify-center gap-2 press-scale ${ta ? 'font-tamil' : 'font-display'}`}
                >
                  <Share2 className="size-5" />
                  {ta ? 'வாட்ஸ்அப்பில் பகிர' : 'Share on WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 relative z-10 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">{ta ? 'இன்றைய வியாபாரம்' : 'Today Sales'}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-white tracking-tighter">{formatMoney(salesToday)}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-white/80 bg-white/10 self-start px-2.5 py-1 rounded-full backdrop-blur-sm w-max">
              <span className="text-green-400">+{formatMoney(settledToday)} {ta ? 'வரவு' : 'Paid'}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">{t("totalPending")}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-white tracking-tighter">{formatMoney(pending)}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-white/80 bg-white/10 self-start px-2.5 py-1 rounded-full backdrop-blur-sm w-max">
              <Users className="size-3" />
              {pendingCount} {t("pendingCustomers")}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders Notification Widget */}
      {pendingOrders > 0 && (
        <div className="px-5 mt-4 -mb-2 relative z-20">
          <Link to="/orders" className="block bg-amber-400 text-amber-950 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-500/30 animate-pulse press-scale">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-amber-950 text-amber-400 rounded-xl flex items-center justify-center font-black text-xl">
                {pendingOrders}
              </div>
              <div>
                <p className={`font-bold text-lg leading-tight ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'புதிய ஆர்டர்கள் வந்துள்ளது!' : 'New Orders Received!'}
                </p>
                <p className={`text-xs font-semibold opacity-80 ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'உடனே பார்க்கவும்' : 'Tap to view and deliver'}
                </p>
              </div>
            </div>
            <div className="bg-amber-950/10 p-2 rounded-full">
              <ArrowUpRight className="size-5" />
            </div>
          </Link>
        </div>
      )}

      {/* Main Actions - Enhanced Visibility for Shop Owners */}
      <div className={`px-5 space-y-4 ${pendingOrders > 0 ? "mt-6" : "-mt-8 relative z-20"}`}>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/customers/new"
            className="bg-card border-2 border-primary/20 rounded-[1.75rem] p-6 flex flex-col items-center shadow-xl press-scale group"
          >
            <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-3 shadow-glow group-hover:scale-110 transition-transform">
              <Plus className="size-8" strokeWidth={3} />
            </div>
            <span className="font-black text-sm uppercase tracking-tight text-primary">{t("addCustomer")}</span>
          </Link>
          <Link
            to="/orders"
            className="bg-card border-2 border-primary/10 rounded-[1.75rem] p-6 flex flex-col items-center shadow-xl press-scale group"
          >
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBag className="size-8" strokeWidth={2.5} />
            </div>
            <span className="font-black text-sm uppercase tracking-tight text-foreground/80">{ta ? 'ஆர்டர்கள்' : 'Orders'}</span>
          </Link>
        </div>
        
        {/* Reports Button */}
        <Link
          to="/reports"
          className="bg-primary text-primary-foreground border-2 border-primary rounded-[1.75rem] p-5 flex items-center justify-between shadow-xl press-scale group"
        >
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="size-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-black text-lg tracking-tight">{ta ? 'வியாபார விவரங்கள்' : 'Reports & Analytics'}</p>
              <p className="text-xs font-medium opacity-80">{ta ? 'தினசரி & மாதாந்திர வியாபாரம்' : 'Daily & Monthly Turnover'}</p>
            </div>
          </div>
          <ArrowUpRight className="size-5 opacity-70" />
        </Link>
      </div>

      <div className="px-5 mt-10 pb-20">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black font-display tracking-tight text-foreground">{t("recent")}</h2>
          <Link to="/customers" className="text-[11px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full press-scale">{t("seeAll")}</Link>
        </div>

        <div className="space-y-3">
          {recent.map((c, i) => (
            <Link
              key={c.id}
              to="/customers/$id"
              params={{ id: c.id }}
              className="flex items-center gap-4 bg-card border border-border/60 p-4 rounded-[1.5rem] shadow-sm press-scale"
            >
              <Avatar name={c.name} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-base text-foreground leading-tight">{c.name}</div>
                <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">{c.phone || "SAVED"}</div>
              </div>
              <div className="text-right">
                <div className={`font-black text-money text-base ${
                  statusOf(c) === "pending"
                    ? "text-[#EF4444]"
                    : statusOf(c) === "partial"
                      ? "text-[#F59E0B]"
                      : "text-primary"
                }`}>
                  {formatMoney(Math.abs(balanceOf(c)))}
                </div>
                <div className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full mt-1.5 inline-block badge-${statusOf(c)}`}>
                  {statusOf(c) === "settled"
                    ? (ta ? "✓ முடிந்தது" : "✓ SETTLED")
                    : statusOf(c) === "partial"
                      ? (ta ? "கொஞ்சம் பாக்கி" : "PARTIAL BAKI")
                      : (ta ? "பாக்கி" : "BAKI")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}
