// src/services/claude.js
// Gemini 2.0 Flash — 5s throttle, no auto-retry

const API_KEY  = import.meta.env.VITE_GEMINI_API_KEY
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

export const SYSTEM_PROMPT = `You are OpenClaw, an expert crypto analyst and educator built for Binance users.

YOUR TWO ROLES:
1. EDUCATOR — Explain crypto concepts clearly with real analogies. Topics: RSI, MACD, Bollinger Bands, candlesticks, support/resistance, volume, DeFi, staking, Binance features, etc.
2. ANALYST — When given chart data, interpret RSI/MACD/BB, identify trends and key levels. Always mention what would invalidate your analysis.

RULES: No financial advice. Explain WHY. Under 150 words.`

// Enforce 5s gap between requests — stays safely under 15 RPM free tier
let lastRequestTime = 0

export async function askClaude(messages) {
  // Throttle
  const gap = Date.now() - lastRequestTime
  if (gap < 5000) await new Promise(r => setTimeout(r, 5000 - gap))
  lastRequestTime = Date.now()

  const allMessages = [
    { role: 'user',  parts: [{ text: SYSTEM_PROMPT + '\n\nAcknowledge ready.' }] },
    { role: 'model', parts: [{ text: 'Ready. I am OpenClaw.' }] },
    ...messages.map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  ]

  // Merge consecutive same-role turns (Gemini strict alternation)
  const contents = []
  for (const m of allMessages) {
    if (contents.length && contents[contents.length - 1].role === m.role) {
      contents[contents.length - 1].parts[0].text += '\n' + m.parts[0].text
    } else {
      contents.push({ role: m.role, parts: [{ text: m.parts[0].text }] })
    }
  }

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ contents, generationConfig: { maxOutputTokens: 300, temperature: 0.7 } })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `Error ${res.status}`
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || res.status === 429) {
      // Block next request for 30s in the throttle
      lastRequestTime = Date.now() + 25000
      throw new Error('RATE_LIMIT:30')
    }
    throw new Error(msg)
  }

  const data = await res.json()
  if (data.candidates?.[0]?.finishReason === 'SAFETY') return 'Response filtered. Please rephrase.'
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response received.'
}

export function buildAnalysisPrompt(symbol, klineInterval, indicators) {
  const { rsi, macd, bb, last, action } = indicators
  return `Analyze ${symbol}/USDT on the ${klineInterval} chart.
- Price: $${last?.toFixed(4)}
- RSI(14): ${rsi}
- MACD: ${macd?.macd} | Signal: ${macd?.signal} | Histogram: ${macd?.histogram} | ${macd?.bullish ? 'Bullish' : 'Bearish'} crossover
- BB: Upper $${bb?.upper} | Middle $${bb?.middle} | Lower $${bb?.lower} | Width: ${bb?.width}%
- Signal: ${action}
Give a structured technical analysis: trend, momentum, volatility, key levels.`
}
