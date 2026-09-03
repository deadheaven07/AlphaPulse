import os
import json
import re
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types
from backend.config import GEMINI_API_KEY, GEMINI_MODEL
from backend.services.market_data import TOP_INDIAN_STOCKS, get_stock_quote

SYSTEM_PROMPT = """You are AlphaHorizon AI, a world-class Quantitative Equity Strategist & Indian Stock Market (NSE/BSE) Analyst.
You analyze Indian equities with rigorous fundamental depth, evaluating:
1. ROCE, ROE, and Operating Profit Margins (OPM).
2. P/E vs Sector Historical P/E and PEG ratios.
3. Order Book Strength, Capex Runway, and Government policy tailwinds (e.g. PLI schemes, Indigenization, Infrastructure spend).
4. Debt-to-Equity and Free Cash Flow generation.
5. FII / DII institutional ownership trends.

Given a user's natural language query (and optional capital / horizon in months), provide an institutional-grade stock selection and scenario breakdown.

You MUST respond strictly with a valid, clean JSON object matching this exact schema:
{
  "query_understanding": "Brief summary of what the investor is seeking",
  "macro_summary": "1-2 sentence overview of relevant Indian market sector macroeconomic context",
  "sector_sentiment": "BULLISH" | "NEUTRAL" | "CAUTIOUS",
  "suggested_allocation": "Recommended strategy on capital deployment and horizon patience",
  "recommendations": [
    {
      "symbol": "NSE_TICKER (e.g. TATAMOTORS, RELIANCE, BEL, LT, TCS)",
      "company_name": "Full Company Name",
      "sector": "Sector Name",
      "current_price": 1050.0,
      "rationale": "2-3 crisp sentences on financial moat and thesis",
      "catalysts": ["Catalyst 1 (e.g. Strong order book)", "Catalyst 2 (e.g. Margin expansion)"],
      "red_flags": ["Risk 1 (e.g. Raw material inflation)", "Risk 2 (e.g. Sector cyclicality)"],
      "key_ratios": {
        "pe": 24.5,
        "roce": 22.0,
        "roe": 18.5,
        "de": 0.4
      },
      "target_bands": {
        "bull_pct": 32.0,
        "base_pct": 18.0,
        "bear_pct": -12.0
      },
      "confidence_score": 88
    }
  ]
}
Return ONLY valid JSON. No markdown backticks, no markdown formatting outside JSON.
"""

def generate_fallback_ai_response(query: str, capital: float = 50000, horizon_months: int = 12) -> Dict[str, Any]:
    """
    Intelligent thematic fallback engine for Indian markets when API key is not configured or offline.
    """
    q = query.lower()
    
    # Identify Themes
    if any(w in q for w in ["defense", "defence", "military", "hal", "bel", "bhel"]):
        symbols = ["BEL", "HAL"]
        theme_title = "Indian Defense Indigenization & Modernization"
        macro = "Strong budgetary allocations for domestic defense procurement under Make in India and expanding export order book."
        sentiment = "BULLISH"
    elif any(w in q for w in ["infra", "infrastructure", "construction", "capex", "l&t", "lt", "power", "tatapower"]):
        symbols = ["LT", "TATAPOWER", "RELIANCE"]
        theme_title = "National Infrastructure & Clean Energy Capex"
        macro = "Government mega-capex in roads, power grid modernization, and industrial automation."
        sentiment = "BULLISH"
    elif any(w in q for w in ["auto", "car", "ev", "tatamotors", "maruti", "vehicle"]):
        symbols = ["TATAMOTORS", "MARUTI"]
        theme_title = "Automotive & Electric Mobility Leadership"
        macro = "Rising consumer affluence, premium SUV adoption, and rapid EV charging network expansion."
        sentiment = "BULLISH"
    elif any(w in q for w in ["it", "tech", "software", "tcs", "infosys", "infy", "ai"]):
        symbols = ["TCS", "INFY"]
        theme_title = "IT Services & Generative AI Transformation"
        macro = "Stable global digital transformation budgets, margin resilience, and pristine zero-debt balance sheets."
        sentiment = "NEUTRAL"
    elif any(w in q for w in ["bank", "banking", "finance", "nbfc", "hdfc", "icici", "sbi", "bajaj", "jiofin"]):
        symbols = ["HDFCBANK", "ICICIBANK", "BAJFINANCE"]
        theme_title = "Indian Credit Growth & Retail Financialization"
        macro = "Robust credit expansion (14-16% YoY) backed by multi-year low Non-Performing Assets (NPAs)."
        sentiment = "BULLISH"
    elif any(w in q for w in ["retail", "consumer", "fmcg", "itc", "titan", "trent", "zomato"]):
        symbols = ["TRENT", "TITAN", "ZOMATO"]
        theme_title = "Urban Consumption & Fast Retail Disruption"
        macro = "Discretionary spending surge in organized lifestyle retail and hyper-growth quick commerce adoption."
        sentiment = "BULLISH"
    else:
        # Balanced core largecap compounders
        symbols = ["RELIANCE", "TATAMOTORS", "ICICIBANK"]
        theme_title = "Diversified Bluechip Growth & Moat Leaders"
        macro = "Resilient Indian macroeconomic growth (GDP ~7%) supporting sector-leading market share gainers."
        sentiment = "BULLISH"

    recommendations = []
    for sym in symbols:
        quote = get_stock_quote(sym)
        p = quote["price"]
        roce = quote.get("roce", 18.0)
        
        # Determine rationale based on stock
        if sym == "BEL":
            rationale = "Zero-debt defense electronics champion with ₹75,000+ Cr order backlog spanning radars, electronic warfare systems, and avionics."
            catalysts = ["Indigenization mandate for Indian Armed Forces", "Export orders from friendly partner nations", "High ROCE exceeding 30%"]
            red_flags = ["Execution timeline delays on large government tenders", "Dependence on defense procurement budget cycles"]
        elif sym == "HAL":
            rationale = "Monopoly manufacturer of military combat aircraft (Tejas LCA, Su-30 MKI) and helicopters with high sovereign backing."
            catalysts = ["Tejas Mk1A deliveries ramp-up", "Indigenous helicopter fleet replacement cycle", "Expanding maintenance & overhaul (MRO) revenues"]
            red_flags = ["Engine supply chain dependencies (GE F404/414)", "High valuation multiple compared to historical levels"]
        elif sym == "TATAMOTORS":
            rationale = "Leading India's EV revolution with >65% market share while JLR generates robust free cash flow and deleverages balance sheet."
            catalysts = ["New EV model launches (Curvv EV, Sierra)", "JLR order book strength in Range Rover / Defender", "Planned corporate demerger unlocking PV and CV value"]
            red_flags = ["Global luxury auto demand slowdown", "Intensifying EV competition from domestic and global players"]
        elif sym == "LT":
            rationale = "India's premier engineering conglomerate with record-high international & domestic order pipeline exceeding ₹4.8 Lakh Cr."
            catalysts = ["Middle East energy transition and hydrocarbon orders", "Domestic railway, metro, and solar EPC tenders", "Asset monetisation pipeline"]
            red_flags = ["Working capital intensity in long-cycle EPC contracts", "Commodity steel and cement input cost volatility"]
        elif sym == "TATAPOWER":
            rationale = "Fully integrated power leader scaling 20 GW clean energy portfolio alongside nationwide rooftop solar and EV charging networks."
            catalysts = ["PM Surya Ghar Muft Bijli Yojana rooftop solar surge", "Transmission network expansion", "Rising peak power demand in India"]
            red_flags = ["Regulatory tariff revisions", "Higher initial debt for renewable energy capex"]
        elif sym == "TCS":
            rationale = "Premier global IT powerhouse with unparalleled execution, 58%+ ROCE, and large pipeline of enterprise AI/cloud contracts."
            catalysts = ["Enterprise modernization mega-deals", "Operating margin expansion toward 26-28%", "Consistent high dividend yield and buybacks"]
            red_flags = ["Muted US/Europe client discretionary IT spend in the near term", "Cross-currency exchange headwinds"]
        elif sym == "HDFCBANK":
            rationale = "Largest private lender in India with unmatched distribution franchise, poised for accelerated loan growth post-HDFC merger integration."
            catalysts = ["Deposit growth outperforming system credit", "Net Interest Margin (NIM) bottoming out and expanding", "Cross-selling insurance and retail wealth to 90M+ customers"]
            red_flags = ["High loan-to-deposit ratio temporarily constraining aggressive lending", "Short-term merger digestion friction"]
        elif sym == "TRENT":
            rationale = "Retail juggernaut with incredible same-store-sales growth powered by value-fashion brand Zudio and modern supply chain."
            catalysts = ["Targeting 200+ new Zudio store additions annually", "Star Bazaar grocery format turning profitable", "Expanding into beauty, footwear, and innerwear"]
            red_flags = ["High P/E valuation leaving little room for earnings miss", "Rising competition in tier-2/3 value fashion"]
        elif sym == "ZOMATO":
            rationale = "Unchallenged leader in food delivery and ultra-fast 10-minute quick commerce (Blinkit) with expanding GOV and contribution margins."
            catalysts = ["Blinkit dark store expansion with positive store-level EBITDA", "Platform fee monetization in food delivery", "District app launch for ticketing and events"]
            red_flags = ["Intensifying quick commerce competition (Swiggy Instamart, Zepto)", "Regulatory scrutiny on gig worker wages"]
        else:
            rationale = f"{quote['company_name']} boasts strong competitive moats, market leadership in {quote['sector']}, and sustained free cash flow."
            catalysts = ["Sector tailwinds and market share gains", "Improving operational efficiencies and margin expansion", "Healthy institutional sponsorship"]
            red_flags = ["Macroeconomic interest rate sensitivity", "Sector-wide valuation normalization"]

        recommendations.append({
            "symbol": sym,
            "company_name": quote["company_name"],
            "sector": quote["sector"],
            "current_price": p,
            "rationale": rationale,
            "catalysts": catalysts,
            "red_flags": red_flags,
            "key_ratios": {
                "pe": quote.get("pe", 25.0),
                "roce": roce,
                "roe": quote.get("roe", 16.0),
                "de": quote.get("debt_to_equity", 0.4)
            },
            "target_bands": {
                "bull_pct": round(25.0 + (roce / 3.0), 1),
                "base_pct": round(14.0 + (roce / 5.0), 1),
                "bear_pct": -10.0
            },
            "confidence_score": 85
        })

    return {
        "query_understanding": f"Analysis for: '{query}' | Capital: ₹{int(capital):,} | Horizon: {horizon_months} Months",
        "macro_summary": f"{theme_title}: {macro}",
        "sector_sentiment": sentiment,
        "suggested_allocation": f"Deploy ₹{int(capital):,} staggered across the {len(recommendations)} recommended leaders with a minimum {horizon_months}-month horizon to benefit from multi-quarter earnings compounding.",
        "recommendations": recommendations
    }

async def ask_gemini_equity_advisor(query: str, capital: float = 50000, horizon_months: int = 12, api_key_override: Optional[str] = None) -> Dict[str, Any]:
    """
    Query Gemini API using official google-genai SDK for deep Indian Equity stock analysis.
    """
    key_to_use = api_key_override or GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    if not key_to_use or key_to_use == "YOUR_GEMINI_API_KEY_HERE":
        # Return rich curated thematic fallback
        return generate_fallback_ai_response(query, capital, horizon_months)

    try:
        client = genai.Client(api_key=key_to_use)
        prompt_content = f"""
User Query: "{query}"
Target Capital: ₹{capital:,.2f} INR
Planned Holding Horizon: {horizon_months} Months

Provide your quantitative equity recommendation and thesis in exact JSON according to instructions.
"""
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=f"{SYSTEM_PROMPT}\n\n{prompt_content}")]
                )
            ],
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json"
            )
        )

        response_text = response.text.strip()
        # Clean any potential markdown wrappers
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        parsed = json.loads(response_text.strip())
        
        # Verify recommended stocks have updated live quote info
        if "recommendations" in parsed and isinstance(parsed["recommendations"], list):
            for rec in parsed["recommendations"]:
                sym = rec.get("symbol", "").upper()
                if sym:
                    live_q = get_stock_quote(sym)
                    if live_q.get("price"):
                        rec["current_price"] = live_q["price"]
                        if not rec.get("key_ratios"):
                            rec["key_ratios"] = {
                                "pe": live_q.get("pe", 20.0),
                                "roce": live_q.get("roce", 15.0),
                                "roe": live_q.get("roe", 14.0),
                                "de": live_q.get("debt_to_equity", 0.5)
                            }

        return parsed

    except Exception as e:
        print(f"Gemini API query encountered error: {e}. Falling back to quantitative engine.")
        # Fallback gracefully
        fallback_data = generate_fallback_ai_response(query, capital, horizon_months)
        fallback_data["notice"] = f"Generated via AlphaHorizon Engine (Gemini fallback: {str(e)})"
        return fallback_data
