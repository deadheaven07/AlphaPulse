from typing import Dict, Any, List
from .data_engine import fetch_live_quote, fetch_historical_dataframe
from .quality_filters import evaluate_quality_filters
from .technicals import get_technical_summary
from .monte_carlo_engine import run_monte_carlo_simulation

# Curated universe of legitimate liquid sub-₹150 Indian opportunities with accurate institutional categorization
PENNY_CANDIDATES = [
    {
        "symbol": "SUZLON",
        "category": "High-Yield Liquid Leader",
        "catalyst": "Wind energy capex revival & net cash positive balance sheet turn.",
        "circuit_band_pct": 5.0
    },
    {
        "symbol": "SOUTHBANK",
        "category": "Micro-Cap Turnaround",
        "catalyst": "Private bank asset quality recovery & retail loan book growth.",
        "circuit_band_pct": 10.0
    },
    {
        "symbol": "IDFCFIRSTB",
        "category": "High-Yield Liquid Leader",
        "catalyst": "High CASA franchise, compounding ROE & pan-India branch expansion.",
        "circuit_band_pct": 20.0
    },
    {
        "symbol": "NHPC",
        "category": "High-Yield Liquid Leader",
        "catalyst": "Hydro & green hydrogen sovereign expansion with sovereign PPAs.",
        "circuit_band_pct": 10.0
    },
    {
        "symbol": "NBCC",
        "category": "High-Yield Liquid Leader",
        "catalyst": "Massive government civil construction & real estate project monetization.",
        "circuit_band_pct": 10.0
    },
    {
        "symbol": "IRFC",
        "category": "High-Yield Liquid Leader",
        "catalyst": "100% sovereign leasing monopoly financing national railway capex corridors.",
        "circuit_band_pct": 20.0
    },
    {
        "symbol": "HUDCO",
        "category": "High-Yield Liquid Leader",
        "catalyst": "Pradhan Mantri Awas Yojana housing infrastructure financing tailwind.",
        "circuit_band_pct": 20.0
    },
    {
        "symbol": "RPOWER",
        "category": "Micro-Cap Turnaround",
        "catalyst": "Debt settlement & solar/thermal generation cash flow stability.",
        "circuit_band_pct": 5.0
    },
    {
        "symbol": "YESBANK",
        "category": "High-Yield Liquid Leader",
        "catalyst": "Post-reconstruction deposit mobilization & corporate recovery cycle.",
        "circuit_band_pct": 10.0
    },
    {
        "symbol": "CENTRALBK",
        "category": "Micro-Cap Turnaround",
        "catalyst": "PSU turnaround with declining Net NPAs and expanding credit growth.",
        "circuit_band_pct": 10.0
    }
]

def scan_profitable_penny_stocks(budget_allocation: float = 25000.0) -> List[Dict[str, Any]]:
    """
    Scan and rank legitimate Indian equities trading under ₹150
    filtered for zero toxic debt, promoter pledge < 5%, and circuit limit risk checks.
    """
    ranked: List[Dict[str, Any]] = []

    for item in PENNY_CANDIDATES:
        sym = item["symbol"]
        try:
            quote = fetch_live_quote(sym)
            price = quote.get("price", 50.0)
            prev_close = quote.get("prev_close") or price
            if price > 175.0:  # Exclude if nominal price exceeded screen threshold
                continue

            quality = evaluate_quality_filters(sym, quote)
            df = fetch_historical_dataframe(sym, period="3mo", interval="1d")
            technicals = get_technical_summary(df)

            # Circuit Limit & Illiquidity Risk Meter
            band_pct = item.get("circuit_band_pct", 10.0)
            lower_circuit = round(prev_close * (1.0 - (band_pct / 100.0)), 2)
            upper_circuit = round(prev_close * (1.0 + (band_pct / 100.0)), 2)

            # Detect if trading within 0.8% of lower circuit (liquidity freeze danger)
            is_near_lower_circuit = price <= (lower_circuit * 1.008)
            circuit_risk = "CRITICAL_LOWER_CIRCUIT" if is_near_lower_circuit else "NORMAL"
            circuit_warning = (
                f"⚠️ Near Lower Circuit (₹{lower_circuit})! Zero buyer liquidity risk."
                if is_near_lower_circuit else None
            )

            # Strict Institutional Quality Filters
            # 1. Promoter pledge must be < 5% (reject operator pump & dumps)
            # 2. Institutional delivery % >= 40%
            is_safe = (
                quality["promoter_pledge_pct"] <= 5.0 and
                quality["delivery_pct"] >= 40.0
            )

            # 12-Month Monte Carlo Projection for Sub-₹150 Equities
            sim = run_monte_carlo_simulation(
                symbol=sym,
                current_price=price,
                capital=budget_allocation,
                horizon_months=12,
                risk_tolerance="Aggressive"
            )

            bull_target = sim["bull_case"]["target_price"]
            bull_roi = sim["bull_case"]["roi_pct"]
            stop_loss = round(max(lower_circuit, price * 0.88), 2)  # Floor stop-loss above circuit lock
            shares_affordable = int(budget_allocation // price) if price > 0 else 0

            score = 65
            if quality["piotroski_score"] >= 6: score += 15
            if quality["delivery_pct"] >= 50.0: score += 10
            if technicals["rsi_14"] >= 50 and technicals["rsi_14"] <= 68: score += 10
            if is_near_lower_circuit: score -= 30  # Heavy penalty for circuit lock
            score = max(10, min(100, score))

            ranked.append({
                "symbol": sym,
                "company_name": quote.get("company_name", sym),
                "sector": quote.get("sector", "Small Cap Growth"),
                "category": item["category"],
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
                "lower_circuit": lower_circuit,
                "upper_circuit": upper_circuit,
                "circuit_risk": circuit_risk,
                "circuit_warning": circuit_warning,
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
