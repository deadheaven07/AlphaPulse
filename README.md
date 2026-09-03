# 🚀 AlphaPulse India Pro
### Institutional-Grade Real-Time Equity & Post-Tax ROI Engine (NSE / BSE)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.9-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20GenAI%20%2B%20Search%20Grounding-4285F4.svg?style=flat&logo=google)](https://ai.google.dev)
[![Budget 2024](https://img.shields.io/badge/Tax%20Engine-Budget%202024%20Compliant-10B981.svg?style=flat)](https://www.incometax.gov.in)

---

## 🌟 Overview

**AlphaPulse India Pro** is an institutional-grade, personal quantitative intelligence and post-tax ROI simulation workstation for the Indian stock market (NSE / BSE). Built with a distraction-free, minimalist **Light Mode** design system, it combines live market feeds, 1,000-path stochastic Monte Carlo modeling, real-world Indian statutory tax deduction, and **Google Gemini Live Web Search Grounding** to provide hedge-fund-grade clarity for equity investors.

---

## 💎 Core Capabilities

### 1. 🌐 Google Gemini AI with Live Web Search Grounding
- **Real-Time Web Grounding**: Uses `types.Tool(google_search=types.GoogleSearch())` to search the live web for breaking news, order book additions, institutional block deals, and management concalls.
- **Consensus Research Targets**: Aggregates target prices from top brokerages (e.g., *Motilal Oswal, ICICI Direct, Jefferies, Morgan Stanley*).
- **Quarterly Concall Takeaways**: Extracts management guidance, EBITDA margin trajectories, and capex milestones.

### 2. 🎲 1,000-Path Stochastic Monte Carlo Simulation
- **Geometric Brownian Motion (GBM)**: Replaces naive straight lines with 1,000 random-walk stochastic paths:
  $$S_t = S_0 \exp\left(\left(\mu - \frac{\sigma^2}{2}\right)t + \sigma \sqrt{t} Z\right)$$
- **Statistical Percentiles**:
  - **Base Case (50th Percentile / Median)**: Most probable price trajectory based on drift.
  - **Bull Case (90th Percentile)**: Statistical upside momentum ceiling.
  - **Bear Case (10th Percentile / VaR)**: 90% Value at Risk empirical floor modeling maximum expected drawdown.

### 3. 🇮🇳 Real In-Hand Post-Tax & Friction Engine (Budget 2024 Compliant)
Calculates exact real-world statutory levies and taxes so your profit matches your bank account:
- **Securities Transaction Tax (STT)**: 0.1% on delivery exit turnover.
- **Exchange Turnover Fees**: ~0.00345% (NSE).
- **SEBI Turnover Charges**: ₹10 per crore (0.0001%).
- **Stamp Duty**: 0.015% on entry turnover.
- **GST**: 18% on (Brokerage + Exchange Fees + SEBI Charges).
- **Capital Gains Taxes**:
  - `Holding < 12 Months`: **STCG @ 20%** on net gains.
  - `Holding ≥ 12 Months`: **LTCG @ 12.5%** on net gains exceeding the ₹1,25,000 annual exemption limit.

### 4. 🛡️ Institutional Quality & Governance Screener
- **NSE Delivery %**: Flags `>50%` as institutional accumulation vs `<25%` as speculative retail churn.
- **Piotroski F-Score (0 to 9)**: Evaluates profitability, leverage, liquidity, and operating efficiency.
- **Promoter Pledging**: Verifies governance health and flags pledge `>15%` as a critical red flag.
- **Order Book Backlog (₹ Cr)**: Tracks sovereign and commercial order pipelines for infra, defense, and power titans.

### 5. 🔬 4 Genuine Open-Source Quantitative Integrations
- [`jugaad-py/jugaad-data`](https://github.com/jugaad-py/jugaad-data): Historical OHLCV candles, delivery percentages, and local caching.
- [`aeron7/nsepython`](https://github.com/aeron7/nsepython): Live NSE quotes, FII/DII net flows, and sector stats.
- [`pkjmesra/PKScreener`](https://github.com/pkjmesra/PKScreener): 14-period Wilder's RSI, 20-day breakout with volume surge (`>1.5x`), and 50/200 EMA golden cross.
- [`AdroitAnandAI/RRG-Sector-Rotation-India`](https://github.com/AdroitAnandAI/RRG-Sector-Rotation-India): 2D Relative Rotation Graph quadrant scatter plot (Leading, Improving, Weakening, Lagging).

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([Investor / Quantitative User]) -->|Natural Language Search & Sliders| WebApp[React + Vite Frontend :5173]
    WebApp -->|Live Proxy Calls| API[FastAPI Backend :8000]
    
    subgraph Quant Engine
        API --> Taxes[taxes_charges.py<br/>STT, GST, STCG/LTCG Engine]
        API --> MonteCarlo[monte_carlo_engine.py<br/>1,000-Path GBM Stochastic VaR]
        API --> Quality[quality_filters.py<br/>Piotroski F-Score & Delivery %]
        API --> Technicals[technicals.py<br/>PKScreener 14-RSI & Breakouts]
        API --> RRG[sector_rrg.py<br/>RRG Sector Rotation 2D Map]
    end
    
    subgraph External & AI Layer
        API --> Gemini[gemini_service.py<br/>Google GenAI SDK]
        Gemini -->|Live Web Search Grounding| GoogleSearch[Google Search Tool<br/>Concalls, Broker Targets, Order Books]
        API --> NSE[jugaad-data & nsepython<br/>Live Quotes & FII/DII Flows]
    end
```

---

## 📁 Repository Structure

```
alphapulse-india/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_stocks.py       # Live quotes, search, candles, quality
│   │   │   ├── routes_simulator.py    # Monte Carlo & Post-Tax calculations
│   │   │   └── routes_ai.py           # Gemini AI with Live Web Search Grounding
│   │   ├── quant/
│   │   │   ├── data_engine.py         # jugaad-data & nsepython adapters
│   │   │   ├── technicals.py          # PKScreener RSI, breakout & EMA cross
│   │   │   ├── sector_rrg.py          # Relative Strength 2D quadrant scatter
│   │   │   ├── quality_filters.py     # Piotroski F-Score & Promoter Pledge
│   │   │   ├── taxes_charges.py       # Indian STT, GST, STCG/LTCG tax engine
│   │   │   └── monte_carlo_engine.py  # 1,000-path stochastic simulation & VaR
│   │   ├── core/
│   │   │   ├── config.py              # Environment variables & constants
│   │   │   └── gemini_service.py      # Google GenAI with Search Grounding
│   │   └── main.py                    # FastAPI application entrypoint
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Top navbar with live status & FII/DII flow
│   │   │   ├── TickerTape.tsx         # Live continuous scrolling index ticker
│   │   │   ├── AskAIBar.tsx           # Natural language query search with Web Grounding
│   │   │   ├── LiveNewsAndThesis.tsx  # Gemini web-grounded thesis & broker targets
│   │   │   ├── StockOverviewCard.tsx  # Live price, 1D-5Y chart, 52W range, Delivery %
│   │   │   ├── QualityScoreCard.tsx   # Piotroski F-Score (0-9) & Promoter Pledge
│   │   │   ├── TechnicalSignals.tsx   # PKScreener breakout, RSI & EMA cross
│   │   │   ├── SectorRrgMap.tsx       # 2D RRG Quadrant Scatter Map
│   │   │   ├── ProfitSimulator.tsx    # Monte Carlo + Post-Tax Net In-Hand ROI
│   │   │   ├── ProjectionChart.tsx    # 1,000-path percentile confidence curves
│   │   │   ├── WatchlistVaultModal.tsx# Saved strategy vault & CSV export
│   │   │   └── SettingsModal.tsx      # Gemini API key configuration
│   │   ├── types/index.ts             # TypeScript data contracts
│   │   ├── App.tsx                    # Master dashboard layout
│   │   └── index.css                  # Light-mode Tailwind styling
│   ├── package.json
│   └── vite.config.ts
├── run.sh                             # 1-click startup script
└── README.md
```

---

## ⚡ Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1-Click Startup
```bash
chmod +x run.sh
./run.sh
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

## 🔒 Security & Privacy
- All API keys and environment variables are stored strictly locally in `.env` (safely blocked by `.gitignore`).
- No sensitive credentials or database binaries are pushed to GitHub.

---

### ⚖️ Disclaimer
*AlphaPulse India Pro is an educational and personal quantitative research simulator. It does not constitute SEBI-registered financial advisory. Past performance does not guarantee future results.*
