import { Delete } from "lucide-react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  onQuickAdd?: (amount: number) => void;
  onCalculate?: () => void;
};

export function NumPad({ value, onChange, onQuickAdd, onCalculate }: Props) {
  const handleTap = (key: string) => {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
      return;
    }
    
    if (key === "C") {
      onChange("");
      return;
    }

    if (key === "=") {
      if (onCalculate) onCalculate();
      return;
    }

    // Handle operators
    if (key === "+" || key === "-") {
      if (!value) return; // Don't start with operator
      const lastChar = value.slice(-1);
      if (lastChar === "+" || lastChar === "-") {
        // Replace last operator
        onChange(value.slice(0, -1) + key);
        return;
      }
      onChange(value + key);
      return;
    }
    
    // Prevent multiple leading zeros
    const parts = value.split(/[+\-]/);
    const lastPart = parts[parts.length - 1];

    if (lastPart === "0" && key !== "00") {
      // Replace the 0 with the new number
      onChange(value.slice(0, -1) + key);
      return;
    }
    if (lastPart === "" && key === "00") {
      onChange(value + "0");
      return;
    }
    if (lastPart.length > 6) return; // limit single number length to prevent overflow
    
    onChange(value + key);
  };

  const quickAmounts = [10, 50, 100, 500];

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4 select-none">
      {/* Quick Add row */}
      {onQuickAdd && (
        <div className="flex gap-2 justify-center pb-1">
          {quickAmounts.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onQuickAdd(q)}
              className="flex-1 h-12 rounded-2xl bg-muted/50 text-muted-foreground font-semibold text-base sm:text-lg press-scale border border-border/50"
            >
              +{q}
            </button>
          ))}
        </div>
      )}

      {/* Calculator NumPad Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* Row 1 */}
        {["1", "2", "3"].map((btn) => (
          <button key={btn} type="button" onClick={() => handleTap(btn)} className="numpad-btn">{btn}</button>
        ))}
        <button type="button" onClick={() => handleTap("backspace")} className="numpad-btn text-destructive bg-destructive/10 border-destructive/20 hover:bg-destructive/20">
          <Delete className="size-6" strokeWidth={2.5} />
        </button>

        {/* Row 2 */}
        {["4", "5", "6"].map((btn) => (
          <button key={btn} type="button" onClick={() => handleTap(btn)} className="numpad-btn">{btn}</button>
        ))}
        <button type="button" onClick={() => handleTap("+")} className="numpad-btn text-primary bg-primary/10 border-primary/20 hover:bg-primary/20 text-3xl pb-1">+</button>

        {/* Row 3 */}
        {["7", "8", "9"].map((btn) => (
          <button key={btn} type="button" onClick={() => handleTap(btn)} className="numpad-btn">{btn}</button>
        ))}
        <button type="button" onClick={() => handleTap("-")} className="numpad-btn text-pending bg-pending/10 border-pending/20 hover:bg-pending/20 text-4xl pb-2">-</button>

        {/* Row 4 */}
        <button type="button" onClick={() => handleTap("C")} className="numpad-btn text-muted-foreground bg-muted/50 font-medium text-xl">C</button>
        {["0", "00"].map((btn) => (
          <button key={btn} type="button" onClick={() => handleTap(btn)} className="numpad-btn">{btn}</button>
        ))}
        <button type="button" onClick={() => handleTap("=")} className="numpad-btn text-white bg-primary border-primary shadow-soft hover:bg-primary/90 text-3xl pb-1">=</button>
      </div>

      <style>{`
        .numpad-btn {
          height: 64px;
          border-radius: 16px;
          background-color: var(--color-card);
          border: 1px solid var(--color-border);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-center: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          font-family: var(--font-display);
          transition: transform 0.1s, background-color 0.15s;
        }
        .numpad-btn:active {
          transform: scale(0.92);
        }
      `}</style>
    </div>
  );
}
