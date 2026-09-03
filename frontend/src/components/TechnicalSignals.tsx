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
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Technical & Quantitative Signals (PKScreener Engine)
            </h3>
            <p className="text-xs text-muted">
              14-day RSI momentum, 20-day breakout scans, and 50/200 EMA trend crosses for {symbol}
            </p>
          </div>
        </div>

        {/* Quant Score Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white shadow-xs self-start sm:self-auto">
          <Gauge className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-xs font-bold font-mono">
            Composite Score: <span className={score >= 70 ? "text-emerald-400" : score >= 45 ? "text-amber-300" : "text-rose-400"}>{score}/100</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Signal 1: 14-Day RSI Gauge */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              14-Day RSI Momentum
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                isRsiOverbought
                  ? "bg-amber-100 text-amber-800"
                  : isRsiOversold
                  ? "bg-profit-100 text-profit-800"
                  : "bg-indigo-100 text-indigo-800"
              }`}
            >
              {signals.rsi_condition}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">{rsi}</div>
            <span className="text-xs text-muted font-medium">/ 100</span>
          </div>

          {/* Gradient Visual Progress Bar with Threshold Markers */}
          <div className="space-y-1">
            <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                  isRsiOverbought
                    ? "bg-gradient-to-r from-amber-400 to-amber-600"
                    : isRsiOversold
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                    : "bg-gradient-to-r from-brand-400 to-indigo-600"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, rsi))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>0 (Oversold)</span>
              <span>50</span>
              <span>100 (Overbought)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            {rsi >= 60 && "Bullish momentum accumulation without hitting extreme overbought zones."}
            {rsi < 60 && rsi >= 40 && "Neutral equilibrium with balanced institutional absorption."}
            {rsi < 40 && "Subdued momentum; potential mean-reversion opportunity."}
          </p>
        </div>

        {/* Signal 2: 20-Day Breakout Scan */}
        <div
          className={`p-5 rounded-2xl border space-y-3 relative overflow-hidden transition-all ${
            breakout.is_breakout
              ? "bg-profit-50/70 border-profit-300 ring-1 ring-profit-200"
              : breakout.is_price_breakout
              ? "bg-amber-50/60 border-amber-300"
              : "bg-slate-50 border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              20-Day Breakout Scan
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                breakout.is_breakout
                  ? "bg-profit-200 text-profit-900 animate-pulse"
                  : breakout.is_price_breakout
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {breakout.is_breakout ? "🚀 Active Breakout" : breakout.is_price_breakout ? "At Resistance" : "In Range"}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Zap
                className={`w-4 h-4 ${
                  breakout.is_breakout ? "text-profit-600" : "text-slate-400"
                }`}
              />
              <span>
                Volume Surge:{" "}
                <strong className="font-mono text-slate-900">
                  {breakout.volume_surge}x
                </strong>{" "}
                Avg
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>20-Day Peak High:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(breakout.high_20d)}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            {breakout.is_breakout
              ? "High-conviction expansion breaking 20-day high with institutional volume surge."
              : "Price currently fluctuating within normal 20-day volatility boundary."}
          </p>
        </div>

        {/* Signal 3: 50 / 200 EMA Cross */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              EMA Trend Alignment
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                ema.trend === "STRONG BULLISH" || ema.trend === "BULLISH"
                  ? "bg-profit-100 text-profit-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {ema.trend}
            </span>
          </div>

          <div className="space-y-1 text-xs font-semibold text-slate-700">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">50-Day EMA (Fast):</span>
              <span className="font-mono text-slate-900 font-bold">{formatINR(ema.ema_50)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">200-Day EMA (Base):</span>
              <span className="font-mono text-slate-900 font-bold">{formatINR(ema.ema_200)}</span>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-1.5 text-xs font-bold text-profit-700">
            <ShieldCheck className="w-4 h-4 text-profit-600 shrink-0" />
            <span>{ema.is_golden_cross ? "Golden Cross Active (50 EMA > 200 EMA)" : "Structural Trend Consolidation"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
