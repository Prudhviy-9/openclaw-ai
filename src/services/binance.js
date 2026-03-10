// src/services/binance.js
// All data from Binance public APIs — no API key required

const REST = 'https://api.binance.com/api/v3'
const WS   = 'wss://stream.binance.com:9443/ws'

// ── Fetch top gainers / losers / volume ───────────────────────────────────────
export async function fetchTrending() {
  const res  = await fetch(`${REST}/ticker/24hr`)
  const data = await res.json()
  const EXCLUDE = /USDC|BUSD|TUSD|FDUSD|DAI|UP|DOWN|BEAR|BULL|3L|3S/i
  const usdt = data.filter(t =>
    t.symbol.endsWith('USDT') && !EXCLUDE.test(t.symbol) && parseFloat(t.quoteVolume) > 1_000_000
  )
  const byChange = [...usdt].sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
  const byVolume = [...usdt].sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
  return {
    gainers: byChange.slice(0, 25).map(formatTicker),
    losers:  byChange.slice(-25).reverse().map(formatTicker),
    volume:  byVolume.slice(0, 25).map(formatTicker),
  }
}

function formatTicker(t) {
  return {
    symbol: t.symbol.replace('USDT', ''),
    price:  parseFloat(t.lastPrice),
    change: parseFloat(t.priceChangePercent),
    volume: parseFloat(t.quoteVolume),
    high:   parseFloat(t.highPrice),
    low:    parseFloat(t.lowPrice),
    trades: parseInt(t.count),
  }
}

// ── Fetch klines with multi-batch support for long history ────────────────────
// Binance max is 1000 per request. For 6 months of 1H = ~4380 candles → 5 batches
export async function fetchKlines(symbol = 'BTCUSDT', interval = '1h', limit = 500) {
  const MAX_PER_REQ = 1000

  if (limit <= MAX_PER_REQ) {
    // Single request
    const res  = await fetch(`${REST}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
    const data = await res.json()
    return parseKlines(data)
  }

  // Multi-batch: fetch from oldest → newest using endTime pagination
  const allKlines = []
  let endTime     = Date.now()
  let remaining   = limit

  while (remaining > 0) {
    const batchSize = Math.min(remaining, MAX_PER_REQ)
    const url = `${REST}/klines?symbol=${symbol}&interval=${interval}&limit=${batchSize}&endTime=${endTime}`
    const res  = await fetch(url)
    const data = await res.json()
    if (!data.length) break

    allKlines.unshift(...parseKlines(data)) // prepend older data
    endTime   = data[0][0] - 1              // go further back in time
    remaining -= data.length
    if (data.length < batchSize) break      // no more historical data
  }

  return allKlines
}

function parseKlines(data) {
  return data.map(k => ({
    time:   k[0],
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    close:  parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}

// ── Compute RSI ───────────────────────────────────────────────────────────────
export function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains  += diff
    else          losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period
  }
  if (avgLoss === 0) return 100
  return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2))
}

// ── Compute EMA ───────────────────────────────────────────────────────────────
export function computeEMA(closes, period) {
  const k = 2 / (period + 1)
  let ema  = closes[0]
  const result = [ema]
  for (let i = 1; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
    result.push(ema)
  }
  return result
}

// ── Compute MACD ──────────────────────────────────────────────────────────────
export function computeMACD(closes) {
  const ema12    = computeEMA(closes, 12)
  const ema26    = computeEMA(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signal   = computeEMA(macdLine.slice(26), 9)
  const last     = macdLine.length - 1
  const sigLast  = signal.length - 1
  return {
    macd:      parseFloat(macdLine[last].toFixed(4)),
    signal:    parseFloat(signal[sigLast].toFixed(4)),
    histogram: parseFloat((macdLine[last] - signal[sigLast]).toFixed(4)),
    bullish:   macdLine[last] > signal[sigLast],
  }
}

// ── Compute Bollinger Bands ───────────────────────────────────────────────────
export function computeBollingerBands(closes, period = 20, multiplier = 2) {
  const slice  = closes.slice(-period)
  const mean   = slice.reduce((a, b) => a + b, 0) / period
  const stddev = Math.sqrt(slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period)
  return {
    upper:  parseFloat((mean + multiplier * stddev).toFixed(4)),
    middle: parseFloat(mean.toFixed(4)),
    lower:  parseFloat((mean - multiplier * stddev).toFixed(4)),
    width:  parseFloat(((multiplier * 2 * stddev / mean) * 100).toFixed(2)),
  }
}

// ── Derive signal ─────────────────────────────────────────────────────────────
export function deriveSignal(klines) {
  const closes = klines.map(k => k.close)
  const rsi    = computeRSI(closes)
  const macd   = computeMACD(closes)
  const bb     = computeBollingerBands(closes)
  const last   = closes[closes.length - 1]
  let score = 0
  if (rsi < 40)             score += 2
  else if (rsi > 60)        score -= 2
  if (macd.bullish)         score += 2
  else                      score -= 2
  if (last < bb.lower)      score += 1
  else if (last > bb.upper) score -= 1
  const action = score >= 2 ? 'BUY' : score <= -2 ? 'SELL' : 'NEUTRAL'
  return { rsi, macd, bb, last, action, strength: Math.abs(score), score }
}

// ── WebSocket live price ──────────────────────────────────────────────────────
export function subscribePrice(symbol, onPrice) {
  const ws = new WebSocket(`${WS}/${symbol.toLowerCase()}usdt@aggTrade`)
  ws.onmessage = e => { onPrice(parseFloat(JSON.parse(e.data).p)) }
  ws.onerror   = err => console.warn('[WS]', err)
  return () => ws.readyState === WebSocket.OPEN && ws.close()
}

// ── WebSocket multi-stream ticker ─────────────────────────────────────────────
export function subscribeMultiTicker(symbols, onUpdate) {
  const streams = symbols.map(s => `${s.toLowerCase()}usdt@miniTicker`).join('/')
  const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`)
  ws.onmessage = e => {
    const msg = JSON.parse(e.data)
    if (msg.data) {
      const d = msg.data
      onUpdate({ symbol: d.s.replace('USDT',''), price: parseFloat(d.c), change: parseFloat(((d.c - d.o) / d.o * 100).toFixed(2)), volume: parseFloat(d.q) })
    }
  }
  ws.onerror = err => console.warn('[WS Multi]', err)
  return () => ws.readyState === WebSocket.OPEN && ws.close()
}