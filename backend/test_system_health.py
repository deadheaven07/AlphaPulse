"""
AlphaPulse India Pro — Master Self-Diagnostic & System Verification Suite
Run via: python backend/test_system_health.py or python -m backend.test_system_health
"""

import sys
import time
import os
from datetime import datetime
from typing import Dict, Any, List

# ANSI Color formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

def print_header():
    print(f"\n{CYAN}{BOLD}{'=' * 75}{RESET}")
    print(f"{CYAN}{BOLD}  🔬 ALPHAPULSE INDIA PRO — MASTER SYSTEM HEALTH & QUANT SUITE{RESET}")
    print(f"{DIM}  Timestamp: {datetime.now().strftime('%d %b %Y, %H:%M:%S IST')} | Environment: Local Workstation{RESET}")
    print(f"{CYAN}{BOLD}{'=' * 75}{RESET}\n")

def run_checkpoint_1() -> Dict[str, Any]:
    """Checkpoint 1: API & Health Service"""
    t0 = time.time()
    from backend.app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Health endpoint returned status {resp.status_code}"
    data = resp.json()
    assert data.get("status") == "healthy", "Status not healthy"
    assert "app" in data, "App name missing"
    assert "engine_sources" in data and len(data["engine_sources"]) >= 5, "Engine sources missing"

    return {
        "name": "1. API Health & Subsystem Discovery",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": f"Status 200 OK | {len(data['engine_sources'])} quant engines operational"
    }

def run_checkpoint_2() -> Dict[str, Any]:
    """Checkpoint 2: Real-Time Stock Quotes & Safe Parsing"""
    t0 = time.time()
    from backend.app.quant.data_engine import fetch_live_quote

    # Test top liquid NSE stocks including banking/PSU
    quotes = [fetch_live_quote("TATAMOTORS"), fetch_live_quote("SBIN"), fetch_live_quote("BEL")]
    for q in quotes:
        assert q["price"] > 0, f"Invalid price for {q['symbol']}"
        assert q["high_52w"] >= q["low_52w"], f"52W High < Low for {q['symbol']}"
        assert isinstance(q["roce"], (int, float)), f"ROCE must not be None for {q['symbol']}"
        assert isinstance(q["roe"], (int, float)), f"ROE must not be None for {q['symbol']}"

    return {
        "name": "2. Live Market Feeds & Null-Safe Parsing",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": f"Verified live quotes & null-safe ROE/ROCE parsing for {len(quotes)} tickers"
    }

def run_checkpoint_3() -> Dict[str, Any]:
    """Checkpoint 3: Intraday 1D Timestamps Formatting (%H:%M)"""
    t0 = time.time()
    from backend.app.quant.data_engine import fetch_historical_dataframe
    from backend.app.api.routes_stocks import get_candles

    candles = get_candles(symbol="RELIANCE", period="1d", interval="5m")
    assert len(candles) > 0, "No intraday candles returned"

    # Verify timestamps have hours and minutes without duplicate adjacent labels
    timestamps = [c["date"] for c in candles]
    if len(timestamps) >= 2:
        assert timestamps[0] != timestamps[1], f"Adjacent timestamps are identical: {timestamps[0]}"
        # Ensure timestamp has ':' (e.g. 09:15)
        assert ":" in timestamps[0], f"Timestamp missing hour/minute delimiter: {timestamps[0]}"

    return {
        "name": "3. 1D Intraday 5M Timestamps (%H:%M)",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": f"Rendered {len(candles)} intraday 5m candle points with discrete time ticks"
    }

def run_checkpoint_4() -> Dict[str, Any]:
    """Checkpoint 4: Monte Carlo Probability Weighting & Mathematics"""
    t0 = time.time()
    from backend.app.quant.monte_carlo_engine import run_monte_carlo_simulation

    mc = run_monte_carlo_simulation(
        symbol="BEL",
        current_price=300.0,
        capital=100000.0,
        horizon_months=12,
        risk_tolerance="Moderate"
    )

    bull_profit = mc["bull_case"]["net_in_hand_profit"]
    base_profit = mc["base_case"]["net_in_hand_profit"]
    bear_profit = mc["bear_case"]["net_in_hand_profit"]
    expected_profit = mc["expected_value"]["expected_net_profit"]
    
    # Mathematical probability weighting check (25% Bull, 50% Base, 25% Bear)
    calc_expected = round((0.25 * bull_profit) + (0.50 * base_profit) + (0.25 * bear_profit), 2)
    assert expected_profit == calc_expected, f"Bull probability weighting flawed: {expected_profit} != {calc_expected}"
    assert mc["bull_case"]["target_price"] > mc["base_case"]["target_price"] > mc["bear_case"]["target_price"], "Target hierarchy invalid"
    assert mc["expected_value"]["var_90_pct"] >= 0, "VaR must be non-negative"

    return {
        "name": "4. Monte Carlo 1,000 Paths & Probability Weights",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": f"Bull: ₹{bull_profit:,.2f} | Base: ₹{base_profit:,.2f} | Expected: ₹{expected_profit:,.2f}"
    }

def run_checkpoint_5() -> Dict[str, Any]:
    """Checkpoint 5: Indian Statutory Taxes & Charges (Current Statutory Regime)"""
    t0 = time.time()
    from backend.app.quant.taxes_charges import calculate_indian_taxes_and_charges

    # STCG (< 12 months, 20% on ₹50,000 pre-friction gain)
    # Buy 1000 shares @ 100 = 100,000. Sell @ 150 = 150,000. Pre-tax gain = 49,824.55 -> 20% = 9,964.91
    stcg = calculate_indian_taxes_and_charges(buy_price=100.0, sell_price=150.0, shares=1000, holding_months=6)
    assert abs(stcg["capital_gains_tax"] - 9964.91) < 1.0, f"STCG 20% calculation mismatch: got {stcg['capital_gains_tax']}"
    assert stcg["stt"] > 0, "STT must be non-zero"

    # LTCG (>= 12 months, 12.5% on gains exceeding ₹1.25L exemption)
    # Buy 1000 shares @ 100 = 100,000. Sell @ 300 = 300,000.
    ltcg = calculate_indian_taxes_and_charges(buy_price=100.0, sell_price=300.0, shares=1000, holding_months=12)
    assert ltcg["capital_gains_tax"] > 0, "LTCG tax must be computed on gains > 1.25L"
    assert ltcg["net_in_hand_profit"] > 0, "Net profit must be positive"

    return {
        "name": "5. Indian Post-Tax Engine (STT/STCG/LTCG)",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": "Current statutory compliance: STCG 20%, LTCG 12.5% (exemption ₹1.25L), STT 0.1%"
    }

def run_checkpoint_6() -> Dict[str, Any]:
    """Checkpoint 6: Dynamic Future Dividend Roadmap"""
    t0 = time.time()
    from backend.app.quant.dividend_engine import analyze_stock_dividend, get_top_dividend_yielders

    div = analyze_stock_dividend("COALINDIA", 100000.0)
    now_str = datetime.now().strftime("%Y-%m-%d")
    
    assert div["next_ex_date"] > now_str, f"Ex-date {div['next_ex_date']} is in the past! (Current: {now_str})"
    assert div["next_record_date"] > div["next_ex_date"], "Record date must be after ex-date"
    assert div["expected_annual_cash"] > 0, "Expected cash must be positive"
    assert div["dividend_yield_pct"] >= 5.0, "Coal India yield benchmark failed"
    assert len(div["timeline_steps"]) == 4, "Must contain 4 timeline milestones"

    top_yielders = get_top_dividend_yielders()
    assert len(top_yielders) >= 5, "Must return ranked dividend champions"

    return {
        "name": "6. Dynamic Forward Dividend Schedule",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": f"Upcoming Ex-Date: {div['next_ex_date']} (Yield: {div['dividend_yield_pct']}%, Cash: ₹{div['expected_annual_cash']:,.2f})"
    }

def run_checkpoint_7() -> Dict[str, Any]:
    """Checkpoint 7: Real-Time News & Sentiment Loss-Risk Meter"""
    t0 = time.time()
    from backend.app.quant.news_engine import analyze_stock_news_sentiment

    news = analyze_stock_news_sentiment("TATAMOTORS")
    assert news["total_news_analyzed"] > 0, "No news analyzed"
    assert -1.0 <= news["sentiment_score"] <= 1.0, f"Invalid sentiment score: {news['sentiment_score']}"
    assert round(news["risk_of_loss_pct"] + news["win_probability_pct"], 1) == 100.0, "Probability distribution must sum to 100%"
    assert len(news["primary_catalyst"]) > 5, "Primary catalyst missing"

    return {
        "name": "7. Live News NLP & Loss Risk Meter",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": f"{news['total_news_analyzed']} live articles | Win Prob: {news['win_probability_pct']}% | Score: {news['sentiment_score']}"
    }

def run_checkpoint_8() -> Dict[str, Any]:
    """Checkpoint 8: Real-Time 5-Factor KPI Radar"""
    t0 = time.time()
    from backend.app.quant.radar_engine import scan_real_time_kpi_radar

    radar = scan_real_time_kpi_radar(capital_reference=250000.0)
    assert len(radar) >= 3, "Radar returned insufficient stocks"
    top_stock = radar[0]
    assert top_stock["radar_score"] > 0, "Radar score missing"
    assert top_stock["delivery_pct"] >= 0, "Delivery pct missing"
    assert top_stock["piotroski_score"] >= 0, "Piotroski score missing"
    assert "post_tax_net_gain_inr" in top_stock, "Post-tax net gain missing"

    return {
        "name": "8. Real-Time 5-Factor KPI Stocks Radar",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": f"Ranked {len(radar)} breakout stocks for ₹2.5L base (Top: {top_stock['symbol']} Score {top_stock['radar_score']}/100)"
    }

def run_checkpoint_9() -> Dict[str, Any]:
    """Checkpoint 9: Edge Cases & Resilient Error Handling"""
    t0 = time.time()
    from backend.app.quant.data_engine import fetch_live_quote, fetch_historical_dataframe
    from backend.app.quant.monte_carlo_engine import run_monte_carlo_simulation
    from backend.app.quant.technicals import calculate_ema_cross, calculate_rsi

    # 1. Invalid ticker
    fallback_q = fetch_live_quote("NON_EXISTENT_SYMBOL_XYZ")
    assert fallback_q["price"] > 0, "Invalid ticker fallback failed"

    # 2. Minimum capital simulation
    min_sim = run_monte_carlo_simulation("BEL", 300.0, 100.0, 1)
    assert min_sim["deployed_capital"] >= 0, "Low capital simulation failed"

    # 3. Short dataframe technicals
    short_df = fetch_historical_dataframe("BEL", period="5d", interval="1d")
    ema_res = calculate_ema_cross(short_df)
    assert "is_golden_cross" in ema_res, "Short dataframe EMA crashed"
    rsi_res = calculate_rsi(short_df)
    assert 0 <= rsi_res <= 100, "Short dataframe RSI crashed"

    return {
        "name": "9. Edge Cases & Resilient Fallbacks",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": "Protected against invalid symbols, boundary capitals, and short candle history"
    }

def run_checkpoint_10() -> Dict[str, Any]:
    """Checkpoint 10: In-Memory Diagnostics Route & Contract Parity"""
    t0 = time.time()
    from backend.app.api.routes_diagnostics import run_diagnostics_suite

    diag = run_diagnostics_suite()
    assert diag["overall_status"] == "HEALTHY", f"Diagnostics status not healthy: {diag['overall_status']}"
    assert diag["total_checks"] >= 8, "Insufficient checks in self-test suite"
    assert diag["failed"] == 0, f"{diag['failed']} diagnostic checks failed"

    return {
        "name": "10. In-App Diagnostics Route & Contract Parity",
        "status": "PASS",
        "latency_ms": round((time.time() - t0) * 1000, 1),
        "details": f"REST endpoint /api/diagnostics/self-test verified in {diag['total_duration_ms']}ms"
    }

def run_full_suite() -> bool:
    print_header()

    checkpoints = [
        run_checkpoint_1,
        run_checkpoint_2,
        run_checkpoint_3,
        run_checkpoint_4,
        run_checkpoint_5,
        run_checkpoint_6,
        run_checkpoint_7,
        run_checkpoint_8,
        run_checkpoint_9,
        run_checkpoint_10,
    ]

    results: List[Dict[str, Any]] = []
    all_passed = True

    print(f"  {BOLD}{'No. Checkpoint Name':<50} {'Latency':<12} {'Status':<8}{RESET}")
    print(f"  {DIM}{'─' * 72}{RESET}")

    for idx, fn in enumerate(checkpoints, 1):
        try:
            res = fn()
            status_color = GREEN if res["status"] == "PASS" else RED
            print(f"  {res['name']:<50} {str(res['latency_ms']) + 'ms':<12} {status_color}{BOLD}{res['status']}{RESET}")
            results.append(res)
        except Exception as e:
            all_passed = False
            err_res = {
                "name": f"Checkpoint {idx}",
                "status": "FAIL",
                "latency_ms": 0.0,
                "error": str(e)
            }
            print(f"  {err_res['name']:<50} {'0.0ms':<12} {RED}{BOLD}FAIL{RESET}")
            print(f"    {RED}↳ Error: {str(e)}{RESET}")
            results.append(err_res)

    print(f"  {DIM}{'─' * 72}{RESET}\n")

    passed_count = sum(1 for r in results if r["status"] == "PASS")
    total_count = len(results)

    # Summary Box
    print(f"{BOLD}┌────────────────────────────────────────────────────────────────────────┐{RESET}")
    if all_passed:
        print(f"{BOLD}│  {GREEN}🌟 OVERALL SYSTEM STATUS: {passed_count}/{total_count} PASSING (ALL SYSTEMS OPERATIONAL){RESET}{BOLD}   │{RESET}")
    else:
        print(f"{BOLD}│  {RED}⚠️  OVERALL SYSTEM STATUS: {passed_count}/{total_count} PASSING ({total_count - passed_count} CHECKS FAILED){RESET}{BOLD}   │{RESET}")
    print(f"{BOLD}└────────────────────────────────────────────────────────────────────────┘{RESET}\n")

    return all_passed

if __name__ == "__main__":
    success = run_full_suite()
    sys.exit(0 if success else 1)
