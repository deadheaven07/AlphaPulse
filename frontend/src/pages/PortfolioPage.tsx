import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDbHoldings,
  createDbHolding,
  deleteDbHolding,
  clearAllDbHoldings,
  fetchTickerFeed
} from "../services/api";
import type { DbHolding, TickerItem } from "../types";
import { formatINR, formatPct } from "../utils/formatters";
import {
  Briefcase,
  Plus,
  Trash2,
  Download,
  ShieldCheck,
  LineChart,
  TrendingUp,
  TrendingDown,
  Radio
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

  // 1. Fetch persistent SQLite holdings
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["db-holdings"],
    queryFn: fetchDbHoldings,
    refetchInterval: 15000,
  });

  // 2. Fetch live real-time market quotes
  const { data: liveTickers = [] } = useQuery({
    queryKey: ["live-ticker-feed"],
    queryFn: fetchTickerFeed,
    refetchInterval: 15000,
  });

  // Map symbols to live ticker quotes
  const livePriceMap = useMemo(() => {
    const map = new Map<string, TickerItem>();
    liveTickers.forEach((t) => {
      map.set(t.symbol.toUpperCase().trim(), t);
    });
    return map;
  }, [liveTickers]);

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
    const headers = "Symbol,Company,Entry Price,Shares,Invested,Current LTP,Current Value,Unrealized PnL,PnL Pct,Target Price,Stop Loss,Created At\n";
    const rows = holdings.map((h) => {
      const live = livePriceMap.get(h.symbol.toUpperCase());
      const ltp = live?.price ?? h.entry_price;
      const invested = h.entry_price * h.shares;
      const curVal = ltp * h.shares;
      const pnl = curVal - invested;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
      return `"${h.symbol}","${h.company_name || h.symbol}",${h.entry_price},${h.shares},${invested},${ltp},${curVal},${pnl.toFixed(2)},${pnlPct.toFixed(2)}%,"${h.target_price || ""}","${h.stop_loss || ""}","${h.created_at || ""}"`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alphapulse_portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Portfolio Totals & Live PnL
  const { totalInvested, totalCurrentVal, totalPnl, totalPnlPct } = useMemo(() => {
    let invested = 0;
    let currentVal = 0;
    holdings.forEach((h) => {
      const live = livePriceMap.get(h.symbol.toUpperCase());
      const ltp = live?.price ?? h.entry_price;
      invested += h.entry_price * h.shares;
      currentVal += ltp * h.shares;
    });
    const pnl = currentVal - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    return {
      totalInvested: invested,
      totalCurrentVal: currentVal,
      totalPnl: pnl,
      totalPnlPct: pnlPct
    };
  }, [holdings, livePriceMap]);

  const isOverallPos = totalPnl >= 0;

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
                Live LTP & Net P&L
              </span>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark">
              Real-time market valuation, live unrealized gains, and 24/7 audio threat watchdog.
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

      {/* Portfolio Live Overview Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-2xs space-y-1">
          <span className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
            Total Invested Capital
          </span>
          <div className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            {formatINR(totalInvested)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {holdings.length} Active Positions
          </div>
        </div>

        {/* Current Live Valuation */}
        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
              Current Live Valuation
            </span>
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            {formatINR(totalCurrentVal)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            NSE Live Synced
          </div>
        </div>

        {/* Total Unrealized Net P&L */}
        <div
          className={`p-4 rounded-xl border shadow-2xs space-y-1 ${
            isOverallPos
              ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
              : "bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
          }`}
        >
          <span
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
              isOverallPos ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"
            }`}
          >
            {isOverallPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            Unrealized Net P&L
          </span>
          <div
            className={`text-lg sm:text-xl font-extrabold font-mono ${
              isOverallPos ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
            }`}
          >
            {isOverallPos ? "+" : ""}
            {formatINR(totalPnl)}
          </div>
          <div
            className={`text-[11px] font-mono font-bold ${
              isOverallPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatPct(totalPnlPct)} Net ROI
          </div>
        </div>

        {/* Watchdog Status */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-border dark:border-border-dark shadow-2xs space-y-1">
          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Threat Watchdog
          </span>
          <div className="text-xs text-slate-800 dark:text-slate-200 font-extrabold">
            Active 25s Live Polling
          </div>
          <div className="text-[10px] text-slate-500">
            Audio alerts on Stop-Loss breaches & news shocks
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
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">
                Symbol (NSE)
              </label>
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
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">
                Buy Price (₹)
              </label>
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
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">
                Quantity (Shares)
              </label>
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
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">
                Target Price (₹)
              </label>
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
              <label className="text-[10px] font-bold text-slate-600 dark:text-muted-dark block mb-1">
                Stop-Loss (₹)
              </label>
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

      {/* Holdings Table with Live Columns */}
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
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              No Holdings Saved in Demat Vault
            </h3>
            <p className="text-xs text-muted dark:text-muted-dark max-w-sm mx-auto">
              Add your current portfolio positions to track live LTP, calculate real-time PnL, and enable 24/7 audio stop-loss protection.
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
                  <th className="py-3.5 px-4">Stock Symbol</th>
                  <th className="py-3.5 px-4">Buy Price</th>
                  <th className="py-3.5 px-4">Shares</th>
                  <th className="py-3.5 px-4">Invested (₹)</th>
                  <th className="py-3.5 px-4">Current LTP</th>
                  <th className="py-3.5 px-4">Current Value</th>
                  <th className="py-3.5 px-4">Unrealized P&L</th>
                  <th className="py-3.5 px-4">Target / SL & Proximity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-dark font-medium">
                {holdings.map((h: DbHolding) => {
                  const live = livePriceMap.get(h.symbol.toUpperCase());
                  const ltp = live?.price ?? h.entry_price;
                  const dayChangePct = live?.change_pct ?? 0;
                  const invested = h.entry_price * h.shares;
                  const curVal = ltp * h.shares;
                  const pnl = curVal - invested;
                  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                  const isPos = pnl >= 0;

                  // Target & SL Proximity
                  const target = h.target_price || h.entry_price * 1.25;
                  const stopLoss = h.stop_loss || h.entry_price * 0.90;
                  const range = Math.max(1, target - stopLoss);
                  const progressPct = Math.min(100, Math.max(0, ((ltp - stopLoss) / range) * 100));

                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold font-mono text-slate-900 dark:text-white text-xs">
                            {h.symbol}
                          </span>
                          <span className="text-[10px] text-muted dark:text-muted-dark truncate max-w-[110px]">
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

                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatINR(invested)}
                      </td>

                      {/* Current Live LTP */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 dark:text-white">
                            {formatINR(ltp)}
                          </span>
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-1 rounded ${
                              dayChangePct >= 0
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {dayChangePct >= 0 ? "+" : ""}
                            {dayChangePct.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Current Live Value */}
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatINR(curVal)}
                      </td>

                      {/* Net Unrealized P&L */}
                      <td className="py-3 px-4 font-mono">
                        <div
                          className={`font-black ${
                            isPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPos ? "+" : ""}
                          {formatINR(pnl)}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            isPos ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {formatPct(pnlPct)}
                        </div>
                      </td>

                      {/* Target / SL & Proximity Meter */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 min-w-[130px]">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-rose-500 font-semibold">SL: {formatINR(stopLoss)}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              T: {formatINR(target)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-surface-elevated h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progressPct < 20
                                  ? "bg-rose-500"
                                  : progressPct > 80
                                  ? "bg-emerald-500"
                                  : "bg-indigo-500"
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
