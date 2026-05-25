import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

type SettingsCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  shopName: string;
  setShopName: (n: string) => void;
  shopPhone: string;
  setShopPhone: (p: string) => void;
  upiId: string;
  setUpiId: (id: string) => void;
  canPrice: number;
  setCanPrice: (p: number) => void;
  pinHash: string | null;
  setPinHash: (h: string | null) => void;
  isPinSetup: boolean;
  isUnlocked: boolean;
  setUnlocked: (v: boolean) => void;
};

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [shopName, setShopNameState] = useState("Subramaniyan Stores");
  const [shopPhone, setShopPhoneState] = useState("+91 98765 43210");
  const [upiId, setUpiIdState] = useState("");
  const [canPrice, setCanPriceState] = useState(30);
  const [pinHash, setPinHashState] = useState<string | null>(null);
  const [isUnlocked, setUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("bb_theme") as Theme;
    if (savedTheme) setThemeState(savedTheme);

    const savedShopName = localStorage.getItem("bb_shopName");
    if (savedShopName) setShopNameState(savedShopName);

    const savedShopPhone = localStorage.getItem("bb_shopPhone");
    if (savedShopPhone) setShopPhoneState(savedShopPhone);

    const savedUpiId = localStorage.getItem("bb_upiId");
    if (savedUpiId) setUpiIdState(savedUpiId);

    const savedCanPrice = localStorage.getItem("bb_canPrice");
    if (savedCanPrice) setCanPriceState(parseInt(savedCanPrice, 10));

    const savedPinHash = localStorage.getItem("bb_pinHash");
    if (savedPinHash) {
      setPinHashState(savedPinHash);
    } else {
      setUnlocked(true); // If no PIN, always unlocked
    }

    // Check session storage if already unlocked in this tab
    if (sessionStorage.getItem("bb_unlocked") === "true") {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      if (systemTheme === 'dark') {
          root.classList.add('dark');
      }
    } else {
      root.classList.add(theme);
    }
  }, [theme, mounted]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("bb_theme", t);
  };

  const setShopName = (n: string) => {
    setShopNameState(n);
    localStorage.setItem("bb_shopName", n);
  };

  const setShopPhone = (p: string) => {
    setShopPhoneState(p);
    localStorage.setItem("bb_shopPhone", p);
  };

  const setUpiId = (id: string) => {
    setUpiIdState(id);
    localStorage.setItem("bb_upiId", id);
  };

  const setCanPrice = (p: number) => {
    setCanPriceState(p);
    localStorage.setItem("bb_canPrice", p.toString());
  };

  const setPinHash = (h: string | null) => {
    setPinHashState(h);
    if (h) {
      localStorage.setItem("bb_pinHash", h);
      setUnlocked(false);
      sessionStorage.removeItem("bb_unlocked");
    } else {
      localStorage.removeItem("bb_pinHash");
      setUnlocked(true);
      sessionStorage.removeItem("bb_unlocked");
    }
  };

  const handleSetUnlocked = (v: boolean) => {
    setUnlocked(v);
    if (v) {
      sessionStorage.setItem("bb_unlocked", "true");
    } else {
      sessionStorage.removeItem("bb_unlocked");
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        shopName,
        setShopName,
        shopPhone,
        setShopPhone,
        upiId,
        setUpiId,
        canPrice,
        setCanPrice,
        pinHash,
        setPinHash,
        isPinSetup: !!pinHash,
        isUnlocked,
        setUnlocked: handleSetUnlocked,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

// Simple hash utility (not crypto secure but enough for a simple shop app)
export async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin + "kadai"); // salt
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
