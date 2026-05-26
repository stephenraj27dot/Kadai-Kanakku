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
          <Link to="/settings" className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md press-scale">
            <SettingsIcon className="size-6 text-white" />
          </Link>
        </div>

        <div className="mt-8 relative z-10">
          <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">{t("totalPending")}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-black text-white tracking-tighter">{formatMoney(pending)}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/90 bg-black/10 self-start px-3.5 py-2 rounded-full backdrop-blur-sm border border-white/5">
            <Users className="size-3.5" />
            {pendingCount} {t("pendingCustomers")}
          </div>
        </div>
      </div>

      {/* Main Actions - Enhanced Visibility for Shop Owners */}
      <div className={`px-5 grid grid-cols-2 gap-4 ${pendingOrders > 0 ? "" : "-mt-8"}`}>
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
