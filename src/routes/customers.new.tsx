import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell, TopBar } from "@/components/PhoneShell";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/customers/new")({
  component: AddCustomer,
});

function AddCustomer() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const { addCustomer } = useStore();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [opening, setOpening] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const n = Number(opening);
    const id = await addCustomer({ 
      name: name.trim(), 
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      opening: n > 0 ? n : undefined 
    });
    if (id) {
      navigate({ to: "/customers/$id", params: { id } });
    }
  };

  return (
    <PhoneShell hideNav>
      <TopBar title={<span className={`font-display ${ta ? "font-tamil" : ""}`}>{t("addCustomer")}</span>} back="/dashboard" />
      <form onSubmit={submit} className="px-5 pt-6 pb-8 space-y-5 animate-fade-in-up">
        <label className="block">
          <span className={`text-sm font-semibold text-muted-foreground ${ta ? "font-tamil" : ""}`}>
            {t("name")} <span className="text-destructive">*</span>
          </span>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-2 w-full h-14 px-4 rounded-2xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base shadow-sm ${ta ? "font-tamil" : ""}`}
            placeholder={ta ? "உதா: முருகன் அண்ணா" : "e.g. Murugan Anna"}
          />
        </label>

        <label className="block stagger-item">
          <span className={`text-sm font-semibold text-muted-foreground ${ta ? "font-tamil" : ""}`}>{t("phone")}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`mt-2 w-full h-14 px-4 rounded-2xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base shadow-sm ${ta ? "font-tamil" : ""}`}
            placeholder="00000 00000"
          />
        </label>

        <div className="grid grid-cols-2 gap-4 stagger-item">
          <label className="block">
            <span className={`text-sm font-semibold text-muted-foreground ${ta ? "font-tamil" : ""}`}>{t("address")}</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`mt-2 w-full h-14 px-4 rounded-2xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base shadow-sm ${ta ? "font-tamil" : ""}`}
              placeholder={ta ? "ஊர் / தெரு" : "City / Street"}
            />
          </label>
          <label className="block">
            <span className={`text-sm font-semibold text-muted-foreground ${ta ? "font-tamil" : ""}`}>{t("notes")}</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`mt-2 w-full h-14 px-4 rounded-2xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base shadow-sm ${ta ? "font-tamil" : ""}`}
              placeholder={ta ? "சிறப்பு குறிப்பு" : "Any details"}
            />
          </label>
        </div>

        <label className="block stagger-item pt-2">
          <span className={`text-sm font-semibold text-muted-foreground ${ta ? "font-tamil" : ""}`}>{t("openingBalance")}</span>
          <div className="mt-2 relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground`}>₹</span>
            <input
              type="number"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              className="w-full h-14 pl-8 pr-4 rounded-2xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-bold shadow-sm"
              placeholder="0"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-8 w-full h-14 rounded-2xl bg-primary text-primary-foreground text-lg font-bold shadow-soft press-scale disabled:opacity-50 disabled:active:scale-100 transition-all stagger-item"
        >
          <span className={ta ? "font-tamil" : ""}>{t("save")}</span>
        </button>
      </form>
    </PhoneShell>
  );
}
