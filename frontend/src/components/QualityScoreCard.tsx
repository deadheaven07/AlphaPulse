import React from "react";
import type { QualityFiltersData } from "../types";
import { formatINR } from "../utils/formatters";
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  PieChart,
  Truck,
  TrendingUp,
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
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Institutional Quality & Governance Screener
            </h3>
            <p className="text-xs text-muted">
              Piotroski F-Score (0-9), NSE delivery accumulation, and promoter pledge integrity for {symbol}
            </p>
          </div>
        </div>

        {/* Quality Verdict Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border self-start sm:self-auto ${
            isHighQuality
              ? "bg-profit-50 text-profit-700 border-profit-200"
              : isModerateQuality
              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
              : "bg-risk-50 text-risk-700 border-risk-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{quality.piotroski_rating}</span>
        </div>
      </div>

      {/* 3 Main Quality Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1: Piotroski F-Score */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Piotroski F-Score
            </span>
            <span className="text-[10px] font-bold text-slate-400">0 - 9 Scale</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">
              {fScore}
            </span>
            <span className="text-xs text-muted font-medium">/ 9 Points</span>
          </div>

          {/* 9-Block Visual Grid */}
          <div className="grid grid-cols-9 gap-1 pt-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 rounded-sm transition-all ${
                  i < fScore
                    ? isHighQuality
                      ? "bg-emerald-500 shadow-xs"
                      : "bg-brand-500"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            {fScore >= 8
              ? "Pristine capital allocation; positive operating cash flow exceeds net profit with zero debt distress."
              : fScore >= 6
              ? "Healthy balance sheet and steady operating margins."
              : "Sub-par cash flow conversion; elevated leverage or margin compression."}
          </p>
        </div>

        {/* Pillar 2: NSE Delivery % */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-brand-600" />
              NSE Delivery Volume
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                isHighDelivery
                  ? "bg-profit-100 text-profit-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {isHighDelivery ? "Institutional (>50%)" : "Retail Intraday"}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">
              {deliveryPct}%
            </span>
            <span className="text-xs text-muted font-medium">Delivery Ratio</span>
          </div>

          {/* Progress bar */}
          <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 bottom-0 rounded-full ${
                isHighDelivery
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  : "bg-gradient-to-r from-brand-400 to-indigo-600"
              }`}
              style={{ width: `${Math.min(100, Math.max(5, deliveryPct))}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            {isHighDelivery
              ? "Over 50% of traded shares moved to demat accounts, indicating strong institutional long-term accumulation."
              : "Higher intraday speculative churn; wait for volume delivery confirmation."}
          </p>
        </div>

        {/* Pillar 3: Promoter Pledge & Governance */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Promoter Pledging
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                quality.is_pledge_safe
                  ? "bg-profit-100 text-profit-800"
                  : "bg-risk-100 text-risk-800"
              }`}
            >
              {quality.is_pledge_safe ? "Safe (<15%)" : "Red Flag (>15%)"}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">
              {quality.promoter_pledge_pct}%
            </span>
            <span className="text-xs text-muted font-medium">Pledged Equity</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
            {quality.is_pledge_safe ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{quality.pledge_status}</span>
          </div>

          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            {quality.promoter_pledge_pct === 0
              ? "Zero promoter shares pledged. Zero risk of margin call liquidations."
              : `Promoter pledge held at ${quality.promoter_pledge_pct}%, safely within the 15% threshold.`}
          </p>
        </div>
      </div>

      {/* Shareholding Pattern & Order Book Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Promoter Holding
            </span>
            <span className="text-base font-extrabold font-mono text-slate-900">
              {quality.promoter_holding_pct > 0 ? `${quality.promoter_holding_pct}%` : "Institutionally Led"}
            </span>
          </div>
          <PieChart className="w-5 h-5 text-slate-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              FII (Foreign Inst.)
            </span>
            <span className="text-base font-extrabold font-mono text-slate-900">
              {quality.fii_holding_pct}%
            </span>
          </div>
          <TrendingUp className="w-5 h-5 text-brand-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              DII (Mutual Funds)
            </span>
            <span className="text-base font-extrabold font-mono text-slate-900">
              {quality.dii_holding_pct}%
            </span>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block">
              Order Backlog
            </span>
            <span className="text-base font-extrabold font-mono text-brand-800">
              {quality.order_book_cr > 0 ? formatINR(quality.order_book_cr * 10000000, true) : "Recurring Rev"}
            </span>
          </div>
          <FileSpreadsheet className="w-5 h-5 text-brand-600" />
        </div>
      </div>
    </div>
  );
};
