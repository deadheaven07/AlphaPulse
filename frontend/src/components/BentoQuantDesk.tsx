import React from "react";
import { StockStudioPage } from "../pages/StockStudioPage";
import { SimulatorPage } from "../pages/SimulatorPage";
import { OptionChainPcrWidget } from "./OptionChainPcrWidget";
import { MarketTreemap } from "./MarketTreemap";
import type { SimulationResult } from "../types";
import {
  LineChart,
  Calculator,
  Compass,
  Layers,
  Sparkles
} from "lucide-react";

interface BentoQuantDeskProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  capital: number;
  horizon: number;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onSaveSimulation: (sim: SimulationResult) => void;
  onNavigateToSimulator: () => void;
}

export const BentoQuantDesk: React.FC<BentoQuantDeskProps> = ({
  selectedSymbol,
  onSelectSymbol,
  capital,
  horizon,
  isWatchlisted,
  onToggleWatchlist,
  onSaveSimulation,
  onNavigateToSimulator,
}) => {
  return (
    <div className="space-y-6 animate-fade-in perspective-3d">
      {/* Top Bar Header */}
      <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#181920]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between card-3d-sheen glass-3d-elevation preserve-3d">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Bento Multi-Window Quant Desk
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Bloomberg Multi-Panel Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Simultaneous real-time inspection: Candlestick Studio, Monte Carlo Post-Tax Engine, PCR Sentiment & Market Breadth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            Active Focal Stock: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{selectedSymbol}</strong>
          </span>
        </div>
      </div>

      {/* 2-Column Split View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Interactive Candlestick Studio */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#181920]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <LineChart className="w-4 h-4 text-emerald-500" />
            <span>Primary Focus: Candlestick Studio & RRG Rotation</span>
          </div>

          <StockStudioPage
            symbol={selectedSymbol}
            onSelectSymbol={onSelectSymbol}
            isWatchlisted={isWatchlisted}
            onToggleWatchlist={onToggleWatchlist}
            onNavigateToSimulator={onNavigateToSimulator}
          />
        </div>

        {/* Right Column (5 cols): Option Chain PCR & Monte Carlo Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#181920]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Compass className="w-4 h-4 text-brand-500" />
            <span>Live NSE Option Chain Barometer</span>
          </div>

          <OptionChainPcrWidget />

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#181920]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Calculator className="w-4 h-4 text-amber-500" />
            <span>Monte Carlo & Statutory Tax Engine</span>
          </div>

          <SimulatorPage
            symbol={selectedSymbol}
            capital={capital}
            horizon={horizon}
            onSaveSimulation={onSaveSimulation}
          />
        </div>
      </div>

      {/* Bottom Full-Width Breadth Treemap */}
      <div className="space-y-3 pt-4">
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#181920]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-purple-500" />
          <span>Cross-Sector Market Breadth Treemap</span>
        </div>
        <MarketTreemap onSelectStock={onSelectSymbol} />
      </div>
    </div>
  );
};
