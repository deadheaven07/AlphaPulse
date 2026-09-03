import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketStatus, getCustomApiKey } from "../services/api";
import { formatINR, formatPct } from "../utils/formatters";
import { Activity, Settings, Sparkles, TrendingUp, TrendingDown, Layers, BookmarkCheck } from "lucide-react";

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenVault: () => void;
  vaultCount: number;
  geminiConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenVault,
  vaultCount,
  geminiConfigured,
}) => {
  const { data: market } = useQuery({
    queryKey: ["market-status"],
    queryFn: fetchMarketStatus,
    refetchInterval: 30000,
  });

  const hasCustomKey = Boolean(getCustomApiKey());
  const isAiActive = geminiConfigured || hasCustomKey;

  const isNiftyPos = (market?.nifty_change_pct ?? 0) >= 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 font-sans">
                  Alpha<span className="text-brand-600">Pulse</span> India
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-brand-50 text-brand-700 border border-brand-100">
                  NSE/BSE Quant
                </span>
              </div>
              <p className="text-[11px] text-muted -mt-0.5 font-medium">
                Equity Intelligence & Profit Simulator
              </p>
            </div>
          </div>

          {/* Center Market & Institutional Sentiment */}
          <div className="hidden md:flex items-center gap-4">
            {/* Market Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  market?.market_status === "MARKET OPEN"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              />
              <span className="font-bold text-slate-700">{market?.market_status || "NSE LIVE"}</span>
            </div>

            {/* Nifty 50 Quote */}
            {market && (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-500">NIFTY 50:</span>
                <span className="font-mono text-slate-900 font-bold">
                  {formatINR(market.nifty_50_level)}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                    isNiftyPos
                      ? "bg-profit-50 text-profit-700 border border-profit-100"
                      : "bg-risk-50 text-risk-700 border border-risk-100"
                  }`}
                >
                  {isNiftyPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatPct(market.nifty_change_pct)}
                </span>
              </div>
            )}

            {/* FII / DII Flow Sentiment */}
            {market && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                <Activity className="w-3.5 h-3.5 text-brand-600" />
                <span>Inst. Flow:</span>
                <span className="font-bold text-slate-900 font-mono">
                  +₹{(market.total_institutional_flow_cr).toFixed(0)} Cr
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                    market.sentiment === "BULLISH"
                      ? "bg-profit-100 text-profit-800"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {market.sentiment}
                </span>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Strategy Vault Button */}
            <button
              onClick={onOpenVault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-all shadow-xs"
            >
              <BookmarkCheck className="w-4 h-4 text-brand-600" />
              <span className="hidden sm:inline">Vault</span>
              {vaultCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-brand-600 text-white text-[10px] font-mono">
                  {vaultCount}
                </span>
              )}
            </button>

            {/* Gemini Status Pill */}
            <div
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
                isAiActive
                  ? "bg-profit-50 text-profit-700 border-profit-200 hover:bg-profit-100"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
              title="Click to configure Gemini API Key"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiActive ? "text-emerald-600" : "text-amber-500"}`} />
              <span className="text-[11px] font-bold">
                {isAiActive ? "Gemini Active" : "Quant Engine"}
              </span>
            </div>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-border transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
