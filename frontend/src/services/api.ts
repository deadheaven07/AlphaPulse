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
  GoalAiCopilotResponse,
  ChatMessageItem,
  ClientWorkspaceContext,
  ConversationalChatResponse,
  TacticalSetup,
  TacticalSwingItem,
  CrowdPsychologyResult,
  HoldingExtensionEvaluation,
  CategorizedTacticalSwings,
  InsiderDealItem,
  OptionChainPcrResult,
  TelegramConfig,
  IntradayScannerResponse,
  IntradayTrade,
  IntradayLeverageCalculation
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
  const apiKey = getCustomApiKey();
  const res = await fetch(`${API_BASE}/planner/ai-copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      api_key: apiKey || undefined
    })
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

export async function sendConversationalChat(payload: {
  messages: ChatMessageItem[];
  context?: ClientWorkspaceContext;
}): Promise<ConversationalChatResponse> {
  const apiKey = getCustomApiKey();
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: payload.messages.map((m) => ({ role: m.role, content: m.content })),
      context: payload.context,
      api_key: apiKey || undefined
    })
  });
  if (!res.ok) throw new Error("Failed to communicate with Alpha AI Copilot");
  return res.json();
}

export async function screenTacticalSetup(
  capital: number = 50000,
  preferredSymbol?: string,
  riskMode: string = "Aggressive"
): Promise<TacticalSetup> {
  const res = await fetch(`${API_BASE}/tactical/screen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      capital,
      preferred_symbol: preferredSymbol || undefined,
      risk_mode: riskMode
    })
  });
  if (!res.ok) throw new Error("Failed to screen tactical setup");
  return res.json();
}

export async function armTacticalWatchdog(payload: {
  symbol: string;
  company_name: string;
  entry_price: number;
  entry_low?: number;
  entry_high?: number;
  allocated_capital: number;
  shares: number;
  target_1: number;
  target_2: number;
  stop_loss: number;
  holding_days?: number;
}): Promise<{ status: string; message: string; swing: TacticalSwingItem }> {
  const res = await fetch(`${API_BASE}/tactical/arm-watchdog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to arm 24/7 tactical watchdog");
  return res.json();
}

export async function armPreBuyTrigger(payload: {
  symbol: string;
  company_name: string;
  entry_price: number;
  entry_low: number;
  entry_high: number;
  allocated_capital: number;
  shares: number;
  target_1: number;
  target_2: number;
  stop_loss: number;
  holding_days?: number;
}): Promise<{ status: string; message: string; swing: TacticalSwingItem }> {
  const res = await fetch(`${API_BASE}/tactical/arm-prebuy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to arm pre-buy trigger");
  return res.json();
}

export async function confirmTacticalEntry(
  swingId: number,
  actualEntryPrice?: number
): Promise<{ status: string; message: string; swing: TacticalSwingItem }> {
  const res = await fetch(`${API_BASE}/tactical/confirm-entry/${swingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actual_entry_price: actualEntryPrice })
  });
  if (!res.ok) throw new Error("Failed to confirm tactical entry");
  return res.json();
}

export async function evaluateHoldingExtension(swingId: number): Promise<HoldingExtensionEvaluation> {
  const res = await fetch(`${API_BASE}/tactical/evaluate-extension/${swingId}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to evaluate holding extension");
  return res.json();
}

export async function applyHoldingExtension(
  swingId: number,
  extraDays: number = 4,
  newStopLoss?: number
): Promise<{ status: string; message: string; swing: TacticalSwingItem }> {
  const res = await fetch(`${API_BASE}/tactical/apply-extension/${swingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      extra_days: extraDays,
      new_stop_loss: newStopLoss
    })
  });
  if (!res.ok) throw new Error("Failed to apply holding extension");
  return res.json();
}

export async function fetchPreBuyTacticalSwings(): Promise<TacticalSwingItem[]> {
  const res = await fetch(`${API_BASE}/tactical/prebuy`);
  if (!res.ok) throw new Error("Failed to fetch pre-buy watchlist");
  return res.json();
}

export async function fetchAllCategorizedTacticalSwings(): Promise<CategorizedTacticalSwings> {
  const res = await fetch(`${API_BASE}/tactical/all`);
  if (!res.ok) throw new Error("Failed to fetch categorized tactical swings");
  return res.json();
}

export async function fetchActiveTacticalSwings(): Promise<TacticalSwingItem[]> {
  const res = await fetch(`${API_BASE}/tactical/active`);
  if (!res.ok) throw new Error("Failed to fetch active tactical swings");
  return res.json();
}

export async function disarmTacticalSwing(swingId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tactical/${swingId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to disarm tactical watchdog");
}

export async function analyzeNewsCrowdPsychology(payload: {
  symbol: string;
  headline: string;
  summary?: string;
  delivery_pct?: number;
}): Promise<CrowdPsychologyResult> {
  const res = await fetch(`${API_BASE}/tactical/analyze-news`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to analyze crowd psychology");
  return res.json();
}

// --- Institutional Superpowers: Telegram, Insider Radar & Option Chain PCR ---

export async function fetchInsiderDeals(): Promise<InsiderDealItem[]> {
  const res = await fetch(`${API_BASE}/institutional/insider-deals`);
  if (!res.ok) throw new Error("Failed to fetch insider & bulk deals");
  return res.json();
}

export async function fetchOptionChainPcr(): Promise<OptionChainPcrResult> {
  const res = await fetch(`${API_BASE}/institutional/option-chain-pcr`);
  if (!res.ok) throw new Error("Failed to fetch NSE option chain PCR");
  return res.json();
}

export async function testTelegramPing(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/institutional/test-telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bot_token: botToken,
      chat_id: chatId
    })
  });
  if (!res.ok) throw new Error("Failed to execute Telegram test");
  return res.json();
}

export async function saveTelegramConfig(
  botToken: string,
  chatId: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/institutional/save-telegram-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bot_token: botToken,
      chat_id: chatId
    })
  });
  if (!res.ok) throw new Error("Failed to save Telegram config");
  return res.json();
}

export async function fetchTelegramConfig(): Promise<TelegramConfig> {
  const res = await fetch(`${API_BASE}/institutional/get-telegram-config`);
  if (!res.ok) throw new Error("Failed to fetch Telegram config");
  return res.json();
}

// --- Intraday MIS 5x Terminal Endpoints ---

export async function fetchIntradayScanner(marginCapital: number = 20000): Promise<IntradayScannerResponse> {
  const res = await fetch(`${API_BASE}/intraday/scanner?margin_capital=${marginCapital}`);
  if (!res.ok) throw new Error("Failed to fetch intraday scanner data");
  return res.json();
}

export async function calculateIntradayLeverage(payload: {
  symbol: string;
  entry_price: number;
  margin_capital: number;
  direction: string;
  leverage_multiplier?: number;
}): Promise<IntradayLeverageCalculation> {
  const res = await fetch(`${API_BASE}/intraday/calculate-leverage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to calculate intraday leverage math");
  return res.json();
}

export async function armIntradayTrade(payload: {
  symbol: string;
  company_name?: string;
  direction: string;
  entry_price: number;
  shares: number;
  margin_capital: number;
  total_exposure: number;
  leverage_multiplier?: number;
  target_price: number;
  stop_loss: number;
  orb_high?: number;
  orb_low?: number;
  vwap?: number;
}): Promise<{ status: string; trade_id: number; message: string }> {
  const res = await fetch(`${API_BASE}/intraday/arm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to arm intraday MIS position");
  return res.json();
}

export async function fetchActiveIntradayTrades(): Promise<IntradayTrade[]> {
  const res = await fetch(`${API_BASE}/intraday/active`);
  if (!res.ok) throw new Error("Failed to fetch active intraday positions");
  return res.json();
}

export async function fetchAllIntradayTrades(): Promise<IntradayTrade[]> {
  const res = await fetch(`${API_BASE}/intraday/all`);
  if (!res.ok) throw new Error("Failed to fetch intraday trades history");
  return res.json();
}

export async function squareOffIntradayTrade(
  tradeId: number,
  exitPrice?: number,
  reason: string = "MANUAL_SQUARE_OFF"
): Promise<{ status: string; trade_id: number; net_pnl: number; message: string }> {
  const res = await fetch(`${API_BASE}/intraday/square-off/${tradeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exit_price: exitPrice, reason })
  });
  if (!res.ok) throw new Error("Failed to square off intraday trade");
  return res.json();
}

export async function deleteIntradayTrade(tradeId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/intraday/${tradeId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete intraday trade");
}




