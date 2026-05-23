import { useState } from "react";
import { PhoneShell, TopBar } from "./PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore, type Customer } from "@/lib/store";

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

  const quick = [50, 100, 200, 500, 1000];
  const bal = balanceOf(customer);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return;
    onSubmit(n, note.trim() || undefined);
  };

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

      <form onSubmit={submit} className="px-5 pt-6 pb-8">
        <p className={`text-sm font-medium text-muted-foreground ${ta ? "font-tamil" : ""}`}>{prompt}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${tone === "pending" ? "text-pending" : "text-primary"}`}>₹</span>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={`flex-1 bg-transparent outline-none text-5xl font-bold tracking-tight ${
              tone === "pending" ? "text-pending placeholder:text-pending/30" : "text-primary placeholder:text-primary/30"
            }`}
          />
        </div>
        <div className="mt-1 h-px bg-border" />

        <div className="mt-5 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String((Number(amount) || 0) + q))}
              className="px-4 h-10 rounded-full bg-muted text-sm font-semibold active:scale-95 transition-transform"
            >
              +₹{q}
            </button>
          ))}
        </div>

        <label className="block mt-7">
          <span className={`text-sm font-medium text-muted-foreground ${ta ? "font-tamil" : ""}`}>{t("note")}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={ta ? "உதா: அரிசி, எண்ணெய்" : "e.g. Rice, oil"}
            className={`mt-2 w-full h-14 px-4 rounded-2xl bg-card border border-border focus:border-primary focus:outline-none text-base ${ta ? "placeholder:font-tamil" : ""}`}
          />
        </label>

        <button
          type="submit"
          disabled={!amount || Number(amount) <= 0}
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
