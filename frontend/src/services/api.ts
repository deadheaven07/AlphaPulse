import type {
  StockQuote,
  CandlePoint,
  MarketStatusData,
  AiAnalysisResponse,
  SimulationResult,
  RiskTolerance,
  NewsSentimentData,
  DividendAnalysisData,
  TopDividendYielder,
  KpiRadarStock,
  DiagnosticSuiteResult,
  PortfolioAlert,
  PennyStockCandidate,
  BreakoutCandidate,
  DbHolding,
  TickerItem,
  GoalPlan,
  GoalNewsItem,
  GoalAiCopilotResponse
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export function getCustomApiKey(): string {
  return localStorage.getItem("alphapulse_gemini_key") || "";
}

export function setCustomApiKey(key: string): void {
  localStorage.setItem("alphapulse_gemini_key", key);
}

export async function fetchHealth(): Promise<{ status: string; gemini_api_configured: boolean }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchMarketStatus(): Promise<MarketStatusData> {
  const res = await fetch(`${API_BASE}/stocks/market-status`);
  if (!res.ok) throw new Error("Failed to fetch market status");
  return res.json();
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`${API_BASE}/stocks/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
  return res.json();
}

export async function fetchCandles(symbol: string, period = "1y", interval = "1d"): Promise<CandlePoint[]> {
  const res = await fetch(`${API_BASE}/stocks/candles?symbol=${encodeURIComponent(symbol)}&period=${period}&interval=${interval}`);
  if (!res.ok) throw new Error(`Failed to fetch candles for ${symbol}`);
  return res.json();
}

export async function searchStocks(query: string): Promise<Array<{ symbol: string; company_name: string; sector: string; price: number; change_pct: number }>> {
  const res = await fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search stocks");
  return res.json();
}

export async function runProfitSimulation(
  symbol: string,
  capital: number,
  horizon_months: number,
  risk_tolerance: RiskTolerance = "Moderate"
): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulator/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol,
      capital,
      horizon_months,
      risk_tolerance
    })
  });
  if (!res.ok) throw new Error("Profit simulation failed");
  return res.json();
}

export async function askGeminiAi(
  query: string,
  capital = 50000,
  horizon_months = 12
): Promise<AiAnalysisResponse> {
  const apiKey = getCustomApiKey();
  const res = await fetch(`${API_BASE}/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      capital,
      horizon_months,
      api_key_override: apiKey || undefined
    })
  });
  if (!res.ok) throw new Error("AI Analysis request failed");
  return res.json();
}

export async function fetchNewsSentiment(symbol: string): Promise<NewsSentimentData> {
  const res = await fetch(`${API_BASE}/stocks/news-sentiment?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Failed to fetch news sentiment for ${symbol}`);
  return res.json();
}

export async function fetchDividendAnalysis(symbol: string, capital = 100000): Promise<DividendAnalysisData> {
  const res = await fetch(`${API_BASE}/dividend/analyzer?symbol=${encodeURIComponent(symbol)}&capital=${capital}`);
  if (!res.ok) throw new Error(`Failed to fetch dividend analysis for ${symbol}`);
  return res.json();
}

export async function fetchTopDividendYielders(): Promise<TopDividendYielder[]> {
  const res = await fetch(`${API_BASE}/dividend/top-yielders`);
  if (!res.ok) throw new Error("Failed to fetch top dividend yielders");
  return res.json();
}

export async function fetchKpiRadar(capital = 100000): Promise<KpiRadarStock[]> {
  const res = await fetch(`${API_BASE}/stocks/kpi-radar?capital=${capital}`);
  if (!res.ok) throw new Error("Failed to fetch KPI radar");
  return res.json();
}

export async function fetchSystemDiagnostics(): Promise<DiagnosticSuiteResult> {
  const res = await fetch(`${API_BASE}/diagnostics/self-test`);
  if (!res.ok) throw new Error("Failed to run system diagnostics self-test");
  return res.json();
}

export async function inspectPortfolioThreats(holdings: any[]): Promise<PortfolioAlert[]> {
  const res = await fetch(`${API_BASE}/portfolio/inspect-threats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(holdings)
  });
  if (!res.ok) throw new Error("Failed to inspect portfolio threats");
  return res.json();
}

export async function fetchPennyRadar(budget = 25000): Promise<PennyStockCandidate[]> {
  const res = await fetch(`${API_BASE}/stocks/penny-radar?budget=${budget}`);
  if (!res.ok) throw new Error("Failed to fetch penny stocks radar");
  return res.json();
}

export async function fetchSidewaysBreakouts(): Promise<BreakoutCandidate[]> {
  const res = await fetch(`${API_BASE}/stocks/sideways-breakouts`);
  if (!res.ok) throw new Error("Failed to fetch sideways breakouts");
  return res.json();
}

// Persistent SQLite Portfolio & Watchlist API
export async function fetchDbHoldings(): Promise<DbHolding[]> {
  const res = await fetch(`${API_BASE}/portfolio/holdings`);
  if (!res.ok) throw new Error("Failed to fetch portfolio holdings from database");
  return res.json();
}

export async function createDbHolding(holding: DbHolding): Promise<DbHolding> {
  const res = await fetch(`${API_BASE}/portfolio/holdings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(holding)
  });
  if (!res.ok) throw new Error("Failed to save holding to database");
  return res.json();
}

export async function deleteDbHolding(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio/holdings/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete holding from database");
}

export async function clearAllDbHoldings(): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio/holdings`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to clear holdings from database");
}

export async function fetchDbWatchlist(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/portfolio/watchlist`);
  if (!res.ok) throw new Error("Failed to fetch watchlist from database");
  return res.json();
}

export async function addDbWatchlist(symbol: string): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol })
  });
  if (!res.ok) throw new Error("Failed to pin symbol to database watchlist");
}

export async function deleteDbWatchlist(symbol: string): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio/watchlist/${encodeURIComponent(symbol)}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to unpin symbol from database watchlist");
}

export async function fetchTickerFeed(): Promise<TickerItem[]> {
  const res = await fetch(`${API_BASE}/stocks/ticker-feed`);
  if (!res.ok) throw new Error("Failed to fetch ticker tape feed");
  return res.json();
}

export async function fetchSavedGoals(): Promise<GoalPlan[]> {
  const res = await fetch(`${API_BASE}/planner/goals`);
  if (!res.ok) throw new Error("Failed to fetch saved goals");
  return res.json();
}

export async function saveGoalPlan(goal: GoalPlan): Promise<GoalPlan> {
  const res = await fetch(`${API_BASE}/planner/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goal)
  });
  if (!res.ok) throw new Error("Failed to save goal plan");
  return res.json();
}

export async function deleteGoalPlan(goalId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/planner/goals/${goalId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete goal plan");
}

export async function askPlanCopilot(payload: {
  query: string;
  target_amount: number;
  starting_capital: number;
  monthly_sip: number;
  horizon_months: number;
  risk_level: string;
}): Promise<GoalAiCopilotResponse> {
  const res = await fetch(`${API_BASE}/planner/ai-copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to query AI goal advisor");
  return res.json();
}

export async function fetchGoalBasketNews(symbols: string): Promise<GoalNewsItem[]> {
  if (!symbols) return [];
  const res = await fetch(`${API_BASE}/planner/basket-news?symbols=${encodeURIComponent(symbols)}`);
  if (!res.ok) throw new Error("Failed to fetch basket news");
  return res.json();
}


