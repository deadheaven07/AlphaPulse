import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import GEMINI_API_KEY, PORT, HOST
from backend.app.api.routes_stocks import router as stocks_router
from backend.app.api.routes_simulator import router as simulator_router
from backend.app.api.routes_ai import router as ai_router
from backend.app.api.routes_dividend import router as dividend_router
from backend.app.api.routes_diagnostics import router as diagnostics_router
from backend.app.api.routes_portfolio import router as portfolio_router
from backend.app.db.database import init_db

# Initialize persistent SQLite database
init_db()

app = FastAPI(
    title="AlphaPulse India Pro (Real-Time Equity & Post-Tax ROI Engine)",
    description="Quantitative stock intelligence, 1,000-path Monte Carlo simulations, post-tax ROI, live news sentiment, dividend timing, and real-time KPI radar for Indian Equities (NSE/BSE).",
    version="2.1.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(stocks_router)
app.include_router(simulator_router)
app.include_router(ai_router)
app.include_router(dividend_router)
app.include_router(portfolio_router)
app.include_router(diagnostics_router, prefix="/api")

@app.get("/api/health")
def health_check():
    has_gemini = bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    return {
        "status": "healthy",
        "app": "AlphaPulse India Pro",
        "gemini_api_configured": has_gemini,
        "engine_sources": [
            "jugaad-data",
            "nsepython",
            "PKScreener",
            "RRG-Sector-Rotation",
            "Monte Carlo (1,000 Paths)",
            "Live News Sentiment Engine",
            "Dividend Timing Analyzer",
            "Real-Time KPI Radar"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
