import json
import time
import os
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.app.db.database import get_goals, save_goal, delete_goal
from backend.app.quant.data_engine import fetch_live_quote
from backend.app.quant.news_engine import analyze_stock_news_sentiment

router = APIRouter(prefix="/api/planner", tags=["planner"])

class GoalCreateRequest(BaseModel):
    title: str = Field(..., description="Goal title, e.g. '₹10 Lakh Wealth Target'")
    target_amount: float = Field(..., description="Target corpus in INR")
    starting_capital: float = Field(..., description="Initial investment capital")
    monthly_sip: float = Field(default=0.0, description="Monthly recurring investment")
    horizon_months: int = Field(default=12, description="Target timeline in months")
    risk_level: str = Field(default="Moderate", description="Risk tolerance: Conservative | Moderate | Aggressive")
    planned_basket: Optional[List[Dict[str, Any]]] = Field(default=[], description="List of chosen stocks and weights")
    notes: Optional[str] = None

class CopilotQueryRequest(BaseModel):
    query: str
    target_amount: float = 1000000.0
    starting_capital: float = 100000.0
    monthly_sip: float = 10000.0
    horizon_months: int = 24
    risk_level: str = "Moderate"
    api_key: Optional[str] = None

@router.get("/goals")
def list_goals():
    goals = get_goals()
    parsed = []
    for g in goals:
        item = dict(g)
        if item.get("planned_basket"):
            try:
                item["planned_basket"] = json.loads(item["planned_basket"])
            except Exception:
                item["planned_basket"] = []
        else:
            item["planned_basket"] = []
        parsed.append(item)
    return parsed

@router.post("/goals")
def create_goal(req: GoalCreateRequest):
    basket_json = json.dumps(req.planned_basket) if req.planned_basket else "[]"
    res = save_goal(
        title=req.title,
        target_amount=req.target_amount,
        starting_capital=req.starting_capital,
        monthly_sip=req.monthly_sip,
        horizon_months=req.horizon_months,
        risk_level=req.risk_level,
        planned_basket=basket_json,
        notes=req.notes
    )
    if not res:
        raise HTTPException(status_code=500, detail="Failed to save goal plan")
    if res.get("planned_basket"):
        try:
            res["planned_basket"] = json.loads(res["planned_basket"])
        except Exception:
            res["planned_basket"] = []
    return res

@router.delete("/goals/{goal_id}")
def remove_goal(goal_id: int):
    ok = delete_goal(goal_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Goal plan not found")
    return {"status": "success", "message": f"Goal {goal_id} deleted"}

@router.get("/basket-news")
def get_basket_news(symbols: str = Query(..., description="Comma separated symbols e.g. TATAMOTORS,RELIANCE,COALINDIA")):
    sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not sym_list:
        return []

    news_items = []
    for sym in sym_list[:6]:
        try:
            quote = fetch_live_quote(sym)
            sentiment_res = analyze_stock_news_sentiment(sym, quote)
            headlines = sentiment_res.get("headlines", [])
            for art in headlines[:2]:
                threat_level = "HIGH" if sentiment_res.get("risk_of_loss_pct", 0) > 40 else "MODERATE" if sentiment_res.get("risk_of_loss_pct", 0) > 20 else "LOW"
                news_items.append({
                    "symbol": sym,
                    "company_name": quote.get("company_name", sym),
                    "title": art.get("title", f"Institutional Market Update for {sym}"),
                    "publisher": art.get("source", "Live Financial Wire"),
                    "link": art.get("url", "https://www.nseindia.com"),
                    "published": art.get("time_ago", "Recent"),
                    "sentiment": sentiment_res.get("sentiment_label", "Neutral"),
                    "score": sentiment_res.get("sentiment_score", 0.0),
                    "threat_level": threat_level,
                    "risk_of_loss_pct": sentiment_res.get("risk_of_loss_pct", 15.0),
                    "summary": art.get("summary", "")
                })
        except Exception:
            continue

    return news_items


def calculate_exact_required_cagr(
    target: float,
    starting_capital: float,
    monthly_sip: float,
    horizon_months: int
) -> float:
    total_contributed = starting_capital + monthly_sip * horizon_months
    if target <= total_contributed or total_contributed <= 0:
        return 0.0
    if horizon_months <= 0:
        return 0.0

    low = 0.001
    high = 2.50
    solved_rate = 0.15

    for _ in range(35):
        mid = (low + high) / 2.0
        r_monthly = mid / 12.0
        num_months = horizon_months

        fv_lump = starting_capital * ((1.0 + r_monthly) ** num_months)
        fv_sip = monthly_sip * (((1.0 + r_monthly) ** num_months - 1.0) / r_monthly) if (monthly_sip > 0 and r_monthly > 0) else 0.0
        fv_total = fv_lump + fv_sip

        if abs(fv_total - target) < 50.0:
            solved_rate = mid
            break
        if fv_total < target:
            low = mid
        else:
            high = mid
        solved_rate = mid

    return round(solved_rate * 100.0, 1)

@router.post("/ai-copilot")
def ask_plan_copilot(req: CopilotQueryRequest):
    """
    Goal Planning AI Advisor using Gemini 2.5 with grounded quantitative financial models.
    """
    years = max(0.5, req.horizon_months / 12.0)
    total_invested = req.starting_capital + (req.monthly_sip * req.horizon_months)
    target = req.target_amount
    growth_required = max(0.0, target - total_invested)
    
    # Exact Actuarial SIP Future-Value Annuity Solver
    required_return_pct = calculate_exact_required_cagr(
        target=target,
        starting_capital=req.starting_capital,
        monthly_sip=req.monthly_sip,
        horizon_months=req.horizon_months
    )


    # Risk-based basket recommendations
    if req.risk_level.lower() == "conservative":
        basket = [
            {"symbol": "COALINDIA", "name": "Coal India Limited", "sector": "Energy & Mining", "allocation_pct": 30, "rationale": "8.4% dividend cash flow cushion + steady sovereign cash flows.", "expected_cagr_pct": 14.0},
            {"symbol": "ITC", "name": "ITC Limited", "sector": "FMCG / Cigarettes", "allocation_pct": 25, "rationale": "High ROCE FMCG compounder with 85% dividend payout resilience.", "expected_cagr_pct": 13.5},
            {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT Major", "allocation_pct": 25, "rationale": "Zero-debt sovereign IT moat with consistent free cash flow.", "expected_cagr_pct": 15.0},
            {"symbol": "RECLTD", "name": "REC Limited", "sector": "Power Finance", "allocation_pct": 20, "rationale": "6.8% yield power infrastructure financing backbone.", "expected_cagr_pct": 16.0}
        ]
        strategy_summary = f"Conservative Capital Preservation Strategy: High-yield dividend reinvestment (averaging ~5.5% annual cash yield) combined with blue-chip Indian leaders to protect your ₹{req.starting_capital:,.0f} principal."
    elif req.risk_level.lower() == "aggressive":
        basket = [
            {"symbol": "BEL", "name": "Bharat Electronics", "sector": "Defense Electronics", "allocation_pct": 30, "rationale": "Massive sovereign defense order book with 25%+ return on equity.", "expected_cagr_pct": 24.0},
            {"symbol": "HAL", "name": "Hindustan Aeronautics", "sector": "Defense Aero", "allocation_pct": 25, "rationale": "Monopoly fighter jet & helicopter platform with multi-year capex surge.", "expected_cagr_pct": 26.0},
            {"symbol": "TATAPOWER", "name": "Tata Power", "sector": "Renewables & EV", "allocation_pct": 25, "rationale": "Massive utility solar & rooftop installation growth trajectory.", "expected_cagr_pct": 22.0},
            {"symbol": "ZOMATO", "name": "Zomato Limited", "sector": "Quick Commerce", "allocation_pct": 20, "rationale": "Blinkit rapid expansion with high operating leverage turning net profitable.", "expected_cagr_pct": 28.0}
        ]
        strategy_summary = f"Aggressive Capital Acceleration Strategy: High-beta defense, renewable capex, and quick-commerce leaders engineered to generate the ~{required_return_pct}% required annual CAGR."
    else: # Moderate (Default)
        basket = [
            {"symbol": "TATAMOTORS", "name": "Tata Motors Limited", "sector": "Automotive & EV", "allocation_pct": 30, "rationale": "Deleveraged balance sheet, JLR luxury margins + domestic EV leadership.", "expected_cagr_pct": 19.5},
            {"symbol": "LT", "name": "Larsen & Toubro", "sector": "Infrastructure EPC", "allocation_pct": 25, "rationale": "Record ₹4.5 Lakh Cr order book driven by Middle East & India domestic capex.", "expected_cagr_pct": 18.0},
            {"symbol": "HDFCBANK", "name": "HDFC Bank Limited", "sector": "Private Banking Major", "allocation_pct": 25, "rationale": "Post-merger loan deposit normalization and institutional FII bottoming.", "expected_cagr_pct": 17.5},
            {"symbol": "COALINDIA", "name": "Coal India", "sector": "Energy & Cash Yield", "allocation_pct": 20, "rationale": "High 8.4% cash dividend yield to de-risk market corrections.", "expected_cagr_pct": 15.0}
        ]
        strategy_summary = f"Balanced Wealth Compounder Strategy: Institutional mix of capex powerhouses (L&T, Tata Motors) anchored by HDFC Bank and Coal India's cash dividend floor."

    # API Key Resolution (Frontend override or environment variable)
    api_key = (req.api_key or os.environ.get("GEMINI_API_KEY", "")).strip()

    # Intent Detection: Greeting vs Financial Query
    q_clean = req.query.strip().lower()
    is_greeting = q_clean in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "help", "who are you", "hi!", "hello!"]

    ai_thesis = None
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            if is_greeting:
                prompt = f"""You are AlphaPulse India Pro's Lead Quantitative Wealth Strategist & AI Copilot.
The user just greeted you with: "{req.query}".
Respond with a warm, professional, institutional welcome (1-2 short paragraphs).
Explain that you can help them formulate high-probability wealth roadmaps in the Indian Stock Market (NSE/BSE).
Briefly mention their current settings (Target: ₹{target:,.0f} in {req.horizon_months} months with {req.risk_level} risk) and invite them to ask a specific goal question or tweak the sliders above!
"""
            else:
                prompt = f"""You are AlphaPulse India Pro's Lead Quantitative Wealth Strategist.
The user asked: "{req.query}"
Current Portfolio Plan Context:
- Target Corpus: ₹{target:,.0f}
- Starting Capital: ₹{req.starting_capital:,.0f}
- Monthly SIP: ₹{req.monthly_sip:,.0f}
- Horizon: {req.horizon_months} Months ({years:.1f} Years)
- Risk Level: {req.risk_level}
- Required Actuarial CAGR: {required_return_pct}%
- Recommended Basket: {', '.join([b['symbol'] for b in basket])}

Provide a direct, conversational, institutional answer addressing their exact query:
1. Directly answer what the user asked about.
2. Relate it to their target of ₹{target:,.0f} and the required {required_return_pct}% CAGR.
3. Suggest concrete next steps or portfolio adjustments under current statutory Indian tax rules (STCG 20%, LTCG 12.5%).
"""

            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            if resp and resp.text:
                ai_thesis = resp.text
        except Exception as e:
            ai_thesis = None

    if not ai_thesis:
        if is_greeting:
            ai_thesis = f"""👋 **Hello! I am your Alpha Wealth Copilot.**

I analyze Indian equity compounders, calculate actuarial CAGR requirements, and structure risk-mitigated portfolios under current statutory Indian tax rules (STCG 20%, LTCG 12.5%).

Your current active plan is targeting **₹{target:,.0f}** over **{req.horizon_months} months** ({req.risk_level} Risk).

💡 **How to use me**:
- Adjust the **Target, Capital, and Monthly SIP sliders** above to see your exact required return.
- Type any question below, such as:
  - *"How can I reach ₹5 Lakhs in 1 year?"*
  - *"Is Tata Motors good for long-term compounding?"*
  - *"Which high-dividend PSU can de-risk my basket?"*
"""
        else:
            ai_thesis = f"""### 🎯 Wealth Milestone Roadmap: ₹{target:,.0f} Target

Addressing your query: *"{req.query}"*

To reach your target corpus of **₹{target:,.0f}** in **{req.horizon_months} months** with a starting capital of **₹{req.starting_capital:,.0f}** and monthly SIP of **₹{req.monthly_sip:,.0f}**, your portfolio requires an exact actuarial compounding rate (CAGR) of **{required_return_pct}%**.

**1. Strategy Allocation**:
We recommend deploying across your **{req.risk_level} Basket** ({', '.join([b['symbol'] for b in basket])}). This balances core cyclical capex momentum with sovereign cash dividend floors.

**2. Tactical Discipline & Tax Net**:
- Hold positions for $>12$ months to qualify for **12.5% LTCG** (with the ₹1,25,000 yearly capital gain tax exemption).
- Maintain an active **-8% trailing stop-loss** on volatile components to safeguard your principal.
"""

    return {
        "target_amount": target,
        "starting_capital": req.starting_capital,
        "monthly_sip": req.monthly_sip,
        "horizon_months": req.horizon_months,
        "risk_level": req.risk_level,
        "required_cagr_pct": required_return_pct,
        "total_invested": total_invested,
        "growth_required": growth_required,
        "strategy_summary": strategy_summary,
        "ai_thesis": ai_thesis,
        "recommended_basket": basket
    }
