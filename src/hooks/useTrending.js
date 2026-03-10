// src/hooks/useTrending.js
import { useState, useEffect, useRef } from 'react'
import { fetchTrending, subscribeMultiTicker } from '../services/binance'

export function useTrending() {
  const [data, setData]       = useState({ gainers: [], losers: [], volume: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('gainers') // 'gainers' | 'losers' | 'volume'
  const liveRef = useRef({})

  // Initial REST fetch
  useEffect(() => {
    fetchTrending()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))

    // Refresh every 30s
    const id = setInterval(() => {
      fetchTrending().then(d => setData(d))
    }, 30_000)

    return () => clearInterval(id)
  }, [])

  // Live price updates via WebSocket for the currently visible list
  useEffect(() => {
    if (!data.gainers.length) return
    const symbols = data[tab].slice(0, 25).map(c => c.symbol)

    const unsub = subscribeMultiTicker(symbols, update => {
      liveRef.current[update.symbol] = update
      setData(prev => {
        const updated = prev[tab].map(c =>
          c.symbol === update.symbol
            ? { ...c, price: update.price, change: update.change }
            : c
        )
        return { ...prev, [tab]: updated }
      })
    })

    return unsub
  }, [tab, data.gainers.length])

  return { data, loading, tab, setTab }
}