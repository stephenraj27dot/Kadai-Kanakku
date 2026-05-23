import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ta";

const dict = {
  en: {
    appName: "Baki Book",
    tagline: "Your shop's pocket khata",
    chooseLanguage: "Choose your language",
    continue: "Continue",
    dashboard: "Dashboard",
    customers: "Customers",
    settings: "Settings",
    totalPending: "Total Pending",
    pendingCustomers: "Pending Customers",
    partialPaid: "Partially Paid",
    settledToday: "Settled Today",
    recent: "Recent Activity",
    seeAll: "See all",
    addCustomer: "Add Customer",
    name: "Name",
    phone: "Phone (optional)",
    address: "Address (optional)",
    notes: "Notes (optional)",
    openingBalance: "Opening pending amount",
    save: "Save",
    addBalance: "Add Balance",
    recordPayment: "Record Payment",
    amount: "Amount",
    note: "Note (optional)",
    remaining: "Remaining balance",
    history: "Transaction history",
    settled: "Settled",
    pending: "Pending",
    gave: "Pending added",
    got: "Payment received",
    noCustomers: "No customers yet",
    addFirst: "Add your first customer to start tracking baki",
    language: "Language",
    appLock: "App Lock",
    appLockDesc: "Require PIN to open the app",
    setupPin: "Setup PIN",
    enterPin: "Enter PIN",
    wrongPin: "Incorrect PIN",
    pinHint: "Enter your 4-digit PIN",
    backup: "Backup",
    backupDesc: "Last backed up just now",
    backupNow: "Backup now",
    rupees: "₹",
    you: "You",
    call: "Call",
    remind: "Remind via WhatsApp",
    searchCustomers: "Search customers",
    confirm: "Confirm",
    paidInFull: "Paid in full",
    addAmount: "How much did they take?",
    payAmount: "How much did they pay?",
    skip: "Skip",
    getStarted: "Get started",
    backupHint: "Saved locally on this device",
    exportPdf: "Export PDF",
    pdfStatement: "Download Statement",
    filterAll: "All",
    filterPending: "Pending",
    filterSettled: "Settled",
    filterOverdue: "Overdue",
    filterPartial: "Partial",
    overdue: "Overdue",
    shopName: "Shop Name",
    shopPhone: "Shop Phone",
    editProfile: "Edit Profile",
    deleteCustomer: "Delete Customer",
    undoDelete: "Undo",
    confirmDelete: "Are you sure you want to delete this customer?",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    theme: "Theme",
    systemTheme: "System Default",
    lastPaid: "Last paid",
    neverPaid: "Never paid",
    daysAgo: "days ago"
  },
  ta: {
    appName: "பாக்கி புத்தகம்",
    tagline: "உங்கள் கடையின் கைப்பேசி கணக்கு",
    chooseLanguage: "மொழியை தேர்ந்தெடுக்கவும்",
    continue: "தொடரவும்",
    dashboard: "முகப்பு",
    customers: "வாடிக்கையாளர்கள்",
    settings: "அமைப்புகள்",
    totalPending: "மொத்த பாக்கி",
    pendingCustomers: "பாக்கி பேர்",
    partialPaid: "கொஞ்சம் கட்டியவர்கள்",
    settledToday: "இன்று கட்டியது",
    recent: "சமீபத்தியவை",
    seeAll: "எல்லாம் பார்",
    addCustomer: "புதிய பேர்",
    name: "பெயர்",
    phone: "தொலைபேசி (விரும்பினால்)",
    address: "முகவரி (விரும்பினால்)",
    notes: "குறிப்பு (விரும்பினால்)",
    openingBalance: "ஆரம்ப பாக்கி",
    save: "சேமிக்கவும்",
    addBalance: "பாக்கி சேர்",
    recordPayment: "பணம் பெற்றது",
    amount: "தொகை",
    note: "குறிப்பு (விரும்பினால்)",
    remaining: "மீதி",
    history: "பரிவர்த்தனைகள்",
    settled: "முடிந்தது",
    pending: "பாக்கி",
    gave: "பாக்கி சேர்க்கப்பட்டது",
    got: "பணம் பெற்றது",
    noCustomers: "வாடிக்கையாளர் இல்லை",
    addFirst: "பாக்கி கணக்கு வைக்க முதல் பேரை சேர்க்கவும்",
    language: "மொழி",
    appLock: "ஆப் பூட்டு",
    appLockDesc: "ஆப் திறக்க PIN கேட்கும்",
    setupPin: "PIN அமை",
    enterPin: "PIN உள்ளிடுக",
    wrongPin: "தவறான PIN",
    pinHint: "உங்கள் 4-இலக்க PIN-ஐ உள்ளிடுக",
    backup: "காப்பு",
    backupDesc: "இப்போது தான் காப்பு எடுக்கப்பட்டது",
    backupNow: "இப்போது காப்பு எடு",
    rupees: "₹",
    you: "நீங்கள்",
    call: "அழை",
    remind: "WhatsApp-ல் நினைவூட்டு",
    searchCustomers: "பெயர் தேடவும்",
    confirm: "உறுதி செய்",
    paidInFull: "முழுவதும் கட்டியது",
    addAmount: "எவ்வளவு எடுத்தார்?",
    payAmount: "எவ்வளவு கட்டினார்?",
    skip: "தவிர்",
    getStarted: "தொடங்கவும்",
    backupHint: "இந்த ஃபோனில் சேமிக்கப்பட்டது",
    exportPdf: "PDF எடு",
    pdfStatement: "கணக்கு விவரம்",
    filterAll: "எல்லாம்",
    filterPending: "பாக்கி",
    filterSettled: "முடிந்தது",
    filterOverdue: "ரொம்ப நாள்",
    filterPartial: "கொஞ்சம்",
    overdue: "காலதாமதம்",
    shopName: "கடை பெயர்",
    shopPhone: "கடை எண்",
    editProfile: "விவரம் மாற்று",
    deleteCustomer: "நீக்கு",
    undoDelete: "திருப்பு",
    confirmDelete: "நிச்சயமாக நீக்க வேண்டுமா?",
    darkMode: "டார்க் மோட்",
    lightMode: "லைட் மோட்",
    theme: "நிறம்",
    systemTheme: "சிஸ்டம் பொறுத்து",
    lastPaid: "கடைசியாக கட்டியது",
    neverPaid: "கட்டவே இல்லை",
    daysAgo: "நாட்களுக்கு முன்"
  },
} as const;

type Dict = typeof dict.en;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof Dict) => string };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("bb_lang")) as Lang | null;
    if (saved === "en" || saved === "ta") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("bb_lang", l);
  };

  const t = (k: keyof Dict) => dict[lang][k];
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function formatMoney(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
