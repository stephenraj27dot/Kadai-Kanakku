import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore, type Customer } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { ArrowUpRight, Plus, TrendingDown, TrendingUp, Users, Flame, Info } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { customers, totals, balanceOf, statusOf } = useStore();
  const { shopName } = useSettings();
  const { pending, pendingCount, partialCount, settledToday } = totals();

  const recent = [...customers]
    .filter((c) => c.txns.length)
    .sort((a, b) => Math.max(...b.txns.map((t) => t.at)) - Math.max(...a.txns.map((t) => t.at)))
    .slice(0, 4);

  return (
    <PhoneShell>
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground px-5 pt-12 pb-20 rounded-b-[2.5rem] relative overflow-hidden shadow-soft">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
        <div className="absolute top-1/2 -left-10 size-32 rounded-full bg-white/5" />
        <div className="flex items-center justify-between relative animate-fade-in-up stagger-item">
          <div>
            <p className={`text-sm text-white/80 ${ta ? "font-tamil" : ""}`}>
              {ta ? "வணக்கம் 👋" : "Vanakkam 👋"}
            </p>
            <p className={`text-xl font-bold font-display ${ta ? "font-tamil" : ""}`}>
              {shopName || (ta ? "உங்கள் கடை" : "Your Shop")}
            </p>
          </div>
          <div className="size-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg ring-1 ring-white/20 shadow-sm font-display">
            {shopName ? shopName.charAt(0).toUpperCase() : "S"}
          </div>
        </div>

        <div className="mt-6 relative animate-fade-in-up stagger-item">
          <p className={`text-sm font-medium text-white/80 ${ta ? "font-tamil" : ""}`}>{t("totalPending")}</p>
          <p className="text-4xl font-bold mt-1 tracking-tight text-money">{formatMoney(pending)}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/90 font-medium">
            <Users className="size-4" />
            <span className={ta ? "font-tamil" : ""}>
              {pendingCount} {t("pendingCustomers")}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="px-5 -mt-12 relative grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up stagger-item">
        <StatCard
          icon={<TrendingDown className="size-4" />}
          tint="pending"
          label={t("pending")}
          value={pendingCount.toString()}
          ta={ta}
        />
        <StatCard
          icon={<Info className="size-4" />}
          tint="partial"
          label={ta ? "கொஞ்சம்" : "Partial"}
          value={partialCount.toString()}
          ta={ta}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          tint="primary"
          label={ta ? "இன்று வரவு" : "Today"}
          value={formatMoney(settledToday)}
          ta={ta}
        />
      </div>

      {/* Quick actions */}
      <div className="px-5 mt-6 grid grid-cols-2 gap-3 animate-fade-in-up stagger-item">
        <Link
          to="/customers/new"
          className="flex items-center gap-3 bg-card rounded-[1.25rem] border border-border px-4 py-4 shadow-card press-scale card-hover min-w-0"
        >
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Plus className="size-5" strokeWidth={2.4} />
          </div>
          <div className={`flex-1 min-w-0 truncate font-semibold text-sm leading-tight ${ta ? "font-tamil" : ""}`}>
            {t("addCustomer")}
          </div>
        </Link>
        <Link
          to="/customers"
          className="flex items-center gap-3 bg-card rounded-[1.25rem] border border-border px-4 py-4 shadow-card press-scale card-hover min-w-0"
        >
          <div className="size-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <Users className="size-5" strokeWidth={2.4} />
          </div>
          <div className={`flex-1 min-w-0 truncate font-semibold text-sm leading-tight ${ta ? "font-tamil" : ""}`}>
            {t("customers")}
          </div>
        </Link>
      </div>

      {/* Recent */}
      <div className="px-5 mt-8 animate-fade-in-up stagger-item pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base font-bold font-display ${ta ? "font-tamil" : ""}`}>{t("recent")}</h2>
          <Link to="/customers" className="text-sm font-semibold text-primary flex items-center gap-0.5 press-scale">
            <span className={ta ? "font-tamil" : ""}>{t("seeAll")}</span>
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="space-y-2.5">
          {recent.map((c) => {
            const bal = balanceOf(c);
            const status = statusOf(c);
            
            // Check if overdue (oldest pending txn > 30 days)
            let isOverdue = false;
            if (status !== "settled") {
              const pendingTxns = c.txns.filter(t => t.type === "debit");
              if (pendingTxns.length > 0) {
                const oldest = Math.min(...pendingTxns.map(t => t.at));
                if (Date.now() - oldest > 30 * 86400000) isOverdue = true;
              }
            }

            return (
              <Link
                key={c.id}
                to="/customers/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 bg-card rounded-[1.25rem] border border-border p-3.5 shadow-card press-scale"
              >
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate font-display">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate font-medium">
                    {c.phone || (ta ? "பெயர் சேமிக்கப்பட்டது" : "Saved customer")}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold text-money ${
                    status === "pending" ? "text-pending" : status === "partial" ? "text-partial-foreground" : "text-primary"
                  }`}>
                    {formatMoney(Math.abs(bal))}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {isOverdue && <Flame className="size-3 text-pending" fill="currentColor" />}
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ta ? "font-tamil" : ""} badge-${status}`}>
                      {status === "settled" && "✓ "}
                      {status === "settled" ? t("settled") : status === "partial" ? ta ? "கொஞ்சம்" : "Partial" : t("pending")}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PhoneShell>
  );
}

function StatCard({
  icon, label, value, tint, ta,
}: { icon: React.ReactNode; label: string; value: string; tint: "pending" | "primary" | "partial"; ta: boolean }) {
  const styles = "bg-card border-border shadow-card";
  const dot =
    tint === "pending" ? "bg-pending/10 text-pending"
      : tint === "partial" ? "bg-partial/15 text-partial-foreground"
      : "bg-primary/10 text-primary";
  
  return (
    <div className={`rounded-[1.25rem] border ${styles} p-3.5 flex flex-col items-center text-center`}>
      <div className={`size-8 rounded-[0.6rem] flex items-center justify-center ${dot}`}>{icon}</div>
      <div className={`mt-2.5 text-[11px] font-semibold text-muted-foreground ${ta ? "font-tamil" : ""}`}>{label}</div>
      <div className="mt-0.5 text-base sm:text-lg font-bold font-display text-money truncate w-full">{value}</div>
    </div>
  );
}

export function Avatar({ name, size = 46 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "bg-primary/15 text-primary",
    "bg-pending/15 text-pending",
    "bg-partial/20 text-partial-foreground",
    "bg-accent text-accent-foreground",
  ];
  // Simple deterministic hash for color
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % colors.length;
  
  return (
    <div
      className={`shrink-0 rounded-full font-bold font-display flex items-center justify-center ${colors[idx]} shadow-sm border border-black/5`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
