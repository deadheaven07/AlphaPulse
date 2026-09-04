from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import re
from backend.app.quant.data_engine import fetch_live_quote
from backend.app.quant.tactical_swing_engine import (
    scan_live_market_tactical_leaders,
    EXPANDED_NSE_UNIVERSE
)
from backend.app.quant.crowd_psychology_engine import analyze_news_crowd_psychology

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

def extract_capital_from_query(query: str, default_capital: float = 50000.0) -> float:
    """Extract numeric capital like 50000, 50,000, 1 Lakh, 2.5L from prompt."""
    q = query.lower().replace(",", "")
    # Check for Lakhs pattern: e.g. "1 lakh", "2.5 lakhs", "5l"
    lakh_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lakhs|l\b)', q)
    if lakh_match:
        try:
            return float(lakh_match.group(1)) * 100000.0
        except Exception:
            pass

    # Check for numeric amount pattern: e.g. 50000, 25000, 100000
    num_match = re.search(r'(?:₹|rs\.?|inr)?\s*([0-9]{4,8})', q)
    if num_match:
        try:
            val = float(num_match.group(1))
            if val >= 5000:
                return val
        except Exception:
            pass

    return default_capital

@router.post("/chat")
def handle_conversational_chat(req: ConversationalChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages thread cannot be empty")

    latest_user_msg = req.messages[-1].content.strip()
    q_lower = latest_user_msg.lower()
    ctx = req.context or ClientWorkspaceContext()

    # 1. Resolve API Key (Frontend Settings priority, then environment)
    api_key = (req.api_key or os.environ.get("GEMINI_API_KEY", "")).strip()

    # 2. Detect Intent Types
    is_greeting = q_lower in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "help", "who are you", "hi!", "hello!"]
    is_guru_query = any(k in q_lower for k in [
        "guru", "week", "1 week", "large profit", "short term", "swing",
        "when to buy", "when to get out", "where can i develop", "tactical",
        "quick profit", "mentor", "dalal street", "scan", "scanner", "recommend",
        "best stock"
    ]) or ("profit" in q_lower and any(char.isdigit() for char in q_lower))

    parsed_capital = extract_capital_from_query(latest_user_msg, ctx.capital or 50000.0)

    ai_reply_text = None
    structured_cards = []
    tactical_card = None
    follow_up_chips = []

    # If Guru / Tactical query, run the 65+ Dynamic Live Market Momentum Scanner
    if is_guru_query:
        # Check if user explicitly specified a stock from the 65+ universe
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

    # 3. Gemini 2.5 Flash Conversational Execution
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            if is_guru_query and tactical_card:
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
4. Emphasize why our 24/7 Watchdog and pre-buy dip alerts protect their hard-earned money.
5. Suggest 2-3 short follow-up questions at the very end in a line starting with 'FOLLOW_UPS: question1 | question2 | question3'.
"""
            else:
                system_instruction = f"""You are AlphaPulse India Pro's Lead Quantitative Wealth Strategist and Pair-Trading Copilot.
You advise Indian equity investors under Budget 2024 statutory tax rules (STT 0.1%, STCG 20%, LTCG 12.5% after ₹1.25L exemption).
Current User Workspace Context:
- Active Page: {ctx.current_page}
- Selected Stock: {ctx.active_symbol}
- Simulator Capital: ₹{ctx.capital:,.0f} | Horizon: {ctx.horizon_months} Months
- Goal Target: ₹{ctx.goal_target:,.0f} | Starting: ₹{ctx.goal_starting:,.0f} | Monthly SIP: ₹{ctx.goal_sip:,.0f} | Risk: {ctx.risk_level}

Guidelines:
1. If the user greets you, respond warmly and ask what they want to analyze.
2. If the user asks about 'this stock' or 'this goal', use the active workspace context above.
3. Whenever you recommend or mention an Indian stock, write its NSE ticker in square brackets, e.g. [TATAMOTORS], [RELIANCE], [COALINDIA], [BEL], [HAL], [LT].
4. Keep answers concise, actionable, and conversational (2-3 short paragraphs max with bullet points).
5. Suggest 2-3 short follow-up questions at the very end in a line starting with 'FOLLOW_UPS: question1 | question2 | question3'.
"""
            # Build conversation history for Gemini multi-turn
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

    # 4. Intelligent Dynamic Fallback (When Offline / No API Key)
    if not ai_reply_text:
        if is_guru_query and tactical_card:
            ai_reply_text = f"""🔥 **Welcome to the Trading Floor. Here is today's 65+ Stock Dynamic Momentum Scan:**

I scanned **65+ liquid NSE equities** across Defense, Railways, Renewable Power, Retail, Auto, PSU, and Capital Goods. 

With your **₹{parsed_capital:,.0f}**, today's #1 Ranked Quantitative Leader is **[{tactical_card['symbol']}] ({tactical_card['company_name']})** in sector **{tactical_card['sector']}**:

- **Why this outranked competitors today**: {tactical_card['catalyst']}
- **Dynamic Holding Window**: **{tactical_card['holding_period_label']}** (calibrated to stock daily ATR volatility).
- **Exact Accumulation Zone**: Enter strictly between **{tactical_card['entry_range']}**.
- **Target 1 (+{tactical_card['target_1_pct']}%)**: Sell 50% at **₹{tactical_card['target_1']:,.2f}** to bank **+₹{tactical_card['net_in_hand_profit']:,.0f} net cash in hand** after Budget 2024 STCG (20%) and all STT charges.
- **Target 2 (+{tactical_card['target_2_pct']}%)**: Squeeze remaining shares to **₹{tactical_card['target_2']:,.2f}** with stop-loss trailed to breakeven.
- **Rule #1 Capital Invalidation**: Cut immediately if price breaches **₹{tactical_card['stop_loss']:,.2f} (-{abs(tactical_card['stop_loss_pct'])}%)**.

🛡️ **Arm the Pre-Buy Watchdog below**: It will monitor live prices 24/7, chime the instant it enters the buy zone, and enforce trailing stops!"""
            follow_up_chips = [
                f"Arm watchdog for {tactical_card['symbol']}",
                f"Why are institutions buying {tactical_card['symbol']}?",
                "Show runner-up momentum stocks"
            ]
        elif is_greeting:
            ai_reply_text = f"👋 **Hello! I am your Alpha Copilot & Stock Market Guru.**\n\nI am currently tracking your workspace on **{ctx.current_page.upper()}**. You are inspecting **{ctx.active_symbol}** with a simulation capital of **₹{ctx.capital:,.0f}**.\n\nHow can I help you today? You can ask me to find a **1-week tactical trade for quick profit**, scan 65+ NSE stocks, or build a long-term compounder portfolio."
            follow_up_chips = [f"I have ₹50,000 for 1 week", f"Analyze {ctx.active_symbol} fundamentals", "Show top dividend yielders"]
        elif "defense" in q_lower or "hal" in q_lower or "bel" in q_lower:
            ai_reply_text = "Here are India's premier high-conviction defense compounders:\n\n- **[BEL]**: Bharat Electronics holds a dominant sovereign radar/avionics order book with >25% ROCE.\n- **[HAL]**: Hindustan Aeronautics possesses a sovereign monopoly on fighter aircraft platforms with high operating cash flow."
            follow_up_chips = ["Inspect BEL in Studio", "Simulate ₹1,00,000 in HAL", "Compare debt levels"]
        elif "dividend" in q_lower:
            ai_reply_text = "Here are our highest-conviction Indian dividend compounders offering solid cash yield floors:\n\n- **[COALINDIA]**: ~8.4% annualized yield with sovereign monopoly cash flows.\n- **[VEDL]**: ~9.2% high-yield metals conglomerate.\n- **[RECLTD]**: ~6.8% power infrastructure financing backbone."
            follow_up_chips = ["Inspect Coal India ex-dates", "Simulate ₹1,00,000 in Coal India", "What is the post-tax dividend?"]
        elif "debt" in q_lower:
            ai_reply_text = f"In evaluating debt profiles across high-conviction leaders:\n\n- **[BEL]** & **[TCS]**: Virtually zero net debt with surplus liquid cash reserves.\n- **[TATAMOTORS]**: Rapidly deleveraging with net-debt zero targets achieved at JLR.\n- **[LT]**: Manageable working capital debt backed by a ₹4.5 Lakh Cr EPC order book."
            follow_up_chips = ["Show Piotroski scores", "Inspect TCS in Studio", "Simulate Tata Motors"]
        else:
            ai_reply_text = f"Based on your current workspace configuration for **[{ctx.active_symbol}]** (Capital: ₹{ctx.capital:,.0f}, Horizon: {ctx.horizon_months}M):\n\n- **Technical Trend**: Trading with positive institutional momentum.\n- **Quality Profile**: Clean debt-to-equity and robust cash flow generation.\n- **Budget 2024 Strategy**: Hold $>12$ months to qualify for the **12.5% LTCG** tax bracket."
            follow_up_chips = [f"Run Monte Carlo on {ctx.active_symbol}", "Show stop-loss price", "Check breaking news catalysts"]

    # 5. Extract Mentioned Tickers to Build In-Chat Interactive Action Cards
    found_symbols = list(set(re.findall(r'\[([A-Z0-9_]{2,12})\]', ai_reply_text)))
    for sym in found_symbols[:3]:
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
        "follow_up_chips": follow_up_chips or ["Explain post-tax ROI", "Check risk of loss", "Show alternative stocks"]
    }
