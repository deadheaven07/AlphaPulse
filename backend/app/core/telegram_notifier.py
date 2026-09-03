import urllib.request
import urllib.parse
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("telegram_notifier")

def send_telegram_alert(bot_token: str, chat_id: str, message_text: str) -> bool:
    """
    Sends an instant, rich HTML notification to the user's private Telegram app.
    Works on iPhone / Android even when the user's laptop is closed or asleep.
    """
    if not bot_token or not chat_id:
        return False

    bot_token = bot_token.strip()
    chat_id = chat_id.strip()
    if not bot_token or not chat_id:
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "AlphaPulsePro/2.5"
            }
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("ok", False)
    except Exception as e:
        logger.warning(f"Telegram notification dispatch failed: {e}")
        return False

def format_buy_trigger_msg(
    symbol: str,
    live_price: float,
    entry_low: float,
    entry_high: float,
    target_1: float,
    stop_loss: float
) -> str:
    return (
        f"🔔 <b>ALPHAPULSE BUY TRIGGER HIT!</b>\n\n"
        f"<b>Stock:</b> {symbol}\n"
        f"<b>Current Price:</b> ₹{live_price:,.2f}\n"
        f"<b>Buy Zone:</b> ₹{entry_low:,.2f} – ₹{entry_high:,.2f}\n"
        f"<b>Target 1 (+5.5%):</b> ₹{target_1:,.2f}\n"
        f"<b>Stop-Loss (-2.5%):</b> ₹{stop_loss:,.2f}\n\n"
        f"👉 <i>Open Zerodha / Groww and buy shares now!</i>"
    )

def format_profit_target_msg(
    symbol: str,
    live_price: float,
    target_price: float,
    pnl_pct: float,
    pnl_inr: float
) -> str:
    return (
        f"🎉 <b>ALPHAPULSE PROFIT TARGET HIT!</b>\n\n"
        f"<b>Stock:</b> {symbol}\n"
        f"<b>Current Price:</b> ₹{live_price:,.2f}\n"
        f"<b>Target Price:</b> ₹{target_price:,.2f} (+{pnl_pct}%)\n"
        f"<b>Estimated Profit:</b> +₹{pnl_inr:,.0f} Net\n\n"
        f"💰 <i>Book 50% profit on your broker and trail stop-loss to entry!</i>"
    )

def format_emergency_exit_msg(
    symbol: str,
    reason: str,
    current_price: float,
    stop_loss: float
) -> str:
    return (
        f"🚨 <b>CAPITAL GUARDIAN EMERGENCY EXIT!</b>\n\n"
        f"<b>Stock:</b> {symbol}\n"
        f"<b>Current Price:</b> ₹{current_price:,.2f} (Floor: ₹{stop_loss:,.2f})\n"
        f"<b>Reason:</b> {reason}\n\n"
        f"⚠️ <i>Exit trade on your broker immediately to preserve capital (Rule #1)!</i>"
    )

def format_intraday_target_hit_msg(
    symbol: str,
    direction: str,
    live_price: float,
    target_price: float,
    net_pnl: float,
    roi_pct: float
) -> str:
    action_str = "BUY" if direction == "LONG" else "SHORT SELL"
    return (
        f"🎯 <b>INTRADAY MIS TARGET HIT (+{roi_pct:.1f}% on Margin)!</b>\n\n"
        f"<b>Stock:</b> {symbol} ({direction} 5x MIS)\n"
        f"<b>Execution:</b> {action_str}\n"
        f"<b>Current LTP:</b> ₹{live_price:,.2f} (Target: ₹{target_price:,.2f})\n"
        f"<b>Net Profit Realized:</b> +₹{net_pnl:,.2f} Net In-Hand\n\n"
        f"⚡ <i>Square off on Zerodha / Groww now and lock in your daily gains!</i>"
    )

def format_intraday_sl_hit_msg(
    symbol: str,
    direction: str,
    live_price: float,
    stop_loss: float,
    net_loss: float,
    risk_pct: float
) -> str:
    return (
        f"🛑 <b>INTRADAY STOP-LOSS HIT (-{risk_pct:.1f}% on Margin)!</b>\n\n"
        f"<b>Stock:</b> {symbol} ({direction} 5x MIS)\n"
        f"<b>Current LTP:</b> ₹{live_price:,.2f} (SL: ₹{stop_loss:,.2f})\n"
        f"<b>Loss:</b> -₹{net_loss:,.2f}\n\n"
        f"⚠️ <i>Strict discipline: Close position on broker immediately. Never carry intraday losses overnight!</i>"
    )

def format_310_square_off_warning_msg(symbols: List[str]) -> str:
    symbols_str = ", ".join(symbols)
    return (
        f"⏰ <b>3:10 PM MANDATORY INTRADAY SQUARE-OFF WARNING!</b>\n\n"
        f"You have active 5x MIS Intraday positions in: <b>{symbols_str}</b>.\n\n"
        f"⚠️ <b>Action Required:</b> Close all positions on Zerodha / Groww before 3:15 PM IST to avoid broker auto-square off fees (₹50+GST/order)!"
    )

