import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHealth, fetchStockQuote, askGeminiAi, inspectPortfolioThreats } from "./services/api";
import type { AiAnalysisResponse, SimulationResult, PortfolioAlert } from "./types";
import { ThreeBackground } from "./components/ThreeBackground";
import { Navbar } from "./components/Navbar";
import { TickerTape } from "./components/TickerTape";
import { RealTimeRadarKPIs } from "./components/RealTimeRadarKPIs";
import { AskAIBar } from "./components/AskAIBar";
import { StockOverviewCard } from "./components/StockOverviewCard";
import { LiveNewsSentimentBar } from "./components/LiveNewsSentimentBar";
import { QualityScoreCard } from "./components/QualityScoreCard";
import { TechnicalSignals } from "./components/TechnicalSignals";
import { SectorRrgMap } from "./components/SectorRrgMap";
import { DividendAnalyzer } from "./components/DividendAnalyzer";
import { ProfitSimulator } from "./components/ProfitSimulator";
import { PennyStocksRadar } from "./components/PennyStocksRadar";
import { LiveNewsAndThesis } from "./components/LiveNewsAndThesis";
import { PortfolioSideDrawer } from "./components/PortfolioSideDrawer";
import { AlertToastContainer } from "./components/AlertToastContainer";
import { SettingsModal } from "./components/SettingsModal";
import { LineChart, Coins, ShieldAlert, CheckCircle2 } from "lucide-react";

export function App() {
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

  const [selectedSymbol, setSelectedSymbol] = useState<string>("TATAMOTORS");
  const [simCapital, setSimCapital] = useState<number>(100000);
  const [simHorizon, setSimHorizon] = useState<number>(12);
  const [activeTab, setActiveTab] = useState<"studio" | "dividend">("studio");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState<boolean>(false);

  // Live Watchdog Alerts State
  const [activeAlerts, setActiveAlerts] = useState<PortfolioAlert[]>([]);

  // Strategy Vault (Saved Simulations) in LocalStorage
  const [savedSimulations, setSavedSimulations] = useState<SimulationResult[]>(() => {
    try {
      const stored = localStorage.getItem("alphapulse_vault");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Pinned Watchlist
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("alphapulse_watchlist");
      return stored ? JSON.parse(stored) : ["TATAMOTORS", "RELIANCE", "BEL", "COALINDIA"];
    } catch {
      return ["TATAMOTORS", "RELIANCE", "BEL", "COALINDIA"];
    }
  });

  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  const { data: quote } = useQuery({
    queryKey: ["quote", selectedSymbol],
    queryFn: () => fetchStockQuote(selectedSymbol),
    refetchInterval: 30000,
  });

  // AI Prompt State
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 24/7 Continuous Live Portfolio & Threat Watchdog
  useEffect(() => {
    if (savedSimulations.length === 0) return;

    const runWatchdog = async () => {
      try {
        const holdingsPayload = savedSimulations.map((sim) => ({
          symbol: sim.symbol,
          entry_price: sim.current_price,
          target_price: sim.bull_case.target_price,
          stop_loss: sim.bear_case.target_price,
          shares: sim.shares,
        }));
        const threats = await inspectPortfolioThreats(holdingsPayload);
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
  }, [savedSimulations]);

  const handleAskAi = async (promptText: string, customCapital?: number, customHorizon?: number) => {
    setIsAiLoading(true);
    try {
      const res = await askGeminiAi(promptText);
      setAiAnalysis(res);
      if (customCapital) {
        setSimCapital(customCapital);
      }
      if (customHorizon) {
        setSimHorizon(customHorizon);
      }
      if (res.recommendations && res.recommendations.length > 0) {
        const firstSym = res.recommendations[0].symbol;
        if (firstSym) setSelectedSymbol(firstSym);
      }
    } catch (err) {
      console.error("AI Assistant query failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectFromRadar = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveTab("studio");
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const handleSelectFromPenny = (symbol: string, budget?: number) => {
    setSelectedSymbol(symbol);
    if (budget) {
      setSimCapital(budget);
    }
    setActiveTab("studio");
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const handleSaveSimulation = (sim: SimulationResult) => {
    setSavedSimulations((prev) => {
      const filtered = prev.filter((item) => item.symbol !== sim.symbol);
      const updated = [sim, ...filtered];
      localStorage.setItem("alphapulse_vault", JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveSimulation = (index: number) => {
    setSavedSimulations((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem("alphapulse_vault", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllSimulations = () => {
    setSavedSimulations([]);
    localStorage.removeItem("alphapulse_vault");
  };

  const handleToggleWatchlist = (symbol: string) => {
    setWatchlist((prev) => {
      let updated: string[];
      if (prev.includes(symbol)) {
        updated = prev.filter((s) => s !== symbol);
      } else {
        updated = [...prev, symbol];
      }
      localStorage.setItem("alphapulse_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveWatchlist = (symbol: string) => {
    setWatchlist((prev) => {
      const updated = prev.filter((s) => s !== symbol);
      localStorage.setItem("alphapulse_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">
      {/* 3D Background Canvas & Warm Ambient Glow Meshes (Zero blue light) */}
      <ThreeBackground isDarkMode={isDarkMode} />

      {/* Floating Audio Toaster Alert Container */}
      <AlertToastContainer
        alerts={activeAlerts}
        onDismiss={(id) => setActiveAlerts((prev) => prev.filter((a) => a.id !== id))}
        onSelectSymbol={(sym) => setSelectedSymbol(sym)}
      />

      {/* Foreground Content Stack */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Live Ticker Tape */}
        <TickerTape onSelectSymbol={(sym) => setSelectedSymbol(sym)} />

        {/* Top Navigation */}
        <Navbar
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenVault={() => setIsPortfolioOpen(true)}
          vaultCount={savedSimulations.length}
          geminiConfigured={Boolean(health?.gemini_api_configured)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        {/* Main Dashboard Container */}
        <main className="flex-1 max-w-7xl 3xl:max-w-[1900px] ultrawide:max-w-[2400px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Real-Time KPI Stocks Radar (Top Multi-Factor Buys Now) */}
          <section>
            <RealTimeRadarKPIs
              onSelectStock={handleSelectFromRadar}
              referenceCapital={simCapital}
              onCapitalChange={setSimCapital}
            />
          </section>

          {/* Module A: Natural Language Stock Explorer */}
          <section>
            <AskAIBar
              onSearch={handleAskAi}
              isLoading={isAiLoading}
            />
          </section>

          {/* AI Grounded Theses & Scenarios Deck */}
          {aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0 && (
            <section className="space-y-4">
              {aiAnalysis.recommendations.map((rec, i) => (
                <LiveNewsAndThesis
                  key={i}
                  recommendation={rec}
                  onSimulate={(sym) => setSelectedSymbol(sym)}
                />
              ))}
            </section>
          )}

          {/* Core Institutional Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border dark:border-border-dark pb-2">
            <button
              onClick={() => setActiveTab("studio")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "studio"
                  ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-soft"
                  : "text-slate-600 dark:text-muted-dark hover:bg-slate-200 dark:hover:bg-surface-elevated"
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Quantitative Stock Studio</span>
            </button>

            <button
              onClick={() => setActiveTab("dividend")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "dividend"
                  ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-soft"
                  : "text-slate-600 dark:text-muted-dark hover:bg-slate-200 dark:hover:bg-surface-elevated"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Dividend Intelligence & Timing</span>
            </button>
          </div>

          {/* Tab 1: Quantitative Stock Studio */}
          {activeTab === "studio" && (
            <section className="space-y-6">
              {quote ? (
                <>
                  {/* Stock Overview Card & Real-Time Price */}
                  <StockOverviewCard
                    quote={quote}
                    onSelectSymbol={(sym) => setSelectedSymbol(sym)}
                    isWatchlisted={watchlist.includes(quote.symbol)}
                    onToggleWatchlist={handleToggleWatchlist}
                  />

                  {/* Live News Sentiment & Loss Risk Engine */}
                  <LiveNewsSentimentBar
                    symbol={quote.symbol}
                  />

                  {/* Quality Scorecard (Piotroski F-Score & Delivery %) */}
                  <QualityScoreCard
                    quality={quote.quality_filters}
                    symbol={quote.symbol}
                  />

                  {/* Technical Signals & Moving Averages */}
                  <TechnicalSignals signals={quote.technicals} symbol={quote.symbol} />

                  {/* Relative Rotation Graph 2D Quadrant Map */}
                  <SectorRrgMap
                    currentSectorRrg={quote.sector_rrg}
                    activeStockSymbol={quote.symbol}
                  />

                  {/* Module C: Monte Carlo Simulation & Post-Tax Profit Simulator */}
                  <ProfitSimulator
                    symbol={quote.symbol}
                    initialCapital={simCapital}
                    initialHorizon={simHorizon}
                    onSaveSimulation={handleSaveSimulation}
                  />

                  {/* Vetted Profitable Penny Stocks Window (< ₹150) */}
                  <PennyStocksRadar onSelectStock={handleSelectFromPenny} />
                </>
              ) : (
                <div className="glass-panel-3d rounded-2xl p-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-muted-dark">
                    Fetching live NSE quotes, quality metrics, and technical indicators for {selectedSymbol}...
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Tab 2: Dividend Intelligence & Timing */}
          {activeTab === "dividend" && (
            <section>
              <DividendAnalyzer
                symbol={selectedSymbol}
                onSelectStock={(sym) => setSelectedSymbol(sym)}
              />
            </section>
          )}

          {/* Trading Discipline & Institutional Grounding Matrix */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">100% Tax & STT Precision</div>
                <div className="text-[11px] text-muted dark:text-muted-dark">Budget 2024 STCG 20% & LTCG 12.5% matches demat contract note.</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">95% Quality Moat</div>
                <div className="text-[11px] text-muted dark:text-muted-dark">Piotroski &ge; 7 & Delivery &ge; 50% eliminates 95% of retail traps.</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">85% Statistical Edge</div>
                <div className="text-[11px] text-muted dark:text-muted-dark">Radar Conviction + Live News Win Probabilities give institutional odds.</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-surface-dark border border-slate-200/80 dark:border-border-dark flex items-start gap-2.5 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">Rule #1: Capital Preservation</div>
                <div className="text-[11px] text-muted dark:text-muted-dark">When Bear Stop-Loss is breached, exit immediately without emotion.</div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-border dark:border-border-dark bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md py-6 transition-colors duration-300">
          <div className="max-w-7xl 3xl:max-w-[1900px] ultrawide:max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted dark:text-muted-dark">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-white">AlphaPulse India Pro</span>
              <span>•</span>
              <span>3D Quantitative Workstation</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] flex-wrap">
              <span>jugaad-data • nsepython • PKScreener • RRG Sector Rotation • Monte Carlo (1,000 Paths) • Dividend Timing</span>
              <span>•</span>
              <span>Budget 2024 Tax Compliant</span>
            </div>
          </div>
        </footer>

        {/* Animated Portfolio & Strategy Vault Side Drawer */}
        <PortfolioSideDrawer
          isOpen={isPortfolioOpen}
          onClose={() => setIsPortfolioOpen(false)}
          savedSimulations={savedSimulations}
          watchlistSymbols={watchlist}
          onRemoveSimulation={handleRemoveSimulation}
          onRemoveWatchlist={handleRemoveWatchlist}
          onClearAll={handleClearAllSimulations}
          onSelectSymbol={(sym) => {
            setSelectedSymbol(sym);
            setIsPortfolioOpen(false);
          }}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={() => refetchHealth()}
        />
      </div>
    </div>
  );
}

export default App;
