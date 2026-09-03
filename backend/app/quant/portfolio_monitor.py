from typing import Dict, Any, List
from .data_engine import fetch_live_quotes_batch, fetch_historical_dataframe
from .news_engine import analyze_stock_news_sentiment
from .technicals import detect_breakout

DANGER_KEYWORDS = [
    "investigation", "penalty", "fraud", "litigation", "probe",
    "scam", "default", "downgrade", "sebi", "raids", "loss widens",
    "resignation", "cyberattack", "hack"
]

def inspect_portfolio_threats(holdings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Inspect user portfolio holdings against real-time NSE prices,
    stop-loss triggers, target profits, and breaking news catalysts
    with deterministic alert fingerprinting.
    """
    if not holdings:
        return []

    symbols = [item.get("symbol", "").strip().upper() for item in holdings if item.get("symbol")]
    quotes_map = fetch_live_quotes_batch(symbols)

    alerts: List[Dict[str, Any]] = []

    for item in holdings:
        sym = item.get("symbol", "").strip().upper()
        if not sym:
            continue

        try:
            quote = quotes_map.get(sym) or {}
            current_price = quote.get("price", 0.0)
            if current_price <= 0:
                continue

            entry_price = float(item.get("entry_price") or item.get("current_price") or current_price)
            target_price = float(item.get("target_price") or (entry_price * 1.25))
            stop_loss = float(item.get("stop_loss") or item.get("bear_price") or (entry_price * 0.90))
            shares = int(item.get("shares") or 1)

            pnl_inr = round((current_price - entry_price) * shares, 2)
            pnl_pct = round(((current_price - entry_price) / max(1.0, entry_price)) * 100.0, 2)

            # Trigger 1: Target Reached (Deterministic ID)
            if current_price >= target_price and target_price > entry_price:
                target_fp = round(target_price, 2)
                alerts.append({
                    "id": f"target-{sym}-{target_fp}",
                    "symbol": sym,
                    "company_name": quote.get("company_name", sym),
                    "alert_type": "PROFIT_TARGET",
                    "severity": "SUCCESS",
                    "current_price": current_price,
                    "target_price": target_price,
                    "pnl_inr": pnl_inr,
                    "pnl_pct": pnl_pct,
                    "title": f"🎯 Profit Target Reached for {sym}!",
                    "message": f"{sym} reached your Target Price of ₹{target_price:,.2f} (Current: ₹{current_price:,.2f}, +{pnl_pct}%). Consider booking profit on your demat broker.",
                    "recommended_action": "LOCK_IN_PROFIT"
                })

            # Trigger 2: Stop-Loss Breach (Urgent Discipline, Deterministic ID)
            elif current_price <= stop_loss and stop_loss < entry_price:
                sl_fp = round(stop_loss, 2)
                alerts.append({
                    "id": f"sl-{sym}-{sl_fp}",
                    "symbol": sym,
                    "company_name": quote.get("company_name", sym),
                    "alert_type": "STOP_LOSS_BREACH",
                    "severity": "CRITICAL",
                    "current_price": current_price,
                    "stop_loss_price": stop_loss,
                    "pnl_inr": pnl_inr,
                    "pnl_pct": pnl_pct,
                    "title": f"🚨 Stop-Loss Breached for {sym}!",
                    "message": f"DISCIPLINE ALERT: {sym} dropped to ₹{current_price:,.2f}, breaching your stop-loss floor of ₹{stop_loss:,.2f} ({pnl_pct}%). Exit immediately to preserve capital!",
                    "recommended_action": "EXIT_IMMEDIATELY"
                })

            # Trigger 3: Breaking News Threat (Deterministic Hash of Headline)
            news = analyze_stock_news_sentiment(sym, quote)
            headlines = news.get("headlines", [])
            threat_found = False

            for h in headlines[:3]:
                title_lower = (h.get("title") or "").lower()
                summary_lower = (h.get("summary") or "").lower()
                matched_dangers = [kw for kw in DANGER_KEYWORDS if kw in title_lower or kw in summary_lower]
                if matched_dangers or news.get("risk_of_loss_pct", 0) >= 45.0:
                    threat_found = True
                    title_str = h.get("title") or ""
                    title_hash = abs(hash(title_str)) % 100000
                    alerts.append({
                        "id": f"news-{sym}-{title_hash}",
                        "symbol": sym,
                        "company_name": quote.get("company_name", sym),
                        "alert_type": "NEWS_THREAT",
                        "severity": "WARNING",
                        "current_price": current_price,
                        "risk_of_loss_pct": news.get("risk_of_loss_pct", 55.0),
                        "title": f"⚠️ Threat Catalyst Detected for {sym}",
                        "message": f"Breaking headline: \"{h.get('title')}\". Loss probability rose to {news.get('risk_of_loss_pct', 55.0)}%. Consider tightening stop-loss.",
                        "recommended_action": "TIGHTEN_STOP_LOSS"
                    })
                    break

            # Trigger 4: Sideways Consolidation Breakout (Deterministic High Breakout FP)
            if not threat_found and pnl_pct >= 0:
                df = fetch_historical_dataframe(sym, period="1mo", interval="1d")
                breakout = detect_breakout(df)
                if breakout.get("is_breakout"):
                    breakout_fp = round(breakout.get("high_20d", current_price), 2)
                    alerts.append({
                        "id": f"breakout-{sym}-{breakout_fp}",
                        "symbol": sym,
                        "company_name": quote.get("company_name", sym),
                        "alert_type": "CONSOLIDATION_BREAKOUT",
                        "severity": "INFO",
                        "current_price": current_price,
                        "title": f"🚀 Consolidation Breakout: {sym}",
                        "message": f"{sym} broke out above 20-day high with {breakout.get('volume_surge', 1.5)}x volume surge. Momentum trend active!",
                        "recommended_action": "RIDE_TREND"
                    })

        except Exception:
            continue

    return alerts
