import React from "react";
import type { QualityFiltersData } from "../types";
import {
  ShieldCheck,
  Award,
  PieChart,
  Truck,
  FileSpreadsheet
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

  return (
    <div className="glass-panel-3d rounded-2xl p-4 sm:p-6 space-y-5 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Institutional Quality & Governance Screener
            </h3>
            <p className="text-xs text-muted dark:text-slate-400">
              Piotroski F-Score (0-9), NSE delivery accumulation, and promoter pledge integrity for {symbol}
            </p>
          </div>
        </div>

        {/* Quality Verdict Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border self-start sm:self-auto ${
            isHighQuality
              ? "bg-profit-50 dark:bg-profit-950/80 text-profit-700 dark:text-profit-400 border-profit-200 dark:border-profit-800"
              : isModerateQuality
              ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
              : "bg-risk-50 dark:bg-risk-950/80 text-risk-700 dark:text-risk-400 border-risk-200 dark:border-risk-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{quality.piotroski_rating}</span>
        </div>
      </div>

      {/* 3 Main Quality Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1: Piotroski F-Score */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Piotroski F-Score
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">0 - 9 Scale</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              {fScore}
            </span>
            <span className="text-xs text-muted dark:text-slate-400 font-medium">/ 9 Points</span>
          </div>

          {/* 9-Block Visual Grid */}
          <div className="grid grid-cols-9 gap-1 pt-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 rounded-sm transition-all ${
                  i < fScore
                    ? isHighQuality
                      ? "bg-emerald-500 shadow-glow-emerald"
                      : "bg-brand-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {fScore >= 8
              ? "Pristine capital allocation; positive operating cash flow exceeds net profit with zero debt distress."
              : fScore >= 6
              ? "Healthy balance sheet and steady operating margins."
              : "Subdued operating leverage; monitor quarterly cash conversion cycle."}
          </p>
        </div>

        {/* Pillar 2: NSE Delivery % */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-brand-500" />
              NSE Delivery %
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                isHighDelivery
                  ? "bg-profit-100 dark:bg-profit-950 text-profit-800 dark:text-profit-300"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {quality.delivery_signal}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              {deliveryPct}%
            </span>
            <span className="text-xs text-muted dark:text-slate-400 font-medium">Demat Takeover</span>
          </div>

          <div className="relative h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                isHighDelivery ? "bg-emerald-500 shadow-glow-emerald" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, deliveryPct)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {isHighDelivery
              ? "Institutional accumulation confirmed. High proportion of shares moving into demat accounts."
              : "Speculative retail intraday volume dominance; lower long-term demat retention."}
          </p>
        </div>

        {/* Pillar 3: Promoter Pledging & Order Book */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 glass-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <PieChart className="w-3.5 h-3.5 text-indigo-500" />
              Promoter Pledge
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                quality.is_pledge_safe
                  ? "bg-profit-100 dark:bg-profit-950 text-profit-800 dark:text-profit-300"
                  : "bg-risk-100 dark:bg-risk-950 text-risk-800 dark:text-risk-300"
              }`}
            >
              {quality.pledge_status}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              {quality.promoter_pledge_pct}%
            </span>
            <span className="text-xs text-muted dark:text-slate-400 font-medium">Pledged Shares</span>
          </div>

          {/* Institutional Holding Split */}
          <div className="pt-1 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
            <span>FII: <strong>{quality.fii_holding_pct}%</strong></span>
            <span>DII: <strong>{quality.dii_holding_pct}%</strong></span>
            <span>Promoter: <strong>{quality.promoter_holding_pct}%</strong></span>
          </div>

          {quality.order_book_cr > 0 && (
            <div className="pt-1 flex items-center justify-between text-xs font-semibold text-brand-700 dark:text-brand-300">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                Order Backlog:
              </span>
              <span className="font-mono font-bold">₹{quality.order_book_cr.toLocaleString("en-IN")} Cr</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
