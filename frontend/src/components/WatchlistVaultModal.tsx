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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="p-6 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab("vault")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "vault"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Strategy Vault ({savedSimulations.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("watchlist")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "watchlist"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Star className="w-4 h-4 text-amber-500" />
                <span>Watchlist ({watchlistSymbols.length})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "vault" && savedSimulations.length > 0 && (
              <button
                onClick={exportCsv}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Export strategies to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "vault" ? (
            savedSimulations.length > 0 ? (
              <div className="space-y-3">
                {savedSimulations.map((sim, idx) => (
                  <div
                    key={`${sim.symbol}-${idx}`}
                    className="p-4 rounded-xl border border-border bg-slate-50/60 hover:bg-white hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-base font-mono text-slate-900">
                          {sim.symbol}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700">
                          {formatHorizon(sim.horizon_months)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                          {sim.risk_tolerance}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{sim.company_name}</p>
                      <div className="text-[11px] text-muted font-mono">
                        Invested: <strong>{formatINR(sim.capital)}</strong> ({sim.shares} Shares @ {formatINR(sim.current_price)})
                      </div>
                    </div>

                    {/* Projections */}
                    <div className="flex items-center gap-6 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Base Post-Tax</span>
                        <span className="text-sm font-extrabold font-mono text-brand-600">
                          +{formatINR(sim.base_case.net_in_hand_profit)}
                        </span>
                        <span className="text-[10px] text-brand-700/80 block font-mono">
                          Target: {formatINR(sim.base_case.target_price)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Bull Post-Tax</span>
                        <span className="text-sm font-extrabold font-mono text-profit-600">
                          +{formatINR(sim.bull_case.net_in_hand_profit)}
                        </span>
                        <span className="text-[10px] text-profit-700/80 block font-mono">
                          Target: {formatINR(sim.bull_case.target_price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onSelectSymbol(sim.symbol);
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold transition-all shadow-xs"
                          title="Simulate now"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveSimulation(idx)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete strategy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <BookmarkCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Saved Strategies Yet</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Use the "Save Strategy" button inside the Profit Simulator to store target projections.
                </p>
              </div>
            )
          ) : (
            watchlistSymbols.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {watchlistSymbols.map((sym) => (
                  <div
                    key={sym}
                    className="p-4 rounded-xl border border-border bg-slate-50/60 hover:bg-white flex items-center justify-between transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-sm font-mono text-slate-900">{sym}</div>
                      <div className="text-[11px] text-muted">National Stock Exchange</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectSymbol(sym);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveWatchlist(sym)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <Star className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Watchlist is Empty</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Click the star icon on any stock card to pin it to your quick-access watchlist.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
