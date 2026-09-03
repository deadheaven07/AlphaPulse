import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import GEMINI_API_KEY, PORT, HOST
from backend.app.api.routes_stocks import router as stocks_router
from backend.app.api.routes_simulator import router as simulator_router
from backend.app.api.routes_ai import router as ai_router

app = FastAPI(
    title="AlphaPulse India (Quantitative Intelligence & ROI Simulator)",
    description="Quantitative stock analytics, PKScreener technical signals, RRG sector rotation, and holding-period profit simulator for Indian Equities (NSE/BSE).",
    version="2.0.0"
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

@app.get("/api/health")
def health_check():
    has_gemini = bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    return {
        "status": "healthy",
        "app": "AlphaPulse India",
        "gemini_api_configured": has_gemini,
        "engine_sources": ["jugaad-data", "nsepython", "PKScreener", "RRG-Sector-Rotation"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
