import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHealth, fetchStockQuote, askGeminiAi } from "./services/api";
import type { AiAnalysisResponse } from "./types";
import { Navbar } from "./components/Navbar";
import { AskAIBar } from "./components/AskAIBar";
import { StockOverviewCard } from "./components/StockOverviewCard";
import { TechnicalSignals } from "./components/TechnicalSignals";
import { ProfitSimulator } from "./components/ProfitSimulator";
import { AIThesisCard } from "./components/AIThesisCard";
import { SettingsModal } from "./components/SettingsModal";
import { Sparkles } from "lucide-react";

export function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("TATAMOTORS");
  const [simCapital, setSimCapital] = useState<number>(100000);
  const [simHorizon, setSimHorizon] = useState<number>(12);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // AI Analysis Query State
  const [aiResponse, setAiResponse] = useState<AiAnalysisResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Backend Health
  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  // Current Stock Quote
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
      // If recommendations are returned, automatically update simulator capital and horizon
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

  const handleSimulateFromAi = (symbol: string) => {
    setSelectedSymbol(symbol);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        geminiConfigured={Boolean(health?.gemini_api_configured)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Module A: Natural Language Stock Explorer */}
        <section className="space-y-4">
          <AskAIBar onSearch={handleAiSearch} isLoading={isAiLoading} />

          {/* AI Thesis Results Deck */}
          {aiResponse && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    AI Thesis Breakdown:{" "}
                    <span className="text-muted font-normal">{aiResponse.query_summary}</span>
                  </h2>
                </div>
                {aiResponse.notice && (
                  <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                    {aiResponse.notice}
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                💡 <strong>Sector Macro Context:</strong> {aiResponse.sector_overview}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiResponse.recommendations.map((rec) => (
                  <AIThesisCard
                    key={rec.symbol}
                    recommendation={rec}
                    onSimulate={handleSimulateFromAi}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Module B: Live Stock Studio & RRG Overview */}
        <section className="space-y-6">
          {quote ? (
            <>
              <StockOverviewCard
                quote={quote}
                onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              />

              {/* Technical Signals (PKScreener Adapted) */}
              <TechnicalSignals signals={quote.technicals} symbol={quote.symbol} />

              {/* Module C: Profit Simulator & Projection Chart */}
              <ProfitSimulator
                symbol={quote.symbol}
                initialCapital={simCapital}
                initialHorizon={simHorizon}
              />
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Fetching live NSE quotes and technical indicators for {selectedSymbol}...
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">AlphaPulse India</span>
            <span>•</span>
            <span>NSE / BSE Quantitative Workspace</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Integrations: jugaad-data • nsepython • PKScreener • RRG Sector Rotation</span>
            <span>•</span>
            <span>Personal Use Only</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => refetchHealth()}
      />
    </div>
  );
}

export default App;
