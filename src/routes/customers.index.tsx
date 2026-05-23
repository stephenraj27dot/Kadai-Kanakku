import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell, TopBar } from "@/components/PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore, type Customer } from "@/lib/store";
import { Plus, Search, Flame } from "lucide-react";
import { Avatar } from "./dashboard";

export const Route = createFileRoute("/customers/")({
  component: CustomersList,
  validateSearch: (s: Record<string, unknown>) => ({
    filter: (s.filter as string) ?? "all",
  }),
});

type FilterTab = "all" | "pending" | "partial" | "settled" | "overdue";

function CustomersList() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { customers, balanceOf, statusOf } = useStore();
  const [q, setQ] = useState("");
  const search = useSearch({ from: "/customers/" });
  const [tab, setTab] = useState<FilterTab>((search.filter as FilterTab) || "all");

  // Determine overdue status helper
  const isOverdue = (c: Customer) => {
    const status = statusOf(c);
    if (status === "settled") return false;
    const pendingTxns = c.txns.filter(tx => tx.type === "debit");
    if (pendingTxns.length === 0) return false;
    const oldest = Math.min(...pendingTxns.map(tx => tx.at));
    return Date.now() - oldest > 30 * 86400000;
  };

  const filtered = customers
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q))
    .filter((c) => {
      if (tab === "all") return true;
      if (tab === "overdue") return isOverdue(c);
      return statusOf(c) === tab;
    })
    .sort((a, b) => balanceOf(b) - balanceOf(a));

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "pending", label: t("filterPending") },
    { id: "partial", label: t("filterPartial") },
    { id: "settled", label: t("filterSettled") },
    { id: "overdue", label: t("filterOverdue") },
  ];

  return (
    <PhoneShell>
      <TopBar title={<span className={`font-display ${ta ? "font-tamil" : ""}`}>{t("customers")}</span>} />

      <div className="px-4 pt-4 pb-2 bg-background sticky top-14 z-20">
        <div className="relative">
          <Search className="size-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchCustomers")}
            className={`w-full h-12 pl-12 pr-4 rounded-[1.25rem] bg-muted border border-transparent focus:bg-card focus:border-primary focus:outline-none text-base shadow-sm transition-all ${ta ? "font-tamil placeholder:font-tamil" : ""}`}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mt-4 pb-2">
          {tabs.map((tItem) => {
            const active = tab === tItem.id;
            let dot = "";
            if (tItem.id === "pending") dot = "bg-pending";
            else if (tItem.id === "partial") dot = "bg-partial-foreground";
            else if (tItem.id === "settled") dot = "bg-primary";
            else if (tItem.id === "overdue") dot = "bg-destructive";

            return (
              <button
                key={tItem.id}
                onClick={() => setTab(tItem.id)}
                className={`whitespace-nowrap px-4 h-9 rounded-full text-sm font-semibold transition-all border flex items-center gap-1.5 ${
                  active
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                } ${ta ? "font-tamil" : ""}`}
              >
                {dot && <span className={`size-2 rounded-full ${dot} ${active ? "opacity-100" : "opacity-60"}`} />}
                {tItem.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-2 space-y-2.5 pb-24">
        {filtered.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="size-20 mx-auto rounded-3xl bg-muted flex items-center justify-center text-4xl shadow-sm border border-black/5">📒</div>
            <p className={`mt-5 text-lg font-bold font-display ${ta ? "font-tamil" : ""}`}>{t("noCustomers")}</p>
            <p className={`mt-1.5 text-sm font-medium text-muted-foreground ${ta ? "font-tamil" : ""}`}>{t("addFirst")}</p>
          </div>
        )}

        {filtered.map((c, i) => {
          const bal = balanceOf(c);
          const status = statusOf(c);
          const overdue = isOverdue(c);

          return (
            <Link
              key={c.id}
              to="/customers/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 bg-card rounded-[1.25rem] border border-border p-3.5 shadow-card press-scale animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Avatar name={c.name} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-base font-display">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                  {c.phone || (ta ? "தொலைபேசி இல்லை" : "No phone")}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold text-money ${
                  status === "pending" ? "text-pending" : status === "partial" ? "text-partial-foreground" : "text-primary"
                }`}>
                  {formatMoney(Math.abs(bal))}
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {overdue && <Flame className="size-3 text-pending" fill="currentColor" />}
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

      {/* Floating add */}
      <Link
        to="/customers/new"
        className="fixed bottom-24 right-6 sm:right-10 lg:right-20 size-14 rounded-2xl bg-primary text-primary-foreground shadow-pop flex items-center justify-center press-scale z-30"
      >
        <Plus className="size-6" strokeWidth={2.6} />
      </Link>
    </PhoneShell>
  );
}
