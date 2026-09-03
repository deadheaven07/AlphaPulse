import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.app.quant.tactical_swing_engine import (
    generate_tactical_1week_setup,
    evaluate_holding_extension,
    TACTICAL_CANDIDATES
)
from backend.app.quant.crowd_psychology_engine import analyze_news_crowd_psychology
from backend.app.quant.data_engine import fetch_live_quote
from backend.app.db.database import (
    arm_prebuy_trigger,
    confirm_tactical_entry,
    extend_tactical_holding,
    save_tactical_swing,
    get_active_tactical_swings,
    get_prebuy_tactical_swings,
    get_all_tactical_swings,
    get_tactical_swing_by_id,
    delete_tactical_swing,
    update_tactical_swing_status
)

router = APIRouter(prefix="/api/tactical", tags=["tactical-alpha"])

class TacticalScreenRequest(BaseModel):
    capital: float = Field(default=50000.0, description="Available capital in INR")
    preferred_symbol: Optional[str] = Field(default=None, description="Optional specific stock symbol")
    risk_mode: str = Field(default="Aggressive", description="Risk mode: Aggressive | Balanced")

class ArmPreBuyRequest(BaseModel):
    symbol: str
    company_name: str
    entry_price: float
    entry_low: float
    entry_high: float
    allocated_capital: float
    shares: int
    target_1: float
    target_2: float
    stop_loss: float
    holding_days: int = 7

class ArmWatchdogRequest(BaseModel):
    symbol: str
    company_name: str
    entry_price: float
    allocated_capital: float
    shares: int
    target_1: float
    target_2: float
    stop_loss: float
    entry_low: Optional[float] = None
    entry_high: Optional[float] = None
    holding_days: int = 7

class ConfirmEntryRequest(BaseModel):
    actual_entry_price: Optional[float] = None

class ApplyExtensionRequest(BaseModel):
    extra_days: int = 4
    new_stop_loss: Optional[float] = None

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

@router.post("/arm-prebuy")
def arm_prebuy_setup(req: ArmPreBuyRequest):
    """
    Arms 1-Click Pre-Buy Target Watchdog in SQLite with status 'WAITING_FOR_ENTRY'.
    """
    swing = arm_prebuy_trigger(
        symbol=req.symbol,
        company_name=req.company_name,
        entry_price=req.entry_price,
        entry_low=req.entry_low,
        entry_high=req.entry_high,
        allocated_capital=req.allocated_capital,
        shares=req.shares,
        target_1=req.target_1,
        target_2=req.target_2,
        stop_loss=req.stop_loss,
        holding_days=req.holding_days
    )
    return {
        "status": "PREBUY_ARMED",
        "message": f"Pre-Buy Trigger armed for {req.symbol}. We will sound an audio chime when market price dips into ₹{req.entry_low:,.2f} – ₹{req.entry_high:,.2f}.",
        "swing": swing
    }

@router.post("/arm-watchdog")
def arm_tactical_watchdog(req: ArmWatchdogRequest):
    """
    Arms 24/7 price and crowd psychology watchdog directly in status 'ACTIVE_HOLDING'.
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
        status="ACTIVE_HOLDING",
        entry_low=req.entry_low or (req.entry_price * 0.995),
        entry_high=req.entry_high or (req.entry_price * 1.008),
        holding_days=req.holding_days
    )
    return {
        "status": "ARMED",
        "message": f"24/7 Guru Watchdog armed for {req.symbol}. Monitoring price targets and negative news crowd psychology for {req.holding_days} days.",
        "swing": swing
    }

@router.post("/confirm-entry/{swing_id}")
def confirm_entry(swing_id: int, req: Optional[ConfirmEntryRequest] = None):
    """
    Transitions a swing from WAITING_FOR_ENTRY -> ACTIVE_HOLDING and starts the countdown clock.
    """
    actual_price = req.actual_entry_price if req else None
    success = confirm_tactical_entry(swing_id, actual_entry_price=actual_price)
    if not success:
        raise HTTPException(status_code=404, detail="Tactical swing setup not found")
    
    updated = get_tactical_swing_by_id(swing_id)
    return {
        "status": "CONFIRMED_ACTIVE",
        "message": f"Entry confirmed for {updated.get('symbol')}. 7-Day Countdown Clock and Stop-Loss Watchdog are now active.",
        "swing": updated
    }

@router.post("/evaluate-extension/{swing_id}")
def evaluate_extension(swing_id: int):
    """
    Evaluates whether an active holding can be extended for more days based on momentum & delivery.
    """
    swing = get_tactical_swing_by_id(swing_id)
    if not swing:
        raise HTTPException(status_code=404, detail="Tactical swing setup not found")
    
    sym = swing["symbol"]
    try:
        quote = fetch_live_quote(sym)
        ltp = quote.get("price", swing["entry_price"])
    except Exception:
        ltp = swing["entry_price"]

    res = evaluate_holding_extension(
        swing_id=swing_id,
        symbol=sym,
        entry_price=swing["entry_price"],
        current_price=ltp,
        target_1=swing["target_1"],
        stop_loss=swing["stop_loss"]
    )
    return res

@router.post("/apply-extension/{swing_id}")
def apply_extension(swing_id: int, req: ApplyExtensionRequest):
    """
    Extends holding period by extra_days and updates trailing stop-loss.
    """
    success = extend_tactical_holding(
        swing_id=swing_id,
        extra_days=req.extra_days,
        new_stop_loss=req.new_stop_loss
    )
    if not success:
        raise HTTPException(status_code=404, detail="Tactical swing setup not found")

    updated = get_tactical_swing_by_id(swing_id)
    return {
        "status": "EXTENDED",
        "message": f"Extended holding period for {updated.get('symbol')} by +{req.extra_days} days. New trailing stop-loss: ₹{updated.get('stop_loss', 0):,.2f}.",
        "swing": updated
    }

@router.get("/prebuy")
def get_prebuy_swings():
    """
    Retrieves all pre-buy watchlist setups (WAITING_FOR_ENTRY) with live distance to buy zone.
    """
    swings = get_prebuy_tactical_swings()
    results = []

    for s in swings:
        sym = s["symbol"]
        try:
            quote = fetch_live_quote(sym)
            ltp = quote.get("price", s["entry_price"])
            day_change = quote.get("change_pct", 0.0)
        except Exception:
            ltp = s["entry_price"]
            day_change = 0.0

        entry_low = s.get("entry_low") or (s["entry_price"] * 0.995)
        entry_high = s.get("entry_high") or (s["entry_price"] * 1.008)

        # Proximity & status
        in_buy_zone = entry_low <= ltp <= entry_high
        distance_to_low_pct = ((ltp - entry_low) / entry_low) * 100.0

        results.append({
            **s,
            "current_price": ltp,
            "day_change_pct": day_change,
            "entry_low": entry_low,
            "entry_high": entry_high,
            "in_buy_zone": in_buy_zone,
            "distance_to_low_pct": round(distance_to_low_pct, 2)
        })

    return results

@router.get("/active")
def get_active_swings():
    """
    Retrieves all active tactical holdings with live quote updates, PnL, progress bar, and countdown.
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
            remaining_days = (s.get("holding_days", 7) + s.get("extended_days", 0))

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
            "extended_days": s.get("extended_days", 0),
            "progress_pct": round(progress_pct, 1),
            "target_1_hit": ltp >= s["target_1"],
            "stop_loss_hit": ltp <= s["stop_loss"]
        })

    return results

@router.get("/all")
def get_all_swings_categorized():
    """
    Retrieves both pre-buy setups and active holdings in a unified payload.
    """
    prebuy = get_prebuy_swings()
    active = get_active_swings()
    return {
        "prebuy_count": len(prebuy),
        "active_count": len(active),
        "prebuy": prebuy,
        "active": active
    }

@router.delete("/{swing_id}")
def disarm_swing(swing_id: int):
    """
    Disarms and removes a tactical swing setup or pre-buy trigger.
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
