// cait-bk-screens.jsx
// Onboarding + main app screens (excluding Ask Cait responses)

const { F, M, Phone, TabBar, CaitAvatar } = window.CaitBK;

// ─── ONBOARDING ───────────────────────────────────────────────

// ─── SPLASH / LAUNCH ──────────────────────────────────────────

function Splash() {
  return (
    <Phone bgOverride={M.heroBg} tone="light">
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:F }}>

        {/* logo mark */}
        <div style={{ width:72, height:72, borderRadius:36, background:M.ink, border:`2px solid rgba(255,255,255,0.08)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:36, height:36, borderRadius:18, background:M.cait }} />
        </div>

        {/* wordmark */}
        <div style={{ fontWeight:900, fontSize:56, letterSpacing:-2.5, color:'#fff', lineHeight:1, marginTop:18 }}>Cait</div>

        {/* acronym */}
        <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
          {[['C','can I'],['A','afford'],['IT','it']].map(([l, w], i) => (
            <div key={l} style={{ display:'flex', alignItems:'baseline', gap:3 }}>
              <span style={{ fontSize:11, fontWeight:800, color:'#fff', letterSpacing:0.2 }}>{l}</span>
              <span style={{ fontSize:11, fontWeight:500, color:M.caitLight, letterSpacing:0.2 }}>{w}</span>
              {i < 2 && <span style={{ fontSize:11, color:'rgba(255,255,255,0.18)', marginLeft:7 }}>·</span>}
            </div>
          ))}
        </div>

        {/* tagline */}
        <div style={{ marginTop:28, fontSize:13, color:'rgba(255,255,255,0.38)', fontWeight:600, letterSpacing:0.2 }}>
          your money. no drama.
        </div>

        {/* loading dots */}
        <div style={{ position:'absolute', bottom:56, display:'flex', gap:7 }}>
          {[1,2,3].map((_, i) => (
            <div key={i} style={{ width:6, height:6, borderRadius:3, background: i === 1 ? M.cait : 'rgba(255,255,255,0.18)' }} />
          ))}
        </div>

      </div>
    </Phone>
  );
}

function Welcome() {
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink, background:M.bg }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 28px 0' }}>
          <div style={{ fontSize:64, marginBottom:8 }}>👋</div>
          <div style={{ fontWeight:900, fontSize:52, lineHeight:0.95, letterSpacing:-2, marginTop:8 }}>hi,<br/>I'm Cait.</div>
          <div style={{ marginTop:18, fontSize:16, lineHeight:1.55, color:M.ink2, fontWeight:500, maxWidth:270 }}>
            I watch your money so you don't have to — and answer the questions you actually have.
          </div>
        </div>
        <div style={{ padding:'0 20px 44px', display:'flex', flexDirection:'column', gap:12 }}>
          <button style={{ height:54, borderRadius:27, background:M.ink, color:M.bg, border:'none', fontFamily:F, fontWeight:800, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            get started →
          </button>
          <div style={{ textAlign:'center', fontSize:13.5, color:M.muted, fontWeight:500 }}>
            already got an account?{' '}
            <span style={{ color:M.ink, fontWeight:700, textDecoration:'underline', textUnderlineOffset:3 }}>sign in</span>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function SignIn() {
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'20px 22px 0' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>welcome back</div>
          <div style={{ fontWeight:900, fontSize:34, lineHeight:1, letterSpacing:-1.2, marginTop:8 }}>good to<br/>see you. 👋</div>
        </div>
        <div style={{ padding:'28px 22px 0', display:'flex', flexDirection:'column', gap:14, flex:1 }}>
          {[
            { label:'email address', ph:'aanya@warwick.ac.uk', type:'email' },
            { label:'password',      ph:'••••••••',            type:'password' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.4, textTransform:'uppercase', color:M.muted, marginBottom:7 }}>{f.label}</div>
              <div style={{ height:50, background:M.card, border:`1.5px solid ${M.rule}`, borderRadius:14, display:'flex', alignItems:'center', padding:'0 16px' }}>
                <span style={{ fontFamily:F, fontSize:15, color:M.muted, fontWeight:500 }}>{f.ph}</span>
              </div>
            </div>
          ))}
          <div style={{ textAlign:'right', marginTop:-4 }}>
            <span style={{ fontSize:12.5, fontWeight:700, color:M.ink2, textDecoration:'underline', textUnderlineOffset:3 }}>forgot password?</span>
          </div>
        </div>
        <div style={{ padding:'0 22px 40px' }}>
          <button style={{ width:'100%', height:54, borderRadius:27, background:M.ink, color:M.bg, border:'none', fontFamily:F, fontWeight:800, fontSize:16 }}>
            sign in →
          </button>
          <div style={{ textAlign:'center', marginTop:14, fontSize:13, color:M.muted, fontWeight:500 }}>
            no account yet?{' '}
            <span style={{ color:M.ink, fontWeight:700, textDecoration:'underline', textUnderlineOffset:3 }}>get started</span>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function SignUp() {
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'20px 22px 0' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>step 1 of 3</div>
          <div style={{ fontWeight:900, fontSize:34, lineHeight:1, letterSpacing:-1.2, marginTop:8 }}>create<br/>your account.</div>
        </div>
        <div style={{ padding:'28px 22px 0', display:'flex', flexDirection:'column', gap:14, flex:1 }}>
          {[
            { label:'your name',     ph:'Aanya Sharma',           type:'text' },
            { label:'email address', ph:'aanya@warwick.ac.uk',    type:'email' },
            { label:'password',      ph:'at least 8 characters',  type:'password' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.4, textTransform:'uppercase', color:M.muted, marginBottom:7 }}>{f.label}</div>
              <div style={{ height:50, background:M.card, border:`1.5px solid ${M.rule}`, borderRadius:14, display:'flex', alignItems:'center', padding:'0 16px' }}>
                <span style={{ fontFamily:F, fontSize:15, color:M.muted, fontWeight:500 }}>{f.ph}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'0 22px 40px' }}>
          <button style={{ width:'100%', height:54, borderRadius:27, background:M.ink, color:M.bg, border:'none', fontFamily:F, fontWeight:800, fontSize:16 }}>
            continue →
          </button>
          <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:M.muted, lineHeight:1.5 }}>
            by signing up you agree to our{' '}
            <span style={{ color:M.ink, fontWeight:600, textDecoration:'underline', textUnderlineOffset:2 }}>privacy policy</span>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function ConnectBank() {
  const banks = [
    { n:'Monzo',    g:'M', c:'#FF4F40' },
    { n:'Starling', g:'S', c:'#7935D2' },
    { n:'Barclays', g:'B', c:'#1E88E5' },
    { n:'Lloyds',   g:'L', c:'#024F36' },
    { n:'HSBC',     g:'H', c:'#DB0011' },
    { n:'NatWest',  g:'N', c:'#5A287D' },
    { n:'Revolut',  g:'R', c:'#0066FF' },
    { n:'Chase',    g:'C', c:'#1B45A8' },
  ];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'20px 22px 0' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>step 3 of 3</div>
          <div style={{ fontWeight:900, fontSize:32, lineHeight:1.05, letterSpacing:-1, marginTop:8 }}>connect<br/>your bank.</div>
          <div style={{ marginTop:8, fontSize:13.5, color:M.ink2, lineHeight:1.45, fontWeight:500 }}>
            powered by <b style={{ fontWeight:700 }}>Plaid</b>. read-only — we can never move your money.
          </div>
        </div>
        <div style={{ padding:'14px 22px 0' }}>
          <div style={{ height:42, background:M.card, border:`1px solid ${M.rule}`, borderRadius:21, display:'flex', alignItems:'center', gap:8, padding:'0 14px', color:M.muted, fontSize:13 }}>
            🔍 search 50+ UK banks
          </div>
        </div>
        <div style={{ padding:'14px 22px 0', flex:1, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {banks.map(b => (
              <div key={b.n} style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:14, padding:'11px 13px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:b.c, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14 }}>{b.g}</div>
                <span style={{ fontSize:13, fontWeight:700, color:M.ink }}>{b.n}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'12px 22px 28px', display:'flex', alignItems:'flex-start', gap:10 }}>
          <span style={{ fontSize:16, flexShrink:0 }}>🔒</span>
          <div style={{ fontSize:12, color:M.muted, lineHeight:1.45, fontWeight:500 }}>
            bank-grade encryption. your credentials never touch our servers. ever.
          </div>
        </div>
      </div>
    </Phone>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────

function HomeHidden() {
  const qs = [
    { q:'can I go out tonight?',       a:'yes! 🍻',         bg:M.ink,  fg:'#fff' },
    { q:'will I make end of term?',     a:'looking good 📅', bg:M.cait, fg:'#fff' },
    { q:'how am I vs last week?',       a:'↓ 18% 📉',        bg:M.tint, fg:M.ink },
    { q:'anything I should know?',      a:'nope ✨',          bg:M.card, fg:M.ink2, border:M.rule },
  ];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'10px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, letterSpacing:-0.5 }}>hi Aanya 👋</div>
            <div style={{ fontSize:11, color:M.muted, fontWeight:600, marginTop:1 }}>wed · week 3 of term</div>
          </div>
          <CaitAvatar size={34} />
        </div>
        <div style={{ padding:'16px 20px 0', flex:1, overflow:'hidden' }}>
          <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:9 }}>your week so far</div>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {qs.map(it => (
              <div key={it.q} style={{ background:it.bg, borderRadius:16, padding:'13px 15px', display:'flex', alignItems:'center', gap:12, border:it.border?`1px solid ${it.border}`:'none' }}>
                <div style={{ flex:1, fontSize:13.5, fontWeight:600, color:it.fg, lineHeight:1.3 }}>{it.q}</div>
                <div style={{ fontSize:14, fontWeight:800, color:it.fg, whiteSpace:'nowrap' }}>{it.a}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'14px 20px 0' }}>
          <div style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:999, padding:'11px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontWeight:800, fontSize:16, letterSpacing:4, color:M.muted }}>✦ ✦ ✦</span>
              <span style={{ fontSize:12, color:M.muted, fontWeight:600 }}>show me the number</span>
            </div>
            <span style={{ fontSize:17 }}>👁</span>
          </div>
        </div>
        <TabBar active="home" />
      </div>
    </Phone>
  );
}

function HomeRevealed() {
  const qs = [
    { q:'can I go out tonight?',       a:'yes! 🍻',         bg:M.ink,  fg:'#fff' },
    { q:'will I make end of term?',     a:'looking good 📅', bg:M.cait, fg:'#fff' },
    { q:'how am I vs last week?',       a:'↓ 18% 📉',        bg:M.tint, fg:M.ink },
    { q:'anything I should know?',      a:'nope ✨',          bg:M.card, fg:M.ink2, border:M.rule },
  ];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'10px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, letterSpacing:-0.5 }}>hi Aanya 👋</div>
            <div style={{ fontSize:11, color:M.muted, fontWeight:600, marginTop:1 }}>wed · week 3 of term</div>
          </div>
          <CaitAvatar size={34} />
        </div>
        <div style={{ padding:'16px 20px 0', flex:1, overflow:'hidden' }}>
          <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:9 }}>your week so far</div>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {qs.map(it => (
              <div key={it.q} style={{ background:it.bg, borderRadius:16, padding:'13px 15px', display:'flex', alignItems:'center', gap:12, border:it.border?`1px solid ${it.border}`:'none' }}>
                <div style={{ flex:1, fontSize:13.5, fontWeight:600, color:it.fg, lineHeight:1.3 }}>{it.q}</div>
                <div style={{ fontSize:14, fontWeight:800, color:it.fg, whiteSpace:'nowrap' }}>{it.a}</div>
              </div>
            ))}
          </div>
        </div>
        {/* REVEALED balance */}
        <div style={{ padding:'14px 20px 0' }}>
          <div style={{ background:M.ink, borderRadius:18, padding:'14px 18px' }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.caitLight, marginBottom:4 }}>left this week</div>
                <div style={{ fontWeight:900, fontSize:42, color:'#fff', letterSpacing:-2, lineHeight:1 }}>
                  £47<span style={{ fontSize:24, color:M.caitLight }}>.20</span>
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:3 }}>of £165 · resets sunday</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.caitLight }}>hide</div>
                <div style={{ fontSize:18, opacity:0.7 }}>👁</div>
              </div>
            </div>
          </div>
        </div>
        <TabBar active="home" />
      </div>
    </Phone>
  );
}

function Transactions() {
  // category → icon style (strictly in-palette)
  const cats = {
    'eating out':    { bg: M.cait,  fg: '#fff'      },
    'groceries':     { bg: M.ink,   fg: M.caitLight  },
    'transport':     { bg: M.ink2,  fg: '#fff'       },
    'subscriptions': { bg: M.tint,  fg: M.ink2       },
  };
  const days = [
    { label:'today · wed 18', total:'£14.20', txns:[
      { m:'Pret a Manger', c:'eating out',             cat:'eating out',    a:'−£4.85' },
      { m:'Tesco Express', c:'groceries',              cat:'groceries',     a:'−£9.35' },
    ]},
    { label:'tue 17 mar', total:'£41.00', txns:[
      { m:'The Eagle',     c:'eating out · pub night', cat:'eating out',    a:'−£41.00' },
    ]},
    { label:'mon 16 mar', total:'£27.29', txns:[
      { m:'TfL Travel',  c:'transport',     cat:'transport',     a:'−£8.30'  },
      { m:"Sainsbury's", c:'groceries',     cat:'groceries',     a:'−£14.00' },
      { m:'Spotify',     c:'subscriptions', cat:'subscriptions', a:'−£4.99'  },
    ]},
  ];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'10px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>spend</div>
            <div style={{ fontSize:26, fontWeight:900, letterSpacing:-0.8, marginTop:3 }}>every receipt.</div>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:M.cait, marginBottom:4 }}>filter</div>
        </div>
        <div style={{ padding:'12px 20px 0' }}>
          <div style={{ height:40, background:M.card, border:`1px solid ${M.rule}`, borderRadius:20, display:'flex', alignItems:'center', gap:8, padding:'0 14px', color:M.muted, fontSize:13, fontWeight:500 }}>
            🔍 search merchants
          </div>
        </div>
        <div style={{ flex:1, overflow:'hidden', padding:'10px 0 0' }}>
          {days.map(day => (
            <div key={day.label} style={{ marginBottom:2 }}>
              {/* Day header */}
              <div style={{ padding:'8px 20px 6px', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>{day.label}</span>
                <span style={{ fontSize:11.5, fontWeight:700, color:M.ink2 }}>{day.total}</span>
              </div>
              {/* Transaction rows */}
              {day.txns.map((t, i) => {
                const ic = cats[t.cat] || { bg: M.tint, fg: M.ink2 };
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:13, padding:'10px 20px', borderBottom:`1px solid ${M.rule}` }}>
                    {/* Merchant icon */}
                    <div style={{ width:38, height:38, borderRadius:11, background:ic.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:ic.fg, fontWeight:800, fontSize:15 }}>
                      {t.m[0]}
                    </div>
                    {/* Name + category pill */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:M.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.m}</div>
                      <div style={{ marginTop:3 }}>
                        <span style={{ fontSize:10.5, fontWeight:600, color:M.ink2, background:M.tint, borderRadius:5, padding:'1px 6px' }}>{t.c}</span>
                      </div>
                    </div>
                    {/* Amount */}
                    <span style={{ fontSize:15, fontWeight:800, color:M.ink, letterSpacing:-0.3, flexShrink:0 }}>{t.a}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <TabBar active="txn" />
      </div>
    </Phone>
  );
}

function HomeValueShown() {
  const qs = [
    { q:'can I go out tonight?',       a:'yes! 🍻',         bg:M.ink,  fg:'#fff' },
    { q:'will I make end of term?',     a:'looking good 📅', bg:M.cait, fg:'#fff' },
    { q:'how am I vs last week?',       a:'↓ 18% 📉',        bg:M.tint, fg:M.ink },
    { q:'anything I should know?',      a:'nope ✨',          bg:M.card, fg:M.ink2, border:M.rule },
  ];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'10px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, letterSpacing:-0.5 }}>hi Aanya 👋</div>
            <div style={{ fontSize:11, color:M.muted, fontWeight:600, marginTop:1 }}>wed · week 3 of term</div>
          </div>
          <CaitAvatar size={34} />
        </div>

        {/* Balance hero — the value shown state */}
        <div style={{ padding:'16px 20px 0' }}>
          <div style={{ background:M.ink, borderRadius:22, padding:'18px 20px 16px' }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.caitLight }}>left this week</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:2, marginTop:6 }}>
              <div style={{ fontWeight:900, fontSize:52, color:'#fff', letterSpacing:-2.5, lineHeight:1 }}>
                £47<span style={{ fontSize:28, color:M.caitLight }}>.20</span>
              </div>
            </div>
            <div style={{ marginTop:4, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>of £165 · resets sunday</span>
              <span style={{ fontSize:11, fontWeight:700, color:M.caitLight, letterSpacing:0.3 }}>hide 👁</span>
            </div>
            {/* spend bar */}
            <div style={{ marginTop:12, height:4, background:'rgba(255,255,255,0.12)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:'71%', height:'100%', background:M.cait, borderRadius:2 }} />
            </div>
            <div style={{ marginTop:5, fontSize:10.5, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>71% of the week spent · on track</div>
          </div>
        </div>

        {/* Cait questions */}
        <div style={{ padding:'14px 20px 0', flex:1, overflow:'hidden' }}>
          <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:9 }}>your week so far</div>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {qs.map(it => (
              <div key={it.q} style={{ background:it.bg, borderRadius:16, padding:'13px 15px', display:'flex', alignItems:'center', gap:12, border:it.border?`1px solid ${it.border}`:'none' }}>
                <div style={{ flex:1, fontSize:13.5, fontWeight:600, color:it.fg, lineHeight:1.3 }}>{it.q}</div>
                <div style={{ fontSize:14, fontWeight:800, color:it.fg, whiteSpace:'nowrap' }}>{it.a}</div>
              </div>
            ))}
          </div>
        </div>
        <TabBar active="home" />
      </div>
    </Phone>
  );
}

function TxnDetail() {
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'8px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ width:36, height:36, borderRadius:18, background:M.tint, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:M.ink2 }}>←</div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>transaction</div>
          <div style={{ width:36 }} />
        </div>
        <div style={{ padding:'22px 22px 0' }}>
          <div style={{ width:56, height:56, borderRadius:14, background:M.cait, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:24 }}>E</div>
          <div style={{ fontWeight:900, fontSize:34, letterSpacing:-1.2, marginTop:14, lineHeight:1 }}>The Eagle</div>
          <div style={{ fontSize:13, color:M.muted, marginTop:5 }}>tue 17 march · 22:48 · monzo</div>
          <div style={{ fontWeight:900, fontSize:52, letterSpacing:-2, marginTop:14, lineHeight:1 }}>−£41.00</div>
        </div>
        <div style={{ padding:'22px 22px 0', display:'flex', flexDirection:'column', gap:10, flex:1 }}>
          <div style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:8, height:8, borderRadius:4, background:M.cait }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>category</div>
              <div style={{ fontSize:14, fontWeight:700, marginTop:3 }}>eating out</div>
            </div>
            <span style={{ fontSize:12, color:M.cait, fontWeight:700 }}>change</span>
          </div>
          <div style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:16, padding:'14px 16px' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:6 }}>your note</div>
            <div style={{ fontSize:16, fontWeight:500, color:M.ink, fontStyle:'italic' }}>"pub night with Sam — deadline eve 🙃"</div>
          </div>
          <div style={{ background:M.ink, borderRadius:16, padding:'14px 16px', display:'flex', gap:10 }}>
            <CaitAvatar size={26} />
            <div style={{ fontSize:13, lineHeight:1.5, color:'rgba(247,244,240,0.85)', fontWeight:500, flex:1 }}>
              you've been to The Eagle <b style={{ color:'#fff', fontWeight:800 }}>4× this month</b> — about £32 a visit. no flag, just so you know.
            </div>
          </div>
        </div>
        <div style={{ padding:'12px 22px 24px' }}>
          <button style={{ width:'100%', height:48, borderRadius:24, border:`1px solid ${M.rule}`, background:'transparent', fontFamily:F, fontSize:13.5, fontWeight:700, color:M.ink }}>
            split or hide this transaction
          </button>
        </div>
      </div>
    </Phone>
  );
}

function Recategorise() {
  const cats = [
    { n:'Eating out',    c:M.cait,    sel:true },
    { n:'Groceries',     c:'#5E8A5A' },
    { n:'Transport',     c:'#7C6BA8' },
    { n:'Shopping',      c:'#B58A3A' },
    { n:'Entertainment', c:'#A85B4B' },
    { n:'Bills',         c:'#4A5F7A' },
    { n:'Health',        c:'#658768' },
    { n:'Education',     c:'#8E6A3A' },
    { n:'Subscriptions', c:'#8E7A4E' },
    { n:'Other',         c:M.muted   },
  ];
  return (
    <Phone bgOverride={`${M.ink}88`}>
      <div style={{ position:'absolute', inset:0 }}>
        {/* dim overlay */}
        <div style={{ position:'absolute', inset:0, background:'rgba(45,36,32,0.5)' }} />
        {/* sheet */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:M.bg, borderRadius:'22px 22px 0 0', padding:'14px 20px 32px' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:M.rule, margin:'0 auto 16px' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, fontFamily:F }}>re-categorise</div>
              <div style={{ fontSize:24, fontWeight:900, letterSpacing:-0.8, fontFamily:F, marginTop:4 }}>The Eagle · £41</div>
              <div style={{ fontSize:12, color:M.muted, fontFamily:F, marginTop:3 }}>i'll remember this for next time.</div>
            </div>
            <div style={{ width:30, height:30, borderRadius:15, background:M.tint, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:M.ink2 }}>×</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {cats.map(c => (
              <div key={c.n} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, background:c.sel?M.ink:'transparent', border:c.sel?'none':`1px solid ${M.rule}`, color:c.sel?'#fff':M.ink, fontFamily:F }}>
                <div style={{ width:8, height:8, borderRadius:4, background:c.c }} />
                <span style={{ flex:1, fontSize:13.5, fontWeight:c.sel?700:500 }}>{c.n}</span>
                {c.sel && <span style={{ fontSize:15 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Phone>
  );
}

function Settings() {
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'10px 20px 0' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you</div>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:-0.8, marginTop:3 }}>settings.</div>
        </div>
        <div style={{ padding:'14px 20px 0' }}>
          <div style={{ background:M.ink, borderRadius:18, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:22, background:M.cait, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:20, color:'#fff' }}>A</div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:-0.4 }}>Aanya Sharma</div>
              <div style={{ fontSize:12, color:'rgba(247,244,240,0.45)', marginTop:2 }}>aanya@warwick.ac.uk · oct 2025</div>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflow:'hidden', padding:'16px 20px 0' }}>
          {[
            { label:'connected',      items:['Monzo · current account →','Starling · savings →','+ add another bank'] },
            { label:'notifications',  items:['Weekly summary →','Category milestones →','Location reminders →'] },
            { label:'privacy',        items:['Export transactions →','Privacy policy →','Delete account'] },
          ].map(sec => (
            <div key={sec.label} style={{ marginBottom:16 }}>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:5 }}>{sec.label}</div>
              {sec.items.map((it,i,arr) => (
                <div key={it} style={{ padding:'10px 0', borderBottom:i<arr.length-1?`1px solid ${M.rule}`:'none', fontSize:13.5, fontWeight:500, color:it.toLowerCase().includes('delete')?'#C43030':M.ink }}>
                  {it}
                </div>
              ))}
            </div>
          ))}
        </div>
        <TabBar active="me" />
      </div>
    </Phone>
  );
}

window.CaitBKScreens = { Splash, Welcome, SignIn, SignUp, ConnectBank, HomeHidden, HomeRevealed, HomeValueShown, Transactions, TxnDetail, Recategorise, Settings };
