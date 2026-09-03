import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchKpiRadar, fetchTopDividendYielders, fetchDbHoldings, fetchOptionChainPcr } from "../services/api";
import { formatINR } from "../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  ShieldAlert,
  ArrowRight,
  Coins,
  Radar,
  CheckCircle2,
  Zap,
  Gauge,
  Sparkles
} from "lucide-react";

interface OverviewPageProps {
  onSelectStock: (symbol: string) => void;
  onNavigate: (page: "radar" | "studio" | "simulator" | "dividend" | "portfolio") => void;
}

const INDICES = [
  { name: "NIFTY 50", value: "₹24,850.50", change: "+0.58%", isPos: true },
  { name: "SENSEX", value: "₹81,450.20", change: "+0.59%", isPos: true },
  { name: "BANK NIFTY", value: "₹51,220.80", change: "+0.61%", isPos: true },
  { name: "INDIA VIX", value: "12.85 pts", change: "-3.38%", isPos: false }
];

export const OverviewPage: React.FC<OverviewPageProps> = ({ onSelectStock, onNavigate }) => {
  const { data: radarStocks } = useQuery({
    queryKey: ["kpi-radar-overview"],
    queryFn: () => fetchKpiRadar(100000),
  });

  const { data: dividendYielders } = useQuery({
    queryKey: ["top-dividend-yielders-overview"],
    queryFn: fetchTopDividendYielders,
  });

  const { data: holdings } = useQuery({
    queryKey: ["db-holdings-overview"],
    queryFn: fetchDbHoldings,
  });

  const { data: optionPcr } = useQuery({
    queryKey: ["option-chain-pcr-overview"],
    queryFn: fetchOptionChainPcr,
    refetchInterval: 60000,
  });

  const topPicks = (radarStocks || []).slice(0, 3);
  const topDividends = (dividendYielders || []).slice(0, 3);

  // Quick Portfolio Calculations
  const totalHoldings = holdings?.length || 0;
  const totalInvested = (holdings || []).reduce((acc, h) => acc + h.entry_price * h.shares, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner & Value Prop */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-surface-dark dark:via-surface-elevated dark:to-surface-dark border border-slate-800 text-white shadow-soft relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-300" />
              Institutional Edge
            </span>
            <span className="text-xs text-slate-400">Budget 2024 Post-Tax & STT Precision</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome to AlphaPulse India Pro Workstation
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Eliminate retail bias. 1,000-path Monte Carlo probability curves, Piotroski 8/9 quality filtering, 24/7 Demat threat watchdog, and high-yield dividend roadmaps.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto z-10">
          <button
            onClick={() => onNavigate("radar")}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Radar className="w-4 h-4" />
            <span>Open Radar</span>
          </button>
          <button
            onClick={() => onNavigate("portfolio")}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>My Vault ({totalHoldings})</span>
          </button>
        </div>
      </div>

      {/* Free Institutional Superpower: Market Tide Barometer (Sensibull Style Option Chain PCR & Max Pain) */}
      {optionPcr && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white border border-emerald-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Market Tide Barometer (NSE Option Chain PCR)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-mono font-bold">
                    Sensibull Style
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Real-time Open Interest (OI) floor & derivatives sentiment
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">NIFTY Put-Call Ratio</span>
                <span className="text-sm font-black text-emerald-400">{optionPcr.pcr}</span>
              </div>
              <span
                className={`px-2 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                  optionPcr.sentiment_color === "emerald"
                    ? "bg-emerald-900/80 text-emerald-300 border border-emerald-500/50"
                    : optionPcr.sentiment_color === "rose"
                    ? "bg-rose-900/80 text-rose-300 border border-rose-500/50"
                    : "bg-teal-900/80 text-teal-300 border border-teal-500/50"
                }`}
              >
                {optionPcr.sentiment.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Put OI (Support Floor)
              </span>
              <span className="text-xs font-black text-emerald-400">
                {(optionPcr.total_put_oi / 100000).toFixed(2)} Lakh Contracts
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Call OI (Overhead Ceiling)
              </span>
              <span className="text-xs font-black text-rose-400">
                {(optionPcr.total_call_oi / 100000).toFixed(2)} Lakh Contracts
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-900/60 space-y-0.5">
              <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider block">
                Max Pain Expiry Magnet
              </span>
              <span className="text-xs font-black text-amber-300">
                ₹{optionPcr.max_pain_strike.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-sans">{optionPcr.verdict}</p>
          </div>
        </div>
      )}

      {/* Market Pulse Indices Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {INDICES.map((idx) => (
          <div
            key={idx.name}
            className="p-3.5 rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark glass-card-hover shadow-2xs"
          >
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted dark:text-muted-dark">
              {idx.name}
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-white">
                {idx.value}
              </span>
              <span
                className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                  idx.isPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {idx.isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {idx.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Core Snapshot: High Conviction Buys + Portfolio/Dividend Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Top 3 Institutional High-Conviction Buys */}
        <div className="lg:col-span-2 glass-panel-3d rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 dark:border-border-dark pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Radar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Top High-Conviction Radar Buys
                </h2>
                <p className="text-[11px] text-muted dark:text-muted-dark">Delivery &ge; 50% + Piotroski &ge; 7 + Positive News</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("radar")}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topPicks.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => {
                  onSelectStock(stock.symbol);
                  onNavigate("studio");
                }}
                className="p-3.5 rounded-xl bg-white/70 dark:bg-surface-elevated/80 border border-slate-200/80 dark:border-border-dark hover:border-emerald-500 hover:shadow-soft transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-sm font-mono text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {stock.symbol}
                    </span>
                    <p className="text-[10px] text-muted dark:text-muted-dark truncate max-w-[120px]">
                      {stock.company_name}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {formatINR(stock.price)}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">1Y Net Gain</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    +{formatINR(stock.post_tax_net_gain_inr)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted dark:text-muted-dark pt-1">
                  <span>Deliv: <strong className="text-slate-700 dark:text-slate-300">{stock.delivery_pct}%</strong></span>
                  <span>Score: <strong className="text-emerald-600 dark:text-emerald-400">F-{stock.piotroski_score}/9</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Demat Vault Snapshot & Upcoming Dividends */}
        <div className="space-y-4">
          {/* Demat Vault Card */}
          <div className="glass-panel-3d rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/80 dark:border-border-dark pb-2">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900 dark:text-white">
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                <span>Persistent Demat Vault</span>
              </div>
              <button
                onClick={() => onNavigate("portfolio")}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200/70 dark:border-border-dark">
                <span className="text-[10px] text-muted dark:text-muted-dark block">Active Holdings</span>
                <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">
                  {totalHoldings} Stocks
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200/70 dark:border-border-dark">
                <span className="text-[10px] text-muted dark:text-muted-dark block">Total Capital</span>
                <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">
                  {formatINR(totalInvested || 100000)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>24/7 Watchdog actively safeguarding stop-loss floors.</span>
            </div>
          </div>

          {/* Upcoming Dividend Highlights */}
          <div className="glass-panel-3d rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/80 dark:border-border-dark pb-2">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900 dark:text-white">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>Dividend Champions</span>
              </div>
              <button
                onClick={() => onNavigate("dividend")}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Calculator
              </button>
            </div>

            <div className="space-y-1.5">
              {topDividends.map((div) => (
                <div
                  key={div.symbol}
                  onClick={() => {
                    onSelectStock(div.symbol);
                    onNavigate("dividend");
                  }}
                  className="p-2 rounded-xl bg-white/60 dark:bg-surface-elevated border border-slate-100 dark:border-border-dark flex items-center justify-between text-xs hover:border-amber-400 transition-all cursor-pointer"
                >
                  <div>
                    <span className="font-extrabold font-mono text-slate-900 dark:text-white">{div.symbol}</span>
                    <span className="text-[10px] text-muted dark:text-muted-dark block">Ex: {div.next_ex_date}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-amber-600 dark:text-amber-400">{div.dividend_yield_pct}% Yield</span>
                    <span className="text-[10px] text-slate-500 dark:text-muted-dark block">₹{div.dps_annual}/sh</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step Plain English Quant Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">100% Tax & STT Precision</div>
            <div className="text-[11px] text-muted dark:text-muted-dark">Budget 2024 STCG 20% & LTCG 12.5% matches demat contract note.</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">95% Quality Moat</div>
            <div className="text-[11px] text-muted dark:text-muted-dark">Piotroski &ge; 7 & Delivery &ge; 50% eliminates 95% of retail traps.</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">85% Statistical Edge</div>
            <div className="text-[11px] text-muted dark:text-muted-dark">Radar Conviction + Live News Win Probabilities give institutional odds.</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark flex items-start gap-2.5 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">Rule #1: Capital Preservation</div>
            <div className="text-[11px] text-muted dark:text-muted-dark">When Bear Stop-Loss is breached, exit immediately without emotion.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
