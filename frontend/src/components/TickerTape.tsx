import React from "react";
import { formatINR, formatPct } from "../utils/formatters";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  isIndex?: boolean;
}

interface TickerTapeProps {
  onSelectSymbol: (symbol: string) => void;
}

const LIVE_TICKERS: TickerItem[] = [
  { symbol: "NIFTY 50", name: "Nifty 50 Index", price: 24850.50, change: 142.30, change_pct: 0.58, isIndex: true },
  { symbol: "SENSEX", name: "BSE Sensex", price: 81450.20, change: 480.10, change_pct: 0.59, isIndex: true },
  { symbol: "BANK NIFTY", name: "Bank Nifty", price: 51220.80, change: 310.40, change_pct: 0.61, isIndex: true },
  { symbol: "NIFTY IT", name: "Nifty IT", price: 42150.00, change: -85.20, change_pct: -0.20, isIndex: true },
  { symbol: "INDIA VIX", name: "India Volatility", price: 12.85, change: -0.45, change_pct: -3.38, isIndex: true },
  { symbol: "TATAMOTORS", name: "Tata Motors", price: 1045.60, change: 22.30, change_pct: 2.18 },
  { symbol: "BEL", name: "Bharat Electronics", price: 408.60, change: 9.40, change_pct: 2.35 },
  { symbol: "HAL", name: "Hindustan Aeronautics", price: 4765.60, change: 88.00, change_pct: 1.88 },
  { symbol: "RELIANCE", name: "Reliance Ind.", price: 1302.50, change: 14.20, change_pct: 1.10 },
  { symbol: "TCS", name: "Tata Consultancy", price: 4180.25, change: -12.40, change_pct: -0.30 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1640.80, change: 14.50, change_pct: 0.89 },
  { symbol: "LT", name: "Larsen & Toubro", price: 3620.50, change: 38.00, change_pct: 1.06 },
  { symbol: "TATAPOWER", name: "Tata Power", price: 435.60, change: 8.90, change_pct: 2.09 },
  { symbol: "TRENT", name: "Trent Retail", price: 6850.00, change: 140.00, change_pct: 2.09 },
  { symbol: "ZOMATO", name: "Zomato Ltd", price: 265.50, change: 7.80, change_pct: 3.03 },
];

export const TickerTape: React.FC<TickerTapeProps> = ({ onSelectSymbol }) => {
  return (
    <div className="w-full bg-white border-b border-border/80 overflow-hidden py-1.5 select-none relative z-30 shadow-xs">
      <div className="flex items-center">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider rounded-r-md shrink-0 border-r border-slate-200">
          <Activity className="w-3 h-3 text-brand-600 animate-pulse" />
          <span>NSE/BSE Feeds</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="animate-ticker flex items-center gap-6">
            {[...LIVE_TICKERS, ...LIVE_TICKERS].map((item, idx) => {
              const isPos = item.change >= 0;
              return (
                <div
                  key={`${item.symbol}-${idx}`}
                  onClick={() => !item.isIndex && onSelectSymbol(item.symbol)}
                  className={`inline-flex items-center gap-2 text-xs font-semibold px-2 py-0.5 rounded-lg transition-colors ${
                    !item.isIndex ? "cursor-pointer hover:bg-slate-100" : ""
                  }`}
                  title={!item.isIndex ? `Click to simulate ${item.symbol}` : undefined}
                >
                  <span className={`font-mono ${item.isIndex ? "font-bold text-slate-800" : "font-extrabold text-slate-900"}`}>
                    {item.symbol}
                  </span>
                  <span className="font-mono text-slate-700 font-medium">
                    {formatINR(item.price)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-bold font-mono ${
                      isPos ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {formatPct(item.change_pct)}
                  </span>
                  <span className="text-slate-300 ml-2">•</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
