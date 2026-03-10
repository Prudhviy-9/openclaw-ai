// src/components/Sidebar.jsx — Learn tab removed
const ITEMS = [
  { icon: '📡', label: 'Live',    sublabel: 'Trending'  },
  { icon: '📊', label: 'Chart',   sublabel: 'Analysis'  },
  { icon: '🔔', label: 'Alerts',  sublabel: 'Signals'   },
]

export default function Sidebar({ active, onNav }) {
  return (
    <nav style={S.sidebar}>
      {/* Logo */}
      <div style={S.logoWrap}>
        <div style={S.lobsterWrap}>
          <span style={S.lobster}>🦞</span>
          <div style={S.logoGlow} />
        </div>
        <div style={S.logoText}>
          <span style={S.logoMain}>OPEN</span>
          <span style={S.logoClaw}>CLAW</span>
        </div>
        <div style={S.logoBadge}>AI</div>
      </div>

      <div style={S.divider} />

      {/* Nav items */}
      <div style={S.navItems}>
        {ITEMS.map((item, i) => (
          <button
            key={item.label}
            style={{ ...S.btn, ...(active === i ? S.btnActive : {}) }}
            onClick={() => onNav(i)}
            title={item.sublabel}
          >
            {active === i && <span style={S.activePip} />}
            <span style={S.btnIcon}>{item.icon}</span>
            <span style={{ ...S.btnLabel, ...(active === i ? S.btnLabelActive : {}) }}>
              {item.label}
            </span>
            <span style={S.btnSub}>{item.sublabel}</span>
          </button>
        ))}
      </div>

      {/* Bottom badge */}
      <div style={S.bottom}>
        <div style={S.poweredBy}>
          <span style={S.poweredDot} />
          <span style={S.poweredText}>LIVE</span>
        </div>
        <div style={S.binanceBadge}>
          <span style={S.binanceText}>BNB</span>
          <span style={S.binanceChain}>CHAIN</span>
        </div>
      </div>
    </nav>
  )
}

const S = {
  sidebar: {
    width: 76,
    background: 'linear-gradient(180deg, #0b0d16 0%, #08090f 100%)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '16px 0 20px',
    flexShrink: 0,
    position: 'relative',
  },
  logoWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    marginBottom: 2,
  },
  lobsterWrap: { position: 'relative' },
  lobster: {
    fontSize: 30,
    filter: 'drop-shadow(0 0 12px rgba(245,200,66,0.6))',
    display: 'block',
  },
  logoGlow: {
    position: 'absolute', bottom: -4, left: '50%',
    transform: 'translateX(-50%)',
    width: 30, height: 8,
    background: 'rgba(245,200,66,0.3)',
    borderRadius: '50%',
    filter: 'blur(6px)',
  },
  logoText: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: 4 },
  logoMain: { fontFamily: 'var(--font-hero)', fontSize: 13, letterSpacing: 4, color: 'var(--text2)', lineHeight: 1 },
  logoClaw: { fontFamily: 'var(--font-hero)', fontSize: 13, letterSpacing: 4, color: 'var(--gold)', lineHeight: 1 },
  logoBadge: {
    fontFamily: 'var(--font-data)', fontSize: 7, letterSpacing: 2,
    color: '#000', background: 'var(--gold)',
    padding: '1px 5px', borderRadius: 3, marginTop: 3,
    fontWeight: 700,
  },
  divider: {
    width: 36, height: 1,
    background: 'linear-gradient(90deg, transparent, var(--border2), transparent)',
    margin: '12px 0',
  },
  navItems: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', gap: 2 },
  btn: {
    width: '100%', padding: '10px 0',
    border: 'none', background: 'transparent',
    cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    transition: 'all 0.2s',
    position: 'relative',
    color: 'var(--text3)',
    borderRadius: 0,
  },
  btnActive: {
    background: 'linear-gradient(90deg, rgba(245,200,66,0.06), transparent)',
    color: 'var(--gold)',
  },
  activePip: {
    position: 'absolute', left: 0, top: '50%',
    transform: 'translateY(-50%)',
    width: 3, height: 24,
    background: 'var(--gold)',
    borderRadius: '0 3px 3px 0',
    boxShadow: '0 0 10px var(--gold-glow)',
  },
  btnIcon:  { fontSize: 18, transition: 'transform 0.2s' },
  btnLabel: {
    fontFamily: 'var(--font-data)', fontSize: 8,
    letterSpacing: 1.5, fontWeight: 700,
    transition: 'color 0.2s',
    color: 'var(--text3)',
  },
  btnLabelActive: { color: 'var(--gold)' },
  btnSub: {
    fontFamily: 'var(--font-ui)', fontSize: 7,
    color: 'var(--text3)', opacity: 0.6, letterSpacing: 0.5,
  },
  bottom: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    marginTop: 'auto',
  },
  poweredBy: { display: 'flex', alignItems: 'center', gap: 4 },
  poweredDot: {
    width: 5, height: 5, borderRadius: '50%',
    background: 'var(--green)',
    boxShadow: '0 0 6px var(--green)',
    animation: 'blink 2s infinite',
  },
  poweredText: {
    fontFamily: 'var(--font-data)', fontSize: 7,
    letterSpacing: 2, color: 'var(--green)', opacity: 0.8,
  },
  binanceBadge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: 'var(--gold-dim)', border: '1px solid rgba(245,200,66,0.2)',
    borderRadius: 6, padding: '4px 8px',
  },
  binanceText:  { fontFamily: 'var(--font-hero)', fontSize: 11, color: 'var(--gold)', letterSpacing: 1, lineHeight: 1 },
  binanceChain: { fontFamily: 'var(--font-data)', fontSize: 6, color: 'var(--gold)', opacity: 0.6, letterSpacing: 2 },
}
