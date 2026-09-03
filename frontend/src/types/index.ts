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

export interface QualityFiltersData {
  delivery_pct: number;
  delivery_signal: string;
  is_high_delivery: boolean;
  piotroski_score: number;
  piotroski_rating: string;
  promoter_pledge_pct: number;
  promoter_holding_pct: number;
  fii_holding_pct: number;
  dii_holding_pct: number;
  order_book_cr: number;
  is_pledge_safe: boolean;
  pledge_status: string;
  quality_verdict: string;
}

export interface NewsHeadline {
  title: string;
  source: string;
  time_ago: string;
  published_at: string;
  impact: string;
  summary: string;
  sentiment_score: number;
  url: string;
}

export interface NewsSentimentData {
  symbol: string;
  sentiment_score: number;
  sentiment_label: string;
  sentiment_badge: string;
  sentiment_color: string;
  risk_of_loss_pct: number;
  win_probability_pct: number;
  primary_catalyst: string;
  sentiment_drift_modifier: number;
  total_news_analyzed: number;
  headlines: NewsHeadline[];
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
  quality_filters?: QualityFiltersData;
  news_sentiment?: NewsSentimentData;
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

export interface BrokerTarget {
  broker: string;
  target: number;
  rating: string;
}

export interface AiRecommendation {
  symbol: string;
  company_name: string;
  sector: string;
  current_price: number;
  consensus_target_price?: number;
  consensus_rating?: string;
  broker_targets?: BrokerTarget[];
  investment_thesis: string;
  concall_highlights?: string[];
  key_catalysts: string[];
  key_risks: string[];
  piotroski_f_score?: number;
  delivery_pct?: number;
  verdict: "Institutional Accumulate" | "Strong Accumulate" | "Tactical Buy" | "Wait for Pullback" | "Hold";
  confidence_score: number;
  target_upside_pct: number;
}

export interface AiAnalysisResponse {
  query_summary: string;
  sector_overview: string;
  web_search_grounded?: boolean;
  recommendations: AiRecommendation[];
  notice?: string;
}

export interface TaxesAndCharges {
  gross_profit: number;
  entry_turnover: number;
  exit_turnover: number;
  stt: number;
  exchange_fees: number;
  sebi_charges: number;
  stamp_duty: number;
  gst: number;
  total_statutory_friction: number;
  pre_tax_profit: number;
  capital_gains_tax: number;
  tax_type: string;
  net_in_hand_profit: number;
  effective_post_tax_roi_pct: number;
}

export interface ScenarioResult {
  percentile?: string;
  target_price: number;
  gross_profit: number;
  net_in_hand_profit: number;
  roi_pct: number;
  total_value: number;
  taxes_and_charges: TaxesAndCharges;
  stop_loss_price?: number;
}

export interface TrajectoryPoint {
  month: number;
  label: string;
  bull_price: number;
  base_price: number;
  bear_price: number;
  bull_val: number;
  base_val: number;
  bear_val: number;
}

export interface SimulationResult {
  symbol: string;
  company_name: string;
  sector?: string;
  current_price: number;
  capital: number;
  horizon_months: number;
  risk_tolerance: RiskTolerance;
  shares: number;
  deployed_capital: number;
  cash_buffer: number;
  num_simulated_paths?: number;
  annual_volatility_pct?: number;
  annual_drift_pct?: number;
  bull_case: ScenarioResult;
  base_case: ScenarioResult;
  bear_case: ScenarioResult;
  expected_value: {
    expected_net_profit: number;
    expected_roi_pct: number;
    risk_reward_ratio: number;
    var_90_pct: number;
    confidence_level: string;
  };
  trajectory: TrajectoryPoint[];
}

export interface DividendTimelineStep {
  step: number;
  title: string;
  date: string;
  description: string;
  status: string;
}

export interface DividendAnalysisData {
  symbol: string;
  company_name: string;
  sector: string;
  price: number;
  capital: number;
  shares: number;
  deployed_capital: number;
  dividend_yield_pct: number;
  dps_annual: number;
  last_dps: number;
  expected_annual_cash: number;
  expected_payout_cash: number;
  payout_frequency: string;
  payout_months: string;
  next_ex_date: string;
  next_record_date: string;
  expected_credit_date: string;
  optimal_buy_window: string;
  consecutive_years_paying: number;
  dividend_safety_score: number;
  timeline_steps: DividendTimelineStep[];
  description: string;
}

export interface TopDividendYielder {
  symbol: string;
  company_name: string;
  sector: string;
  price: number;
  change_pct: number;
  dividend_yield_pct: number;
  dps_annual: number;
  payout_months: string;
  next_ex_date: string;
  dividend_safety_score: number;
}

export interface KpiRadarStock {
  symbol: string;
  company_name: string;
  sector: string;
  price: number;
  change: number;
  change_pct: number;
  radar_score: number;
  conviction: string;
  delivery_pct: number;
  piotroski_score: number;
  sentiment_label: string;
  sentiment_badge: string;
  win_probability_pct: number;
  post_tax_net_gain_inr: number;
  post_tax_roi_pct: number;
  target_price: number;
  primary_catalyst: string;
  technical_signal: string;
  factors_passed: {
    delivery: boolean;
    piotroski: boolean;
    technicals: boolean;
    news_sentiment: boolean;
    post_tax_roi: boolean;
  };
}

export interface DiagnosticCheck {
  name: string;
  status: "PASS" | "FAIL";
  latency_ms: number;
  details?: string;
  error?: string;
}

export interface DiagnosticSuiteResult {
  overall_status: "HEALTHY" | "DEGRADED";
  timestamp: string;
  total_checks: number;
  passed: number;
  failed: number;
  total_duration_ms: number;
  checks: DiagnosticCheck[];
}
