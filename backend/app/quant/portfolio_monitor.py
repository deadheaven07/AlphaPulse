import time
import os
import datetime
from typing import Dict, Any, List
from .data_engine import fetch_live_quotes_batch, fetch_historical_dataframe
from .news_engine import analyze_stock_news_sentiment
from .technicals import detect_breakout
from .crowd_psychology_engine import analyze_news_crowd_psychology
from .intraday_engine import get_session_time_status
from backend.app.db.database import (
    get_active_tactical_swings,
    get_prebuy_tactical_swings,
    get_active_intraday_trades,
    get_setting
)
from backend.app.core.telegram_notifier import (
    send_telegram_alert,
    format_buy_trigger_msg,
    format_profit_target_msg,
    format_emergency_exit_msg,
    format_intraday_target_hit_msg,
    format_intraday_sl_hit_msg,
    format_310_square_off_warning_msg
)

# In-memory tracking of dispatched Telegram alerts (alert_id -> timestamp)
_DISPATCHED_TELEGRAM_ALERTS: Dict[str, float] = {}

def _try_dispatch_telegram(alert_id: str, message_text: str):
    """Helper to dispatch screen-off Telegram phone alert once per trigger event."""
    now = time.time()
    # Clean up entries older than 1 hour
    stale_keys = [k for k, t in _DISPATCHED_TELEGRAM_ALERTS.items() if now - t > 3600]
    for k in stale_keys:
        _DISPATCHED_TELEGRAM_ALERTS.pop(k, None)

    if alert_id in _DISPATCHED_TELEGRAM_ALERTS:
        return

    bot_token = get_setting("telegram_bot_token") or os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = get_setting("telegram_chat_id") or os.environ.get("TELEGRAM_CHAT_ID", "")

    if bot_token and chat_id:
        success = send_telegram_alert(bot_token, chat_id, message_text)
        if success:
            _DISPATCHED_TELEGRAM_ALERTS[alert_id] = now

def inspect_portfolio_threats(holdings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Inspect user portfolio holdings, active 1-week tactical holdings, and pre-buy triggers against
    real-time NSE prices, stop-loss floors, buy-zone triggers, crowd psychology shocks, and breakouts.
    """
    active_items: List[Dict[str, Any]] = list(holdings) if holdings else []
    prebuy_items: List[Dict[str, Any]] = []

    # 1. Fetch active tactical swings from SQLite
    try:
        tactical_swings = get_active_tactical_swings()
        for ts in tactical_swings:
            active_items.append({
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

    # 2. Fetch pre-buy triggers from SQLite
    try:
        prebuy_swings = get_prebuy_tactical_swings()
        for ps in prebuy_swings:
            prebuy_items.append({
                "symbol": ps["symbol"],
                "company_name": ps.get("company_name", ps["symbol"]),
                "entry_price": ps["entry_price"],
                "entry_low": ps.get("entry_low") or (ps["entry_price"] * 0.995),
                "entry_high": ps.get("entry_high") or (ps["entry_price"] * 1.008),
                "shares": ps["shares"],
                "swing_id": ps["id"]
            })
    except Exception:
        pass

    # 3. Fetch active intraday MIS trades from SQLite
    intraday_trades: List[Dict[str, Any]] = []
    try:
        intraday_trades = get_active_intraday_trades()
    except Exception:
        pass

    all_symbols = list(set(
        [item.get("symbol", "").strip().upper() for item in (active_items + prebuy_items + intraday_trades) if item.get("symbol")]
    ))
    if not all_symbols and not intraday_trades:
        return []

    quotes_map = fetch_live_quotes_batch(all_symbols)
    alerts: List[Dict[str, Any]] = []

    # --- 3:10 PM Square-Off Guardian Alarm ---
    session_status = get_session_time_status()
    if intraday_trades and session_status["is_square_off_warning"]:
        active_syms = [t["symbol"] for t in intraday_trades]
        alert_id = f"intraday-squareoff-310-{datetime.date.today()}"
        alerts.append({
            "id": alert_id,
            "symbol": "MIS_ENGINE",
            "company_name": "Intraday Square-Off Guardian",
            "alert_type": "310_SQUARE_OFF_WARNING",
            "severity": "CRITICAL",
            "current_price": 0.0,
            "title": "⏰ 3:10 PM MANDATORY INTRADAY SQUARE-OFF!",
            "message": f"You have {len(intraday_trades)} active MIS positions ({', '.join(active_syms)}). Square off on Zerodha / Groww before 3:15 PM to avoid broker auto-square-off penalty charges!",
            "recommended_action": "SQUARE_OFF_NOW"
        })
        _try_dispatch_telegram(alert_id, format_310_square_off_warning_msg(active_syms))

    # --- Active Intraday Trades Surveillance ---
    for it in intraday_trades:
        sym = it.get("symbol", "").strip().upper()
        if not sym:
            continue
        try:
            quote = quotes_map.get(sym) or {}
            current_price = quote.get("price", 0.0)
            if current_price <= 0:
                continue

            direction = it.get("direction", "LONG").upper()
            entry_price = float(it["entry_price"])
            target_price = float(it["target_price"])
            stop_loss = float(it["stop_loss"])
            shares = int(it["shares"])
            margin_capital = float(it.get("margin_capital", entry_price * shares / 5.0))

            is_long = direction == "LONG"
            if is_long:
                pnl = (current_price - entry_price) * shares
                target_hit = current_price >= target_price
                sl_hit = current_price <= stop_loss
            else: # SHORT
                pnl = (entry_price - current_price) * shares
                target_hit = current_price <= target_price
                sl_hit = current_price >= stop_loss

            roi_pct = round((pnl / max(margin_capital, 1.0)) * 100.0, 2)

            if target_hit:
                alert_id = f"intraday-target-{sym}-{it['id']}"
                alerts.append({
                    "id": alert_id,
                    "symbol": sym,
                    "company_name": quote.get("company_name", sym),
                    "alert_type": "INTRADAY_TARGET_HIT",
                    "severity": "SUCCESS",
                    "current_price": current_price,
                    "title": f"🎯 Intraday Target Hit: {sym} (+{roi_pct}%)",
                    "message": f"{direction} 5x MIS Target reached at ₹{current_price:,.2f}! Net Profit: +₹{pnl:,.2f} on ₹{margin_capital:,.0f} margin. Square off on broker now!",
                    "recommended_action": "SQUARE_OFF_PROFIT"
                })
                _try_dispatch_telegram(
                    alert_id,
                    format_intraday_target_hit_msg(
                        symbol=sym,
                        direction=direction,
                        live_price=current_price,
                        target_price=target_price,
                        net_pnl=pnl,
                        roi_pct=roi_pct
                    )
                )
            elif sl_hit:
                alert_id = f"intraday-sl-{sym}-{it['id']}"
                alerts.append({
                    "id": alert_id,
                    "symbol": sym,
                    "company_name": quote.get("company_name", sym),
                    "alert_type": "INTRADAY_SL_HIT",
                    "severity": "CRITICAL",
                    "current_price": current_price,
                    "title": f"🛑 Intraday Stop-Loss Hit: {sym} ({roi_pct}%)",
                    "message": f"DISCIPLINE: Stop-Loss reached at ₹{current_price:,.2f}. Close {direction} position immediately on broker to avoid further loss!",
                    "recommended_action": "SQUARE_OFF_LOSS"
                })
                _try_dispatch_telegram(
                    alert_id,
                    format_intraday_sl_hit_msg(
                        symbol=sym,
                        direction=direction,
                        live_price=current_price,
                        stop_loss=stop_loss,
                        net_loss=abs(pnl),
                        risk_pct=abs(roi_pct)
                    )
                )
        except Exception:
            continue

    # --- Pre-Buy Zone Triggers Surveillance ---
    for pb in prebuy_items:
        sym = pb.get("symbol", "").strip().upper()
        if not sym:
            continue
        try:
            quote = quotes_map.get(sym) or {}
            current_price = quote.get("price", 0.0)
            if current_price <= 0:
                continue

            entry_low = pb["entry_low"]
            entry_high = pb["entry_high"]

            # Trigger condition: market price is at or below entry_high and above safety floor (entry_low * 0.985)
            if current_price <= entry_high and current_price >= (entry_low * 0.985):
                alert_id = f"buy-trigger-{sym}-{int(current_price)}"
                alerts.append({
                    "id": alert_id,
                    "symbol": sym,
                    "company_name": quote.get("company_name", sym),
                    "alert_type": "BUY_TRIGGER_HIT",
                    "severity": "SUCCESS",
                    "current_price": current_price,
                    "entry_low": entry_low,
                    "entry_high": entry_high,
                    "title": f"🔔 BUY TRIGGER HIT: {sym} Entered Buy Zone!",
                    "message": f"ENTRY DISCIPLINE: {sym} is trading at ₹{current_price:,.2f} (Inside your ₹{entry_low:,.2f} – ₹{entry_high:,.2f} target pocket). Open Zerodha/Groww and BUY NOW!",
                    "recommended_action": "BUY_NOW"
                })
                _try_dispatch_telegram(
                    alert_id,
                    format_buy_trigger_msg(
                        symbol=sym,
                        live_price=current_price,
                        entry_low=entry_low,
                        entry_high=entry_high,
                        target_1=round(current_price * 1.055, 2),
                        stop_loss=round(current_price * 0.975, 2)
                    )
                )
        except Exception:
            continue

    # --- Active Holdings & Demat Surveillance ---
    for item in active_items:
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
                alert_id = f"target-{sym}-{target_fp}"
                alerts.append({
                    "id": alert_id,
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
                _try_dispatch_telegram(
                    alert_id,
                    format_profit_target_msg(
                        symbol=sym,
                        live_price=current_price,
                        target_price=target_price,
                        pnl_pct=pnl_pct,
                        pnl_inr=pnl_inr
                    )
                )

            # Trigger 2: Stop-Loss Breach (Urgent Discipline, Deterministic ID)
            elif current_price <= stop_loss and stop_loss < entry_price:
                sl_fp = round(stop_loss, 2)
                alert_id = f"sl-{sym}-{sl_fp}"
                alerts.append({
                    "id": alert_id,
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
                _try_dispatch_telegram(
                    alert_id,
                    format_emergency_exit_msg(
                        symbol=sym,
                        reason=f"Price dropped to ₹{current_price:,.2f}, breaching stop-loss floor of ₹{stop_loss:,.2f} ({pnl_pct}%)",
                        current_price=current_price,
                        stop_loss=stop_loss
                    )
                )

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
                    alert_id = f"fatal-{sym}-{title_hash}"
                    alerts.append({
                        "id": alert_id,
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
                    _try_dispatch_telegram(
                        alert_id,
                        format_emergency_exit_msg(
                            symbol=sym,
                            reason=psychology["guru_explanation"],
                            current_price=current_price,
                            stop_loss=stop_loss
                        )
                    )
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
