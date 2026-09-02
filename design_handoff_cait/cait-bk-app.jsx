// cait-bk-app.jsx — brand overview + full layout

const { F, M } = window.CaitBK;
const { Splash, Welcome, SignIn, SignUp, ConnectBank, HomeHidden, HomeRevealed, HomeValueShown, Transactions, TxnDetail, Recategorise, Settings } = window.CaitBKScreens;
const { AskEmpty, AskThinking, AskDecision, AskDecisionBad, AskSpending, AskSpendingBad, AskComparison, AskComparisonBad, AskWarning, AskWarningBad, AskEncouragement, AskEncouragementBad, AskConversational } = window.CaitBKAsk;

// ─── Layout helpers ───────────────────────────────────────────

function Section({ title, subtitle, children, dark }) {
  return (
    <div style={{ maxWidth:1280, margin:'0 auto 72px', padding:'0 36px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color: dark ? M.caitLight : M.muted }}>
          {subtitle}
        </div>
        <div style={{ fontWeight:900, fontSize:28, letterSpacing:-0.8, color: dark ? '#fff' : M.ink, marginTop:4 }}>
          {title}
        </div>
      </div>
      <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
        {children}
      </div>
    </div>
  );
}

function PhoneLabel({ label, sub }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      {/* phone slot — filled by child */}
      <div style={{ fontSize:11, fontWeight:700, color:M.muted, letterSpacing:0.3, textTransform:'uppercase', textAlign:'center' }}>
        {label}
        {sub && <div style={{ fontWeight:500, letterSpacing:0, textTransform:'none', color:M.muted, fontSize:10.5, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Screen({ label, sub, Comp }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <Comp />
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:11, fontWeight:700, color:M.muted, letterSpacing:0.3, textTransform:'uppercase' }}>{label}</div>
        {sub && <div style={{ fontSize:10.5, color:M.muted, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Brand overview card ──────────────────────────────────────

function BrandOverview() {
  const swatches = [
    { c:M.bg,    label:'Paper',  hex:'#f7f4f0', desc:'bg' },
    { c:M.card,  label:'White',  hex:'#ffffff',  desc:'card' },
    { c:M.tint,  label:'Tint',   hex:'#e8ddd5',  desc:'tint' },
    { c:M.rule,  label:'Rule',   hex:'#e0d4c8',  desc:'border' },
    { c:M.muted, label:'Muted',  hex:'#b8a89a',  desc:'secondary text' },
    { c:M.cait,  label:'Cait',   hex:'#9b7e6a',  desc:'accent · cait only' },
    { c:M.ink2,  label:'Brown',  hex:'#7a6355',  desc:'tertiary' },
    { c:M.ink,   label:'Ink',    hex:'#2d2420',  desc:'primary text · dark bg' },
  ];

  const typeScale = [
    { label:'Display',  size:52, weight:900, sample:"you're fine.",      note:'Hero answers, big moments' },
    { label:'Heading',  size:32, weight:900, sample:'every receipt.',    note:'Screen titles' },
    { label:'Title',    size:22, weight:800, sample:'hi Aanya 👋',       note:'Cards, callouts' },
    { label:'Body',     size:15, weight:500, sample:'you spent £47 this week.', note:"Cait's explanations" },
    { label:'Label',    size:11, weight:700, sample:'THIS WEEK · WK 3',  note:'Eyebrows, meta, uppercase' },
    { label:'Micro',    size:10, weight:700, sample:'CAIT SAYS',         note:'Status labels, allcaps' },
  ];

  const voiceExamples = [
    { do: "yeah, go for it. 🍻",                     dont: "Affirmative. Your budget allows for this expenditure." },
    { do: "heads up — you're getting close ⚡",       dont: "Warning: 87% of budget consumed." },
    { do: "you're crushing it this month 🏆",          dont: "Positive performance trend detected." },
    { do: "that's 4 visits to The Eagle this month.",  dont: "Repeat merchant visits: 4 occurrences." },
  ];

  return (
    <div style={{ maxWidth:1280, margin:'0 auto 80px', padding:'0 36px' }}>
      {/* wordmark */}
      <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:40 }}>
        <div style={{ width:64, height:64, borderRadius:32, background:M.ink, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:32, height:32, borderRadius:16, background:M.cait }} />
        </div>
        <div>
          <div style={{ fontFamily:F, fontWeight:900, fontSize:56, letterSpacing:-3, lineHeight:1, color:M.ink }}>Cait</div>
          <div style={{ fontFamily:F, fontSize:14, color:M.muted, fontWeight:600, letterSpacing:0.2, marginTop:2 }}>your money. no drama.</div>
        </div>
        <div style={{ marginLeft:'auto', fontFamily:F, fontSize:13, color:M.muted, fontWeight:600, lineHeight:1.6, maxWidth:380, textAlign:'right' }}>
          <span style={{ display:'block', fontWeight:700, color:M.ink, marginBottom:4 }}>Outfit · 300–900</span>
          Mocha palette — original codebase theme.ts, no changes.
          Personality lives in copy tone and font weight contrast.
          One accent color used only for Cait herself.
        </div>
      </div>

      {/* palette */}
      <div style={{ marginBottom:44 }}>
        <div style={{ fontFamily:F, fontSize:11, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:M.muted, marginBottom:14 }}>colour palette</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {swatches.map(s => (
            <div key={s.hex} style={{ width:110 }}>
              <div style={{ height:64, borderRadius:14, background:s.c, border:`1.5px solid ${M.rule}`, boxShadow:'0 2px 8px rgba(45,36,32,0.06)' }} />
              <div style={{ fontFamily:F, fontWeight:700, fontSize:13, color:M.ink, marginTop:7 }}>{s.label}</div>
              <div style={{ fontFamily:'monospace', fontSize:11, color:M.muted, marginTop:1 }}>{s.hex}</div>
              <div style={{ fontFamily:F, fontSize:10.5, color:M.muted, marginTop:1 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* type scale */}
      <div style={{ marginBottom:44 }}>
        <div style={{ fontFamily:F, fontSize:11, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:M.muted, marginBottom:14 }}>type scale — Outfit</div>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {typeScale.map((t, i) => (
            <div key={t.label} style={{ display:'flex', alignItems:'baseline', gap:24, padding:'14px 0', borderBottom:`1px solid ${M.rule}` }}>
              <div style={{ width:72, flexShrink:0, fontFamily:F, fontSize:10.5, fontWeight:700, color:M.muted, textTransform:'uppercase', letterSpacing:0.4 }}>{t.label}</div>
              <div style={{ flex:1, fontFamily:F, fontWeight:t.weight, fontSize:t.size, letterSpacing: t.size>30 ? -1.5 : t.size>18 ? -0.5 : 0, lineHeight:1.1, color:M.ink }}>{t.sample}</div>
              <div style={{ width:220, flexShrink:0, fontFamily:F, fontSize:11.5, color:M.muted, fontWeight:500 }}>{t.note} · {t.size}px / {t.weight}</div>
            </div>
          ))}
        </div>
      </div>

      {/* voice */}
      <div>
        <div style={{ fontFamily:F, fontSize:11, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:M.muted, marginBottom:14 }}>how cait talks</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ background:M.tint, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontFamily:F, fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'#2E7D52', marginBottom:10 }}>✓ do</div>
            {voiceExamples.map((v,i) => (
              <div key={i} style={{ fontFamily:F, fontSize:13.5, color:M.ink, fontWeight:500, lineHeight:1.4, marginBottom:8, fontStyle:'italic' }}>"{v.do}"</div>
            ))}
          </div>
          <div style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontFamily:F, fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'#A05840', marginBottom:10 }}>✗ don't</div>
            {voiceExamples.map((v,i) => (
              <div key={i} style={{ fontFamily:F, fontSize:13.5, color:M.muted, fontWeight:500, lineHeight:1.4, marginBottom:8 }}>"{v.dont}"</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ maxWidth:1280, margin:'0 auto 40px', padding:'0 36px' }}>
      <div style={{ height:1, background:M.rule, position:'relative', display:'flex', alignItems:'center' }}>
        <span style={{ background:M.warmBg, paddingRight:12, fontFamily:F, fontSize:11, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:M.muted }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────

function App() {
  return (
    <div style={{ minHeight:'100vh', background:M.warmBg, padding:'64px 0 80px', fontFamily:F }}>

      {/* brand kit header */}
      <div style={{ maxWidth:1280, margin:'0 auto 56px', padding:'0 36px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:F, fontWeight:900, fontSize:18, letterSpacing:-0.5, color:M.ink }}>Cait — Brand Kit</div>
          <div style={{ fontFamily:F, fontSize:12, color:M.muted, fontWeight:600, marginTop:3 }}>Outfit · Mocha · June 2026</div>
        </div>
        <div style={{ fontFamily:F, fontSize:12, color:M.muted, fontWeight:600 }}>SaveMyMoney Ltd</div>
      </div>

      <BrandOverview />

      <Divider label="01 — Onboarding" />
      <Section title="Splash, welcome, sign up & connect" subtitle="first-run · 5 screens">
        <Screen label="Splash"       sub="app launch"      Comp={Splash} />
        <Screen label="Welcome"      Comp={Welcome} />
        <Screen label="Sign In"      sub="returning user"  Comp={SignIn} />
        <Screen label="Sign Up"      Comp={SignUp} />
        <Screen label="Connect Bank" Comp={ConnectBank} />
      </Section>

      <Divider label="02 — Home" />
      <Section title="Today — the home screen" subtitle="number hidden by default">
        <Screen label="Hidden"       sub="default state — number starred" Comp={HomeHidden} />
        <Screen label="Revealed"     sub="after tapping 👁"               Comp={HomeRevealed} />
        <Screen label="Value shown"  sub="balance as hero"                Comp={HomeValueShown} />
      </Section>

      <Divider label="03 — Ask Cait" />
      <Section title="Ask Cait — empty & thinking" subtitle="before and during a query">
        <Screen label="Ask Cait" sub="empty / first visit" Comp={AskEmpty} />
        <Screen label="Thinking" sub="C·A·I·T loading state" Comp={AskThinking} />
      </Section>

      <div style={{ maxWidth:1280, margin:'0 auto 16px', padding:'0 36px' }}>
        <div style={{ fontFamily:F, fontSize:11, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:M.muted, marginBottom:4 }}>ask cait — response types</div>
        <div style={{ fontFamily:F, fontSize:14, color:M.ink2, fontWeight:500, lineHeight:1.55, maxWidth:680 }}>
          Each query type has its own visual signature so the answer is legible before you even read it.
          Dark backgrounds = high-stakes decisions. Light = information. Warm tint = heads up.
          Freeform / back-and-forth → conversational fallback.
        </div>
      </div>

      <Section title="Decision — 'can I afford X?'" subtitle="type 1 · dark · verdict first">
        <Screen label="Go" sub="yes · dark bg" Comp={AskDecision} />
        <Screen label="No-go" sub="no · same dark bg" Comp={AskDecisionBad} />
      </Section>

      <Section title="Spending number — 'how much did I spend on X?'" subtitle="type 2 · light · one big number + calendar dots">
        <Screen label="Normal" sub="light bg · frequency calendar" Comp={AskSpending} />
        <Screen label="High spend" sub="dense dots · over context" Comp={AskSpendingBad} />
      </Section>

      <Section title="Comparison — 'compare this week to last'" subtitle="type 3 · light · two numbers side by side">
        <Screen label="Spending less" sub="good · green delta" Comp={AskComparison} />
        <Screen label="Spending more" sub="bad · amber delta" Comp={AskComparisonBad} />
      </Section>

      <Section title="Heads up — 'how's my X budget?'" subtitle="type 4 · tint bg · progress bar">
        <Screen label="Nearly there" sub="tint bg · honest but warm" Comp={AskWarning} />
        <Screen label="Over budget" sub="tint bg · overflow bar" Comp={AskWarningBad} />
      </Section>

      <Section title="Encouragement — 'am I doing okay?'" subtitle="type 5 · light · sparkline trend">
        <Screen label="Improving" sub="bars falling · milestone" Comp={AskEncouragement} />
        <Screen label="Climbing" sub="bars rising · honest nudge" Comp={AskEncouragementBad} />
      </Section>

      <Section title="Conversational — open-ended & back-and-forth" subtitle="fallback · freeform dialogue">
        <Screen label="Conversational" sub="chat mode · inline data chips" Comp={AskConversational} />
      </Section>

      <Divider label="04 — Transactions" />
      <Section title="Transactions & detail" subtitle="spend tab · receipts · re-categorise">
        <Screen label="Feed"          sub="chronological receipts"  Comp={Transactions} />
        <Screen label="Detail"        sub="single transaction"      Comp={TxnDetail} />
        <Screen label="Re-categorise" sub="bottom sheet"            Comp={Recategorise} />
      </Section>

      <Divider label="05 — Settings" />
      <Section title="You — settings" subtitle="connected accounts · notifications · privacy">
        <Screen label="Settings" sub="profile + connections + privacy" Comp={Settings} />
      </Section>

    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
