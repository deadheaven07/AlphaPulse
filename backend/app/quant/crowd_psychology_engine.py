import re
from typing import Dict, Any

def analyze_news_crowd_psychology(symbol: str, headline: str, summary: str = "", delivery_pct: float = 45.0) -> Dict[str, Any]:
    """
    Evaluates news catalyst severity and predicts crowd psychology:
    Will retail panic dump, or will institutional smart money buy the dip?
    """
    text = f"{headline} {summary}".lower()

    # Fatal Triggers (Cascading panic selloff & lower circuit risk)
    fatal_keywords = [
        "sebi", "cbi", "raid", "fraud", "forensic audit", "scam", "arrest", 
        "resigns", "promoter selling", "pledge invocation", "default", 
        "bankruptcy", "insolvency", "whistleblower", "investigation", "manipulation",
        "ed raid", "tax evasion", "license cancelled", "cheating", "irregularities"
    ]

    # Non-Fatal / Temporary Overreaction Triggers
    noise_keywords = [
        "clarification", "gst notice", "routine query", "fine", "penalty of rs", 
        "margin dip", "quarterly loss", "tax query", "delay", "strike called off", 
        "global cues", "oil prices", "correction", "downgrade", "target cut", "minor fine"
    ]

    is_fatal = any(k in text for k in fatal_keywords)
    is_noise = any(k in text for k in noise_keywords)

    if is_fatal:
        panic_prob = 92.0
        dip_buy_prob = 8.0
        sentiment = "FATAL_RISK"
        verdict = "DUMP_IMMEDIATELY"
        explanation = (
            f"🚨 FATAL CATALYST DETECTED for {symbol}: Severe regulatory/governance red flag. "
            "High probability of cascading retail panic dumping and lower-circuit trap. "
            "Guru Rule #1 (Capital Preservation): EXIT IMMEDIATELY without hesitation."
        )
    elif is_noise or delivery_pct > 55.0:
        panic_prob = 28.0
        dip_buy_prob = 78.0
        sentiment = "BEAR_TRAP_NOISE"
        verdict = "HOLD_FOR_REBOUND"
        explanation = (
            f"🛡️ BEAR TRAP DETECTED for {symbol}: News is non-fatal operational noise. "
            "While emotional retail traders may dump on market open, institutional smart money "
            "algorithms are projected to absorb liquidity and buy the dip. DO NOT PANIC SELL."
        )
    else:
        panic_prob = 52.0
        dip_buy_prob = 48.0
        sentiment = "NEUTRAL_UNCERTAIN"
        verdict = "MONITOR_STOP_LOSS"
        explanation = f"Moderate sentiment pressure on {symbol}. Rely strictly on our -2.5% hard stop-loss."

    return {
        "symbol": symbol,
        "headline": headline,
        "sentiment_category": sentiment,
        "retail_panic_probability_pct": panic_prob,
        "institutional_dip_buy_probability_pct": dip_buy_prob,
        "verdict": verdict,
        "guru_explanation": explanation
    }
