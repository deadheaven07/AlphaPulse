from fastapi import APIRouter, Query, Body, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from ..quant.portfolio_monitor import inspect_portfolio_threats
from ..quant.penny_stocks_engine import scan_profitable_penny_stocks, scan_sideways_breakouts
from ..db.database import (
    get_holdings,
    add_holding,
    delete_holding,
    clear_all_holdings,
    get_watchlist,
    add_watchlist,
    delete_watchlist
)

router = APIRouter(tags=["Portfolio & Threat Watchdog"])

class HoldingCreateRequest(BaseModel):
    symbol: str
    entry_price: float
    shares: int
    company_name: Optional[str] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None

class WatchlistRequest(BaseModel):
    symbol: str

# --- SQLite Persistent Portfolio Endpoints ---

@router.get("/api/portfolio/holdings")
def list_holdings():
    """Fetch all saved portfolio holdings from persistent SQLite database."""
    return get_holdings()

@router.post("/api/portfolio/holdings")
def create_holding(item: HoldingCreateRequest):
    """Add a new position/strategy to SQLite persistent portfolio."""
    holding = add_holding(
        symbol=item.symbol,
        entry_price=item.entry_price,
        shares=item.shares,
        company_name=item.company_name,
        target_price=item.target_price,
        stop_loss=item.stop_loss
    )
    return holding

@router.delete("/api/portfolio/holdings/{holding_id}")
def remove_holding(holding_id: int):
    """Delete a holding by ID from SQLite database."""
    success = delete_holding(holding_id)
    if not success:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"status": "deleted", "id": holding_id}

@router.delete("/api/portfolio/holdings")
def remove_all_holdings():
    """Clear all holdings from SQLite database."""
    clear_all_holdings()
    return {"status": "all_cleared"}

# --- SQLite Persistent Watchlist Endpoints ---

@router.get("/api/portfolio/watchlist")
def list_watchlist():
    """Fetch user pinned watchlist from SQLite database."""
    return get_watchlist()

@router.post("/api/portfolio/watchlist")
def add_to_watchlist(item: WatchlistRequest):
    """Pin a stock to SQLite watchlist."""
    add_watchlist(item.symbol)
    return {"status": "added", "symbol": item.symbol.upper().strip()}

@router.delete("/api/portfolio/watchlist/{symbol}")
def remove_from_watchlist(symbol: str):
    """Unpin a stock from SQLite watchlist."""
    delete_watchlist(symbol)
    return {"status": "removed", "symbol": symbol.upper().strip()}

# --- Watchdog & Screening Endpoints ---

@router.post("/api/portfolio/inspect-threats")
def check_portfolio_threats(
    holdings: List[Dict[str, Any]] = Body(default=[], description="List of user portfolio holdings")
):
    """
    Continuous watchdog evaluating profit target hits, stop-loss breaches,
    and breaking news threats across active portfolio positions with deterministic IDs.
    """
    # If no payload passed, automatically inspect holdings saved in SQLite
    if not holdings:
        holdings = get_holdings()

    return inspect_portfolio_threats(holdings)

@router.get("/api/stocks/penny-radar")
def get_penny_stocks_radar(
    budget: float = Query(default=25000.0, description="Capital allocation budget in INR")
):
    """
    Curated screener discovering legitimate sub-₹150 Indian small-caps and liquid turnaround leaders
    filtered for clean balance sheets, zero promoter pledge, and circuit limit risk checks.
    """
    return scan_profitable_penny_stocks(budget_allocation=budget)

@router.get("/api/stocks/sideways-breakouts")
def get_sideways_breakouts():
    """
    Returns equities breaking out of sideways accumulation with volume surges.
    """
    return scan_sideways_breakouts()
