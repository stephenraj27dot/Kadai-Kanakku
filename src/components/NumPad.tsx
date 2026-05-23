import { Delete } from "lucide-react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  onQuickAdd?: (amount: number) => void;
};

export function NumPad({ value, onChange, onQuickAdd }: Props) {
  const handleTap = (key: string) => {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
      return;
    }
    
    // Prevent multiple leading zeros or too many digits
    if (value === "0" && key !== "00") {
      onChange(key);
      return;
    }
    if (value === "" && key === "00") {
      onChange("0");
      return;
    }
    if (value.length > 7) return; // limit to 99 lakhs
    
    onChange(value + key);
  };

  const quickAmounts = [10, 50, 100, 500];

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Quick Add row */}
      {onQuickAdd && (
        <div className="flex gap-2 justify-center pb-2">
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

      {/* NumPad Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0"].map((btn) => (
          <button
            key={btn}
            type="button"
            onClick={() => handleTap(btn)}
            className="h-14 sm:h-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center text-2xl font-bold font-display press-scale hover:bg-muted transition-colors"
          >
            {btn}
          </button>
        ))}
        
        {/* Backspace Button */}
        <button
          type="button"
          onClick={() => handleTap("backspace")}
          className="h-14 sm:h-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground press-scale hover:bg-muted transition-colors"
        >
          <Delete className="size-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
