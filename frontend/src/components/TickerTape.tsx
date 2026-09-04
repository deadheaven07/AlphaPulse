import React, { useMemo } from "react";
import { formatINR, formatPct } from "../utils/formatters";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTickerFeed } from "../services/api";
import type { TickerItem } from "../types";

interface TickerTapeProps {
  onSelectSymbol: (symbol: string) => void;
}

const FALLBACK_TICKERS: TickerItem[] = [
  { symbol: "NIFTY 50", name: "Nifty 50 Index", price: 24850.50, change: 142.30, change_pct: 0.58, is_index: true },
  { symbol: "SENSEX", name: "BSE Sensex", price: 81450.20, change: 480.10, change_pct: 0.59, is_index: true },
  { symbol: "BANK NIFTY", name: "Bank Nifty", price: 51220.80, change: 310.40, change_pct: 0.61, is_index: true },
  { symbol: "NIFTY IT", name: "Nifty IT", price: 42150.00, change: -85.20, change_pct: -0.20, is_index: true },
  { symbol: "INDIA VIX", name: "India Volatility", price: 12.85, change: -0.45, change_pct: -3.38, is_index: true },
  { symbol: "TMPV", name: "Tata Motors PV", price: 312.30, change: 3.50, change_pct: 1.13, is_index: false },
  { symbol: "RELIANCE", name: "Reliance Ind.", price: 1302.50, change: -10.60, change_pct: -0.81, is_index: false },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 706.65, change: 5.85, change_pct: 0.83, is_index: false },
  { symbol: "INFY", name: "Infosys Ltd", price: 1130.30, change: -9.70, change_pct: -0.85, is_index: false },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 1430.00, change: 3.50, change_pct: 0.25, is_index: false },
  { symbol: "TCS", name: "Tata Consultancy", price: 2320.10, change: -27.90, change_pct: -1.19, is_index: false },
  { symbol: "ITC", name: "ITC Ltd", price: 263.00, change: -3.30, change_pct: -1.24, is_index: false },
  { symbol: "LT", name: "Larsen & Toubro", price: 3975.00, change: -6.00, change_pct: -0.15, is_index: false },
  { symbol: "COALINDIA", name: "Coal India", price: 420.05, change: 2.20, change_pct: 0.53, is_index: false },
  { symbol: "BEL", name: "Bharat Electronics", price: 408.60, change: 2.85, change_pct: 0.70, is_index: false },
  { symbol: "HAL", name: "Hindustan Aero", price: 4765.60, change: -14.40, change_pct: -0.30, is_index: false },
  { symbol: "TATAPOWER", name: "Tata Power", price: 365.70, change: 1.70, change_pct: 0.47, is_index: false },
  { symbol: "TRENT", name: "Trent Retail", price: 2846.70, change: 12.50, change_pct: 0.44, is_index: false },
  { symbol: "ETERNAL", name: "Eternal Ltd (Zomato)", price: 323.85, change: 4.20, change_pct: 1.31, is_index: false },
];

export const TickerTape: React.FC<TickerTapeProps> = ({ onSelectSymbol }) => {
  // Live continuous real-time ticker data polling every 15s
  const { data: liveTickers } = useQuery({
    queryKey: ["live-ticker-feed"],
    queryFn: fetchTickerFeed,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const tickerList = useMemo(() => {
    if (liveTickers && liveTickers.length > 0) {
      return liveTickers;
    }
    return FALLBACK_TICKERS;
  }, [liveTickers]);

  return (
    <div className="w-full h-11 min-h-[44px] bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-border dark:border-border-dark flex items-center select-none relative z-30 shadow-xs transition-colors duration-300">
      <div className="flex items-center w-full h-full min-w-0">
        {/* Left Live Badge */}
        <div className="flex items-center gap-1.5 px-3.5 h-full bg-slate-100 dark:bg-canvas-dark text-slate-800 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider shrink-0 border-r border-slate-200 dark:border-border-dark shadow-2xs z-20">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
          <span className="font-mono hidden sm:inline tracking-tight">NSE/BSE LIVE</span>
          <span className="font-mono sm:hidden">LIVE</span>
        </div>

        {/* Continuous Flow Marquee Viewport */}
        <div className="flex-1 h-full overflow-hidden whitespace-nowrap relative min-w-0 flex items-center">
          {/* Subtle gradient edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-surface-dark to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-surface-dark to-transparent z-10 pointer-events-none" />

          {/* Seamless Infinite Marquee Track */}
          <div className="animate-ticker inline-flex items-center gap-3 pl-4">
            {[...tickerList, ...tickerList].map((item, idx) => {
              const isPos = item.change >= 0;
              const isIndex = item.is_index;

              return (
                <div
                  key={`${item.symbol}-${idx}`}
                  onClick={() => !isIndex && onSelectSymbol(item.symbol)}
                  className={`inline-flex items-center gap-2 text-xs py-1 px-2.5 rounded-lg border transition-all ${
                    isIndex
                      ? "bg-slate-50 dark:bg-canvas-dark border-slate-200 dark:border-border-dark text-slate-800 dark:text-slate-200"
                      : "bg-white dark:bg-surface-elevated border-slate-200 dark:border-border-dark hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 hover:scale-105 cursor-pointer shadow-2xs"
                  }`}
                  title={!isIndex ? `Click to inspect & simulate ${item.symbol}` : undefined}
                >
                  <span
                    className={`font-mono text-xs ${
                      isIndex
                        ? "font-extrabold text-slate-700 dark:text-slate-300"
                        : "font-black text-slate-900 dark:text-white"
                    }`}
                  >
                    {item.symbol}
                  </span>

                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                    {item.symbol === "INDIA VIX" || item.symbol.includes("VIX")
                      ? item.price.toFixed(2)
                      : formatINR(item.price)}
                  </span>

                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md font-mono ${
                      isPos
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {formatPct(item.change_pct)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
