import React, { useEffect, useRef, useState } from "react";
import type { SimulationResult } from "../types";
import { formatINR, formatHorizon } from "../utils/formatters";
import {
  X,
  Briefcase,
  BookmarkCheck,
  Star,
  Download,
  Trash2,
  ArrowRight,
  PieChart
} from "lucide-react";

interface PortfolioSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedSimulations: SimulationResult[];
  watchlistSymbols: string[];
  onRemoveSimulation: (index: number) => void;
  onRemoveWatchlist: (symbol: string) => void;
  onSelectSymbol: (symbol: string) => void;
  onClearAll?: () => void;
}

export const PortfolioSideDrawer: React.FC<PortfolioSideDrawerProps> = ({
  isOpen,
  onClose,
  savedSimulations,
  watchlistSymbols,
  onRemoveSimulation,
  onRemoveWatchlist,
  onSelectSymbol,
  onClearAll,
}) => {
  const [activeTab, setActiveTab] = useState<"strategies" | "watchlist">("strategies");
  const drawerRef = useRef<HTMLElement | null>(null);

  // Escape key listener & Body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Aggregate Portfolio Metrics
  const totalInvestedCapital = savedSimulations.reduce((acc, sim) => acc + (sim.capital || 0), 0);
  const totalBaseNetProfit = savedSimulations.reduce((acc, sim) => acc + (sim.base_case?.net_in_hand_profit || 0), 0);
  const totalBullNetProfit = savedSimulations.reduce((acc, sim) => acc + (sim.bull_case?.net_in_hand_profit || 0), 0);
  const totalPortfolioValue = totalInvestedCapital + totalBaseNetProfit;
  const portfolioRoiPct = totalInvestedCapital > 0 ? (totalBaseNetProfit / totalInvestedCapital) * 100 : 0;

  // Export CSV
  const exportCsv = () => {
    if (savedSimulations.length === 0) return;
    const headers = [
      "Symbol",
      "Company",
      "Capital_INR",
      "Horizon_Months",
      "Risk_Mode",
      "Current_Price",
      "Base_Target_Price",
      "Base_Net_Profit_INR",
      "Base_PostTax_ROI_Pct",
      "Bull_Target_Price",
      "Bull_Net_Profit_INR",
      "Stop_Loss_Price",
      "Estimated_Tax_Deduction_INR"
    ];

    const rows = savedSimulations.map((s) => [
      s.symbol,
      `"${s.company_name}"`,
      s.capital,
      s.horizon_months,
      s.risk_tolerance,
      s.current_price,
      s.base_case?.target_price || 0,
      s.base_case?.net_in_hand_profit || 0,
      (s.base_case?.taxes_and_charges?.effective_post_tax_roi_pct || s.base_case?.roi_pct || 0).toFixed(2),
      s.bull_case?.target_price || 0,
      s.bull_case?.net_in_hand_profit || 0,
      s.bear_case?.target_price || 0,
      s.base_case?.taxes_and_charges?.total_statutory_friction || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AlphaPulse_Portfolio_Vault_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      {/* Outside Click Backdrop Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Drawer Container (Slides smoothly from Right) */}
      <aside
        ref={drawerRef}
        className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-surface-dark border-l border-border dark:border-border-dark shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-border dark:border-border-dark bg-slate-50/80 dark:bg-canvas-dark/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-emerald-gold text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Portfolio & Strategy Vault
              </h2>
              <p className="text-xs text-muted dark:text-muted-dark">
                Real-time allocations, post-tax returns & saved simulations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {savedSimulations.length > 0 && (
              <button
                onClick={exportCsv}
                title="Export CSV"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-muted-dark dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-surface-elevated transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Portfolio Summary Card */}
        {savedSimulations.length > 0 && (
          <div className="p-5 border-b border-border dark:border-border-dark bg-gradient-to-b from-slate-50/40 to-white dark:from-surface-dark dark:to-surface-elevated/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-muted-dark uppercase tracking-wider flex items-center gap-1">
                <PieChart className="w-3.5 h-3.5 text-emerald-500" />
                Aggregated Strategy Portfolio
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {savedSimulations.length} {savedSimulations.length === 1 ? "Holding" : "Holdings"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Invested Capital */}
              <div className="p-3 rounded-xl bg-white dark:bg-canvas-dark border border-border dark:border-border-dark shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 dark:text-muted-dark uppercase tracking-wider block">
                  Allocated Capital
                </span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {formatINR(totalInvestedCapital)}
                </span>
              </div>

              {/* Projected Post-Tax Net Gain */}
              <div className="p-3 rounded-xl bg-profit-50/80 dark:bg-profit-950/40 border border-profit-200 dark:border-profit-800/60 shadow-2xs">
                <span className="text-[10px] font-bold text-profit-800 dark:text-profit-300 uppercase tracking-wider block flex items-center justify-between">
                  <span>Base Net Profit</span>
                  <span className="text-[11px] font-bold">+{portfolioRoiPct.toFixed(1)}%</span>
                </span>
                <span className="text-base font-extrabold font-mono text-profit-700 dark:text-profit-400">
                  +{formatINR(totalBaseNetProfit)}
                </span>
              </div>
            </div>

            {/* Total Estimated Value & Bull Potential */}
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-canvas-dark border border-slate-200/80 dark:border-border-dark flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-muted-dark font-medium">
                Est. Portfolio Value: <strong className="font-mono text-slate-900 dark:text-white">{formatINR(totalPortfolioValue)}</strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                Bull Case: +{formatINR(totalBullNetProfit)}
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-5 pt-4 flex items-center gap-2 border-b border-border/70 dark:border-border-dark">
          <button
            onClick={() => setActiveTab("strategies")}
            className={`pb-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === "strategies"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400"
                : "border-transparent text-slate-500 dark:text-muted-dark hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Active Strategies ({savedSimulations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`pb-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === "watchlist"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400"
                : "border-transparent text-slate-500 dark:text-muted-dark hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>Pinned Watchlist ({watchlistSymbols.length})</span>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {activeTab === "strategies" ? (
            savedSimulations.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-canvas-dark text-slate-400 dark:text-muted-dark flex items-center justify-center mx-auto">
                  <BookmarkCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Vault is Currently Empty</h3>
                <p className="text-xs text-muted dark:text-muted-dark max-w-xs mx-auto">
                  Run a Monte Carlo simulation in the Quantitative Studio and click <strong>"Save Strategy"</strong> to track your projected post-tax ROI.
                </p>
              </div>
            ) : (
              savedSimulations.map((sim, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-border dark:border-border-dark bg-slate-50/70 dark:bg-canvas-dark/80 hover:bg-white dark:hover:bg-surface-elevated transition-all space-y-3 shadow-2xs hover:shadow-hover dark:hover:shadow-hover-dark group relative"
                >
                  {/* Item Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">
                          {sim.symbol}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {formatHorizon(sim.horizon_months)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {sim.risk_tolerance}
                        </span>
                      </div>
                      <p className="text-xs text-muted dark:text-muted-dark truncate max-w-[220px]">
                        {sim.company_name}
                      </p>
                    </div>

                    <button
                      onClick={() => onRemoveSimulation(idx)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                      title="Remove from vault"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pricing & Targets */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark">
                      <span className="text-[10px] text-slate-400 dark:text-muted-dark uppercase block font-medium">
                        Capital
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(sim.capital)}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-profit-50/80 dark:bg-profit-950/40 border border-profit-200 dark:border-profit-800/40">
                      <span className="text-[10px] text-profit-800 dark:text-profit-300 uppercase block font-medium">
                        Base Net Profit
                      </span>
                      <span className="font-mono font-extrabold text-profit-700 dark:text-profit-400">
                        +{formatINR(sim.base_case?.net_in_hand_profit || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Scenarios Breakdown Pills */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center">
                    <div className="p-1 rounded bg-profit-50/60 dark:bg-profit-950/30 text-profit-700 dark:text-profit-300">
                      Bull: {formatINR(sim.bull_case?.target_price || 0)}
                    </div>
                    <div className="p-1 rounded bg-slate-100 dark:bg-surface-dark text-slate-700 dark:text-slate-300 font-bold">
                      Base: {formatINR(sim.base_case?.target_price || 0)}
                    </div>
                    <div className="p-1 rounded bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300">
                      Stop: {formatINR(sim.bear_case?.target_price || 0)}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      onSelectSymbol(sim.symbol);
                      onClose();
                    }}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Simulate in Engine</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )
          ) : (
            <div className="space-y-2">
              {watchlistSymbols.map((sym) => (
                <div
                  key={sym}
                  className="p-3.5 rounded-xl border border-border dark:border-border-dark bg-slate-50/70 dark:bg-canvas-dark flex items-center justify-between hover:bg-white dark:hover:bg-surface-elevated transition-all group"
                >
                  <div
                    onClick={() => {
                      onSelectSymbol(sym);
                      onClose();
                    }}
                    className="cursor-pointer flex-1"
                  >
                    <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {sym}
                    </span>
                    <p className="text-[11px] text-muted dark:text-muted-dark">National Stock Exchange</p>
                  </div>

                  <button
                    onClick={() => onRemoveWatchlist(sym)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-border dark:border-border-dark bg-slate-50/80 dark:bg-canvas-dark/80 backdrop-blur-md flex items-center justify-between gap-2">
          {savedSimulations.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Vault</span>
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={exportCsv}
              disabled={savedSimulations.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
