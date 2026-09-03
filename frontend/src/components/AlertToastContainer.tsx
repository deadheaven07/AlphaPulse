import React, { useEffect, useState } from "react";
import type { PortfolioAlert } from "../types";
import { soundManager } from "../utils/audioAlerts";
import { formatINR } from "../utils/formatters";
import {
  Target,
  AlertOctagon,
  AlertTriangle,
  Zap,
  X,
  ArrowRight
} from "lucide-react";

interface AlertToastContainerProps {
  alerts: PortfolioAlert[];
  onDismiss: (alertId: string) => void;
  onSelectSymbol?: (symbol: string) => void;
}

export const AlertToastContainer: React.FC<AlertToastContainerProps> = ({
  alerts,
  onDismiss,
  onSelectSymbol,
}) => {
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set());

  // Play audio buzzer / chime sound whenever a new alert arrives
  useEffect(() => {
    alerts.forEach((alert) => {
      if (!playedIds.has(alert.id)) {
        if (alert.alert_type === "PROFIT_TARGET") {
          soundManager.playProfitChime();
        } else if (alert.alert_type === "STOP_LOSS_BREACH" || alert.alert_type === "NEWS_THREAT") {
          soundManager.playWarningBuzzer();
        } else if (alert.alert_type === "CONSOLIDATION_BREAKOUT") {
          soundManager.playBreakoutBeep();
        }
        setPlayedIds((prev) => new Set([...prev, alert.id]));
      }
    });
  }, [alerts, playedIds]);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {alerts.map((alert) => {
        const isProfit = alert.alert_type === "PROFIT_TARGET";
        const isStopLoss = alert.alert_type === "STOP_LOSS_BREACH";
        const isNewsThreat = alert.alert_type === "NEWS_THREAT";

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-in-right relative overflow-hidden ${
              isProfit
                ? "bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500 text-white shadow-emerald-950/50"
                : isStopLoss
                ? "bg-rose-950/90 dark:bg-rose-950/95 border-rose-500 text-white shadow-rose-950/50 animate-pulse"
                : isNewsThreat
                ? "bg-amber-950/90 dark:bg-amber-950/95 border-amber-500 text-white shadow-amber-950/50"
                : "bg-slate-900/90 dark:bg-surface-elevated border-slate-700 text-white shadow-slate-950/50"
            }`}
          >
            {/* Top Row Icon + Title + Close */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${
                    isProfit
                      ? "bg-emerald-500 text-white"
                      : isStopLoss
                      ? "bg-rose-600 text-white"
                      : isNewsThreat
                      ? "bg-amber-500 text-slate-950"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {isProfit ? (
                    <Target className="w-4 h-4" />
                  ) : isStopLoss ? (
                    <AlertOctagon className="w-4 h-4" />
                  ) : isNewsThreat ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-xs tracking-tight">{alert.title}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] opacity-85 font-mono">
                    <span>{alert.symbol}</span>
                    <span>•</span>
                    <span>LTP: {formatINR(alert.current_price)}</span>
                    {alert.pnl_pct !== undefined && (
                      <span className={alert.pnl_pct >= 0 ? "text-emerald-300 font-bold" : "text-rose-300 font-bold"}>
                        ({alert.pnl_pct >= 0 ? "+" : ""}{alert.pnl_pct}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alert Body Message */}
            <p className="mt-2 text-[11px] leading-relaxed text-slate-200">
              {alert.message}
            </p>

            {/* Quick Action Button */}
            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10">
                {alert.recommended_action.replace(/_/g, " ")}
              </span>

              {onSelectSymbol && (
                <button
                  onClick={() => {
                    onSelectSymbol(alert.symbol);
                    onDismiss(alert.id);
                  }}
                  className="text-[11px] font-bold text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect {alert.symbol}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Visual Shrinking Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 overflow-hidden">
              <div className="h-full bg-white animate-toast-timer" style={{ animationDuration: "12s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
