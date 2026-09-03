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

    # Gemini 2.5 Call if API key configured
    api_key = os.environ.get("GEMINI_API_KEY", "")
    ai_thesis = None
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"""You are AlphaPulse India Pro's Lead Quantitative Wealth Strategist.
The user has the following wealth target in the Indian Stock Market:
- Target Corpus: ₹{target:,.0f}
- Starting Capital: ₹{req.starting_capital:,.0f}
- Monthly SIP: ₹{req.monthly_sip:,.0f}
- Time Horizon: {req.horizon_months} Months ({years:.1f} Years)
- Risk Appetite: {req.risk_level}
- User Query / Focus: "{req.query}"

Provide a crisp, professional, institutional analysis (3-4 concise paragraphs) answering:
1. Feasibility analysis of reaching ₹{target:,.0f} with the required ~{required_return_pct}% CAGR.
2. Recommended asset allocation thesis for the recommended basket: {', '.join([b['symbol'] for b in basket])}.
3. Tactical execution roadmap: Optimal entry strategy, dividend reinvestment, and Budget 2024 tax optimization (LTCG 12.5% after ₹1.25L exemption).
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
        ai_thesis = f"""### 🎯 Wealth Milestone Roadmap: ₹{target:,.0f} Target

To achieve your target corpus of **₹{target:,.0f}** in **{req.horizon_months} months** with a starting capital of **₹{req.starting_capital:,.0f}** and monthly SIP of **₹{req.monthly_sip:,.0f}**, you require an annualized compounding rate (CAGR) of approximately **{required_return_pct}%**.

**1. Allocation Thesis**:
We recommend structuring your capital across our high-conviction **{req.risk_level} Basket** ({', '.join([b['symbol'] for b in basket])}). This balances core cyclical tailwinds (infrastructure capex, auto revival) with high-dividend sovereign cash payouts to protect against index volatility.

**2. Tactical Rebalancing & Tax Strategy**:
- Under Budget 2024, hold positions longer than 12 months to qualify for **12.5% LTCG** (with the first ₹1,25,000 yearly capital gain completely exempt).
- Reinvest all quarterly dividends directly back into the lowest-weighted holding to compound your yield.
- Use a **-8% trailing stop-loss** on volatile components to lock in gains and safeguard your capital.
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
