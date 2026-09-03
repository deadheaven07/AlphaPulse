from typing import Dict, Any, List
from .data_engine import fetch_live_quotes_batch, fetch_historical_dataframe
from .news_engine import analyze_stock_news_sentiment
from .technicals import detect_breakout
from .crowd_psychology_engine import analyze_news_crowd_psychology
from backend.app.db.database import get_active_tactical_swings

DANGER_KEYWORDS = [
    "investigation", "penalty", "fraud", "litigation", "probe",
    "scam", "default", "downgrade", "sebi", "raids", "loss widens",
    "resignation", "cyberattack", "hack"
]

def inspect_portfolio_threats(holdings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Inspect user portfolio holdings and active 1-week tactical swings against real-time NSE prices,
    stop-loss triggers, target profits, crowd psychology news reactions, and breakout continuation.
    """
    combined_items: List[Dict[str, Any]] = list(holdings) if holdings else []

    # Include active tactical swings from SQLite into the watchdog stream
    try:
        tactical_swings = get_active_tactical_swings()
        for ts in tactical_swings:
            combined_items.append({
                "symbol": ts["symbol"],
                "company_name": ts.get("company_name", ts["symbol"]),
                "entry_price": ts["entry_price"],
                "shares": ts["shares"],
                "target_price": ts["target_1"],
                "target_2": ts["target_2"],
                "stop_loss": ts["stop_loss"],
                "is_tactical": True,
                "swing_id": ts["id"]
            })
    except Exception:
        pass

    if not combined_items:
        return []

    symbols = list(set([item.get("symbol", "").strip().upper() for item in combined_items if item.get("symbol")]))
    quotes_map = fetch_live_quotes_batch(symbols)

    alerts: List[Dict[str, Any]] = []

    for item in combined_items:
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
            is_tactical = item.get("is_tactical", False)

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
                    "title": f"🎯 Tactical Target Reached for {sym}!" if is_tactical else f"🎯 Profit Target Reached for {sym}!",
                    "message": (
                        f"GURU COMMAND: {sym} reached Target of ₹{target_price:,.2f} (+{pnl_pct}%). "
                        f"Book 50% profit (+₹{pnl_inr:,.0f} net) and trail stop-loss to entry!"
                        if is_tactical else
                        f"{sym} reached your Target Price of ₹{target_price:,.2f} (Current: ₹{current_price:,.2f}, +{pnl_pct}%). Consider booking profit on your demat broker."
                    ),
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
                    "message": f"DISCIPLINE ALERT: {sym} dropped to ₹{current_price:,.2f}, breaching stop-loss floor of ₹{stop_loss:,.2f} ({pnl_pct}%). Guru Rule #1: Exit immediately to preserve capital!",
                    "recommended_action": "EXIT_IMMEDIATELY"
                })

            # Trigger 3: Breaking News Threat & Crowd Psychology Reaction
            news = analyze_stock_news_sentiment(sym, quote)
            headlines = news.get("headlines", [])
            threat_found = False

            for h in headlines[:3]:
                title_str = h.get("title") or ""
                summary_str = h.get("summary") or ""

                psychology = analyze_news_crowd_psychology(
                    symbol=sym,
                    headline=title_str,
                    summary=summary_str,
                    delivery_pct=quote.get("delivery_pct", 48.0)
                )

                if psychology["sentiment_category"] == "FATAL_RISK":
                    threat_found = True
                    title_hash = abs(hash(title_str)) % 100000
                    alerts.append({
                        "id": f"fatal-{sym}-{title_hash}",
                        "symbol": sym,
                        "company_name": quote.get("company_name", sym),
                        "alert_type": "FATAL_RISK",
                        "severity": "CRITICAL",
                        "current_price": current_price,
                        "risk_of_loss_pct": psychology["retail_panic_probability_pct"],
                        "title": f"🚨 Fatal Risk Detected for {sym}!",
                        "message": psychology["guru_explanation"],
                        "recommended_action": "DUMP_IMMEDIATELY"
                    })
                    break
                elif psychology["sentiment_category"] == "BEAR_TRAP_NOISE":
                    threat_found = True
                    title_hash = abs(hash(title_str)) % 100000
                    alerts.append({
                        "id": f"beartrap-{sym}-{title_hash}",
                        "symbol": sym,
                        "company_name": quote.get("company_name", sym),
                        "alert_type": "BEAR_TRAP_NOISE",
                        "severity": "INFO",
                        "current_price": current_price,
                        "risk_of_loss_pct": psychology["retail_panic_probability_pct"],
                        "title": f"🛡️ Bear Trap Detected for {sym}",
                        "message": psychology["guru_explanation"],
                        "recommended_action": "HOLD_FOR_REBOUND"
                    })
                    break

            # Trigger 4: Sideways Consolidation Breakout
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
