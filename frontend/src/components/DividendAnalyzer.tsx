import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDividendAnalysis, fetchTopDividendYielders } from "../services/api";
import { formatINR } from "../utils/formatters";
import {
  Coins,
  Calendar,
  Sparkles,
  Building2
} from "lucide-react";

interface DividendAnalyzerProps {
  symbol: string;
  onSelectStock: (symbol: string) => void;
}

export const DividendAnalyzer: React.FC<DividendAnalyzerProps> = ({
  symbol,
  onSelectStock,
}) => {
  const [capital, setCapital] = useState<number>(100000);

  const { data: divData, isLoading: isDivLoading } = useQuery({
    queryKey: ["dividend-analyzer", symbol, capital],
    queryFn: () => fetchDividendAnalysis(symbol, capital),
  });

  const { data: topYielders } = useQuery({
    queryKey: ["top-dividend-yielders"],
    queryFn: fetchTopDividendYielders,
  });

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Dividend Intelligence & Timing Analyzer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cash Flow Yield Engine
                </span>
              </div>
              <p className="text-xs text-muted">
                Pre-dividend accumulation window, demat record date verification, and direct bank account payout simulator for {symbol}
              </p>
            </div>
          </div>

          {divData && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Yield: {divData.dividend_yield_pct}% Annual</span>
              </span>
            </div>
          )}
        </div>

        {isDivLoading || !divData ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Calculating dividend cash payouts & optimal dates for {symbol}...</p>
          </div>
        ) : (
          <>
            {/* Capital Input & Cash Payout Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Capital Stepper */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    Capital to Allocate (₹)
                  </label>
                  <span className="text-sm font-extrabold font-mono text-emerald-600">
                    {formatINR(capital)}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1000}
                    step={10000}
                    value={capital}
                    onChange={(e) => setCapital(Math.max(1000, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[25000, 50000, 100000, 250000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCapital(amt)}
                      className={`py-1 px-2.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                        capital === amt
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {amt >= 100000 ? `₹${amt / 100000}L` : `₹${amt / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Annual Expected Cash Credit */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Expected Annual Bank Cash Credit
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 mt-1">
                    +{formatINR(divData.expected_annual_cash)}
                  </div>
                </div>
                <div className="text-[11px] text-emerald-800/80 font-medium">
                  Direct Demat payout on {divData.shares} Shares @ ₹{divData.dps_annual}/share annual DPS
                </div>
              </div>

              {/* Next Upcoming Interim Payout */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Next Interim Cash Payout
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">
                    +{formatINR(divData.expected_payout_cash)}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Payout Schedule: <strong className="text-slate-800">{divData.payout_months}</strong> ({divData.payout_frequency})
                </div>
              </div>
            </div>

            {/* Optimal Accumulation & Payout Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  "When to Buy" Optimal Timing Roadmap
                </span>
                <span className="text-xs text-muted font-medium">
                  Next Ex-Dividend Cutoff: <strong className="font-mono text-slate-900">{divData.next_ex_date}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {divData.timeline_steps.map((step) => (
                  <div
                    key={step.step}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-extrabold flex items-center justify-center">
                        {step.step}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {step.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{step.title}</h4>
                      <p className="text-[11px] font-mono font-bold text-brand-700 mt-0.5">{step.date}</p>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Top High-Yield Indian Dividend Champions */}
      {topYielders && topYielders.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Top Indian Dividend Yield Champions (NSE Ranked)
              </h3>
            </div>
            <span className="text-xs text-muted">Click any champion to analyze</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topYielders.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  stock.symbol === symbol
                    ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200"
                    : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-emerald-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-sm font-mono text-slate-900">{stock.symbol}</span>
                    <p className="text-[10px] text-muted truncate max-w-[120px]">{stock.company_name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 font-mono">
                    {stock.dividend_yield_pct}% Yield
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="font-mono font-bold text-slate-800">{formatINR(stock.price)}</span>
                  <span className="text-[10px] text-slate-500 font-medium">₹{stock.dps_annual} DPS/yr</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
