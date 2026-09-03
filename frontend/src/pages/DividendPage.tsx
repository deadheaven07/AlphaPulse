import React from "react";
import { DividendAnalyzer } from "../components/DividendAnalyzer";
import { Coins, Banknote } from "lucide-react";

interface DividendPageProps {
  symbol: string;
  onSelectStock: (symbol: string) => void;
}

export const DividendPage: React.FC<DividendPageProps> = ({ symbol, onSelectStock }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-border-dark pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-2xs">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Dividend Intelligence & Regular Cash Payouts
              </h1>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface-elevated text-slate-800 dark:text-slate-200">
                {symbol}
              </span>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark">
              Track upcoming ex-dates, calculate bank account cash yields, and execute disciplined accumulation windows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted dark:text-muted-dark self-start sm:self-auto">
          <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
            <Banknote className="w-4 h-4" />
            Direct Bank Credit
          </span>
        </div>
      </div>

      {/* Dividend Analyzer Component */}
      <DividendAnalyzer
        symbol={symbol}
        onSelectStock={onSelectStock}
      />
    </div>
  );
};
