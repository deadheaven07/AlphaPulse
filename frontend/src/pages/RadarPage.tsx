import React, { useState } from "react";
import { RealTimeRadarKPIs } from "../components/RealTimeRadarKPIs";
import { PennyStocksRadar } from "../components/PennyStocksRadar";
import { InsiderDealsRadar } from "../components/InsiderDealsRadar";
import { Radar, Coins, UserCheck } from "lucide-react";

interface RadarPageProps {
  onSelectStock: (symbol: string, budget?: number) => void;
  capital: number;
  onCapitalChange: (cap: number) => void;
}

export const RadarPage: React.FC<RadarPageProps> = ({
  onSelectStock,
  capital,
  onCapitalChange,
}) => {
  const [activeTab, setActiveTab] = useState<"leaders" | "penny" | "insider">("leaders");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-border-dark pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Quantitative Stock Screeners & Radar
              </h1>
              <p className="text-xs text-muted dark:text-muted-dark">
                Institutional 5-factor scoring, promoter insider buys & vetted small-cap turnaround filter
              </p>
            </div>
          </div>
        </div>

        {/* Screener Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-surface-elevated border border-slate-200 dark:border-border-dark self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("leaders")}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "leaders"
                ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-muted-dark hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>5-Factor Leaders</span>
          </button>

          <button
            onClick={() => setActiveTab("insider")}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "insider"
                ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-muted-dark hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Insider & Bulk Deals</span>
          </button>

          <button
            onClick={() => setActiveTab("penny")}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "penny"
                ? "bg-white dark:bg-amber-600 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-muted-dark hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Sub-₹150 Opportunities</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 5-Factor Institutional Leaders */}
      {activeTab === "leaders" && (
        <section className="space-y-4">
          <RealTimeRadarKPIs
            onSelectStock={(sym) => onSelectStock(sym)}
            referenceCapital={capital}
            onCapitalChange={onCapitalChange}
          />
        </section>
      )}

      {/* Tab 2: Trendlyne-Style Insider Buying & Bulk Deals */}
      {activeTab === "insider" && (
        <section className="space-y-4">
          <InsiderDealsRadar
            onSelectStock={(sym) => onSelectStock(sym)}
          />
        </section>
      )}

      {/* Tab 3: Vetted Sub-₹150 Opportunities */}
      {activeTab === "penny" && (
        <section className="space-y-4">
          <PennyStocksRadar
            onSelectStock={(sym, bgt) => onSelectStock(sym, bgt)}
          />
        </section>
      )}
    </div>
  );
};
