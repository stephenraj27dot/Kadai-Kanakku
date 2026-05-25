import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Users, ShoppingBag, Copy, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { user } = useAuth();
  const { customers, totals, balanceOf, statusOf } = useStore();
  const { shopName } = useSettings();
  const { pending, pendingCount, settledToday } = totals();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [copied, setCopied] = useState(false);

  const shopLink = typeof window !== 'undefined' ? `${window.location.origin}/c/${user?.id}` : '';

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
    const channel = supabase.channel('order_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrderCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(shopLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recent = [...customers]
    .filter((c) => c.txns.length)
    .sort((a, b) => Math.max(...b.txns.map((t) => t.at)) - Math.max(...a.txns.map((t) => t.at)))
    .slice(0, 4);

  return (
    <PhoneShell>
      <div className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground px-5 pt-12 pb-20 rounded-b-[2.5rem] relative shadow-soft">
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-sm text-white/80">{ta ? "வணக்கம் 👋" : "Vanakkam 👋"}</p>
            <p className="text-xl font-bold font-display">{shopName || (ta ? "உங்கள் கடை" : "Your Shop")}</p>
          </div>
          <Link to="/settings" className="size-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg border border-white/20">
            {shopName ? shopName.charAt(0).toUpperCase() : "S"}
          </Link>
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium text-white/80">{t("totalPending")}</p>
          <p className="text-4xl font-bold mt-1 text-white">{formatMoney(pending)}</p>
        </div>
      </div>

      {/* SHOP LINK CARD */}
      <div className="px-5 -mt-6 mb-4 relative z-20">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-lg flex flex-col gap-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{ta ? 'உங்கள் கடையின் லிங்க்' : 'Your Shop Link'}</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-xl px-3 py-2 text-[10px] font-mono truncate border border-border flex items-center">{shopLink}</div>
            <button onClick={copyLink} className={`p-2 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>
              {copied ? <CheckCircle2 className="size-5" /> : <Copy className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* NEW ORDERS BANNER */}
      {pendingOrders > 0 && (
        <div className="px-5 mb-6 relative z-10 animate-bounce">
          <Link to="/orders" className="flex items-center justify-between bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">{ta ? 'புதிய ஆர்டர்' : 'NEW ORDER'}</p>
                <p className="font-bold text-amber-900 leading-tight">{pendingOrders} {ta ? 'ஆர்டர்கள் வந்துள்ளது' : 'Orders Waiting'}</p>
              </div>
            </div>
            <ArrowUpRight className="size-5 text-amber-500" />
          </Link>
        </div>
      )}

      <div className="px-5 grid grid-cols-2 gap-3">
        <Link to="/customers/new" className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center shadow-sm active:scale-95 transition-all">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2"><Plus className="size-5" /></div>
          <span className="font-bold text-sm">{t("addCustomer")}</span>
        </Link>
        <Link to="/orders" className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center shadow-sm active:scale-95 transition-all relative">
          <div className="size-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mb-2"><ShoppingBag className="size-5" /></div>
          <span className="font-bold text-sm">{ta ? 'ஆர்டர்கள்' : 'Orders'}</span>
          {pendingOrders > 0 && <span className="absolute top-3 right-3 size-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-card">{pendingOrders}</span>}
        </Link>
      </div>

      <div className="px-5 mt-8 pb-10">
        <h2 className="text-base font-bold mb-4">{t("recent")}</h2>
        <div className="space-y-3">
          {recent.map((c) => (
            <Link key={c.id} to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3 shadow-card active:scale-[0.98] transition-all">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{c.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-sm">{c.name}</div>
                <div className="text-[10px] text-muted-foreground font-bold tracking-wider">{c.phone || "SAVED"}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-money text-sm">{formatMoney(Math.abs(balanceOf(c)))}</div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full badge-${statusOf(c)}`}>
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
