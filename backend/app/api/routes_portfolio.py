from fastapi import APIRouter, Query, Body
from typing import Dict, Any, List
from ..quant.portfolio_monitor import inspect_portfolio_threats
from ..quant.penny_stocks_engine import scan_profitable_penny_stocks, scan_sideways_breakouts

router = APIRouter(tags=["Portfolio & Threat Watchdog"])

@router.post("/api/portfolio/inspect-threats")
def check_portfolio_threats(
    holdings: List[Dict[str, Any]] = Body(default=[], description="List of user portfolio holdings")
):
    """
    Continuous watchdog evaluating profit target hits, stop-loss breaches,
    and breaking news threats across active portfolio positions.
    """
    return inspect_portfolio_threats(holdings)

@router.get("/api/stocks/penny-radar")
def get_penny_stocks_radar(
    budget: float = Query(default=25000.0, description="Capital allocation budget in INR")
):
    """
    Curated screener discovering legitimate sub-₹150 Indian small-caps
    filtered for clean balance sheets, zero promoter pledge, and high delivery.
    """
    return scan_profitable_penny_stocks(budget_allocation=budget)

@router.get("/api/stocks/sideways-breakouts")
def get_sideways_breakouts():
    """
    Returns equities breaking out of sideways accumulation with volume surges.
    """
    return scan_sideways_breakouts()
