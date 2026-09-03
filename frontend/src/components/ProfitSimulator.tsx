import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { runProfitSimulation } from "../services/api";
import type { RiskTolerance, SimulationResult } from "../types";
import { formatINR, formatPct, formatHorizon } from "../utils/formatters";
import { ProjectionChart } from "./ProjectionChart";
import confetti from "canvas-confetti";
import {
  Calculator,
  Coins,
  Clock,
  Shield,
  TrendingUp,
  TrendingDown,
  Zap,
  BookmarkPlus,
  Calendar,
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

const CAPITAL_PRESETS = [10000, 25000, 50000, 100000, 250000, 500000];
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
  const [horizonMonths, setHorizonMonths] = useState<number>(initialHorizon);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("Moderate");
  const [isSaved, setIsSaved] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

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
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Monte Carlo & Post-Tax Profit Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  1,000 Stochastic Paths
                </span>
              </div>
              <p className="text-xs text-muted">
                Statistically disciplined 90% VaR confidence modeling with Indian STT, GST, and STCG/LTCG tax deduction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Target: {targetDateStr} ({formatHorizon(horizonMonths)})
            </span>

            <button
              onClick={handleSave}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isSaved
                  ? "bg-profit-50 text-profit-700 border-profit-300"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-profit-600" /> : <BookmarkPlus className="w-3.5 h-3.5 text-brand-600" />}
              <span>{isSaved ? "Saved!" : "Save Strategy"}</span>
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input 1: Capital */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-brand-500" />
                Capital to Invest (₹)
              </label>
              <span className="text-sm font-extrabold font-mono text-brand-600">
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
                step={5000}
                value={capital}
                onChange={(e) => setCapital(Math.max(1000, Number(e.target.value)))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {CAPITAL_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCapital(amt)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                    capital === amt
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {amt >= 100000 ? `₹${amt / 100000}L` : `₹${amt / 1000}K`}
                </button>
              ))}
            </div>
          </div>

          {/* Input 2: Holding Horizon */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-500" />
                Holding Period (Tax Rate: {horizonMonths < 12 ? "20% STCG" : "12.5% LTCG"})
              </label>
              <span className="text-sm font-extrabold text-brand-600">
                {formatHorizon(horizonMonths)}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
              {HORIZON_SEGMENTS.map((seg) => (
                <button
                  key={seg.months}
                  type="button"
                  onClick={() => setHorizonMonths(seg.months)}
                  className={`py-2 px-1 rounded-xl text-center border transition-all ${
                    horizonMonths === seg.months
                      ? "bg-brand-50 border-brand-500 text-brand-700 font-extrabold shadow-sm"
                      : "bg-slate-50 border-slate-200/70 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-xs">{seg.label}</div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-muted">
              {horizonMonths < 12
                ? "STCG applies @ 20% on short-term equity capital gains."
                : "LTCG applies @ 12.5% only on gains above the ₹1.25 Lakh annual exemption."}
            </p>
          </div>

          {/* Input 3: Risk Tolerance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-500" />
                Volatility & Drift Bias
              </label>
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {riskTolerance}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["Conservative", "Moderate", "Aggressive"] as RiskTolerance[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRiskTolerance(mode)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                    riskTolerance === mode
                      ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200/70 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-muted">
              Adjusts stochastic drift and annual price diffusion across 1,000 paths.
            </p>
          </div>
        </div>

        {/* Live Allocation HUD */}
        {simData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Execution Shares
              </span>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                {simData.shares.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-normal text-slate-500 font-sans">Shares</span>
              </div>
              <span className="text-[10px] text-muted">@ {formatINR(simData.current_price)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Deployed Capital
              </span>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                {formatINR(simData.deployed_capital)}
              </div>
              <span className="text-[10px] text-muted">Buffer: {formatINR(simData.cash_buffer)}</span>
            </div>

            <div className="p-3 rounded-xl bg-profit-50 border border-profit-200">
              <span className="text-[10px] font-bold text-profit-700 uppercase tracking-wider block mb-0.5">
                Expected Net In-Hand ROI
              </span>
              <div className="text-base font-extrabold text-profit-700 font-mono">
                {formatPct(simData.expected_value.expected_roi_pct)}
              </div>
              <span className="text-[10px] text-profit-600 font-medium">
                +{formatINR(simData.expected_value.expected_net_profit)} Post-Tax
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Value at Risk (90% VaR)
              </span>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                {formatINR(simData.expected_value.var_90_pct)}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">10th Percentile Floor</span>
            </div>
          </div>
        )}
      </div>

      {/* 3 Dynamic Post-Tax Scenario Forecast Cards */}
      {simData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base Target (50th Percentile Median) */}
          <div className="bg-white rounded-2xl border-2 border-brand-400 shadow-hover p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-brand-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-bl-xl">
              50th %tile (Base)
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-brand-600">
                <Zap className="w-5 h-5" />
                <h3 className="font-extrabold text-base tracking-tight text-slate-900">
                  Base Scenario (Median Path)
                </h3>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Target Price:</div>
                <div className="text-2xl font-extrabold font-mono text-brand-600">
                  {formatINR(simData.base_case.target_price)}
                </div>
                <div className="text-xs font-bold text-brand-700">
                  +{simData.base_case.roi_pct.toFixed(1)}% Real In-Hand ROI
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-100 space-y-1">
                <div className="text-[11px] text-brand-900 font-medium">Real In-Hand Net Profit:</div>
                <div className="text-xl font-extrabold text-brand-700 font-mono">
                  +{formatINR(simData.base_case.net_in_hand_profit)}
                </div>
                <div className="text-[10px] text-brand-700/80 font-mono">
                  Gross: +{formatINR(simData.base_case.gross_profit)} | Post-Tax Final: {formatINR(simData.base_case.total_value)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              ⚖️ Median stochastic path after deducting STT, GST, and {simData.base_case.taxes_and_charges.tax_type}.
            </div>
          </div>

          {/* Bull Target (90th Percentile Ceiling) */}
          <div className="bg-white rounded-2xl border-2 border-profit-200 shadow-profit p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-profit-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-bl-xl">
              90th %tile (Bull)
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-profit-600">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-extrabold text-base tracking-tight text-slate-900">
                  Bull Scenario (Ceiling)
                </h3>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Target Price:</div>
                <div className="text-2xl font-extrabold font-mono text-profit-600">
                  {formatINR(simData.bull_case.target_price)}
                </div>
                <div className="text-xs font-bold text-profit-700">
                  +{simData.bull_case.roi_pct.toFixed(1)}% Real In-Hand ROI
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-profit-50/70 border border-profit-100 space-y-1">
                <div className="text-[11px] text-profit-800 font-medium">Real In-Hand Net Profit:</div>
                <div className="text-xl font-extrabold text-profit-700 font-mono">
                  +{formatINR(simData.bull_case.net_in_hand_profit)}
                </div>
                <div className="text-[10px] text-profit-700/80 font-mono">
                  Gross: +{formatINR(simData.bull_case.gross_profit)} | Post-Tax Final: {formatINR(simData.bull_case.total_value)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              🚀 90th percentile upside expansion after all Indian statutory levies and taxes.
            </div>
          </div>

          {/* Bear / 10th Percentile VaR */}
          <div className="bg-white rounded-2xl border-2 border-risk-200 shadow-risk p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-risk-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-bl-xl">
              10th %tile (VaR)
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-risk-600">
                <TrendingDown className="w-5 h-5" />
                <h3 className="font-extrabold text-base tracking-tight text-slate-900">
                  Bear / Value at Risk Floor
                </h3>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Stop Loss Floor:</div>
                <div className="text-2xl font-extrabold font-mono text-risk-600">
                  {formatINR(simData.bear_case.target_price)}
                </div>
                <div className="text-xs font-bold text-risk-700">
                  {simData.bear_case.roi_pct.toFixed(1)}% Maximum Expected Drawdown
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-risk-50/70 border border-risk-100 space-y-1">
                <div className="text-[11px] text-risk-800 font-medium">Net Drawdown Level:</div>
                <div className="text-xl font-extrabold text-risk-700 font-mono">
                  {formatINR(simData.bear_case.net_in_hand_profit)}
                </div>
                <div className="text-[10px] text-risk-700/80 font-mono">
                  Preserved Capital: {formatINR(simData.bear_case.total_value)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              🛡️ 10th percentile empirical floor modeling severe multi-quarter market correction.
            </div>
          </div>
        </div>
      )}

      {/* Statutory & Tax Deduction Drawer */}
      {baseTax && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-5 space-y-3">
          <button
            onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-brand-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-600" />
              <span>Indian Tax & Statutory Friction Breakdown (Base Case)</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                Total Friction: {formatINR(baseTax.total_statutory_friction + baseTax.capital_gains_tax)}
              </span>
            </div>
            {showTaxBreakdown ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showTaxBreakdown && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">STT (0.1% Exit)</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(baseTax.stt)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Stamp Duty (0.015%)</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(baseTax.stamp_duty)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Exchange & SEBI Fee</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(baseTax.exchange_fees + baseTax.sebi_charges)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">GST (18% on Fees)</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(baseTax.gst)}</span>
              </div>
              <div className="col-span-2 sm:col-span-4 p-3.5 rounded-xl bg-brand-50/70 border border-brand-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-900 block">
                    Capital Gains Tax ({baseTax.tax_type})
                  </span>
                  <span className="text-[11px] text-brand-700/80">
                    {horizonMonths < 12 ? "20% STCG flat rate" : "12.5% LTCG on net gains above ₹1.25 Lakh exemption limit"}
                  </span>
                </div>
                <span className="font-mono font-extrabold text-brand-800 text-sm">
                  {formatINR(baseTax.capital_gains_tax)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Monte Carlo Projection Chart */}
      {simData && (
        <ProjectionChart
          trajectory={simData.trajectory}
          horizonMonths={horizonMonths}
        />
      )}
    </div>
  );
};
