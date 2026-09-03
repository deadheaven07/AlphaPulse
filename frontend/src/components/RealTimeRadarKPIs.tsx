import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchKpiRadar } from "../services/api";
import { formatINR, formatPct } from "../utils/formatters";
import {
  Radar,
  Award,
  Truck,
  ArrowRight,
  Zap,
  Flame,
  Coins,
  Edit3,
  Check
} from "lucide-react";

interface RealTimeRadarKPIsProps {
  onSelectStock: (symbol: string) => void;
  referenceCapital?: number;
  onCapitalChange?: (newCapital: number) => void;
}

const CAPITAL_SHORTCUTS = [
  { label: "₹50K", value: 50000 },
  { label: "₹1 Lakh", value: 100000 },
  { label: "₹2.5 Lakh", value: 250000 },
  { label: "₹5 Lakh", value: 500000 },
  { label: "₹10 Lakh", value: 1000000 },
  { label: "₹25 Lakh", value: 2500000 },
];

export const RealTimeRadarKPIs: React.FC<RealTimeRadarKPIsProps> = ({
  onSelectStock,
  referenceCapital = 100000,
  onCapitalChange,
}) => {
  const [capital, setCapital] = useState<number>(referenceCapital);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>(referenceCapital.toString());

  useEffect(() => {
    setCapital(referenceCapital);
    setInputVal(referenceCapital.toString());
  }, [referenceCapital]);

  const { data: radarStocks, isLoading } = useQuery({
    queryKey: ["kpi-radar", capital],
    queryFn: () => fetchKpiRadar(capital),
    refetchInterval: 30000,
  });

  const handleSelectCapital = (val: number) => {
    setCapital(val);
    setInputVal(val.toString());
    setIsEditing(false);
    if (onCapitalChange) {
      onCapitalChange(val);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(inputVal.replace(/[^0-9.]/g, ""));
    if (!isNaN(num) && num > 0) {
      setCapital(num);
      setIsEditing(false);
      if (onCapitalChange) {
        onCapitalChange(num);
      }
    }
  };

  return (
    <div className="glass-panel-3d rounded-2xl p-5 space-y-4 transition-all duration-300">
      {/* Top Header & Interactive Capital Base Controller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/80 dark:border-border-dark pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-xs">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Real-Time KPI Stocks Radar
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Top Profitable Buys Now
              </span>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark">
              Live multi-factor ranking: Delivery &ge; 50% + Piotroski &ge; 7/9 + Breakout + Positive News + Post-Tax ROI &ge; 15%
            </p>
          </div>
        </div>

        {/* Fully Editable Capital Base Control */}
        <div className="flex items-center gap-2 flex-wrap bg-slate-100/90 dark:bg-canvas-dark p-1.5 sm:p-2 rounded-2xl border border-slate-200 dark:border-border-dark shadow-2xs">
          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Coins className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Capital Base:</span>
          </div>

          {isEditing ? (
            <form onSubmit={handleInputSubmit} className="flex items-center gap-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-2 flex items-center text-xs font-bold text-slate-400">₹</span>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  autoFocus
                  className="w-28 sm:w-32 pl-5 pr-2 py-1 bg-white dark:bg-surface-dark border border-emerald-500 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                  placeholder="100000"
                />
              </div>
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                title="Apply Capital"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-all shadow-2xs group"
              title="Click to edit capital amount"
            >
              <span>{formatINR(capital)}</span>
              <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
          )}

          {/* Quick-Select Capital Chips */}
          <div className="hidden sm:flex items-center gap-1">
            {CAPITAL_SHORTCUTS.map((sc) => (
              <button
                key={sc.value}
                onClick={() => handleSelectCapital(sc.value)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  capital === sc.value
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-white/80 dark:bg-surface-dark/80 text-slate-600 dark:text-muted-dark hover:bg-slate-200 dark:hover:bg-surface-elevated"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 to 6 Interactive Cards Grid (Responsive across phone to curved monitors) */}
      {isLoading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-muted-dark font-medium">
            Recalculating live multi-factor ranking & post-tax ROI for {formatINR(capital)} capital base...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ultrawide:grid-cols-6 gap-4">
          {radarStocks?.map((stock, idx) => {
            const isPos = stock.change >= 0;

            return (
              <div
                key={stock.symbol}
                className="p-4 rounded-xl border border-border dark:border-border-dark bg-white/70 dark:bg-surface-dark/90 glass-card-hover flex flex-col justify-between space-y-3 relative overflow-hidden group shadow-soft hover:shadow-hover dark:hover:shadow-hover-dark"
              >
                {/* Top Rank Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-emerald-600 text-white font-mono text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-base font-mono text-slate-900 dark:text-white tracking-tight">
                        {stock.symbol}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {stock.sector}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-muted-dark font-medium truncate max-w-[170px]">
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

                {/* Post-Tax Projected Gain & Conviction (Live updated for editable Capital Base) */}
                <div className="p-3 rounded-xl bg-profit-50/80 dark:bg-profit-950/40 border border-profit-200/80 dark:border-profit-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-profit-800 dark:text-profit-300 uppercase tracking-wider block">
                      Post-Tax 1Y Net Gain ({formatINR(capital)})
                    </span>
                    <span className="text-sm font-extrabold font-mono text-profit-700 dark:text-profit-400">
                      +{formatINR(stock.post_tax_net_gain_inr)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-profit-800 dark:text-profit-300 uppercase tracking-wider block">
                      Target Price
                    </span>
                    <span className="text-xs font-extrabold font-mono text-profit-700 dark:text-profit-400">
                      {formatINR(stock.target_price)} (+{stock.post_tax_roi_pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Multi-Factor Badges */}
                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200/70 dark:border-border-dark text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                    <Truck className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{stock.delivery_pct}% Deliv</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200/70 dark:border-border-dark text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                    <Award className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>F-{stock.piotroski_score}/9</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200/70 dark:border-border-dark text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 truncate">
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{stock.win_probability_pct}% Win</span>
                  </div>
                </div>

                {/* News Catalyst Snippet */}
                <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 flex items-center gap-1.5 bg-slate-100/70 dark:bg-canvas-dark px-2 py-1 rounded-lg border border-transparent dark:border-border-dark">
                  <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{stock.primary_catalyst}</span>
                </div>

                {/* One-Click Simulate Button */}
                <button
                  onClick={() => onSelectStock(stock.symbol)}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Simulate {stock.symbol}</span>
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
