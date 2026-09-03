from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List
from backend.app.quant.data_engine import (
    fetch_live_quote,
    fetch_historical_dataframe,
    get_fii_dii_sentiment,
    search_symbols
)
from backend.app.quant.technicals import get_technical_summary
from backend.app.quant.sector_rrg import analyze_sector_rrg

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

@router.get("/quote")
def get_quote(symbol: str = Query(..., description="Stock symbol (e.g. TATAMOTORS, RELIANCE)")):
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol is required")
    quote = fetch_live_quote(symbol)
    df = fetch_historical_dataframe(symbol)
    technicals = get_technical_summary(df)
    rrg = analyze_sector_rrg(quote.get("sector", "General"))
    
    quote_copy = dict(quote)
    quote_copy["technicals"] = technicals
    quote_copy["sector_rrg"] = rrg
    return quote_copy

@router.get("/search")
def search_stock(q: str = Query(default="", description="Search query")):
    return search_symbols(q)

@router.get("/candles")
def get_candles(
    symbol: str = Query(..., description="Stock symbol"),
    period: str = Query(default="1y", description="Period (1mo, 6mo, 1y, 5y)"),
    interval: str = Query(default="1d", description="Interval (1d, 1wk)")
):
    df = fetch_historical_dataframe(symbol, period=period, interval=interval)
    points = []
    for idx, row in df.iterrows():
        date_str = idx.strftime("%d %b %Y") if hasattr(idx, "strftime") else str(idx)
        points.append({
            "date": date_str,
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]) if "Volume" in row else 0
        })
    return points

@router.get("/market-status")
def get_market_overview():
    return get_fii_dii_sentiment()

@router.get("/technicals")
def get_stock_technicals(symbol: str = Query(..., description="Stock symbol")):
    df = fetch_historical_dataframe(symbol)
    return get_technical_summary(df)

@router.get("/sector-rrg")
def get_rrg(sector: str = Query(..., description="Sector name")):
    return analyze_sector_rrg(sector)
