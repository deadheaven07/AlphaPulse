import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWeeklyTopPerformers } from "../services/api";
import { formatINR } from "../utils/formatters";
import {
  Flame,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  Truck,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

interface WeeklyTopPerformersWidgetProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const WeeklyTopPerformersWidget: React.FC<WeeklyTopPerformersWidgetProps> = ({
  activeSymbol,
  onSelectSymbol,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-top-performers"],
    queryFn: () => fetchWeeklyTopPerformers(15),
    refetchInterval: 30000,
  });

  const performers = data?.performers || [];
  const displayPerformers = isExpanded ? performers : performers.slice(0, 3);

  return (
    <div className="glass-panel-3d rounded-2xl p-4 sm:p-5 space-y-4 border border-border/80 dark:border-slate-800/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Top Performers of the Week
              </h2>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                1W Leaderboard
              </span>
            </div>
            <p className="text-[11px] text-muted dark:text-slate-400">
              Highest momentum breakout equities vs NIFTY 50 benchmark (+{data?.benchmark_weekly_return_pct || 2.2}%)
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
          {performers.length} Stocks
        </span>
      </div>

      {isLoading ? (
        <div className="p-6 text-center space-y-2">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted dark:text-slate-400">Scanning 65+ universe weekly leaders...</p>
        </div>
      ) : performers.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted dark:text-slate-400">
          No weekly performers available.
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayPerformers.map((p) => {
            const isActive = p.symbol === activeSymbol;
            const isTop3 = p.rank <= 3;

            return (
              <div
                key={p.symbol}
                onClick={() => onSelectSymbol(p.symbol)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group glass-card-hover relative ${
                  isActive
                    ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 shadow-xs ring-1 ring-amber-500/30"
                    : "bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                        p.rank === 1
                          ? "bg-amber-500 text-white shadow-xs"
                          : p.rank === 2
                          ? "bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white"
                          : p.rank === 3
                          ? "bg-amber-700/80 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      #{p.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold font-mono text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {p.symbol}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {p.sector}
                        </span>
                        {isTop3 && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            Top Pick
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted dark:text-slate-400 truncate max-w-[170px] sm:max-w-[200px]">
                        {p.name}
                      </p>
                    </div>
                  </div>

                  {/* Return & Price */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 font-mono font-extrabold text-xs text-profit-600 dark:text-profit-400">
                      <TrendingUp className="w-3 h-3" />
                      +{p.weekly_return_pct.toFixed(1)}%
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {formatINR(p.ltp)}
                    </div>
                  </div>
                </div>

                {/* Sub-row: Piotroski & Delivery Badges */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40 dark:border-slate-800/40 text-[10px]">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5 text-emerald-500" />
                      Piotroski {p.piotroski_score}/9
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Truck className="w-2.5 h-2.5 text-brand-500" />
                      {p.delivery_pct}% Deliv
                    </span>
                  </div>

                  <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Load in Studio
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}

          {/* Expand / Collapse Dropdown Button */}
          {performers.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-dashed border-border dark:border-slate-700 hover:border-amber-500 bg-white/50 dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 text-amber-500" />
                  <span>Collapse to Top 3</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-amber-500" />
                  <span>Show Full Leaderboard ({performers.length} stocks)</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
