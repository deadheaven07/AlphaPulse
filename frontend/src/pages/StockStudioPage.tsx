import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStockQuote } from "../services/api";
import { StockOverviewCard } from "../components/StockOverviewCard";
import { LiveNewsSentimentBar } from "../components/LiveNewsSentimentBar";
import { QualityScoreCard } from "../components/QualityScoreCard";
import { TechnicalSignals } from "../components/TechnicalSignals";
import { SectorRrgMap } from "../components/SectorRrgMap";
import { WeeklyTopPerformersWidget } from "../components/WeeklyTopPerformersWidget";
import { MonthlyChampionBanner } from "../components/MonthlyChampionBanner";
import { LineChart, Calculator, ArrowRight } from "lucide-react";

interface StockStudioPageProps {
  symbol: string;
  onSelectSymbol: (symbol: string) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onNavigateToSimulator: () => void;
}

export const StockStudioPage: React.FC<StockStudioPageProps> = ({
  symbol,
  onSelectSymbol,
  isWatchlisted,
  onToggleWatchlist,
  onNavigateToSimulator,
}) => {
  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => fetchStockQuote(symbol),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-border-dark pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Quantitative Stock Studio
              </h1>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface-elevated text-slate-800 dark:text-slate-200">
                {symbol}
              </span>
            </div>
            <p className="text-xs text-muted dark:text-muted-dark">
              Live candlestick feeds, institutional delivery, moving averages & fundamental quality moats
            </p>
          </div>
        </div>

        {/* Quick Route to Simulator */}
        <button
          onClick={onNavigateToSimulator}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Calculator className="w-4 h-4" />
          <span>Simulate Monte Carlo for {symbol}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 🏆 Institutional Pick of the Month Banner (Safest High-Yield 30-Day Compounder) */}
      <MonthlyChampionBanner
        activeSymbol={symbol}
        onSelectSymbol={onSelectSymbol}
      />

      {/* Main Grid: Central Overview & Side Weekly Performers Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Center Main Column (Stock Overview & Live Price Graph) */}
        <div className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <div className="glass-panel-3d rounded-2xl p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500 dark:text-muted-dark">
                Fetching live NSE quotes, quality metrics, and technical indicators for {symbol}...
              </p>
            </div>
          ) : quote ? (
            <>
              <StockOverviewCard
                quote={quote}
                onSelectSymbol={onSelectSymbol}
                isWatchlisted={isWatchlisted}
                onToggleWatchlist={onToggleWatchlist}
              />

              {/* Live News Sentiment & Loss Risk Engine */}
              <LiveNewsSentimentBar
                symbol={quote.symbol}
              />
            </>
          ) : (
            <div className="p-8 text-center text-muted dark:text-muted-dark text-xs glass-panel-3d rounded-2xl">
              Unable to fetch data for symbol {symbol}. Please check ticker symbol.
            </div>
          )}
        </div>

        {/* Side Column: Top Performers of the Week (Default 3, Expandable) */}
        <div className="lg:col-span-4 space-y-6">
          <WeeklyTopPerformersWidget
            activeSymbol={symbol}
            onSelectSymbol={onSelectSymbol}
          />

          {quote && (
            /* Quality Scorecard (Piotroski F-Score & Delivery %) */
            <QualityScoreCard
              quality={quote.quality_filters}
              symbol={quote.symbol}
            />
          )}
        </div>
      </div>

      {quote && (
        <>
          {/* Technical Signals & Moving Averages */}
          <TechnicalSignals signals={quote.technicals} symbol={quote.symbol} />

          {/* Relative Rotation Graph 2D Quadrant Map & Constituent Stocks Breakdown */}
          <SectorRrgMap
            currentSectorRrg={quote.sector_rrg}
            activeStockSymbol={quote.symbol}
            onSelectSymbol={onSelectSymbol}
            onNavigateToSimulator={onNavigateToSimulator}
          />
        </>
      )}
    </div>
  );
};
