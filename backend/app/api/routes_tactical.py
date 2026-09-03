import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.app.quant.tactical_swing_engine import generate_tactical_1week_setup, TACTICAL_CANDIDATES
from backend.app.quant.crowd_psychology_engine import analyze_news_crowd_psychology
from backend.app.quant.data_engine import fetch_live_quote
from backend.app.db.database import (
    save_tactical_swing,
    get_active_tactical_swings,
    get_all_tactical_swings,
    delete_tactical_swing,
    update_tactical_swing_status
)

router = APIRouter(prefix="/api/tactical", tags=["tactical-alpha"])

class TacticalScreenRequest(BaseModel):
    capital: float = Field(default=50000.0, description="Available capital in INR")
    preferred_symbol: Optional[str] = Field(default=None, description="Optional specific stock symbol")
    risk_mode: str = Field(default="Aggressive", description="Risk mode: Aggressive | Balanced")

class ArmWatchdogRequest(BaseModel):
    symbol: str
    company_name: str
    entry_price: float
    allocated_capital: float
    shares: int
    target_1: float
    target_2: float
    stop_loss: float
    holding_days: int = 7

class NewsPsychologyRequest(BaseModel):
    symbol: str
    headline: str
    summary: Optional[str] = ""
    delivery_pct: Optional[float] = 45.0

@router.post("/screen")
def screen_tactical_setup(req: TacticalScreenRequest):
    """
    Screens Indian Equities for high-conviction 1-week tactical setups (5-7 trading days).
    """
    setup = generate_tactical_1week_setup(
        capital=req.capital,
        preferred_symbol=req.preferred_symbol,
        risk_mode=req.risk_mode
    )
    return setup

@router.post("/arm-watchdog")
def arm_tactical_watchdog(req: ArmWatchdogRequest):
    """
    Arms 24/7 price and crowd psychology watchdog in SQLite with a 7-day auto-countdown.
    """
    now = datetime.datetime.now()
    expiry = now + datetime.timedelta(days=req.holding_days)

    swing = save_tactical_swing(
        symbol=req.symbol,
        company_name=req.company_name,
        entry_price=req.entry_price,
        allocated_capital=req.allocated_capital,
        shares=req.shares,
        target_1=req.target_1,
        target_2=req.target_2,
        stop_loss=req.stop_loss,
        entry_date=now.strftime("%Y-%m-%d %H:%M:%S"),
        expiry_date=expiry.strftime("%Y-%m-%d %H:%M:%S"),
        status="ACTIVE"
    )
    return {
        "status": "ARMED",
        "message": f"24/7 Guru Watchdog armed for {req.symbol}. Monitoring price targets and negative news crowd psychology for {req.holding_days} days.",
        "swing": swing
    }

@router.get("/active")
def get_active_swings():
    """
    Retrieves all active tactical swings with live quote updates, PnL, and remaining day countdown.
    """
    swings = get_active_tactical_swings()
    results = []

    now = datetime.datetime.now()

    for s in swings:
        sym = s["symbol"]
        try:
            quote = fetch_live_quote(sym)
            ltp = quote.get("price", s["entry_price"])
            day_change = quote.get("change_pct", 0.0)
        except Exception:
            ltp = s["entry_price"]
            day_change = 0.0

        invested = s["allocated_capital"]
        current_val = ltp * s["shares"]
        unrealized_pnl = current_val - (s["entry_price"] * s["shares"])
        pnl_pct = (unrealized_pnl / invested) * 100 if invested > 0 else 0.0

        # Calculate remaining days
        try:
            expiry = datetime.datetime.strptime(s["expiry_date"], "%Y-%m-%d %H:%M:%S")
            remaining_days = max(0, (expiry - now).days)
        except Exception:
            remaining_days = 7

        # Calculate progress towards target 1 vs stop loss
        range_span = max(1.0, s["target_1"] - s["stop_loss"])
        progress_pct = min(100.0, max(0.0, ((ltp - s["stop_loss"]) / range_span) * 100.0))

        results.append({
            **s,
            "current_price": ltp,
            "day_change_pct": day_change,
            "current_valuation": round(current_val, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "remaining_days": remaining_days,
            "progress_pct": round(progress_pct, 1),
            "target_1_hit": ltp >= s["target_1"],
            "stop_loss_hit": ltp <= s["stop_loss"]
        })

    return results

@router.delete("/{swing_id}")
def disarm_swing(swing_id: int):
    """
    Disarms and removes an active tactical swing from the watchdog.
    """
    success = delete_tactical_swing(swing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tactical swing not found")
    return {"status": "DISARMED", "id": swing_id}

@router.post("/analyze-news")
def analyze_news_psychology(req: NewsPsychologyRequest):
    """
    Evaluates news catalyst severity and predicts crowd psychology.
    """
    res = analyze_news_crowd_psychology(
        symbol=req.symbol,
        headline=req.headline,
        summary=req.summary or "",
        delivery_pct=req.delivery_pct or 45.0
    )
    return res
