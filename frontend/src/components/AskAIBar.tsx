import React, { useState } from "react";
import { Search, Sparkles, Globe } from "lucide-react";

interface AskAIBarProps {
  onSearch: (query: string, capital?: number, horizon?: number) => void;
  isLoading: boolean;
}

const PRESET_PROMPTS = [
  {
    label: "⚡ High Capex & Defense for 2 Years",
    query: "Suggest 3 sovereign defense and infrastructure stocks with growing order books and high ROCE",
    capital: 100000,
    horizon: 24,
  },
  {
    label: "🛡️ High Piotroski (8+) Dividend Compounders",
    query: "Find pristine quality stocks with Piotroski score 8+ and strong free cash flow for safe long-term compounding",
    capital: 150000,
    horizon: 36,
  },
  {
    label: "📈 Delivery Breakout Setups with ₹50,000",
    query: "Find high delivery percentage (>50%) breakout stocks with 20-day volume surge on NSE",
    capital: 50000,
    horizon: 6,
  },
  {
    label: "🚗 Tata Motors EV & Demerger Runway",
    query: "Analyze Tata Motors investment thesis considering JLR deleveraging, EV market share, and commercial vehicle demerger",
    capital: 100000,
    horizon: 12,
  },
];

export const AskAIBar: React.FC<AskAIBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handlePreset = (preset: typeof PRESET_PROMPTS[0]) => {
    setQuery(preset.query);
    onSearch(preset.query, preset.capital, preset.horizon);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Natural Language Stock Explorer & Thesis Engine
            </h2>
            <p className="text-xs text-muted">
              Ask anything in natural English with real-time Google Search grounding across broker targets and concalls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 self-start sm:self-auto">
          <Globe className="w-3.5 h-3.5 text-brand-600" />
          <span>Live Web Search Grounded</span>
        </div>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'Suggest 3 defense stocks with record order books if I invest ₹1,00,000 for 18 months'..."
            className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Pills */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Suggested Scenarios:
        </span>
        {PRESET_PROMPTS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePreset(preset)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200/80 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};
