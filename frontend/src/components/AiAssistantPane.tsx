import React, { useState, useEffect } from "react";
import { askGeminiAi } from "../services/api";
import type { AiAnalysisResponse, AiRecommendation } from "../types";
import { formatINR } from "../utils/formatters";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  ArrowRight,
  HelpCircle,
  Layers
} from "lucide-react";

interface AiAssistantPaneProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string, capital?: number, horizon?: number) => void;
  geminiConfigured?: boolean;
}

const PRESET_QUERIES = [
  { text: "Suggest 3 infrastructure & defense stocks for ₹1,00,000 over 2 years", capital: 100000, horizon: 24 },
  { text: "Analyze Tata Motors for ₹50,000 over 6 months", capital: 50000, horizon: 6 },
  { text: "Find high-dividend PSU power stocks for ₹2,00,000 over 1 year", capital: 200000, horizon: 12 },
  { text: "Show me vetted small-cap stocks under ₹150 for ₹25,000", capital: 25000, horizon: 12 },
  { text: "Top auto & EV companies with >15% ROCE for ₹1,50,000", capital: 150000, horizon: 36 }
];

export const AiAssistantPane: React.FC<AiAssistantPaneProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  geminiConfigured = false
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResponse | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await askGeminiAi(textToAsk.trim());
      setAnalysis(res);
    } catch (err) {
      console.error("AI assistant query error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(query);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-out Left Drawer */}
      <aside className="relative z-10 w-full max-w-md sm:max-w-lg bg-white dark:bg-surface-dark h-full shadow-2xl border-r border-border dark:border-border-dark flex flex-col justify-between animate-slide-in-left duration-300">
        {/* Header */}
        <div className="p-4 border-b border-border/80 dark:border-border-dark flex items-center justify-between bg-white/50 dark:bg-surface-dark/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Alpha AI Analyst</h3>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {geminiConfigured ? "Gemini 2.5 Live" : "Heuristic"}
                </span>
              </div>
              <p className="text-[11px] text-muted dark:text-muted-dark">Natural language multi-factor strategy explorer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close AI Assistant"
            data-testid="close-ai-pane"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Chat / Results Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {/* Preset Suggestion Chips */}
          {!analysis && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Try Asking Questions Like:</span>
              </div>
              <div className="space-y-1.5">
                {PRESET_QUERIES.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(p.text);
                      handleAsk(p.text);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200/80 dark:border-border-dark hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-300 transition-all cursor-pointer font-medium leading-relaxed group shadow-2xs"
                  >
                    <span className="text-[11px]">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-7 h-7 border-2 text-emerald-500 animate-spin mx-auto" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Synthesizing multi-factor quantitative thesis with live NSE feeds...
              </p>
              <p className="text-[11px] text-muted dark:text-muted-dark">
                Checking institutional delivery, Piotroski F-score, and Monte Carlo probability distributions
              </p>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !isLoading && (
            <div className="space-y-4 animate-fade-in">
              {/* Executive Thesis Header */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    AI Quantitative Verdict
                  </span>
                  {analysis.web_search_grounded && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono">
                      Live Search Grounded
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed">
                  {analysis.query_summary}
                </p>
              </div>

              {/* Macro & Sector Context */}
              {analysis.sector_overview && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sector Context & Catalysts</span>
                  </div>
                  <p className="text-[11px] text-muted dark:text-muted-dark leading-relaxed">
                    {analysis.sector_overview}
                  </p>
                </div>
              )}

              {/* Recommended Stock Cards (Clickable) */}
              <div className="space-y-2">
                <div className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Selected Institutional Buys</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Click card to inspect</span>
                </div>

                {analysis.recommendations.map((rec: AiRecommendation, i: number) => (
                  <div
                    key={i}
                    onClick={() => {
                      onSelectStock(rec.symbol);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-white dark:bg-surface-elevated border border-slate-200/80 dark:border-border-dark hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-soft transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold font-mono text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {rec.symbol}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-canvas-dark text-slate-600 dark:text-muted-dark border border-transparent dark:border-border-dark">
                            {rec.sector}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted dark:text-muted-dark truncate max-w-[200px]">
                          {rec.company_name}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
                          +{rec.target_upside_pct}% Target
                        </span>
                        {rec.consensus_target_price && (
                          <span className="text-[9px] text-slate-400 dark:text-muted-dark">
                            Target: {formatINR(rec.consensus_target_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-canvas-dark p-2 rounded-lg border border-transparent dark:border-border-dark">
                      {rec.investment_thesis}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-muted dark:text-muted-dark">Verdict: <strong className="text-slate-800 dark:text-slate-200">{rec.verdict}</strong></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Open in Studio</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border/80 dark:border-border-dark bg-slate-50/50 dark:bg-surface-dark/50 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Find 3 multibaggers for ₹1 Lakh..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border-dark text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/40 focus:border-emerald-500 bg-white dark:bg-canvas-dark text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shadow-xs shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
};
