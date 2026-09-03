import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { StockQuote } from "../types";
import { searchStocks } from "../services/api";
import { formatINR, formatPct } from "../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Sliders,
  Compass,
  ChevronDown
} from "lucide-react";

interface StockOverviewCardProps {
  quote: StockQuote;
  onSelectSymbol: (symbol: string) => void;
}

export const StockOverviewCard: React.FC<StockOverviewCardProps> = ({
  quote,
  onSelectSymbol,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["quick-search", searchQuery],
    queryFn: () => searchStocks(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const isPos = quote.change >= 0;

  // 52-Week Range Position %
  let range52wPct = 50;
  if (quote.high_52w > quote.low_52w) {
    range52wPct = Math.min(
      100,
      Math.max(0, ((quote.price - quote.low_52w) / (quote.high_52w - quote.low_52w)) * 100)
    );
  }

  // RRG Quadrant Style
  const rrg = quote.sector_rrg;
  const quadrant = rrg?.quadrant || "Leading";
  const quadrantColors = {
    Leading: "bg-profit-50 text-profit-700 border-profit-200",
    Improving: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Weakening: "bg-amber-50 text-amber-700 border-amber-200",
    Lagging: "bg-risk-50 text-risk-700 border-risk-200",
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-6">
      {/* Top Header & Stock Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
              {quote.symbol}
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
              NSE Live
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-100">
              {quote.sector}
            </span>

            {/* RRG Sector Quadrant Badge */}
            {rrg && (
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border flex items-center gap-1.5 ${
                  quadrantColors[quadrant]
                }`}
                title={rrg.description}
              >
                <Compass className="w-3.5 h-3.5" />
                RRG: {quadrant} Sector
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">{quote.company_name}</p>
        </div>

        {/* Stock Selector Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            onClick={() => setIsSearching(!isSearching)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-brand-600" />
            <span>Switch Stock</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isSearching && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsSearching(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-72 z-30 glass-dropdown rounded-xl overflow-hidden shadow-2xl p-2 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stock..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults?.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        onSelectSymbol(item.symbol);
                        setIsSearching(false);
                        setSearchQuery("");
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-brand-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-extrabold font-mono text-slate-900">{item.symbol}</span>
                      <span className="font-mono text-slate-600">{formatINR(item.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Price Row */}
      <div className="flex flex-wrap items-baseline gap-4">
        <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
          {formatINR(quote.price)}
        </div>
        <div
          className={`inline-flex items-center gap-1 text-sm sm:text-base font-bold px-3 py-1 rounded-xl ${
            isPos
              ? "bg-profit-50 text-profit-700 border border-profit-100"
              : "bg-risk-50 text-risk-700 border border-risk-100"
          }`}
        >
          {isPos ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{isPos ? `+₹${quote.change.toFixed(2)}` : `-₹${Math.abs(quote.change).toFixed(2)}`}</span>
          <span className="font-mono">({formatPct(quote.change_pct)})</span>
        </div>
        <div className="text-xs text-muted font-medium ml-auto">
          Prev Close: <span className="font-mono font-semibold text-slate-700">{formatINR(quote.prev_close)}</span>
        </div>
      </div>

      {/* Fundamental Ratios Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            P/E Multiple
          </span>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {quote.pe ? `${quote.pe.toFixed(1)}x` : "—"}
          </div>
          <span className="text-[10px] text-muted">Sec Avg: {quote.sector_pe || 25.0}x</span>
        </div>

        <div className="p-3 rounded-xl bg-profit-50/50 border border-profit-100/70">
          <span className="text-[10px] font-bold text-profit-700 uppercase tracking-wider block mb-0.5">
            ROCE
          </span>
          <div className="text-sm font-extrabold text-profit-700 font-mono">
            {quote.roce ? `${quote.roce.toFixed(1)}%` : "—"}
          </div>
          <span className="text-[10px] text-profit-600/80">Capital Efficiency</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            ROE
          </span>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {quote.roe ? `${quote.roe.toFixed(1)}%` : "—"}
          </div>
          <span className="text-[10px] text-muted">Return on Equity</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Market Cap
          </span>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {quote.market_cap_cr ? formatINR(quote.market_cap_cr * 10000000, true) : "—"}
          </div>
          <span className="text-[10px] text-muted">₹ Cr scale</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Debt / Equity
          </span>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {quote.debt_to_equity !== undefined ? quote.debt_to_equity.toFixed(2) : "0.00"}
          </div>
          <span className="text-[10px] text-muted">Balance Sheet</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Beta
          </span>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {quote.beta ? quote.beta.toFixed(2) : "1.00"}
          </div>
          <span className="text-[10px] text-muted">Volatility Index</span>
        </div>
      </div>

      {/* 52-Week Range Visual Slider */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            52W Low: <strong className="font-mono text-slate-900">{formatINR(quote.low_52w)}</strong>
          </span>
          <span className="text-slate-400 font-medium">52-Week Trading Band</span>
          <span>
            52W High: <strong className="font-mono text-slate-900">{formatINR(quote.high_52w)}</strong>
          </span>
        </div>
        <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${range52wPct}%` }}
          />
        </div>
        <div className="text-center text-[11px] text-muted">
          Current price is trading at <strong className="text-brand-600">{range52wPct.toFixed(1)}%</strong> of its 52-week band
        </div>
      </div>
    </div>
  );
};
