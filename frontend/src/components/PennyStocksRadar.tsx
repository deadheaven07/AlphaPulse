import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPennyRadar } from "../services/api";
import { formatINR, formatPct } from "../utils/formatters";
import {
  Coins,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertOctagon,
  TrendingUp,
  Layers
} from "lucide-react";

interface PennyStocksRadarProps {
  onSelectStock: (symbol: string, budget?: number) => void;
}

const BUDGET_PRESETS = [10000, 25000, 50000, 100000];

export const PennyStocksRadar: React.FC<PennyStocksRadarProps> = ({ onSelectStock }) => {
  const [budget, setBudget] = useState<number>(25000);

  const { data: pennyStocks, isLoading } = useQuery({
    queryKey: ["penny-radar", budget],
    queryFn: () => fetchPennyRadar(budget),
    refetchInterval: 30000,
  });

  return (
    <div className="glass-panel-3d rounded-2xl p-5 space-y-4 transition-all duration-300">
      {/* Header & Budget Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 dark:border-border-dark pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shadow-xs">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Vetted Small-Cap & High-Yield Leaders (&lt; ₹150)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Zero Toxic Debt Filter
              </span>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark">
              Segmented institutional screening: Micro-Cap Turnarounds & High-Yield Liquid Leaders with lower-circuit freeze protection
            </p>
          </div>
        </div>

        {/* Capital Allocation Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-canvas-dark p-1.5 rounded-xl border border-slate-200 dark:border-border-dark">
          <span className="text-[10px] font-bold text-slate-500 dark:text-muted-dark px-1.5 hidden sm:inline">Budget:</span>
          {BUDGET_PRESETS.map((b) => (
            <button
              key={b}
              onClick={() => setBudget(b)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                budget === b
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-muted-dark hover:bg-slate-200 dark:hover:bg-surface-elevated"
              }`}
            >
              {formatINR(b)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vetted Stocks */}
      {isLoading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-muted-dark font-medium">Screening Indian small-cap & liquid universe for verified turnaround catalysts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ultrawide:grid-cols-5 gap-4">
          {pennyStocks?.map((stock) => {
            const isPos = stock.change >= 0;
            const isMicroCap = stock.category === "Micro-Cap Turnaround";
            const isCircuitLocked = stock.circuit_risk === "CRITICAL_LOWER_CIRCUIT";

            return (
              <div
                key={stock.symbol}
                className={`p-4 rounded-xl border bg-white/70 dark:bg-surface-dark/90 glass-card-hover flex flex-col justify-between space-y-3 relative overflow-hidden group shadow-soft hover:shadow-hover dark:hover:shadow-hover-dark ${
                  isCircuitLocked
                    ? "border-rose-400 dark:border-rose-800 ring-1 ring-rose-400/30"
                    : "border-border dark:border-border-dark"
                }`}
              >
                {/* Top Symbol + Live Price */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-base font-mono text-slate-900 dark:text-white">
                        {stock.symbol}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded flex items-center gap-0.5 ${
                          isMicroCap
                            ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        <Layers className="w-2.5 h-2.5" />
                        {stock.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-muted-dark font-medium truncate max-w-[150px]">
                      {stock.company_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                      {formatINR(stock.price)}
                    </div>
                    <div
                      className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${
                        isPos ? "text-profit-600 dark:text-profit-400" : "text-risk-600 dark:text-risk-400"
                      }`}
                    >
                      {isPos ? "+" : ""}
                      {formatPct(stock.change_pct)}
                    </div>
                  </div>
                </div>

                {/* Circuit Lock Danger Banner */}
                {isCircuitLocked && stock.circuit_warning && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-[10px] text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                    <span>{stock.circuit_warning}</span>
                  </div>
                )}

                {/* Capital Allocation & Quantity Preview */}
                <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block uppercase tracking-wider">
                      Allocation ({formatINR(budget)})
                    </span>
                    <span className="font-mono font-extrabold text-amber-900 dark:text-amber-200">
                      {stock.shares_purchasable.toLocaleString("en-IN")} Shares
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider flex items-center justify-end gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" />
                      Target Upside
                    </span>
                    <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{stock.potential_upside_pct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Quantitative Badges with Circuit Limits */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200/70 dark:border-border-dark flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-muted dark:text-muted-dark">Target</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {formatINR(stock.target_price)}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200/70 dark:border-border-dark flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-muted dark:text-muted-dark">Stop-Loss</span>
                    <span className="font-mono text-rose-500 font-extrabold">
                      {formatINR(stock.trailing_stop_loss)}
                    </span>
                  </div>
                </div>

                {/* Lower & Upper Circuit Band */}
                {stock.lower_circuit && stock.upper_circuit && (
                  <div className="flex items-center justify-between text-[9px] font-mono px-1 text-slate-400 dark:text-muted-dark">
                    <span>LC: {formatINR(stock.lower_circuit)}</span>
                    <span>UC: {formatINR(stock.upper_circuit)}</span>
                  </div>
                )}

                {/* Catalyst Snippet */}
                <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 bg-slate-100/70 dark:bg-canvas-dark px-2 py-1 rounded-lg border border-transparent dark:border-border-dark flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{stock.catalyst}</span>
                </div>

                {/* Simulate Button */}
                <button
                  onClick={() => onSelectStock(stock.symbol, budget)}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Simulate with {formatINR(budget)}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
