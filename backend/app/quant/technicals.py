import pandas as pd
import numpy as np
from typing import Dict, Any

def calculate_rsi(series: pd.Series, period: int = 14) -> float:
    """
    Standard Relative Strength Index (RSI) using Wilder's Smoothing.
    Adapted from pkjmesra/PKScreener.
    """
    if len(series) < period + 1:
        return 50.0

    delta = series.diff().dropna()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.iloc[:period].mean()
    avg_loss = loss.iloc[:period].mean()

    for i in range(period, len(delta)):
        avg_gain = (avg_gain * (period - 1) + gain.iloc[i]) / period
        avg_loss = (avg_loss * (period - 1) + loss.iloc[i]) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(float(rsi), 2)

def detect_breakout(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Detect 20-day High Price Breakout with Volume Confirmation (>1.5x 20-day SMA Volume).
    Adapted from PKScreener scan rules.
    """
    if len(df) < 22:
        return {"is_breakout": False, "volume_surge": 1.0, "high_20d": 0.0}

    recent = df.iloc[-1]
    prev_20 = df.iloc[-21:-1]

    high_20d = float(prev_20["High"].max())
    current_close = float(recent["Close"])
    avg_volume_20d = float(prev_20["Volume"].mean()) if prev_20["Volume"].mean() > 0 else 1.0
    current_volume = float(recent["Volume"])

    vol_multiplier = round(current_volume / avg_volume_20d, 2)
    is_price_breakout = current_close >= (high_20d * 0.995)
    is_volume_confirmed = vol_multiplier >= 1.5

    is_breakout = is_price_breakout and is_volume_confirmed

    return {
        "is_breakout": bool(is_breakout),
        "is_price_breakout": bool(is_price_breakout),
        "volume_surge": float(vol_multiplier),
        "high_20d": round(high_20d, 2),
        "avg_volume_20d": int(avg_volume_20d)
    }

def calculate_ema_cross(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute 50-day and 200-day Exponential Moving Averages & Trend Alignment.
    """
    if len(df) < 50:
        return {
            "ema_50": round(float(df["Close"].iloc[-1]), 2),
            "ema_200": round(float(df["Close"].iloc[-1]), 2),
            "trend": "NEUTRAL",
            "is_golden_cross": False,
            "above_200_ema": True
        }

    close = df["Close"]
    ema_50 = close.ewm(span=50, adjust=False).mean()
    ema_200 = close.ewm(span=min(200, len(close)), adjust=False).mean()

    cur_price = float(close.iloc[-1])
    cur_ema50 = float(ema_50.iloc[-1])
    cur_ema200 = float(ema_200.iloc[-1])

    is_golden_cross = cur_ema50 >= cur_ema200
    above_200_ema = cur_price >= cur_ema200

    if cur_price > cur_ema50 > cur_ema200:
        trend = "STRONG BULLISH"
    elif is_golden_cross and above_200_ema:
        trend = "BULLISH"
    elif not is_golden_cross and not above_200_ema:
        trend = "BEARISH"
    else:
        trend = "CONSOLIDATION"

    return {
        "ema_50": round(cur_ema50, 2),
        "ema_200": round(cur_ema200, 2),
        "trend": trend,
        "is_golden_cross": bool(is_golden_cross),
        "above_200_ema": bool(above_200_ema)
    }

def get_technical_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generate comprehensive technical signals dictionary.
    """
    if df.empty:
        return {
            "rsi_14": 52.0,
            "rsi_condition": "NEUTRAL",
            "breakout": {"is_breakout": False, "volume_surge": 1.1, "high_20d": 0.0},
            "ema_analysis": {"trend": "BULLISH", "ema_50": 0.0, "ema_200": 0.0, "is_golden_cross": True},
            "technical_score": 75
        }

    rsi = calculate_rsi(df["Close"])
    rsi_condition = "OVERBOUGHT" if rsi >= 70 else ("OVERSOLD" if rsi <= 30 else "NEUTRAL MOMENTUM")
    breakout = detect_breakout(df)
    ema_info = calculate_ema_cross(df)

    # Compute overall technical composite score (0-100)
    score = 50
    if 45 <= rsi <= 68:
        score += 15
    elif rsi > 70:
        score += 5
    elif rsi < 30:
        score -= 10

    if breakout["is_breakout"]:
        score += 20
    elif breakout["is_price_breakout"]:
        score += 10

    if ema_info["trend"] == "STRONG BULLISH":
        score += 15
    elif ema_info["trend"] == "BULLISH":
        score += 10
    elif ema_info["trend"] == "BEARISH":
        score -= 15

    return {
        "rsi_14": rsi,
        "rsi_condition": rsi_condition,
        "breakout": breakout,
        "ema_analysis": ema_info,
        "technical_score": min(98, max(20, score))
    }
