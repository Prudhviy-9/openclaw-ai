// src/components/TrendingPanel.jsx
import { useTrending } from '../hooks/useTrending'

const TABS = ['gainers', 'losers', 'volume']
const TAB_LABELS = { gainers: '🚀 Top Gainers', losers: '📉 Top Losers', volume: '🔥 Top Volume' }

function fmt(n, decimals = 2) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n.toFixed(decimals)}`
}

export default function TrendingPanel({ onSelectCoin }) {
  const { data, loading, tab, setTab } = useTrending()
  const list = data[tab] || []

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div className="panel-title">Market Radar</div>
          <div style={S.subtitle}>Live Binance 24h data · Auto-updates every 30s</div>
        </div>
        <div style={S.liveTag}>
          <span style={S.liveDot} />
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--gold)' }}>LIVE</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button
            key={t}
            style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={S.colHead}>
        <span style={{ flex: 1 }}>#</span>
        <span style={{ flex: 3 }}>Coin</span>
        <span style={{ flex: 3, textAlign: 'right' }}>Price</span>
        <span style={{ flex: 2, textAlign: 'right' }}>24h %</span>
        <span style={{ flex: 3, textAlign: 'right' }}>Volume</span>
        <span style={{ flex: 2, textAlign: 'center' }}>Action</span>
      </div>

      {/* List */}
      <div style={S.list}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : list.map((coin, i) => (
            <CoinRow key={coin.symbol} coin={coin} rank={i + 1} onSelect={onSelectCoin} />
          ))
        }
      </div>

      <div style={S.footer} className="mono">
        Showing top {list.length} coins · Source: Binance /api/v3/ticker/24hr
      </div>
    </div>
  )
}

function CoinRow({ coin, rank, onSelect }) {
  const isUp = coin.change >= 0
  return (
    <div style={S.row}>
      <span style={{ ...S.cell, flex: 1, color: 'var(--text3)' }} className="mono">{rank}</span>
      <span style={{ ...S.cell, flex: 3 }}>
        <span style={S.coinName}>{coin.symbol}</span>
        <span style={S.coinLabel} className="mono">/USDT</span>
      </span>
      <span style={{ ...S.cell, flex: 3, textAlign: 'right' }} className="mono">
        {coin.price >= 1 ? `$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : `$${coin.price.toFixed(6)}`}
      </span>
      <span style={{ ...S.cell, flex: 2, textAlign: 'right', color: isUp ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-data)', fontSize: 12 }}>
        {isUp ? '+' : ''}{coin.change.toFixed(2)}%
      </span>
      <span style={{ ...S.cell, flex: 3, textAlign: 'right', color: 'var(--text2)' }} className="mono">
        {fmt(coin.volume)}
      </span>
      <span style={{ ...S.cell, flex: 2, textAlign: 'center' }}>
        <button style={S.analyzeBtn} onClick={() => onSelect(coin.symbol)}>
          Analyze
        </button>
      </span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{ ...S.row, opacity: 0.3 }}>
      {[1, 3, 3, 2, 3, 2].map((f, i) => (
        <div key={i} style={{ flex: f, height: 12, background: 'var(--surface2)', borderRadius: 3, margin: '0 4px' }} />
      ))}
    </div>
  )
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeUp 0.4s ease' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 24px 0',
  },
  subtitle: { fontSize: 12, color: 'var(--text3)', marginTop: 4 },
  liveTag: {
    display: 'flex', alignItems: 'center', gap: 6,
    border: '1px solid rgba(245,200,66,0.2)',
    background: 'rgba(0,212,255,0.05)',
    padding: '5px 10px', borderRadius: 20,
  },
  liveDot: {
    width: 6, height: 6,
    background: 'var(--cyan)',
    borderRadius: '50%',
    boxShadow: '0 0 6px var(--cyan)',
    animation: 'blink 1.5s infinite',
  },
  tabs: { display: 'flex', gap: 0, padding: '16px 24px 0', borderBottom: '1px solid var(--border)' },
  tab: {
    padding: '8px 18px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text3)',
    fontFamily: 'var(--font-data)',
    fontSize: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: -1,
  },
  tabActive: {
    color: 'var(--gold)',
    borderBottomColor: 'var(--cyan)',
  },
  colHead: {
    display: 'flex',
    padding: '10px 24px',
    fontFamily: 'var(--font-data)',
    fontSize: 9,
    color: 'var(--text3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
  },
  list: { flex: 1, overflowY: 'auto', padding: '0 24px' },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '11px 0',
    borderBottom: '1px solid rgba(26,40,64,0.5)',
    transition: 'background 0.15s',
    cursor: 'default',
  },
  cell: { fontSize: 13 },
  coinName:  { fontWeight: 600, fontSize: 13 },
  coinLabel: { fontSize: 10, color: 'var(--text3)', marginLeft: 3 },
  analyzeBtn: {
    background: 'var(--gold-dim)',
    border: '1px solid rgba(0,212,255,0.25)',
    color: 'var(--gold)',
    fontFamily: 'var(--font-data)',
    fontSize: 9,
    padding: '4px 10px',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: 0.5,
  },
  footer: {
    padding: '10px 24px',
    fontSize: 9,
    color: 'var(--text3)',
    borderTop: '1px solid var(--border)',
  },
}
