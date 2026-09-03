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
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Ask AI Stock Explorer
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-500" />
                Live Web Grounded
              </span>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark">
              Query Indian stocks with capital amount & holding duration in natural language
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-muted-dark">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'Suggest 3 defense or power stocks if I invest ₹1,00,000 for 2 years'..."
            disabled={isLoading}
            className="w-full pl-11 pr-28 sm:pr-36 py-3.5 bg-white/80 dark:bg-surface-dark/90 border border-border dark:border-border-dark rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all font-medium shadow-xs"
          />
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
        <span className="text-[11px] font-bold text-slate-400 dark:text-muted-dark flex items-center gap-1 uppercase tracking-wider">
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
              className="text-left px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-surface-dark/90 hover:bg-white dark:hover:bg-surface-elevated border border-slate-200/80 dark:border-border-dark text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              "{sug.text}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
