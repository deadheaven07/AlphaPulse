import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyChampionStock } from "../services/api";
import { formatINR } from "../utils/formatters";
import {
  Trophy,
  ShieldCheck,
  TrendingUp,
  Target,
  Award,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock
} from "lucide-react";

interface MonthlyChampionBannerProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const MonthlyChampionBanner: React.FC<MonthlyChampionBannerProps> = ({
  activeSymbol,
  onSelectSymbol,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["monthly-champion-stock"],
    queryFn: fetchMonthlyChampionStock,
    staleTime: 60000,
  });

  if (isLoading || !data?.champion) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3 animate-pulse">
        <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
          Institutional Pick of the Month: Screening 65+ NSE leaders for highest solvency & asymmetric risk-reward...
        </span>
      </div>
    );
  }

  const champion = data.champion;
  const isCurrentlyActive = champion.symbol === activeSymbol;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 dark:border-amber-500/40 bg-gradient-to-r from-amber-500/5 via-emerald-500/5 to-indigo-500/5 dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-indigo-950/20 p-4 sm:p-5 shadow-sm">
      {/* Decorative ambient glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left column: Title & Stock Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">
              <Trophy className="w-3.5 h-3.5" />
              <span>Institutional Pick of the Month</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{champion.safety_rating} • {champion.composite_score}/100</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              RRG {champion.rrg_quadrant}
            </span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white tracking-tight">
              {champion.symbol}
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {champion.company_name} ({champion.sector})
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {formatINR(champion.ltp)}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {champion.monthly_thesis}
          </p>
        </div>

        {/* Right column: Target Metrics & 1-Click Action */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-amber-500/20 pt-3 lg:pt-0 lg:pl-5">
          {/* Key 30-Day Forecast Numbers */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-emerald-500/30 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                1M Target Return
              </span>
              <div className="flex items-center justify-center gap-1 font-mono font-black text-sm text-profit-600 dark:text-profit-400">
                <TrendingUp className="w-3.5 h-3.5" />
                +{champion.expected_1m_return_pct}%
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                Target: {formatINR(champion.target_price_1m)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-indigo-500/30 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Risk / Reward
              </span>
              <div className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                {champion.risk_reward_ratio}
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                SL: {formatINR(champion.stop_loss)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onSelectSymbol(champion.symbol)}
            disabled={isCurrentlyActive}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
              isCurrentlyActive
                ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 cursor-default"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
          >
            {isCurrentlyActive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Currently Active in Studio</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Pick of the Month</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Micro-metrics footer */}
      <div className="mt-3 pt-2.5 border-t border-amber-500/15 flex items-center gap-3 sm:gap-6 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Award className="w-3 h-3 text-emerald-500" />
          <strong className="text-slate-700 dark:text-slate-200">Piotroski {champion.piotroski_score}/9</strong> (Solvency Safe)
        </span>
        <span className="flex items-center gap-1">
          <Truck className="w-3 h-3 text-brand-500" />
          <strong className="text-slate-700 dark:text-slate-200">{champion.delivery_pct}%</strong> Delivery (Smart Money)
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3 text-indigo-500" />
          <strong className="text-slate-700 dark:text-slate-200">{champion.roe}% ROE</strong> / <strong className="text-slate-700 dark:text-slate-200">{champion.roce}% ROCE</strong>
        </span>
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-amber-500" />
          <strong className="text-slate-700 dark:text-slate-200">{champion.debt_to_equity} D/E</strong> (De-risked)
        </span>
      </div>
    </div>
  );
};
