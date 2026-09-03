import React from "react";
import type { TechnicalSignalsData } from "../types";
import { formatINR } from "../utils/formatters";
import {
  Activity,
  Zap,
  ShieldCheck,
  Gauge
} from "lucide-react";

interface TechnicalSignalsProps {
  signals?: TechnicalSignalsData;
  symbol: string;
}

export const TechnicalSignals: React.FC<TechnicalSignalsProps> = ({ signals, symbol }) => {
  if (!signals) return null;

  const rsi = signals.rsi_14;
  const isRsiOverbought = rsi >= 70;
  const isRsiOversold = rsi <= 30;

  const breakout = signals.breakout;
  const ema = signals.ema_analysis;
  const score = signals.technical_score;

  return (
    <div className="glass-panel-3d rounded-2xl p-4 sm:p-6 space-y-5 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Technical & Quantitative Signals (PKScreener Engine)
            </h3>
            <p className="text-xs text-muted dark:text-slate-400">
              14-day RSI momentum, 20-day breakout scans, and 50/200 EMA trend crosses for {symbol}
            </p>
          </div>
        </div>

        {/* Quant Score Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white shadow-xs self-start sm:self-auto border border-slate-700/50">
          <Gauge className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-xs font-bold font-mono">
            Composite Score:{" "}
            <span className={score >= 70 ? "text-emerald-400" : score >= 45 ? "text-amber-300" : "text-rose-400"}>
              {score}/100
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Signal 1: 14-Day RSI Gauge */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              14-Day RSI Momentum
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                isRsiOverbought
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                  : isRsiOversold
                  ? "bg-profit-100 dark:bg-profit-950 text-profit-800 dark:text-profit-300"
                  : "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300"
              }`}
            >
              {signals.rsi_condition}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">{rsi}</div>
            <span className="text-xs text-muted dark:text-slate-400 font-medium">/ 100</span>
          </div>

          {/* Gradient Visual Progress Bar with Threshold Markers */}
          <div className="space-y-1">
            <div className="relative h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                  isRsiOverbought
                    ? "bg-gradient-to-r from-amber-400 to-amber-600 shadow-glow-amber"
                    : isRsiOversold
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-glow-emerald"
                    : "bg-gradient-to-r from-brand-400 to-indigo-600 shadow-glow-cyan"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, rsi))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-mono">
              <span>0 (Oversold)</span>
              <span>50</span>
              <span>100 (Overbought)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {isRsiOverbought
              ? "Overbought territory (>70); mean-reversion pullbacks or price consolidation probable."
              : isRsiOversold
              ? "Oversold accumulation zone (<30); potential tactical bounce candidate."
              : "Neutral momentum zone; trend follows broader institutional accumulation."}
          </p>
        </div>

        {/* Signal 2: 20-Day Breakout Scanner */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              20-Day High Breakout
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                breakout.is_breakout
                  ? "bg-profit-100 dark:bg-profit-950 text-profit-800 dark:text-profit-300"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {breakout.is_breakout ? "Confirmed Breakout" : "Consolidation Range"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
              20D High: <span className="font-extrabold">{formatINR(breakout.high_20d)}</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Volume Surge: <strong className="font-mono text-slate-900 dark:text-white">{breakout.volume_surge}x</strong> vs 20-day average
            </div>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {breakout.is_breakout
              ? "Price has broken above its 20-day high with >1.5x volume expansion confirming strong institutional demand."
              : "Trading within recent 20-day trading range; awaiting volatility expansion trigger."}
          </p>
        </div>

        {/* Signal 3: 50 & 200 EMA Cross */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              Moving Average Trend
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                ema.is_golden_cross
                  ? "bg-profit-100 dark:bg-profit-950 text-profit-800 dark:text-profit-300"
                  : ema.above_200_ema
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300"
                  : "bg-risk-100 dark:bg-risk-950 text-risk-800 dark:text-risk-300"
              }`}
            >
              {ema.trend}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">50 EMA</span>
              <span className="text-slate-900 dark:text-white">{formatINR(ema.ema_50)}</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">200 EMA</span>
              <span className="text-slate-900 dark:text-white">{formatINR(ema.ema_200)}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {ema.is_golden_cross
              ? "Golden Cross active (50 EMA > 200 EMA). Primary secular bull market trend in effect."
              : ema.above_200_ema
              ? "Spot price holding firmly above 200-day long-term institutional support."
              : "Trading below 200 EMA; cautionary risk management advised."}
          </p>
        </div>
      </div>
    </div>
  );
};
