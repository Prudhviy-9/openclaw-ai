// src/components/ChartPanel.jsx
// Interactive chart + AI analysis panel (analyze only, no chat)

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChart, INTERVALS } from '../hooks/useChart'
import { askClaude, buildAnalysisPrompt } from '../services/claude'

const POPULAR = ['BTC','ETH','BNB','SOL','XRP','DOGE','ADA','AVAX','LINK','DOT']
const PAD = { top: 14, right: 74, bottom: 26, left: 8 }
const VOL_HEIGHT = 90

function calcEMA(closes, period) {
  const k = 2 / (period + 1); let ema = closes[0]; const r = []
  for (let i = 0; i < closes.length; i++) { ema = closes[i]*k + ema*(1-k); r.push(ema) }
  return r
}
function fmtPrice(p) {
  if (p == null) return '—'
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (p >= 1)    return p.toFixed(4)
  return p.toFixed(6)
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}

function drawChart(canvas, volCanvas, klines, viewState, crosshair) {
  if (!canvas || !volCanvas || !klines.length) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.offsetWidth, H = canvas.offsetHeight, VH = volCanvas.offsetHeight
  canvas.width = W*dpr; canvas.height = H*dpr
  volCanvas.width = W*dpr; volCanvas.height = VH*dpr
  const c = canvas.getContext('2d'); c.scale(dpr,dpr)
  const vc = volCanvas.getContext('2d'); vc.scale(dpr,dpr)
  c.clearRect(0,0,W,H); vc.clearRect(0,0,W,VH)

  const { offset, candleW } = viewState
  const barSpace = candleW + 2
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const startIdx = Math.max(0, Math.floor(-offset/barSpace))
  const endIdx   = Math.min(klines.length-1, startIdx + Math.floor(chartW/barSpace) + 2)
  const visible  = klines.slice(startIdx, endIdx+1)
  if (!visible.length) return

  const maxP = Math.max(...visible.map(k=>k.high))
  const minP = Math.min(...visible.map(k=>k.low))
  const range = (maxP-minP)*1.1 || 1
  const midP = (maxP+minP)/2
  const pMin = midP-range/2, pMax = midP+range/2
  const toX = i => PAD.left + offset + i*barSpace + barSpace/2
  const toY = v => PAD.top + chartH - ((v-pMin)/(pMax-pMin))*chartH

  // Grid
  for (let i=0; i<=5; i++) {
    const y = PAD.top + (chartH/5)*i
    const price = pMax - ((pMax-pMin)/5)*i
    c.strokeStyle='rgba(30,35,55,0.9)'; c.lineWidth=1; c.setLineDash([3,5])
    c.beginPath(); c.moveTo(PAD.left,y); c.lineTo(W-PAD.right,y); c.stroke()
    c.setLineDash([])
    c.fillStyle='#2a3450'; c.font='9px JetBrains Mono'; c.textAlign='left'
    c.fillText(fmtPrice(price), W-PAD.right+6, y+3)
  }

  // Clip + EMA + Candles
  c.save(); c.beginPath(); c.rect(PAD.left,0,chartW,H); c.clip()
  const closes = klines.map(k=>k.close)
  const ema20 = calcEMA(closes,20), ema50 = calcEMA(closes,50)
  const drawEMA = (vals, color) => {
    c.beginPath(); c.strokeStyle=color; c.lineWidth=1.5; let started=false
    for (let i=0; i<klines.length; i++) {
      const x=toX(i); if(x<PAD.left-barSpace||x>W-PAD.right+barSpace) continue
      const y=toY(vals[i]); if(!started){c.moveTo(x,y);started=true}else c.lineTo(x,y)
    }
    c.stroke()
  }
  drawEMA(ema20,'rgba(245,200,66,0.75)')
  drawEMA(ema50,'rgba(61,142,245,0.65)')

  for (let i=0; i<klines.length; i++) {
    const x=toX(i); if(x<PAD.left-barSpace*2||x>W-PAD.right+barSpace) continue
    const k=klines[i], isUp=k.close>=k.open, col=isUp?'#00e676':'#ff4560'
    const open=toY(k.open),close=toY(k.close),high=toY(k.high),low=toY(k.low)
    c.strokeStyle=col; c.lineWidth=1
    c.beginPath(); c.moveTo(x,high); c.lineTo(x,low); c.stroke()
    c.fillStyle=col; c.globalAlpha=isUp?0.93:0.88
    c.fillRect(x-candleW/2,Math.min(open,close),candleW,Math.max(Math.abs(open-close),1.5))
    c.globalAlpha=1
  }
  c.restore()

  // Time axis
  const visCount=endIdx-startIdx+1, step=Math.max(1,Math.floor(visCount/7))
  c.fillStyle='#2a3450'; c.font='9px JetBrains Mono'; c.textAlign='center'
  for (let i=startIdx; i<=endIdx; i+=step) {
    const x=toX(i); if(x<PAD.left||x>W-PAD.right) continue
    const dt=new Date(klines[i].time)
    c.fillText(`${dt.getMonth()+1}/${dt.getDate()} ${dt.getHours()}:00`,x,H-7)
  }

  // Crosshair
  if (crosshair?.x!=null) {
    const {x:mx,y:my}=crosshair
    const ci=Math.max(0,Math.min(klines.length-1,Math.round((mx-PAD.left-offset-barSpace/2)/barSpace)))
    const k=klines[ci], cx=toX(ci)
    if (mx>=PAD.left&&mx<=W-PAD.right&&my>=PAD.top&&my<=PAD.top+chartH) {
      c.strokeStyle='rgba(245,200,66,0.35)'; c.lineWidth=1; c.setLineDash([4,4])
      c.beginPath(); c.moveTo(cx,PAD.top); c.lineTo(cx,PAD.top+chartH); c.stroke()
      c.beginPath(); c.moveTo(PAD.left,my); c.lineTo(W-PAD.right,my); c.stroke()
      c.setLineDash([])
      const hoverPrice=pMax-((my-PAD.top)/chartH)*(pMax-pMin)
      c.fillStyle='rgba(245,200,66,0.9)'; c.fillRect(W-PAD.right+1,my-9,PAD.right-2,18)
      c.fillStyle='#000'; c.font='9px JetBrains Mono'; c.textAlign='left'
      c.fillText(fmtPrice(hoverPrice),W-PAD.right+5,my+3)
      const isUp=k.close>=k.open, bx=cx+12<W-168?cx+12:cx-170, by=PAD.top+6
      c.fillStyle='rgba(7,8,14,0.95)'; c.strokeStyle=isUp?'rgba(0,230,118,0.4)':'rgba(255,69,96,0.4)'
      c.lineWidth=1; c.setLineDash([]); roundRect(c,bx,by,160,80,8); c.fill(); c.stroke()
      const dt=new Date(k.time)
      c.fillStyle='#4a6080'; c.font='9px JetBrains Mono'; c.textAlign='left'
      c.fillText(`${dt.getMonth()+1}/${dt.getDate()} ${dt.getHours()}:00`,bx+10,by+14)
      ;[['O',k.open],['H',k.high],['L',k.low],['C',k.close]].forEach(([l,v],ri)=>{
        c.fillStyle='#3a5070'; c.fillText(l,bx+10,by+28+ri*13)
        c.fillStyle=isUp?'#00e676':'#ff4560'; c.fillText(fmtPrice(v),bx+26,by+28+ri*13)
      })
    }
  }

  // Volume panel
  const vPad={top:8,right:PAD.right,bottom:18,left:PAD.left}, vChartH=VH-vPad.top-vPad.bottom
  const maxVol=Math.max(...visible.map(k=>k.volume))
  vc.strokeStyle='rgba(30,35,55,0.6)'; vc.lineWidth=1; vc.setLineDash([2,4])
  vc.beginPath(); vc.moveTo(vPad.left,vPad.top); vc.lineTo(W-vPad.right,vPad.top); vc.stroke()
  vc.setLineDash([])
  const mf=maxVol>=1e9?(maxVol/1e9).toFixed(1)+'B':maxVol>=1e6?(maxVol/1e6).toFixed(1)+'M':maxVol>=1e3?(maxVol/1e3).toFixed(1)+'K':maxVol.toFixed(0)
  vc.fillStyle='#2a3450'; vc.font='9px JetBrains Mono'; vc.textAlign='left'; vc.fillText(mf,W-vPad.right+4,vPad.top+6)
  vc.fillText('VOL',vPad.left+6,vPad.top+12)
  vc.textAlign='center'
  for (let i=startIdx; i<=endIdx; i+=step) {
    const x=toX(i); if(x<vPad.left||x>W-vPad.right) continue
    const dt=new Date(klines[i].time); vc.fillText(`${dt.getMonth()+1}/${dt.getDate()}`,x,VH-3)
  }
  vc.save(); vc.beginPath(); vc.rect(vPad.left,0,W-vPad.left-vPad.right,VH); vc.clip()
  for (let i=0; i<klines.length; i++) {
    const x=toX(i); if(x<vPad.left-barSpace*2||x>W-vPad.right+barSpace) continue
    const k=klines[i],isUp=k.close>=k.open,bh=(k.volume/maxVol)*vChartH
    vc.fillStyle=isUp?'rgba(0,230,118,0.55)':'rgba(255,69,96,0.5)'
    vc.fillRect(x-candleW/2,vPad.top+vChartH-bh,candleW,bh)
  }
  vc.restore()
  if (crosshair?.x!=null) {
    const ci=Math.max(0,Math.min(klines.length-1,Math.round((crosshair.x-PAD.left-offset-barSpace/2)/barSpace)))
    const cx=toX(ci)
    vc.strokeStyle='rgba(245,200,66,0.25)'; vc.lineWidth=1; vc.setLineDash([4,4])
    vc.beginPath(); vc.moveTo(cx,vPad.top); vc.lineTo(cx,vPad.top+vChartH); vc.stroke()
    vc.setLineDash([])
  }
}

function Badge({ label, value, status }) {
  const color=status==='bull'?'var(--green)':status==='bear'?'var(--red)':'var(--amber)'
  return (
    <div style={{...S.badge,borderColor:color+'40',background:color+'10'}}>
      <span style={{fontFamily:'var(--font-data)',fontSize:8,color:'var(--text3)',letterSpacing:1.5}}>{label}</span>
      <span style={{fontFamily:'var(--font-data)',fontSize:11,color,fontWeight:700}}>{value}</span>
    </div>
  )
}

// ── AI Analysis Panel ─────────────────────────────────────────────────────────
function AIPanel({ symbol, interval, indicators }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  // Reset when symbol changes
  useEffect(() => { setAnalysis(null); setError(null) }, [symbol, interval])

  function startCountdown(secs) {
    setCountdown(secs)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(prev => { if (prev<=1){clearInterval(timerRef.current);return 0} return prev-1 })
    }, 1000)
  }

  async function analyze() {
    if (!indicators || loading || countdown>0) return
    setLoading(true); setError(null); setAnalysis(null)
    try {
      const prompt = buildAnalysisPrompt(symbol, interval, indicators)
      const result = await askClaude([{ role:'user', content: prompt }])
      setAnalysis(result)
    } catch(e) {
      if (e.message.startsWith('RATE_LIMIT:')) {
        const secs = parseInt(e.message.split(':')[1]) || 30
        setError(`Rate limit — wait ${secs}s then analyze again.`)
        startCountdown(secs)
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Format analysis text into sections
  const formatAnalysis = (text) => {
    if (!text) return null
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--gold)">$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div style={S.aiPanel}>
      {/* Header */}
      <div style={S.aiHeader}>
        <div>
          <div style={S.aiTitle}>AI ANALYSIS</div>
          <div style={S.aiSub}>{symbol}/USDT · {interval} · Gemini</div>
        </div>
        <button
          style={{
            ...S.analyzeBtn,
            opacity: (!indicators || loading || countdown>0) ? 0.5 : 1,
            background: loading ? 'var(--surface2)' : 'var(--gold-dim)',
          }}
          onClick={analyze}
          disabled={!indicators || loading || countdown>0}
        >
          {loading ? (
            <><span style={S.spinner}>⟳</span> Analyzing…</>
          ) : countdown > 0 ? (
            `Wait ${countdown}s`
          ) : (
            '⚡ Analyze'
          )}
        </button>
      </div>

      <hr style={S.divider}/>

      {/* Indicators summary */}
      {indicators && (
        <div style={S.indGrid}>
          {[
            { label:'RSI (14)', value: indicators.rsi, note: indicators.rsi<30?'Oversold':indicators.rsi>70?'Overbought':'Neutral', color: indicators.rsi<30?'var(--green)':indicators.rsi>70?'var(--red)':'var(--amber)' },
            { label:'MACD',     value: indicators.macd?.macd,    note: indicators.macd?.bullish?'Bullish crossover':'Bearish crossover', color: indicators.macd?.bullish?'var(--green)':'var(--red)' },
            { label:'Signal',   value: indicators.macd?.signal,  note: `Hist: ${indicators.macd?.histogram}`, color:'var(--text2)' },
            { label:'BB Upper', value: indicators.bb?.upper,     note: 'Bollinger Band', color:'var(--text2)' },
            { label:'BB Lower', value: indicators.bb?.lower,     note: `Width: ${indicators.bb?.width}%`, color:'var(--text2)' },
            { label:'Price',    value: `$${fmtPrice(indicators.last)}`, note: indicators.action, color: indicators.action==='BUY'?'var(--green)':indicators.action==='SELL'?'var(--red)':'var(--amber)' },
          ].map(row => (
            <div key={row.label} style={S.indRow}>
              <span style={S.indLabel}>{row.label}</span>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--font-data)',fontSize:11,color:row.color,fontWeight:600}}>{row.value}</div>
                <div style={{fontFamily:'var(--font-data)',fontSize:9,color:'var(--text3)',marginTop:1}}>{row.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr style={S.divider}/>

      {/* Analysis result */}
      <div style={S.analysisBody}>
        {!analysis && !loading && !error && (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>🤖</div>
            <div style={S.emptyTitle}>Ready to Analyze</div>
            <div style={S.emptySub}>Click <strong style={{color:'var(--gold)'}}>⚡ Analyze</strong> to get an AI-powered technical breakdown of the current chart with trend, momentum and key levels.</div>
          </div>
        )}

        {loading && (
          <div style={S.emptyState}>
            <div style={{fontSize:32,animation:'spin 1s linear infinite'}}>⟳</div>
            <div style={S.emptyTitle}>Analyzing Chart…</div>
            <div style={S.emptySub}>Gemini is reading RSI, MACD, Bollinger Bands and price action.</div>
          </div>
        )}

        {error && !loading && (
          <div style={S.errorBox}>
            <span style={{fontSize:16}}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {analysis && !loading && (
          <div style={S.analysisText} dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }} />
        )}
      </div>

      {/* Disclaimer */}
      <div style={S.disclaimer}>
        ⚠️ For educational purposes only — not financial advice
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChartPanel({ initialSymbol='BTC' }) {
  const [symbol, setSymbol]     = useState(initialSymbol)
  const [inputSym, setInputSym] = useState(initialSymbol)
  const priceRef = useRef(null), volRef = useRef(null)
  const viewRef  = useRef({ offset:0, candleW:8 })
  const dragRef  = useRef({ active:false, startX:0, startOffset:0 })
  const crossRef = useRef({ x:null, y:null })

  const { klines, livePrice, indicators, loading, error, interval, setInterval:setIv } = useChart(symbol)

  useEffect(() => {
    if (!klines.length||!priceRef.current) return
    const W=priceRef.current.offsetWidth, chartW=W-PAD.left-PAD.right
    const barSpace=viewRef.current.candleW+2
    viewRef.current.offset=Math.min(0,chartW-klines.length*barSpace-barSpace*2)
    drawChart(priceRef.current,volRef.current,klines,viewRef.current,crossRef.current)
  },[klines])

  useEffect(()=>{
    const h=()=>drawChart(priceRef.current,volRef.current,klines,viewRef.current,crossRef.current)
    window.addEventListener('resize',h); return ()=>window.removeEventListener('resize',h)
  },[klines])

  useEffect(()=>{ setSymbol(initialSymbol); setInputSym(initialSymbol) },[initialSymbol])

  const onMouseDown=useCallback(e=>{
    dragRef.current={active:true,startX:e.clientX,startOffset:viewRef.current.offset}; e.preventDefault()
  },[])

  const onMouseMove=useCallback(e=>{
    const canvas=priceRef.current; if(!canvas||!klines.length) return
    const rect=canvas.getBoundingClientRect(), mx=e.clientX-rect.left, my=e.clientY-rect.top
    crossRef.current={x:mx,y:my}
    if (dragRef.current.active) {
      const dx=e.clientX-dragRef.current.startX, newOffset=dragRef.current.startOffset+dx
      const barSpace=viewRef.current.candleW+2, totalW=klines.length*barSpace
      const chartW=canvas.offsetWidth-PAD.left-PAD.right
      const minOff=Math.min(0,chartW-totalW-barSpace)
      viewRef.current.offset=Math.max(minOff,Math.min(barSpace*3,newOffset))
    }
    drawChart(canvas,volRef.current,klines,viewRef.current,crossRef.current)
  },[klines])

  const onMouseUp=useCallback(()=>{ dragRef.current.active=false },[])
  const onMouseLeave=useCallback(()=>{
    dragRef.current.active=false; crossRef.current={x:null,y:null}
    drawChart(priceRef.current,volRef.current,klines,viewRef.current,crossRef.current)
  },[klines])

  const onWheel=useCallback(e=>{
    e.preventDefault()
    const canvas=priceRef.current; if(!canvas||!klines.length) return
    const rect=canvas.getBoundingClientRect(), mx=e.clientX-rect.left
    const oldW=viewRef.current.candleW, newW=Math.max(3,Math.min(40,oldW+(e.deltaY>0?-1:1)*(oldW>15?2:1)))
    if(newW===oldW) return
    const oldBar=oldW+2, newBar=newW+2
    viewRef.current.offset=mx-PAD.left-(mx-PAD.left-viewRef.current.offset)*(newBar/oldBar)
    viewRef.current.candleW=newW
    const totalW=klines.length*newBar, chartW=canvas.offsetWidth-PAD.left-PAD.right
    viewRef.current.offset=Math.max(Math.min(0,chartW-totalW-newBar),Math.min(newBar*3,viewRef.current.offset))
    drawChart(canvas,volRef.current,klines,viewRef.current,crossRef.current)
  },[klines])

  useEffect(()=>{
    const el=priceRef.current; if(!el) return
    el.addEventListener('wheel',onWheel,{passive:false})
    return ()=>el.removeEventListener('wheel',onWheel)
  },[onWheel])

  const rsiStatus  = indicators?.rsi<35?'bull':indicators?.rsi>65?'bear':'neutral'
  const macdStatus = indicators?.macd?.bullish?'bull':'bear'

  return (
    <div style={S.wrap}>
      {/* Top bar */}
      <div style={S.topbar}>
        <div style={S.symSearch}>
          <input style={S.symInput} value={inputSym}
            onChange={e=>setInputSym(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==='Enter'&&inputSym.trim()&&setSymbol(inputSym.trim())}
            placeholder="Symbol…" maxLength={10}/>
          <button style={S.symBtn} onClick={()=>inputSym.trim()&&setSymbol(inputSym.trim())}>GO</button>
        </div>
        <div style={S.quickCoins}>
          {POPULAR.map(s=>(
            <button key={s} style={{...S.coinPill,...(symbol===s?S.coinActive:{})}}
              onClick={()=>{setSymbol(s);setInputSym(s)}}>{s}</button>
          ))}
        </div>
        <div style={S.intervals}>
          {INTERVALS.map(iv=>(
            <button key={iv.value} style={{...S.ivBtn,...(interval===iv.value?S.ivActive:{})}}
              onClick={()=>setIv(iv.value)}>{iv.label}</button>
          ))}
        </div>
      </div>

      {/* Price row */}
      <div style={S.priceRow}>
        <div style={{display:'flex',alignItems:'baseline',gap:10}}>
          <span style={S.symLabel}>{symbol}<span style={S.usdtLabel}>/USDT</span></span>
          <span style={S.price} className="mono">
            {livePrice!=null?(livePrice>=1?`$${livePrice.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4})}`:
            `$${livePrice.toFixed(6)}`):'—'}
          </span>
        </div>
        <div style={S.badges}>
          {indicators&&<>
            <Badge label="RSI"      value={indicators.rsi}                                 status={rsiStatus}/>
            <Badge label="MACD"     value={indicators.macd?.bullish?'Bullish':'Bearish'}   status={macdStatus}/>
            <Badge label="BB WIDTH" value={`${indicators.bb?.width}%`}                     status={indicators.bb?.width<3?'neutral':'bull'}/>
            <div style={{...S.signal,
              background:indicators.action==='BUY'?'var(--green-dim)':indicators.action==='SELL'?'var(--red-dim)':'var(--amber-dim)',
              color:indicators.action==='BUY'?'var(--green)':indicators.action==='SELL'?'var(--red)':'var(--amber)',
              border:`1px solid ${indicators.action==='BUY'?'rgba(0,230,118,0.3)':indicators.action==='SELL'?'rgba(255,69,96,0.3)':'rgba(255,171,0,0.3)'}`,
            }}>{indicators.action}</div>
          </>}
        </div>
        <div style={S.hint}><span>🖱 Drag</span><span>⚲ Zoom</span></div>
      </div>

      {/* Body: chart + AI panel */}
      <div style={S.body}>
        {/* Chart */}
        <div style={S.chartArea}>
          <div style={S.legend}>
            <span style={{color:'rgba(245,200,66,0.85)',fontFamily:'var(--font-data)',fontSize:10}}>— EMA20</span>
            <span style={{color:'rgba(61,142,245,0.85)',fontFamily:'var(--font-data)',fontSize:10}}>— EMA50</span>
          </div>
          {loading
            ? <div style={S.loader}><span style={S.loaderDot}/>Loading 6 months of data…</div>
            : error
            ? <div style={S.loader}>⚠️ {error}</div>
            : <>
                <canvas ref={priceRef}
                  style={{width:'100%',flex:1,display:'block',cursor:'crosshair',minHeight:0}}
                  onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}/>
                <div style={S.volDivider}><span style={S.volLabel}>VOLUME</span></div>
                <canvas ref={volRef} style={{width:'100%',height:VOL_HEIGHT,display:'block',flexShrink:0}}/>
              </>
          }
        </div>

        {/* AI Analysis panel */}
        <AIPanel symbol={symbol} interval={interval} indicators={indicators} />
      </div>
    </div>
  )
}

const S = {
  wrap:      {display:'flex',flexDirection:'column',height:'100%',animation:'fadeUp 0.3s ease'},
  topbar:    {display:'flex',alignItems:'center',gap:10,padding:'10px 20px',borderBottom:'1px solid var(--border)',flexShrink:0,flexWrap:'wrap',background:'rgba(7,8,14,0.4)'},
  symSearch: {display:'flex',gap:4},
  symInput:  {width:85,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:7,color:'var(--text)',fontFamily:'var(--font-data)',fontSize:12,padding:'6px 10px',outline:'none',textTransform:'uppercase'},
  symBtn:    {background:'var(--gold-dim)',border:'1px solid rgba(245,200,66,0.3)',color:'var(--gold)',fontFamily:'var(--font-data)',fontSize:10,padding:'6px 12px',borderRadius:7,cursor:'pointer',fontWeight:700,letterSpacing:1},
  quickCoins:{display:'flex',gap:4,flexWrap:'wrap'},
  coinPill:  {background:'transparent',border:'1px solid var(--border)',color:'var(--text3)',fontFamily:'var(--font-data)',fontSize:10,padding:'4px 9px',borderRadius:20,cursor:'pointer',transition:'all 0.15s'},
  coinActive:{background:'var(--gold-dim)',borderColor:'rgba(245,200,66,0.35)',color:'var(--gold)'},
  intervals: {display:'flex',gap:4,marginLeft:'auto'},
  ivBtn:     {background:'transparent',border:'1px solid var(--border)',color:'var(--text3)',fontFamily:'var(--font-data)',fontSize:10,padding:'4px 10px',borderRadius:6,cursor:'pointer',transition:'all 0.15s'},
  ivActive:  {background:'var(--surface2)',borderColor:'var(--border2)',color:'var(--gold)'},
  priceRow:  {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 20px',borderBottom:'1px solid var(--border)',flexShrink:0,flexWrap:'wrap',gap:10},
  symLabel:  {fontSize:16,fontWeight:700,color:'var(--text)',fontFamily:'var(--font-hero)',letterSpacing:1},
  usdtLabel: {fontSize:12,color:'var(--text3)',fontFamily:'var(--font-data)'},
  price:     {fontSize:26,fontWeight:700,letterSpacing:-1,color:'var(--gold)',textShadow:'0 0 20px rgba(245,200,66,0.3)'},
  badges:    {display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'},
  badge:     {display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 11px',borderRadius:8,border:'1px solid',gap:2,minWidth:64},
  signal:    {fontFamily:'var(--font-data)',fontSize:11,fontWeight:700,padding:'5px 16px',borderRadius:20,letterSpacing:1.5},
  hint:      {display:'flex',gap:10,fontSize:10,color:'var(--text3)',fontFamily:'var(--font-data)'},
  body:      {flex:1,display:'flex',overflow:'hidden',minHeight:0},
  chartArea: {flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden',minWidth:0},
  legend:    {position:'absolute',top:10,left:14,zIndex:2,display:'flex',gap:14,pointerEvents:'none'},
  loader:    {position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-data)',fontSize:12,color:'var(--text3)',gap:8},
  loaderDot: {display:'inline-block',width:6,height:6,background:'var(--gold)',borderRadius:'50%',animation:'blink 1s infinite'},
  volDivider:{height:22,background:'var(--surface)',borderTop:'1px solid var(--border)',borderBottom:'1px solid rgba(30,35,55,0.6)',display:'flex',alignItems:'center',paddingLeft:14,flexShrink:0},
  volLabel:  {fontFamily:'var(--font-data)',fontSize:8,color:'var(--text3)',letterSpacing:3},

  // AI Panel
  aiPanel:   {width:320,borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0,background:'var(--panel)'},
  aiHeader:  {display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'16px 16px 12px',flexShrink:0},
  aiTitle:   {fontFamily:'var(--font-hero)',fontSize:14,letterSpacing:3,color:'var(--gold)'},
  aiSub:     {fontFamily:'var(--font-data)',fontSize:9,color:'var(--text3)',marginTop:3,letterSpacing:1},
  analyzeBtn:{
    display:'flex',alignItems:'center',gap:6,
    background:'var(--gold-dim)',border:'1px solid rgba(245,200,66,0.35)',
    color:'var(--gold)',fontFamily:'var(--font-data)',fontSize:10,fontWeight:700,
    padding:'7px 14px',borderRadius:8,cursor:'pointer',letterSpacing:0.5,
    transition:'opacity 0.2s',flexShrink:0,whiteSpace:'nowrap',
  },
  spinner:   {display:'inline-block',animation:'spin 0.8s linear infinite'},
  divider:   {height:1,background:'var(--border)',border:'none',margin:'0',flexShrink:0},
  indGrid:   {display:'flex',flexDirection:'column',gap:0,padding:'8px 0',flexShrink:0},
  indRow:    {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 16px',borderBottom:'1px solid rgba(30,35,55,0.5)'},
  indLabel:  {fontFamily:'var(--font-data)',fontSize:9,color:'var(--text3)',letterSpacing:1},
  analysisBody:{flex:1,overflowY:'auto',padding:16},
  emptyState:{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',textAlign:'center',gap:10,padding:'0 20px'},
  emptyIcon: {fontSize:36},
  emptyTitle:{fontFamily:'var(--font-hero)',fontSize:16,letterSpacing:2,color:'var(--gold)',marginTop:4},
  emptySub:  {fontSize:12,color:'var(--text3)',lineHeight:1.6},
  errorBox:  {display:'flex',alignItems:'center',gap:10,padding:12,background:'var(--red-dim)',border:'1px solid rgba(255,69,96,0.25)',borderRadius:8,fontSize:12,color:'var(--red)'},
  analysisText:{fontSize:12.5,lineHeight:1.75,color:'var(--text)',fontFamily:'var(--font-ui)'},
  disclaimer:{padding:'10px 16px',fontSize:9,color:'var(--text3)',fontFamily:'var(--font-data)',letterSpacing:0.5,borderTop:'1px solid var(--border)',flexShrink:0,textAlign:'center'},
}
