import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDbHoldings,
  createDbHolding,
  deleteDbHolding,
  clearAllDbHoldings
} from "../services/api";
import type { DbHolding } from "../types";
import { formatINR } from "../utils/formatters";
import {
  Briefcase,
  Plus,
  Trash2,
  Download,
  ShieldCheck,
  LineChart
} from "lucide-react";

interface PortfolioPageProps {
  onSelectStock: (symbol: string) => void;
  onNavigateToStudio: () => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  onSelectStock,
  onNavigateToStudio
}) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newEntryPrice, setNewEntryPrice] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newStopLoss, setNewStopLoss] = useState("");

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["db-holdings"],
    queryFn: fetchDbHoldings,
    refetchInterval: 15000,
  });

  const addMutation = useMutation({
    mutationFn: createDbHolding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["db-holdings"] });
      queryClient.invalidateQueries({ queryKey: ["db-holdings-overview"] });
      setIsAdding(false);
      setNewSymbol("");
      setNewEntryPrice("");
      setNewShares("");
      setNewTarget("");
      setNewStopLoss("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDbHolding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["db-holdings"] });
      queryClient.invalidateQueries({ queryKey: ["db-holdings-overview"] });
    }
  });

  const clearMutation = useMutation({
    mutationFn: clearAllDbHoldings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["db-holdings"] });
      queryClient.invalidateQueries({ queryKey: ["db-holdings-overview"] });
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !newEntryPrice || !newShares) return;

    addMutation.mutate({
      symbol: newSymbol.trim().toUpperCase(),
      company_name: `${newSymbol.trim().toUpperCase()} Limited`,
      entry_price: parseFloat(newEntryPrice),
      shares: parseInt(newShares, 10),
      target_price: newTarget ? parseFloat(newTarget) : parseFloat(newEntryPrice) * 1.25,
      stop_loss: newStopLoss ? parseFloat(newStopLoss) : parseFloat(newEntryPrice) * 0.90
    });
  };

  const handleExportCSV = () => {
    if (!holdings.length) return;
    const headers = "Symbol,Company,Entry Price,Shares,Target Price,Stop Loss,Created At\n";
    const rows = holdings.map(
      (h) => `"${h.symbol}","${h.company_name || h.symbol}",${h.entry_price},${h.shares},${h.target_price || ""},${h.stop_loss || ""},"${h.created_at || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alphapulse_portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCapital = holdings.reduce((acc, h) => acc + h.entry_price * h.shares, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-border-dark pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Persistent Demat Portfolio Vault
              </h1>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                SQLite Engine
              </span>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark">
              24/7 continuous price & breaking news threat watchdog with persistent database storage
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </button>

          {holdings.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-surface-elevated hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-border-dark flex items-center gap-1.5 cursor-pointer"
                title="Export to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                onClick={() => {
                  if (confirm("Clear all holdings from database?")) clearMutation.mutate();
                }}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                title="Clear All Positions"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Portfolio Overview Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-2xs space-y-1">
          <span className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">Total Invested Capital</span>
          <div className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            {formatINR(totalCapital)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-2xs space-y-1">
          <span className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">Active Demat Holdings</span>
          <div className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            {holdings.length} Positions
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 shadow-2xs space-y-1">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Watchdog Status
          </span>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            Active 25s polling with audio buzzer stop-loss protection
          </div>
        </div>
      </div>

      {/* Add Position Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-emerald-500/50 shadow-soft space-y-4 animate-fade-in"
        >
          <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>Add New Stock Holding to Demat Vault</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">Symbol (NSE)</label>
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="e.g. TATAMOTORS"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 dark:bg-canvas-dark text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">Buy Price (₹)</label>
              <input
                type="number"
                step="any"
                value={newEntryPrice}
                onChange={(e) => setNewEntryPrice(e.target.value)}
                placeholder="e.g. 1045.50"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 dark:bg-canvas-dark text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">Quantity (Shares)</label>
              <input
                type="number"
                value={newShares}
                onChange={(e) => setNewShares(e.target.value)}
                placeholder="e.g. 50"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 dark:bg-canvas-dark text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">Target Price (₹)</label>
              <input
                type="number"
                step="any"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="e.g. 1300.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 dark:bg-canvas-dark text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">Stop-Loss (₹)</label>
              <input
                type="number"
                step="any"
                value={newStopLoss}
                onChange={(e) => setNewStopLoss(e.target.value)}
                placeholder="e.g. 920.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 dark:bg-canvas-dark text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-border-dark">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {addMutation.isPending ? "Saving..." : "Save Position"}
            </button>
          </div>
        </form>
      )}

      {/* Holdings Table */}
      <div className="glass-panel-3d rounded-2xl overflow-hidden border border-border dark:border-border-dark">
        {isLoading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted dark:text-muted-dark">Loading persistent holdings from SQLite...</p>
          </div>
        ) : holdings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-surface-elevated text-slate-400 w-12 h-12 flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No Holdings Saved in Demat Vault</h3>
            <p className="text-xs text-muted dark:text-muted-dark max-w-sm mx-auto">
              Add your current portfolio positions to enable 24/7 continuous threat monitoring and audio stop-loss alerts.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Position</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-canvas-dark border-b border-border dark:border-border-dark text-[11px] font-extrabold text-slate-600 dark:text-muted-dark uppercase tracking-wider">
                  <th className="py-3 px-4">Stock Symbol</th>
                  <th className="py-3 px-4">Buy Price</th>
                  <th className="py-3 px-4">Shares</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Target Price</th>
                  <th className="py-3 px-4">Stop-Loss</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-dark font-medium">
                {holdings.map((h: DbHolding) => (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-surface-elevated/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold font-mono text-slate-900 dark:text-white">
                          {h.symbol}
                        </span>
                        <span className="text-[10px] text-muted dark:text-muted-dark truncate max-w-[120px]">
                          {h.company_name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatINR(h.entry_price)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {h.shares.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                      {formatINR(h.entry_price * h.shares)}
                    </td>

                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {h.target_price ? formatINR(h.target_price) : "-"}
                    </td>

                    <td className="py-3 px-4 font-mono text-rose-500 font-bold">
                      {h.stop_loss ? formatINR(h.stop_loss) : "-"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onSelectStock(h.symbol);
                            onNavigateToStudio();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-surface-elevated hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <LineChart className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => {
                            if (h.id && confirm(`Delete ${h.symbol} from vault?`)) {
                              deleteMutation.mutate(h.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="Remove holding"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
