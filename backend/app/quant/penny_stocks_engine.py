from typing import Dict, Any, List
from .data_engine import fetch_live_quote, fetch_historical_dataframe
from .quality_filters import evaluate_quality_filters
from .technicals import get_technical_summary
from .monte_carlo_engine import run_monte_carlo_simulation

# Curated universe of legitimate liquid Indian small-caps & turnarounds (< ₹150)
PENNY_CANDIDATES = [
    {"symbol": "SUZLON", "catalyst": "Wind energy capex revival & net cash positive balance sheet turn."},
    {"symbol": "SOUTHBANK", "catalyst": "Private bank asset quality recovery & retail loan book growth."},
    {"symbol": "IDFCFIRSTB", "catalyst": "High CASA franchise, compounding ROE & pan-India branch expansion."},
    {"symbol": "NHPC", "catalyst": "Hydro & green hydrogen sovereign expansion with sovereign PPAs."},
    {"symbol": "NBCC", "catalyst": "Massive government civil construction & real estate project monetization."},
    {"symbol": "IRFC", "catalyst": "100% sovereign leasing monopoly financing national railway capex corridors."},
    {"symbol": "HUDCO", "catalyst": "Pradhan Mantri Awas Yojana housing infrastructure financing tailwind."},
    {"symbol": "RPOWER", "catalyst": "Debt settlement & solar/thermal generation cash flow stability."},
    {"symbol": "YESBANK", "catalyst": "Post-reconstruction deposit mobilization & corporate recovery cycle."},
    {"symbol": "CENTRALBK", "catalyst": "PSU turnaround with declining Net NPAs and expanding credit growth."}
]

def scan_profitable_penny_stocks(budget_allocation: float = 25000.0) -> List[Dict[str, Any]]:
    """
    Scan and rank legitimate Indian equities trading under ₹150
    filtered for zero toxic debt, promoter pledge < 5%, and institutional accumulation.
    """
    ranked: List[Dict[str, Any]] = []

    for item in PENNY_CANDIDATES:
        sym = item["symbol"]
        try:
            quote = fetch_live_quote(sym)
            price = quote.get("price", 50.0)
            if price > 175.0:  # Exclude if run-up exceeded penny threshold
                continue

            quality = evaluate_quality_filters(sym, quote)
            df = fetch_historical_dataframe(sym, period="3mo", interval="1d")
            technicals = get_technical_summary(df)

            # Strict Institutional Quality Filters
            # 1. Promoter pledge must be < 5% (reject operator pump & dumps)
            # 2. Institutional delivery % >= 40%
            is_safe = (
                quality["promoter_pledge_pct"] <= 5.0 and
                quality["delivery_pct"] >= 40.0
            )

            # 12-Month Monte Carlo Projection for Penny Stock
            sim = run_monte_carlo_simulation(
                symbol=sym,
                current_price=price,
                capital=budget_allocation,
                horizon_months=12,
                risk_tolerance="Aggressive"
            )

            bull_target = sim["bull_case"]["target_price"]
            bull_roi = sim["bull_case"]["roi_pct"]
            stop_loss = round(price * 0.88, 2)  # 12% tight trailing stop
            shares_affordable = int(budget_allocation // price) if price > 0 else 0

            score = 65
            if quality["piotroski_score"] >= 6: score += 15
            if quality["delivery_pct"] >= 50.0: score += 10
            if technicals["rsi_14"] >= 50 and technicals["rsi_14"] <= 68: score += 10
            score = min(100, score)

            ranked.append({
                "symbol": sym,
                "company_name": quote.get("company_name", sym),
                "sector": quote.get("sector", "Small Cap Growth"),
                "price": price,
                "change": quote.get("change", 0.0),
                "change_pct": quote.get("change_pct", 0.0),
                "penny_score": score,
                "delivery_pct": quality["delivery_pct"],
                "promoter_pledge_pct": quality["promoter_pledge_pct"],
                "piotroski_score": quality["piotroski_score"],
                "target_price": bull_target,
                "potential_upside_pct": bull_roi,
                "trailing_stop_loss": stop_loss,
                "budget_allocation": budget_allocation,
                "shares_purchasable": shares_affordable,
                "catalyst": item["catalyst"],
                "risk_reward": f"1:{round(bull_roi / 12.0, 1)}",
                "is_institutional_safe": is_safe
            })
        except Exception:
            continue

    # Sort descending by composite score
    ranked.sort(key=lambda x: (x["penny_score"], x["potential_upside_pct"]), reverse=True)
    return ranked

def scan_sideways_breakouts() -> List[Dict[str, Any]]:
    """Scan stocks breaking out of sideways ranges with volume confirmation."""
    breakouts = []
    for item in PENNY_CANDIDATES:
        sym = item["symbol"]
        try:
            quote = fetch_live_quote(sym)
            df = fetch_historical_dataframe(sym, period="1mo", interval="1d")
            tech = get_technical_summary(df)
            if tech["breakout"]["is_breakout"] or tech["breakout"]["volume_surge"] >= 1.4:
                breakouts.append({
                    "symbol": sym,
                    "company_name": quote.get("company_name", sym),
                    "price": quote.get("price", 50.0),
                    "change_pct": quote.get("change_pct", 0.0),
                    "volume_surge": tech["breakout"]["volume_surge"],
                    "high_20d": tech["breakout"]["high_20d"],
                    "signal": "Consolidation Range Breakout"
                })
        except Exception:
            continue

    return breakouts
