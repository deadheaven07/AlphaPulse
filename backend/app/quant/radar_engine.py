from typing import Dict, Any, List
from .data_engine import fetch_live_quote, fetch_historical_dataframe
from .quality_filters import evaluate_quality_filters
from .technicals import get_technical_summary
from .news_engine import analyze_stock_news_sentiment
from .monte_carlo_engine import run_monte_carlo_simulation

# Universe of top liquid Indian equities for radar scanning
RADAR_CANDIDATES = [
    "BEL",
    "HAL",
    "TMPV",
    "LT",
    "COALINDIA",
    "TATAPOWER",
    "RELIANCE",
    "TCS",
    "ITC",
    "TRENT",
    "ETERNAL"
]

def scan_real_time_kpi_radar(capital_reference: float = 100000.0) -> List[Dict[str, Any]]:
    """
    Scan liquid NSE universe against 5 institutional multi-factor KPI filters:
    1. Institutional Delivery % >= 50%
    2. Piotroski F-Score >= 7/9
    3. 20-day Technical Breakout or EMA Golden Cross
    4. Positive Live News Sentiment (>= +0.25)
    5. Post-Tax Projected Annualized ROI >= 15%
    """
    ranked_stocks: List[Dict[str, Any]] = []

    for sym in RADAR_CANDIDATES:
        try:
            quote = fetch_live_quote(sym)
            df = fetch_historical_dataframe(sym)
            technicals = get_technical_summary(df)
            quality = evaluate_quality_filters(sym, quote)
            news = analyze_stock_news_sentiment(sym, quote)

            # Fast 12-month Monte Carlo simulation for post-tax ROI
            sim = run_monte_carlo_simulation(
                symbol=sym,
                current_price=quote["price"],
                capital=capital_reference,
                horizon_months=12,
                risk_tolerance="Moderate"
            )

            # 5 Quantitative Factor Checks
            is_delivery_pass = quality["delivery_pct"] >= 50.0
            is_piotroski_pass = quality["piotroski_score"] >= 7
            is_technical_pass = technicals["breakout"]["is_breakout"] or technicals["ema_analysis"]["is_golden_cross"] or technicals["technical_score"] >= 60
            is_news_pass = news["sentiment_score"] >= 0.25
            post_tax_roi = sim["base_case"]["roi_pct"]
            is_roi_pass = post_tax_roi >= 15.0

            # Composite Multi-Factor Radar Score (0 - 100)
            score = 0
            if is_delivery_pass: score += 20
            if is_piotroski_pass: score += 20
            if is_technical_pass: score += 20
            if is_news_pass: score += 20
            if is_roi_pass: score += 20

            # Bonus points for exceptional metrics
            if quality["piotroski_score"] >= 8: score += 5
            if quality["promoter_pledge_pct"] == 0: score += 5
            if news["sentiment_score"] >= 0.70: score += 5
            score = min(100, score)

            # Label
            if score >= 90:
                conviction = "High Conviction Buy"
            elif score >= 75:
                conviction = "Institutional Accumulate"
            else:
                conviction = "Tactical Breakout"

            ranked_stocks.append({
                "symbol": sym,
                "company_name": quote["company_name"],
                "sector": quote["sector"],
                "price": quote["price"],
                "change": quote["change"],
                "change_pct": quote["change_pct"],
                "radar_score": score,
                "conviction": conviction,
                "delivery_pct": quality["delivery_pct"],
                "piotroski_score": quality["piotroski_score"],
                "sentiment_label": news["sentiment_label"],
                "sentiment_badge": news["sentiment_badge"],
                "win_probability_pct": news["win_probability_pct"],
                "post_tax_net_gain_inr": sim["base_case"]["net_in_hand_profit"],
                "post_tax_roi_pct": post_tax_roi,
                "target_price": sim["base_case"]["target_price"],
                "primary_catalyst": news["primary_catalyst"],
                "technical_signal": "20D Breakout Active" if technicals["breakout"]["is_breakout"] else ("Golden Cross (50>200 EMA)" if technicals["ema_analysis"]["is_golden_cross"] else "RSI Accumulation"),
                "factors_passed": {
                    "delivery": is_delivery_pass,
                    "piotroski": is_piotroski_pass,
                    "technicals": is_technical_pass,
                    "news_sentiment": is_news_pass,
                    "post_tax_roi": is_roi_pass
                }
            })
        except Exception:
            continue

    # Sort descending by composite radar score, then post-tax ROI
    ranked_stocks.sort(key=lambda x: (x["radar_score"], x["post_tax_roi_pct"]), reverse=True)
    return ranked_stocks[:6]
