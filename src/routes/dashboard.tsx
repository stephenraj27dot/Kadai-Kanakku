import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Users, ShoppingBag, Settings as SettingsIcon } from "lucide-react";
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
  const { pending, pendingCount } = totals();
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
    .slice(0, 4);

  return (
    <PhoneShell>
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground px-6 pt-12 pb-16 rounded-b-[3rem] relative shadow-soft overflow-hidden">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-white/70">{ta ? "வணக்கம் 👋" : "Welcome back 👋"}</p>
            <p className="text-2xl font-black font-display tracking-tight">{shopName || (ta ? "உங்கள் கடை" : "Your Shop")}</p>
          </div>
          <Link to="/settings" className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg press-scale">
            <SettingsIcon className="size-6 text-white" />
          </Link>
        </div>

        <div className="mt-8 relative z-10">
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("totalPending")}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-black text-white">{formatMoney(pending)}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/80 bg-black/10 self-start px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <Users className="size-3.5" />
            {pendingCount} {t("pendingCustomers")}
          </div>
        </div>
      </div>

      {/* New Orders Banner */}
      {pendingOrders > 0 && (
        <div className="px-5 -mt-6 mb-6 relative z-20">
          <Link to="/orders" className="flex items-center justify-between bg-amber-500 text-white p-4 rounded-[1.5rem] shadow-xl ring-4 ring-background animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-tighter">{ta ? 'புதிய ஆர்டர்' : 'NEW ORDER'}</p>
                <p className="font-bold leading-tight">{pendingOrders} {ta ? 'டெலிவரிக்கு காத்திருக்கிறது' : 'Orders Pending'}</p>
              </div>
            </div>
            <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowUpRight className="size-5" />
            </div>
          </Link>
        </div>
      )}

      {/* Main Actions - Fixed Transparency */}
      <div className={`px-5 grid grid-cols-2 gap-4 ${pendingOrders > 0 ? "" : "-mt-8"}`}>
        <Link to="/customers/new" className="bg-card border-2 border-border/10 rounded-[2rem] p-6 flex flex-col items-center shadow-card press-scale transition-all">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3"><Plus className="size-6" strokeWidth={2.8} /></div>
          <span className="font-bold text-sm text-foreground">{t("addCustomer")}</span>
        </Link>
        <Link to="/orders" className="bg-card border-2 border-border/10 rounded-[2rem] p-6 flex flex-col items-center shadow-card press-scale transition-all relative">
          <div className="size-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mb-3"><ShoppingBag className="size-6" strokeWidth={2.8} /></div>
          <span className="font-bold text-sm text-foreground">{ta ? 'ஆர்டர்கள்' : 'Orders'}</span>
          {pendingOrders > 0 && (
            <span className="absolute top-4 right-4 size-6 bg-amber-500 text-white text-[11px] font-black rounded-full flex items-center justify-center ring-4 ring-card">
              {pendingOrders}
            </span>
          )}
        </Link>
      </div>

      {/* Recent Customers */}
      <div className="px-5 mt-10 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black font-display tracking-tight text-foreground">{t("recent")}</h2>
          <Link to="/customers" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full press-scale">{t("seeAll")}</Link>
        </div>

        <div className="space-y-3">
          {recent.map((c) => (
            <Link key={c.id} to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-4 bg-card border border-border p-4 rounded-[1.5rem] shadow-sm active:scale-[0.98] transition-all">
              <Avatar name={c.name} size={50} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-base text-foreground">{c.name}</div>
                <div className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mt-0.5">{c.phone || "SAVED"}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-money text-base">{formatMoney(Math.abs(balanceOf(c)))}</div>
                <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full mt-1 inline-block badge-${statusOf(c)}`}>
                  {statusOf(c) === "settled" ? "✓" : (ta ? "பாக்கி" : "Baki")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}
