import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { StockQuote } from "../types";
import { searchStocks, fetchCandles } from "../services/api";
import { formatINR, formatPct } from "../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Sliders,
  Compass,
  ChevronDown,
  Star
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

interface StockOverviewCardProps {
  quote: StockQuote;
  onSelectSymbol: (symbol: string) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (symbol: string) => void;
}

const TIMEFRAMES = [
  { label: "1D", period: "1d", interval: "5m" },
  { label: "1W", period: "5d", interval: "15m" },
  { label: "1M", period: "1mo", interval: "1d" },
  { label: "1Y", period: "1y", interval: "1d" },
  { label: "5Y", period: "5y", interval: "1wk" },
];

export const StockOverviewCard: React.FC<StockOverviewCardProps> = ({
  quote,
  onSelectSymbol,
  isWatchlisted = false,
  onToggleWatchlist,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1Y");

  const tfConfig = TIMEFRAMES.find((t) => t.label === selectedTimeframe) || TIMEFRAMES[3];

  // Live Chart Data Query
  const { data: candles, isLoading: isCandlesLoading } = useQuery({
    queryKey: ["candles", quote.symbol, tfConfig.period, tfConfig.interval],
    queryFn: () => fetchCandles(quote.symbol, tfConfig.period, tfConfig.interval),
    staleTime: 60000,
  });

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
          <div className="flex items-center gap-3 flex-wrap">
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

            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(quote.symbol)}
                className={`p-1.5 rounded-xl border transition-all ${
                  isWatchlisted
                    ? "bg-amber-50 text-amber-500 border-amber-200"
                    : "bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500"
                }`}
                title={isWatchlisted ? "Pinned to Watchlist" : "Add to Watchlist"}
              >
                <Star className={`w-4 h-4 ${isWatchlisted ? "fill-amber-400" : ""}`} />
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">{quote.company_name}</p>
        </div>

        {/* Stock Selector Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            onClick={() => setIsSearching(!isSearching)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-all shadow-xs"
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
              <div className="absolute right-0 top-full mt-2 w-72 z-30 glass-dropdown rounded-xl overflow-hidden shadow-2xl p-2 space-y-2 animate-scale-in">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stock (e.g. RELIANCE)..."
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

      {/* Live Price & Timeframe Chart Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-3">
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
          <div className="text-xs text-muted font-medium ml-auto sm:ml-0">
            Prev Close: <span className="font-mono font-semibold text-slate-700">{formatINR(quote.prev_close)}</span>
          </div>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start lg:self-auto">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setSelectedTimeframe(tf.label)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedTimeframe === tf.label
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Price & Volume Chart */}
      <div className="h-64 w-full pt-1">
        {isCandlesLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : candles && candles.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={candles} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPos ? "#10B981" : "#6366F1"} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={isPos ? "#10B981" : "#6366F1"} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-panel p-3 rounded-xl shadow-xl text-xs space-y-1 border border-border">
                        <div className="font-bold text-slate-800">{data.date}</div>
                        <div className="flex items-center justify-between gap-4 font-mono font-bold text-slate-900">
                          <span>Close:</span>
                          <span>{formatINR(data.close)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
                          <span>Range:</span>
                          <span>{formatINR(data.low)} - {formatINR(data.high)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 font-mono text-[10px] text-slate-400">
                          <span>Volume:</span>
                          <span>{data.volume.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={isPos ? "#10B981" : "#4F46E5"}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
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
