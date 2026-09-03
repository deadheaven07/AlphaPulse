import React from "react";
import type { AiRecommendation } from "../types";
import { formatINR, formatPct } from "../utils/formatters";
import {
  Sparkles,
  Globe,
  AlertCircle,
  Zap,
  ArrowRight,
  Building2,
  CheckCircle2
} from "lucide-react";

interface LiveNewsAndThesisProps {
  recommendation: AiRecommendation;
  onSimulate: (symbol: string) => void;
}

export const LiveNewsAndThesis: React.FC<LiveNewsAndThesisProps> = ({
  recommendation,
  onSimulate,
}) => {
  const rec = recommendation;

  return (
    <div className="glass-panel-3d rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between glass-card-hover transition-all duration-300">
      {/* Top Banner & Verdict */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-xl font-mono text-slate-900 dark:text-white tracking-tight">
                {rec.symbol}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {rec.sector}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center gap-1">
                <Globe className="w-3 h-3 text-brand-500" />
                Live Grounded
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{rec.company_name}</p>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Consensus Target</div>
            <div className="text-lg font-extrabold font-mono text-profit-600 dark:text-profit-400">
              {rec.consensus_target_price ? formatINR(rec.consensus_target_price) : formatINR(rec.current_price * 1.25)}
            </div>
            <div className="text-[11px] font-bold text-profit-700 dark:text-profit-400">
              +{formatPct(rec.target_upside_pct)} Upside
            </div>
          </div>
        </div>

        {/* Investment Thesis Summary */}
        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
          {rec.investment_thesis}
        </p>

        {/* Broker Targets Pill Bar */}
        {rec.broker_targets && rec.broker_targets.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-brand-500" />
              Consensus Research House Targets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {rec.broker_targets.map((b, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[90px]">
                    {b.broker}
                  </span>
                  <span className="font-mono font-bold text-profit-700 dark:text-profit-400 text-xs">
                    {formatINR(b.target)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concall Highlights */}
        {rec.concall_highlights && rec.concall_highlights.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-500" />
              Recent Concall & Management Guidance
            </div>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {rec.concall_highlights.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Catalysts vs Risks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-3 rounded-xl bg-profit-50/60 dark:bg-profit-950/30 border border-profit-200/60 dark:border-profit-800/40 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-profit-800 dark:text-profit-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-profit-600" />
              Growth Catalysts
            </span>
            <ul className="space-y-1 text-[11px] text-profit-900 dark:text-profit-200 font-medium">
              {rec.key_catalysts.slice(0, 2).map((cat, i) => (
                <li key={i}>• {cat}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              Risk Watch Items
            </span>
            <ul className="space-y-1 text-[11px] text-rose-900 dark:text-rose-200 font-medium">
              {rec.key_risks.slice(0, 2).map((risk, i) => (
                <li key={i}>• {risk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onSimulate(rec.symbol)}
        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 group cursor-pointer"
      >
        <span>Simulate {rec.symbol} Strategy</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
};
