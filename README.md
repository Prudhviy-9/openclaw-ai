# 🦞 OpenClaw AI

**Real-time crypto intelligence powered by live Binance data and Gemini AI.**

OpenClaw is a professional trading dashboard that gives you live market data, interactive charts, AI-powered technical analysis, and automated signal alerts — all in one place.

![Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Binance](https://img.shields.io/badge/Data-Binance%20Live-F5C842?style=flat-square&logo=binance&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---
## ✨ Features

### 📡 Live Market Radar
- Top 25 Gainers, Losers, and Volume — updated every 30 seconds
- Live price streaming via Binance WebSocket
- Click any coin to instantly open it in the chart

### 📊 Interactive Chart
- Drag to pan, scroll to zoom, crosshair with OHLC tooltip
- EMA 20 & EMA 50 overlaid on price
- Separated volume panel below the chart
- Timeframes: 15m · 1H · 4H · 1D · 1W

### 🤖 AI Analysis
- One-click analysis powered by Gemini 2.0 Flash
- Reads RSI, MACD, and Bollinger Bands from live data
- Returns structured breakdown: trend, momentum, volatility, key levels
- Rate-limit safe — stays within Gemini free tier

### 🔔 Signal Alerts
- Manual scan across 10 major coins
- Detects RSI extremes, MACD crossovers, BB squeeze breakouts
- Pure Binance data — no AI quota used

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/openclaw-ai.git
cd openclaw-ai

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Open .env and add your Gemini API key
```

### Run locally

```bash
npm run dev
# Opens at http://localhost:3000
```

---

## ⚙️ Environment Variables

```env
# Required — get free at https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=your_key_here

# Binance public endpoints — no key needed
VITE_BINANCE_REST=https://api.binance.com/api/v3
VITE_BINANCE_WS=wss://stream.binance.com:9443/ws
```

---

## 🛠 Tech Stack

| | |
|---|---|
| **Frontend** | React 18 + Vite |
| **Charts** | Custom HTML5 Canvas renderer |
| **Market Data** | Binance Public REST + WebSocket |
| **AI** | Google Gemini 2.0 Flash |
| **Fonts** | JetBrains Mono · Bebas Neue · Space Grotesk |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx          Navigation
│   ├── TrendingPanel.jsx    Live market radar
│   ├── ChartPanel.jsx       Chart + AI analysis
│   └── AlertsPanel.jsx      Signal alerts
├── hooks/
│   ├── useChart.js          Kline data + live price
│   ├── useTrending.js       24h market data
│   └── useAlerts.js         Signal scanner
├── services/
│   ├── binance.js           Binance API + indicators
│   └── claude.js            Gemini AI + throttle
└── styles/
    └── globals.css          Dark gold theme
```

---

## 📊 Indicators

All computed client-side from raw Binance OHLCV — no third-party library:

| Indicator | Method |
|-----------|--------|
| RSI (14) | Wilder's smoothed MA |
| MACD | EMA(12) − EMA(26), Signal EMA(9) |
| Bollinger Bands | 20-SMA ± 2 std deviations |
| EMA 20 / 50 | Exponential Moving Average |

---

## ⚠️ Disclaimer

OpenClaw is for **informational and educational purposes only**.  
Nothing here is financial advice. Always do your own research.

---

## 📄 License

MIT — free to use and build on.
