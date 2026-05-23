import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { PhoneShell, TopBar } from "@/components/PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { Phone, ArrowDownLeft, ArrowUpRight, Minus, Plus, MessageCircle, FileText, Trash2, MapPin, AlignLeft, Flame } from "lucide-react";
import { Avatar } from "./dashboard";
import { openWhatsAppReminder } from "@/lib/whatsapp";
import { generateCustomerStatementPdf } from "@/lib/pdf";

export const Route = createFileRoute("/customers/$id")({
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { getCustomer, balanceOf, statusOf, deleteCustomer } = useStore();
  const { shopName, shopPhone } = useSettings();
  const navigate = useNavigate();
  
  const c = getCustomer(id);

  if (!c) return <Navigate to="/customers" />;

  const bal = balanceOf(c);
  const status = statusOf(c);
  const sortedTxns = [...c.txns].sort((a, b) => b.at - a.at);

  // Compute running balance for history
  const historyWithBal = [];
  let running = 0;
  // Calculate forwards
  const forwardTxns = [...c.txns].sort((a, b) => a.at - b.at);
  const runningBals = forwardTxns.map(tx => {
    running += tx.type === "debit" ? tx.amount : -tx.amount;
    return running;
  });
  // Map backwards
  for (let i = 0; i < sortedTxns.length; i++) {
    const originalIndex = forwardTxns.findIndex(t => t.id === sortedTxns[i].id);
    historyWithBal.push({ ...sortedTxns[i], runningBal: runningBals[originalIndex] });
  }

  // Last paid date
  const lastPaidTxn = forwardTxns.slice().reverse().find(t => t.type === "credit");
  const lastPaidStr = lastPaidTxn 
    ? `${Math.floor((Date.now() - lastPaidTxn.at) / 86400000)} ${t("daysAgo")}`
    : t("neverPaid");

  // Overdue check
  let isOverdue = false;
  if (status !== "settled") {
    const pendingTxns = forwardTxns.filter(t => t.type === "debit");
    if (pendingTxns.length > 0) {
      const oldest = pendingTxns[0].at;
      if (Date.now() - oldest > 30 * 86400000) isOverdue = true;
    }
  }

  const handleDelete = () => {
    if (confirm(t("confirmDelete"))) {
      deleteCustomer(c.id);
      navigate({ to: "/customers" });
    }
  };

  const handlePdf = () => {
    generateCustomerStatementPdf(c, bal, shopName, shopPhone, lang);
  };

  const handleWhatsApp = () => {
    if (!c.phone) return;
    openWhatsAppReminder(c.phone, lang, c.name, bal, shopName);
  };

  return (
    <PhoneShell hideNav>
      <TopBar
        title={<span className="truncate font-display">{c.name}</span>}
        back="/customers"
        right={
          <div className="flex items-center gap-1">
            {c.phone && (
              <a href={`tel:${c.phone}`} className="size-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                <Phone className="size-5 text-primary" />
              </a>
            )}
            <button onClick={handleDelete} className="size-10 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors text-destructive">
              <Trash2 className="size-5" />
            </button>
          </div>
        }
      />

      {/* Balance hero */}
      <div className="px-4 pt-4 animate-fade-in-up">
        <div className={`rounded-[1.5rem] p-6 text-center shadow-card border ${
          status === "pending" ? "bg-pending/5 border-pending/20" : 
          status === "partial" ? "bg-partial/10 border-partial/20" : 
          "bg-primary/5 border-primary/20"
        }`}>
          <div className="flex flex-col items-center justify-center gap-3">
            <Avatar name={c.name} size={64} />
            <div>
              <div className="font-bold text-xl leading-tight font-display">{c.name}</div>
              {c.phone && <div className="text-sm text-muted-foreground font-medium mt-1">{c.phone}</div>}
              
              {(c.address || c.notes) && (
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {c.address && <span className="flex items-center gap-1"><MapPin className="size-3" /> {c.address}</span>}
                  {c.notes && <span className="flex items-center gap-1"><AlignLeft className="size-3" /> {c.notes}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <p className={`text-sm font-semibold ${ta ? "font-tamil" : ""} text-muted-foreground flex items-center gap-1.5`}>
              {isOverdue && <Flame className="size-4 text-pending" fill="currentColor" />}
              {bal > 0 ? t("remaining") : t("paidInFull")}
            </p>
            <p className={`text-5xl font-bold mt-1 tracking-tight text-money ${
              status === "pending" ? "text-pending" : 
              status === "partial" ? "text-partial-foreground" : 
              "text-primary"
            }`}>
              {formatMoney(Math.abs(bal))}
            </p>
            <div className="mt-2 text-xs font-medium text-muted-foreground">
              {t("lastPaid")}: {lastPaidStr}
            </div>

            {status === "settled" && (
              <span className={`inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary ${ta ? "font-tamil" : ""}`}>
                ✓ {t("settled")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-5 grid grid-cols-2 gap-3 animate-fade-in-up stagger-item">
        <Link
          to="/customers/$id/add"
          params={{ id }}
          className="h-14 rounded-2xl bg-pending text-pending-foreground font-bold shadow-soft press-scale flex items-center justify-center gap-2"
        >
          <Plus className="size-5" strokeWidth={2.6} />
          <span className={ta ? "font-tamil" : ""}>{t("addBalance")}</span>
        </Link>
        <Link
          to="/customers/$id/pay"
          params={{ id }}
          className="h-14 rounded-2xl bg-primary text-primary-foreground font-bold shadow-soft press-scale flex items-center justify-center gap-2"
        >
          <Minus className="size-5" strokeWidth={2.6} />
          <span className={ta ? "font-tamil" : ""}>{t("recordPayment")}</span>
        </Link>
      </div>

      {/* Utilities */}
      <div className="px-4 mt-3 grid grid-cols-2 gap-3 animate-fade-in-up stagger-item">
        <button 
          onClick={handleWhatsApp}
          disabled={!c.phone || bal <= 0}
          className="h-12 rounded-2xl bg-card border border-border font-semibold flex items-center justify-center gap-2 press-scale disabled:opacity-50"
        >
          <MessageCircle className="size-4 text-[#25D366]" />
          <span className={`text-sm ${ta ? "font-tamil" : ""}`}>{t("remind")}</span>
        </button>
        <button 
          onClick={handlePdf}
          className="h-12 rounded-2xl bg-card border border-border font-semibold flex items-center justify-center gap-2 press-scale"
        >
          <FileText className="size-4 text-muted-foreground" />
          <span className={`text-sm ${ta ? "font-tamil" : ""}`}>{t("exportPdf")}</span>
        </button>
      </div>

      {/* History */}
      <div className="px-4 mt-8 pb-10 animate-fade-in-up stagger-item">
        <h2 className={`text-base font-bold mb-4 font-display ${ta ? "font-tamil" : ""}`}>{t("history")}</h2>
        
        {historyWithBal.length === 0 && (
          <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
            <p className={`text-sm text-muted-foreground font-medium ${ta ? "font-tamil" : ""}`}>
              {ta ? "பரிவர்த்தனை இல்லை" : "No transactions yet"}
            </p>
          </div>
        )}

        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[1.375rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
          {historyWithBal.map((tx) => {
            const isDebit = tx.type === "debit";
            return (
              <div key={tx.id} className="relative flex items-center gap-4 bg-card rounded-2xl border border-border p-3.5 shadow-sm">
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-card ${
                  isDebit ? "bg-pending/10 text-pending" : "bg-primary/10 text-primary"
                }`}>
                  {isDebit ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${ta ? "font-tamil" : ""}`}>
                    {tx.note || (isDebit ? t("gave") : t("got"))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                    {formatTime(tx.at)}
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <div className={`text-base font-bold text-money ${isDebit ? "text-pending" : "text-primary"}`}>
                    {isDebit ? "+" : "−"}{formatMoney(tx.amount)}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    Bal: {formatMoney(Math.max(0, tx.runningBal))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PhoneShell>
  );
}

function formatTime(at: number) {
  const d = new Date(at);
  const now = Date.now();
  const diff = (now - at) / 1000;
  if (diff < 3600) return Math.max(1, Math.floor(diff / 60)) + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
