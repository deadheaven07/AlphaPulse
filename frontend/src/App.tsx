import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchHealth,
  inspectPortfolioThreats,
  fetchDbWatchlist,
  addDbWatchlist,
  deleteDbWatchlist,
  createDbHolding,
  fetchDbHoldings
} from "./services/api";
import type { SimulationResult, PortfolioAlert } from "./types";
import { ThreeBackground } from "./components/ThreeBackground";
import { Sidebar } from "./components/Sidebar";
import type { NavPage } from "./components/Sidebar";
import { AiAssistantPane } from "./components/AiAssistantPane";
import { TickerTape } from "./components/TickerTape";
import { AlertToastContainer } from "./components/AlertToastContainer";
import { SettingsModal } from "./components/SettingsModal";

// Focused Dedicated Pages
import { OverviewPage } from "./pages/OverviewPage";
import { RadarPage } from "./pages/RadarPage";
import { StockStudioPage } from "./pages/StockStudioPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { DividendPage } from "./pages/DividendPage";
import { GoalPlannerPage } from "./pages/GoalPlannerPage";
import { PortfolioPage } from "./pages/PortfolioPage";

export function App() {
  // Navigation State (6 focused pages)
  const [activePage, setActivePage] = useState<NavPage>("overview");

  // Selected Stock & Quantitative State
  const [selectedSymbol, setSelectedSymbol] = useState<string>("TATAMOTORS");
  const [simCapital, setSimCapital] = useState<number>(100000);
  const [simHorizon, setSimHorizon] = useState<number>(12);

  // Drawers & Modals
  const [isAiPaneOpen, setIsAiPaneOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Dark / Light Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("alphapulse_theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("alphapulse_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("alphapulse_theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Live Watchdog Alerts State
  const [activeAlerts, setActiveAlerts] = useState<PortfolioAlert[]>([]);

  // SQLite Persistent Holdings Query
  const { data: dbHoldings = [] } = useQuery({
    queryKey: ["db-holdings"],
    queryFn: fetchDbHoldings,
    refetchInterval: 20000,
  });

  // Watchlist in SQLite / LocalStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("alphapulse_watchlist");
      return stored ? JSON.parse(stored) : ["TATAMOTORS", "RELIANCE", "BEL", "COALINDIA"];
    } catch {
      return ["TATAMOTORS", "RELIANCE", "BEL", "COALINDIA"];
    }
  });

  // Sync SQLite Watchlist on startup
  useEffect(() => {
    fetchDbWatchlist()
      .then((dbList) => {
        if (dbList && dbList.length > 0) {
          setWatchlist(dbList);
        }
      })
      .catch(() => {});
  }, []);

  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  // 24/7 Continuous Live Portfolio & Threat Watchdog
  useEffect(() => {
    if (!dbHoldings || dbHoldings.length === 0) return;

    const runWatchdog = async () => {
      try {
        const threats = await inspectPortfolioThreats(dbHoldings);
        if (threats && threats.length > 0) {
          setActiveAlerts((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newOnes = threats.filter((t) => !existingIds.has(t.id));
            return [...newOnes, ...prev].slice(0, 5); // Keep latest 5
          });
        }
      } catch {
        // Background fail safe
      }
    };

    runWatchdog();
    const interval = setInterval(runWatchdog, 25000); // 25 seconds polling
    return () => clearInterval(interval);
  }, [dbHoldings]);

  const handleSaveSimulation = (sim: SimulationResult) => {
    // Persist holding into SQLite database
    createDbHolding({
      symbol: sim.symbol,
      company_name: sim.company_name,
      entry_price: sim.current_price,
      shares: sim.shares,
      target_price: sim.bull_case.target_price,
      stop_loss: sim.bear_case.target_price
    }).catch(() => {});
  };

  const handleToggleWatchlist = (symbol: string) => {
    setWatchlist((prev) => {
      let updated: string[];
      if (prev.includes(symbol)) {
        updated = prev.filter((s) => s !== symbol);
        deleteDbWatchlist(symbol).catch(() => {});
      } else {
        updated = [...prev, symbol];
        addDbWatchlist(symbol).catch(() => {});
      }
      localStorage.setItem("alphapulse_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectStock = (symbol: string, budget?: number, horizon?: number) => {
    setSelectedSymbol(symbol);
    if (budget) setSimCapital(budget);
    if (horizon) setSimHorizon(horizon);
  };

  return (
    <div className="flex h-screen bg-canvas dark:bg-canvas-dark text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">
      {/* 3D Background Canvas with Visibility Optimization */}
      <ThreeBackground isDarkMode={isDarkMode} />

      {/* Modern Left Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        onOpenAiPane={() => setIsAiPaneOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        vaultCount={dbHoldings.length}
      />

      {/* Interactive Left AI Assistant Chat Pane */}
      <AiAssistantPane
        isOpen={isAiPaneOpen}
        onClose={() => setIsAiPaneOpen(false)}
        onSelectStock={(sym, cap, horiz) => {
          handleSelectStock(sym, cap, horiz);
          setActivePage("studio");
          setIsAiPaneOpen(false);
        }}
        geminiConfigured={Boolean(health?.gemini_api_configured)}
      />

      {/* Main Content Viewport (Scrolls independently, renders single focused page) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
        {/* Infinite Live Ticker Tape */}
        <TickerTape
          onSelectSymbol={(sym) => {
            setSelectedSymbol(sym);
            setActivePage("studio");
          }}
        />

        {/* Page Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl 3xl:max-w-[1900px] ultrawide:max-w-[2400px] w-full mx-auto space-y-6">
          {activePage === "overview" && (
            <OverviewPage
              onSelectStock={(sym) => {
                setSelectedSymbol(sym);
                setActivePage("studio");
              }}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {activePage === "radar" && (
            <RadarPage
              onSelectStock={(sym, bgt) => {
                handleSelectStock(sym, bgt);
                setActivePage("studio");
              }}
              capital={simCapital}
              onCapitalChange={setSimCapital}
            />
          )}

          {activePage === "studio" && (
            <StockStudioPage
              symbol={selectedSymbol}
              onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              isWatchlisted={watchlist.includes(selectedSymbol)}
              onToggleWatchlist={handleToggleWatchlist}
              onNavigateToSimulator={() => setActivePage("simulator")}
            />
          )}

          {activePage === "simulator" && (
            <SimulatorPage
              symbol={selectedSymbol}
              capital={simCapital}
              horizon={simHorizon}
              onSaveSimulation={handleSaveSimulation}
            />
          )}

          {activePage === "dividend" && (
            <DividendPage
              symbol={selectedSymbol}
              onSelectStock={(sym) => setSelectedSymbol(sym)}
            />
          )}

          {activePage === "planner" && (
            <GoalPlannerPage
              onNavigateToStudio={(sym: string) => {
                setSelectedSymbol(sym);
                setActivePage("studio");
              }}
            />
          )}

          {activePage === "portfolio" && (
            <PortfolioPage
              onSelectStock={(sym) => {
                setSelectedSymbol(sym);
                setActivePage("studio");
              }}
              onNavigateToStudio={() => setActivePage("studio")}
            />
          )}
        </div>

        {/* Sub-Footer */}
        <footer className="mt-auto border-t border-border/80 dark:border-border-dark bg-white/70 dark:bg-surface-dark/80 backdrop-blur-md py-4 px-6 transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted dark:text-muted-dark">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 dark:text-white">AlphaPulse India Pro</span>
              <span>•</span>
              <span>Dedicated Focused Workstation</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Budget 2024 STCG 20% & LTCG 12.5% Tax Compliant</span>
              <span>•</span>
              <span>SQLite Persistent Vault</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Floating Animated Audio Toaster Alerts */}
      <AlertToastContainer
        alerts={activeAlerts}
        onDismiss={(id) => setActiveAlerts((prev) => prev.filter((a) => a.id !== id))}
        onSelectSymbol={(sym) => {
          setSelectedSymbol(sym);
          setActivePage("studio");
        }}
      />

      {/* Settings & System Diagnostics Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => refetchHealth()}
      />
    </div>
  );
}

export default App;
