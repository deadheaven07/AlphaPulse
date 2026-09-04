from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List
from backend.app.quant.data_engine import (
    fetch_live_quote,
    fetch_historical_dataframe,
    get_fii_dii_sentiment,
    search_symbols
)
from backend.app.quant.technicals import get_technical_summary
from backend.app.quant.sector_rrg import analyze_sector_rrg, get_all_sectors_rrg_matrix
from backend.app.quant.quality_filters import evaluate_quality_filters
from backend.app.quant.news_engine import analyze_stock_news_sentiment
from backend.app.quant.radar_engine import scan_real_time_kpi_radar

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

@router.get("/quote")
def get_quote(symbol: str = Query(..., description="Stock symbol (e.g. TATAMOTORS, RELIANCE)")):
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol is required")
    quote = fetch_live_quote(symbol)
    df = fetch_historical_dataframe(symbol)
    technicals = get_technical_summary(df)
    rrg = analyze_sector_rrg(quote.get("sector", "General"))
    quality = evaluate_quality_filters(symbol, quote)
    news = analyze_stock_news_sentiment(symbol, quote)
    
    quote_copy = dict(quote)
    quote_copy["technicals"] = technicals
    quote_copy["sector_rrg"] = rrg
    quote_copy["quality_filters"] = quality
    quote_copy["news_sentiment"] = news
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
    is_intraday = interval in ["1m", "2m", "5m", "15m", "30m", "60m", "1h"] or period in ["1d", "5d"]
    for idx, row in df.iterrows():
        if hasattr(idx, "strftime"):
            date_str = idx.strftime("%H:%M" if period == "1d" else ("%d %b %H:%M" if is_intraday else "%d %b %Y"))
        else:
            date_str = str(idx)
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

@router.get("/sector-rrg-matrix")
def get_rrg_matrix(timeframe: str = Query(default="1w", description="Timeframe: 1w, 1m, or 1y")):
    return get_all_sectors_rrg_matrix(timeframe=timeframe)

@router.get("/quality")
def get_quality(symbol: str = Query(..., description="Stock symbol")):
    quote = fetch_live_quote(symbol)
    return evaluate_quality_filters(symbol, quote)

@router.get("/news-sentiment")
def get_news_sentiment(symbol: str = Query(..., description="Stock symbol")):
    quote = fetch_live_quote(symbol)
    return analyze_stock_news_sentiment(symbol, quote)

@router.get("/kpi-radar")
def get_kpi_radar(capital: float = Query(default=100000.0, description="Reference capital in INR")):
    return scan_real_time_kpi_radar(capital_reference=capital)

@router.get("/ticker-feed")
def get_ticker_tape_feed():
    from backend.app.quant.data_engine import get_live_ticker_feed
    return get_live_ticker_feed()

