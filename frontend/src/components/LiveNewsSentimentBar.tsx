import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNewsSentiment } from "../services/api";
import {
  Newspaper,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap
} from "lucide-react";

interface LiveNewsSentimentBarProps {
  symbol: string;
}

export const LiveNewsSentimentBar: React.FC<LiveNewsSentimentBarProps> = ({ symbol }) => {
  const [showAllNews, setShowAllNews] = useState(false);

  const { data: newsData, isLoading } = useQuery({
    queryKey: ["news-sentiment", symbol],
    queryFn: () => fetchNewsSentiment(symbol),
    staleTime: 30000,
  });

  if (isLoading || !newsData) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5 text-center">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Analyzing real-time news sentiment & risk probability for {symbol}...</p>
      </div>
    );
  }

  const isLowRisk = newsData.risk_of_loss_pct <= 25.0;
  const isModerateRisk = newsData.risk_of_loss_pct > 25.0 && newsData.risk_of_loss_pct <= 40.0;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Live News Sentiment & Loss Risk Meter
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                {newsData.sentiment_label}
              </span>
            </div>
            <p className="text-xs text-muted">
              Dynamic trade win probability & drawdown risk evaluated from {newsData.total_news_analyzed} recent financial news feeds for {symbol}
            </p>
          </div>
        </div>

        {/* Win Probability Pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border self-start sm:self-auto ${
            isLowRisk
              ? "bg-profit-50 text-profit-700 border-profit-200"
              : isModerateRisk
              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
              : "bg-risk-50 text-risk-700 border-risk-200"
          }`}
        >
          {isLowRisk ? <ShieldCheck className="w-4 h-4 text-profit-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
          <span>Win Probability: <strong>{newsData.win_probability_pct}%</strong></span>
        </div>
      </div>

      {/* Visual Risk & Sentiment Meter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Win Probability vs Loss Risk Gauge */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Risk of Loss Probability
            </span>
            <span className="font-mono text-xs font-extrabold text-slate-900">
              {newsData.risk_of_loss_pct}% Risk ({newsData.win_probability_pct}% Win Edge)
            </span>
          </div>

          <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                isLowRisk
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  : isModerateRisk
                  ? "bg-gradient-to-r from-indigo-400 to-indigo-600"
                  : "bg-gradient-to-r from-rose-400 to-rose-600"
              }`}
              style={{ width: `${newsData.win_probability_pct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0% (High Loss Risk)</span>
            <span>50% (Equilibrium)</span>
            <span>100% (High Win Edge)</span>
          </div>

          <p className="text-[11px] text-slate-600 font-medium">
            {isLowRisk
              ? "🟢 Strong bullish news catalysts provide substantial margin of safety against immediate drawdowns."
              : isModerateRisk
              ? "🟡 Balanced news flow; ensure price action confirms with technical breakout before entry."
              : "🔴 Elevated headline risk or negative catalysts; tighter stop losses recommended."}
          </p>
        </div>

        {/* Right: Primary Active Catalyst */}
        <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Primary Active Catalyst
            </span>
            <span className="text-[10px] font-mono font-bold text-brand-600">
              Score: {newsData.sentiment_score > 0 ? `+${newsData.sentiment_score}` : newsData.sentiment_score}
            </span>
          </div>

          <p className="text-xs font-extrabold text-slate-900 leading-snug">
            "{newsData.primary_catalyst}"
          </p>

          <div className="pt-1 flex items-center gap-2 text-[11px] text-brand-700">
            <Zap className="w-3.5 h-3.5 text-brand-600" />
            <span>Monte Carlo Drift Bias: <strong>{(newsData.sentiment_drift_modifier * 100).toFixed(1)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Breaking Headlines Feed */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-brand-500" />
            Recent Breaking Headlines
          </span>
          <button
            onClick={() => setShowAllNews(!showAllNews)}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>{showAllNews ? "Show Less" : `View All (${newsData.headlines.length})`}</span>
            {showAllNews ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="space-y-2">
          {(showAllNews ? newsData.headlines : newsData.headlines.slice(0, 3)).map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white transition-all space-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-xs text-slate-900 hover:text-brand-600 flex items-center gap-1 group"
                >
                  <span>{item.title}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400 shrink-0 transition-opacity" />
                </a>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                    item.impact.includes("Bullish") || item.impact.includes("Positive")
                      ? "bg-profit-100 text-profit-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.impact}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {item.summary}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted font-medium pt-0.5">
                <span>{item.source}</span>
                <span>•</span>
                <span>{item.time_ago}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
