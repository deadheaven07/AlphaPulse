import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { runProfitSimulation } from "../services/api";
import type { RiskTolerance } from "../types";
import { formatINR, formatPct, formatHorizon } from "../utils/formatters";
import { ProjectionChart } from "./ProjectionChart";
import {
  Calculator,
  Coins,
  Clock,
  Shield,
  TrendingUp,
  TrendingDown,
  Zap
} from "lucide-react";

interface ProfitSimulatorProps {
  symbol: string;
  initialCapital?: number;
  initialHorizon?: number;
}

const CAPITAL_PRESETS = [10000, 25000, 50000, 100000, 500000];
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
}) => {
  const [capital, setCapital] = useState<number>(initialCapital);
  const [horizonMonths, setHorizonMonths] = useState<number>(initialHorizon);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("Moderate");

  const { data: simData } = useQuery({
    queryKey: ["profit-sim", symbol, capital, horizonMonths, riskTolerance],
    queryFn: () => runProfitSimulation(symbol, capital, horizonMonths, riskTolerance),
    enabled: Boolean(symbol) && capital > 0 && horizonMonths > 0,
  });

  return (
    <div className="space-y-6">
      {/* Control Deck Card */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Capital & Holding Period Profit Simulator
              </h2>
              <p className="text-xs text-muted">
                Quantitative scenario forecasting for {symbol} on National Stock Exchange
              </p>
            </div>
          </div>

          <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {formatHorizon(horizonMonths)} Horizon
          </span>
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
                Target Holding Duration
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
              Compounds returns dynamically matching multi-quarter capex cycles.
            </p>
          </div>

          {/* Input 3: Risk Tolerance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-500" />
                Risk Appetite
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
              {riskTolerance === "Conservative" && "Focuses on capital preservation and tighter trailing stops."}
              {riskTolerance === "Moderate" && "Balanced consensus CAGR matching 3-year historical trajectory."}
              {riskTolerance === "Aggressive" && "High-alpha momentum targeting earnings multiple re-rating."}
            </p>
          </div>
        </div>

        {/* Live Allocation HUD */}
        {simData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Share Quantity
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

            <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block mb-0.5">
                Expected Net ROI
              </span>
              <div className="text-base font-extrabold text-brand-700 font-mono">
                {formatPct(simData.expected_value.expected_roi_pct)}
              </div>
              <span className="text-[10px] text-brand-600 font-medium">
                +{formatINR(simData.expected_value.expected_profit)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Risk-to-Reward
              </span>
              <div className="text-base font-extrabold text-slate-900 font-mono">
                1 : {simData.expected_value.risk_reward_ratio}
              </div>
              <span className="text-[10px] text-profit-600 font-semibold">Positive Edge</span>
            </div>
          </div>
        )}
      </div>

      {/* 3 Dynamic Scenario Forecast Cards */}
      {simData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base Target (Highlighted) */}
          <div className="bg-white rounded-2xl border-2 border-brand-400 shadow-hover p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-brand-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-bl-xl">
              50% Prob (Base)
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-brand-600">
                <Zap className="w-5 h-5" />
                <h3 className="font-extrabold text-base tracking-tight text-slate-900">
                  Base Case (Consensus)
                </h3>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Target Price:</div>
                <div className="text-2xl font-extrabold font-mono text-brand-600">
                  {formatINR(simData.base_case.target_price)}
                </div>
                <div className="text-xs font-bold text-brand-700">
                  +{simData.base_case.roi_pct.toFixed(1)}% Projected Gain
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-100 space-y-1">
                <div className="text-[11px] text-brand-900 font-medium">Expected Profit:</div>
                <div className="text-xl font-extrabold text-brand-700 font-mono">
                  +{formatINR(simData.base_case.absolute_profit)}
                </div>
                <div className="text-[10px] text-brand-700/80">
                  Total Final Capital: {formatINR(simData.base_case.total_value)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              ⚖️ Steady 3-year historical CAGR compounding & sector tailwind.
            </div>
          </div>

          {/* Bull Target */}
          <div className="bg-white rounded-2xl border-2 border-profit-200 shadow-profit p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-profit-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-bl-xl">
              25% Prob (Bull)
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-profit-600">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-extrabold text-base tracking-tight text-slate-900">
                  Bull Case Target
                </h3>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Target Price:</div>
                <div className="text-2xl font-extrabold font-mono text-profit-600">
                  {formatINR(simData.bull_case.target_price)}
                </div>
                <div className="text-xs font-bold text-profit-700">
                  +{simData.bull_case.roi_pct.toFixed(1)}% Projected Gain
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-profit-50/70 border border-profit-100 space-y-1">
                <div className="text-[11px] text-profit-800 font-medium">Potential Gain:</div>
                <div className="text-xl font-extrabold text-profit-700 font-mono">
                  +{formatINR(simData.bull_case.absolute_profit)}
                </div>
                <div className="text-[10px] text-profit-700/80">
                  Total Final Capital: {formatINR(simData.bull_case.total_value)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              🚀 Accelerated order book execution & momentum multiple expansion.
            </div>
          </div>

          {/* Bear / Stop Loss */}
          <div className="bg-white rounded-2xl border-2 border-risk-200 shadow-risk p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-risk-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-bl-xl">
              25% Prob (Bear)
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-risk-600">
                <TrendingDown className="w-5 h-5" />
                <h3 className="font-extrabold text-base tracking-tight text-slate-900">
                  Bear / Stop Loss
                </h3>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Trailing Stop Price:</div>
                <div className="text-2xl font-extrabold font-mono text-risk-600">
                  {formatINR(simData.bear_case.target_price)}
                </div>
                <div className="text-xs font-bold text-risk-700">
                  {simData.bear_case.roi_pct.toFixed(1)}% Maximum Drawdown
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-risk-50/70 border border-risk-100 space-y-1">
                <div className="text-[11px] text-risk-800 font-medium">Max Risk Level:</div>
                <div className="text-xl font-extrabold text-risk-700 font-mono">
                  {formatINR(simData.bear_case.absolute_profit)}
                </div>
                <div className="text-[10px] text-risk-700/80">
                  Capital Preserved: {formatINR(simData.bear_case.total_value)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              🛡️ Trailing risk floor anchored on stock beta and technical support.
            </div>
          </div>
        </div>
      )}

      {/* Projection Timeline Curve */}
      {simData && (
        <ProjectionChart
          trajectory={simData.trajectory}
          horizonMonths={horizonMonths}
        />
      )}
    </div>
  );
};
