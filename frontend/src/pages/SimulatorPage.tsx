import React from "react";
import { ProfitSimulator } from "../components/ProfitSimulator";
import type { SimulationResult } from "../types";
import { Calculator, ShieldCheck } from "lucide-react";

interface SimulatorPageProps {
  symbol: string;
  capital: number;
  horizon: number;
  onSaveSimulation: (sim: SimulationResult) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  symbol,
  capital,
  horizon,
  onSaveSimulation,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header with Beginner Clarity Tooltip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-border-dark pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Monte Carlo Simulation & Post-Tax Profit Engine
              </h1>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface-elevated text-slate-800 dark:text-slate-200">
                {symbol}
              </span>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark">
              1,000 geometric Brownian motion paths with statutory Indian transaction friction (STCG 20% | LTCG 12.5%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Current Statutory Tax Regime (STCG 20% | LTCG 12.5%)</span>
        </div>
      </div>

      {/* Simulator Component */}
      <ProfitSimulator
        symbol={symbol}
        initialCapital={capital}
        initialHorizon={horizon}
        onSaveSimulation={onSaveSimulation}
      />
    </div>
  );
};
