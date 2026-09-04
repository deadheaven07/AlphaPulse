from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from backend.app.quant.intraday_engine import (
    scan_intraday_breakouts,
    calculate_intraday_leverage_math,
    get_session_time_status
)
from backend.app.quant.data_engine import fetch_live_quote, fetch_live_quotes_batch
from backend.app.db.database import (
    create_intraday_trade,
    get_active_intraday_trades,
    get_all_intraday_trades,
    get_intraday_trade_by_id,
    square_off_intraday_trade,
    delete_intraday_trade
)

router = APIRouter(prefix="/api/intraday", tags=["intraday"])

class ArmIntradayTradePayload(BaseModel):
    symbol: str
    company_name: Optional[str] = None
    direction: str = "LONG" # LONG or SHORT
    entry_price: float
    shares: int
    margin_capital: float
    total_exposure: float
    leverage_multiplier: float = 5.0
    target_price: float
    stop_loss: float
    orb_high: Optional[float] = 0.0
    orb_low: Optional[float] = 0.0
    vwap: Optional[float] = 0.0

class CalculateLeveragePayload(BaseModel):
    symbol: str
    entry_price: float
    margin_capital: float
    direction: str = "LONG"
    leverage_multiplier: float = 5.0

class SquareOffPayload(BaseModel):
    exit_price: Optional[float] = None
    reason: str = "MANUAL_SQUARE_OFF"

@router.get("/scanner")
def get_intraday_scanner(margin_capital: float = Query(20000.0, ge=1000.0, le=5000000.0)):
    """Scans liquid NSE equities for 15M ORB and VWAP Long/Short setups with 5x leverage."""
    return scan_intraday_breakouts(margin_capital=margin_capital)

@router.post("/calculate-leverage")
def calculate_leverage(payload: CalculateLeveragePayload):
    """Calculates real-time 5x leverage positions, risk-to-reward parameters, and post-tax returns."""
    return calculate_intraday_leverage_math(
        symbol=payload.symbol,
        entry_price=payload.entry_price,
        margin_capital=payload.margin_capital,
        direction=payload.direction,
        leverage_multiplier=payload.leverage_multiplier
    )

@router.post("/arm")
def arm_intraday_position(payload: ArmIntradayTradePayload):
    """Saves an active intraday MIS trade into SQLite with 5x leverage tracking."""
    trade_id = create_intraday_trade(payload.model_dump())
    return {
        "status": "ARMED",
        "trade_id": trade_id,
        "message": f"Intraday {payload.direction} position on {payload.symbol} armed successfully with 5x MIS leverage!"
    }

@router.get("/active")
def get_active_trades():
    """Returns currently active intraday MIS positions enriched with live market LTP and live PnL."""
    trades = get_active_intraday_trades()
    if not trades:
        return []

    symbols = [t["symbol"] for t in trades]
    quotes_map = fetch_live_quotes_batch(symbols)

    enriched_trades = []
    for t in trades:
        sym = t["symbol"]
        quote = quotes_map.get(sym) or {}
        live_price = quote.get("price", t["entry_price"])
        entry_price = float(t["entry_price"])
        shares = int(t["shares"])
        direction = t["direction"].upper()
        margin_capital = float(t["margin_capital"])
        target_price = float(t["target_price"])
        stop_loss = float(t["stop_loss"])

        if direction == "LONG":
            gross_pnl = (live_price - entry_price) * shares
            progress_pct = max(0.0, min(100.0, ((live_price - entry_price) / max(target_price - entry_price, 0.01)) * 100.0))
        else: # SHORT
            gross_pnl = (entry_price - live_price) * shares
            progress_pct = max(0.0, min(100.0, ((entry_price - live_price) / max(entry_price - target_price, 0.01)) * 100.0))

        roi_pct = round((gross_pnl / max(margin_capital, 1.0)) * 100.0, 2)

        enriched = dict(t)
        enriched.update({
            "live_price": live_price,
            "gross_pnl": round(gross_pnl, 2),
            "roi_pct": roi_pct,
            "progress_pct": round(progress_pct, 1),
            "day_change": quote.get("change", 0.0)
        })
        enriched_trades.append(enriched)

    return enriched_trades

@router.get("/all")
def get_all_trades_history():
    """Returns all intraday trades including historical closed/squared off positions."""
    return get_all_intraday_trades()

@router.post("/square-off/{trade_id}")
def square_off_trade(trade_id: int, payload: Optional[SquareOffPayload] = None):
    """Squares off an active intraday trade and records final exit price and net PnL."""
    trade = get_intraday_trade_by_id(trade_id)
    if not trade:
        raise HTTPException(status_code=404, detail="Intraday trade not found")

    exit_price = payload.exit_price if (payload and payload.exit_price) else None
    if exit_price is None:
        quote = fetch_live_quote(trade["symbol"])
        exit_price = quote.get("price", trade["entry_price"])

    direction = trade["direction"].upper()
    entry_price = float(trade["entry_price"])
    shares = int(trade["shares"])

    if direction == "LONG":
        pnl = (exit_price - entry_price) * shares
    else:
        pnl = (entry_price - exit_price) * shares

    reason = payload.reason if payload else "MANUAL_SQUARE_OFF"
    success = square_off_intraday_trade(trade_id, exit_price, pnl, reason=reason)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to square off trade")

    return {
        "status": "SQUARED_OFF",
        "trade_id": trade_id,
        "symbol": trade["symbol"],
        "exit_price": exit_price,
        "net_pnl": round(pnl, 2),
        "message": f"Position {trade['symbol']} squared off at ₹{exit_price:,.2f} with PnL of ₹{pnl:+,.2f}."
    }

@router.delete("/{trade_id}")
def delete_trade(trade_id: int):
    success = delete_intraday_trade(trade_id)
    if not success:
        raise HTTPException(status_code=404, detail="Trade not found")
    return {"status": "DELETED", "trade_id": trade_id}

@router.get("/session-status")
def get_session_status():
    return get_session_time_status()
