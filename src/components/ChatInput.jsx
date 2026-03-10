// src/components/ChatInput.jsx
export default function ChatInput({ value, onChange, onSend, loading, countdown, placeholder }) {
  const isBlocked = loading || countdown > 0

  return (
    <div style={S.wrap}>
      {countdown > 0 && (
        <div style={S.rateBanner}>
          ⏳ Rate limited — wait <strong style={{ color: 'var(--amber)' }}>{countdown}s</strong> then try again
        </div>
      )}
      <div style={S.row}>
        <input
          style={{ ...S.input, opacity: isBlocked ? 0.5 : 1 }}
          value={value}
          placeholder={countdown > 0 ? `Wait ${countdown}s…` : placeholder}
          onChange={onChange}
          onKeyDown={e => e.key === 'Enter' && !isBlocked && onSend()}
          disabled={isBlocked}
        />
        <button
          style={{ ...S.btn, opacity: isBlocked ? 0.4 : 1 }}
          onClick={onSend}
          disabled={isBlocked}
        >
          {loading ? '…' : countdown > 0 ? countdown : '➤'}
        </button>
      </div>
    </div>
  )
}

const S = {
  wrap: { padding: 12, borderTop: '1px solid var(--border)', flexShrink: 0 },
  rateBanner: {
    fontSize: 12, color: 'var(--text2)',
    background: 'rgba(255,171,0,0.07)',
    border: '1px solid rgba(255,171,0,0.2)',
    borderRadius: 8, padding: '6px 12px',
    marginBottom: 8,
  },
  row: { display: 'flex', gap: 8 },
  input: {
    flex: 1, background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontFamily: 'var(--font-ui)',
    fontSize: 12.5, padding: '9px 12px', outline: 'none',
  },
  btn: {
    width: 36, height: 36,
    background: 'var(--cyan)', border: 'none',
    borderRadius: 8, color: '#000', fontSize: 14,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-data)', fontWeight: 700,
  },
}
