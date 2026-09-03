import type {
  StockQuote,
  CandlePoint,
  MarketStatusData,
  AiAnalysisResponse,
  SimulationResult,
  RiskTolerance
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
