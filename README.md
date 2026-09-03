# 🚀 AlphaPulse India (NSE/BSE Quantitative Intelligence & Profit Simulator)

An interactive, ultra-modern stock intelligence and profit forecasting dashboard designed for the Indian stock market (NSE/BSE).

---

## 🌟 Key Features

1. **🤖 Natural Language Stock Explorer (Google Gemini AI)**:
   - Ask queries in plain English (e.g. *"Suggest 3 infrastructure stocks if I invest ₹1,00,000 for 2 years"*).
   - Returns structured investment theses, catalysts, risk factors, and holding verdicts ("Strong Accumulate", "Tactical Buy", "Hold").
   - Instant 1-click **"Simulate in Engine"** button to project returns.

2. **📊 Quantitative Technical Signals (PKScreener Logic)**:
   - **14-day Wilder's RSI** with Overbought/Oversold/Neutral momentum levels.
   - **20-day High Price Breakout** detector with volume confirmation (>1.5x 20-day SMA volume).
   - **50-day / 200-day EMA Trend Alignment** (Golden Cross tracking).
   - Composite Quantitative Score (0–100).

3. **🧭 Relative Rotation Graph (RRG Sector Rotation)**:
   - Evaluates Sector RS-Ratio and RS-Momentum against the **NIFTY 50** benchmark.
   - Categorizes sectors into 4 quadrants: **"Leading"**, **"Improving"**, **"Weakening"**, and **"Lagging"**.

4. **💰 Capital & Holding Period Profit Simulator [CORE]**:
   - Inputs: Capital (₹) presets (`₹10k` to `₹5L`) + Holding Duration (`1M`, `3M`, `6M`, `1Y`, `2Y`, `3Y`, `5Y`) + Risk Appetite.
   - Share Allocation: `Shares = Floor(Capital / Price)` + Cash Buffer.
   - 3 Real-time Scenario Forecasts:
     - **Base Target**: 50% Probability consensus CAGR target, estimated net profit (₹), and expected ROI %.
     - **Bull Target**: 25% Probability momentum surge upside target & potential gain (₹).
     - **Bear / Stop Loss**: 25% Probability trailing stop-loss price and capital preservation floor.
   - **Interactive Compound Curve Chart**: Month-by-month capital expansion trajectory.

---

## 🏗️ Architecture & Open-Source Adapters

- `jugaad-py/jugaad-data`: Daily OHLCV candle processing and TTL in-memory caching.
- `aeron7/nsepython`: Institutional FII/DII net flow tracking and live market status.
- `pkjmesra/PKScreener`: 14-day RSI, 20-day breakout with volume surge, and 50/200 EMA crosses.
- `AdroitAnandAI/RRG-Sector-Rotation-India`: Sector Relative Strength Ratio & Momentum quadrant analysis.
- `Google Gemini GenAI SDK`: Structured AI equity analysis (`gemini-2.5-flash`).

---

## ⚡ Quick Start

Launch both FastAPI backend and React frontend with a single command:

```bash
./run.sh
```

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
