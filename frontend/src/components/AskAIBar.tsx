import React, { useState } from "react";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

interface AskAIBarProps {
  onSearch: (query: string, capital?: number, horizonMonths?: number) => void;
  isLoading: boolean;
}

const PRESET_PILLS = [
  {
    label: "🚀 Top Infrastructure & Power for 2 Years",
    query: "Suggest top infrastructure and renewable power stocks for a 2-year horizon with high capex growth",
    capital: 100000,
    horizon: 24,
  },
  {
    label: "🛡️ Low-Risk Dividend Compounders for ₹1 Lakh",
    query: "Suggest low-risk high-ROCE bluechip dividend compounders for ₹1,00,000 over 3 years",
    capital: 100000,
    horizon: 36,
  },
  {
    label: "⚡ Breakout Swing Setups for 3 Months",
    query: "Find high-momentum breakout swing stocks with 20-day volume surge for a 3-month horizon",
    capital: 50000,
    horizon: 3,
  },
  {
    label: "🚗 EV Transformation & Auto Moats",
    query: "Analyze Indian automotive leaders driving EV adoption and luxury margin expansion for ₹1,00,000 over 1 year",
    capital: 100000,
    horizon: 12,
  },
  {
    label: "💳 High-Growth Private Banking",
    query: "Identify high-ROA private banks and retail NBFCs with multi-year low NPAs and 15%+ credit growth",
    capital: 150000,
    horizon: 36,
  },
];

export const AskAIBar: React.FC<AskAIBarProps> = ({ onSearch, isLoading }) => {
  const [inputQuery, setInputQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    onSearch(inputQuery);
  };

  const handlePillClick = (preset: (typeof PRESET_PILLS)[0]) => {
    setInputQuery(preset.query);
    onSearch(preset.query, preset.capital, preset.horizon);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-5 sm:p-6 space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Sparkles className="w-5 h-5 text-brand-500" />
        </div>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask anything (e.g., 'Suggest 3 infrastructure stocks if I invest ₹1,00,000 for 2 years' or 'Analyze Tata Motors for ₹50,000 over 6 months')..."
          className="w-full pl-12 pr-32 py-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/60 hover:bg-white transition-all"
        />
        <div className="absolute inset-y-1.5 right-1.5 flex items-center">
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="h-full px-5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Recommendation Pills */}
      <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs pb-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Presets:
        </span>
        {PRESET_PILLS.map((pill, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePillClick(pill)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200/80 hover:border-brand-200 text-xs font-semibold shrink-0 transition-all text-left"
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
};
