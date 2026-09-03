export type RiskTolerance = "Conservative" | "Moderate" | "Aggressive";

export interface TechnicalSignalsData {
  rsi_14: number;
  rsi_condition: string;
  breakout: {
    is_breakout: boolean;
    is_price_breakout: boolean;
    volume_surge: number;
    high_20d: number;
    avg_volume_20d: number;
  };
  ema_analysis: {
    ema_50: number;
    ema_200: number;
    trend: string;
    is_golden_cross: boolean;
    above_200_ema: boolean;
  };
  technical_score: number;
}

export interface SectorRrgData {
  sector: string;
  rs_ratio: number;
  rs_momentum: number;
  quadrant: "Leading" | "Improving" | "Weakening" | "Lagging";
  description: string;
  color: string;
}

export interface StockQuote {
  symbol: string;
  company_name: string;
  sector: string;
  industry?: string;
  price: number;
  change: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  high_52w: number;
  low_52w: number;
  market_cap_cr?: number;
  pe?: number;
  sector_pe?: number;
  roce?: number;
  roe?: number;
  debt_to_equity?: number;
  volume?: number;
  beta?: number;
  cagr_3y?: number;
  description?: string;
  technicals?: TechnicalSignalsData;
  sector_rrg?: SectorRrgData;
}

export interface CandlePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStatusData {
  fii_net_cr: number;
  dii_net_cr: number;
  total_institutional_flow_cr: number;
  sentiment: "BULLISH" | "NEUTRAL" | "CAUTIOUS";
  market_status: string;
  nifty_50_level: number;
  nifty_change_pct: number;
}

export interface AiRecommendation {
  symbol: string;
  company_name: string;
  sector: string;
  current_price: number;
  investment_thesis: string;
  key_catalysts: string[];
  key_risks: string[];
  verdict: "Strong Accumulate" | "Tactical Buy" | "Wait for Pullback" | "Hold";
  confidence_score: number;
  target_upside_pct: number;
}

export interface AiAnalysisResponse {
  query_summary: string;
  sector_overview: string;
  recommendations: AiRecommendation[];
  notice?: string;
}

export interface ScenarioResult {
  target_price: number;
  roi_pct: number;
  absolute_profit: number;
  total_value: number;
  probability_pct: number;
  stop_loss_price?: number;
}

export interface TrajectoryPoint {
  month: number;
  label: string;
  bull_value: number;
  base_value: number;
  bear_value: number;
}

export interface SimulationResult {
  symbol: string;
  company_name: string;
  current_price: number;
  capital: number;
  horizon_months: number;
  risk_tolerance: RiskTolerance;
  shares: number;
  deployed_capital: number;
  cash_buffer: number;
  bull_case: ScenarioResult;
  base_case: ScenarioResult;
  bear_case: ScenarioResult;
  expected_value: {
    expected_profit: number;
    expected_roi_pct: number;
    risk_reward_ratio: number;
    expected_total_value: number;
  };
  technicals?: TechnicalSignalsData;
  sector_rrg?: SectorRrgData;
  trajectory: TrajectoryPoint[];
}
