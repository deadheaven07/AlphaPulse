import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { runProfitSimulation } from "../services/api";
import type { RiskTolerance, SimulationResult } from "../types";
import { formatINR, formatHorizon } from "../utils/formatters";
import { ProjectionChart } from "./ProjectionChart";
import confetti from "canvas-confetti";
import {
  Calculator,
  Coins,
  Clock,
  Shield,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  Receipt
} from "lucide-react";

interface ProfitSimulatorProps {
  symbol: string;
  initialCapital?: number;
  initialHorizon?: number;
  onSaveSimulation?: (sim: SimulationResult) => void;
}

const CAPITAL_PRESETS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];
const HORIZON_SEGMENTS = [
  { label: "1M", months: 1, title: "Tactical" },
  { label: "3M", months: 3, title: "Quarterly" },
  { label: "6M", months: 6, title: "Mid-Term" },
  { label: "1Y", months: 12, title: "Annual" },
  { label: "2Y", months: 24, title: "Capex Cycle" },
  { label: "3Y", months: 36, title: "Structural" },
  { label: "5Y", months: 60, title: "Compounder" },
];

export const ProfitSimulator: React.FC<ProfitSimulatorProps> = ({
  symbol,
  initialCapital = 100000,
  initialHorizon = 12,
  onSaveSimulation,
}) => {
  const [capital, setCapital] = useState<number>(initialCapital);
  const [prevInitialCapital, setPrevInitialCapital] = useState<number>(initialCapital);
  const [horizonMonths, setHorizonMonths] = useState<number>(initialHorizon);
  const [prevInitialHorizon, setPrevInitialHorizon] = useState<number>(initialHorizon);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("Moderate");
  const [isSaved, setIsSaved] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  if (prevInitialCapital !== initialCapital) {
    setPrevInitialCapital(initialCapital);
    setCapital(initialCapital);
  }

  if (prevInitialHorizon !== initialHorizon) {
    setPrevInitialHorizon(initialHorizon);
    setHorizonMonths(initialHorizon);
  }

  const { data: simData } = useQuery({
    queryKey: ["profit-sim-mc", symbol, capital, horizonMonths, riskTolerance],
    queryFn: () => runProfitSimulation(symbol, capital, horizonMonths, riskTolerance),
    enabled: Boolean(symbol) && capital > 0 && horizonMonths > 0,
  });

  const handleSave = () => {
    if (!simData) return;
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.75 },
      colors: ["#6366F1", "#10B981", "#3B82F6"],
    });
    setIsSaved(true);
    if (onSaveSimulation) {
      onSaveSimulation(simData);
    }
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Target Calendar Milestone
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + horizonMonths);
  const targetDateStr = targetDate.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const baseTax = simData?.base_case?.taxes_and_charges;

  return (
    <div className="space-y-6">
      {/* Control Deck Card */}
      <div className="glass-panel-3d rounded-2xl p-4 sm:p-6 space-y-6 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Monte Carlo & Post-Tax Profit Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  1,000 Stochastic Paths
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  Statutory Tax Net (Post-STCG/LTCG)
                </span>
              </div>
              <p className="text-xs text-muted dark:text-slate-400">
                Holding-period ROI modeling with STT, Stamp Duty, GST, and STCG/LTCG capital gains friction for {symbol}
              </p>
            </div>
          </div>

          {/* Save to Vault Action Button */}
          <button
            onClick={handleSave}
            disabled={!simData}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer ${
              isSaved
                ? "bg-profit-600 text-white"
                : "bg-slate-900 hover:bg-black dark:bg-brand-600 dark:hover:bg-brand-500 text-white"
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            <span>{isSaved ? "Saved to Vault!" : "Save Strategy"}</span>
          </button>
        </div>

        {/* Input Parameters Form (Responsive 3-column layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Capital Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-brand-500" />
                Capital (₹)
              </label>
              <span className="text-sm font-extrabold font-mono text-brand-600 dark:text-brand-400">
                {formatINR(capital)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min={500}
                step={5000}
                value={capital}
                onChange={(e) => setCapital(Math.max(500, Number(e.target.value)))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/80 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-500/40 focus:border-brand-500 transition-all shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04] flex-wrap">
              {CAPITAL_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCapital(amt)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                    capital === amt
                      ? "bg-white dark:bg-[#2A2B33] text-slate-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {amt >= 100000 ? `₹${amt / 100000}L` : `₹${amt / 1000}K`}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Horizon Segment Selectors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-500" />
                Target Horizon
              </label>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {formatHorizon(horizonMonths)}
              </span>
            </div>

            <div className="p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04] space-y-1">
              <div className="grid grid-cols-4 gap-1">
                {HORIZON_SEGMENTS.slice(0, 4).map((seg) => (
                  <button
                    key={seg.months}
                    type="button"
                    onClick={() => setHorizonMonths(seg.months)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      horizonMonths === seg.months
                        ? "bg-white dark:bg-[#2A2B33] text-slate-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>{seg.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1">
                {HORIZON_SEGMENTS.slice(4).map((seg) => (
                  <button
                    key={seg.months}
                    type="button"
                    onClick={() => setHorizonMonths(seg.months)}
                    className={`py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      horizonMonths === seg.months
                        ? "bg-white dark:bg-[#2A2B33] text-slate-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>{seg.label}</span>
                    <span className="text-[9px] opacity-70">({seg.months / 12}Y)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Risk Tolerance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-500" />
                Risk Appetite
              </label>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {riskTolerance}
              </span>
            </div>

            <div className="p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04] grid grid-cols-3 gap-1">
              {(["Conservative", "Moderate", "Aggressive"] as RiskTolerance[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskTolerance(r)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    riskTolerance === r
                      ? "bg-white dark:bg-[#2A2B33] text-slate-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span>{r}</span>
                  <span className="text-[10px] opacity-75 font-mono">
                    {r === "Conservative" ? "Low Beta" : r === "Moderate" ? "Market Drift" : "High Beta"}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
              <span>Target Milestone:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{targetDateStr}</strong>
            </div>
          </div>
        </div>

        {/* Share Allocation Badge */}
        {simData && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-muted dark:text-slate-400 font-medium">Spot Entry Price: </span>
                <strong className="font-mono text-slate-900 dark:text-white font-bold">{formatINR(simData.current_price)}</strong>
              </div>
              <div>
                <span className="text-muted dark:text-slate-400 font-medium">Exact Share Allocation: </span>
                <strong className="font-mono text-slate-900 dark:text-white font-bold">{simData.shares} Shares</strong>
              </div>
              <div>
                <span className="text-muted dark:text-slate-400 font-medium">Deployed Capital: </span>
                <strong className="font-mono text-slate-900 dark:text-white font-bold">{formatINR(simData.deployed_capital)}</strong>
              </div>
              <div>
                <span className="text-muted dark:text-slate-400 font-medium">Uninvested Cash: </span>
                <strong className="font-mono text-slate-900 dark:text-white font-bold">{formatINR(simData.cash_buffer)}</strong>
              </div>
            </div>
            <div className="text-[11px] font-mono text-brand-700 dark:text-brand-300 font-bold">
              Annualized Drift: {(simData.annual_drift_pct || 14.5).toFixed(1)}% | Volatility: {(simData.annual_volatility_pct || 22.0).toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* 3 Outcome Forecast Cards (Bull / Base / Bear) */}
      {simData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. 🚀 Bull Case Card */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/80 shadow-soft hover:shadow-hover dark:hover:shadow-hover-dark transition-all space-y-4 relative overflow-hidden glass-card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Bull Case (90th %ile)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                +{simData.bull_case.roi_pct.toFixed(1)}% Gain
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Target Spot Price
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatINR(simData.bull_case.target_price)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                In-Hand Net Profit (Post-Tax)
              </span>
              <div className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                +{formatINR(simData.bull_case.net_in_hand_profit)}
              </div>
              <span className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 block">
                Portfolio Net: {formatINR(simData.bull_case.total_value)}
              </span>
            </div>
          </div>

          {/* 2. ⚖️ Base Case (Consensus / Median 50th %ile) */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-brand-200 dark:border-brand-800/80 shadow-soft hover:shadow-hover dark:hover:shadow-hover-dark transition-all space-y-4 relative overflow-hidden glass-card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-glow-cyan" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800 dark:text-brand-300">
                  Base Case (50th %ile Median)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300">
                +{simData.base_case.roi_pct.toFixed(1)}% Gain
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Target Spot Price
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatINR(simData.base_case.target_price)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900 space-y-1">
              <span className="text-[10px] font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wider block">
                In-Hand Net Profit (Post-Tax)
              </span>
              <div className="text-xl font-extrabold font-mono text-brand-700 dark:text-brand-400">
                +{formatINR(simData.base_case.net_in_hand_profit)}
              </div>
              <span className="text-[10px] text-brand-800/80 dark:text-brand-400/80 block">
                Portfolio Net: {formatINR(simData.base_case.total_value)}
              </span>
            </div>
          </div>

          {/* 3. 🛡️ Bear Case (10th %ile / VaR Drawdown) */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-800/80 shadow-soft hover:shadow-hover dark:hover:shadow-hover-dark transition-all space-y-4 relative overflow-hidden glass-card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow-rose" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Bear Case (10th %ile / VaR)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                {simData.bear_case.roi_pct.toFixed(1)}% Drawdown
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Trailing Floor / Stop-Loss
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatINR(simData.bear_case.target_price)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 space-y-1">
              <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                Estimated Capital At Risk
              </span>
              <div className="text-xl font-extrabold font-mono text-rose-700 dark:text-rose-400">
                {formatINR(simData.bear_case.net_in_hand_profit)}
              </div>
              <span className="text-[10px] text-rose-800/80 dark:text-rose-400/80 block">
                Preserved Capital: {formatINR(simData.bear_case.total_value)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Taxes & Charges Friction Drawer (STCG 20% / LTCG 12.5% Breakdown) */}
      {baseTax && (
        <div className="glass-panel-3d rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Statutory Levies & Capital Gains Tax Friction Breakdown ({baseTax.tax_type})
              </h4>
            </div>
            <button className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 cursor-pointer">
              <span>{showTaxBreakdown ? "Hide Breakdown" : "View Breakdown"}</span>
              {showTaxBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showTaxBreakdown && (
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs border-t border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">STT (0.1% Exit)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{baseTax.stt.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Exchange Fees</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{baseTax.exchange_fees.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Stamp Duty (0.015%)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{baseTax.stamp_duty.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">SEBI & GST (18%)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(baseTax.sebi_charges + baseTax.gst).toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">{baseTax.tax_type}</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">₹{baseTax.capital_gains_tax.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Total Friction</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                  ₹{(baseTax.total_statutory_friction + baseTax.capital_gains_tax).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trajectory Timeline Chart */}
      {simData?.trajectory && (
        <ProjectionChart
          trajectory={simData.trajectory}
          symbol={simData.symbol}
          capital={simData.capital}
        />
      )}
    </div>
  );
};
