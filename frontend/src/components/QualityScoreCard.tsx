import React from "react";
import type { QualityFiltersData } from "../types";
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  PieChart,
  Truck,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle2,
  Building2,
  Sparkles,
  Layers
} from "lucide-react";

interface QualityScoreCardProps {
  quality?: QualityFiltersData;
  symbol: string;
}

export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({ quality, symbol }) => {
  if (!quality) return null;

  const fScore = quality.piotroski_score;
  const isHighQuality = fScore >= 8;
  const isModerateQuality = fScore >= 6 && fScore < 8;

  const deliveryPct = quality.delivery_pct;
  const isHighDelivery = deliveryPct >= 50;

  const promoterHolding = quality.promoter_holding_pct || 0;
  const fiiHolding = quality.fii_holding_pct || 0;
  const diiHolding = quality.dii_holding_pct || 0;
  const publicHolding = Math.max(0, parseFloat((100 - promoterHolding - fiiHolding - diiHolding).toFixed(2)));

  return (
    <div className="glass-panel-3d rounded-2xl p-5 sm:p-6 space-y-6 transition-all duration-300 border border-border/80 dark:border-slate-800/90 shadow-soft">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/15 to-indigo-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Institutional Quality & Governance Screener
              </h3>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {symbol}
              </span>
            </div>
            <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
              Piotroski F-Score (0-9), NSE delivery accumulation, and promoter pledge integrity for {symbol}
            </p>
          </div>
        </div>

        {/* Quality Verdict Master Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold border shadow-xs transition-transform hover:scale-102 ${
            isHighQuality
              ? "bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              : isModerateQuality
              ? "bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
              : "bg-rose-500/10 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-500/30"
          }`}
        >
          {isHighQuality ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span className="tracking-wide uppercase font-mono">{quality.piotroski_rating}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* 3 Main Quality Pillars */}
      <div className="space-y-4">
        {/* ======================================================== */}
        {/* PILLAR 1: Piotroski F-Score (0 - 9 Points)              */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-soft transition-all space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                Piotroski F-Score
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                0 - 9 Scale
              </span>
            </div>

            {/* Score & Points Callout */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className={`text-4xl font-black font-mono tracking-tight ${
                isHighQuality ? "text-emerald-600 dark:text-emerald-400" : isModerateQuality ? "text-indigo-600 dark:text-indigo-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {fScore}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                / 9 Points
              </span>
              <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                isHighQuality
                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                  : isModerateQuality
                  ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300"
                  : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
              }`}>
                {isHighQuality ? "Pristine Solvency" : isModerateQuality ? "Moderate Moat" : "Cautionary"}
              </span>
            </div>

            {/* 9-Block Segmented Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="grid grid-cols-9 gap-1.5">
                {Array.from({ length: 9 }).map((_, i) => {
                  const isActive = i < fScore;
                  return (
                    <div
                      key={i}
                      className={`h-3 rounded-md transition-all duration-300 ${
                        isActive
                          ? isHighQuality
                            ? "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-indigo-500 dark:bg-indigo-400"
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                      title={`Checkpoint ${i + 1}/9: ${isActive ? "Passed" : "Not Met"}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0 Weak</span>
                <span>5 Average</span>
                <span>9 Perfect</span>
              </div>
            </div>

            {/* Qualitative Narrative */}
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
              {fScore >= 8
                ? "Pristine capital allocation; positive operating cash flow exceeds net profit with zero debt distress."
                : fScore >= 6
                ? "Healthy balance sheet, sustainable operating margin cushions, and sound debt servicing capacity."
                : "Subdued operating leverage; monitor quarterly working capital cycle and operating cashflows."}
            </p>
          </div>

          {/* Pillar 1 Checkpoint Chips */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Cashflow &gt; Profit
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Zero Debt Risk
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PILLAR 2: NSE Delivery % (Demat Takeover)               */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-soft transition-all space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                NSE Delivery %
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded font-mono ${
                  isHighDelivery
                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {quality.delivery_signal}
              </span>
            </div>

            {/* Delivery % Metric */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className={`text-4xl font-black font-mono tracking-tight ${
                isHighDelivery ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
              }`}>
                {deliveryPct}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Demat Takeover
              </span>
              {isHighDelivery && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  Strong
                </span>
              )}
            </div>

            {/* Delivery Progress Bar with 50% Benchmark Marker */}
            <div className="space-y-1 pt-1">
              <div className="relative h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ${
                    isHighDelivery
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : "bg-gradient-to-r from-amber-500 to-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, deliveryPct)}%` }}
                />
                {/* 50% Institutional Line Marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-900/30 dark:bg-white/40 z-10" />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0% Speculative</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">50% Inst. Threshold</span>
                <span>100% Full Demat</span>
              </div>
            </div>

            {/* Qualitative Narrative */}
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
              {isHighDelivery
                ? "Institutional accumulation confirmed. High proportion of shares moving into demat accounts."
                : "Higher speculative intraday churning; lower proportion of trade volume held for multi-week delivery."}
            </p>
          </div>

          {/* Pillar 2 Footnote */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Smart Money Flow
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {isHighDelivery ? "Accumulation" : "Churn"}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PILLAR 3: Promoter Pledge & Institutional Holding Split */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-soft transition-all space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                Promoter Pledge
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded font-mono ${
                  quality.is_pledge_safe
                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                }`}
              >
                {quality.pledge_status}
              </span>
            </div>

            {/* Pledge % Metric */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className={`text-4xl font-black font-mono tracking-tight ${
                quality.is_pledge_safe ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}>
                {quality.promoter_pledge_pct}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Pledged Shares
              </span>
              {quality.is_pledge_safe && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Zero Risk
                </span>
              )}
            </div>

            {/* Segmented Shareholding Visual Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <div
                  className="bg-emerald-500 dark:bg-emerald-400 transition-all duration-500"
                  style={{ width: `${promoterHolding}%` }}
                  title={`Promoter: ${promoterHolding}%`}
                />
                <div
                  className="bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                  style={{ width: `${fiiHolding}%` }}
                  title={`FII: ${fiiHolding}%`}
                />
                <div
                  className="bg-purple-500 dark:bg-purple-400 transition-all duration-500"
                  style={{ width: `${diiHolding}%` }}
                  title={`DII: ${diiHolding}%`}
                />
                <div
                  className="bg-slate-300 dark:bg-slate-700 transition-all duration-500"
                  style={{ width: `${publicHolding}%` }}
                  title={`Public: ${publicHolding}%`}
                />
              </div>

              {/* Shareholding Legend Chips */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-medium">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                  <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Promoter</span>
                  <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-300">{promoterHolding}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-center">
                  <span className="text-slate-500 dark:text-slate-400 block text-[9px]">FII</span>
                  <span className="font-mono font-extrabold text-blue-700 dark:text-blue-300">{fiiHolding}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 text-center">
                  <span className="text-slate-500 dark:text-slate-400 block text-[9px]">DII</span>
                  <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300">{diiHolding}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Backlog Callout Footer */}
          {quality.order_book_cr > 0 ? (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-500/20">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                Order Backlog:
              </span>
              <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                ₹{quality.order_book_cr.toLocaleString("en-IN")} Cr
              </span>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-500" />
                Capital Structure
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Pristine
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

