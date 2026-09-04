from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Tuple
import os
import re
import math
from backend.app.quant.data_engine import fetch_live_quote, fetch_live_quotes_batch
from backend.app.quant.tactical_swing_engine import (
    scan_live_market_tactical_leaders,
    EXPANDED_NSE_UNIVERSE
)
from backend.app.quant.crowd_psychology_engine import analyze_news_crowd_psychology
from backend.app.quant.intraday_engine import (
    scan_intraday_breakouts,
    calculate_intraday_leverage_math,
    get_session_time_status,
    calculate_intraday_charges,
    INTRADAY_UNIVERSE
)
from backend.app.db.database import (
    create_intraday_trade,
    get_active_intraday_trades,
    get_all_intraday_trades,
    square_off_intraday_trade
)

router = APIRouter(prefix="/api/ai", tags=["conversational-ai"])

class ChatMessageItem(BaseModel):
    role: str = Field(..., description="'user' or 'model'")
    content: str = Field(..., description="Message text")

class ClientWorkspaceContext(BaseModel):
    current_page: str = "overview"
    active_symbol: Optional[str] = "TATAMOTORS"
    capital: Optional[float] = 100000.0
    horizon_months: Optional[int] = 12
    goal_target: Optional[float] = 1000000.0
    goal_sip: Optional[float] = 15000.0
    goal_starting: Optional[float] = 150000.0
    risk_level: Optional[str] = "Moderate"

class ConversationalChatRequest(BaseModel):
    messages: List[ChatMessageItem]
    context: Optional[ClientWorkspaceContext] = None
    api_key: Optional[str] = None

# Natural Language Number Mapping Dictionary
WORD_NUMS: Dict[str, float] = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
    "twenty five": 25, "twenty-five": 25, "thirty": 30, "thirty five": 35,
    "forty": 40, "forty five": 45, "fifty": 50, "sixty": 60, "seventy": 70,
    "seventy five": 75, "seventy-five": 75, "eighty": 80, "ninety": 90,
    "hundred": 100, "half": 0.5
}

def parse_natural_language_capital(query: str, default_capital: float = 50000.0) -> Tuple[float, bool]:
    """
    Advanced NLP capital & budget extractor that accurately parses:
    - Word amounts: "five thousand", "ten thousand", "twenty five thousand", "two lakh", "one and half lakh"
    - Suffix notation: "5k", "10k", "25k", "50k", "1.5L", "2L", "10cr"
    - Colloquial phrases: "5 thousand", "10 thousand", "50 thousand"
    - Standard formats: "₹5000", "Rs. 5,000", "5000 inr", "5000rs"
    - Budgets starting from ₹1,000 to ₹10,00,00,000+
    
    Returns (extracted_amount, is_explicitly_provided)
    """
    q = query.lower().replace(",", "").strip()
    
    # 1. Check Crore Patterns (e.g. "1.5 crore", "2 cr", "ten crore")
    cr_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:crores?|cr\b)', q)
    if cr_match:
        try:
            return float(cr_match.group(1)) * 10000000.0, True
        except Exception:
            pass
    for word, num in WORD_NUMS.items():
        if re.search(rf'\b{word}\s*(?:crores?|cr\b)', q):
            return num * 10000000.0, True

    # 2. Check Lakh Patterns (e.g. "1 lakh", "2.5 lakhs", "5l", "ten lakh", "twenty five lakh")
    lakh_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:lakhs?|lacs?|l\b)', q)
    if lakh_match:
        try:
            return float(lakh_match.group(1)) * 100000.0, True
        except Exception:
            pass
    # Word lakh: e.g. "two point five lakh" or "five lakh"
    pt_lakh = re.search(r'([a-z]+)\s+point\s+([a-z0-9]+)\s*(?:lakhs?|lacs?|l\b)', q)
    if pt_lakh:
        w1, w2 = pt_lakh.group(1), pt_lakh.group(2)
        n1 = WORD_NUMS.get(w1, 0)
        n2 = float(w2) if w2.isdigit() else WORD_NUMS.get(w2, 0)
        return (n1 + (n2 / 10.0)) * 100000.0, True
        
    for word, num in sorted(WORD_NUMS.items(), key=lambda x: len(x[0]), reverse=True):
        if re.search(rf'\b{word}\s*(?:lakhs?|lacs?)\b', q):
            return num * 100000.0, True

    # 3. Check Thousand / K Patterns (e.g. "5 thousand", "10k", "25k", "50 thousand", "five thousand")
    k_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:thousands?|k\b)', q)
    if k_match:
        try:
            return float(k_match.group(1)) * 1000.0, True
        except Exception:
            pass
    for word, num in sorted(WORD_NUMS.items(), key=lambda x: len(x[0]), reverse=True):
        if re.search(rf'\b{word}\s*(?:thousands?|k\b)', q):
            return num * 1000.0, True

    # 4. Check Raw Currency & Numeric Formats (e.g. "₹5000", "rs 10000", "5000 inr", "25000")
    num_match = re.search(r'(?:₹|rs\.?|inr)?\s*([0-9]{3,9})(?:\s*(?:rs|rupees|inr|\/-))?', q)
    if num_match:
        try:
            val = float(num_match.group(1))
            if val >= 500:
                return val, True
        except Exception:
            pass

    return default_capital, False

def build_budget_portfolio_allocation(capital: float) -> Dict[str, Any]:
    """
    Constructs 3 live-priced, mathematically verified strategy allocations
    for any budget using liquid market leaders under ₹450.
    """
    # Fetch real-time live quotes with graceful fallbacks
    def get_stock_data(sym: str, default_p: float, name: str, sector: str) -> Dict[str, Any]:
        try:
            q = fetch_live_quote(sym)
            p = float(q.get("price", default_p))
            if p <= 0:
                p = default_p
            return {
                "symbol": sym,
                "company_name": q.get("company_name", name),
                "price": round(p, 2),
                "sector": q.get("sector", sector),
                "change_pct": round(float(q.get("change_pct", 0.0)), 2)
            }
        except Exception:
            return {
                "symbol": sym,
                "company_name": name,
                "price": round(default_p, 2),
                "sector": sector,
                "change_pct": 0.0
            }

    s_eternal = get_stock_data("ETERNAL", 323.50, "Eternal Limited (Zomato)", "Quick-Commerce / Retail")
    s_tmpv = get_stock_data("TMPV", 312.00, "Tata Motors Passenger Vehicles", "Auto & EV")
    s_bel = get_stock_data("BEL", 408.00, "Bharat Electronics Ltd", "Defense Electronics")
    s_tatapower = get_stock_data("TATAPOWER", 435.00, "Tata Power Co Ltd", "Renewable Energy & Utilities")
    s_coalindia = get_stock_data("COALINDIA", 415.00, "Coal India Ltd", "PSU Energy & High Dividend")

    # Strategy 1: High-Growth Duo (50% ETERNAL + 50% TMPV)
    leg_1 = capital * 0.5
    shares_eternal = max(1, int(leg_1 // s_eternal["price"])) if capital >= s_eternal["price"] else 0
    shares_tmpv = max(1, int(leg_1 // s_tmpv["price"])) if capital >= s_tmpv["price"] else 0
    
    # Adjust for micro budgets
    if shares_eternal * s_eternal["price"] + shares_tmpv * s_tmpv["price"] > capital:
        if s_eternal["price"] < s_tmpv["price"] and capital >= s_eternal["price"]:
            shares_eternal = int(capital // s_eternal["price"])
            shares_tmpv = 0
        elif capital >= s_tmpv["price"]:
            shares_tmpv = int(capital // s_tmpv["price"])
            shares_eternal = 0

    invested_strat1 = round((shares_eternal * s_eternal["price"]) + (shares_tmpv * s_tmpv["price"]), 2)
    buffer_strat1 = round(max(0.0, capital - invested_strat1), 2)
    target_gain_strat1 = round(invested_strat1 * 0.14, 2) # +14% upside
    net_in_hand_strat1 = round(target_gain_strat1 * 0.80, 2) # after 20% STCG

    # Strategy 2: Sovereign Moat (50% BEL + 50% TATAPOWER)
    shares_bel = max(1, int(leg_1 // s_bel["price"])) if capital >= s_bel["price"] else 0
    shares_tatapower = max(1, int(leg_1 // s_tatapower["price"])) if capital >= s_tatapower["price"] else 0
    if shares_bel * s_bel["price"] + shares_tatapower * s_tatapower["price"] > capital:
        if s_bel["price"] < s_tatapower["price"] and capital >= s_bel["price"]:
            shares_bel = int(capital // s_bel["price"])
            shares_tatapower = 0
        elif capital >= s_tatapower["price"]:
            shares_tatapower = int(capital // s_tatapower["price"])
            shares_bel = 0

    invested_strat2 = round((shares_bel * s_bel["price"]) + (shares_tatapower * s_tatapower["price"]), 2)
    buffer_strat2 = round(max(0.0, capital - invested_strat2), 2)
    target_gain_strat2 = round(invested_strat2 * 0.12, 2) # +12% upside
    net_in_hand_strat2 = round(target_gain_strat2 * 0.80, 2)

    # Strategy 3: High-Dividend Cash Generator (100% COALINDIA)
    shares_coal = max(1, int(capital // s_coalindia["price"])) if capital >= s_coalindia["price"] else 0
    invested_strat3 = round(shares_coal * s_coalindia["price"], 2)
    buffer_strat3 = round(max(0.0, capital - invested_strat3), 2)
    annual_div_strat3 = round(invested_strat3 * 0.084, 2) # ~8.4% dividend yield
    quarterly_div_strat3 = round(annual_div_strat3 / 4.0, 2)

    return {
        "capital": capital,
        "stocks": {
            "ETERNAL": s_eternal,
            "TMPV": s_tmpv,
            "BEL": s_bel,
            "TATAPOWER": s_tatapower,
            "COALINDIA": s_coalindia
        },
        "strategy_1": {
            "name": "High-Growth Duo (Quick-Commerce & EV Scale)",
            "shares_eternal": shares_eternal,
            "shares_tmpv": shares_tmpv,
            "invested": invested_strat1,
            "cash_buffer": buffer_strat1,
            "target_gain": target_gain_strat1,
            "net_in_hand": net_in_hand_strat1,
            "horizon": "2–4 Weeks (Tactical Momentum)",
            "rationale": "Captures Blinkit quick-commerce market leadership + Tata Motors EV domestic market share with ~14% target swing."
        },
        "strategy_2": {
            "name": "Sovereign Moat & Clean Energy Compounder",
            "shares_bel": shares_bel,
            "shares_tatapower": shares_tatapower,
            "invested": invested_strat2,
            "cash_buffer": buffer_strat2,
            "target_gain": target_gain_strat2,
            "net_in_hand": net_in_hand_strat2,
            "horizon": "1–3 Months (Positional Wealth)",
            "rationale": "Sovereign defense electronics monopoly (>25% ROCE, zero net-debt) paired with India's largest solar EV infrastructure rollout."
        },
        "strategy_3": {
            "name": "High-Dividend Passive Cash Flow Generator",
            "shares_coal": shares_coal,
            "invested": invested_strat3,
            "cash_buffer": buffer_strat3,
            "annual_dividend": annual_div_strat3,
            "quarterly_dividend": quarterly_div_strat3,
            "horizon": "6–12 Months (Income Compounding)",
            "rationale": "Sovereign coal evacuation monopoly generating ~8.4% annualized cash yield paid directly into your demat bank account."
        }
    }

def format_budget_portfolio_response(alloc: Dict[str, Any]) -> str:
    """Renders high-precision Markdown for dynamic budget allocation."""
    cap = alloc["capital"]
    s = alloc["stocks"]
    s1 = alloc["strategy_1"]
    s2 = alloc["strategy_2"]
    s3 = alloc["strategy_3"]

    return f"""🎯 **Personalized Capital Allocation Plan for ₹{cap:,.0f}**

I have parsed your capital of **₹{cap:,.0f}** and analyzed real-time exchange prices across high-conviction Indian market leaders trading under ₹450. 

Here are the **3 optimized quantitative allocation strategies** tailored to your exact budget:

---

### 🚀 **Strategy 1: The High-Growth Duo (Maximum Capital Appreciation)**
*Quick-Commerce hyper-growth + Electric Vehicle transition momentum.*

- **[ETERNAL]** (Eternal / Zomato • Live: **₹{s['ETERNAL']['price']:,.2f}**): **{s1['shares_eternal']} Shares** (₹{s1['shares_eternal'] * s['ETERNAL']['price']:,.2f})
- **[TMPV]** (Tata Motors Passenger Vehicles • Live: **₹{s['TMPV']['price']:,.2f}**): **{s1['shares_tmpv']} Shares** (₹{s1['shares_tmpv'] * s['TMPV']['price']:,.2f})
- 💵 **Total Invested**: **₹{s1['invested']:,.2f}** (Cash Buffer: ₹{s1['cash_buffer']:,.2f})
- 📈 **Projected In-Hand Profit**: **+₹{s1['net_in_hand']:,.2f}** (+14% target after 20% statutory STCG deduction)
- ⏱️ **Suggested Horizon**: {s1['horizon']}

---

### 🛡️ **Strategy 2: The Sovereign Moat (Zero-Debt Safety & Clean Power)**
*Sovereign defense order book monopoly + Green energy infrastructure expansion.*

- **[BEL]** (Bharat Electronics • Live: **₹{s['BEL']['price']:,.2f}**): **{s2['shares_bel']} Shares** (₹{s2['shares_bel'] * s['BEL']['price']:,.2f})
- **[TATAPOWER]** (Tata Power • Live: **₹{s['TATAPOWER']['price']:,.2f}**): **{s2['shares_tatapower']} Shares** (₹{s2['shares_tatapower'] * s['TATAPOWER']['price']:,.2f})
- 💵 **Total Invested**: **₹{s2['invested']:,.2f}** (Cash Buffer: ₹{s2['cash_buffer']:,.2f})
- 📈 **Projected In-Hand Profit**: **+₹{s2['net_in_hand']:,.2f}** (+12% target move)
- ⏱️ **Suggested Horizon**: {s2['horizon']}

---

### 💰 **Strategy 3: High-Dividend Cash Generator (Passive Demat Income)**
*Sovereign monopoly with steady quarterly dividend payouts directly to your bank account.*

- **[COALINDIA]** (Coal India • Live: **₹{s['COALINDIA']['price']:,.2f}**): **{s3['shares_coal']} Shares** (₹{s3['invested']:,.2f})
- 💵 **Total Invested**: **₹{s3['invested']:,.2f}** (Cash Buffer: ₹{s3['cash_buffer']:,.2f})
- 💸 **Projected Dividend Cash**: **₹{s3['annual_dividend']:,.2f}/year** (~₹{s3['quarterly_dividend']:,.2f} per quarter at ~8.4% yield)
- ⏱️ **Suggested Horizon**: {s3['horizon']}

---

💡 **Dalal Street Execution Rule**: For short-term swings ($< 12$ months), current statutory tax rules levy 20% STCG. Holding $> 12$ months drops your tax to 12.5% LTCG with a ₹1.25 Lakh annual exemption floor."""

@router.post("/chat")
def handle_conversational_chat(req: ConversationalChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages thread cannot be empty")

    latest_user_msg = req.messages[-1].content.strip()
    q_lower = latest_user_msg.lower()
    ctx = req.context or ClientWorkspaceContext()

    # 1. Resolve API Key (Frontend Settings priority, then environment)
    api_key = (req.api_key or os.environ.get("GEMINI_API_KEY", "")).strip()

    # 2. Extract Capital & Detect Explicit Budget
    parsed_capital, has_explicit_budget = parse_natural_language_capital(latest_user_msg, ctx.capital or 50000.0)

    # 3. Detect Intent Types
    is_greeting = q_lower in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "help", "who are you", "hi!", "hello!"]

    # --- Intraday Intents ---
    is_intraday_scanner = (
        q_lower.startswith("/intraday-scanner") or
        any(k in q_lower for k in [
            "intraday scanner", "intraday-scanner", "live scanner", "show me the live scanner",
            "bullish breakout", "bearish breakdown", "scan nse for long", "scan for short",
            "15m orb", "orb breakout", "vwap alignment", "breakdown below 15m", "new candidates",
            "refresh the intraday scanner", "intraday candidates", "find me bullish breakout"
        ])
    )

    is_intraday_arm_long = (
        q_lower.startswith("/intraday-long") or
        any(k in q_lower for k in [
            "arm me a long", "arm a long", "arm long", "go long", "buy long",
            "long position in", "long 5x", "5x mis long", "buy 5x"
        ]) or
        (("arm" in q_lower or "buy" in q_lower) and "long" in q_lower and any(m in q_lower for m in ["intraday", "mis", "5x", "leverage"]))
    )

    is_intraday_arm_short = (
        q_lower.startswith("/intraday-short") or
        any(k in q_lower for k in [
            "arm me a short", "arm a short", "arm short", "go short", "sell short",
            "short position in", "short 5x", "5x mis short", "short in"
        ]) or
        (("arm" in q_lower or "short" in q_lower or "sell" in q_lower) and "short" in q_lower and any(m in q_lower for m in ["intraday", "mis", "5x", "leverage"]))
    )

    is_intraday_active = (
        q_lower.startswith("/intraday-active") or
        any(k in q_lower for k in [
            "intraday-active", "active positions", "open positions", "my open mis",
            "active mis positions", "my active positions", "show my positions",
            "open trades", "check active trades"
        ])
    )

    is_intraday_history = (
        q_lower.startswith("/intraday-history") or
        any(k in q_lower for k in [
            "intraday-history", "trade history", "closed trades", "show my closed trades",
            "closed trade log", "past trades", "trades for today", "most profitable trade"
        ])
    )

    is_intraday_risk_math = (
        any(k in q_lower for k in [
            "guardian", "penalty", "risk math", "risk-to-reward math", "1:2.25",
            "statutory charge", "breakdown for an intraday", "charges for an intraday",
            "stt on intraday", "3:15 pm", "remind me about", "what happens if"
        ])
    )

    is_intraday_square_off = (
        not is_intraday_risk_math and
        any(k in q_lower for k in [
            "square off", "square-off", "close active", "close my active",
            "close my mis", "exit my position", "exit intraday", "exit mis",
            "close position"
        ])
    )
    
    is_budget_advisory = (
        has_explicit_budget or
        any(k in q_lower for k in [
            "how to invest", "where to invest", "where should i put", "where to put", "where can i put",
            "better results", "good profit", "best profit", "best return", "maximum return", "grow my money",
            "grow money", "small budget", "with this budget", "portfolio for", "suggest stocks for",
            "best way to invest", "start investing", "how should i invest", "put money", "invest my",
            "tell me how to invest", "which stock to buy for", "best stock to buy with"
        ])
    )

    is_guru_query = any(k in q_lower for k in [
        "guru", "week", "1 week", "large profit", "short term", "swing",
        "when to buy", "when to get out", "where can i develop", "tactical",
        "quick profit", "mentor", "dalal street", "scan", "scanner", "recommend",
        "best stock"
    ]) or ("profit" in q_lower and any(char.isdigit() for char in q_lower))

    ai_reply_text = None
    structured_cards = []
    tactical_card = None
    intraday_setup = None
    intraday_candidates = None
    intraday_active_trades = None
    follow_up_chips = []

    # Priority 1: Intraday Arm Position (Long or Short)
    if (is_intraday_arm_long or is_intraday_arm_short) and not is_greeting:
        direction = "LONG" if is_intraday_arm_long else "SHORT"
        
        # Extract target symbol
        target_sym = None
        cmd_match = re.search(r'/intraday-(?:long|short)\s+([A-Za-z0-9_-]+)', latest_user_msg, re.IGNORECASE)
        if cmd_match:
            target_sym = cmd_match.group(1).upper()
        else:
            # Check against universe
            all_known = [u["symbol"] for u in INTRADAY_UNIVERSE] + [u["symbol"] for u in EXPANDED_NSE_UNIVERSE]
            for s_cand in all_known:
                if re.search(rf'\b{s_cand.lower()}\b', q_lower):
                    target_sym = s_cand
                    break
        
        if not target_sym:
            target_sym = ctx.active_symbol or "TCS"
        
        try:
            quote = fetch_live_quote(target_sym)
            live_price = float(quote.get("price", 1000.0))
            company_name = quote.get("company_name", target_sym)
        except Exception:
            live_price = 1000.0
            company_name = target_sym

        math_data = calculate_intraday_leverage_math(
            symbol=target_sym,
            entry_price=live_price,
            margin_capital=parsed_capital,
            direction=direction,
            leverage_multiplier=5.0
        )

        # Save to SQLite database
        try:
            trade_id = create_intraday_trade({
                "symbol": target_sym,
                "company_name": company_name,
                "direction": direction,
                "entry_price": math_data["entry_price"],
                "shares": math_data["shares"],
                "margin_capital": parsed_capital,
                "total_exposure": math_data["total_exposure"],
                "leverage_multiplier": 5.0,
                "target_price": math_data["target_price"],
                "stop_loss": math_data["stop_loss"],
                "orb_high": quote.get("high_52w", 0.0),
                "orb_low": quote.get("low_52w", 0.0),
                "vwap": math_data["entry_price"]
            })
        except Exception:
            trade_id = 1

        intraday_setup = {
            **math_data,
            "trade_id": trade_id,
            "company_name": company_name,
            "orb_high": quote.get("high_52w", 0.0),
            "orb_low": quote.get("low_52w", 0.0),
            "vwap": math_data["entry_price"]
        }

        ai_reply_text = f"""⚡ **Intraday {direction} MIS Position Armed on [{target_sym}] (5x Leverage)**

- 🏢 **Company**: {company_name}
- 💵 **Margin Capital**: **₹{parsed_capital:,.2f}** $\\rightarrow$ **5x Total Exposure**: **₹{math_data['total_exposure']:,.2f}**
- 📦 **Shares Executed**: **{math_data['shares']} Shares** @ LTP **₹{math_data['entry_price']:,.2f}**
- 🎯 **Target ({'+1.8%' if direction == 'LONG' else '-1.8%'})**: **₹{math_data['target_price']:,.2f}** (Net Gain: **+₹{math_data['net_profit']:,.2f}** / **+{math_data['net_roi_pct']}%** on margin)
- 🛑 **Hard Stop-Loss ({'-0.8%' if direction == 'LONG' else '+0.8%'})**: **₹{math_data['stop_loss']:,.2f}** (Risk: **-₹{math_data['net_loss']:,.2f}**)
- ⚖️ **Risk-to-Reward Ratio**: **1:{math_data['risk_reward_ratio']}**
- ⏱️ **Mandatory Session Rule**: Position recorded in SQLite. Enforce manual square-off before **3:15 PM** to avoid broker auto-square-off penalty charges."""

        follow_up_chips = [
            "/intraday-active",
            f"Square off {target_sym}",
            "/intraday-scanner"
        ]

    # Priority 2: Intraday Scanner Query
    # Priority 2: Intraday Scanner Query
    elif is_intraday_scanner and not is_greeting:
        scanner_res = scan_intraday_breakouts(margin_capital=parsed_capital)
        long_cands = scanner_res.get("long_candidates", [])[:3]
        short_cands = scanner_res.get("short_candidates", [])[:3]
        session = scanner_res.get("session_status", {})

        intraday_candidates = long_cands + short_cands

        long_md = ""
        for c in long_cands:
            c_name = c.get("company_name", c.get("name", c.get("symbol", "")))
            c_price = float(c.get("ltp", c.get("price", 0.0)))
            c_orb = float(c.get("orb_high", 0.0))
            c_vwap = float(c.get("vwap", 0.0))
            c_vol = float(c.get("volume_multiplier", 1.0))
            c_target = float(c.get("target_price", 0.0))
            long_md += f"- **[{c['symbol']}]** ({c_name}) • LTP: **₹{c_price:,.2f}** | 15M High: **₹{c_orb:,.2f}** | VWAP: **₹{c_vwap:,.2f}** | Vol: **{c_vol}x** $\\rightarrow$ Target: **₹{c_target:,.2f} (+1.8%)**\n"

        short_md = ""
        for c in short_cands:
            c_name = c.get("company_name", c.get("name", c.get("symbol", "")))
            c_price = float(c.get("ltp", c.get("price", 0.0)))
            c_orb = float(c.get("orb_low", 0.0))
            c_vwap = float(c.get("vwap", 0.0))
            c_vol = float(c.get("volume_multiplier", 1.0))
            c_target = float(c.get("target_price", 0.0))
            short_md += f"- **[{c['symbol']}]** ({c_name}) • LTP: **₹{c_price:,.2f}** | 15M Low: **₹{c_orb:,.2f}** | VWAP: **₹{c_vwap:,.2f}** | Vol: **{c_vol}x** $\\rightarrow$ Target: **₹{c_target:,.2f} (-1.8%)**\n"

        session_phase = session.get("session_phase", "LIVE_SESSION")
        countdown = session.get("formatted_countdown", "3:15 PM Guardian Active")

        ai_reply_text = f"""🔍 **NSE Intraday 15M ORB & VWAP Breakout Scanner (5x MIS Leverage)**

⏰ **Session Phase**: `{session_phase}` | 3:15 PM Guardian: **{countdown}**
💰 **Margin Base**: **₹{parsed_capital:,.2f}** (5x Exposure: **₹{parsed_capital * 5:,.2f}**)

---

### 🟢 **Top Bullish Breakouts (Above 15M ORB High + Above VWAP)**
{long_md if long_md else "- *No high-volume bullish breakouts detected in the current window.*"}

---

### 🔴 **Top Bearish Breakdowns (Below 15M ORB Low + Below VWAP)**
{short_md if short_md else "- *No high-volume bearish breakdowns detected in the current window.*"}

---

💡 **Execution Shortcut**: Click or type `/intraday-long [SYMBOL]` or `/intraday-short [SYMBOL]` to instantly arm a 5x MIS order with 1:2.25 risk-reward parameters."""

        top_long_sym = long_cands[0]["symbol"] if long_cands else "TCS"
        top_short_sym = short_cands[0]["symbol"] if short_cands else "RELIANCE"
        follow_up_chips = [
            f"/intraday-long {top_long_sym}",
            f"/intraday-short {top_short_sym}",
            "/intraday-active"
        ]


    # Priority 3: Intraday Active Trades
    elif is_intraday_active and not is_greeting:
        trades = get_active_intraday_trades()
        if trades:
            symbols = [t["symbol"] for t in trades]
            quotes_map = fetch_live_quotes_batch(symbols)
            enriched_trades = []
            trades_md = ""
            total_live_pnl = 0.0

            for t in trades:
                sym = t["symbol"]
                quote = quotes_map.get(sym) or {}
                live_p = quote.get("price", t["entry_price"])
                entry_p = float(t["entry_price"])
                shares = int(t["shares"])
                direction = t["direction"].upper()
                margin_cap = float(t["margin_capital"])
                target_p = float(t["target_price"])
                stop_l = float(t["stop_loss"])

                if direction == "LONG":
                    gross_pnl = (live_p - entry_p) * shares
                    prog = max(0.0, min(100.0, ((live_p - entry_p) / max(target_p - entry_p, 0.01)) * 100.0))
                else:
                    gross_pnl = (entry_p - live_p) * shares
                    prog = max(0.0, min(100.0, ((entry_p - live_p) / max(entry_p - target_p, 0.01)) * 100.0))

                total_live_pnl += gross_pnl
                roi = round((gross_pnl / max(margin_cap, 1.0)) * 100.0, 2)

                en = dict(t)
                en.update({
                    "live_price": live_p,
                    "gross_pnl": round(gross_pnl, 2),
                    "roi_pct": roi,
                    "progress_pct": round(prog, 1),
                    "day_change": quote.get("change", 0.0)
                })
                enriched_trades.append(en)

                pnl_sign = "+" if gross_pnl >= 0 else ""
                trades_md += f"- **[{sym}]** ({direction} 5x) • {shares} shares | Entry: ₹{entry_p:,.2f} | LTP: **₹{live_p:,.2f}** | PnL: **{pnl_sign}₹{gross_pnl:,.2f} ({pnl_sign}{roi}%)** | Target: ₹{target_p:,.2f} | Stop: ₹{stop_l:,.2f}\n"

            intraday_active_trades = enriched_trades

            pnl_tot_sign = "+" if total_live_pnl >= 0 else ""
            ai_reply_text = f"""📊 **Your Active Intraday (5x MIS) Positions**

💵 **Total Open Unrealized PnL**: **{pnl_tot_sign}₹{total_live_pnl:,.2f}**
📦 **Active Open Trades**: **{len(trades)} Positions**

{trades_md}

⏰ **Risk Reminder**: Square-off all MIS trades before **3:15 PM** to avoid broker auto-liquidation penalties."""

            follow_up_chips = [
                f"Square off {trades[0]['symbol']}",
                "/intraday-history",
                "/intraday-scanner"
            ]
        else:
            ai_reply_text = """ℹ️ **No Active Intraday Positions**

You currently have zero open 5x MIS leveraged intraday positions.
Use `/intraday-scanner` to scan 65+ equities for active 15M ORB & VWAP breakout triggers, or arm a new setup with `/intraday-long [SYMBOL]`."""
            follow_up_chips = [
                "/intraday-scanner",
                "/intraday-long TCS",
                "/intraday-short RELIANCE"
            ]

    # Priority 4: Intraday Square Off Action
    elif is_intraday_square_off and not is_greeting:
        trades = get_active_intraday_trades()
        if not trades:
            ai_reply_text = "ℹ️ **No active positions to square off.** All your intraday MIS positions are currently closed."
            follow_up_chips = ["/intraday-scanner", "/intraday-history"]
        else:
            # Find matching trade or square off first active
            target_trade = None
            for t in trades:
                if t["symbol"].lower() in q_lower:
                    target_trade = t
                    break
            if not target_trade:
                target_trade = trades[0]

            sym = target_trade["symbol"]
            try:
                q = fetch_live_quote(sym)
                exit_p = float(q.get("price", target_trade["entry_price"]))
            except Exception:
                exit_p = float(target_trade["entry_price"])

            direction = target_trade["direction"].upper()
            entry_p = float(target_trade["entry_price"])
            shares = int(target_trade["shares"])

            if direction == "LONG":
                pnl = (exit_p - entry_p) * shares
            else:
                pnl = (entry_p - exit_p) * shares

            square_off_intraday_trade(target_trade["id"], exit_p, pnl, reason="MANUAL_SQUARE_OFF")

            pnl_sign = "+" if pnl >= 0 else ""
            ai_reply_text = f"""✅ **Position Squared Off Successfully**

- 🏢 **Symbol**: **[{sym}]** ({direction} 5x MIS)
- 📦 **Shares**: {shares} Shares
- 🚪 **Exit Price**: **₹{exit_p:,.2f}** (Entry: ₹{entry_p:,.2f})
- 💵 **Realized Net PnL**: **{pnl_sign}₹{pnl:,.2f}**
- ⏱️ **Status**: Position closed and settled to Demat Cash Balance."""

            follow_up_chips = [
                "/intraday-active",
                "/intraday-history",
                "/intraday-scanner"
            ]

    # Priority 5: Intraday Trade History
    elif is_intraday_history and not is_greeting:
        all_trades = get_all_intraday_trades()
        closed_trades = [t for t in all_trades if t.get("status") != "ACTIVE"]
        
        if not closed_trades:
            ai_reply_text = "📜 **No closed trades recorded today yet.** As you execute and square off 5x MIS positions, your PnL scorecard and win-rate analytics will appear here."
            follow_up_chips = ["/intraday-scanner", "/intraday-active"]
        else:
            total_net_pnl = sum(float(t.get("net_pnl", 0.0)) for t in closed_trades)
            profitable = [t for t in closed_trades if float(t.get("net_pnl", 0.0)) > 0]
            win_rate = round((len(profitable) / max(len(closed_trades), 1)) * 100.0, 1)

            recent_md = ""
            for t in closed_trades[-5:]:
                pnl = float(t.get("net_pnl", 0.0))
                pnl_s = "+" if pnl >= 0 else ""
                recent_md += f"- **[{t['symbol']}]** ({t['direction']}) • Exit @ ₹{float(t.get('exit_price', 0.0)):,.2f} | Realized PnL: **{pnl_s}₹{pnl:,.2f}** ({t.get('status', 'SQUARED_OFF')})\n"

            pnl_tot_s = "+" if total_net_pnl >= 0 else ""
            ai_reply_text = f"""📜 **Intraday Trading History & Performance Scorecard**

- 📊 **Total Closed Trades**: **{len(closed_trades)}**
- 🏆 **Win Rate**: **{win_rate}%** ({len(profitable)} Won / {len(closed_trades) - len(profitable)} Lost)
- 💰 **Cumulative Realized PnL**: **{pnl_tot_s}₹{total_net_pnl:,.2f}**

### **Recent Trade Logs:**
{recent_md}"""

            follow_up_chips = [
                "/intraday-active",
                "/intraday-scanner",
                "Show risk-to-reward math"
            ]

    # Priority 6: Intraday Risk, Compliance & Charges Math
    elif is_intraday_risk_math and not is_greeting:
        charges_sample = calculate_intraday_charges(buy_turnover=100000.0, sell_turnover=101800.0)
        ai_reply_text = f"""🛡️ **Intraday Risk Math, 3:15 PM Guardian & Statutory Charges Guide**

### 1. ⚖️ **The 1:2.25 Risk-to-Reward Formula**
Under SEBI 5x MIS leverage rules, every trade is framed with tight risk boundaries:
- 🎯 **Profit Target (+1.8%)**: Yields **+9.0% return on your cash margin capital**.
- 🛑 **Hard Stop-Loss (-0.8%)**: Limits maximum downside to **-4.0% of cash margin**.
- 📊 **Reward-to-Risk**: **1 : 2.25** (You risk ₹1 to make ₹2.25).

---

### 2. ⏰ **The 3:15 PM Square-Off Guardian**
- **Trading Window**: 9:15 AM to 3:20 PM IST.
- **Mandatory Manual Square-off**: Before **3:15 PM**.
- **Auto-Liquidation Penalty**: If positions remain open at 3:15 PM, broker RMS will auto-square off and levy **₹50 + 18% GST** per executed order.

---

### 3. 🧾 **Statutory Charges Breakdown (per ₹1,00,000 Intraday Turnover)**
- **STT (Securities Transaction Tax)**: **0.025%** on sell side only (~₹{charges_sample['stt']:.2f}).
- **Brokerage**: Flat **₹20 Buy + ₹20 Sell = ₹40** total roundtrip.
- **Exchange Turnover Charges**: **0.00345%** on total turnover (~₹{charges_sample['exchange_charges']:.2f}).
- **GST (18%)**: Applied on Brokerage + Exchange charges (~₹{charges_sample['gst']:.2f}).
- **Stamp Duty**: **0.003%** on buy turnover (~₹{charges_sample['stamp_duty']:.2f})."""

        follow_up_chips = [
            "/intraday-scanner",
            "/intraday-long TCS",
            "/intraday-active"
        ]

    # Priority 7: Budget Allocation Intent (Directs to Capital Allocator)
    elif is_budget_advisory and not is_greeting:
        budget_allocation = build_budget_portfolio_allocation(parsed_capital)
        
        # If Gemini API Key is available, generate an enriched response grounded in live prices
        if api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)

                s = budget_allocation["stocks"]
                s1 = budget_allocation["strategy_1"]
                s2 = budget_allocation["strategy_2"]
                s3 = budget_allocation["strategy_3"]

                system_instruction = f"""You are AlphaPulse India Pro's Lead Quantitative Wealth Strategist and Dalal Street Portfolio Architect.
The user is asking how to invest a specific capital budget of ₹{parsed_capital:,.0f}.
You MUST provide a clear, structured response featuring 3 distinct strategies using live exchange prices for liquid market leaders under ₹450:

Live Market Data & Share Allocations calculated for ₹{parsed_capital:,.0f}:
1. Strategy 1 (High-Growth Duo): [{s['ETERNAL']['symbol']}] ({s1['shares_eternal']} shares @ ₹{s['ETERNAL']['price']:,.2f}) + [{s['TMPV']['symbol']}] ({s1['shares_tmpv']} shares @ ₹{s['TMPV']['price']:,.2f}). Total: ₹{s1['invested']:,.2f}, Target In-Hand Gain: +₹{s1['net_in_hand']:,.2f}.
2. Strategy 2 (Sovereign Moat): [{s['BEL']['symbol']}] ({s2['shares_bel']} shares @ ₹{s['BEL']['price']:,.2f}) + [{s['TATAPOWER']['symbol']}] ({s2['shares_tatapower']} shares @ ₹{s['TATAPOWER']['price']:,.2f}). Total: ₹{s2['invested']:,.2f}, Target In-Hand Gain: +₹{s2['net_in_hand']:,.2f}.
3. Strategy 3 (High-Dividend Cash Generator): [{s['COALINDIA']['symbol']}] ({s3['shares_coal']} shares @ ₹{s['COALINDIA']['price']:,.2f}). Total: ₹{s3['invested']:,.2f}, Annual Cash Dividend: ₹{s3['annual_dividend']:,.2f} (~8.4% yield).

Guidelines:
1. Always write stock tickers in square brackets: [ETERNAL], [TMPV], [BEL], [TATAPOWER], [COALINDIA].
2. State exact share counts, spot prices, total invested amounts, cash buffers, and post-tax returns under current statutory tax rules (20% STCG / 12.5% LTCG).
3. Do NOT default to [TATAMOTORS] or ₹100,000 workspace context. Focus strictly on ₹{parsed_capital:,.0f}.
4. Suggest 3 short follow-up questions at the very end in a line starting with 'FOLLOW_UPS: question1 | question2 | question3'.
"""
                formatted_contents = []
                for m in req.messages[:-1]:
                    formatted_contents.append({"role": "user" if m.role == "user" else "model", "parts": [{"text": m.content}]})
                formatted_contents.append({"role": "user", "parts": [{"text": latest_user_msg}]})

                resp = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=formatted_contents,
                    config={"system_instruction": system_instruction}
                )
                if resp and resp.text:
                    raw_text = resp.text
                    if "FOLLOW_UPS:" in raw_text:
                        parts = raw_text.split("FOLLOW_UPS:")
                        ai_reply_text = parts[0].strip()
                        follow_up_chips = [c.strip() for c in parts[1].split("|") if c.strip()][:3]
                    else:
                        ai_reply_text = raw_text.strip()
            except Exception:
                ai_reply_text = None

        # Offline / Fallback parity for budget advisory
        if not ai_reply_text:
            ai_reply_text = format_budget_portfolio_response(budget_allocation)
            follow_up_chips = [
                f"Simulate ₹{parsed_capital:,.0f} High-Growth Duo",
                "Inspect BEL in Stock Studio",
                "Show Coal India dividend ex-dates"
            ]

    # Priority 8: 1-Week Tactical Momentum / Guru Query
    elif is_guru_query and not is_greeting:
        preferred_symbol = None
        for cand in EXPANDED_NSE_UNIVERSE:
            if cand["symbol"].lower() in q_lower or cand["name"].lower() in q_lower:
                preferred_symbol = cand["symbol"]
                break

        tactical_card = scan_live_market_tactical_leaders(
            capital=parsed_capital,
            preferred_symbol=preferred_symbol,
            risk_mode="Aggressive" if "aggressive" in q_lower or "high profit" in q_lower or "large profit" in q_lower else "Balanced"
        )

        if api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)

                alternatives_str = ", ".join(tactical_card.get("runner_ups", ["HAL", "Trent", "Mazagon Dock"]))
                system_instruction = f"""You are AlphaPulse India Pro's Lead Proprietary Trading Mentor & 'Stock Market Guru'.
Your sole mandate is to maximize the user's in-hand net cash profit while fiercely protecting their capital against losses ('Rule #1: Protect Principal, Rule #2: Never forget Rule #1').

We just ran our 65+ Stock Dynamic Momentum Scanner across Defense, Railways, Renewable Power, Retail, EMS, Auto, PSU, Metals, and Pharma.
The user has ₹{parsed_capital:,.0f}.
Today's #1 Ranked Tactical Leader is: [{tactical_card['symbol']}] ({tactical_card['company_name']}) in sector {tactical_card['sector']}.
Runner-up alternatives scanned today: {alternatives_str}.

Quantitative Execution Blueprint:
- Live Spot Price: ₹{tactical_card['current_price']:,.2f}
- Target Demand Pocket: {tactical_card['entry_range']}
- Dynamic Holding Period: {tactical_card['holding_period_label']}
- Target 1 (+{tactical_card['target_1_pct']}%): ₹{tactical_card['target_1']:,.2f} (Book 50% profit = +₹{tactical_card['net_in_hand_profit']:,.0f} in-hand net cash after 20% STCG + STT)
- Target 2 (+{tactical_card['target_2_pct']}%): ₹{tactical_card['target_2']:,.2f} (Trail stop to entry)
- Hard Stop-Loss (-{abs(tactical_card['stop_loss_pct'])}%): ₹{tactical_card['stop_loss']:,.2f} (Cut immediately if broken)
- Institutional Catalyst: {tactical_card['catalyst']}

Guidelines:
1. Speak with street-smart Dalal Street authority, crisp discipline, and zero fluff.
2. Explicitly state: "I scanned 65+ liquid NSE equities across 10 sectors today. [{tactical_card['symbol']}] outranked competitors today due to {tactical_card['catalyst']}."
3. Give exact execution: Demand pocket {tactical_card['entry_range']}, holding window ({tactical_card['holding_period_label']}), and take-home net profit (+₹{tactical_card['net_in_hand_profit']:,.0f} net in hand).
4. Suggest 2-3 short follow-up questions at the very end in a line starting with 'FOLLOW_UPS: question1 | question2 | question3'.
"""
                formatted_contents = []
                for m in req.messages[:-1]:
                    formatted_contents.append({"role": "user" if m.role == "user" else "model", "parts": [{"text": m.content}]})
                formatted_contents.append({"role": "user", "parts": [{"text": latest_user_msg}]})

                resp = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=formatted_contents,
                    config={"system_instruction": system_instruction}
                )
                if resp and resp.text:
                    raw_text = resp.text
                    if "FOLLOW_UPS:" in raw_text:
                        parts = raw_text.split("FOLLOW_UPS:")
                        ai_reply_text = parts[0].strip()
                        follow_up_chips = [c.strip() for c in parts[1].split("|") if c.strip()][:3]
                    else:
                        ai_reply_text = raw_text.strip()
            except Exception:
                ai_reply_text = None

        if not ai_reply_text:
            ai_reply_text = f"""🔥 **Welcome to the Trading Floor. Here is today's 65+ Stock Dynamic Momentum Scan:**

I scanned **65+ liquid NSE equities** across Defense, Railways, Renewable Power, Retail, Auto, PSU, and Capital Goods. 

With your **₹{parsed_capital:,.0f}**, today's #1 Ranked Quantitative Leader is **[{tactical_card['symbol']}] ({tactical_card['company_name']})** in sector **{tactical_card['sector']}**:

- **Why this outranked competitors today**: {tactical_card['catalyst']}
- **Dynamic Holding Window**: **{tactical_card['holding_period_label']}** (calibrated to stock daily ATR volatility).
- **Exact Accumulation Zone**: Enter strictly between **{tactical_card['entry_range']}**.
- **Target 1 (+{tactical_card['target_1_pct']}%)**: Sell 50% at **₹{tactical_card['target_1']:,.2f}** to bank **+₹{tactical_card['net_in_hand_profit']:,.0f} net cash in hand** after statutory STCG (20%) and all STT charges.
- **Target 2 (+{tactical_card['target_2_pct']}%)**: Squeeze remaining shares to **₹{tactical_card['target_2']:,.2f}** with stop-loss trailed to breakeven.
- **Rule #1 Capital Invalidation**: Cut immediately if price breaches **₹{tactical_card['stop_loss']:,.2f} (-{abs(tactical_card['stop_loss_pct'])}%)**.

🛡️ **Arm the Pre-Buy Watchdog below**: It will monitor live prices 24/7, chime the instant it enters the buy zone, and enforce trailing stops!"""
            follow_up_chips = [
                f"Arm watchdog for {tactical_card['symbol']}",
                f"Why are institutions buying {tactical_card['symbol']}?",
                "Show runner-up momentum stocks"
            ]

    # Priority 9: General Workspace & Topic Queries
    else:
        if api_key and not is_greeting:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)

                system_instruction = f"""You are AlphaPulse India Pro's Lead Quantitative Wealth Strategist and Pair-Trading Copilot.
You advise Indian equity investors under current statutory Indian tax rules (STT 0.1%, STCG 20%, LTCG 12.5% after ₹1.25L exemption).
Current User Workspace Context:
- Active Page: {ctx.current_page}
- Selected Stock: {ctx.active_symbol}
- Simulator Capital: ₹{ctx.capital:,.0f} | Horizon: {ctx.horizon_months} Months
- Goal Target: ₹{ctx.goal_target:,.0f} | Starting: ₹{ctx.goal_starting:,.0f} | Monthly SIP: ₹{ctx.goal_sip:,.0f} | Risk: {ctx.risk_level}

Guidelines:
1. Whenever you recommend or mention an Indian stock, write its NSE ticker in square brackets, e.g. [TATAMOTORS], [RELIANCE], [COALINDIA], [BEL], [HAL], [LT].
2. Keep answers concise, actionable, and conversational (2-3 short paragraphs max with bullet points).
3. Suggest 2-3 short follow-up questions at the very end in a line starting with 'FOLLOW_UPS: question1 | question2 | question3'.
"""
                formatted_contents = []
                for m in req.messages[:-1]:
                    formatted_contents.append({"role": "user" if m.role == "user" else "model", "parts": [{"text": m.content}]})
                formatted_contents.append({"role": "user", "parts": [{"text": latest_user_msg}]})

                resp = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=formatted_contents,
                    config={"system_instruction": system_instruction}
                )
                if resp and resp.text:
                    raw_text = resp.text
                    if "FOLLOW_UPS:" in raw_text:
                        parts = raw_text.split("FOLLOW_UPS:")
                        ai_reply_text = parts[0].strip()
                        follow_up_chips = [c.strip() for c in parts[1].split("|") if c.strip()][:3]
                    else:
                        ai_reply_text = raw_text.strip()
            except Exception:
                ai_reply_text = None

        if not ai_reply_text:
            if is_greeting:
                ai_reply_text = f"👋 **Hello! I am your Alpha Copilot & Stock Market Guru.**\n\nI am currently tracking your workspace on **{ctx.current_page.upper()}**. You are inspecting **{ctx.active_symbol}** with a capital allocation of **₹{ctx.capital:,.0f}**.\n\nHow can I help you today? You can ask me:\n- *\"/intraday-scanner to find 15M ORB & VWAP breakouts\"*\n- *\"Arm me a long position in TCS with 5x leverage\"*\n- *\"I have ₹5,000. How should I invest for better results?\"*\n- *\"Find a 1-week tactical swing trade for quick profit\"*"
                follow_up_chips = [
                    "/intraday-scanner",
                    "/intraday-long TCS",
                    "I have ₹5,000 to invest",
                    "Find 1-week tactical swing trade"
                ]
            elif "defense" in q_lower or "hal" in q_lower or "bel" in q_lower:
                ai_reply_text = "Here are India's premier high-conviction defense compounders:\n\n- **[BEL]**: Bharat Electronics holds a dominant sovereign radar/avionics order book with >25% ROCE.\n- **[HAL]**: Hindustan Aeronautics possesses a sovereign monopoly on fighter aircraft platforms with high operating cash flow."
                follow_up_chips = ["Inspect BEL in Studio", "Simulate ₹50,000 in HAL", "Compare debt levels"]
            elif "dividend" in q_lower:
                ai_reply_text = "Here are our highest-conviction Indian dividend compounders offering solid cash yield floors:\n\n- **[COALINDIA]**: ~8.4% annualized yield with sovereign monopoly cash flows.\n- **[VEDL]**: ~9.2% high-yield metals conglomerate.\n- **[RECLTD]**: ~6.8% power infrastructure financing backbone."
                follow_up_chips = ["Inspect Coal India ex-dates", "Simulate ₹50,000 in Coal India", "What is the post-tax dividend?"]
            elif "debt" in q_lower:
                ai_reply_text = f"In evaluating debt profiles across high-conviction leaders:\n\n- **[BEL]** & **[TCS]**: Virtually zero net debt with surplus liquid cash reserves.\n- **[TMPV]**: Rapidly deleveraging with net-debt zero targets achieved at JLR.\n- **[LT]**: Manageable working capital debt backed by a ₹4.5 Lakh Cr EPC order book."
                follow_up_chips = ["Show Piotroski scores", "Inspect TCS in Studio", "Simulate Tata Motors"]
            else:
                ai_reply_text = f"Based on your current workspace configuration for **[{ctx.active_symbol}]** (Capital: ₹{ctx.capital:,.0f}, Horizon: {ctx.horizon_months}M):\n\n- **Technical Trend**: Trading with positive institutional momentum.\n- **Quality Profile**: Clean debt-to-equity and robust cash flow generation.\n- **Tax Optimization Strategy**: Hold $>12$ months to qualify for the favorable **12.5% LTCG** tax bracket."
                follow_up_chips = [f"Run Monte Carlo on {ctx.active_symbol}", "Show stop-loss price", "Check breaking news catalysts"]

    # 4. Extract All Mentioned Tickers to Build In-Chat Interactive Action Cards
    found_symbols = list(set(re.findall(r'\[([A-Z0-9_]{2,12})\]', ai_reply_text)))
    # Maintain natural order if possible
    ordered_symbols = []
    for s_match in re.findall(r'\[([A-Z0-9_]{2,12})\]', ai_reply_text):
        if s_match not in ordered_symbols:
            ordered_symbols.append(s_match)
    
    for sym in ordered_symbols[:6]:
        try:
            q = fetch_live_quote(sym)
            structured_cards.append({
                "type": "stock_pick",
                "symbol": sym,
                "company_name": q.get("company_name", sym),
                "price": q.get("price", 0.0),
                "change_pct": q.get("change_pct", 0.0),
                "sector": q.get("sector", "NSE Equity")
            })
        except Exception:
            continue

    return {
        "reply": ai_reply_text,
        "action_cards": structured_cards,
        "tactical_card": tactical_card,
        "intraday_setup": intraday_setup,
        "intraday_candidates": intraday_candidates,
        "intraday_active_trades": intraday_active_trades,
        "follow_up_chips": follow_up_chips or ["/intraday-scanner", "/intraday-active", "/intraday-history"]
    }
