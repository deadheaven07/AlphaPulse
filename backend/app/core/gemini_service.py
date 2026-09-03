import os
import json
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from backend.app.core.config import GEMINI_API_KEY, GEMINI_MODEL
from backend.app.quant.data_engine import fetch_live_quote

SYSTEM_PROMPT = """You are AlphaPulse AI, an elite Quantitative Equity Strategist and Indian Stock Market (NSE/BSE) Analyst.
You synthesize fundamental ratios (ROCE, ROE, P/E vs sector, order book backlog, capex runway, debt-to-equity) and technical indicators to provide institutional-quality investment theses.

Given a user's natural query, investment capital, and holding horizon, produce a structured response.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "query_summary": "Brief summary of the investment intent",
  "sector_overview": "1-2 sentence macroeconomic context for Indian markets",
  "recommendations": [
    {
      "symbol": "NSE_TICKER (e.g. TATAMOTORS, BEL, HAL, LT, RELIANCE, TCS)",
      "company_name": "Full Company Name",
      "sector": "Sector Name",
      "current_price": 1050.0,
      "investment_thesis": "2-3 crisp sentences detailing competitive moat, earnings runway, and valuation justification",
      "key_catalysts": ["Catalyst 1 (e.g. Order book expansion)", "Catalyst 2 (e.g. High ROCE)"],
      "key_risks": ["Risk 1 (e.g. Raw material price volatility)", "Risk 2 (e.g. Execution delays)"],
      "verdict": "Strong Accumulate" | "Tactical Buy" | "Wait for Pullback" | "Hold",
      "confidence_score": 88,
      "target_upside_pct": 28.5
    }
  ]
}
Return ONLY valid JSON.
"""

def generate_fallback_ai_thesis(query: str, capital: float = 50000, horizon_months: int = 12) -> Dict[str, Any]:
    q = query.lower()
    
    if any(w in q for w in ["infra", "infrastructure", "power", "energy", "lt", "l&t", "tatapower"]):
        symbols = ["LT", "TATAPOWER", "RELIANCE"]
        sector_overview = "India's record government capex in energy transmission, road corridors, and solar EPC creates a multi-year order runway."
    elif any(w in q for w in ["defense", "defence", "bel", "hal", "military"]):
        symbols = ["BEL", "HAL"]
        sector_overview = "Make in India indigenization mandates and expanding defense export orders provide high revenue visibility for top PSUs."
    elif any(w in q for w in ["auto", "car", "ev", "tatamotors", "maruti"]):
        symbols = ["TATAMOTORS", "MARUTI"]
        sector_overview = "Surging premium SUV demand, expanding nationwide EV charging networks, and JLR balance sheet deleveraging."
    elif any(w in q for w in ["dividend", "low risk", "safe", "compounder", "tcs", "itc"]):
        symbols = ["TCS", "RELIANCE"]
        sector_overview = "Pristine balance sheets with high ROCE (>40%) and steady free cash flow generation provide downside protection."
    elif any(w in q for w in ["retail", "consumer", "zomato", "trent"]):
        symbols = ["TRENT", "ZOMATO"]
        sector_overview = "Discretionary retail expansion with value fashion (Zudio) and hyper-growth 10-minute quick commerce (Blinkit)."
    else:
        symbols = ["TATAMOTORS", "RELIANCE", "BEL"]
        sector_overview = "High-quality compounders with market leadership in high-growth Indian manufacturing and consumption segments."

    recommendations = []
    for sym in symbols:
        quote = fetch_live_quote(sym)
        p = quote["price"]
        
        if sym == "BEL":
            thesis = "Zero-debt defense electronics champion with ₹75,000+ Cr order backlog spanning radars, electronic warfare systems, and avionics."
            catalysts = ["Indigenization mandate for Indian armed forces", "High ROCE exceeding 30%", "Expanding export revenues"]
            risks = ["Tender execution milestones", "Defense procurement budget seasonality"]
            verdict = "Strong Accumulate"
            upside = 34.0
        elif sym == "HAL":
            thesis = "Monopoly defense aerospace builder with sovereign backing manufacturing Tejas LCA, Prachand combat helicopters, and aircraft engines."
            catalysts = ["Tejas Mk1A delivery ramp-up", "Helicopter fleet replacement cycle", "Expanding maintenance & repair (MRO) revenue"]
            risks = ["Engine supply chain dependencies", "Elevated short-term valuation multiple"]
            verdict = "Strong Accumulate"
            upside = 32.0
        elif sym == "TATAMOTORS":
            thesis = "Dominant Indian EV leader with >65% market share while luxury arm JLR delivers strong free cash flow and balance sheet deleveraging."
            catalysts = ["New EV launches (Curvv EV, Sierra)", "Range Rover / Defender luxury order book", "Planned commercial & passenger vehicles demerger"]
            risks = ["Global macroeconomic luxury auto demand", "Raw material battery commodity swings"]
            verdict = "Strong Accumulate"
            upside = 28.0
        elif sym == "LT":
            thesis = "India's premier engineering titan with all-time high international and domestic order pipeline exceeding ₹4.8 Lakh Cr."
            catalysts = ["Middle East energy transition and hydrocarbon contracts", "Domestic railway and metro tenders", "Asset monetisation pipeline"]
            risks = ["Working capital intensity in long-cycle EPC contracts", "Steel and cement input cost volatility"]
            verdict = "Strong Accumulate"
            upside = 26.0
        elif sym == "TATAPOWER":
            thesis = "Integrated power leader scaling 20 GW clean energy portfolio alongside nationwide rooftop solar and EV charging networks."
            catalysts = ["PM Surya Ghar rooftop solar initiative", "Transmission network expansion", "Rising peak power demand in India"]
            risks = ["Regulatory tariff revisions", "Higher initial debt for renewable energy capex"]
            verdict = "Tactical Buy"
            upside = 30.0
        elif sym == "TCS":
            thesis = "Premier global IT powerhouse with pristine zero-debt balance sheet, 58%+ ROCE, and robust enterprise AI pipeline."
            catalysts = ["Enterprise digital transformation mega-deals", "Operating margin resilience at 26-28%", "High dividend yields and buybacks"]
            risks = ["Muted US/Europe client discretionary IT spend in near term", "Cross-currency exchange headwinds"]
            verdict = "Hold"
            upside = 16.0
        elif sym == "TRENT":
            thesis = "Retail juggernaut with incredible same-store-sales growth powered by value-fashion brand Zudio and modern supply chain."
            catalysts = ["Targeting 200+ new Zudio store additions annually", "Star Bazaar grocery format turning profitable", "Expanding into beauty and footwear"]
            risks = ["High P/E valuation leaving little room for earnings miss", "Rising competition in tier-2/3 value fashion"]
            verdict = "Tactical Buy"
            upside = 35.0
        elif sym == "ZOMATO":
            thesis = "Unchallenged leader in food delivery and ultra-fast 10-minute quick commerce (Blinkit) with expanding GOV and contribution margins."
            catalysts = ["Blinkit dark store expansion with positive store-level EBITDA", "Platform fee monetization in food delivery", "District app launch for ticketing and events"]
            risks = ["Intensifying quick commerce competition", "Regulatory scrutiny on gig worker wages"]
            verdict = "Strong Accumulate"
            upside = 38.0
        else:
            thesis = f"{quote['company_name']} boasts market leadership in {quote['sector']}, strong competitive moats, and sustained free cash flow."
            catalysts = ["Market share consolidation", "Operational margin expansion", "Strong institutional holding"]
            risks = ["Macroeconomic interest rate sensitivity", "Sector-wide valuation normalization"]
            verdict = "Strong Accumulate"
            upside = 24.0

        recommendations.append({
            "symbol": sym,
            "company_name": quote["company_name"],
            "sector": quote["sector"],
            "current_price": p,
            "investment_thesis": thesis,
            "key_catalysts": catalysts,
            "key_risks": risks,
            "verdict": verdict,
            "confidence_score": 85,
            "target_upside_pct": upside
        })

    return {
        "query_summary": f"Thesis for: '{query}' | Target Capital: ₹{int(capital):,} | Horizon: {horizon_months} Months",
        "sector_overview": sector_overview,
        "recommendations": recommendations
    }

async def generate_ai_analysis(query: str, capital: float = 50000, horizon_months: int = 12, api_key_override: Optional[str] = None) -> Dict[str, Any]:
    key = api_key_override or GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    
    if not key or key == "YOUR_GEMINI_API_KEY_HERE":
        return generate_fallback_ai_thesis(query, capital, horizon_months)

    # List of candidate models in order of priority
    candidate_models = [
        GEMINI_MODEL,
        "gemini-2.5-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-flash-latest"
    ]
    # Remove duplicates while preserving order
    models_to_try = list(dict.fromkeys([m for m in candidate_models if m]))

    last_error = None
    client = genai.Client(api_key=key)
    prompt = f"""
User Query: "{query}"
Investment Capital: ₹{capital:,.2f} INR
Planned Duration: {horizon_months} Months

Provide your investment thesis, catalysts, risks, and verdict in exact JSON.
"""

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=f"{SYSTEM_PROMPT}\n\n{prompt}")]
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )

            raw = response.text.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]

            parsed = json.loads(raw.strip())
            
            # Enrich recommendation prices
            if "recommendations" in parsed:
                for rec in parsed["recommendations"]:
                    sym = rec.get("symbol", "").upper()
                    if sym:
                        live_q = fetch_live_quote(sym)
                        if live_q.get("price"):
                            rec["current_price"] = live_q["price"]

            return parsed
        except Exception as e:
            last_error = e
            continue

    print(f"All Gemini models returned error: {last_error}. Using deterministic heuristic engine.")
    fallback = generate_fallback_ai_thesis(query, capital, horizon_months)
    fallback["notice"] = f"Generated via AlphaPulse Heuristics (Gemini fallback: {str(last_error)})"
    return fallback
