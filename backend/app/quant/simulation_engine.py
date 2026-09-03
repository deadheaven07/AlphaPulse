import math
from typing import Dict, Any, List
from backend.app.quant.data_engine import fetch_live_quote, fetch_historical_dataframe
from backend.app.quant.technicals import get_technical_summary
from backend.app.quant.sector_rrg import analyze_sector_rrg

def run_profit_simulation(
    symbol: str,
    capital: float,
    horizon_months: int,
    risk_tolerance: str = "Moderate"
) -> Dict[str, Any]:
    """
    Simulate holding period returns with Bull/Base/Bear scenarios incorporating technical momentum and RRG quadrant.
    """
    quote = fetch_live_quote(symbol)
    df = fetch_historical_dataframe(symbol)
    technicals = get_technical_summary(df)
    rrg = analyze_sector_rrg(quote.get("sector", "General"))

    current_price = float(quote["price"])
    company_name = quote.get("company_name", symbol)
    roce = float(quote.get("roce", 15.0))
    beta = float(quote.get("beta", 1.0))
    cagr_3y = float(quote.get("cagr_3y", 16.0))

    if capital <= 0:
        capital = 50000.0
    if current_price <= 0:
        current_price = 100.0
    if horizon_months <= 0:
        horizon_months = 12

    # Share Allocation
    shares = math.floor(capital / current_price)
    deployed_capital = round(shares * current_price, 2)
    cash_buffer = round(capital - deployed_capital, 2)

    # Time in years
    t_years = horizon_months / 12.0

    # Technical and RRG momentum boost factors
    tech_boost = (technicals["technical_score"] - 50) / 300.0  # -0.10 to +0.16
    rrg_boost = 0.04 if rrg["quadrant"] == "Leading" else (0.02 if rrg["quadrant"] == "Improving" else (-0.02 if rrg["quadrant"] == "Lagging" else 0.0))

    # Base CAGR
    base_annual_rate = max(0.10, (cagr_3y / 100.0) * 0.75 + tech_boost + rrg_boost)
    
    # Risk Tolerance Multipliers
    risk_mode = risk_tolerance.capitalize()
    if risk_mode == "Conservative":
        bull_annual_rate = base_annual_rate * 1.35
        base_annual_rate = base_annual_rate * 0.90
        bear_drawdown_rate = -0.07 * beta
    elif risk_mode == "Aggressive":
        bull_annual_rate = base_annual_rate * 1.95 + (roce / 200.0)
        base_annual_rate = base_annual_rate * 1.15
        bear_drawdown_rate = -0.16 * beta
    else:  # Moderate
        bull_annual_rate = base_annual_rate * 1.60
        base_annual_rate = base_annual_rate * 1.00
        bear_drawdown_rate = -0.11 * beta

    # Compounding over horizon
    if horizon_months < 12:
        bull_roi_pct = round(((1 + bull_annual_rate) ** t_years - 1) * 100 + (1.5 if beta > 1 else 0.5), 2)
        base_roi_pct = round(((1 + base_annual_rate) ** t_years - 1) * 100, 2)
        bear_roi_pct = round(bear_drawdown_rate * 100 * math.sqrt(t_years), 2)
    else:
        bull_roi_pct = round(((1 + bull_annual_rate) ** t_years - 1) * 100, 2)
        base_roi_pct = round(((1 + base_annual_rate) ** t_years - 1) * 100, 2)
        bear_roi_pct = round(max(bear_drawdown_rate * 100, -25.0), 2)

    # Price targets
    bull_target = round(current_price * (1 + bull_roi_pct / 100.0), 2)
    base_target = round(current_price * (1 + base_roi_pct / 100.0), 2)
    bear_target = round(current_price * (1 + bear_roi_pct / 100.0), 2)

    # Profit calculations
    bull_profit = round(shares * (bull_target - current_price), 2) if shares > 0 else 0.0
    base_profit = round(shares * (base_target - current_price), 2) if shares > 0 else 0.0
    bear_profit = round(shares * (bear_target - current_price), 2) if shares > 0 else 0.0

    # Total Portfolio Final Values
    bull_total_value = round(capital + bull_profit, 2)
    base_total_value = round(capital + base_profit, 2)
    bear_total_value = round(capital + bear_profit, 2)

    # Expected value (25% Bull, 50% Base, 25% Bear)
    expected_profit = round((bull_profit * 0.25) + (base_profit * 0.50) + (bear_profit * 0.25), 2)
    expected_roi_pct = round((expected_profit / deployed_capital) * 100, 2) if deployed_capital > 0 else 0.0
    downside_risk = abs(bear_profit) if abs(bear_profit) > 0 else 1.0
    risk_reward_ratio = round(bull_profit / downside_risk, 2) if bull_profit > 0 else 1.0

    # Generate timeline points for chart
    num_steps = min(horizon_months, 12)
    if num_steps < 3:
        num_steps = 3
    
    trajectory: List[Dict[str, Any]] = []
    for step in range(num_steps + 1):
        m = (step / num_steps) * horizon_months
        t_frac = m / 12.0
        
        bull_step_val = capital + (shares * current_price * (((1 + bull_annual_rate) ** t_frac - 1) if t_frac > 0 else 0))
        base_step_val = capital + (shares * current_price * (((1 + base_annual_rate) ** t_frac - 1) if t_frac > 0 else 0))
        bear_step_val = capital + (shares * current_price * ((bear_drawdown_rate * math.sqrt(t_frac if t_frac > 0 else 0.01)) if t_frac > 0 else 0))
        
        label = f"Month {round(m, 1) if m % 1 != 0 else int(m)}"
        if m == 0:
            label = "Start"
        elif m == horizon_months:
            label = f"M{int(horizon_months)} (Target)"

        trajectory.append({
            "month": round(m, 1),
            "label": label,
            "bull_value": round(bull_step_val, 2),
            "base_value": round(base_step_val, 2),
            "bear_value": round(bear_step_val, 2),
        })

    return {
        "symbol": symbol.upper(),
        "company_name": company_name,
        "current_price": current_price,
        "capital": capital,
        "horizon_months": horizon_months,
        "risk_tolerance": risk_mode,
        "shares": shares,
        "deployed_capital": deployed_capital,
        "cash_buffer": cash_buffer,
        "bull_case": {
            "target_price": bull_target,
            "roi_pct": bull_roi_pct,
            "absolute_profit": bull_profit,
            "total_value": bull_total_value,
            "probability_pct": 25
        },
        "base_case": {
            "target_price": base_target,
            "roi_pct": base_roi_pct,
            "absolute_profit": base_profit,
            "total_value": base_total_value,
            "probability_pct": 50
        },
        "bear_case": {
            "target_price": bear_target,
            "roi_pct": bear_roi_pct,
            "absolute_profit": bear_profit,
            "total_value": bear_total_value,
            "stop_loss_price": bear_target,
            "probability_pct": 25
        },
        "expected_value": {
            "expected_profit": expected_profit,
            "expected_roi_pct": expected_roi_pct,
            "risk_reward_ratio": risk_reward_ratio,
            "expected_total_value": round(capital + expected_profit, 2)
        },
        "technicals": technicals,
        "sector_rrg": rrg,
        "trajectory": trajectory
    }
