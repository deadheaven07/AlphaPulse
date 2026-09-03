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
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5 relative overflow-hidden flex flex-col justify-between">
      {/* Top Banner & Verdict */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xl font-mono text-slate-900 tracking-tight">
                {rec.symbol}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                {rec.sector}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
                <Globe className="w-3 h-3 text-brand-600" />
                Live Web Grounded
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{rec.company_name}</p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-bold uppercase">Consensus Target</div>
            <div className="text-lg font-extrabold font-mono text-profit-600">
              {rec.consensus_target_price ? formatINR(rec.consensus_target_price) : formatINR(rec.current_price * 1.25)}
            </div>
            <div className="text-[11px] font-bold text-profit-700">
              +{formatPct(rec.target_upside_pct)} Upside
            </div>
          </div>
        </div>

        {/* Investment Thesis Summary */}
        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
          {rec.investment_thesis}
        </p>

        {/* Broker Targets Pill Bar */}
        {rec.broker_targets && rec.broker_targets.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-brand-500" />
              Consensus Research House Targets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {rec.broker_targets.map((b, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[90px]">
                    {b.broker}
                  </span>
                  <span className="font-mono font-bold text-profit-700 text-xs">
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
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-500" />
              Recent Concall & Management Takeaways
            </div>
            <ul className="space-y-1 text-xs text-slate-700 font-medium">
              {rec.concall_highlights.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Catalysts & Risks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Catalysts */}
          <div className="p-3 rounded-xl bg-profit-50/60 border border-profit-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-profit-800">
              <Zap className="w-3.5 h-3.5 text-profit-600" />
              <span>Key Catalysts</span>
            </div>
            <ul className="text-[11px] text-profit-900/90 space-y-1">
              {rec.key_catalysts?.map((c, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-profit-600 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="p-3 rounded-xl bg-risk-50/60 border border-risk-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-risk-800">
              <AlertCircle className="w-3.5 h-3.5 text-risk-600" />
              <span>Risk Factors</span>
            </div>
            <ul className="text-[11px] text-risk-900/90 space-y-1">
              {rec.key_risks?.map((r, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-risk-600 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs font-bold shadow-xs">
            {rec.verdict || "Institutional Accumulate"}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {rec.confidence_score}% Confidence
          </span>
        </div>

        <button
          onClick={() => onSimulate(rec.symbol)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs group"
        >
          <span>Simulate ROI</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
