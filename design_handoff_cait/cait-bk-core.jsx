// cait-bk-core.jsx
// Palette, Phone shell, TabBar, shared UI atoms — exported to window.CaitBK

const F = '"Outfit", system-ui, sans-serif';

const M = {
  bg:        '#f7f4f0',
  card:      '#ffffff',
  ink:       '#2d2420',
  ink2:      '#7a6355',
  muted:     '#b8a89a',
  rule:      '#e0d4c8',
  tint:      '#e8ddd5',
  cait:      '#9b7e6a',
  caitBg:    '#e8ddd5',
  caitLight: '#c4a898',
  heroBg:    '#2d2420',
  warmBg:    '#f2ebe0', // canvas background
};

const PW = 340, PH = 720;

function Phone({ children, bgOverride, tone = 'dark' }) {
  const c = tone === 'light' ? 'rgba(255,255,255,0.88)' : 'rgba(45,36,32,0.82)';
  return (
    <div style={{ width: PW+12, height: PH+12, borderRadius: 46, padding: 6, background: '#18100a', boxShadow: '0 32px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04)' }}>
      <div style={{ width: PW, height: PH, borderRadius: 40, overflow: 'hidden', background: bgOverride || M.bg, position: 'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:40, zIndex:30, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 22px 0', pointerEvents:'none' }}>
          <span style={{ fontFamily:'-apple-system,system-ui', fontWeight:600, fontSize:13, color:c }}>9:41</span>
          <div style={{ position:'absolute', left:'50%', top:7, transform:'translateX(-50%)', width:94, height:26, borderRadius:15, background:'#000' }} />
          <div style={{ display:'flex', gap:5 }}>
            <svg width="14" height="9" viewBox="0 0 14 9"><rect x="0" y="5" width="2" height="4" rx="0.5" fill={c}/><rect x="3.5" y="3.5" width="2" height="5.5" rx="0.5" fill={c}/><rect x="7" y="2" width="2" height="7" rx="0.5" fill={c}/><rect x="10.5" y="0" width="2" height="9" rx="0.5" fill={c}/></svg>
            <svg width="20" height="9" viewBox="0 0 20 9"><rect x="0.5" y="0.5" width="16" height="8" rx="2" stroke={c} strokeOpacity="0.35" fill="none"/><rect x="2" y="2" width="13" height="5" rx="0.8" fill={c}/></svg>
          </div>
        </div>
        <div style={{ position:'absolute', inset:0 }}>{children}</div>
        <div style={{ position:'absolute', bottom:7, left:'50%', transform:'translateX(-50%)', width:108, height:4, borderRadius:2, background:c, opacity:0.45 }} />
      </div>
    </div>
  );
}

function TabBar({ active }) {
  const items = [
    { id:'home', l:'today', g:'🏠' },
    { id:'txn',  l:'spend', g:'💸' },
    { id:'ask',  l:'ask',   g:'✨' },
    { id:'me',   l:'you',   g:'👤' },
  ];
  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:74, background:`${M.bg}F8`, borderTop:`1px solid ${M.rule}`, backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'space-around', paddingBottom:14, paddingTop:6, zIndex:20 }}>
      {items.map(({ id, l, g }) => {
        const on = id === active;
        return (
          <div key={id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, color:on?M.ink:M.muted }}>
            <div style={{ width:42, height:28, borderRadius:14, background:on?M.tint:'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:on?16:15 }}>{g}</div>
            <span style={{ fontFamily:F, fontSize:10.5, fontWeight:on?700:500 }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
}

// CaitAvatar — the C circle used throughout
function CaitAvatar({ size = 34 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:M.cait, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F, fontWeight:800, fontSize:size*0.44, flexShrink:0 }}>C</div>
  );
}

// AskTopBar — shared chrome for Ask Cait response screens
function AskTopBar({ tone = 'dark' }) {
  const color = tone === 'light' ? M.caitLight : 'rgba(255,255,255,0.48)';
  const btnBg  = tone === 'light' ? M.tint : 'rgba(255,255,255,0.07)';
  const btnC   = tone === 'light' ? M.ink2 : 'rgba(255,255,255,0.7)';
  return (
    <div style={{ padding:'6px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style={{ width:36, height:36, borderRadius:18, background:btnBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:btnC }}>←</div>
      <span style={{ fontFamily:F, fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color }}>cait · just now</span>
      <div style={{ width:36, height:36, borderRadius:18, background:btnBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:btnC }}>×</div>
    </div>
  );
}

// AskInput — shared input bar at bottom of Ask screens
function AskInput({ tone = 'dark' }) {
  const bg  = tone === 'light' ? M.card  : 'rgba(255,255,255,0.07)';
  const bdr = tone === 'light' ? `1px solid ${M.rule}` : '1px solid rgba(255,255,255,0.1)';
  const ph  = tone === 'light' ? M.muted : 'rgba(255,255,255,0.38)';
  const arrowBg  = tone === 'light' ? M.ink : M.cait;
  const arrowFg  = '#fff';
  return (
    <div style={{ paddingBottom:22, paddingLeft:20, paddingRight:20 }}>
      <div style={{ height:48, borderRadius:24, background:bg, border:bdr, display:'flex', alignItems:'center', padding:'0 5px 0 16px', gap:10 }}>
        <span style={{ flex:1, fontFamily:F, fontSize:14, color:ph, fontWeight:500 }}>ask another…</span>
        <div style={{ width:38, height:38, borderRadius:19, background:arrowBg, color:arrowFg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>→</div>
      </div>
    </div>
  );
}

window.CaitBK = { F, M, PW, PH, Phone, TabBar, CaitAvatar, AskTopBar, AskInput };
