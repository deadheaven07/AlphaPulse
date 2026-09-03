import React, { useState } from "react";
import type { SimulationResult } from "../types";
import { formatINR, formatHorizon } from "../utils/formatters";
import {
  X,
  Star,
  BookmarkCheck,
  Download,
  Trash2,
  ArrowRight
} from "lucide-react";

interface WatchlistVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSimulations: SimulationResult[];
  watchlistSymbols: string[];
  onRemoveSimulation: (index: number) => void;
  onRemoveWatchlist: (symbol: string) => void;
  onSelectSymbol: (symbol: string) => void;
}

export const WatchlistVaultModal: React.FC<WatchlistVaultModalProps> = ({
  isOpen,
  onClose,
  savedSimulations,
  watchlistSymbols,
  onRemoveSimulation,
  onRemoveWatchlist,
  onSelectSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<"vault" | "watchlist">("vault");

  if (!isOpen) return null;

  const exportCsv = () => {
    if (savedSimulations.length === 0) return;
    const headers = [
      "Symbol",
      "Company",
      "Capital_INR",
      "Horizon_Months",
      "Risk_Mode",
      "Base_Target_Price",
      "Base_Net_Profit_INR",
      "Bull_Target_Price",
      "Bull_Net_Profit_INR",
      "Stop_Loss_Price",
    ];

    const rows = savedSimulations.map((s) => [
      s.symbol,
      `"${s.company_name}"`,
      s.capital,
      s.horizon_months,
      s.risk_tolerance,
      s.base_case.target_price,
      s.base_case.net_in_hand_profit,
      s.bull_case.target_price,
      s.bull_case.net_in_hand_profit,
      s.bear_case.target_price,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AlphaPulse_Strategies_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-3d-backdrop">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-700 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden modal-3d-content">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-border/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab("vault")}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "vault"
                    ? "bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Strategy Vault ({savedSimulations.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("watchlist")}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "watchlist"
                    ? "bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Star className="w-4 h-4 text-amber-500" />
                <span>Pinned Watchlist ({watchlistSymbols.length})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "vault" && savedSimulations.length > 0 && (
              <button
                onClick={exportCsv}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "vault" ? (
            savedSimulations.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <BookmarkCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Saved Strategies Yet</h4>
                <p className="text-xs text-muted dark:text-slate-500 max-w-sm mx-auto">
                  Run a Monte Carlo simulation in the quantitative studio and click "Save Strategy" to track your projected post-tax ROI.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedSimulations.map((sim, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 space-y-3 relative group hover:border-brand-300 dark:hover:border-brand-600 transition-all shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base font-mono text-slate-900 dark:text-white">
                            {sim.symbol}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                            {formatHorizon(sim.horizon_months)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {sim.risk_tolerance}
                          </span>
                        </div>
                        <p className="text-xs text-muted dark:text-slate-400 truncate max-w-[200px]">
                          {sim.company_name}
                        </p>
                      </div>

                      <button
                        onClick={() => onRemoveSimulation(idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        title="Delete simulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Capital</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatINR(sim.capital)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-profit-50/60 dark:bg-profit-950/40 border border-profit-200/60 dark:border-profit-800/40">
                        <span className="text-[10px] text-profit-800 dark:text-profit-300 uppercase block">Base Net Profit</span>
                        <span className="font-mono font-extrabold text-profit-700 dark:text-profit-400">
                          +{formatINR(sim.base_case.net_in_hand_profit)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectSymbol(sim.symbol)}
                      className="w-full py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-brand-600 dark:hover:bg-brand-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Simulate in Engine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {watchlistSymbols.map((sym) => (
                <div
                  key={sym}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 transition-all group"
                >
                  <div
                    onClick={() => onSelectSymbol(sym)}
                    className="cursor-pointer flex-1"
                  >
                    <span className="font-extrabold text-sm font-mono text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {sym}
                    </span>
                    <p className="text-[11px] text-muted dark:text-slate-400">National Stock Exchange</p>
                  </div>

                  <button
                    onClick={() => onRemoveWatchlist(sym)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
