import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n, formatMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { ChevronLeft, BarChart3, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: Reports,
});

function Reports() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const navigate = useNavigate();
  const { totals } = useStore();
  
  const { pending, salesToday, settledToday, salesThisMonth, settledThisMonth } = totals();
  const bakiToday = Math.max(0, salesToday - settledToday);
  const bakiThisMonth = Math.max(0, salesThisMonth - settledThisMonth);

  return (
    <PhoneShell hideNav>
      <div className="bg-primary px-5 pt-12 pb-8 text-primary-foreground rounded-b-3xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <button onClick={() => navigate({ to: '/dashboard' })} className="mb-4 flex items-center gap-1 text-sm opacity-80 press-scale relative z-10">
          <ChevronLeft className="size-4" /> <span>{ta ? 'திரும்பு' : 'Back'}</span>
        </button>
        <h1 className={`text-2xl font-black flex items-center gap-2 relative z-10 ${ta ? 'font-tamil' : 'font-display'}`}>
          <BarChart3 className="size-6" />
          {ta ? 'வியாபார விவரங்கள்' : 'Reports & Analytics'}
        </h1>
      </div>

      <div className="px-5 py-6 space-y-6">
        
        {/* Today's Report */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
            <h2 className={`font-bold text-lg ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta ? 'இன்றைய வியாபாரம்' : 'Today\'s Turnover'}
            </h2>
          </div>
          
          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <div className="mb-4 pb-4 border-b border-border">
              <p className={`text-sm text-muted-foreground mb-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'மொத்த வியாபாரம்' : 'Total Sales'}
              </p>
              <p className="text-3xl font-black text-foreground tracking-tighter">
                {formatMoney(salesToday)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs text-muted-foreground mb-1 flex items-center gap-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                  <ArrowDownRight className="size-3 text-green-500" />
                  {ta ? 'வரவு (Cash/UPI)' : 'Received'}
                </p>
                <p className="text-xl font-bold text-green-600">{formatMoney(settledToday)}</p>
              </div>
              <div>
                <p className={`text-xs text-muted-foreground mb-1 flex items-center gap-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                  <ArrowUpRight className="size-3 text-red-500" />
                  {ta ? 'பாக்கி (Baki)' : 'Added to Baki'}
                </p>
                <p className="text-xl font-bold text-red-500">{formatMoney(bakiToday)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Report */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <Calendar className="size-4" />
            </div>
            <h2 className={`font-bold text-lg ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta ? 'இந்த மாத வியாபாரம்' : 'This Month\'s Turnover'}
            </h2>
          </div>
          
          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <div className="mb-4 pb-4 border-b border-border">
              <p className={`text-sm text-muted-foreground mb-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'மொத்த வியாபாரம்' : 'Total Sales'}
              </p>
              <p className="text-3xl font-black text-foreground tracking-tighter">
                {formatMoney(salesThisMonth)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs text-muted-foreground mb-1 flex items-center gap-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                  <ArrowDownRight className="size-3 text-green-500" />
                  {ta ? 'வரவு (Cash/UPI)' : 'Received'}
                </p>
                <p className="text-xl font-bold text-green-600">{formatMoney(settledThisMonth)}</p>
              </div>
              <div>
                <p className={`text-xs text-muted-foreground mb-1 flex items-center gap-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                  <ArrowUpRight className="size-3 text-red-500" />
                  {ta ? 'பாக்கி (Baki)' : 'Added to Baki'}
                </p>
                <p className="text-xl font-bold text-red-500">{formatMoney(bakiThisMonth)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Overall Status */}
        <section>
          <div className="bg-primary/10 rounded-3xl p-5 border border-primary/20 shadow-sm flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold text-primary mb-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'மொத்த பாக்கி நிலுவை' : 'Total Outstanding Baki'}
              </p>
              <p className="text-3xl font-black text-primary tracking-tighter">
                {formatMoney(pending)}
              </p>
            </div>
            <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Wallet className="size-6" />
            </div>
          </div>
        </section>

      </div>
    </PhoneShell>
  );
}
