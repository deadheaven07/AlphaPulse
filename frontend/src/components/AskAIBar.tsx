import React, { useState } from "react";
import { Search, Sparkles, Loader2, ArrowRight, Zap, Globe } from "lucide-react";

interface AskAIBarProps {
  onSearch: (query: string, capital?: number, horizon?: number) => void;
  isLoading: boolean;
}

const PROMPT_SUGGESTIONS = [
  { text: "Suggest 3 infrastructure & defense stocks for ₹1,00,000 over 2 years", capital: 100000, horizon: 24 },
  { text: "Analyze Tata Motors for ₹50,000 over 6 months", capital: 50000, horizon: 6 },
  { text: "Find high-dividend PSU power stocks for ₹2,00,000 over 1 year", capital: 200000, horizon: 12 },
  { text: "Top auto & EV companies with >15% ROCE for ₹1,50,000 over 3 years", capital: 150000, horizon: 36 },
];

export const AskAIBar: React.FC<AskAIBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  const handleSuggestionClick = (sug: typeof PROMPT_SUGGESTIONS[0]) => {
    setQuery(sug.text);
    onSearch(sug.text, sug.capital, sug.horizon);
  };

  return (
    <div className="glass-panel-3d rounded-2xl p-4 sm:p-6 space-y-4 transition-all duration-300">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Ask AI Stock Explorer
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center gap-1">
                <Globe className="w-3 h-3 text-brand-500" />
                Live Web Grounded
              </span>
            </div>
            <p className="text-xs text-muted dark:text-slate-400">
              Query Indian stocks with capital amount & holding duration in natural language
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'Suggest 3 defense or power stocks if I invest ₹1,00,000 for 2 years'..."
            disabled={isLoading}
            className="w-full pl-11 pr-28 sm:pr-36 py-3.5 bg-white/80 dark:bg-slate-900/80 border border-border dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-500/40 focus:border-brand-500 dark:focus:border-brand-400 transition-all font-medium shadow-xs"
          />
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-3 sm:px-4 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                <>
                  <span>Research</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Pre-set Quick Queries */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-wider">
          <Zap className="w-3 h-3 text-amber-500" />
          Popular Pro Prompts
        </span>
        <div className="flex flex-wrap gap-2">
          {PROMPT_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(sug)}
              disabled={isLoading}
              className="text-left px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-600 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              "{sug.text}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
