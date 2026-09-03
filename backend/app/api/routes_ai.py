from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from backend.app.core.gemini_service import generate_ai_analysis

router = APIRouter(prefix="/api/ai", tags=["ai"])

class AiQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language search or stock question")
    capital: float = Field(default=50000.0, description="Investment amount in INR")
    horizon_months: int = Field(default=12, description="Planned holding horizon in months")
    api_key_override: Optional[str] = Field(default=None, description="Custom API key from UI settings")

@router.post("/analyze")
async def analyze_query(req: AiQueryRequest):
    return await generate_ai_analysis(
        query=req.query,
        capital=req.capital,
        horizon_months=req.horizon_months,
        api_key_override=req.api_key_override
    )
