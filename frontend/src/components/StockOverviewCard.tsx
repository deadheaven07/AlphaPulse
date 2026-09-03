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
  ChevronDown,
  Star,
  Award,
  Truck
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
    Leading: "bg-profit-50 dark:bg-profit-950/60 text-profit-700 dark:text-profit-400 border-profit-200 dark:border-profit-800",
    Improving: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    Weakening: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    Lagging: "bg-risk-50 dark:bg-risk-950/60 text-risk-700 dark:text-risk-400 border-risk-200 dark:border-risk-800",
  };

  const quality = quote.quality_filters;

  return (
    <div className="glass-panel-3d rounded-2xl p-4 sm:p-6 space-y-6 transition-all duration-300">
      {/* Top Header & Stock Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 dark:border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              {quote.symbol}
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              NSE Live
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 text-xs font-semibold">
              {quote.sector}
            </span>
            {rrg && (
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${quadrantColors[quadrant]}`}>
                RRG {rrg.quadrant}
              </span>
            )}
            {quality && (
              <>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-brand-500" />
                  {quality.delivery_pct}% Deliv
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-500" />
                  Piotroski {quality.piotroski_score}/9
                </span>
              </>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted dark:text-slate-400 font-medium">
            {quote.company_name}
          </p>
        </div>

        {/* Quick Search & Watchlist Button */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button
              onClick={() => setIsSearching(!isSearching)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Switch Stock</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Autocomplete Dropdown */}
            {isSearching && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 modal-3d-content bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl shadow-xl z-50 p-3 space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search NSE/BSE symbol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults?.map((res) => (
                    <div
                      key={res.symbol}
                      onClick={() => {
                        onSelectSymbol(res.symbol);
                        setIsSearching(false);
                        setSearchQuery("");
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-extrabold text-xs font-mono text-slate-900 dark:text-white">{res.symbol}</div>
                        <div className="text-[10px] text-muted dark:text-slate-400 truncate max-w-[160px]">{res.company_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">{formatINR(res.price)}</div>
                        <div className={`text-[10px] font-bold ${res.change_pct >= 0 ? "text-profit-600 dark:text-profit-400" : "text-risk-600 dark:text-risk-400"}`}>
                          {res.change_pct >= 0 ? "+" : ""}{res.change_pct.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {onToggleWatchlist && (
            <button
              onClick={() => onToggleWatchlist(quote.symbol)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isWatchlisted
                  ? "bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500"
              }`}
              title={isWatchlisted ? "In Watchlist" : "Add to Watchlist"}
            >
              <Star className={`w-4 h-4 ${isWatchlisted ? "fill-amber-400 text-amber-500" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Live Price Row & 52-Week Range */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Current Price */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400">
            Real-Time Spot Price
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              {formatINR(quote.price)}
            </span>
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                isPos
                  ? "bg-profit-50 dark:bg-profit-950/80 text-profit-700 dark:text-profit-400 border border-profit-200 dark:border-profit-800"
                  : "bg-risk-50 dark:bg-risk-950/80 text-risk-700 dark:text-risk-400 border border-risk-200 dark:border-risk-800"
              }`}
            >
              {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isPos ? "+" : ""}
                {formatINR(quote.change)} ({formatPct(quote.change_pct)})
              </span>
            </div>
          </div>
        </div>

        {/* 52-Week Range Bar */}
        <div className="md:col-span-2 space-y-1.5 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>52W Low: {formatINR(quote.low_52w)}</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">Range Position: {range52wPct.toFixed(0)}%</span>
            <span>52W High: {formatINR(quote.high_52w)}</span>
          </div>
          <div className="relative h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-brand-500 to-indigo-600 dark:from-brand-400 dark:to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${range52wPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Price Chart with Multi-Timeframes */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Historical Price Performance
          </span>

          {/* Timeframe Selectors */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                onClick={() => setSelectedTimeframe(tf.label)}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  selectedTimeframe === tf.label
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-64 sm:h-72 w-full pt-2">
          {isCandlesLoading ? (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted dark:text-slate-500">
              Loading price chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={candles || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="stockPriceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPos ? "#10B981" : "#6366F1"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isPos ? "#10B981" : "#6366F1"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-border dark:border-slate-700 shadow-lg text-xs font-mono">
                          <div className="text-slate-500 dark:text-slate-400">{data.date}</div>
                          <div className="font-extrabold text-slate-900 dark:text-white">Price: {formatINR(data.close)}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Vol: {data.volume?.toLocaleString("en-IN")}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={isPos ? "#10B981" : "#6366F1"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#stockPriceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Financial Fundamental Ratios Grid (3D Hover lift) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Market Cap</span>
          <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
            ₹{quote.market_cap_cr ? `${quote.market_cap_cr.toLocaleString("en-IN")} Cr` : "N/A"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">P/E vs Sector</span>
          <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
            {quote.pe?.toFixed(1) || "N/A"} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ {quote.sector_pe?.toFixed(1) || "N/A"}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">ROCE %</span>
          <div className="text-sm font-extrabold font-mono text-profit-600 dark:text-profit-400">
            {quote.roce ? `${quote.roce.toFixed(1)}%` : "N/A"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">ROE %</span>
          <div className="text-sm font-extrabold font-mono text-profit-600 dark:text-profit-400">
            {quote.roe ? `${quote.roe.toFixed(1)}%` : "N/A"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Debt / Equity</span>
          <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
            {quote.debt_to_equity !== undefined ? quote.debt_to_equity.toFixed(2) : "N/A"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">3Y CAGR</span>
          <div className="text-sm font-extrabold font-mono text-brand-600 dark:text-brand-400">
            {quote.cagr_3y ? `+${quote.cagr_3y.toFixed(1)}%` : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};
