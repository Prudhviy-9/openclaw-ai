// src/hooks/useAlerts.js
// Fixed: no longer auto-scans on load — only scans when user clicks "Scan Now"
// This prevents burning Gemini API quota in the background

import { useState } from 'react'
import { fetchKlines, deriveSignal } from '../services/binance'

const WATCH_LIST = ['BTC','ETH','BNB','SOL','XRP','DOGE','ADA','AVAX','LINK','DOT']

function generateAlerts(symbol, sig) {
  const alerts = []
  const t = Date.now()

  if (sig.rsi !== null) {
    if (sig.rsi < 30) {
      alerts.push({
        id: `${symbol}-rsi-os-${t}`,
        type: 'oversold', level: 'high', symbol,
        message: `RSI at ${sig.rsi} — deeply oversold territory. Historically a mean-reversion zone.`,
        icon: '📉', color: 'cyan',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    } else if (sig.rsi > 70) {
      alerts.push({
        id: `${symbol}-rsi-ob-${t}`,
        type: 'overbought', level: 'high', symbol,
        message: `RSI at ${sig.rsi} — overbought. Watch for momentum exhaustion.`,
        icon: '📈', color: 'amber',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    }
  }

  if (sig.macd) {
    if (sig.macd.bullish && sig.macd.histogram > 0 && sig.macd.histogram < 2) {
      alerts.push({
        id: `${symbol}-macd-bull-${t}`,
        type: 'macd_cross', level: 'medium', symbol,
        message: `MACD bullish crossover detected. Histogram turning positive (+${sig.macd.histogram}).`,
        icon: '⚡', color: 'green',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    } else if (!sig.macd.bullish && sig.macd.histogram < 0 && sig.macd.histogram > -2) {
      alerts.push({
        id: `${symbol}-macd-bear-${t}`,
        type: 'macd_cross', level: 'medium', symbol,
        message: `MACD bearish crossover. Histogram turning negative (${sig.macd.histogram}).`,
        icon: '⚠️', color: 'red',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    }
  }

  if (sig.bb) {
    if (sig.bb.width < 3) {
      alerts.push({
        id: `${symbol}-bb-squeeze-${t}`,
        type: 'bb_squeeze', level: 'medium', symbol,
        message: `Bollinger Band squeeze (width ${sig.bb.width}%). Low volatility — breakout imminent.`,
        icon: '🔀', color: 'purple',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    }
    if (sig.last > sig.bb.upper) {
      alerts.push({
        id: `${symbol}-bb-break-${t}`,
        type: 'bb_breakout', level: 'high', symbol,
        message: `Price broke above Bollinger upper band ($${sig.bb.upper.toFixed(2)}). Strong momentum.`,
        icon: '🚀', color: 'green',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    }
  }

  return alerts
}

export function useAlerts() {
  const [alerts, setAlerts]     = useState([])
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned]   = useState(false)

  // ✅ NO auto-scan on mount — only runs when user clicks "Scan Now"
  // This prevents eating Gemini quota silently in background

  const scanAll = async () => {
    setScanning(true)
    const newAlerts = []
    const seen = new Set()

    await Promise.allSettled(
      WATCH_LIST.map(async sym => {
        try {
          // Uses Binance REST only — no AI quota used here
          const klines = await fetchKlines(`${sym}USDT`, '1h', 60)
          const sig    = deriveSignal(klines)
          const found  = generateAlerts(sym, sig)
          found.forEach(a => {
            const key = `${a.symbol}-${a.type}`
            if (!seen.has(key)) { seen.add(key); newAlerts.push(a) }
          })
        } catch { /* skip failed symbol */ }
      })
    )

    setAlerts(newAlerts.length > 0 ? newAlerts : [])
    setScanning(false)
    setScanned(true)
  }

  function dismiss(id) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return { alerts, scanning, scanned, dismiss, scanAll }
}
