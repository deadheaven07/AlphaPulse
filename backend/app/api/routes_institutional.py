import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from backend.app.core.telegram_notifier import send_telegram_alert
from backend.app.quant.insider_deals_engine import get_latest_insider_and_bulk_deals
from backend.app.quant.option_chain_engine import get_nifty_option_chain_pcr
from backend.app.db.database import get_setting, set_setting

router = APIRouter(prefix="/api/institutional", tags=["institutional-superpowers"])

class TelegramConfigRequest(BaseModel):
    bot_token: str = Field(..., description="Telegram Bot API Token from @BotFather")
    chat_id: str = Field(..., description="Telegram User/Channel Chat ID from @userinfobot")

class TelegramTestRequest(BaseModel):
    bot_token: str
    chat_id: str

@router.get("/insider-deals")
def fetch_insider_deals() -> List[Dict[str, Any]]:
    """
    Returns today's curated Trendlyne-style daily insider buying and institutional bulk/block deals.
    """
    return get_latest_insider_and_bulk_deals()

@router.get("/option-chain-pcr")
def fetch_option_chain_pcr() -> Dict[str, Any]:
    """
    Returns real-time Sensibull-style Nifty Put-Call Ratio (PCR), Max Pain strike, and market bias.
    """
    return get_nifty_option_chain_pcr()

@router.post("/test-telegram")
def test_telegram_ping(req: TelegramTestRequest):
    """
    Sends an immediate test audio alert to the user's private Telegram bot to verify phone connection.
    """
    test_msg = (
        "🟢 <b>ALPHAPULSE PRO TEST ALERT</b>\n\n"
        "Your private Telegram Bot is successfully connected to your <b>AlphaPulse Workstation</b>!\n\n"
        "You will now receive instant audio pings on your phone for:\n"
        "• 🔔 <b>Buy Trigger Hits</b> (Dips into accumulation zone)\n"
        "• 🎉 <b>Target 1 Profit Hits</b> (+5.5% 1-week alpha)\n"
        "• 🚨 <b>Stop-Loss & Panic News Sirens</b> (Capital preservation)\n\n"
        "<i>Works seamlessly even when your laptop is completely asleep!</i>"
    )
    success = send_telegram_alert(req.bot_token, req.chat_id, test_msg)
    if success:
        # Also auto-persist the verified config in SQLite
        set_setting("telegram_bot_token", req.bot_token.strip())
        set_setting("telegram_chat_id", req.chat_id.strip())
        return {
            "success": True,
            "message": "✓ Phone alert sent! Check your Telegram app."
        }
    else:
        return {
            "success": False,
            "message": "Failed to dispatch Telegram message. Please check Bot Token and Chat ID."
        }

@router.post("/save-telegram-config")
def save_telegram_config(req: TelegramConfigRequest):
    """
    Saves Telegram Bot credentials into SQLite persistent settings.
    """
    set_setting("telegram_bot_token", req.bot_token.strip())
    set_setting("telegram_chat_id", req.chat_id.strip())
    return {
        "status": "saved",
        "bot_token_configured": bool(req.bot_token.strip()),
        "chat_id_configured": bool(req.chat_id.strip())
    }

@router.get("/get-telegram-config")
def get_telegram_config():
    """
    Fetches the configured Telegram Bot settings from SQLite (token masked for safety).
    """
    token = get_setting("telegram_bot_token") or os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = get_setting("telegram_chat_id") or os.environ.get("TELEGRAM_CHAT_ID", "")
    
    masked_token = (token[:6] + "..." + token[-4:]) if len(token) > 10 else ("***" if token else "")
    return {
        "is_configured": bool(token and chat_id),
        "bot_token": token,
        "masked_bot_token": masked_token,
        "chat_id": chat_id
    }
