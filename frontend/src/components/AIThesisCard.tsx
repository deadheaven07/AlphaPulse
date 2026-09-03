import React from "react";
import type { AiRecommendation } from "../types";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Award
} from "lucide-react";

interface AIThesisCardProps {
  recommendation: AiRecommendation;
  onSimulate: (symbol: string) => void;
}

export const AIThesisCard: React.FC<AIThesisCardProps> = ({
  recommendation,
  onSimulate,
}) => {
  const verdictColors = {
    "Strong Accumulate": "bg-profit-50 text-profit-800 border-profit-200",
    "Tactical Buy": "bg-brand-50 text-brand-800 border-brand-200",
    "Wait for Pullback": "bg-amber-50 text-amber-800 border-amber-200",
    "Hold": "bg-slate-100 text-slate-800 border-slate-200",
  };

  const verdict = recommendation.verdict || "Strong Accumulate";

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card hover:shadow-hover transition-all p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">
              {recommendation.symbol}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
              {recommendation.sector}
            </span>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border flex items-center gap-1 ${
                verdictColors[verdict] || verdictColors["Strong Accumulate"]
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              {verdict}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">{recommendation.company_name}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-semibold">Target Upside</div>
            <div className="text-base font-extrabold font-mono text-profit-600">
              +{recommendation.target_upside_pct}%
            </div>
          </div>
          <button
            onClick={() => onSimulate(recommendation.symbol)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Simulate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2-3 sentence Investment Thesis */}
      <div className="p-4 rounded-xl bg-brand-50/40 border border-brand-100 space-y-1.5">
        <div className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          Gemini AI Investment Thesis
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          {recommendation.investment_thesis}
        </p>
      </div>

      {/* Catalysts & Risks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Catalysts */}
        <div className="p-4 rounded-xl bg-profit-50/40 border border-profit-100 space-y-2.5">
          <span className="text-xs font-bold text-profit-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-profit-600" />
            Key Growth Catalysts
          </span>
          <ul className="space-y-1.5">
            {recommendation.key_catalysts?.map((cat, idx) => (
              <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-profit-600 font-bold mt-0.5">•</span>
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Risks */}
        <div className="p-4 rounded-xl bg-risk-50/40 border border-risk-100 space-y-2.5">
          <span className="text-xs font-bold text-risk-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-risk-600" />
            Risk Watch Items
          </span>
          <ul className="space-y-1.5">
            {recommendation.key_risks?.map((risk, idx) => (
              <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-risk-600 font-bold mt-0.5">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
