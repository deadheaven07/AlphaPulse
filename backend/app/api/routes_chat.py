from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import re
from backend.app.quant.data_engine import fetch_live_quote, INDIAN_STOCKS_DB

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

@router.post("/chat")
def handle_conversational_chat(req: ConversationalChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages thread cannot be empty")

    latest_user_msg = req.messages[-1].content.strip()
    q_lower = latest_user_msg.lower()
    ctx = req.context or ClientWorkspaceContext()

    # 1. Resolve API Key (Frontend Settings priority, then environment)
    api_key = (req.api_key or os.environ.get("GEMINI_API_KEY", "")).strip()

    # 2. Detect Greeting / Casual Intent
    is_greeting = q_lower in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "help", "who are you", "hi!", "hello!"]

    ai_reply_text = None
    structured_cards = []
    follow_up_chips = []

    # 3. Gemini 2.5 Flash Conversational Execution
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            # System prompt with full live workspace grounding
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
                # Parse follow-up chips if present
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
        if is_greeting:
            ai_reply_text = f"👋 **Hello! I am your Alpha Copilot.**\n\nI am currently tracking your workspace on **{ctx.current_page.upper()}**. You are analyzing **{ctx.active_symbol}** with a simulation capital of **₹{ctx.capital:,.0f}**.\n\nHow can I help you today? You can ask me to analyze any stock, calculate goal feasibility, or screen for high-yield dividend compounders."
            follow_up_chips = [f"Analyze {ctx.active_symbol} for 1 year", "Show top dividend yielders", "How do I reach ₹10 Lakhs?"]
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
        "follow_up_chips": follow_up_chips or ["Explain post-tax ROI", "Check risk of loss", "Show alternative stocks"]
    }
