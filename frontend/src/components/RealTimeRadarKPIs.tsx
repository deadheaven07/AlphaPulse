import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchKpiRadar } from "../services/api";
import { formatINR, formatPct } from "../utils/formatters";
import {
  Radar,
  Award,
  Truck,
  Sparkles,
  ArrowRight,
  Zap,
  Flame
} from "lucide-react";

interface RealTimeRadarKPIsProps {
  onSelectStock: (symbol: string) => void;
  referenceCapital?: number;
}

export const RealTimeRadarKPIs: React.FC<RealTimeRadarKPIsProps> = ({
  onSelectStock,
  referenceCapital = 100000,
}) => {
  const { data: radarStocks, isLoading } = useQuery({
    queryKey: ["kpi-radar", referenceCapital],
    queryFn: () => fetchKpiRadar(referenceCapital),
    refetchInterval: 30000,
  });

  return (
    <div className="glass-panel-3d rounded-2xl p-5 space-y-4 transition-all duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 dark:border-border-dark pb-3">
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

        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-muted-dark self-start sm:self-auto bg-slate-100 dark:bg-canvas-dark px-3 py-1 rounded-full border border-slate-200 dark:border-border-dark">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Capital Base: {formatINR(referenceCapital)}</span>
        </div>
      </div>

      {/* 4 to 6 Interactive Cards Grid (Responsive across phone to curved monitors) */}
      {isLoading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-muted-dark font-medium">Scanning live NSE universe across 5 quantitative factors...</p>
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

                {/* Post-Tax Projected Gain & Conviction */}
                <div className="p-3 rounded-xl bg-profit-50/80 dark:bg-profit-950/40 border border-profit-200/80 dark:border-profit-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-profit-800 dark:text-profit-300 uppercase tracking-wider block">
                      Post-Tax 1Y Net Gain
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
