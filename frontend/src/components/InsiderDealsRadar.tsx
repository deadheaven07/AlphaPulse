import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInsiderDeals } from "../services/api";
import {
  Briefcase,
  UserCheck,
  ShieldCheck,
  Calendar,
  Building2,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

interface InsiderDealsRadarProps {
  onSelectStock: (symbol: string) => void;
}

export const InsiderDealsRadar: React.FC<InsiderDealsRadarProps> = ({ onSelectStock }) => {
  const [filterType, setFilterType] = useState<"ALL" | "PROMOTER" | "BULK">("ALL");

  const { data: deals, isLoading } = useQuery({
    queryKey: ["insider-bulk-deals"],
    queryFn: fetchInsiderDeals,
    refetchInterval: 60000,
  });

  const allDeals = deals || [];
  const filteredDeals = allDeals.filter((d) => {
    if (filterType === "PROMOTER") return d.deal_type.includes("PROMOTER");
    if (filterType === "BULK") return d.deal_type.includes("BULK") || d.deal_type.includes("BLOCK");
    return true;
  });

  const totalPromoterValue = allDeals
    .filter((d) => d.deal_type.includes("PROMOTER"))
    .reduce((acc, d) => acc + d.value_crores, 0);

  const totalBulkValue = allDeals
    .filter((d) => !d.deal_type.includes("PROMOTER"))
    .reduce((acc, d) => acc + d.value_crores, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Overview Banner & Stats */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Trendlyne Style Radar
            </span>
            <span className="text-xs text-slate-400 font-sans">NSE / BSE Form C & Bulk Deal Disclosures</span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
            Daily Insider Buying & Institutional Bulk Deals
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed font-sans">
            Track when company promoters and mutual funds put their own capital to work. Stocks with promoter accumulation receive a <b>+15 point boost</b> in our tactical momentum engine.
          </p>
        </div>

        {/* Aggregated Deal Value Summary */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-900/60 text-right">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Promoter Buying</span>
            <span className="text-sm sm:text-base font-black text-emerald-300">₹{totalPromoterValue.toFixed(1)} Cr</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-900/60 text-right">
            <span className="text-[10px] text-cyan-400 font-bold block uppercase tracking-wider">MF / FII Blocks</span>
            <span className="text-sm sm:text-base font-black text-cyan-300">₹{totalBulkValue.toFixed(1)} Cr</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-border-dark pb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "ALL"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-canvas-dark text-slate-600 dark:text-muted-dark hover:bg-slate-200 dark:hover:bg-surface-elevated"
            }`}
          >
            All Deals ({allDeals.length})
          </button>
          <button
            onClick={() => setFilterType("PROMOTER")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "PROMOTER"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-canvas-dark text-slate-600 dark:text-muted-dark hover:bg-slate-200 dark:hover:bg-surface-elevated"
            }`}
          >
            Promoter Buys Only
          </button>
          <button
            onClick={() => setFilterType("BULK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "BULK"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-canvas-dark text-slate-600 dark:text-muted-dark hover:bg-slate-200 dark:hover:bg-surface-elevated"
            }`}
          >
            MF & FII Bulk Blocks
          </button>
        </div>

        <span className="text-xs text-muted dark:text-muted-dark font-mono hidden sm:inline">
          Showing {filteredDeals.length} Verified Institutional Transactions
        </span>
      </div>

      {/* Deals Grid */}
      {isLoading ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-muted-dark font-medium">Scanning exchange disclosure feeds...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeals.map((deal, idx) => {
            const isPromoter = deal.deal_type.includes("PROMOTER");
            return (
              <div
                key={`${deal.symbol}-${idx}`}
                className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark glass-card-hover shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {deal.symbol}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                            isPromoter
                              ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800"
                          }`}
                        >
                          {isPromoter ? <UserCheck className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                          {deal.action.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-muted-dark truncate max-w-[240px]">
                        {deal.company_name}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
                        +₹{deal.value_crores.toFixed(1)} Cr
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-muted-dark">
                        {deal.shares.toLocaleString("en-IN")} Shares @ ₹{deal.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Acquiring Entity */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-canvas-dark border border-slate-100 dark:border-border-dark text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-muted-dark font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-500" /> Acquiring Entity:
                      </span>
                      <span className="flex items-center gap-1 font-mono text-slate-400">
                        <Calendar className="w-2.5 h-2.5" /> {deal.date}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {deal.entity}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-0.5">
                      "{deal.notes}"
                    </p>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-border-dark">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> +15 Tactical Score Boost
                  </span>

                  <button
                    onClick={() => onSelectStock(deal.symbol)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Inspect Stock</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
