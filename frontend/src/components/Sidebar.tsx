import React, { useState } from "react";
import { AlphaLogo } from "./AlphaLogo";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketStatus } from "../services/api";
import {
  Compass,
  Radar,
  LineChart,
  Calculator,
  Coins,
  Target,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";

export type NavPage = "overview" | "radar" | "studio" | "intraday" | "simulator" | "dividend" | "planner" | "portfolio";

interface SidebarProps {
  activePage: NavPage;
  onSelectPage: (page: NavPage) => void;
  onOpenAiPane: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  vaultCount?: number;
}

interface NavSection {
  title: string;
  items: {
    id: NavPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    badge?: string;
  }[];
}

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

  const SECTIONS: NavSection[] = [
    {
      title: "Workspaces",
      items: [
        {
          id: "overview",
          label: "Overview",
          icon: Compass,
          description: "Market pulse, indices & option chain PCR"
        },
        {
          id: "radar",
          label: "Radar & Screener",
          icon: Radar,
          description: "5-factor leaders & insider deals"
        },
        {
          id: "studio",
          label: "Stock Studio",
          icon: LineChart,
          description: "Candlesticks, quality & sector RRG"
        },
        {
          id: "intraday",
          label: "Intraday Terminal",
          icon: Zap,
          description: "15M ORB, live VWAP & 5x MIS leverage",
          badge: "5x MIS"
        }
      ]
    },
    {
      title: "Quantitative Lab",
      items: [
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
          description: "Milestone targets, risk radar & SIP"
        }
      ]
    },
    {
      title: "Account & Vault",
      items: [
        {
          id: "portfolio",
          label: "Demat Vault",
          icon: Layers,
          description: "Persistent holdings & active sprints",
          badge: vaultCount > 0 ? String(vaultCount) : undefined
        }
      ]
    }
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col justify-between h-full bg-slate-50/75 dark:bg-[#15161C]/80 backdrop-blur-2xl border-r border-black/[0.06] dark:border-white/[0.08] transition-all duration-300 select-none shadow-soft ${
        isCollapsed ? "w-20" : "w-64 sm:w-72"
      }`}
    >
      {/* Top Header & Brand */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
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
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  PRO
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
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer hidden md:flex items-center justify-center"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups (macOS Sidebar Categorization) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Spotlight AI Assistant Trigger */}
        <div>
          <button
            onClick={onOpenAiPane}
            className={`w-full p-2.5 rounded-xl text-left transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-xs border ${
              !isCollapsed
                ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-amber-950/40 border-emerald-500/30 hover:border-emerald-500/50"
                : "bg-emerald-500/10 border-emerald-500/20 justify-center"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">Ask Alpha AI</span>
                    <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      GURU
                    </span>
                  </div>
                  <span className="text-[10px] text-muted dark:text-muted-dark truncate">Tactical trades & budget allocator</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-surface-elevated/80 border border-black/[0.08] dark:border-white/[0.1] rounded-md shadow-2xs">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        {/* Grouped Nav Items */}
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full p-2 rounded-xl text-left transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-[#22232B] text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:border-white/[0.08]"
                      : "text-slate-600 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-semibold truncate ${isActive ? "text-slate-900 dark:text-white font-bold" : ""}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-muted dark:text-muted-dark truncate max-w-[170px]">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2 bg-slate-50/50 dark:bg-[#15161C]/50">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSettings}
            className="flex-1 p-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Settings & System Diagnostics"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            {!isCollapsed && <span>Settings</span>}
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors flex items-center justify-center cursor-pointer"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-2 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between text-[10px] text-muted dark:text-muted-dark">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Statutory STT & Tax
            </span>
            <span className="font-mono font-bold">v2.3 macOS</span>
          </div>
        )}
      </div>
    </aside>
  );
};
