import React from "react";
import type { AiRecommendation } from "../types";
import { formatINR, formatPct } from "../utils/formatters";
import { TrendingUp, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";

interface AIThesisCardProps {
  recommendation: AiRecommendation;
  onSimulate: (symbol: string) => void;
}

export const AIThesisCard: React.FC<AIThesisCardProps> = ({
  recommendation,
  onSimulate,
}) => {
  const rec = recommendation;

  const verdictStyles: Record<string, string> = {
    "Institutional Accumulate": "bg-profit-50 text-profit-700 border-profit-200",
    "Strong Accumulate": "bg-profit-50 text-profit-700 border-profit-200",
    "Tactical Buy": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Wait for Pullback": "bg-amber-50 text-amber-700 border-amber-200",
    Hold: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base font-mono text-slate-900">
                {rec.symbol}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                {rec.sector}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">{rec.company_name}</div>
          </div>

          <div
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
              verdictStyles[rec.verdict] || verdictStyles["Strong Accumulate"]
            }`}
          >
            {rec.verdict}
          </div>
        </div>

        {/* Price & Target Upside */}
        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Market Price
            </span>
            <span className="text-sm font-extrabold font-mono text-slate-900">
              {formatINR(rec.current_price)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Projected Upside
            </span>
            <span className="text-sm font-extrabold text-profit-600 flex items-center gap-0.5 justify-end">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{formatPct(rec.target_upside_pct)}</span>
            </span>
          </div>
        </div>

        {/* Thesis Text */}
        <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl">
          {rec.investment_thesis}
        </p>

        {/* Catalysts */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-500" />
            Key Catalysts
          </div>
          <ul className="text-xs text-slate-700 space-y-0.5 font-medium">
            {rec.key_catalysts?.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-risk-500" />
            Key Risks
          </div>
          <ul className="text-xs text-slate-500 space-y-0.5">
            {rec.key_risks?.map((r, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-risk-400 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-muted font-mono font-medium">
          Confidence: <strong>{rec.confidence_score}%</strong>
        </span>

        <button
          onClick={() => onSimulate(rec.symbol)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
        >
          <span>Simulate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
