import React, { useState, useEffect } from "react";
import {
  Search,
  Sun,
  Moon,
  SlidersHorizontal,
  Compass,
  Zap,
  LineChart,
  Radar,
  Calculator,
  Coins,
  Target,
  Layers,
  Sparkles
} from "lucide-react";
import type { NavPage } from "./Sidebar";

interface MacWindowTitlebarProps {
  activePage: NavPage;
  onOpenAi: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const PAGE_LABELS: Record<NavPage, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  overview: { label: "Overview & Derivatives PCR", icon: Compass },
  radar: { label: "Multi-Factor Radar & Insider Deals", icon: Radar },
  studio: { label: "Stock Studio & Quality Screener", icon: LineChart },
  intraday: { label: "Intraday MIS 5x Terminal", icon: Zap },
  simulator: { label: "Monte Carlo & Statutory Tax", icon: Calculator },
  dividend: { label: "Dividend Income Intelligence", icon: Coins },
  planner: { label: "Goal Planner & Actuarial SIP", icon: Target },
  portfolio: { label: "Demat Vault & Tactical Sprints", icon: Layers },
};

export const MacWindowTitlebar: React.FC<MacWindowTitlebarProps> = ({
  activePage,
  onOpenAi,
  onOpenSettings,
  isDarkMode,
  onToggleTheme,
}) => {
  const [timeString, setTimeString] = useState<string>("");
  const [isTrafficHovered, setIsTrafficHovered] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " IST"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const activeMeta = PAGE_LABELS[activePage] || { label: "Workstation", icon: Compass };
  const PageIcon = activeMeta.icon;

  return (
    <header className="h-10 px-3.5 bg-white/75 dark:bg-[#181920]/80 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between select-none relative z-30 transition-colors duration-200">
      {/* Left: macOS Traffic Lights & Title */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 pr-2"
          onMouseEnter={() => setIsTrafficHovered(true)}
          onMouseLeave={() => setIsTrafficHovered(false)}
        >
          {/* Close (Red) */}
          <button
            onClick={() => window.location.reload()}
            className="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-90 border border-black/10 flex items-center justify-center text-[8px] font-black text-black/60 transition-transform active:scale-90 cursor-pointer"
            title="Reload Workstation"
          >
            {isTrafficHovered && <span>×</span>}
          </button>

          {/* Minimize (Yellow) */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:brightness-90 border border-black/10 flex items-center justify-center text-[8px] font-black text-black/60 transition-transform active:scale-90 cursor-pointer"
            title="Scroll to Top"
          >
            {isTrafficHovered && <span>−</span>}
          </button>

          {/* Fullscreen (Green) */}
          <button
            onClick={toggleFullscreen}
            className="w-3 h-3 rounded-full bg-[#27C93F] hover:brightness-90 border border-black/10 flex items-center justify-center text-[7px] font-black text-black/60 transition-transform active:scale-90 cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isTrafficHovered && <span>+</span>}
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="h-3.5 w-px bg-black/10 dark:bg-white/10 hidden sm:block" />

        {/* Live NSE / BSE Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>NSE / BSE • Live Feed</span>
        </div>
      </div>

      {/* Center: Window Breadcrumb / Active Page */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          AlphaPulse
        </span>
        <span className="text-slate-400 dark:text-slate-600">/</span>
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <PageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-[11px] truncate max-w-[140px] sm:max-w-none">{activeMeta.label}</span>
        </div>
      </div>

      {/* Right: macOS Spotlight Trigger & System Status */}
      <div className="flex items-center gap-2">
        {/* Spotlight Trigger */}
        <button
          onClick={onOpenAi}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/[0.04] dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
          title="Search or Ask AI (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline text-[11px] font-medium">Search or Ask AI</span>
          <kbd className="text-[10px] font-mono px-1 rounded bg-black/[0.06] dark:bg-white/[0.08] text-slate-500 dark:text-slate-400 font-bold border border-black/5 dark:border-white/5">
            ⌘K
          </kbd>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Settings & System Diagnostics"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1 rounded-lg text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 pl-1">
          {timeString}
        </div>
      </div>
    </header>
  );
};
