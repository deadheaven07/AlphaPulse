import React, { useState } from "react";
import { formatINR } from "../utils/formatters";
import { TrendingUp, TrendingDown, Layers, Sparkles, Filter } from "lucide-react";

interface TreemapStock {
  symbol: string;
  name: string;
  sector: string;
  marketCapCr: number; // in Crores
  price: number;
  changePct: number;
}

const MARKET_BREADTH_DATA: TreemapStock[] = [
  // Banking & Financial Services
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking & FinServ", marketCapCr: 1280000, price: 712.10, changePct: 0.77 },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking & FinServ", marketCapCr: 990000, price: 1423.20, changePct: -0.48 },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking & FinServ", marketCapCr: 720000, price: 814.50, changePct: 1.12 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra", sector: "Banking & FinServ", marketCapCr: 360000, price: 1780.00, changePct: -0.25 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Banking & FinServ", marketCapCr: 410000, price: 6850.00, changePct: 1.45 },

  // Energy, Power & Oil
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy & Utilities", marketCapCr: 1980000, price: 1322.00, changePct: 1.50 },
  { symbol: "NTPC", name: "NTPC Limited", sector: "Energy & Utilities", marketCapCr: 380000, price: 395.40, changePct: 0.85 },
  { symbol: "TATAPOWER", name: "Tata Power", sector: "Energy & Utilities", marketCapCr: 135000, price: 425.00, changePct: 2.10 },
  { symbol: "COALINDIA", name: "Coal India", sector: "Energy & Utilities", marketCapCr: 245000, price: 415.35, changePct: -1.10 },
  { symbol: "ONGC", name: "ONGC", sector: "Energy & Utilities", marketCapCr: 310000, price: 298.50, changePct: 0.40 },

  // IT & Tech
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "Technology & IT", marketCapCr: 1450000, price: 4210.00, changePct: 0.35 },
  { symbol: "INFY", name: "Infosys", sector: "Technology & IT", marketCapCr: 790000, price: 1130.00, changePct: -0.03 },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "Technology & IT", marketCapCr: 480000, price: 1740.00, changePct: 1.15 },
  { symbol: "WIPRO", name: "Wipro", sector: "Technology & IT", marketCapCr: 280000, price: 540.00, changePct: -0.80 },

  // Defense & Strategic
  { symbol: "HAL", name: "Hindustan Aeronautics", sector: "Defense & Aerospace", marketCapCr: 320000, price: 4856.00, changePct: 2.45 },
  { symbol: "BEL", name: "Bharat Electronics", sector: "Defense & Aerospace", marketCapCr: 295000, price: 408.00, changePct: 1.85 },
  { symbol: "MAZDOCK", name: "Mazagon Dock", sector: "Defense & Aerospace", marketCapCr: 88000, price: 4320.00, changePct: 3.20 },

  // Auto & Mobility
  { symbol: "TMPV", name: "Tata Motors Passenger", sector: "Automobile & EV", marketCapCr: 220000, price: 311.50, changePct: -0.16 },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Automobile & EV", marketCapCr: 390000, price: 12400.00, changePct: 0.65 },
  { symbol: "M&M", name: "Mahindra & Mahindra", sector: "Automobile & EV", marketCapCr: 340000, price: 2890.00, changePct: 1.70 },

  // Infrastructure & Capex
  { symbol: "LT", name: "Larsen & Toubro", sector: "Infrastructure & Capex", marketCapCr: 540000, price: 3964.10, changePct: 1.30 },
  { symbol: "ADANIENT", name: "Adani Enterprises", sector: "Infrastructure & Capex", marketCapCr: 340000, price: 2980.00, changePct: -0.95 },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", sector: "Infrastructure & Capex", marketCapCr: 315000, price: 10900.00, changePct: 0.50 },

  // Consumer & Retail
  { symbol: "ITC", name: "ITC Limited", sector: "FMCG & Retail", marketCapCr: 610000, price: 488.00, changePct: 0.40 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG & Retail", marketCapCr: 580000, price: 2650.00, changePct: -0.30 },
  { symbol: "ETERNAL", name: "Eternal Limited (Zomato)", sector: "FMCG & Retail", marketCapCr: 285000, price: 322.75, changePct: 2.80 },
  { symbol: "TITAN", name: "Titan Company", sector: "FMCG & Retail", marketCapCr: 310000, price: 3450.00, changePct: 0.90 },
];

interface MarketTreemapProps {
  onSelectStock: (symbol: string) => void;
}

export const MarketTreemap: React.FC<MarketTreemapProps> = ({ onSelectStock }) => {
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"marketCap" | "gainers" | "losers">("marketCap");

  const sectors = ["all", ...Array.from(new Set(MARKET_BREADTH_DATA.map((s) => s.sector)))];

  const filtered = MARKET_BREADTH_DATA.filter(
    (s) => selectedSector === "all" || s.sector === selectedSector
  ).sort((a, b) => {
    if (sortBy === "marketCap") return b.marketCapCr - a.marketCapCr;
    if (sortBy === "gainers") return b.changePct - a.changePct;
    return a.changePct - b.changePct;
  });

  const getTileColor = (pct: number) => {
    if (pct >= 2.0) return "bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400/40";
    if (pct >= 0.5) return "bg-emerald-500/30 hover:bg-emerald-500/45 text-emerald-950 dark:text-emerald-200 border-emerald-500/30";
    if (pct >= 0) return "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-300 border-emerald-500/20";
    if (pct > -1.0) return "bg-rose-500/15 hover:bg-rose-500/25 text-rose-900 dark:text-rose-300 border-rose-500/20";
    return "bg-rose-600/80 hover:bg-rose-500 text-white border-rose-400/40";
  };

  const totalCap = filtered.reduce((sum, item) => sum + item.marketCapCr, 0);

  return (
    <div className="space-y-4">
      {/* Treemap Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/80 dark:bg-[#181920]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Nifty 50 & Momentum Sector Heatmap
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ₹{(totalCap / 100000).toFixed(1)} Lakh Cr Tracked
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive market cap-weighted breadth heatmap • Click any tile to inspect in Stock Studio
            </p>
          </div>
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sector Selector */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="text-xs font-semibold py-1.5 px-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec} className="bg-white dark:bg-slate-900">
                  {sec === "all" ? "All Sectors (Full Market)" : sec}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Pill */}
          <div className="flex items-center p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] text-xs">
            <button
              onClick={() => setSortBy("marketCap")}
              className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                sortBy === "marketCap"
                  ? "bg-white dark:bg-[#2A2B33] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Market Cap
            </button>
            <button
              onClick={() => setSortBy("gainers")}
              className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                sortBy === "gainers"
                  ? "bg-white dark:bg-[#2A2B33] text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Top Gainers
            </button>
            <button
              onClick={() => setSortBy("losers")}
              className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                sortBy === "losers"
                  ? "bg-white dark:bg-[#2A2B33] text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Top Losers
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Heatmap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {filtered.map((stock) => {
          const isGain = stock.changePct >= 0;
          const isBig = stock.marketCapCr >= 500000;

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectStock(stock.symbol)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 text-left flex flex-col justify-between group cursor-pointer shadow-xs hover:scale-[1.02] hover:shadow-md ${
                isBig ? "col-span-1 sm:col-span-2 md:col-span-2" : "col-span-1"
              } ${getTileColor(stock.changePct)}`}
            >
              <div className="flex items-start justify-between gap-1 w-full">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold font-mono text-sm tracking-tight">
                      {stock.symbol}
                    </span>
                    <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[10px] opacity-80 truncate max-w-[130px] font-medium">
                    {stock.name}
                  </div>
                </div>

                <div
                  className={`text-xs font-black font-mono px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                    isGain
                      ? "bg-emerald-950/20 text-white"
                      : "bg-rose-950/20 text-white"
                  }`}
                >
                  {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>
                    {isGain ? "+" : ""}
                    {stock.changePct.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between pt-2 border-t border-black/5 dark:border-white/10 w-full text-xs">
                <span className="font-mono font-bold">{formatINR(stock.price)}</span>
                <span className="text-[10px] font-mono opacity-75">
                  ₹{(stock.marketCapCr / 1000).toFixed(0)}K Cr
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
