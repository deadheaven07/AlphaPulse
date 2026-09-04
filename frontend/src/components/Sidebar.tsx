import React, { useState } from "react";
import { AlphaLogo } from "./AlphaLogo";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketStatus } from "../services/api";
import {
  LayoutDashboard,
  Radar,
  LineChart,
  Calculator,
  Coins,
  Target,
  Briefcase,
  Sparkles,
  Sun,
  Moon,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export type NavPage = "overview" | "radar" | "studio" | "simulator" | "dividend" | "planner" | "portfolio";

interface SidebarProps {
  activePage: NavPage;
  onSelectPage: (page: NavPage) => void;
  onOpenAiPane: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  vaultCount?: number;
}

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Market pulse, indices & portfolio snapshot"
  },
  {
    id: "radar",
    label: "Radar & Screener",
    icon: Radar,
    description: "5-factor leaders & sub-₹150 turnarounds"
  },
  {
    id: "studio",
    label: "Stock Studio",
    icon: LineChart,
    description: "Live charts, technicals, quality & RRG"
  },
  {
    id: "simulator",
    label: "Profit Simulator",
    icon: Calculator,
    description: "Monte Carlo & Statutory Tax Engine"
  },
  {
    id: "dividend",
    label: "Dividend Income",
    icon: Coins,
    description: "High-yield timings & bank cash flow"
  },
  {
    id: "planner",
    label: "Goal Planner",
    icon: Target,
    description: "Milestone targets, risk radar & live news"
  },
  {
    id: "portfolio",
    label: "Portfolio Vault",
    icon: Briefcase,
    description: "Persistent SQLite holdings & threat watchdog"
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  onOpenAiPane,
  onOpenSettings,
  isDarkMode,
  onToggleTheme,
  vaultCount = 0
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: marketStatus } = useQuery({
    queryKey: ["market-status"],
    queryFn: fetchMarketStatus,
    refetchInterval: 60000,
  });

  const isOpen = marketStatus?.market_status?.includes("OPEN") ?? false;

  return (
    <aside
      className={`relative z-20 flex flex-col justify-between h-full bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-r border-border dark:border-border-dark transition-all duration-300 select-none shadow-soft ${
        isCollapsed ? "w-20" : "w-64 sm:w-72"
      }`}
    >
      {/* Top Header & Brand */}
      <div className="p-4 border-b border-border/80 dark:border-border-dark flex items-center justify-between">
        <div
          onClick={() => onSelectPage("overview")}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
        >
          <AlphaLogo size="md" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  AlphaPulse
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                  PRO 3D
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOpen ? "bg-emerald-500 animate-ping" : "bg-slate-400 dark:bg-slate-500"
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-500 dark:text-muted-dark uppercase tracking-wider">
                  {isOpen ? "NSE Open" : "NSE Closed"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors cursor-pointer hidden md:flex items-center justify-center"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* AI Assistant Glowing Drawer Trigger */}
      <div className="p-3">
        <button
          onClick={onOpenAiPane}
          className={`w-full group relative overflow-hidden rounded-xl p-2.5 transition-all duration-300 cursor-pointer shadow-soft hover:shadow-hover dark:hover:shadow-hover-dark ${
            isCollapsed
              ? "flex items-center justify-center bg-gradient-to-r from-emerald-600 to-amber-600 text-white"
              : "bg-gradient-to-r from-emerald-600/90 via-emerald-700/90 to-amber-600/90 hover:from-emerald-600 hover:to-amber-600 text-white"
          }`}
          title="Ask Alpha AI Analyst"
        >
          <div className="flex items-center justify-center gap-2 relative z-10">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            {!isCollapsed && (
              <div className="text-left flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-xs tracking-tight flex items-center gap-1">
                    <span>Ask Alpha AI</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white font-mono">Gemini</span>
                  </div>
                  <div className="text-[10px] text-emerald-100 truncate opacity-90">
                    Instant conversational copilot
                  </div>
                </div>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/25 text-white text-[9px] font-mono font-bold">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-soft font-bold"
                  : "text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated hover:text-slate-900 dark:hover:text-white font-medium"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-emerald-400 dark:text-white" : "text-slate-500 dark:text-muted-dark"
                }`}
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-xs sm:text-sm font-extrabold block truncate">{item.label}</span>
                    <span className={`text-[10px] truncate block opacity-75 ${isActive ? "text-slate-300 dark:text-emerald-100" : "text-muted dark:text-muted-dark"}`}>
                      {item.description}
                    </span>
                  </div>
                  {item.id === "portfolio" && vaultCount > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      {vaultCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-border/80 dark:border-border-dark space-y-2">
        <div className={`flex items-center ${isCollapsed ? "flex-col gap-2" : "justify-between"} gap-1.5`}>
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-2"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Soothing Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
            {!isCollapsed && (
              <span className="text-xs font-bold">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            aria-label="Open Settings"
            className="p-2 rounded-xl text-slate-600 dark:text-muted-dark hover:bg-slate-100 dark:hover:bg-surface-elevated hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-2"
            title="Settings & Diagnostics"
          >
            <Settings className="w-4 h-4" />
            {!isCollapsed && <span className="text-xs font-bold">Settings</span>}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-canvas-dark border border-slate-200/60 dark:border-border-dark flex items-center justify-between text-[10px] text-muted dark:text-muted-dark">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Statutory STT & Tax
            </span>
            <span className="font-mono font-bold">v2.2 Pro</span>
          </div>
        )}
      </div>
    </aside>
  );
};
