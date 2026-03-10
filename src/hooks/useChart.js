// src/hooks/useChart.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchKlines, deriveSignal, subscribePrice } from '../services/binance'

// 6 months of data per interval:
// 15m → 6mo = ~17,280 candles (too heavy, cap at 2000 = ~3 weeks)
// 1H  → 6mo = 4,380 candles
// 4H  → 6mo = 1,095 candles
// 1D  → 6mo = 180 candles
// 1W  → 6mo = 26 candles (do 2 years = 104)
export const INTERVALS = [
  { label: '15m', value: '15m', limit: 2000  },
  { label: '1H',  value: '1h',  limit: 4380  },
  { label: '4H',  value: '4h',  limit: 1095  },
  { label: '1D',  value: '1d',  limit: 180   },
  { label: '1W',  value: '1w',  limit: 104   },
]

export function useChart(symbol = 'BTC') {
  const [interval, setInterval]     = useState('1h')
  const [klines, setKlines]         = useState([])
  const [livePrice, setLivePrice]   = useState(null)
  const [indicators, setIndicators] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const unsubRef  = useRef(null)
  const symbolRef = useRef(symbol)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setLivePrice(null)
    setKlines([])
    setIndicators(null)
    try {
      const cfg  = INTERVALS.find(i => i.value === interval)
      const data = await fetchKlines(`${symbol}USDT`, interval, cfg.limit)
      setKlines(data)
      setLivePrice(data[data.length - 1]?.close ?? null)
      setIndicators(deriveSignal(data))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [symbol, interval])

  useEffect(() => { load() }, [load])

  // WebSocket — close old before opening new
  useEffect(() => {
    symbolRef.current = symbol
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }

    const timer = setTimeout(() => {
      const unsub = subscribePrice(symbol, p => {
        if (symbolRef.current === symbol) setLivePrice(p)
      })
      unsubRef.current = unsub
    }, 100)

    return () => {
      clearTimeout(timer)
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    }
  }, [symbol])

  return { klines, livePrice, indicators, loading, error, interval, setInterval, reload: load }
}
