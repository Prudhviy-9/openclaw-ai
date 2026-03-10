// src/components/LearnPanel.jsx
import { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import ChatInput from './ChatInput'

const TOPICS = [
  {
    category: 'Chart Basics',
    icon: '📊',
    items: [
      'What is a candlestick chart?',
      'What does trading volume tell us?',
      'What are support and resistance levels?',
      'What is a trend line?',
      'What is a breakout in trading?',
    ],
  },
  {
    category: 'Indicators',
    icon: '📡',
    items: [
      'Explain RSI (Relative Strength Index)',
      'What is MACD and how do I read it?',
      'How do Bollinger Bands work?',
      'What are Moving Averages (EMA vs SMA)?',
      'What is the Stochastic Oscillator?',
    ],
  },
  {
    category: 'Market Concepts',
    icon: '🧠',
    items: [
      'What is market capitalization?',
      'What are bull and bear markets?',
      'What is liquidity in crypto?',
      'What are funding rates in futures?',
      'What is a liquidation cascade?',
    ],
  },
  {
    category: 'Binance Features',
    icon: '🔶',
    items: [
      'What is Binance Earn and how does it work?',
      'Explain Binance Futures vs Spot trading',
      'What is Auto-Invest on Binance?',
      'What are limit, market, and stop orders?',
      'What is Binance Launchpad?',
    ],
  },
  {
    category: 'Risk & Strategy',
    icon: '🛡️',
    items: [
      'What is a stop-loss order?',
      'What is dollar cost averaging (DCA)?',
      'How do I read order book depth?',
      'What is risk-to-reward ratio?',
      'How does leverage affect my position?',
    ],
  },
]

export default function LearnPanel() {
  const [expanded, setExpanded] = useState(0)
  const [input, setInput]       = useState('')
  const chatRef = useRef(null)

  const { messages, loading, countdown, send } = useChat(
    "🎓 Welcome to the **OpenClaw Learning Center**.\n\nI'm your crypto educator — ask me anything about trading, indicators, chart patterns, or Binance products. No question is too basic!\n\nOr pick a topic from the left to get started."
  )

  // Auto scroll to bottom on new message
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, loading])

  return (
    <div style={S.wrap}>
      {/* ── Topic browser ── */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <div className="panel-title">Topics</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Pick any topic to learn</div>
        </div>
        <div style={S.topicList}>
          {TOPICS.map((topic, ti) => (
            <div key={topic.category}>
              <button
                style={{ ...S.categoryBtn, ...(expanded === ti ? S.categoryBtnActive : {}) }}
                onClick={() => setExpanded(ti === expanded ? -1 : ti)}
              >
                <span>{topic.icon}</span>
                <span style={{ flex: 1 }}>{topic.category}</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>{expanded === ti ? '▲' : '▼'}</span>
              </button>
              {expanded === ti && (
                <div style={S.topicItems}>
                  {topic.items.map(q => (
                    <button
                      key={q}
                      style={{ ...S.topicBtn, opacity: countdown > 0 ? 0.4 : 1 }}
                      onClick={() => countdown === 0 && send(q)}
                      disabled={countdown > 0}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rate limit status in sidebar */}
        {countdown > 0 && (
          <div style={S.sidebarStatus}>
            <span style={{ fontSize: 14 }}>⏳</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>Rate limit</div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--amber)' }}>{countdown}s remaining</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Chat area ── */}
      <div style={S.chatArea}>
        <div style={S.chatHeader}>
          <div className="panel-title">AI Educator</div>
          <div style={S.chatSubtitle}>
            {countdown > 0
              ? <span style={{ color: 'var(--amber)' }}>⏳ Rate limited — wait {countdown}s then try again</span>
              : 'Ask me anything • Powered by Gemini'
            }
          </div>
        </div>

        <div style={S.messages} ref={chatRef}>
          {messages.map((m, i) => {
            const isUser = m.role === 'user'
            const html   = m.content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>')
            return (
              <div key={i} style={{ ...S.msg, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                {!isUser && <div style={S.botLabel} className="mono">OpenClaw</div>}
                <div
                  style={isUser ? S.bubbleUser : S.bubbleBot}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                <span style={S.time} className="mono">{m.time}</span>
              </div>
            )
          })}

          {/* Typing indicator — only when loading and NOT in countdown */}
          {loading && countdown === 0 && (
            <div style={S.msg}>
              <div style={S.botLabel} className="mono">OpenClaw</div>
              <div style={S.bubbleBot}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ ...S.dot, animationDelay: `${i*0.2}s` }} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested quick questions */}
        <div style={S.suggestRow}>
          {['What is RSI?', 'Explain MACD', 'What is a BB squeeze?', 'How to read candles?'].map(q => (
            <button
              key={q}
              style={{ ...S.suggest, opacity: countdown > 0 ? 0.4 : 1 }}
              onClick={() => countdown === 0 && send(q)}
              disabled={countdown > 0}
            >
              {q}
            </button>
          ))}
        </div>

        {/* ✅ ChatInput with countdown */}
        <ChatInput
          value={input}
          onChange={e => setInput(e.target.value)}
          onSend={() => { if (input.trim()) { send(input); setInput('') } }}
          loading={loading}
          countdown={countdown}
          placeholder="Ask any crypto or trading question…"
        />
      </div>
    </div>
  )
}

const S = {
  wrap: { display: 'flex', height: '100%', animation: 'fadeUp 0.4s ease' },
  sidebar: {
    width: 260, borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
  },
  sidebarHeader: { padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  topicList:     { flex: 1, overflowY: 'auto', padding: '8px 0' },
  categoryBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', background: 'transparent', border: 'none',
    color: 'var(--text2)', fontFamily: 'var(--font-ui)', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
  },
  categoryBtnActive: { color: 'var(--cyan)', background: 'rgba(0,212,255,0.04)' },
  topicItems: { padding: '2px 0 8px 0' },
  topicBtn: {
    width: '100%', display: 'block', padding: '8px 16px 8px 44px',
    background: 'transparent', border: 'none', color: 'var(--text3)',
    fontFamily: 'var(--font-ui)', fontSize: 12, cursor: 'pointer',
    textAlign: 'left', transition: 'color 0.15s', lineHeight: 1.4,
  },
  sidebarStatus: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px',
    background: 'rgba(255,171,0,0.06)',
    borderTop: '1px solid rgba(255,171,0,0.15)',
    flexShrink: 0,
  },
  chatArea:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chatHeader:  { padding: '20px 24px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  chatSubtitle: { fontSize: 12, color: 'var(--text3)', marginTop: 4 },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 },
  msg:      { display: 'flex', flexDirection: 'column', gap: 3, animation: 'slideIn 0.2s ease' },
  botLabel: { fontSize: 9, color: 'var(--cyan)', letterSpacing: 1.5, marginBottom: 3, opacity: 0.7 },
  bubbleUser: {
    maxWidth: '75%', padding: '10px 14px',
    background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '12px 12px 2px 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--cyan)',
  },
  bubbleBot: {
    maxWidth: '80%', padding: '12px 16px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '2px 12px 12px 12px', fontSize: 13, lineHeight: 1.65,
  },
  time: { fontSize: 9, color: 'var(--text3)', padding: '0 4px' },
  dot:  { width: 5, height: 5, background: 'var(--text3)', borderRadius: '50%', animation: 'typingBounce 1.2s ease-in-out infinite' },
  suggestRow: {
    padding: '8px 24px', display: 'flex', gap: 6, flexWrap: 'wrap',
    borderTop: '1px solid var(--border)', flexShrink: 0,
  },
  suggest: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text3)', fontFamily: 'var(--font-data)', fontSize: 9,
    padding: '4px 10px', borderRadius: 20, cursor: 'pointer', transition: 'opacity 0.2s',
  },
}
