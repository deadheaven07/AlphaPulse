from fastapi import APIRouter
from pydantic import BaseModel, Field
from backend.app.quant.monte_carlo_engine import run_monte_carlo_simulation
from backend.app.quant.data_engine import fetch_live_quote

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

class SimulatorRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol (e.g. TATAMOTORS)")
    capital: float = Field(default=50000.0, description="Investment capital in INR")
    horizon_months: int = Field(default=12, description="Holding duration in months (1, 3, 6, 12, 24, 36, 60)")
    risk_tolerance: str = Field(default="Moderate", description="Conservative | Moderate | Aggressive")

@router.post("/calculate")
def calculate_simulation(req: SimulatorRequest):
    quote = fetch_live_quote(req.symbol)
    price = quote.get("price", 1000.0)
    beta = quote.get("beta", 1.0)
    cagr_3y = (quote.get("cagr_3y", 18.0) / 100.0)

    # Estimate annual volatility based on beta
    annual_vol = max(0.16, min(0.40, 0.20 * beta))

    sim = run_monte_carlo_simulation(
        symbol=req.symbol.upper(),
        current_price=price,
        capital=req.capital,
        horizon_months=req.horizon_months,
        risk_tolerance=req.risk_tolerance,
        annual_volatility=annual_vol,
        base_annual_cagr=cagr_3y,
        num_paths=1000
    )
    sim["company_name"] = quote.get("company_name", f"{req.symbol} Limited")
    sim["sector"] = quote.get("sector", "Indian Equities")
    return sim
