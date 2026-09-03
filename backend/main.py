import os
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Query, HTTPException, Path as FastPath
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.config import GEMINI_API_KEY, PORT, HOST
from backend.services.database import (
    init_db,
    create_simulation,
    get_simulations,
    get_simulation_by_id,
    update_simulation_status,
    delete_simulation,
    get_watchlist,
    add_to_watchlist,
    remove_from_watchlist
)
from backend.services.market_data import (
    get_stock_quote,
    get_stock_history,
    search_stocks,
    get_indian_indices
)
from backend.services.simulator_engine import project_simulation
from backend.services.ai_advisor import ask_gemini_equity_advisor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    init_db()
    print("✓ AlphaHorizon SQLite Database initialized successfully.")
    yield

app = FastAPI(
    title="AlphaHorizon (India Equity & ROI Simulator) API",
    description="Ultra-modern Quantitative Intelligence & Holding Period Simulator for Indian Equities (NSE/BSE).",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite default is 5173 or any port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Request Models ---

class AskAiRequest(BaseModel):
    query: str = Field(..., description="Natural language search or stock question")
    capital: float = Field(default=50000.0, description="Investment capital in INR")
    horizon_months: int = Field(default=12, description="Target holding horizon in months")
    api_key_override: Optional[str] = Field(default=None, description="Optional custom Gemini API key from UI settings")

class SimulatorProjectRequest(BaseModel):
    symbol: str = Field(..., description="NSE Stock Symbol (e.g. TATAMOTORS, RELIANCE)")
    capital: float = Field(default=100000.0, description="Investment capital in INR")
    horizon_months: int = Field(default=12, description="Target duration in months (1, 3, 6, 12, 36, 60)")
    risk_tolerance: str = Field(default="MODERATE", description="CONSERVATIVE | MODERATE | AGGRESSIVE")

class SaveSimulationRequest(BaseModel):
    symbol: str
    company_name: str
    capital: float
    horizon_months: int
    risk_tolerance: str = "MODERATE"
    initial_price: float
    shares: int
    deployed_capital: float
    cash_buffer: float
    bull_target: float
    base_target: float
    bear_target: float
    bull_profit: float
    base_profit: float
    bear_profit: float
    expected_profit: float
    expected_roi_pct: float
    risk_reward_ratio: float = 2.0
    notes: Optional[str] = ""
    status: Optional[str] = "ACTIVE"

class UpdateSimulationRequest(BaseModel):
    status: str
    notes: Optional[str] = None

class AddWatchlistRequest(BaseModel):
    symbol: str
    company_name: Optional[str] = None
    sector: Optional[str] = "General"
    target_price: Optional[float] = 0.0
    notes: Optional[str] = ""

class ValidateKeyRequest(BaseModel):
    api_key: str

# --- API Endpoints ---

@app.get("/api/health")
def health_check():
    has_key = bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    return {
        "status": "healthy",
        "service": "AlphaHorizon Backend",
        "gemini_api_configured": has_key,
        "supported_exchanges": ["NSE", "BSE"]
    }

@app.get("/api/market/indices")
def get_indices():
    """Fetch live Indian indices (Nifty 50, Sensex, Bank Nifty, etc.)."""
    return get_indian_indices()

@app.get("/api/stock/quote")
def get_quote(symbol: str = Query(..., description="Stock symbol, e.g. RELIANCE")):
    """Get live quote, OHLC, 52W range, and key fundamental ratios for a stock."""
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol parameter is required.")
    return get_stock_quote(symbol)

@app.get("/api/stock/search")
def search_stock_list(q: str = Query(default="", description="Search query")):
    """Search stocks by name or ticker."""
    return search_stocks(q)

@app.get("/api/stock/history")
def get_history(
    symbol: str = Query(..., description="Stock symbol"),
    range: str = Query(default="1Y", description="Timeframe: 1D, 1W, 1M, 1Y, 5Y")
):
    """Get historical candles series for charting."""
    return get_stock_history(symbol, range)

@app.post("/api/ai/ask")
async def ask_ai(req: AskAiRequest):
    """Natural language stock explorer & thesis generator powered by Gemini AI."""
    res = await ask_gemini_equity_advisor(
        query=req.query,
        capital=req.capital,
        horizon_months=req.horizon_months,
        api_key_override=req.api_key_override
    )
    return res

@app.post("/api/simulator/project")
def run_simulation(req: SimulatorProjectRequest):
    """Real-time dynamic calculation of profit, shares, and Bull/Base/Bear price targets."""
    return project_simulation(
        symbol=req.symbol,
        capital=req.capital,
        horizon_months=req.horizon_months,
        risk_tolerance=req.risk_tolerance
    )

@app.get("/api/simulations")
def list_saved_simulations():
    """List all saved simulations with live updated market valuation."""
    sims = get_simulations()
    # Augment with live current price
    enhanced_sims = []
    for sim in sims:
        try:
            live_q = get_stock_quote(sim["symbol"])
            cur_price = live_q["price"]
            initial_p = sim["initial_price"]
            shares = sim["shares"]
            
            # Current unrealized P&L
            current_value = round(shares * cur_price, 2)
            current_pl = round(current_value - sim["deployed_capital"], 2)
            current_pl_pct = round((current_pl / sim["deployed_capital"]) * 100, 2) if sim["deployed_capital"] > 0 else 0.0
            
            # Check target progress
            target_status = sim.get("status", "ACTIVE")
            if cur_price >= sim["bull_target"]:
                target_status = "BULL_TARGET_MET"
            elif cur_price >= sim["base_target"]:
                target_status = "BASE_TARGET_MET"
            elif cur_price <= sim["bear_target"]:
                target_status = "STOP_LOSS_HIT"

            sim_dict = dict(sim)
            sim_dict.update({
                "current_price": cur_price,
                "current_value": current_value,
                "current_pl": current_pl,
                "current_pl_pct": current_pl_pct,
                "calculated_status": target_status
            })
            enhanced_sims.append(sim_dict)
        except Exception:
            enhanced_sims.append(dict(sim))

    return enhanced_sims

@app.post("/api/simulations")
def save_simulation(req: SaveSimulationRequest):
    """Save a hypothetical simulation to the SQLite database."""
    created = create_simulation(req.model_dump())
    return created

@app.patch("/api/simulations/{sim_id}")
def update_sim(sim_id: int = FastPath(...), req: UpdateSimulationRequest = ...):
    """Update status or notes for a saved simulation."""
    success = update_simulation_status(sim_id, req.status, req.notes)
    if not success:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {"success": True, "id": sim_id}

@app.delete("/api/simulations/{sim_id}")
def delete_sim(sim_id: int = FastPath(...)):
    """Delete a simulation from SQLite."""
    success = delete_simulation(sim_id)
    if not success:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {"success": True, "id": sim_id}

@app.get("/api/watchlist")
def list_watchlist():
    """Get watchlist with live market prices attached."""
    items = get_watchlist()
    enhanced = []
    for item in items:
        try:
            q = get_stock_quote(item["symbol"])
            it_dict = dict(item)
            it_dict.update({
                "price": q["price"],
                "change": q["change"],
                "change_pct": q["change_pct"],
                "pe": q.get("pe"),
                "high_52w": q.get("high_52w"),
                "low_52w": q.get("low_52w")
            })
            enhanced.append(it_dict)
        except Exception:
            enhanced.append(dict(item))
    return enhanced

@app.post("/api/watchlist")
def add_watchlist_item(req: AddWatchlistRequest):
    """Add or update stock in personal watchlist."""
    name = req.company_name
    if not name:
        q = get_stock_quote(req.symbol)
        name = q.get("company_name", req.symbol)
    return add_to_watchlist(
        symbol=req.symbol,
        company_name=name,
        sector=req.sector or "General",
        target_price=req.target_price or 0.0,
        notes=req.notes or ""
    )

@app.delete("/api/watchlist/{symbol}")
def remove_watchlist_item(symbol: str = FastPath(...)):
    """Remove a stock from watchlist."""
    success = remove_from_watchlist(symbol)
    if not success:
        raise HTTPException(status_code=404, detail="Stock not in watchlist")
    return {"success": True, "symbol": symbol}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
