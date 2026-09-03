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

export type AlertType = "BUY_TRIGGER_HIT" | "PROFIT_TARGET" | "STOP_LOSS_BREACH" | "FATAL_RISK" | "NEWS_THREAT" | "BEAR_TRAP_NOISE" | "CONSOLIDATION_BREAKOUT";
export type AlertSeverity = "SUCCESS" | "CRITICAL" | "WARNING" | "INFO";

export interface PortfolioAlert {
  id: string;
  symbol: string;
  company_name: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  current_price: number;
  target_price?: number;
  stop_loss_price?: number;
  pnl_inr?: number;
  pnl_pct?: number;
  risk_of_loss_pct?: number;
  title: string;
  message: string;
  recommended_action: string;
}

export interface PennyStockCandidate {
  symbol: string;
  company_name: string;
  sector: string;
  category: string;
  price: number;
  change: number;
  change_pct: number;
  penny_score: number;
  delivery_pct: number;
  promoter_pledge_pct: number;
  piotroski_score: number;
  target_price: number;
  potential_upside_pct: number;
  trailing_stop_loss: number;
  lower_circuit?: number;
  upper_circuit?: number;
  circuit_risk?: "NORMAL" | "CRITICAL_LOWER_CIRCUIT";
  circuit_warning?: string | null;
  budget_allocation: number;
  shares_purchasable: number;
  catalyst: string;
  risk_reward: string;
  is_institutional_safe: boolean;
}

export interface BreakoutCandidate {
  symbol: string;
  company_name: string;
  price: number;
  change_pct: number;
  volume_surge: number;
  high_20d: number;
  signal: string;
}

export interface DbHolding {
  id?: number;
  symbol: string;
  company_name?: string;
  entry_price: number;
  shares: number;
  target_price?: number;
  stop_loss?: number;
  created_at?: string;
}

export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  is_index?: boolean;
}

export interface GoalBasketStock {
  symbol: string;
  name: string;
  sector?: string;
  allocation_pct: number;
  rationale?: string;
  expected_cagr_pct?: number;
}

export interface GoalPlan {
  id?: number;
  title: string;
  target_amount: number;
  starting_capital: number;
  monthly_sip: number;
  horizon_months: number;
  risk_level: "Conservative" | "Moderate" | "Aggressive" | string;
  planned_basket: GoalBasketStock[];
  notes?: string;
  created_at?: string;
}

export interface GoalNewsItem {
  symbol: string;
  company_name: string;
  title: string;
  publisher: string;
  link: string;
  published: string;
  sentiment: string;
  score: number;
  threat_level: "LOW" | "MODERATE" | "HIGH" | string;
  risk_of_loss_pct: number;
  summary: string;
}

export interface GoalAiCopilotResponse {
  target_amount: number;
  starting_capital: number;
  monthly_sip: number;
  horizon_months: number;
  risk_level: string;
  required_cagr_pct: number;
  total_invested: number;
  growth_required: number;
  strategy_summary: string;
  ai_thesis: string;
  recommended_basket: GoalBasketStock[];
}

export interface CrowdPsychologyResult {
  symbol: string;
  headline: string;
  sentiment_category: "FATAL_RISK" | "BEAR_TRAP_NOISE" | "NEUTRAL_UNCERTAIN" | string;
  retail_panic_probability_pct: number;
  institutional_dip_buy_probability_pct: number;
  verdict: "DUMP_IMMEDIATELY" | "HOLD_FOR_REBOUND" | "MONITOR_STOP_LOSS" | string;
  guru_explanation: string;
}

export interface TacticalSetup {
  symbol: string;
  company_name: string;
  current_price: number;
  capital_allocated: number;
  cash_buffer: number;
  shares: number;
  entry_range: string;
  entry_low: number;
  entry_high: number;
  target_1: number;
  target_1_pct: number;
  target_2: number;
  target_2_pct: number;
  stop_loss: number;
  stop_loss_pct: number;
  risk_reward_ratio: string;
  gross_profit: number;
  total_tax_and_charges: number;
  net_in_hand_profit: number;
  holding_period_days: number;
  catalyst: string;
  crowd_psychology?: CrowdPsychologyResult;
  guru_thesis: string;
}

export interface TacticalSwingItem {
  id?: number;
  symbol: string;
  company_name: string;
  entry_price: number;
  entry_low?: number;
  entry_high?: number;
  current_price?: number;
  day_change_pct?: number;
  allocated_capital: number;
  current_valuation?: number;
  unrealized_pnl?: number;
  pnl_pct?: number;
  shares: number;
  target_1: number;
  target_2: number;
  stop_loss: number;
  entry_date?: string;
  expiry_date?: string;
  holding_days?: number;
  extended_days?: number;
  remaining_days?: number;
  progress_pct?: number;
  in_buy_zone?: boolean;
  distance_to_low_pct?: number;
  target_1_hit?: boolean;
  stop_loss_hit?: boolean;
  status: "WAITING_FOR_ENTRY" | "ACTIVE" | "ACTIVE_HOLDING" | "TARGET_HIT" | "SL_HIT" | "EXPIRED" | string;
  created_at?: string;
}

export interface HoldingExtensionEvaluation {
  swing_id: number;
  symbol: string;
  pnl_pct: number;
  can_extend: boolean;
  recommended_extra_days: number;
  trailing_stop_loss: number;
  stretch_target: number;
  guru_rationale: string;
}

export interface CategorizedTacticalSwings {
  prebuy_count: number;
  active_count: number;
  prebuy: TacticalSwingItem[];
  active: TacticalSwingItem[];
}

export interface ChatActionCard {
  type: string;
  symbol: string;
  company_name: string;
  price: number;
  change_pct: number;
  sector?: string;
}

export interface ChatMessageItem {
  id?: string;
  role: "user" | "model";
  content: string;
  actionCards?: ChatActionCard[];
  tacticalCard?: TacticalSetup;
  followUpChips?: string[];
  timestamp?: number;
}

export interface ClientWorkspaceContext {
  current_page: string;
  active_symbol?: string;
  capital?: number;
  horizon_months?: number;
  goal_target?: number;
  goal_sip?: number;
  goal_starting?: number;
  risk_level?: string;
}

export interface ConversationalChatResponse {
  reply: string;
  action_cards: ChatActionCard[];
  tactical_card?: TacticalSetup;
  follow_up_chips: string[];
}




