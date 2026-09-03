import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIntradayScanner,
  fetchActiveIntradayTrades,
  fetchAllIntradayTrades,
  armIntradayTrade,
  squareOffIntradayTrade,
  deleteIntradayTrade
} from "../services/api";
import { soundManager } from "../utils/audioAlerts";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Activity,
  Trash2
} from "lucide-react";

interface IntradayTerminalProps {
  onSelectStock: (symbol: string) => void;
  defaultCapital?: number;
}

export const IntradayTerminal: React.FC<IntradayTerminalProps> = ({
  onSelectStock,
  defaultCapital = 25000,
}) => {
  const queryClient = useQueryClient();
  const [marginCapital, setMarginCapital] = useState<number>(defaultCapital);
  const [activeTab, setActiveTab] = useState<"long" | "short" | "active" | "history">("long");
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (msg: string, isError = false) => {
    setFeedbackToast({ message: msg, isError });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // 1. Live Intraday Scanner Query
  const { data: scannerData, isLoading: isScannerLoading } = useQuery({
    queryKey: ["intraday-scanner", marginCapital],
    queryFn: () => fetchIntradayScanner(marginCapital),
    refetchInterval: 15000, // 15s refresh
  });

  // 2. Active Trades Query
  const { data: activeTrades = [] } = useQuery({
    queryKey: ["intraday-active-trades"],
    queryFn: fetchActiveIntradayTrades,
    refetchInterval: 10000,
  });

  // 3. Trade History Query
  const { data: allTrades = [] } = useQuery({
    queryKey: ["intraday-all-trades"],
    queryFn: fetchAllIntradayTrades,
  });

  // Arm Trade Mutation
  const armMutation = useMutation({
    mutationFn: armIntradayTrade,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intraday-active-trades"] });
      queryClient.invalidateQueries({ queryKey: ["intraday-all-trades"] });
      soundManager.playBuyTriggerChime();
      showToast(data.message);
      setActiveTab("active");
    },
    onError: () => {
      soundManager.playWarningBuzzer();
      showToast("Failed to arm intraday trade", true);
    }
  });

  // Square Off Mutation
  const squareOffMutation = useMutation({
    mutationFn: ({ id, exitPrice }: { id: number; exitPrice?: number }) =>
      squareOffIntradayTrade(id, exitPrice),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intraday-active-trades"] });
      queryClient.invalidateQueries({ queryKey: ["intraday-all-trades"] });
      if (data.net_pnl >= 0) {
        soundManager.playProfitChime();
      } else {
        soundManager.playWarningBuzzer();
      }
      showToast(data.message);
    },
    onError: () => {
      showToast("Failed to square off trade", true);
    }
  });

  // Delete Trade Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteIntradayTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intraday-all-trades"] });
      showToast("Trade removed from log");
    }
  });

  const sessionStatus = scannerData?.session_status;
  const longCandidates = scannerData?.long_candidates || [];
  const shortCandidates = scannerData?.short_candidates || [];
  const totalExposure = marginCapital * 5.0;

  // Presets for quick margin selection
  const MARGIN_PRESETS = [10000, 25000, 50000, 100000, 200000];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slide-in ${
            feedbackToast.isError
              ? "bg-rose-900/90 border-rose-500 text-rose-100"
              : "bg-emerald-900/90 border-emerald-500 text-emerald-100"
          }`}
        >
          {feedbackToast.isError ? <AlertTriangle className="w-4 h-4 text-rose-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Hero Header & 3:10 PM Square-Off Guardian Countdown */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white border border-indigo-500/30 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-300" />
                5x MIS Leverage Engine
              </span>
              <span className="text-xs text-slate-400 font-sans">
                15M ORB + VWAP Strategy • Long & Short Support
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Intraday Tactical Terminal (9:15 AM – 3:20 PM)
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-sans">
              Capture same-day volatility with strict 1:2.25 Risk-to-Reward. <b>+1.8% target move generates +9.0% on your cash margin</b> with SEBI 5x MIS leverage.
            </p>
          </div>

          {/* Session Countdown & 3:10 PM Guardian */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/40 shadow-xl text-right shrink-0 z-10 space-y-1">
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>3:15 PM Auto Square-Off:</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-amber-300">
              {sessionStatus ? sessionStatus.formatted_countdown : "--m --s"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              IST Time: {sessionStatus?.current_time_str || "--:--"}
            </div>
          </div>
        </div>

        {/* 3:10 PM Warning Banner (if within 15:10 - 15:20 IST) */}
        {sessionStatus?.is_square_off_warning && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <b>3:10 PM SQUARE-OFF WARNING:</b> Close all active MIS positions before 3:15 PM to prevent broker penalty fees (₹50+GST per order)!
            </span>
          </div>
        )}
      </div>

      {/* 5x Leverage Interactive Calculator Slider */}
      <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark glass-card-hover shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-border-dark pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Interactive 5x MIS Leverage Calculator
              </h2>
              <p className="text-[11px] text-muted dark:text-muted-dark">
                Adjust your cash margin to see total buying power, 1-day profit potential & max risk
              </p>
            </div>
          </div>

          {/* Capital Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {MARGIN_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setMarginCapital(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  marginCapital === p
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-canvas-dark text-slate-600 dark:text-muted-dark hover:bg-slate-200 dark:hover:bg-surface-elevated"
                }`}
              >
                ₹{(p / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-muted-dark">Your Cash Margin (Self-Funded):</span>
            <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
              ₹{marginCapital.toLocaleString("en-IN")}
            </span>
          </div>
          <input
            type="range"
            min={5000}
            max={300000}
            step={5000}
            value={marginCapital}
            onChange={(e) => setMarginCapital(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* 4-Stat Mathematical Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-100 dark:border-border-dark space-y-0.5">
            <span className="text-[10px] text-slate-500 dark:text-muted-dark uppercase tracking-wider block font-sans">
              Total Buying Power (5x)
            </span>
            <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
              ₹{totalExposure.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">Broker MIS Margin</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-0.5">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block font-sans">
              Target (+1.8% Move)
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-300">
              +₹{((totalExposure * 0.018) - 45).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Net
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans font-bold">
              +9.0% on your capital
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-0.5">
            <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase tracking-wider block font-sans">
              Stop-Loss (-0.8% Move)
            </span>
            <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-300">
              -₹{((totalExposure * 0.008) + 45).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-sans font-bold">
              -4.0% max loss floor
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-100 dark:border-border-dark space-y-0.5">
            <span className="text-[10px] text-slate-500 dark:text-muted-dark uppercase tracking-wider block font-sans">
              Statutory Taxes & Brokerage
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              ~₹{(totalExposure * 0.00025 + 40).toFixed(0)} Total
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">0.025% STT + ₹40 Brokerage</span>
          </div>
        </div>
      </div>

      {/* Active Positions Section (If Active Trades Exist) */}
      {activeTrades.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border-2 border-indigo-500/50 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-border-dark pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Active Intraday 5x MIS Positions ({activeTrades.length})
              </h2>
            </div>
            <span className="text-xs text-muted dark:text-muted-dark font-mono">
              Live Surveillance Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTrades.map((trade) => {
              const isLong = trade.direction === "LONG";
              const isProfit = (trade.gross_pnl || 0) >= 0;
              return (
                <div
                  key={trade.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {trade.symbol}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isLong
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                          }`}
                        >
                          {trade.direction} 5x MIS
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-muted-dark">
                        {trade.shares} Shares @ ₹{trade.entry_price.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span
                        className={`text-base font-black block ${
                          isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isProfit ? "+" : ""}₹{(trade.gross_pnl || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {trade.roi_pct}% on Margin (₹{trade.margin_capital.toLocaleString("en-IN")})
                      </span>
                    </div>
                  </div>

                  {/* Targets & Progress */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono p-2 rounded-lg bg-white dark:bg-surface-elevated border border-slate-100 dark:border-border-dark">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Live LTP</span>
                      <span className="font-bold text-slate-900 dark:text-white">₹{(trade.live_price || trade.entry_price).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-500 uppercase block font-bold">Target (+1.8%)</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{trade.target_price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-rose-500 uppercase block font-bold">SL (-0.8%)</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">₹{trade.stop_loss.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onSelectStock(trade.symbol)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Inspect Studio</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => squareOffMutation.mutate({ id: trade.id, exitPrice: trade.live_price })}
                      disabled={squareOffMutation.isPending}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {squareOffMutation.isPending ? "Closing..." : "⚡ Square Off Position"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Intraday Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-border-dark pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("long")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "long"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>🟢 Bullish Breakouts (LONG) ({longCandidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("short")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "short"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>🔴 Bearish Breakdowns (SHORT) ({shortCandidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "active"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>⚡ Active MIS Trades ({activeTrades.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "history"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>📜 Trade Log ({allTrades.length})</span>
        </button>
      </div>

      {/* Tab 1: Bullish LONG Breakouts */}
      {activeTab === "long" && (
        isScannerLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {longCandidates.map((c) => (
            <div
              key={c.symbol}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark glass-card-hover shadow-2xs space-y-4 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                        {c.symbol}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> LONG 5x MIS
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-muted-dark">
                      {c.company_name} • {c.sector}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-base font-black text-slate-900 dark:text-white block">
                      ₹{c.ltp.toFixed(2)}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        c.day_change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {c.day_change >= 0 ? "+" : ""}{c.day_change.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 15M ORB & VWAP Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-100 dark:border-border-dark text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-sans">15M ORB High</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{c.orb_high.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-sans">Live VWAP</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{c.vwap.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-sans">Rel Volume</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.volume_multiplier}x Surge</span>
                  </div>
                </div>

                {/* Target & Risk Parameters */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1 font-sans">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-emerald-900 dark:text-emerald-200 font-bold">
                      🎯 Target 1 (+1.8%): ₹{c.target_price.toFixed(2)}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      +₹{c.expected_net_profit.toLocaleString("en-IN")} Net (+{c.expected_roi_pct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <span>🛑 Tight SL (-0.8%): ₹{c.stop_loss.toFixed(2)}</span>
                    <span className="text-rose-500 font-bold">Max Risk: -₹{c.max_risk_inr.toLocaleString("en-IN")} (-{c.max_risk_pct}%)</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-muted-dark italic">
                  "{c.setup_thesis}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-border-dark gap-2">
                <button
                  onClick={() => onSelectStock(c.symbol)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-elevated flex items-center gap-1 cursor-pointer"
                >
                  <span>Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() =>
                    armMutation.mutate({
                      symbol: c.symbol,
                      company_name: c.company_name,
                      direction: "LONG",
                      entry_price: c.ltp,
                      shares: c.shares,
                      margin_capital: marginCapital,
                      total_exposure: c.total_exposure,
                      target_price: c.target_price,
                      stop_loss: c.stop_loss,
                      orb_high: c.orb_high,
                      orb_low: c.orb_low,
                      vwap: c.vwap
                    })
                  }
                  disabled={armMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>⚡ Arm Long Position (5x MIS)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {/* Tab 2: Bearish SHORT Breakdowns */}
      {activeTab === "short" && (
        isScannerLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortCandidates.map((c) => (
            <div
              key={c.symbol}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark glass-card-hover shadow-2xs space-y-4 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                        {c.symbol}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> SHORT 5x MIS
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-muted-dark">
                      {c.company_name} • {c.sector}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-base font-black text-slate-900 dark:text-white block">
                      ₹{c.ltp.toFixed(2)}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        c.day_change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {c.day_change >= 0 ? "+" : ""}{c.day_change.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 15M ORB & VWAP Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-100 dark:border-border-dark text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-sans">15M ORB Low</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{c.orb_low.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-sans">Live VWAP</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{c.vwap.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-sans">Rel Volume</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{c.volume_multiplier}x Velocity</span>
                  </div>
                </div>

                {/* Target & Risk Parameters */}
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1 font-sans">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-rose-900 dark:text-rose-200 font-bold">
                      🎯 Target 1 (-1.8% Drop): ₹{c.target_price.toFixed(2)}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      +₹{c.expected_net_profit.toLocaleString("en-IN")} Net (+{c.expected_roi_pct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <span>🛑 Tight SL (+0.8%): ₹{c.stop_loss.toFixed(2)}</span>
                    <span className="text-rose-500 font-bold">Max Risk: -₹{c.max_risk_inr.toLocaleString("en-IN")} (-{c.max_risk_pct}%)</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-muted-dark italic">
                  "{c.setup_thesis}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-border-dark gap-2">
                <button
                  onClick={() => onSelectStock(c.symbol)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-elevated flex items-center gap-1 cursor-pointer"
                >
                  <span>Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() =>
                    armMutation.mutate({
                      symbol: c.symbol,
                      company_name: c.company_name,
                      direction: "SHORT",
                      entry_price: c.ltp,
                      shares: c.shares,
                      margin_capital: marginCapital,
                      total_exposure: c.total_exposure,
                      target_price: c.target_price,
                      stop_loss: c.stop_loss,
                      orb_high: c.orb_high,
                      orb_low: c.orb_low,
                      vwap: c.vwap
                    })
                  }
                  disabled={armMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <TrendingDown className="w-3.5 h-3.5 text-white" />
                  <span>🔻 Arm Short Position (5x MIS)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {/* Tab 3: Active MIS Positions View */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {activeTrades.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark space-y-2">
              <Zap className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No active intraday positions</div>
              <p className="text-xs text-muted dark:text-muted-dark">
                Switch to Bullish Breakouts (LONG) or Bearish (SHORT) above to arm a 5x MIS position!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTrades.map((t) => {
                const isLong = t.direction === "LONG";
                const isProfit = (t.gross_pnl || 0) >= 0;
                return (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark glass-card-hover shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                            {t.symbol}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isLong
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {t.direction} 5x MIS
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-muted-dark">
                          Margin: ₹{t.margin_capital.toLocaleString("en-IN")} • Exposure: ₹{t.total_exposure.toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span
                          className={`text-base font-black block ${
                            isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isProfit ? "+" : ""}₹{(t.gross_pnl || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.roi_pct}% Return on Margin
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border-dark">
                      <button
                        onClick={() => onSelectStock(t.symbol)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                      >
                        Inspect Chart
                      </button>

                      <button
                        onClick={() => squareOffMutation.mutate({ id: t.id, exitPrice: t.live_price })}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-indigo-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        ⚡ Square Off Position
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Trade History Log */}
      {activeTab === "history" && (
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-border-dark pb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Historical Intraday Execution Log ({allTrades.length})</span>
            <span className="font-mono text-muted dark:text-muted-dark">SQLite Persistent Log</span>
          </div>

          {allTrades.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-muted-dark">No closed trades recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {allTrades.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-100 dark:border-border-dark flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.direction === "LONG" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {t.direction}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{t.symbol}</span>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Entry ₹{t.entry_price.toFixed(2)} • Exit ₹{(t.exit_price || t.entry_price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={`font-black ${
                          (t.net_pnl || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {(t.net_pnl || 0) >= 0 ? "+" : ""}₹{(t.net_pnl || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">{t.status.replace("_", " ")}</span>
                    </div>

                    <button
                      onClick={() => deleteMutation.mutate(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
