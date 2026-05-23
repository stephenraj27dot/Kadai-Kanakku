import { useState } from "react";
import { PhoneShell, TopBar } from "./PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore, type Customer } from "@/lib/store";
import { NumPad } from "./NumPad";
import { FileText } from "lucide-react";

type Props = {
  kind: "debit" | "credit";
  customer: Customer;
  onSubmit: (amount: number, note?: string) => void;
  back: string;
};

export function TxnForm({ kind, customer, onSubmit, back }: Props) {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { balanceOf } = useStore();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const isDebit = kind === "debit";

  const title = isDebit ? t("addBalance") : t("recordPayment");
  const prompt = isDebit ? t("addAmount") : t("payAmount");
  const tone = isDebit ? "pending" : "primary";

  const [showNote, setShowNote] = useState(false);

  const bal = balanceOf(customer);

  const evaluateMath = (expr: string) => {
    try {
      const clean = expr.replace(/[+\-]+$/, "");
      if (!clean) return 0;
      const res = Function(`'use strict'; return (${clean})`)();
      return Number.isFinite(res) && res > 0 ? res : 0;
    } catch (e) {
      return 0;
    }
  };

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const n = evaluateMath(amount);
    if (!n || n <= 0) return;
    onSubmit(n, note.trim() || undefined);
  };

  const liveTotal = evaluateMath(amount);
  const hasOperator = amount.includes("+") || amount.includes("-");

  return (
    <PhoneShell hideNav>
      <TopBar title={<span className={ta ? "font-tamil" : ""}>{title}</span>} back={back} />

      <div className="px-5 pt-3">
        <div className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between shadow-card">
          <div>
            <div className="text-sm text-muted-foreground">{customer.name}</div>
            <div className={`text-xs mt-0.5 ${ta ? "font-tamil" : ""} ${bal > 0 ? "text-pending" : "text-primary"}`}>
              {bal > 0 ? t("remaining") : t("settled")}
            </div>
          </div>
          <div className={`text-xl font-bold ${bal > 0 ? "text-pending" : "text-primary"}`}>
            {formatMoney(Math.abs(bal))}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="px-5 pt-6 pb-8 flex flex-col min-h-[calc(100vh-140px)]">
        <div>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium text-muted-foreground ${ta ? "font-tamil" : ""}`}>{prompt}</p>
            {hasOperator && liveTotal > 0 && (
              <div className={`text-sm font-bold animate-fade-in ${tone === "pending" ? "text-pending" : "text-primary"}`}>
                = {formatMoney(liveTotal)}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2 overflow-x-auto pb-1">
            <span className={`text-4xl font-bold ${tone === "pending" ? "text-pending" : "text-primary"}`}>₹</span>
            <div className={`flex-1 text-5xl font-bold tracking-tight ${!amount ? (tone === "pending" ? "text-pending/30" : "text-primary/30") : (tone === "pending" ? "text-pending" : "text-primary")}`}>
              {amount || "0"}
            </div>
          </div>
          <div className="mt-1 h-px bg-border" />
        </div>

        <div className="mt-6 flex-1 flex flex-col justify-end gap-6">
          <NumPad
            value={amount}
            onChange={setAmount}
            onCalculate={submit}
            onQuickAdd={(q) => {
              const current = evaluateMath(amount);
              setAmount(String(current + q));
            }}
          />

          {!showNote ? (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className={`flex items-center justify-center gap-2 h-12 rounded-2xl bg-card border border-border text-muted-foreground font-semibold press-scale ${ta ? "font-tamil" : ""}`}
            >
              <FileText className="size-4" /> {ta ? "குறிப்பு எழுது (தேவைப்பட்டால்)" : "Add Note (Optional)"}
            </button>
          ) : (
            <label className="block animate-fade-in-up">
              <span className={`text-sm font-medium text-muted-foreground ${ta ? "font-tamil" : ""}`}>{t("note")}</span>
              <input
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={ta ? "உதா: அரிசி, எண்ணெய்" : "e.g. Rice, oil"}
                className={`mt-2 w-full h-14 px-4 rounded-2xl bg-card border border-border focus:border-primary focus:outline-none text-base ${ta ? "placeholder:font-tamil" : ""}`}
              />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={!amount || liveTotal <= 0}
          className={`mt-8 w-full h-14 rounded-2xl text-lg font-semibold shadow-soft active:scale-[0.98] transition-transform disabled:opacity-40 ${
            tone === "pending" ? "bg-pending text-pending-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          <span className={ta ? "font-tamil" : ""}>{t("confirm")}</span>
        </button>
      </form>
    </PhoneShell>
  );
}
