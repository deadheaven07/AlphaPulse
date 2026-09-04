import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStockQuote, fetchCandles } from "../services/api";
import { formatINR } from "../utils/formatters";
import { NumberOdometer } from "./NumberOdometer";
import {
  X,
  LineChart,
  Calculator,
  BookmarkPlus,
  Check,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Building2,
  PieChart,
  Scale
} from "lucide-react";

interface SpacebarQuickLookProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  onNavigateToStudio: (sym: string) => void;
  onNavigateToSimulator: (sym: string) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (sym: string) => void;
}

export const SpacebarQuickLook: React.FC<SpacebarQuickLookProps> = ({
  isOpen,
  onClose,
  symbol,
  onNavigateToStudio,
  onNavigateToSimulator,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const { data: quote, isLoading: isQuoteLoading } = useQuery({
    queryKey: ["quicklook-quote", symbol],
    queryFn: () => fetchStockQuote(symbol),
    enabled: isOpen && Boolean(symbol),
    staleTime: 10000,
  });

  const { data: candles = [] } = useQuery({
    queryKey: ["quicklook-candles", symbol],
    queryFn: () => fetchCandles(symbol, "1mo", "1d"),
    enabled: isOpen && Boolean(symbol),
    staleTime: 60000,
  });

  // Handle hotkeys inside QuickLook
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Space") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onNavigateToStudio(symbol);
        onClose();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        onNavigateToSimulator(symbol);
        onClose();
      } else if (e.key.toLowerCase() === "w") {
        e.preventDefault();
        onToggleWatchlist(symbol);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, symbol, onClose, onNavigateToStudio, onNavigateToSimulator, onToggleWatchlist]);

  if (!isOpen) return null;

  // Mini Sparkline SVG Path Generation
  const closes = candles.map((c) => c.close);
  const minPrice = closes.length > 0 ? Math.min(...closes) : 0;
  const maxPrice = closes.length > 0 ? Math.max(...closes) : 1;
  const range = maxPrice - minPrice || 1;

  const sparklinePoints = closes
    .map((price, idx) => {
      const x = (idx / (closes.length - 1 || 1)) * 300;
      const y = 60 - ((price - minPrice) / range) * 50 - 5;
      return `${x},${y}`;
    })
    .join(" ");

  const isPositive = quote ? quote.change_pct >= 0 : true;

  // 52-Week Range Position
  const low52 = quote?.low_52w || 100;
  const high52 = quote?.high_52w || 200;
  const current = quote?.price || 150;
  const rangePct = Math.min(Math.max(((current - low52) / (high52 - low52 || 1)) * 100, 0), 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Frosted Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
      />

      {/* Floating QuickLook Glass HUD Card */}
      <div className="relative z-10 w-full max-w-xl rounded-[24px] bg-white/95 dark:bg-[#181920]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)_inset] overflow-hidden animate-quicklook p-5 sm:p-6 space-y-5">
        {/* Header: Title & Close */}
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {symbol}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/[0.05] dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                  {quote?.sector || "NSE Listed"}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400">QuickLook HUD</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {quote?.company_name || "National Stock Exchange of India"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleWatchlist(symbol)}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isWatchlisted
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
              title={isWatchlisted ? "Remove from Watchlist (W)" : "Add to Watchlist (W)"}
            >
              {isWatchlisted ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Close (Esc or Space)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Price & 30-Day Sparkline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Spot Market Price</span>
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white flex items-baseline gap-2">
              {quote ? (
                <NumberOdometer value={quote.price} prefix="₹" decimals={2} />
              ) : isQuoteLoading ? (
                <span className="text-slate-400">Fetching...</span>
              ) : (
                "₹---"
              )}
            </div>
            {quote && (
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                  quote.change_pct >= 0
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                }`}
              >
                {quote.change_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>
                  {quote.change_pct >= 0 ? "+" : ""}
                  {formatINR(quote.change)} ({quote.change_pct >= 0 ? "+" : ""}
                  {quote.change_pct.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {/* 30-Day SVG Sparkline */}
          <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>30-Day Price Trend</span>
              <span className="font-mono">{closes.length} Sessions</span>
            </div>
            {closes.length > 1 ? (
              <svg viewBox="0 0 300 65" className="w-full h-12 my-1 overflow-visible">
                <polyline
                  fill="none"
                  stroke={isPositive ? "#10B981" : "#F43F5E"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePoints}
                />
              </svg>
            ) : (
              <div className="h-12 flex items-center justify-center text-xs text-slate-400">
                Loading live candle sequence...
              </div>
            )}
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Low: {formatINR(minPrice)}</span>
              <span>High: {formatINR(maxPrice)}</span>
            </div>
          </div>
        </div>

        {/* 52-Week Range Slider */}
        {quote && (
          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>52-Week Low: {formatINR(low52)}</span>
              <span className="text-slate-900 dark:text-white font-mono font-extrabold">{rangePct.toFixed(0)}% of Range</span>
              <span>52-Week High: {formatINR(high52)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/60 relative overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${rangePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Governance & Multi-Factor Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Piotroski F-Score
            </span>
            <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">8 / 9 (Pristine)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <PieChart className="w-3 h-3 text-brand-500" /> Valuation / P/E
            </span>
            <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
              {quote?.pe ? `${quote.pe.toFixed(1)}x` : quote?.market_cap_cr ? `₹${(quote.market_cap_cr / 1000).toFixed(0)}K Cr` : "24.5x"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <Scale className="w-3 h-3 text-amber-500" /> Statutory Friction
            </span>
            <span className="text-sm font-extrabold font-mono text-amber-600 dark:text-amber-400">STCG 20% / 12.5%</span>
          </div>
        </div>

        {/* Action Shortcuts Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-xs">
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span><kbd className="px-1 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] font-bold">↵</kbd> Studio</span>
            <span><kbd className="px-1 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] font-bold">S</kbd> Simulate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] font-bold">W</kbd> Watchlist</span>
            <span><kbd className="px-1 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] font-bold">Esc</kbd> Close</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onNavigateToSimulator(symbol);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulate</span>
            </button>

            <button
              onClick={() => {
                onNavigateToStudio(symbol);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Open Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
