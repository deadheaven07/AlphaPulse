import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHealth, fetchStockQuote, askGeminiAi } from "./services/api";
import type { AiAnalysisResponse, SimulationResult } from "./types";
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
import { LiveNewsAndThesis } from "./components/LiveNewsAndThesis";
import { PortfolioSideDrawer } from "./components/PortfolioSideDrawer";
import { SettingsModal } from "./components/SettingsModal";
import { Sparkles, Globe, LineChart, Coins } from "lucide-react";

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

  // Local Storage Strategy Vault & Watchlist
  const [savedSimulations, setSavedSimulations] = useState<SimulationResult[]>(() => {
    try {
      const stored = localStorage.getItem("alphapulse_vault");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("alphapulse_watchlist");
      return stored ? JSON.parse(stored) : ["TATAMOTORS", "RELIANCE", "BEL", "TCS", "HAL", "COALINDIA"];
    } catch {
      return ["TATAMOTORS", "RELIANCE", "BEL", "TCS", "HAL", "COALINDIA"];
    }
  });

  useEffect(() => {
    localStorage.setItem("alphapulse_vault", JSON.stringify(savedSimulations));
  }, [savedSimulations]);

  useEffect(() => {
    localStorage.setItem("alphapulse_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // AI Analysis Query State
  const [aiResponse, setAiResponse] = useState<AiAnalysisResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Backend Health
  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  // Current Stock Quote with Quality Filters & Technicals
  const { data: quote } = useQuery({
    queryKey: ["stock-quote", selectedSymbol],
    queryFn: () => fetchStockQuote(selectedSymbol),
    refetchInterval: 15000,
  });

  const handleAiSearch = async (query: string, capital = simCapital, horizon = simHorizon) => {
    setIsAiLoading(true);
    try {
      const res = await askGeminiAi(query, capital, horizon);
      setAiResponse(res);
      if (res.recommendations?.length > 0) {
        setSelectedSymbol(res.recommendations[0].symbol);
      }
      setSimCapital(capital);
      setSimHorizon(horizon);
    } catch (err) {
      console.error("AI Search failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectFromRadar = (symbol: string) => {
    setSelectedSymbol(symbol);
    window.scrollTo({ top: 480, behavior: "smooth" });
  };

  const handleSimulateFromAi = (symbol: string) => {
    setSelectedSymbol(symbol);
    window.scrollTo({ top: 480, behavior: "smooth" });
  };

  const handleToggleWatchlist = (symbol: string) => {
    if (watchlist.includes(symbol)) {
      setWatchlist(watchlist.filter((s) => s !== symbol));
    } else {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const handleSaveSimulation = (sim: SimulationResult) => {
    setSavedSimulations((prev) => [sim, ...prev]);
  };

  const handleRemoveSimulation = (index: number) => {
    setSavedSimulations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllSimulations = () => {
    if (window.confirm("Are you sure you want to clear all saved strategy simulations?")) {
      setSavedSimulations([]);
    }
  };

  const handleRemoveWatchlist = (symbol: string) => {
    setWatchlist((prev) => prev.filter((s) => s !== symbol));
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">
      {/* 3D Background Canvas & Warm Ambient Glow Meshes (Zero blue light) */}
      <ThreeBackground isDarkMode={isDarkMode} />

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

        {/* Main Dashboard Container (Scales smoothly to curved ultrawide monitors) */}
        <main className="flex-1 max-w-7xl 3xl:max-w-[1900px] ultrawide:max-w-[2400px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Real-Time KPI Stocks Radar (Top 6 Multi-Factor Buys Now) */}
          <section>
            <RealTimeRadarKPIs
              onSelectStock={handleSelectFromRadar}
              referenceCapital={simCapital}
            />
          </section>

          {/* Module A: Natural Language Stock Explorer */}
          <section className="space-y-4">
            <AskAIBar onSearch={handleAiSearch} isLoading={isAiLoading} />

            {/* AI Thesis Results Deck */}
            {aiResponse && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Live Web-Grounded Thesis:{" "}
                      <span className="text-muted dark:text-muted-dark font-normal">{aiResponse.query_summary}</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Live Web Grounded
                    </span>
                    {aiResponse.notice && (
                      <span className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full font-medium">
                        {aiResponse.notice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/70 dark:bg-surface-dark/90 border border-slate-200 dark:border-border-dark text-xs text-slate-700 dark:text-slate-300 font-medium">
                  💡 <strong>Sector Macro Context:</strong> {aiResponse.sector_overview}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ultrawide:grid-cols-3 gap-4">
                  {aiResponse.recommendations.map((rec) => (
                    <LiveNewsAndThesis
                      key={rec.symbol}
                      recommendation={rec}
                      onSimulate={handleSimulateFromAi}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* View Mode Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-border/80 dark:border-border-dark pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("studio")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "studio"
                    ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-surface-dark/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-border dark:border-border-dark"
                }`}
              >
                <LineChart className="w-4 h-4" />
                <span>Quantitative Stock Studio & Simulator</span>
              </button>
              <button
                onClick={() => setActiveTab("dividend")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "dividend"
                    ? "bg-emerald-600 dark:bg-amber-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-surface-dark/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-border dark:border-border-dark"
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Dividend Intelligence & Timing</span>
              </button>
            </div>

            <span className="text-xs font-bold font-mono text-slate-500 dark:text-muted-dark hidden sm:inline">
              Active Stock: <strong className="text-emerald-600 dark:text-emerald-400">{selectedSymbol}</strong>
            </span>
          </div>

          {/* Tab 1: Quantitative Stock Studio */}
          {activeTab === "studio" && (
            <section className="space-y-6">
              {quote ? (
                <>
                  <StockOverviewCard
                    quote={quote}
                    onSelectSymbol={(sym) => setSelectedSymbol(sym)}
                    isWatchlisted={watchlist.includes(quote.symbol)}
                    onToggleWatchlist={handleToggleWatchlist}
                  />

                  {/* Real-Time News Feed & Loss Risk Gauge */}
                  <LiveNewsSentimentBar symbol={quote.symbol} />

                  {/* Quality & Governance Screener (Piotroski, Delivery %, Promoter Pledge) */}
                  <QualityScoreCard
                    quality={quote.quality_filters}
                    symbol={quote.symbol}
                  />

                  {/* Technical Signals (PKScreener RSI, Breakout, EMA) */}
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
              <span>jugaad-data • nsepython • PKScreener • RRG Sector Rotation • Monte Carlo • Dividend Timing</span>
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
