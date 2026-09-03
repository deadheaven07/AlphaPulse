from fastapi import APIRouter
from pydantic import BaseModel, Field
from backend.app.quant.simulation_engine import run_profit_simulation

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

class SimulatorRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol (e.g. TATAMOTORS)")
    capital: float = Field(default=50000.0, description="Investment capital in INR")
    horizon_months: int = Field(default=12, description="Holding duration in months (1, 3, 6, 12, 24, 36, 60)")
    risk_tolerance: str = Field(default="Moderate", description="Conservative | Moderate | Aggressive")

@router.post("/calculate")
def calculate_simulation(req: SimulatorRequest):
    return run_profit_simulation(
        symbol=req.symbol,
        capital=req.capital,
        horizon_months=req.horizon_months,
        risk_tolerance=req.risk_tolerance
    )
