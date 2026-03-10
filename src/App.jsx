// src/App.jsx — Learn tab removed
import { useState } from 'react'
import './styles/globals.css'
import Sidebar       from './components/Sidebar'
import TrendingPanel from './components/TrendingPanel'
import ChartPanel    from './components/ChartPanel'
import AlertsPanel   from './components/AlertsPanel'

export default function App() {
  const [activeTab, setActiveTab]     = useState(0)
  const [chartSymbol, setChartSymbol] = useState('BTC')

  function handleCoinSelect(symbol) {
    setChartSymbol(symbol)
    setActiveTab(1)
  }

  return (
    <div style={S.app}>
      <Sidebar active={activeTab} onNav={setActiveTab} />
      <main style={S.main}>
        {/* Top accent line */}
        <div style={S.topAccent} />
        {activeTab === 0 && <TrendingPanel onSelectCoin={handleCoinSelect} />}
        {activeTab === 1 && <ChartPanel initialSymbol={chartSymbol} />}
        {activeTab === 2 && <AlertsPanel onSelectCoin={handleCoinSelect} />}
      </main>
    </div>
  )
}

const S = {
  app: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--panel)',
    borderRadius: '16px 0 0 16px',
    margin: '10px 10px 10px 0',
    border: '1px solid var(--border)',
    position: 'relative',
  },
  topAccent: {
    height: 1, flexShrink: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(245,200,66,0.4) 30%, rgba(0,212,255,0.3) 70%, transparent 100%)',
  },
}
