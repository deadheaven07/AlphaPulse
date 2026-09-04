import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketStatus, getCustomApiKey } from "../services/api";
import { formatINR, formatPct } from "../utils/formatters";
import { AlphaLogo } from "./AlphaLogo";
import {
  Activity,
  Settings,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Sun,
  Moon
} from "lucide-react";

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenVault: () => void;
  vaultCount: number;
  geminiConfigured: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenVault,
  vaultCount,
  geminiConfigured,
  isDarkMode,
  onToggleTheme,
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
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-b border-border dark:border-border-dark shadow-soft transition-colors duration-300">
      <div className="max-w-7xl 3xl:max-w-[1900px] ultrawide:max-w-[2400px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Redesigned Luxury Brand Logo */}
          <AlphaLogo size="md" showText={true} className="shrink-0" />

          {/* Center Market & Institutional Sentiment */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            {/* Market Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  market?.market_status === "MARKET OPEN"
                    ? "bg-emerald-500 animate-ping"
                    : "bg-emerald-500"
                }`}
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {market?.market_status || "NSE LIVE"}
              </span>
            </div>

            {/* Nifty 50 Quote */}
            {market && (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-500 dark:text-muted-dark">NIFTY 50:</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">
                  {formatINR(market.nifty_50_level)}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                    isNiftyPos
                      ? "bg-profit-50 dark:bg-profit-950/80 text-profit-700 dark:text-profit-400 border border-profit-200 dark:border-profit-800"
                      : "bg-risk-50 dark:bg-risk-950/80 text-risk-700 dark:text-risk-400 border border-risk-200 dark:border-risk-800"
                  }`}
                >
                  {isNiftyPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatPct(market.nifty_change_pct)}
                </span>
              </div>
            )}

            {/* FII / DII Flow Sentiment */}
            {market && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-canvas-dark border border-slate-200 dark:border-border-dark text-[11px] font-medium text-slate-700 dark:text-slate-300">
                <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Inst. Flow:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  +₹{(market.total_institutional_flow_cr).toFixed(0)} Cr
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                    market.sentiment === "BULLISH"
                      ? "bg-profit-100 dark:bg-profit-900/60 text-profit-800 dark:text-profit-300"
                      : "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {market.sentiment}
                </span>
              </div>
            )}
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Dark / Light Mode Switcher */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle Dark/Light Mode"
              title={isDarkMode ? "Switch to Crisp Light Mode" : "Switch to Soothing Warm Charcoal Dark Mode"}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-canvas-dark text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-elevated transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* AI Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
                isAiActive
                  ? "bg-profit-50 dark:bg-profit-950/60 text-profit-700 dark:text-profit-400 border-profit-200 dark:border-profit-800"
                  : "bg-slate-50 dark:bg-canvas-dark text-slate-600 dark:text-muted-dark border-slate-200 dark:border-border-dark"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiActive ? "text-profit-600 dark:text-profit-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline font-mono text-[11px]">
                {isAiActive ? "Gemini Grounded" : "AI Offline"}
              </span>
            </div>

            {/* My Portfolio & Strategy Vault Button */}
            <button
              onClick={onOpenVault}
              className="relative p-2 sm:px-3.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer group"
            >
              <Briefcase className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">My Portfolio</span>
              {vaultCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 dark:bg-slate-900 text-white dark:text-emerald-300 text-[10px] font-mono font-bold">
                  {vaultCount}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              aria-label="Open Settings"
              className="p-2 rounded-xl border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-canvas-dark transition-colors cursor-pointer"
              title="API Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
