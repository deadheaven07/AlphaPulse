# 🚀 AlphaPulse India Pro Workstation
### Institutional-Grade Real-Time Equity Intelligence, 1-Week Tactical Alpha & Post-Tax ROI Engine (NSE / BSE)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.9-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash%20%2B%20Search%20Grounding-4285F4.svg?style=flat&logo=google)](https://ai.google.dev)
[![SQLite WAL](https://img.shields.io/badge/Database-SQLite%20WAL%20Mode-003B57.svg?style=flat&logo=sqlite)](https://www.sqlite.org)
[![Budget 2024](https://img.shields.io/badge/Tax%20Engine-Budget%202024%20Compliant-10B981.svg?style=flat)](https://www.incometax.gov.in)

---

## 🌟 Overview

**AlphaPulse India Pro** is a modern, modular institutional quantitative equity workstation and AI copilot designed for Indian stock market investors (NSE / BSE). 

Engineered with a **6-Page Dedicated Workstation Architecture**, an **Interactive Left-Pane "Ask Alpha AI" Copilot (`⌘K`)**, a **3D Deep-Space Asteroid Belt Canvas Engine**, and a **1-Week Tactical Momentum Engine with a Personal "Stock Market Guru" & Crowd Psychology Watchdog**, AlphaPulse provides end-to-end mathematical rigor from live market discovery to post-tax bank account realization.

---

## 🏗️ Architecture & Engine Topology

```mermaid
graph TD
    User([Investor / Quantitative Trader]) -->|Interactive UI & ⌘K Copilot| WebApp[React 19 + TypeScript + Vite :5173]
    WebApp -->|Async REST & Live Polling| API[FastAPI High-Concurrency Backend :8000]
    
    subgraph Quantitative & Tactical Engines
        API --> Tactical[tactical_swing_engine.py<br/>1-Week Momentum & 2-Tier Targets]
        API --> Psychology[crowd_psychology_engine.py<br/>Fatal Trap vs Bear Trap Classifier]
        API --> Radar[radar_engine.py<br/>5-Factor KPI & Sub-₹150 Penny Screener]
        API --> MonteCarlo[monte_carlo_engine.py<br/>1,000-Path Stochastic GBM & VaR]
        API --> Taxes[taxes_charges.py<br/>Budget 2024 STCG, LTCG, STT & GST Solver]
        API --> Planner[planner_engine.py<br/>Exact Actuarial SIP & Milestone Solver]
        API --> Quality[quality_filters.py<br/>Piotroski F-Score & Delivery % Screener]
        API --> RRG[sector_rrg.py<br/>2D Sector Rotation Relative Strength Map]
    end
    
    subgraph AI & Persistence Layer
        API --> Gemini[gemini_service.py & routes_chat.py<br/>Gemini 2.5 Flash + Web Search Grounding]
        API --> SQLite[(SQLite WAL Database<br/>Holdings, Goals, Tactical Swings)]
        API --> Monitor[portfolio_monitor.py<br/>24/7 Watchdog & Audio Alerts]
    end
```

---

## 💎 Core Capabilities

### 1. 🧙‍♂️ Personal "Stock Market Guru" & 1-Week Tactical Alpha Engine
- **Proprietary Trading Mandate**:
  - **Rule #1: Protect Principal** — Strict mathematical invalidation cutoff (-2.5%); zero hope trading.
  - **Rule #2: Maximize Take-Home Cash** — Computes exact post-tax net profit after Budget 2024 STCG (20%) and all statutory levies.
- **4 Critical Tactical Execution Levels (5–7 Trading Days)**:
  1. **Exact Buy Range**: Dynamic accumulation demand pocket (e.g., `₹406.56 – ₹411.87`).
  2. **Target 1 (+5.5% in 3–4 Days)**: Mandatory 50% profit booking to eliminate trade risk.
  3. **Target 2 (+8.5% in 7 Days)**: Squeeze remaining 50% position with stop-loss trailed to breakeven entry price.
  4. **Hard Stop-Loss (-2.5%)**: Automated risk cutoff for immediate capital preservation.
- **In-Chat Tactical Blueprint Action Cards**: Click `[🛡️ Arm Stock Market Guru 24/7 Watchdog]` to launch 7-day automated surveillance.

---

### 2. 🧠 Crowd Psychology & Negative News Classifier
- **Fatal Traps** (*SEBI raids, forensic audits, promoter dumping, CBI probes*):
  - Predicts **85–95% Retail Panic Dump & Circuit Lock** $\rightarrow$ **Guru Command: `DUMP_IMMEDIATELY`**.
- **Overreaction Bear Trap Noise** (*Routine GST queries, single-quarter raw material cost dip in monopoly blue chips*):
  - Correlates institutional delivery % (>55%) and predicts **75–85% Smart Money Dip-Buying** $\rightarrow$ **Guru Command: `HOLD_FOR_REBOUND`**.

---

### 3. 🎯 Goal Planner & Exact Actuarial SIP Solver
- **True Monthly Compounding Formula**:
  Replaces naive linear approximations with the actuarial future-value solver:
  $$FV = P \cdot (1+r)^n + \text{SIP} \cdot \left[\frac{(1 + r_m)^{12n} - 1}{r_m}\right] \cdot (1 + r_m)$$
  *(where $r_m = (1+r)^{1/12} - 1$)*
- **Interactive Goal Tracking**: Save financial milestones (e.g. ₹10 Lakhs in 3 years) with live portfolio progress bars.
- **Dedicated Goal News Radar**: Streams real-time financial catalysts specifically matching stocks in your goal basket.

---

### 4. 💼 Demat Portfolio Vault with Live LTP & 24/7 Watchdog
- **Real-Time Market Valuation & P&L**:
  - Synchronizes live market LTP, day change %, current valuation, and color-coded net profit/loss badges.
- **Active 1-Week Tactical Sprints**:
  - Dedicated surveillance deck with a **7-day countdown clock**, level-by-level progress bar, and 1-click stock inspection.
- **Institutional Audio Alerts**:
  - `PROFIT_TARGET` $\rightarrow$ Victory chime.
  - `STOP_LOSS_BREACH` $\rightarrow$ Discipline buzzer.
  - `FATAL_RISK` $\rightarrow$ Emergency siren.

---

### 5. 🔬 1,000-Path Stochastic Monte Carlo Simulation
- **Geometric Brownian Motion (GBM)**:
  $$S_t = S_0 \exp\left(\left(\mu - \frac{\sigma^2}{2}\right)t + \sigma \sqrt{t} Z\right)$$
- **Statistical Percentiles**:
  - **Base Case (50th Percentile / Median)**: Most probable price trajectory.
  - **Bull Case (90th Percentile)**: Statistical upside momentum ceiling.
  - **Bear Case (10th Percentile / VaR)**: 90% Value at Risk empirical floor.

---

### 6. 🇮🇳 Budget 2024 Statutory Post-Tax & Friction Engine
Accurately accounts for every statutory levy on Indian exchanges:
- **Securities Transaction Tax (STT)**: 0.1% on delivery turnover.
- **Exchange Turnover Fees**: ~0.00345% (NSE).
- **SEBI Turnover Charges**: ₹10 per crore (0.0001%).
- **Stamp Duty**: 0.015% on entry turnover.
- **GST**: 18% on (Brokerage + Exchange Fees + SEBI Charges).
- **Capital Gains Taxes**:
  - `Holding < 12 Months`: **STCG @ 20%** on net gains.
  - `Holding ≥ 12 Months`: **LTCG @ 12.5%** on net gains exceeding ₹1,25,000 exemption.

---

### 7. 🌌 3D Deep-Space Asteroid Belt Canvas & Design System
- **Floating 3D Polygonal Asteroids**: High-performance HTML5 Canvas rendering craggy 3D tumbling asteroids with cosmic dust and linear perspective.
- **Zero-Battery Idle Pause**: Uses `requestAnimationFrame` with visibility detection to pause when inactive.
- **Sleek Dual Theme**: Seamless switching between Dark Mode and Light Mode.

---

## 🖥️ The 6 Dedicated Workstation Pages

| Page | Description | Key Modules |
| :--- | :--- | :--- |
| **1. Overview** | Market Command Center | Live Indices (Sensex, Nifty, VIX), Continuous Ticker Tape, Quick Access Cards |
| **2. Radar & Screener** | Discovery & Filtering | 5-Factor KPI Leaders, Sub-₹150 Turnaround Penny Screener |
| **3. Stock Studio** | Deep-Dive Analytics | Interactive Charts (1D–5Y), Piotroski F-Score (0–9), 2D Sector RRG, News Sentiment |
| **4. Profit Simulator** | Holding-Period Forecasting | 1,000-Path Monte Carlo Fan Chart, Budget 2024 Post-Tax Net ROI Calculator |
| **5. Dividend Income** | Cash Flow Intelligence | DPS Payout Calculator, 10-Day Pre-Ex Date Accumulation Roadmap |
| **6. Goal Planner** | Wealth Milestones | Actuarial SIP Solver, Tracked Goals Vault, Goal News Radar |
| **7. Portfolio Vault** | Demat Execution & Defense | SQLite WAL Holdings, Live Net P&L, Active 1-Week Tactical Sprints, 24/7 Watchdog |

---

## 📁 Repository Directory Structure

```
AlphaHprizon/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_stocks.py       # Live quotes, OHLCV candles, quality metrics, penny radar
│   │   │   ├── routes_simulator.py    # Monte Carlo simulation & Post-Tax math
│   │   │   ├── routes_dividend.py     # Dividend timing & cash payout solver
│   │   │   ├── routes_portfolio.py    # Persistent SQLite holdings CRUD & threat alerts
│   │   │   ├── routes_planner.py      # Goal planning & basket news radar
│   │   │   ├── routes_chat.py         # Multi-turn Conversational AI & Guru persona
│   │   │   ├── routes_tactical.py     # 1-Week Tactical screening & watchdog arming
│   │   │   └── routes_diagnostics.py  # System health & API diagnostic tools
│   │   ├── quant/
│   │   │   ├── tactical_swing_engine.py  # 1-Week momentum setup & Budget 2024 post-tax math
│   │   │   ├── crowd_psychology_engine.py# Fatal risk vs bear trap noise classifier
│   │   │   ├── data_engine.py            # Live quotes & historical OHLCV adapters
│   │   │   ├── technicals.py             # PKScreener RSI, breakouts & EMA crosses
│   │   │   ├── sector_rrg.py             # 2D Sector Relative Rotation Graph
│   │   │   ├── quality_filters.py        # Piotroski F-Score & promoter pledge filters
│   │   │   ├── taxes_charges.py          # Budget 2024 STCG/LTCG, STT, GST & turnover levies
│   │   │   ├── monte_carlo_engine.py     # 1,000-path stochastic GBM simulation & VaR
│   │   │   ├── news_engine.py            # Financial news sentiment & loss risk modeling
│   │   │   ├── dividend_engine.py        # Dividend cash payouts & accumulation windows
│   │   │   ├── radar_engine.py           # 5-factor quality screener
│   │   │   └── portfolio_monitor.py      # 24/7 threat watchdog & audio alert triggers
│   │   ├── db/
│   │   │   └── database.py            # SQLite WAL mode schema & CRUD operations
│   │   ├── core/
│   │   │   ├── config.py              # Environment settings & CORS constants
│   │   │   └── gemini_service.py      # Google GenAI SDK with Search Grounding
│   │   └── main.py                    # FastAPI application entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx            # Left navigation bar with ⌘K badge
│   │   │   ├── TickerTape.tsx         # Live continuous marquee ticker
│   │   │   ├── AiAssistantPane.tsx    # Left drawer multi-turn AI & Tactical Blueprint card
│   │   │   ├── ThreeBackground.tsx    # 3D Deep-Space Asteroid Belt Canvas
│   │   │   ├── RealTimeAlertToasts.tsx# Audio-enabled popup alerts
│   │   │   ├── SettingsModal.tsx      # Gemini API key configuration modal
│   │   │   └── ...                    # Modular chart & widget components
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx       # Market overview & dashboard hub
│   │   │   ├── RadarPage.tsx          # Multi-factor & penny screener
│   │   │   ├── StockStudioPage.tsx    # Technicals, Piotroski score, sector RRG
│   │   │   ├── SimulatorPage.tsx      # Monte Carlo & Post-Tax simulation
│   │   │   ├── DividendPage.tsx       # Cash payouts & ex-date roadmap
│   │   │   ├── GoalPlannerPage.tsx    # Actuarial SIP solver & goal tracking
│   │   │   └── PortfolioPage.tsx      # Demat holdings & Active Tactical Sprints
│   │   ├── services/
│   │   │   └── api.ts                 # Full typed API client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript data contracts
│   │   ├── App.tsx                    # Root routing & global shortcut listener
│   │   └── index.css                  # Modern Tailwind CSS styling tokens
│   ├── package.json
│   └── vite.config.ts
├── start.sh                           # Zero-configuration 1-click startup script
└── README.md
```

---

## ⚡ Quickstart

### Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `18` or higher
- **Package Managers**: `pip` and `npm`

### 1-Click Launch
```bash
chmod +x start.sh
./start.sh
```

- **Frontend Workstation**: [`http://localhost:5173`](http://localhost:5173)
- **FastAPI Backend**: [`http://localhost:8000`](http://localhost:8000)
- **Interactive OpenAPI / Swagger Docs**: [`http://localhost:8000/docs`](http://localhost:8000/docs)

### Keyboard Shortcuts
- `⌘K` / `Ctrl+K`: Open / Close the **Alpha AI & Stock Market Guru Copilot**.
- `Esc`: Close any active modal or drawer.

---

## 🔒 Security & Concurrency
- **SQLite WAL Mode**: Enabled (`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;`) for zero-lock concurrent reads and writes between the API server and portfolio background monitor.
- **Client-Side API Key Storage**: User Gemini API keys configured in the UI are saved strictly in the browser's `localStorage` and sent over HTTPS/local loopback headers.
- **CORS Hardening**: Strict origin whitelist configured for development and production dev hosts (`localhost` and `127.0.0.1` on ports `5173` and `8000`).

---

### ⚖️ Disclaimer
*AlphaPulse India Pro is an educational and quantitative research workstation. It does not constitute SEBI-registered investment advisory or financial advice. Indian equity markets involve risk; always conduct independent research before deploying capital.*
