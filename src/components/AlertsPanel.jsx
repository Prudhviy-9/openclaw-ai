// src/components/AlertsPanel.jsx
import { useAlerts } from '../hooks/useAlerts'

const COLOR_MAP = {
  cyan:   { bg: 'rgba(0,212,255,0.1)',  border: 'rgba(0,212,255,0.25)',  text: 'var(--gold)'   },
  green:  { bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.25)',  text: 'var(--green)'  },
  red:    { bg: 'rgba(255,61,90,0.1)',  border: 'rgba(255,61,90,0.25)',  text: 'var(--red)'    },
  amber:  { bg: 'rgba(255,171,0,0.1)',  border: 'rgba(255,171,0,0.25)',  text: 'var(--amber)'  },
  purple: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', text: 'var(--purple)' },
}

const TYPE_LABELS = {
  oversold:   'OVERSOLD',
  overbought: 'OVERBOUGHT',
  macd_cross: 'MACD CROSS',
  bb_squeeze: 'BB SQUEEZE',
  bb_breakout:'BREAKOUT',
}

const LEVEL_COLOR = {
  high:   'var(--red)',
  medium: 'var(--amber)',
  low:    'var(--text3)',
}

export default function AlertsPanel({ onSelectCoin }) {
  const { alerts, scanning, scanned, dismiss, scanAll } = useAlerts()

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div className="panel-title">Smart Alerts</div>
          <div style={S.subtitle}>
            Technical signals from live Binance data · Uses Binance REST only (no AI quota)
          </div>
        </div>
        <button style={S.scanBtn} onClick={scanAll} disabled={scanning}>
          {scanning ? <><span style={S.spinner}>⟳</span> Scanning…</> : '⟳ Scan Now'}
        </button>
      </div>

      {/* Status bar */}
      <div style={S.statusBar}>
        {scanning ? (
          <><span style={S.scanDot} /> Scanning 10 coins for RSI, MACD, Bollinger Band signals…</>
        ) : scanned ? (
          <><span style={{ ...S.scanDot, background: 'var(--green)', animation: 'none' }} />
            {alerts.length} signal{alerts.length !== 1 ? 's' : ''} found · Click "Scan Now" to refresh</>
        ) : (
          <><span style={{ ...S.scanDot, background: 'var(--text3)', animation: 'none' }} />
            Click <strong style={{ color: 'var(--gold)' }}>Scan Now</strong> to detect signals across BTC, ETH, BNB, SOL and 6 more coins</>
        )}
      </div>

      {/* Alerts list */}
      <div style={S.list}>
        {/* Not yet scanned — prompt */}
        {!scanned && !scanning && (
          <div style={S.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={S.emptyTitle}>No scan yet</div>
            <div style={S.emptySub}>
              Click <strong>"Scan Now"</strong> above to check for technical signals.<br/>
              Scanning uses Binance market data only — no AI quota consumed.
            </div>
            <button style={S.bigScanBtn} onClick={scanAll}>⟳ Start Scan</button>
          </div>
        )}

        {/* Scanned but no alerts */}
        {scanned && !scanning && alerts.length === 0 && (
          <div style={S.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={S.emptyTitle}>Markets look calm</div>
            <div style={S.emptySub}>No significant RSI, MACD or Bollinger Band signals detected right now.</div>
            <button style={S.bigScanBtn} onClick={scanAll}>⟳ Scan Again</button>
          </div>
        )}

        {/* Alert cards */}
        {alerts.map(alert => {
          const col = COLOR_MAP[alert.color] || COLOR_MAP.cyan
          return (
            <div key={alert.id} style={{ ...S.alertCard, background: col.bg, borderColor: col.border }}>
              <div style={S.alertTop}>
                <div style={S.alertLeft}>
                  <span style={S.alertIcon}>{alert.icon}</span>
                  <span style={{ ...S.alertSymbol, color: col.text }}>{alert.symbol}</span>
                  <span style={{ ...S.alertType, color: col.text }} className="mono">
                    {TYPE_LABELS[alert.type] || alert.type}
                  </span>
                </div>
                <div style={S.alertRight}>
                  <span style={{ ...S.levelBadge, color: LEVEL_COLOR[alert.level] }} className="mono">
                    {alert.level.toUpperCase()}
                  </span>
                  <span style={S.alertTime} className="mono">{alert.time}</span>
                  <button style={S.dismissBtn} onClick={() => dismiss(alert.id)}>✕</button>
                </div>
              </div>
              <div style={S.alertMsg}>{alert.message}</div>
              <div style={S.alertActions}>
                <button
                  style={{ ...S.alertAction, color: col.text, borderColor: col.border }}
                  onClick={() => onSelectCoin && onSelectCoin(alert.symbol)}
                >
                  📊 View Chart
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Signal legend */}
      <div style={S.legend}>
        <div className="panel-title" style={{ marginBottom: 10 }}>Signal Guide</div>
        <div style={S.legendGrid}>
          {[
            { icon: '📉', label: 'Oversold (RSI < 30)',    desc: 'Asset may be due for a bounce' },
            { icon: '📈', label: 'Overbought (RSI > 70)',  desc: 'Momentum may be exhausted' },
            { icon: '⚡', label: 'MACD Cross',             desc: 'Trend direction change signal' },
            { icon: '🔀', label: 'BB Squeeze',             desc: 'Low volatility — breakout coming' },
            { icon: '🚀', label: 'BB Breakout',            desc: 'Price exceeded upper Bollinger Band' },
          ].map(item => (
            <div key={item.label} style={S.legendItem}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const S = {
  wrap:    { display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeUp 0.4s ease' },
  header:  { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 0' },
  subtitle: { fontSize: 12, color: 'var(--text3)', marginTop: 4 },
  scanBtn: {
    background: 'var(--gold-dim)', border: '1px solid rgba(245,200,66,0.3)',
    color: 'var(--gold)', fontFamily: 'var(--font-data)', fontSize: 10,
    padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.5,
  },
  spinner:  { display: 'inline-block', animation: 'typingBounce 0.6s linear infinite' },
  statusBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 24px',
    background: 'var(--surface2)',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    marginTop: 16, fontSize: 12, color: 'var(--text2)',
  },
  scanDot: {
    display: 'inline-block', width: 7, height: 7,
    background: 'var(--amber)', borderRadius: '50%',
    animation: 'blink 0.8s infinite', flexShrink: 0,
  },
  list: { flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '40px 20px', gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, maxWidth: 320 },
  bigScanBtn: {
    marginTop: 16,
    background: 'var(--gold-dim)', border: '1px solid rgba(245,200,66,0.35)',
    color: 'var(--gold)', fontFamily: 'var(--font-data)', fontSize: 11,
    padding: '10px 24px', borderRadius: 10, cursor: 'pointer', letterSpacing: 1,
  },
  alertCard:    { border: '1px solid', borderRadius: 10, padding: '12px 14px', animation: 'slideIn 0.3s ease' },
  alertTop:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  alertLeft:    { display: 'flex', alignItems: 'center', gap: 8 },
  alertIcon:    { fontSize: 18 },
  alertSymbol:  { fontSize: 14, fontWeight: 700 },
  alertType:    { fontSize: 9, letterSpacing: 1.5, opacity: 0.8 },
  alertRight:   { display: 'flex', alignItems: 'center', gap: 8 },
  levelBadge:   { fontSize: 9, letterSpacing: 1 },
  alertTime:    { fontSize: 9, color: 'var(--text3)' },
  dismissBtn:   { background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, padding: '0 2px' },
  alertMsg:     { fontSize: 13, lineHeight: 1.5, color: 'var(--text)', marginBottom: 10 },
  alertActions: { display: 'flex', gap: 8 },
  alertAction:  { background: 'transparent', border: '1px solid', fontFamily: 'var(--font-data)', fontSize: 9, padding: '4px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: 0.5 },
  legend:       { padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 },
  legendGrid:   { display: 'flex', flexDirection: 'column', gap: 8 },
  legendItem:   { display: 'flex', alignItems: 'flex-start', gap: 12 },
}
