from fastapi import APIRouter, Query
from typing import Dict, Any, List
from backend.app.quant.dividend_engine import analyze_dividend_intelligence, get_top_dividend_yielders

router = APIRouter(prefix="/api/dividend", tags=["dividend"])

@router.get("/analyzer")
def get_dividend_analysis(
    symbol: str = Query(..., description="Stock symbol (e.g. COALINDIA, VEDL, RECLTD, TCS)"),
    capital: float = Query(default=100000.0, description="Investment capital in INR")
):
    return analyze_dividend_intelligence(symbol=symbol, capital=capital)

@router.get("/top-yielders")
def get_top_yielders():
    return get_top_dividend_yielders()
