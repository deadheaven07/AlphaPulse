import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchHealth,
  inspectPortfolioThreats,
  fetchDbWatchlist,
  addDbWatchlist,
  deleteDbWatchlist,
  createDbHolding,
  fetchDbHoldings,
  fetchStockQuote
} from "./services/api";
import type { SimulationResult, PortfolioAlert } from "./types";
import { ThreeBackground } from "./components/ThreeBackground";
import { Sidebar } from "./components/Sidebar";
import type { NavPage } from "./components/Sidebar";
import { MacWindowTitlebar } from "./components/MacWindowTitlebar";
import { AiAssistantPane } from "./components/AiAssistantPane";
import { TickerTape } from "./components/TickerTape";
import { AlertToastContainer } from "./components/AlertToastContainer";
import { SettingsModal } from "./components/SettingsModal";
import { SpacebarQuickLook } from "./components/SpacebarQuickLook";
import { BentoQuantDesk } from "./components/BentoQuantDesk";
import { TearSheetExportModal } from "./components/TearSheetExportModal";
import { useTactileAudio } from "./hooks/useTactileAudio";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useScroll3D } from "./hooks/useScroll3D";

// Focused Dedicated Pages
import { OverviewPage } from "./pages/OverviewPage";
import { RadarPage } from "./pages/RadarPage";
import { StockStudioPage } from "./pages/StockStudioPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { DividendPage } from "./pages/DividendPage";
import { GoalPlannerPage } from "./pages/GoalPlannerPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { IntradayTerminal } from "./components/IntradayTerminal";

export function App() {
  // Navigation State (8 focused pages)
  const [activePage, setActivePage] = useState<NavPage>("overview");

  // Selected Stock & Quantitative State
  const [selectedSymbol, setSelectedSymbol] = useState<string>("TATAMOTORS");
  const [simCapital, setSimCapital] = useState<number>(100000);
  const [simHorizon, setSimHorizon] = useState<number>(12);

  // View Mode: Focus Page vs. Bento Quant Desk
  const [isBentoMode, setIsBentoMode] = useState<boolean>(false);

  // Drawers & Modals
  const [isAiPaneOpen, setIsAiPaneOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQuickLookOpen, setIsQuickLookOpen] = useState<boolean>(false);
  const [isTearSheetOpen, setIsTearSheetOpen] = useState<boolean>(false);

  // Web Audio Synthesizer Hook
  const { isMuted, toggleMute, playClick, playChime, playVaultLock } = useTactileAudio();

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

  const toggleTheme = () => {
    playClick();
    setIsDarkMode((prev) => !prev);
  };

  // 3D Scroll & Shockwave Action Engine
  const scroll3D = useScroll3D();
  const [shockwaveTrigger, setShockwaveTrigger] = useState<{
    id: number;
    type: "buy" | "profit" | "warn" | "pulse";
    timestamp: number;
  } | null>(null);

  const trigger3DShockwave = (type: "buy" | "profit" | "warn" | "pulse") => {
    setShockwaveTrigger({ id: Date.now(), type, timestamp: Date.now() });
  };

  // Global Keyboard Shortcuts (Space, 1-8, Cmd+K, T)
  useKeyboardShortcuts({
    onSelectPage: (page) => {
      playClick();
      trigger3DShockwave("pulse");
      setActivePage(page);
    },
    onToggleTheme: toggleTheme,
    onToggleAi: () => {
      playClick();
      trigger3DShockwave("pulse");
      setIsAiPaneOpen((prev) => !prev);
    },
    onToggleQuickLook: () => {
      playClick();
      trigger3DShockwave("pulse");
      setIsQuickLookOpen((prev) => !prev);
    },
    isModalOpen: isAiPaneOpen || isSettingsOpen || isQuickLookOpen || isTearSheetOpen,
  });

  // Live Watchdog Alerts State
  const [activeAlerts, setActiveAlerts] = useState<PortfolioAlert[]>([]);

  // SQLite Persistent Holdings Query
  const { data: dbHoldings = [] } = useQuery({
    queryKey: ["db-holdings"],
    queryFn: fetchDbHoldings,
    refetchInterval: 20000,
  });

  // Active Symbol Quote for Tear-Sheet
  const { data: activeQuote } = useQuery({
    queryKey: ["app-active-quote", selectedSymbol],
    queryFn: () => fetchStockQuote(selectedSymbol),
    staleTime: 30000,
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
    playVaultLock();
    trigger3DShockwave("profit");
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
    playClick();
    trigger3DShockwave("buy");
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
    playClick();
    setSelectedSymbol(symbol);
    if (budget) setSimCapital(budget);
    if (horizon) setSimHorizon(horizon);
  };

  return (
    <div className="flex h-screen bg-canvas dark:bg-canvas-dark text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">
      {/* 3D Background Canvas with Hardware-Accelerated WebGL Engine */}
      <ThreeBackground
        isDarkMode={isDarkMode}
        scrollProgress={scroll3D.scrollProgress}
        shockwaveTrigger={shockwaveTrigger}
      />

      {/* Modern Left Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={(page) => {
          playClick();
          trigger3DShockwave("pulse");
          setActivePage(page);
        }}
        onOpenAiPane={() => {
          playClick();
          setIsAiPaneOpen(true);
        }}
        onOpenSettings={() => {
          playClick();
          setIsSettingsOpen(true);
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        vaultCount={dbHoldings.length}
      />

      {/* Interactive Left AI Assistant Chat Pane */}
      <AiAssistantPane
        isOpen={isAiPaneOpen}
        onClose={() => setIsAiPaneOpen(false)}
        currentPage={activePage}
        activeSymbol={selectedSymbol}
        simCapital={simCapital}
        simHorizon={simHorizon}
        onSelectStock={(sym, cap, horiz) => {
          handleSelectStock(sym, cap, horiz);
          setActivePage("studio");
          setIsAiPaneOpen(false);
        }}
        onNavigateToSimulator={(sym, cap, horiz) => {
          handleSelectStock(sym, cap, horiz);
          setActivePage("simulator");
          setIsAiPaneOpen(false);
        }}
        onNavigateToIntraday={() => {
          playClick();
          setActivePage("intraday");
          setIsAiPaneOpen(false);
        }}
        onCapitalChange={(cap) => setSimCapital(cap)}
        geminiConfigured={Boolean(health?.gemini_api_configured)}
      />

      {/* Main Content Viewport (Scrolls independently, renders single focused page or Bento Grid) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
        {/* macOS Desktop-Class Titlebar */}
        <MacWindowTitlebar
          activePage={activePage}
          onOpenAi={() => {
            playClick();
            setIsAiPaneOpen(true);
          }}
          onOpenSettings={() => {
            playClick();
            setIsSettingsOpen(true);
          }}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          isBentoMode={isBentoMode}
          onToggleBentoMode={() => {
            playClick();
            setIsBentoMode((prev) => !prev);
          }}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onOpenQuickLook={() => {
            playClick();
            setIsQuickLookOpen(true);
          }}
        />

        {/* Infinite Live Ticker Tape */}
        <TickerTape
          onSelectSymbol={(sym) => {
            playClick();
            setSelectedSymbol(sym);
            setActivePage("studio");
          }}
        />

        {/* Page Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl 3xl:max-w-[1900px] ultrawide:max-w-[2400px] w-full mx-auto space-y-6">
          {isBentoMode ? (
            <BentoQuantDesk
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => {
                playClick();
                setSelectedSymbol(sym);
              }}
              capital={simCapital}
              horizon={simHorizon}
              isWatchlisted={watchlist.includes(selectedSymbol)}
              onToggleWatchlist={handleToggleWatchlist}
              onSaveSimulation={handleSaveSimulation}
              onNavigateToSimulator={() => setActivePage("simulator")}
            />
          ) : (
            <>
              {activePage === "overview" && (
                <OverviewPage
                  onSelectStock={(sym) => {
                    handleSelectStock(sym);
                    setActivePage("studio");
                  }}
                  onNavigate={(page) => {
                    playClick();
                    setActivePage(page);
                  }}
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

              {activePage === "intraday" && (
                <IntradayTerminal
                  onSelectStock={(sym) => {
                    handleSelectStock(sym);
                    setActivePage("studio");
                  }}
                  defaultCapital={simCapital}
                />
              )}

              {activePage === "studio" && (
                <StockStudioPage
                  symbol={selectedSymbol}
                  onSelectSymbol={(sym) => {
                    playClick();
                    setSelectedSymbol(sym);
                  }}
                  isWatchlisted={watchlist.includes(selectedSymbol)}
                  onToggleWatchlist={handleToggleWatchlist}
                  onNavigateToSimulator={() => {
                    playClick();
                    setActivePage("simulator");
                  }}
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
                  onSelectStock={(sym) => {
                    handleSelectStock(sym);
                  }}
                />
              )}

              {activePage === "planner" && (
                <GoalPlannerPage
                  onNavigateToStudio={(sym: string) => {
                    handleSelectStock(sym);
                    setActivePage("studio");
                  }}
                />
              )}

              {activePage === "portfolio" && (
                <PortfolioPage
                  onSelectStock={(sym) => {
                    handleSelectStock(sym);
                    setActivePage("studio");
                  }}
                  onNavigateToStudio={() => {
                    playClick();
                    setActivePage("studio");
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Sub-Footer */}
        <footer className="mt-auto border-t border-border/80 dark:border-border-dark bg-white/70 dark:bg-surface-dark/80 backdrop-blur-md py-4 px-6 transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted dark:text-muted-dark">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 dark:text-white">AlphaPulse India Pro</span>
              <span>•</span>
              <span>Dedicated Focused Workstation & Bento Quant Desk</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playChime();
                  setIsTearSheetOpen(true);
                }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                📄 Export Institutional Tear-Sheet ({selectedSymbol})
              </button>
              <span>•</span>
              <span>Current Statutory Tax Regime (STCG 20% & LTCG 12.5%) Compliant</span>
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
          handleSelectStock(sym);
          setActivePage("studio");
        }}
      />

      {/* macOS Spacebar QuickLook Floating HUD Modal */}
      <SpacebarQuickLook
        isOpen={isQuickLookOpen}
        onClose={() => setIsQuickLookOpen(false)}
        symbol={selectedSymbol}
        onNavigateToStudio={(sym) => {
          handleSelectStock(sym);
          setActivePage("studio");
        }}
        onNavigateToSimulator={(sym) => {
          handleSelectStock(sym);
          setActivePage("simulator");
        }}
        isWatchlisted={watchlist.includes(selectedSymbol)}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* Institutional Research Tear-Sheet Memo Exporter Modal */}
      <TearSheetExportModal
        isOpen={isTearSheetOpen}
        onClose={() => setIsTearSheetOpen(false)}
        symbol={selectedSymbol}
        companyName={activeQuote?.company_name || `${selectedSymbol} Enterprises`}
        currentPrice={activeQuote?.price || 4856.0}
        sector={activeQuote?.sector || "Capital Goods & Defense"}
        capital={simCapital}
        horizonMonths={simHorizon}
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
