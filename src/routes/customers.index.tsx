import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell, TopBar } from "@/components/PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore, type Customer } from "@/lib/store";
import { Plus, Search, Flame } from "lucide-react";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/customers/")({
  component: CustomersList,
  validateSearch: (s: Record<string, unknown>): { filter?: string } => ({
    filter: (s.filter as string) || undefined,
  }),
});

type FilterTab = "all" | "pending" | "partial" | "settled" | "overdue" | "today";

function CustomersList() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { customers, balanceOf, statusOf } = useStore();
  const [q, setQ] = useState("");
  const search = useSearch({ from: "/customers/" });
  const [tab, setTab] = useState<FilterTab>((search.filter as FilterTab) || "all");

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
      if (tab === "pending") return balanceOf(c) > 0;
      if (tab === "today") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return c.txns.some(t => t.type === "credit" && t.at >= startOfDay.getTime());
      }
      return statusOf(c) === tab;
    })
    .sort((a, b) => balanceOf(b) - balanceOf(a));

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "pending", label: t("filterPending") },
    { id: "partial", label: t("filterPartial") },
    { id: "today", label: ta ? "இன்று" : "Today" },
    { id: "settled", label: t("filterSettled") },
    { id: "overdue", label: t("filterOverdue") },
  ];

  return (
    <PhoneShell>
      <TopBar title={<span className={`font-black font-display tracking-tight ${ta ? "font-tamil" : ""}`}>{t("customers")}</span>} />

      <div className="px-4 pt-4 pb-2 bg-background sticky top-14 z-20 transition-none">
        <div className="relative group">
          <Search className="size-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchCustomers")}
            className={`w-full h-12 pl-12 pr-4 rounded-2xl bg-muted border-2 border-transparent focus:bg-card focus:border-primary/30 focus:outline-none text-base shadow-sm transition-all ${ta ? "font-tamil placeholder:font-tamil" : ""}`}
          />
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-2 mt-4 pb-2">
          {tabs.map((tItem) => {
            const active = tab === tItem.id;
            let dot = "";
            if (tItem.id === "pending") dot = "bg-[#F59E0B]";
            else if (tItem.id === "partial") dot = "bg-[#F59E0B]";
            else if (tItem.id === "today") dot = "bg-primary";
            else if (tItem.id === "settled") dot = "bg-primary";
            else if (tItem.id === "overdue") dot = "bg-destructive";

            return (
              <button
                key={tItem.id}
                onClick={() => setTab(tItem.id)}
                className={`whitespace-nowrap px-4 h-9 rounded-full text-xs font-black uppercase tracking-wider transition-all border-2 flex items-center gap-1.5 ${
                  active
                    ? "bg-foreground text-background border-foreground shadow-md"
                    : "bg-card text-muted-foreground border-border/50 hover:bg-muted"
                } ${ta ? "font-tamil" : ""}`}
              >
                {dot && <span className={`size-2 rounded-full ${dot} ${active ? "opacity-100" : "opacity-60"}`} />}
                {tItem.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-2 space-y-3 pb-28">
        {filtered.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="size-20 mx-auto rounded-3xl bg-muted flex items-center justify-center text-4xl shadow-inner border border-black/5">📒</div>
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
              className="flex items-center gap-4 bg-card rounded-[1.5rem] border border-border/60 p-4 shadow-sm press-scale animate-in-list"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Avatar name={c.name} size={52} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-base text-foreground leading-tight">{c.name}</div>
                <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">
                  {c.phone || (ta ? "சேமிக்கப்பட்டது" : "SAVED")}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-black text-money text-base ${
                  status === "pending"
                    ? "text-[#EF4444]"
                    : status === "partial"
                      ? "text-[#F59E0B]"
                      : "text-primary"
                }`}>
                  {formatMoney(Math.abs(bal))}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1.5">
                  {overdue && <Flame className="size-3 text-[#F59E0B]" fill="currentColor" />}
                  <div className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full badge-${status}`}>
                    {status === "settled"
                      ? (ta ? "✓ முடிந்தது" : "✓ SETTLED")
                      : status === "partial"
                        ? (ta ? "கொஞ்சம் பாக்கி" : "PARTIAL BAKI")
                        : (ta ? "பாக்கி" : "BAKI")}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        to="/customers/new"
        className="fixed bottom-24 right-6 size-16 rounded-[1.75rem] bg-primary text-primary-foreground shadow-pop flex items-center justify-center press-scale z-30 transition-transform active:rotate-90"
      >
        <Plus className="size-8" strokeWidth={3} />
      </Link>
    </PhoneShell>
  );
}
