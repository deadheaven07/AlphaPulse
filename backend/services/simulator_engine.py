import math
from typing import Dict, Any, List
from backend.services.market_data import get_stock_quote

def project_simulation(
    symbol: str,
    capital: float,
    horizon_months: int,
    risk_tolerance: str = "MODERATE"
) -> Dict[str, Any]:
    """
    Calculate dynamic quantitative return projections across Bull, Base, Bear scenarios.
    """
    quote = get_stock_quote(symbol)
    current_price = float(quote["price"])
    company_name = quote.get("company_name", symbol)
    pe = float(quote.get("pe", 20.0))
    roce = float(quote.get("roce", 15.0))
    beta = float(quote.get("beta", 1.0))

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

    # Risk Profile Coefficients
    risk_mode = risk_tolerance.upper()
    if risk_mode == "CONSERVATIVE":
        bull_cagr = 0.20 + (roce / 300.0)
        base_cagr = 0.12 + (roce / 500.0)
        bear_drawdown_rate = -0.08 * beta
    elif risk_mode == "AGGRESSIVE":
        bull_cagr = 0.38 + (roce / 150.0)
        base_cagr = 0.22 + (roce / 250.0)
        bear_drawdown_rate = -0.18 * beta
    else: # MODERATE
        bull_cagr = 0.28 + (roce / 200.0)
        base_cagr = 0.16 + (roce / 350.0)
        bear_drawdown_rate = -0.12 * beta

    # Apply compounding for holding horizon
    if horizon_months < 12:
        # For short horizons, account for near-term momentum and annualized fraction
        bull_roi_pct = round(((1 + bull_cagr) ** t_years - 1) * 100 + (2.0 if beta > 1 else 1.0), 2)
        base_roi_pct = round(((1 + base_cagr) ** t_years - 1) * 100, 2)
        # Bear drawdown is capped trailing stop loss
        bear_roi_pct = round(bear_drawdown_rate * 100 * math.sqrt(t_years), 2)
    else:
        # Multi-year compound expansion
        bull_roi_pct = round(((1 + bull_cagr) ** t_years - 1) * 100, 2)
        base_roi_pct = round(((1 + base_cagr) ** t_years - 1) * 100, 2)
        bear_roi_pct = round(max(bear_drawdown_rate * 100, -28.0), 2)

    # Target Prices
    bull_target = round(current_price * (1 + bull_roi_pct / 100.0), 2)
    base_target = round(current_price * (1 + base_roi_pct / 100.0), 2)
    bear_target = round(current_price * (1 + bear_roi_pct / 100.0), 2)

    # Absolute Net Profit in INR
    bull_profit = round(shares * (bull_target - current_price), 2) if shares > 0 else 0.0
    base_profit = round(shares * (base_target - current_price), 2) if shares > 0 else 0.0
    bear_profit = round(shares * (bear_target - current_price), 2) if shares > 0 else 0.0

    # Total Portfolio Final Values (Deployed + Cash + Profit)
    bull_total_value = round(capital + bull_profit, 2)
    base_total_value = round(capital + base_profit, 2)
    bear_total_value = round(capital + bear_profit, 2)

    # Expected Value weighted: 25% Bull, 50% Base, 25% Bear
    expected_profit = round((bull_profit * 0.25) + (base_profit * 0.50) + (bear_profit * 0.25), 2)
    expected_roi_pct = round((expected_profit / deployed_capital) * 100, 2) if deployed_capital > 0 else 0.0
    
    # Risk-Reward Ratio (Upside gain to downside risk)
    downside_risk = abs(bear_profit) if abs(bear_profit) > 0 else 1.0
    risk_reward_ratio = round(bull_profit / downside_risk, 2) if bull_profit > 0 else 1.0

    # Multi-step Growth Trajectory Points (Month 0 to horizon_months)
    num_steps = min(horizon_months, 12)
    if num_steps < 3:
        num_steps = 3
    
    trajectory = []
    for step in range(num_steps + 1):
        m = (step / num_steps) * horizon_months
        t_frac = m / 12.0
        
        # Intermediate compounding
        bull_step_val = capital + (shares * current_price * (((1 + bull_cagr) ** t_frac - 1) if t_frac > 0 else 0))
        base_step_val = capital + (shares * current_price * (((1 + base_cagr) ** t_frac - 1) if t_frac > 0 else 0))
        bear_step_val = capital + (shares * current_price * ((bear_drawdown_rate * math.sqrt(t_frac if t_frac > 0 else 0.01)) if t_frac > 0 else 0))
        
        label = f"Month {round(m, 1) if m % 1 != 0 else int(m)}"
        if m == 0:
            label = "Start"
        elif m == horizon_months:
            label = f"M{int(horizon_months)} (End)"

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
            "trailing_stop_pct": abs(bear_roi_pct),
            "probability_pct": 25
        },
        "expected_value": {
            "expected_profit": expected_profit,
            "expected_roi_pct": expected_roi_pct,
            "risk_reward_ratio": risk_reward_ratio,
            "expected_total_value": round(capital + expected_profit, 2)
        },
        "trajectory": trajectory,
        "metrics": {
            "pe": pe,
            "roce": roce,
            "beta": beta
        }
    }
