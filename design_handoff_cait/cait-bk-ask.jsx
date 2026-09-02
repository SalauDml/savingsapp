// cait-bk-ask.jsx
// Ask Cait — empty state + 5 custom-designed response types

const { F, M, Phone, TabBar, CaitAvatar, AskTopBar, AskInput } = window.CaitBK;

// ─── Empty state / prompt screen ─────────────────────────────
function AskEmpty() {
  const prompts = [
    'can I afford a night out tonight?',
    'how much did I spend on coffee last month?',
    'will I make it to end of term?',
    "what's been eating my budget?",
    'compare this week to last week.',
  ];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <div style={{ padding:'10px 20px 0' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>ask cait</div>
          <div style={{ fontSize:28, fontWeight:900, letterSpacing:-0.8, marginTop:4, lineHeight:1.1 }}>what do you<br/>want to know?</div>
        </div>
        <div style={{ padding:'18px 20px 0', flex:1, overflow:'hidden' }}>
          <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:10 }}>try asking</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {prompts.map(p => (
              <div key={p} style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:14, padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <span style={{ fontSize:13.5, fontWeight:500, color:M.ink, lineHeight:1.3, fontStyle:'italic' }}>"{p}"</span>
                <span style={{ color:M.muted, fontSize:16, flexShrink:0 }}>→</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'12px 18px 88px' }}>
          <div style={{ height:50, borderRadius:25, background:M.card, border:`1px solid ${M.rule}`, display:'flex', alignItems:'center', padding:'0 5px 0 16px', gap:10 }}>
            <CaitAvatar size={26} />
            <span style={{ flex:1, fontSize:14, color:M.muted, fontWeight:500 }}>ask anything about your money…</span>
            <div style={{ width:40, height:40, borderRadius:20, background:M.ink, color:M.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>→</div>
          </div>
        </div>
        <TabBar active="ask" />
      </div>
    </Phone>
  );
}

// ─── Type 1: Decision ("can I afford X?") ────────────────────
// Dark bg. Big bold verdict first. Clean and direct.
function AskDecision() {
  return (
    <Phone bgOverride={M.heroBg} tone="light">
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:'#fff' }}>
        <AskTopBar />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'rgba(255,255,255,0.38)' }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.35, fontWeight:500 }}>can i afford to go out tonight?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.caitLight }}>cait says</div>
          <div style={{ fontWeight:900, fontSize:52, lineHeight:0.92, letterSpacing:-2, marginTop:10 }}>yeah,<br/>go for it. 🍻</div>
          <div style={{ marginTop:16, fontSize:15, lineHeight:1.55, color:'rgba(255,255,255,0.72)', fontWeight:500 }}>
            you've got <b style={{ color:'#fff', fontWeight:800 }}>£47</b> left this week. a typical night costs you <b style={{ color:'#fff', fontWeight:800 }}>£25</b>, leaving you <b style={{ color:'#fff', fontWeight:800 }}>£22</b> for the rest.
          </div>
          <div style={{ marginTop:18, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[['in pocket','£47'],['typical night','£25'],['left after','£22']].map(([l,v]) => (
              <div key={l} style={{ padding:'10px 10px', borderRadius:12, background:'rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.42)', fontWeight:600, letterSpacing:0.3, textTransform:'uppercase' }}>{l}</div>
                <div style={{ fontSize:20, fontWeight:800, marginTop:3 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:7 }}>push it?</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['+ uber home? 🚕','end of term? 📅',"what's draining it?"].map(p => (
                <div key={p} style={{ padding:'7px 12px', borderRadius:999, border:'1px solid rgba(255,255,255,0.18)', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.8)' }}>{p}</div>
              ))}
            </div>
          </div>
          <AskInput />
        </div>
      </div>
    </Phone>
  );
}

// ─── Type 2: Spending number ("how much did I spend on X?") ──
// Light bg. One big number. Frequency dots below.
function AskSpending() {
  // simulate 12 coffee visits across a month as dot positions
  const visitDays = [2,3,6,9,12,14,17,20,21,24,27,29];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:M.ink2, lineHeight:1.35, fontWeight:500 }}>how much did i spend on coffee last month?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>cait says</div>
          {/* Big number */}
          <div style={{ marginTop:10, display:'flex', alignItems:'baseline', gap:10 }}>
            <div style={{ fontWeight:900, fontSize:64, lineHeight:0.92, letterSpacing:-3 }}>£47.50</div>
            <div style={{ fontSize:24 }}>☕</div>
          </div>
          <div style={{ marginTop:4, fontSize:13.5, color:M.ink2, fontWeight:500 }}>on coffee last month</div>

          {/* stat row */}
          <div style={{ marginTop:18, display:'flex', gap:0, borderTop:`1px solid ${M.rule}`, borderBottom:`1px solid ${M.rule}` }}>
            {[['visits','12'],['avg per visit','£3.96'],['top spot','Pret']].map(([l,v],i) => (
              <div key={l} style={{ flex:1, padding:'12px 0', paddingLeft: i>0?12:0, borderLeft:i>0?`1px solid ${M.rule}`:'none' }}>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>{l}</div>
                <div style={{ fontSize:17, fontWeight:800, marginTop:4, letterSpacing:-0.4 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* frequency dot calendar */}
          <div style={{ marginTop:18 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:10 }}>when you went (feb)</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {Array.from({ length:28 }).map((_,i) => {
                const day = i+1;
                const visited = visitDays.includes(day);
                return (
                  <div key={i} style={{ width:26, height:26, borderRadius:8, background:visited?M.cait:M.tint, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:9.5, fontWeight:visited?700:500, color:visited?'#fff':M.muted }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ flex:1 }} />
          <AskInput tone="light" />
        </div>
      </div>
    </Phone>
  );
}

// ─── Type 3: Comparison ("compare this week to last") ────────
// Light bg. Two big numbers side by side. Visual size comparison.
function AskComparison() {
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:M.ink2, lineHeight:1.35, fontWeight:500 }}>how does this week compare to last week?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>cait says</div>
          <div style={{ fontWeight:900, fontSize:32, lineHeight:1, letterSpacing:-1.2, marginTop:10 }}>
            you're spending less 📉
          </div>
          {/* side-by-side comparison */}
          <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ background:M.tint, borderRadius:18, padding:'16px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>this week</div>
              <div style={{ fontWeight:900, fontSize:40, letterSpacing:-2, marginTop:6, lineHeight:1 }}>£82</div>
              <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:16 }}>↓</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#2E7D52' }}>19% less</span>
              </div>
              {/* mini bar */}
              <div style={{ marginTop:10, height:6, background:`${M.rule}`, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:'81%', height:'100%', background:M.cait, borderRadius:3 }} />
              </div>
            </div>
            <div style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:18, padding:'16px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>last week</div>
              <div style={{ fontWeight:900, fontSize:40, letterSpacing:-2, marginTop:6, lineHeight:1, color:M.ink2 }}>£101</div>
              <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:500, color:M.muted }}>baseline</span>
              </div>
              {/* full bar */}
              <div style={{ marginTop:10, height:6, background:M.tint, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:'100%', height:'100%', background:M.muted, borderRadius:3 }} />
              </div>
            </div>
          </div>
          {/* what changed */}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:8 }}>biggest difference</div>
            {[
              { cat:'eating out', diff:'−£28', good:true },
              { cat:'groceries',  diff:'+£9',  good:false },
            ].map(r => (
              <div key={r.cat} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${M.rule}` }}>
                <span style={{ fontSize:14, fontWeight:600 }}>{r.cat}</span>
                <span style={{ fontSize:14, fontWeight:800, color:r.good?'#2E7D52':'#A05840' }}>{r.diff}</span>
              </div>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <AskInput tone="light" />
        </div>
      </div>
    </Phone>
  );
}

// ─── Type 4: Heads up / Warning ──────────────────────────────
// Tinted warm background. Progress bar nearly full. Honest but not scary.
function AskWarning() {
  const pct = 0.87; // 87% of budget used
  return (
    <Phone bgOverride={M.tint}>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:M.ink2, lineHeight:1.35, fontWeight:500 }}>how's my food budget looking?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>cait says</div>
          <div style={{ fontWeight:900, fontSize:46, lineHeight:0.95, letterSpacing:-2, marginTop:10 }}>
            heads up ⚡
          </div>
          <div style={{ marginTop:14, fontSize:15, color:M.ink2, lineHeight:1.5, fontWeight:500 }}>
            you've used <b style={{ color:M.ink, fontWeight:800 }}>£52</b> of your <b style={{ color:M.ink, fontWeight:800 }}>£60</b> food budget this month.
          </div>
          {/* progress bar */}
          <div style={{ marginTop:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:M.ink }}>£52 spent</span>
              <span style={{ fontSize:11, fontWeight:700, color:M.muted }}>£8 left · 11 days to go</span>
            </div>
            <div style={{ height:14, background:`${M.rule}`, borderRadius:7, overflow:'hidden' }}>
              <div style={{ width:`${pct*100}%`, height:'100%', background:M.cait, borderRadius:7, position:'relative' }}>
                <div style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', fontSize:9, fontWeight:800, color:'#fff' }}>87%</div>
              </div>
            </div>
          </div>
          {/* context */}
          <div style={{ marginTop:18, background:M.card, border:`1px solid ${M.rule}`, borderRadius:16, padding:'14px 16px' }}>
            <div style={{ fontSize:13.5, fontWeight:500, color:M.ink, lineHeight:1.5 }}>
              not a disaster — you just need to cook a couple of nights this week. you've got this 👌
            </div>
          </div>
          {/* top spends */}
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:8 }}>biggest food spends</div>
            {[
              { m:"Pret a Manger", a:'£18.40' },
              { m:'Tesco Metro',   a:'£14.20' },
              { m:'The Eagle',     a:'£12.00' },
            ].map(r => (
              <div key={r.m} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${M.rule}` }}>
                <span style={{ fontSize:13.5, fontWeight:600 }}>{r.m}</span>
                <span style={{ fontSize:13.5, fontWeight:700 }}>{r.a}</span>
              </div>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <AskInput tone="light" />
        </div>
      </div>
    </Phone>
  );
}

// ─── Type 5: Encouragement ("how am I doing overall?") ───────
// Light bg. Sparkline trend. Celebratory but understated.
function AskEncouragement() {
  // 4 months of spending totals (lower is better)
  const months = [
    { label:'nov', val:384, h:80 },
    { label:'dec', val:412, h:86 },
    { label:'jan', val:298, h:62 },
    { label:'feb', val:241, h:50 },
  ];
  const best = Math.max(...months.map(m => m.h));
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:M.ink2, lineHeight:1.35, fontWeight:500 }}>am I doing okay this month?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>cait says</div>
          <div style={{ fontWeight:900, fontSize:40, lineHeight:0.95, letterSpacing:-1.5, marginTop:10 }}>
            honestly?<br/>you're crushing it 🏆
          </div>
          <div style={{ marginTop:14, fontSize:15, color:M.ink2, lineHeight:1.5, fontWeight:500 }}>
            3 months of improvement in a row. you're <b style={{ color:M.ink, fontWeight:800 }}>£84 under</b> your average monthly spend.
          </div>
          {/* sparkline bars */}
          <div style={{ marginTop:22 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:12 }}>monthly spend</div>
            <div style={{ display:'flex', gap:10, alignItems:'flex-end', height:100 }}>
              {months.map((m, i) => {
                const isLast = i === months.length - 1;
                return (
                  <div key={m.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:isLast?'#2E7D52':M.muted }}>£{m.val}</div>
                    <div style={{ width:'100%', height:m.h, borderRadius:'6px 6px 0 0', background:isLast?'#2E7D52':M.tint, border:isLast?'none':`1px solid ${M.rule}`, transition:'all 0.3s' }} />
                    <div style={{ fontSize:11, fontWeight:700, color:isLast?M.ink:M.muted }}>{m.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* keep doing */}
          <div style={{ marginTop:18, background:M.tint, borderRadius:16, padding:'14px 16px', display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:22 }}>📈</span>
            <div style={{ fontSize:13.5, fontWeight:500, color:M.ink, lineHeight:1.45 }}>
              if you keep this pace you'll save <b style={{ fontWeight:800 }}>£340</b> extra by end of term.
            </div>
          </div>
          <div style={{ flex:1 }} />
          <AskInput tone="light" />
        </div>
      </div>
    </Phone>
  );
}

// ─── Fallback: Conversational ────────────────────────────────
// For open-ended, back-and-forth questions. No dramatic background shift.
// Cait's voice is the visual — dark bubbles, inline data chips, follow-up suggestions.
function AskConversational() {
  const thread = [
    { role:'user', text:'is spotify worth it for me?' },
    { role:'cait',
      text:'honestly, yeah.',
      body:'you opened it 28 times last month. that\'s £0.18 per listen — cheaper than any coffee you\'ve bought this term.',
      chip:{ label:'28 listens · £0.18 each', tone:'good' }
    },
    { role:'user', text:'what about netflix though' },
    { role:'cait',
      text:"different story.",
      body:"you haven't opened it in 3 weeks. £10.99 sitting there doing nothing.",
      chip:{ label:'last opened 23 days ago', tone:'warn' },
      action:'flag for cancel?'
    },
  ];
  const suggestions = ['flag netflix', 'what else am I not using?', 'show all subscriptions'];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />

        {/* thread */}
        <div style={{ flex:1, overflow:'hidden', padding:'14px 20px 0', display:'flex', flexDirection:'column', gap:14 }}>
          {thread.map((m, i) => {
            if (m.role === 'user') return (
              <div key={i} style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{ maxWidth:'78%', background:M.tint, borderRadius:'18px 18px 4px 18px', padding:'11px 15px' }}>
                  <span style={{ fontSize:14, fontWeight:600, color:M.ink, lineHeight:1.35 }}>{m.text}</span>
                </div>
              </div>
            );
            return (
              <div key={i} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                <CaitAvatar size={28} />
                <div style={{ maxWidth:'80%', display:'flex', flexDirection:'column', gap:7 }}>
                  {/* bubble */}
                  <div style={{ background:M.ink, borderRadius:'4px 18px 18px 18px', padding:'13px 15px' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fff', letterSpacing:-0.3, lineHeight:1.2 }}>{m.text}</div>
                    <div style={{ marginTop:6, fontSize:13.5, color:'rgba(255,255,255,0.68)', lineHeight:1.5, fontWeight:500 }}>{m.body}</div>
                  </div>
                  {/* inline data chip */}
                  {m.chip && (
                    <div style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:7, background:M.card, border:`1px solid ${M.rule}`, borderRadius:8, padding:'6px 10px' }}>
                      <div style={{ width:6, height:6, borderRadius:3, background: m.chip.tone==='warn' ? '#A05840' : M.cait, flexShrink:0 }} />
                      <span style={{ fontSize:11.5, fontWeight:700, color: m.chip.tone==='warn' ? '#A05840' : M.cait }}>{m.chip.label}</span>
                    </div>
                  )}
                  {/* inline action */}
                  {m.action && (
                    <div style={{ alignSelf:'flex-start', background:M.tint, borderRadius:999, padding:'6px 13px', border:`1px solid ${M.rule}` }}>
                      <span style={{ fontSize:12.5, fontWeight:700, color:M.ink }}>{m.action} →</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* follow-up suggestions */}
        <div style={{ padding:'10px 20px 0', display:'flex', gap:7, flexWrap:'wrap' }}>
          {suggestions.map(s => (
            <div key={s} style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:999, padding:'6px 12px' }}>
              <span style={{ fontSize:12, fontWeight:600, color:M.ink2 }}>{s}</span>
            </div>
          ))}
        </div>

        <AskInput tone="light" />
      </div>
    </Phone>
  );
}

// ─── BAD STATES ──────────────────────────────────────────────

// Bad Decision — "no, don't go out"
function AskDecisionBad() {
  return (
    <Phone bgOverride={M.heroBg} tone="light">
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:'#fff' }}>
        <AskTopBar />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'rgba(255,255,255,0.38)' }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.35, fontWeight:500 }}>can i afford to go out tonight?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.caitLight }}>cait says</div>
          <div style={{ fontWeight:900, fontSize:52, lineHeight:0.92, letterSpacing:-2, marginTop:10 }}>not<br/>tonight. ⚡</div>
          <div style={{ marginTop:16, fontSize:15, lineHeight:1.55, color:'rgba(255,255,255,0.72)', fontWeight:500 }}>
            you've got <b style={{ color:'#fff', fontWeight:800 }}>£12</b> left and <b style={{ color:'#fff', fontWeight:800 }}>4 days</b> to go. even one drink puts you in the red before sunday.
          </div>
          <div style={{ marginTop:18, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[['in pocket','£12'],['typical night','£25'],['shortfall','−£13']].map(([l,v]) => (
              <div key={l} style={{ padding:'10px 10px', borderRadius:12, background:'rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.42)', fontWeight:600, letterSpacing:0.3, textTransform:'uppercase' }}>{l}</div>
                <div style={{ fontSize:20, fontWeight:800, marginTop:3, color: v.startsWith('−') ? M.caitLight : '#fff' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:7 }}>alternatives?</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['what CAN I do? 🤔', 'cut something?', 'end of term? 📅'].map(p => (
                <div key={p} style={{ padding:'7px 12px', borderRadius:999, border:'1px solid rgba(255,255,255,0.18)', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.8)' }}>{p}</div>
              ))}
            </div>
          </div>
          <AskInput />
        </div>
      </div>
    </Phone>
  );
}

// Bad Spending Number — shockingly high
function AskSpendingBad() {
  const visitDays = [1,2,3,5,6,8,9,10,12,13,14,16,17,19,20,21,23,24,25,27,28];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:M.ink2, lineHeight:1.35, fontWeight:500 }}>how much did i spend on coffee last month?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>cait says</div>
          <div style={{ marginTop:10, display:'flex', alignItems:'baseline', gap:10 }}>
            <div style={{ fontWeight:900, fontSize:64, lineHeight:0.92, letterSpacing:-3 }}>£94.50</div>
            <div style={{ fontSize:24 }}>☕</div>
          </div>
          <div style={{ marginTop:4, fontSize:13.5, color:M.ink2, fontWeight:500 }}>on coffee last month — your highest yet.</div>

          {/* context chip */}
          <div style={{ marginTop:10, alignSelf:'flex-start', display:'flex', alignItems:'center', gap:7, background:M.tint, border:`1px solid ${M.rule}`, borderRadius:8, padding:'6px 10px' }}>
            <div style={{ width:6, height:6, borderRadius:3, background:'#A05840', flexShrink:0 }} />
            <span style={{ fontSize:11.5, fontWeight:700, color:'#A05840' }}>2× your usual · 21 visits</span>
          </div>

          <div style={{ marginTop:16, display:'flex', gap:0, borderTop:`1px solid ${M.rule}`, borderBottom:`1px solid ${M.rule}` }}>
            {[['visits','21'],['avg per visit','£4.50'],['top spot','Pret']].map(([l,v],i) => (
              <div key={l} style={{ flex:1, padding:'12px 0', paddingLeft:i>0?12:0, borderLeft:i>0?`1px solid ${M.rule}`:'none' }}>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>{l}</div>
                <div style={{ fontSize:17, fontWeight:800, marginTop:4, letterSpacing:-0.4 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:10 }}>when you went (feb) — very busy</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {Array.from({ length:28 }).map((_,i) => {
                const day = i+1;
                const visited = visitDays.includes(day);
                return (
                  <div key={i} style={{ width:26, height:26, borderRadius:8, background:visited?'#A05840':M.tint, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:9.5, fontWeight:visited?700:500, color:visited?'#fff':M.muted }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ flex:1 }} />
          <AskInput tone="light" />
        </div>
      </div>
    </Phone>
  );
}

// Bad Comparison — spending more this week
function AskComparisonBad() {
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:M.ink2, lineHeight:1.35, fontWeight:500 }}>how does this week compare to last week?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>cait says</div>
          <div style={{ fontWeight:900, fontSize:32, lineHeight:1, letterSpacing:-1.2, marginTop:10 }}>you're spending more 📈</div>
          <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ background:M.card, border:`1px solid ${M.rule}`, borderRadius:18, padding:'16px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>last week</div>
              <div style={{ fontWeight:900, fontSize:40, letterSpacing:-2, marginTop:6, lineHeight:1, color:M.ink2 }}>£82</div>
              <div style={{ marginTop:6 }}>
                <span style={{ fontSize:13, fontWeight:500, color:M.muted }}>baseline</span>
              </div>
              <div style={{ marginTop:10, height:6, background:M.tint, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:'65%', height:'100%', background:M.muted, borderRadius:3 }} />
              </div>
            </div>
            <div style={{ background:M.tint, borderRadius:18, padding:'16px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'#A05840' }}>this week</div>
              <div style={{ fontWeight:900, fontSize:40, letterSpacing:-2, marginTop:6, lineHeight:1 }}>£148</div>
              <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:16 }}>↑</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#A05840' }}>+80% more</span>
              </div>
              <div style={{ marginTop:10, height:6, background:M.rule, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:'100%', height:'100%', background:'#A05840', borderRadius:3 }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:8 }}>biggest jump</div>
            {[
              { cat:'eating out', diff:'+£41', note:'The Eagle' },
              { cat:'shopping',   diff:'+£25', note:'ASOS' },
            ].map(r => (
              <div key={r.cat} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${M.rule}` }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{r.cat}</div>
                  <div style={{ fontSize:11, color:M.muted, marginTop:1 }}>{r.note}</div>
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:'#A05840' }}>{r.diff}</span>
              </div>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <AskInput tone="light" />
        </div>
      </div>
    </Phone>
  );
}

// Bad Warning — budget blown
function AskWarningBad() {
  return (
    <Phone bgOverride={M.tint}>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:M.ink2, lineHeight:1.35, fontWeight:500 }}>how's my food budget looking?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>cait says</div>
          <div style={{ fontWeight:900, fontSize:46, lineHeight:0.95, letterSpacing:-2, marginTop:10 }}>you're over. ⚡</div>
          <div style={{ marginTop:14, fontSize:15, color:M.ink2, lineHeight:1.5, fontWeight:500 }}>
            you've spent <b style={{ color:M.ink, fontWeight:800 }}>£68</b> against a <b style={{ color:M.ink, fontWeight:800 }}>£60</b> budget — <b style={{ color:'#A05840', fontWeight:800 }}>£8 over</b> with 11 days still to go.
          </div>
          {/* overflow bar */}
          <div style={{ marginTop:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:M.ink }}>£68 spent</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#A05840' }}>£8 over budget</span>
            </div>
            <div style={{ height:14, background:M.rule, borderRadius:7, overflow:'hidden', position:'relative' }}>
              <div style={{ width:'100%', height:'100%', background:M.cait, borderRadius:7 }} />
              <div style={{ position:'absolute', right:0, top:0, width:'12%', height:'100%', background:'#A05840', borderRadius:'0 7px 7px 0' }} />
              <div style={{ position:'absolute', right:'12%', top:0, bottom:0, width:2, background:'#fff' }} />
            </div>
            <div style={{ marginTop:6, fontSize:11, color:'#A05840', fontWeight:700 }}>113% of budget used</div>
          </div>
          <div style={{ marginTop:16, background:M.card, border:`1px solid ${M.rule}`, borderRadius:16, padding:'14px 16px' }}>
            <div style={{ fontSize:13.5, fontWeight:500, color:M.ink, lineHeight:1.5 }}>
              no drama — cook at home for the next few nights and you'll stop the bleed. you've done it before 👌
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:8 }}>biggest food spends</div>
            {[
              { m:'The Eagle',     a:'£24.00' },
              { m:"Pret a Manger", a:'£18.40' },
              { m:'Deliveroo',     a:'£14.60' },
            ].map(r => (
              <div key={r.m} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${M.rule}` }}>
                <span style={{ fontSize:13.5, fontWeight:600 }}>{r.m}</span>
                <span style={{ fontSize:13.5, fontWeight:700 }}>{r.a}</span>
              </div>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <AskInput tone="light" />
        </div>
      </div>
    </Phone>
  );
}

// Bad Encouragement — trend going wrong
function AskEncouragementBad() {
  const months = [
    { label:'nov', val:241, h:50 },
    { label:'dec', val:298, h:62 },
    { label:'jan', val:351, h:73 },
    { label:'feb', val:412, h:86 },
  ];
  return (
    <Phone>
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:M.ink }}>
        <AskTopBar tone="light" />
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:M.ink2, lineHeight:1.35, fontWeight:500 }}>am I doing okay this month?</div>
        </div>
        <div style={{ padding:'22px 22px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.cait }}>cait says</div>
          <div style={{ fontWeight:900, fontSize:40, lineHeight:0.95, letterSpacing:-1.5, marginTop:10 }}>
            let's talk<br/>about it. 👀
          </div>
          <div style={{ marginTop:14, fontSize:15, color:M.ink2, lineHeight:1.5, fontWeight:500 }}>
            spending has gone up 3 months in a row. february is your highest month yet — <b style={{ color:M.ink, fontWeight:800 }}>£171 more</b> than november.
          </div>
          <div style={{ marginTop:22 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:M.muted, marginBottom:12 }}>monthly spend — climbing</div>
            <div style={{ display:'flex', gap:10, alignItems:'flex-end', height:100 }}>
              {months.map((m, i) => {
                const isLast = i === months.length - 1;
                return (
                  <div key={m.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:isLast?'#A05840':M.muted }}>£{m.val}</div>
                    <div style={{ width:'100%', height:m.h, borderRadius:'6px 6px 0 0', background:isLast?'#A05840':M.tint, border:isLast?'none':`1px solid ${M.rule}` }} />
                    <div style={{ fontSize:11, fontWeight:700, color:isLast?M.ink:M.muted }}>{m.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop:18, background:M.tint, borderRadius:16, padding:'14px 16px', display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:22 }}>💡</span>
            <div style={{ fontSize:13.5, fontWeight:500, color:M.ink, lineHeight:1.45 }}>
              eating out is the main driver. want me to show you where it's creeping in?
            </div>
          </div>
          <div style={{ flex:1 }} />
          <AskInput tone="light" />
        </div>
      </div>
    </Phone>
  );
}

// ─── Thinking / Loading state ─────────────────────────────────
// Shown after the user asks — Cait spells out her own acronym
// as the steps she's running. Dark bg, mid-progress state shown.
function AskThinking() {
  const steps = [
    { letter:'C', word:'Can you?',  action:'checking your balance',      done:true  },
    { letter:'A', word:'Afford?',   action:'running your spend rate',     done:true  },
    { letter:'I', word:'It?',       action:'comparing to your usual...',  active:true },
    { letter:'T', word:'',          action:'almost there.',               pending:true },
  ];
  return (
    <Phone bgOverride={M.heroBg} tone="light">
      <div style={{ position:'absolute', inset:0, paddingTop:44, display:'flex', flexDirection:'column', fontFamily:F, color:'#fff' }}>
        <AskTopBar />

        {/* question echo */}
        <div style={{ padding:'16px 22px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'rgba(255,255,255,0.35)' }}>you asked</div>
          <div style={{ marginTop:4, fontSize:15, color:'rgba(255,255,255,0.72)', lineHeight:1.35, fontWeight:500 }}>can i afford to go out tonight?</div>
        </div>

        {/* identity + thinking */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 24px', gap:36 }}>

          {/* Cait avatar + status */}
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:54, height:54, borderRadius:27, background:M.cait, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:26, color:'#fff', flexShrink:0 }}>C</div>
            <div>
              <div style={{ fontWeight:900, fontSize:38, letterSpacing:-1.5, lineHeight:1 }}>on it.</div>
              <div style={{ fontSize:13, color:M.caitLight, marginTop:4, fontWeight:500 }}>give me a second…</div>
            </div>
          </div>

          {/* C · A · I · T steps */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {steps.map(s => (
              <div key={s.letter} style={{ display:'flex', alignItems:'center', gap:14,
                opacity: s.done ? 0.38 : s.active ? 1 : 0.18 }}>
                {/* letter badge */}
                <div style={{
                  width:34, height:34, borderRadius:10, flexShrink:0,
                  background: s.done ? 'rgba(255,255,255,0.08)' : s.active ? M.cait : 'rgba(255,255,255,0.04)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:800, fontSize:16,
                  color: s.done ? 'rgba(255,255,255,0.45)' : '#fff',
                }}>{s.letter}</div>
                {/* text */}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color: s.done ? 'rgba(255,255,255,0.45)' : '#fff' }}>{s.word}</div>
                  <div style={{ fontSize:11.5, color: s.done ? 'rgba(255,255,255,0.28)' : M.caitLight, marginTop:2, fontWeight:500 }}>{s.action}</div>
                </div>
                {/* done tick */}
                {s.done && <span style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginLeft:'auto' }}>✓</span>}
                {/* active pulse dot */}
                {s.active && (
                  <div style={{ width:7, height:7, borderRadius:4, background:M.caitLight, marginLeft:'auto' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AskInput />
      </div>
    </Phone>
  );
}

window.CaitBKAsk = { AskEmpty, AskThinking, AskDecision, AskDecisionBad, AskSpending, AskSpendingBad, AskComparison, AskComparisonBad, AskWarning, AskWarningBad, AskEncouragement, AskEncouragementBad, AskConversational };
