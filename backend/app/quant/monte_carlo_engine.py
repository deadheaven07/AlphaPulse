import math
import numpy as np
from typing import Dict, Any, List
from .taxes_charges import calculate_indian_taxes_and_charges

def run_monte_carlo_simulation(
    symbol: str,
    current_price: float,
    capital: float,
    horizon_months: int,
    risk_tolerance: str = "Moderate",
    annual_volatility: float = 0.24,
    base_annual_cagr: float = 0.16,
    num_paths: int = 1000,
    random_seed: int = 42
) -> Dict[str, Any]:
    """
    1,000-path stochastic Monte Carlo simulation using Geometric Brownian Motion (GBM).
    Calculates 90th percentile (Bull), 50th percentile (Base), and 10th percentile (Bear/VaR)
    plus full post-tax Indian tax and statutory friction deductions.
    """
    if current_price <= 0 or capital <= 0:
        raise ValueError("Price and capital must be positive.")

    horizon_months = max(1, min(60, horizon_months))
    shares = int(capital // current_price)
    deployed_capital = round(shares * current_price, 2)
    cash_buffer = round(capital - deployed_capital, 2)

    # Risk adjustments to drift and volatility
    risk_multipliers = {
        "Conservative": {"drift": 0.85, "vol": 0.85},
        "Moderate": {"drift": 1.00, "vol": 1.00},
        "Aggressive": {"drift": 1.25, "vol": 1.20},
    }
    rm = risk_multipliers.get(risk_tolerance, risk_multipliers["Moderate"])
    mu = base_annual_cagr * rm["drift"]
    sigma = annual_volatility * rm["vol"]

    # Generate 1,000 Geometric Brownian Motion stochastic paths
    np.random.seed(random_seed)
    dt = 1.0 / 12.0  # Monthly steps
    months = np.arange(0, horizon_months + 1)
    n_steps = horizon_months

    # Standard Normal increments shape: (num_paths, n_steps)
    z = np.random.standard_normal((num_paths, n_steps))
    drift = (mu - 0.5 * (sigma ** 2)) * dt
    diffusion = sigma * math.sqrt(dt) * z

    log_returns = np.zeros((num_paths, n_steps + 1))
    log_returns[:, 1:] = np.cumsum(drift + diffusion, axis=1)

    # Price paths: shape (num_paths, n_steps + 1)
    simulated_prices = current_price * np.exp(log_returns)

    # Calculate percentiles across all 1,000 paths for each month
    p10_trajectory = np.percentile(simulated_prices, 10, axis=0)  # Bear (10th percentile)
    p25_trajectory = np.percentile(simulated_prices, 25, axis=0)
    p50_trajectory = np.percentile(simulated_prices, 50, axis=0)  # Base (Median)
    p75_trajectory = np.percentile(simulated_prices, 75, axis=0)
    p90_trajectory = np.percentile(simulated_prices, 90, axis=0)  # Bull (90th percentile)

    # Empirical probabilities from the 1000 simulated paths (final month)
    p10_count = int(np.sum(simulated_prices[:, -1] <= p10_trajectory[-1]))
    p25_count = int(np.sum(simulated_prices[:, -1] <= p25_trajectory[-1]))
    p50_count = int(np.sum(simulated_prices[:, -1] <= p50_trajectory[-1]))
    p75_count = int(np.sum(simulated_prices[:, -1] <= p75_trajectory[-1]))
    p90_count = int(np.sum(simulated_prices[:, -1] <= p90_trajectory[-1]))

    empirical_p10 = round(p10_count / num_paths, 3)
    empirical_p25 = round(p25_count / num_paths, 3)
    empirical_p50 = round(p50_count / num_paths, 3)
    empirical_p75 = round(p75_count / num_paths, 3)
    empirical_p90 = round(p90_count / num_paths, 3)

    # Final prices at target horizon
    final_bull_price = round(float(p90_trajectory[-1]), 2)
    final_base_price = round(float(p50_trajectory[-1]), 2)
    final_bear_price = round(float(p10_trajectory[-1]), 2)

    # Post-tax tax and statutory calculations for each scenario
    bull_tax = calculate_indian_taxes_and_charges(current_price, final_bull_price, shares, horizon_months)
    base_tax = calculate_indian_taxes_and_charges(current_price, final_base_price, shares, horizon_months)
    bear_tax = calculate_indian_taxes_and_charges(current_price, final_bear_price, shares, horizon_months)

    # Build Monthly Trajectory for interactive charts
    trajectory_points: List[Dict[str, Any]] = []
    for idx, m in enumerate(months):
        p10 = round(float(p10_trajectory[idx]), 2)
        p50 = round(float(p50_trajectory[idx]), 2)
        p90 = round(float(p90_trajectory[idx]), 2)

        p10_val = round((shares * p10) + cash_buffer, 2)
        p50_val = round((shares * p50) + cash_buffer, 2)
        p90_val = round((shares * p90) + cash_buffer, 2)

        trajectory_points.append({
            "month": int(m),
            "label": f"M{m}" if m > 0 else "Start",
            "bull_price": p90,
            "base_price": p50,
            "bear_price": p10,
            "bull_val": p90_val,
            "base_val": p50_val,
            "bear_val": p10_val,
        })

    # Expected Value (Probability weighted: 25% Bull, 50% Base, 25% Bear)
    expected_profit = round(
        (0.25 * bull_tax["net_in_hand_profit"]) +
        (0.50 * base_tax["net_in_hand_profit"]) +
        (0.25 * bear_tax["net_in_hand_profit"]),
        2
    )
    expected_roi_pct = round((expected_profit / deployed_capital) * 100, 2) if deployed_capital > 0 else 0.0

    # Probability of positive post-tax ROI across all 1000 paths
    profitable_paths = 0
    for i in range(num_paths):
        final_price = simulated_prices[i, -1]
        tax_result = calculate_indian_taxes_and_charges(
            current_price, final_price, shares, horizon_months
        )
        if tax_result["net_in_hand_profit"] > 0:
            profitable_paths += 1

    probability_positive_roi = round(profitable_paths / num_paths, 3)
    probability_100x_return = round(
        np.sum(simulated_prices[:, -1] >= current_price * 2.0) / num_paths, 3
    )

    # Profit factor: gross positive profit / absolute gross negative profit
    total_gross_positive = sum(max(t["gross_profit"], 0) for t in [bull_tax, base_tax, bear_tax])
    total_gross_negative = sum(abs(min(t["gross_profit"], 0)) for t in [bull_tax, base_tax, bear_tax])
    profit_factor = round(
        total_gross_positive / max(0.01, total_gross_negative), 2
    )

    risk_downside = abs(min(0.0, bear_tax["net_in_hand_profit"]))
    reward_upside = max(0.0, bull_tax["net_in_hand_profit"])
    rr_ratio = round(reward_upside / max(1.0, risk_downside), 2)

    return {
        "symbol": symbol,
        "capital": capital,
        "deployed_capital": deployed_capital,
        "cash_buffer": cash_buffer,
        "shares": shares,
        "current_price": current_price,
        "horizon_months": horizon_months,
        "risk_tolerance": risk_tolerance,
        "num_simulated_paths": num_paths,
        "annual_volatility_pct": round(sigma * 100, 1),
        "annual_drift_pct": round(mu * 100, 1),
        "base_case": {
            "percentile": "50th (Median)",
            "target_price": final_base_price,
            "gross_profit": base_tax["gross_profit"],
            "net_in_hand_profit": base_tax["net_in_hand_profit"],
            "roi_pct": base_tax["effective_post_tax_roi_pct"],
            "total_value": round(deployed_capital + base_tax["net_in_hand_profit"] + cash_buffer, 2),
            "taxes_and_charges": base_tax
        },
        "bull_case": {
            "percentile": "90th (Upside Ceiling)",
            "target_price": final_bull_price,
            "gross_profit": bull_tax["gross_profit"],
            "net_in_hand_profit": bull_tax["net_in_hand_profit"],
            "roi_pct": bull_tax["effective_post_tax_roi_pct"],
            "total_value": round(deployed_capital + bull_tax["net_in_hand_profit"] + cash_buffer, 2),
            "taxes_and_charges": bull_tax
        },
        "bear_case": {
            "percentile": "10th (Value at Risk / VaR)",
            "target_price": final_bear_price,
            "gross_profit": bear_tax["gross_profit"],
            "net_in_hand_profit": bear_tax["net_in_hand_profit"],
            "roi_pct": bear_tax["effective_post_tax_roi_pct"],
            "total_value": round(deployed_capital + bear_tax["net_in_hand_profit"] + cash_buffer, 2),
            "taxes_and_charges": bear_tax
        },
        "expected_value": {
            "expected_net_profit": expected_profit,
            "expected_roi_pct": expected_roi_pct,
            "calculation_method": "probability_weighted_average_(25%_bull + 50%_base + 25%_bear)_post_tax",
            "percentile_probabilities": {
                "theoretical": {
                    "p10": 0.10, "p25": 0.25, "p50": 0.50, "p75": 0.75, "p90": 0.90
                },
                "empirical_from_1000_paths": {
                    "p10": empirical_p10, "p25": empirical_p25,
                    "p50": empirical_p50, "p75": empirical_p75, "p90": empirical_p90
                }
            },
            "probability_positive_post_tax_roi": probability_positive_roi,
            "probability_100x_return": probability_100x_return,
            "profit_factor": profit_factor,
            "var_90_pct": abs(bear_tax["net_in_hand_profit"]),
            "confidence_level": "90% Empirical Confidence (from 1000 paths)"
        },
        "trajectory": trajectory_points
    }
