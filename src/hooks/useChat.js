// src/hooks/useChat.js
// Clean version — no auto-retry, shows error once, user manually retries

import { useState, useCallback, useRef } from 'react'
import { askClaude } from '../services/claude'

const NOW = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export function useChat(initialMessage) {
  const [messages, setMessages]   = useState([
    { role: 'assistant', content: initialMessage, time: NOW() }
  ])
  const [loading, setLoading]     = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  function startCountdown(seconds) {
    clearInterval(timerRef.current)
    setCountdown(seconds)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const send = useCallback(async (text) => {
    if (!text?.trim() || loading || countdown > 0) return

    const userMsg = { role: 'user', content: text, time: NOW() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const reply   = await askClaude(history)
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: NOW() }])
    } catch (e) {
      if (e.message.startsWith('RATE_LIMIT:')) {
        const secs = parseInt(e.message.split(':')[1]) || 30
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⏳ Rate limit hit — Gemini free tier allows 15 requests/min. Wait ${secs}s then try again.`,
          time: NOW()
        }])
        startCountdown(secs)
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ ${e.message}`,
          time: NOW()
        }])
      }
    } finally {
      setLoading(false)  // always stop loading, never auto-retry
    }
  }, [messages, loading, countdown])

  const inject = useCallback((text) => send(text), [send])

  return { messages, loading, countdown, send, inject }
}
