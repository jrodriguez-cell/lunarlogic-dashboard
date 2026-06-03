import { useState, useEffect } from 'react';

// ── localStorage helpers ────────────────────────────────────────────────────

const KEYS = {
  deals: 'sprint_deals',
  contacts: 'sprint_contacts',
  tasks: 'sprint_tasks',
  partners: 'sprint_partners',
  metrics: 'sprint_metrics',
};

function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── Default data ────────────────────────────────────────────────────────────

const DEFAULT_DEALS = [
  { id:'d1', company:'Gualapack US', contact:'Pedro Fernandez', vertical:'Other', stage:'Proposal', lastContact:'2026-05-04', nextAction:'Call Pedro — force yes/no on materials', due:'2026-06-02', notes:'24-day stall. POC agreed May 4. Needs customer list, payment terms, sample invoices. Send permission-to-close-file if no materials by June 5.', priority:'High', value:'$349/mo', status:'Stalled' },
  { id:'d2', company:'James Welborn → PwC', contact:'James Welborn', vertical:'Agency', stage:'Outreach', lastContact:'2026-05-20', nextAction:'Send 20-min Loom product walkthrough', due:'2026-06-03', notes:'Referral partner. Unlocks Mike Castro at PwC. Must see product before making intro.', priority:'High', value:'referral', status:'Warm' },
  { id:'d3', company:'Peter Sukits — Forvis Mazars', contact:'Peter Sukits', vertical:'Other', stage:'Discovery', lastContact:'2026-05-25', nextAction:'Schedule 20-min qualification call', due:'2026-06-05', notes:'Senior Finance Director. Active vendor evaluation. Qualify on 4 questions.', priority:'Medium', value:'TBD', status:'Warm' },
  { id:'d4', company:'Siegfried Group Miami', contact:'Diego Zerga + 4 contacts', vertical:'Other', stage:'Outreach', lastContact:'2026-05-28', nextAction:'LinkedIn DM + email all 5 contacts', due:'2026-06-07', notes:'Referral partners. Diego Zerga, Laxman Nadesapillai, Kate Binder, Alexander Marina, Usama Waheed.', priority:'High', value:'referral', status:'Cold' },
  { id:'d5', company:'Ryan Williams — Assistabyte', contact:'Ryan Williams', vertical:'Agency', stage:'Discovery', lastContact:'2026-05-22', nextAction:'Schedule in-person coffee, bring referral proposal in writing', due:'2026-06-12', notes:'AI automation agency. Reciprocal referral partner. Need to formalize commission structure.', priority:'Medium', value:'referral', status:'Warm' },
];

const DEFAULT_TASKS = [
  { id:'w1t1', week:1, done:false, text:'Call Pedro — force yes/no on Gualapack materials by Wednesday June 4' },
  { id:'w1t2', week:1, done:false, text:'Send James Welborn 20-min Loom product walkthrough by June 3' },
  { id:'w1t3', week:1, done:false, text:'Send Gualapack permission-to-close-file if no materials by June 5' },
  { id:'w1t4', week:1, done:false, text:'Build Charlotte prospect list — 50 firms (cleaning, HVAC, landscaping, staffing)' },
  { id:'w1t5', week:1, done:false, text:'Contact all 5 Siegfried Group Miami contacts by June 7' },
  { id:'w1t6', week:1, done:false, text:'5 cold calls/day June 3–7 (25 total from Charlotte trades list)' },
  { id:'w1t7', week:1, done:false, text:'Qualify Peter Sukits — schedule 20-min discovery call' },
  { id:'w2t1', week:2, done:false, text:'Final Gualapack decision — POC build starts or file closed June 8' },
  { id:'w2t2', week:2, done:false, text:'Run discovery calls from Week 1 responses — qualify on 4 questions' },
  { id:'w2t3', week:2, done:false, text:'In-person coffee with Ryan Williams — bring referral proposal in writing' },
  { id:'w2t4', week:2, done:false, text:'QB ProAdvisor outreach — 10 ProAdvisors in Charlotte and Miami' },
  { id:'w2t5', week:2, done:false, text:'Attend one Charlotte networking event (trades or small business focus)' },
  { id:'w2t6', week:2, done:false, text:'5 cold calls/day (25 total) — use landscaping peak season hook' },
  { id:'w2t7', week:2, done:false, text:'Close first client — Shadow Mode pilot offer' },
  { id:'w3t1', week:3, done:false, text:'Close Week 2 demo pipeline — every open proposal gets a close call' },
  { id:'w3t2', week:3, done:false, text:'Referral partners deliver first introductions — make ask explicit with specific names' },
  { id:'w3t3', week:3, done:false, text:'James Welborn → Mike Castro PwC intro call scheduled' },
  { id:'w3t4', week:3, done:false, text:'Onboard clients 1–2 — Shadow Mode, QuickBooks connection, Outlook send-as' },
  { id:'w3t5', week:3, done:false, text:'Maintain 5 contacts/day — outbound does not stop during onboarding' },
  { id:'w3t6', week:3, done:false, text:'Second client signed' },
  { id:'w4t1', week:4, done:false, text:'Close clients 4 and 5 — every open proposal gets a close call' },
  { id:'w4t2', week:4, done:false, text:'Pull Shadow Mode early metrics from clients in Week 2' },
  { id:'w4t3', week:4, done:false, text:'PwC Mike Castro meeting — same-week follow-up' },
  { id:'w4t4', week:4, done:false, text:'Pre-book 10 discovery calls for first week of July' },
  { id:'w4t5', week:4, done:false, text:'Sprint retrospective — which verticals converted, which referral sources delivered' },
  { id:'w4t6', week:4, done:false, text:'Draft 2 case studies from June clients' },
];

const DEFAULT_METRICS = { clientsSigned:0, contacts:0, discovery:0, demos:0, proposals:0 };

const STAGES = ['Outreach','Discovery','Demo','Proposal','Pilot','Archived'];
const VERTICALS = ['Cleaning','HVAC','Landscaping','Staffing','Agency','IT/MSP','Other'];
const PRIORITIES = ['High','Medium','Low'];
const STATUSES = ['Hot','Warm','Cold','Stalled'];
const METHODS = ['Phone Call','Voicemail + Email','Email Only','LinkedIn','In-Person'];
const OUTCOMES = ['Connected - Qualified','Connected - Disqualified','Voicemail Left','No Answer','Not Interested','Discovery Call Booked','Demo Booked'];

// ── Colours ─────────────────────────────────────────────────────────────────

const C = {
  bg:      '#07101c',
  card:    '#0c1828',
  border:  '#1a2c42',
  border2: '#243d5c',
  text:    '#e8f2ff',
  muted:   '#5a7a9e',
  teal:    '#00d4e8',
  green:   '#22c55e',
  yellow:  '#f59e0b',
  red:     '#ef4444',
  blue:    '#3b82f6',
};

function daysSince(d) {
  if (!d) return 999;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
}
function today() { return new Date().toISOString().slice(0,10); }

// ── Shared UI ───────────────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function Badge({ children, color = C.muted, bg }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      background: bg || (color + '22'), color, border: `1px solid ${color}44`, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'sm', style, disabled }) {
  const base = {
    border: 'none', borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '5px 12px' : '8px 18px',
    opacity: disabled ? 0.5 : 1, transition: 'opacity .15s', ...style,
  };
  const vars = {
    primary: { background: C.teal, color: '#07101c' },
    ghost:   { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
    danger:  { background: '#ef444422', color: C.red, border: `1px solid ${C.red}44` },
  };
  return <button style={{ ...base, ...vars[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Bar({ value, max, color = C.teal, height = 6 }) {
  const pct = Math.min(100, max ? Math.round((value / max) * 100) : 0);
  return (
    <div style={{ background: C.border, borderRadius: 999, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .3s' }} />
    </div>
  );
}

function Input({ value, onChange, type='text', placeholder, style }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        background: '#0a1624', border: `1px solid ${C.border}`, borderRadius: 6,
        color: C.text, fontSize: 13, padding: '6px 10px', width: '100%', outline: 'none', ...style,
      }}
    />
  );
}

function Sel({ value, onChange, options, style }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        background: '#0a1624', border: `1px solid ${C.border}`, borderRadius: 6,
        color: C.text, fontSize: 13, padding: '6px 10px', width: '100%', outline: 'none', ...style,
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      style={{
        background: '#0a1624', border: `1px solid ${C.border}`, borderRadius: 6,
        color: C.text, fontSize: 13, padding: '6px 10px', width: '100%', outline: 'none', resize: 'vertical',
      }}
    />
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{children}</div>;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Tab: Overview ───────────────────────────────────────────────────────────

const SPRINT_START = new Date('2026-06-01');

function OverviewTab() {
  const [metrics, setMetrics] = useState(() => load(KEYS.metrics, DEFAULT_METRICS));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(metrics);
  const contacts = load(KEYS.contacts, []);

  const now = new Date();
  const elapsed = Math.min(30, Math.max(0, Math.ceil((now - SPRINT_START) / 86400000)));
  const remaining = Math.max(0, 30 - elapsed);

  const todayStr = today();
  const todayContacts = contacts.filter(c => c.date === todayStr).length;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  startOfWeek.setHours(0,0,0,0);
  const weekContacts = contacts.filter(c => new Date(c.date) >= startOfWeek).length;

  function saveMetrics() {
    save(KEYS.metrics, draft);
    setMetrics(draft);
    setEditing(false);
  }

  const TARGETS = { clientsSigned:5, contacts:100, discovery:18, demos:12, proposals:8 };
  const MRR_TARGET = 3485;
  const mrrNow = metrics.clientsSigned * 697;

  function metricColor(cur, tgt) {
    const p = cur / tgt;
    return p >= 1 ? C.green : p >= 0.6 ? C.yellow : C.red;
  }

  const FUNNEL = [
    { label:'Contacts', cur: metrics.contacts, tgt: 100 },
    { label:'Discovery', cur: metrics.discovery, tgt: 18, rate:'18%' },
    { label:'Demo', cur: metrics.demos, tgt: 12, rate:'67%' },
    { label:'Proposal', cur: metrics.proposals, tgt: 8, rate:'67%' },
    { label:'Signed', cur: metrics.clientsSigned, tgt: 5, rate:'63%' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Sprint progress */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
          <span style={{ color: C.muted }}>Sprint Progress — June 2026</span>
          <span style={{ fontWeight:600 }}>Day {elapsed} of 30 · <span style={{ color: C.teal }}>{remaining} days left</span></span>
        </div>
        <Bar value={elapsed} max={30} height={8} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted, marginTop:4 }}>
          <span>June 1</span><span>{Math.round((elapsed/30)*100)}% elapsed</span><span>June 30</span>
        </div>
      </Card>

      {/* Big metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12 }}>
        {[
          { label:'Clients Signed', cur: metrics.clientsSigned, tgt: TARGETS.clientsSigned },
          { label:'MRR', cur: mrrNow, tgt: MRR_TARGET, prefix:'$' },
          { label:'Contacts Made', cur: metrics.contacts, tgt: TARGETS.contacts },
          { label:'Discovery Calls', cur: metrics.discovery, tgt: TARGETS.discovery },
          { label:'Demos Delivered', cur: metrics.demos, tgt: TARGETS.demos },
          { label:'Proposals Sent', cur: metrics.proposals, tgt: TARGETS.proposals },
        ].map(({ label, cur, tgt, prefix='' }) => (
          <Card key={label} style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
            <div style={{ fontSize:26, fontWeight:800, color: metricColor(cur, tgt) }}>
              {prefix}{cur.toLocaleString()}
              <span style={{ fontSize:13, fontWeight:400, color:C.muted }}>/{tgt.toLocaleString()}</span>
            </div>
            <Bar value={cur} max={tgt} color={metricColor(cur, tgt)} style={{ marginTop:8 }} />
          </Card>
        ))}
      </div>

      {/* Edit metrics */}
      <div style={{ display:'flex', gap:8 }}>
        {editing ? (
          <>
            <Btn onClick={saveMetrics}>Save</Btn>
            <Btn variant="ghost" onClick={() => { setDraft(metrics); setEditing(false); }}>Cancel</Btn>
          </>
        ) : (
          <Btn variant="ghost" onClick={() => { setDraft(metrics); setEditing(true); }}>Edit Metrics</Btn>
        )}
      </div>

      {editing && (
        <Card>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12 }}>
            {[
              ['clientsSigned','Clients Signed'],['contacts','Contacts Made'],
              ['discovery','Discovery Calls'],['demos','Demos Delivered'],['proposals','Proposals Sent'],
            ].map(([k,label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input type="number" value={draft[k]} onChange={v => setDraft(d => ({ ...d, [k]: parseInt(v)||0 }))} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Funnel + Weekly */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14, fontSize:13 }}>Conversion Funnel</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FUNNEL.map(({ label, cur, tgt, rate }) => {
              const pct = Math.min(100, Math.round((cur/tgt)*100));
              const col = pct >= 100 ? C.green : pct >= 60 ? C.yellow : C.red;
              return (
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ fontWeight:600 }}>{label} {rate && <span style={{ color:C.muted, fontWeight:400 }}>({rate})</span>}</span>
                    <span style={{ color: col }}>{cur} / {tgt}</span>
                  </div>
                  <div style={{ position:'relative', background: C.border, borderRadius:999, height:18, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:col, transition:'width .3s' }} />
                    <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', mixBlendMode:'overlay' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Card>
            <div style={{ fontWeight:700, marginBottom:12, fontSize:13 }}>This Week vs Target</div>
            {[
              { label:'Contacts', cur: weekContacts, lo:25, hi:25 },
              { label:'Discovery Calls', cur:0, lo:4, hi:5 },
              { label:'Demos', cur:0, lo:2, hi:3 },
              { label:'Closes', cur:0, lo:1, hi:2 },
            ].map(({ label, cur, lo, hi }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:12, width:110, flexShrink:0 }}>{label}</span>
                <div style={{ flex:1, background:C.border, borderRadius:999, height:6, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(100, (cur/hi)*100)}%`, height:'100%', background: cur>=hi ? C.green : cur>=lo ? C.yellow : C.red }} />
                </div>
                <span style={{ fontSize:11, color:C.muted, width:50, textAlign:'right' }}>{cur}/{lo}–{hi}</span>
              </div>
            ))}
          </Card>

          <Card style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Today's Contacts</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span style={{ fontSize:36, fontWeight:800, color: todayContacts>=5 ? C.green : todayContacts>=3 ? C.yellow : C.red }}>{todayContacts}</span>
              <span style={{ color:C.muted }}>/ 5 target</span>
              <Badge color={todayContacts>=5 ? C.green : todayContacts>=3 ? C.yellow : C.red}>
                {todayContacts>=5 ? 'On Track' : todayContacts>=3 ? 'Getting There' : 'Behind'}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Pipeline ───────────────────────────────────────────────────────────

const EMPTY_DEAL = { company:'', contact:'', vertical:'Other', stage:'Outreach', lastContact:today(), nextAction:'', due:'', notes:'', priority:'Medium', value:'', status:'Warm' };

function DealForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div><Label>Company</Label><Input value={f.company} onChange={v => set('company',v)} placeholder="Acme Co" /></div>
        <div><Label>Contact</Label><Input value={f.contact} onChange={v => set('contact',v)} placeholder="Jane Smith" /></div>
        <div><Label>Vertical</Label><Sel value={f.vertical} onChange={v => set('vertical',v)} options={VERTICALS} /></div>
        <div><Label>Stage</Label><Sel value={f.stage} onChange={v => set('stage',v)} options={STAGES} /></div>
        <div><Label>Priority</Label><Sel value={f.priority} onChange={v => set('priority',v)} options={PRIORITIES} /></div>
        <div><Label>Status</Label><Sel value={f.status} onChange={v => set('status',v)} options={STATUSES} /></div>
        <div><Label>Deal Value</Label><Input value={f.value} onChange={v => set('value',v)} placeholder="$697/mo or referral" /></div>
        <div><Label>Last Contact</Label><Input type="date" value={f.lastContact} onChange={v => set('lastContact',v)} /></div>
      </div>
      <div><Label>Next Action</Label><Input value={f.nextAction} onChange={v => set('nextAction',v)} placeholder="Schedule demo..." /></div>
      <div><Label>Next Action Due</Label><Input type="date" value={f.due} onChange={v => set('due',v)} /></div>
      <div><Label>Notes</Label><Textarea value={f.notes} onChange={v => set('notes',v)} rows={3} /></div>
      <div style={{ display:'flex', gap:8, marginTop:4 }}>
        <Btn onClick={() => { if(f.company && f.contact) onSave(f); }}>Save Deal</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

const statusColors = { Hot:C.red, Warm:C.yellow, Cold:C.blue, Stalled:C.muted };
const priorityColors = { High:C.red, Medium:C.yellow, Low:C.muted };

function PipelineTab() {
  const [deals, setDeals] = useState(() => { const s = load(KEYS.deals, null); return s || DEFAULT_DEALS; });
  const [filterStage, setFilterStage] = useState('All');
  const [editDeal, setEditDeal] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  function persist(d) { setDeals(d); save(KEYS.deals, d); }
  function handleAdd(data) { persist([...deals, { ...data, id:`d${Date.now()}`, createdAt:today() }]); setAddOpen(false); }
  function handleEdit(data) { persist(deals.map(d => d.id===editDeal.id ? { ...editDeal, ...data } : d)); setEditDeal(null); }
  function handleDelete(id) { if(confirm('Delete this deal?')) persist(deals.filter(d => d.id!==id)); }

  const overdueCount = deals.filter(d => d.due && isOverdue(d.due) && d.stage!=='Archived').length;
  const filtered = deals.filter(d => filterStage==='All' || d.stage===filterStage);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {['All',...STAGES].map(s => (
            <button key={s} onClick={() => setFilterStage(s)} style={{
              fontSize:11, padding:'4px 12px', borderRadius:999, border:`1px solid ${filterStage===s ? C.teal : C.border}`,
              background: filterStage===s ? C.teal+'22' : 'transparent', color: filterStage===s ? C.teal : C.muted, cursor:'pointer', fontWeight:600,
            }}>
              {s} {s!=='All' && `(${deals.filter(d=>d.stage===s).length})`}
            </button>
          ))}
          {overdueCount > 0 && <Badge color={C.red}>{overdueCount} overdue</Badge>}
        </div>
        <Btn onClick={() => setAddOpen(true)}>+ Add Deal</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
        {filtered.map(deal => {
          const dsc = daysSince(deal.lastContact);
          const overdue = deal.due && isOverdue(deal.due);
          return (
            <Card key={deal.id} style={{ borderLeft: deal.priority==='High' ? `3px solid ${C.red}` : undefined, padding:16, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{deal.company}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{deal.contact} · {deal.vertical}</div>
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:8 }}>
                  <button onClick={() => setEditDeal(deal)} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13 }}>✎</button>
                  <button onClick={() => handleDelete(deal.id)} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:14 }}>×</button>
                </div>
              </div>

              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Badge color={statusColors[deal.status]}>{deal.status}</Badge>
                <Badge color={priorityColors[deal.priority]}>{deal.priority}</Badge>
                <Badge color={C.teal}>{deal.stage}</Badge>
              </div>

              {deal.nextAction && (
                <div style={{ background: overdue ? C.red+'18' : C.border+'66', borderRadius:6, padding:'6px 10px', fontSize:12, color: overdue ? C.red : C.muted }}>
                  {overdue && '⚠ '}{deal.nextAction}
                  {deal.due && <span style={{ opacity:.7, marginLeft:4 }}>· {deal.due}</span>}
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted, marginTop:2 }}>
                <span style={{ color: priorityColors[deal.priority] }}>{deal.priority} priority</span>
                <span>{deal.value}</span>
                <span style={{ color: dsc > 3 ? C.red : C.muted }}>{dsc}d since contact</span>
              </div>

              {deal.notes && (
                <div style={{ fontSize:11, color:C.muted, borderTop:`1px solid ${C.border}`, paddingTop:8, lineHeight:1.5 }}>
                  {deal.notes.length > 120 ? deal.notes.slice(0,120)+'…' : deal.notes}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Deal">
        <DealForm initial={EMPTY_DEAL} onSave={handleAdd} onClose={() => setAddOpen(false)} />
      </Modal>
      <Modal open={!!editDeal} onClose={() => setEditDeal(null)} title={`Edit — ${editDeal?.company}`}>
        {editDeal && <DealForm initial={editDeal} onSave={handleEdit} onClose={() => setEditDeal(null)} />}
      </Modal>
    </div>
  );
}

// ── Tab: Contacts ───────────────────────────────────────────────────────────

const EMPTY_CONTACT = { company:'', contact:'', phone:'', email:'', vertical:'Cleaning', method:'Phone Call', outcome:'No Answer', notes:'', date:today() };
const outcomeColor = { 'Connected - Qualified':C.green, 'Discovery Call Booked':C.green, 'Demo Booked':C.green, 'Connected - Disqualified':C.yellow, 'Voicemail Left':C.blue, 'No Answer':C.muted, 'Not Interested':C.red };

function ContactsTab() {
  const [contacts, setContacts] = useState(() => load(KEYS.contacts, []));
  const [f, setF] = useState(EMPTY_CONTACT);
  const [showForm, setShowForm] = useState(false);
  const [fv, setFv] = useState('All');
  const [fo, setFo] = useState('All');

  function persist(c) { setContacts(c); save(KEYS.contacts, c); }
  function addContact() {
    if (!f.company || !f.contact) return;
    persist([{ ...f, id:`c${Date.now()}` }, ...contacts]);
    setF({ ...EMPTY_CONTACT, date:today() });
    setShowForm(false);
  }

  const todayStr = today();
  const todayCount = contacts.filter(c => c.date===todayStr).length;
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate()-startOfWeek.getDay()+1); startOfWeek.setHours(0,0,0,0);
  const weekCount = contacts.filter(c => new Date(c.date)>=startOfWeek).length;

  const filtered = contacts
    .filter(c => fv==='All' || c.vertical===fv)
    .filter(c => fo==='All' || c.outcome===fo);

  function exportCsv() {
    const rows = [['Date','Company','Contact','Phone','Email','Vertical','Method','Outcome','Notes'],
      ...contacts.map(c => [c.date,c.company,c.contact,c.phone,c.email,c.vertical,c.method,c.outcome,c.notes])
    ].map(r => r.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows],{type:'text/csv'}));
    a.download = 'sprint-contacts.csv'; a.click();
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { label:'Today', val:todayCount, tgt:5 },
          { label:'This Week', val:weekCount, tgt:25 },
          { label:'Connected', val:contacts.filter(c=>c.outcome.startsWith('Connected')||c.outcome.includes('Booked')).length, tgt:null },
          { label:'Calls Booked', val:contacts.filter(c=>c.outcome.includes('Booked')).length, tgt:null },
        ].map(({ label, val, tgt }) => (
          <Card key={label} style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
            <div style={{ fontSize:28, fontWeight:800, color: tgt ? (val>=tgt?C.green:val>=tgt*0.6?C.yellow:C.red) : C.teal }}>
              {val}{tgt && <span style={{ fontSize:14, fontWeight:400, color:C.muted }}>/{tgt}</span>}
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <Btn onClick={() => setShowForm(!showForm)}>+ Log Contact</Btn>
        <Btn variant="ghost" onClick={exportCsv}>CSV Export</Btn>
        <Sel value={fv} onChange={setFv} options={['All',...VERTICALS]} style={{ width:140 }} />
        <Sel value={fo} onChange={setFo} options={['All',...OUTCOMES]} style={{ width:200 }} />
        <span style={{ fontSize:11, color:C.muted, marginLeft:'auto' }}>{filtered.length} entries</span>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <div style={{ fontWeight:700, marginBottom:12, fontSize:13 }}>Log New Contact</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10, marginBottom:12 }}>
            <div><Label>Company *</Label><Input value={f.company} onChange={v => setF(x=>({...x,company:v}))} /></div>
            <div><Label>Contact *</Label><Input value={f.contact} onChange={v => setF(x=>({...x,contact:v}))} /></div>
            <div><Label>Phone</Label><Input value={f.phone} onChange={v => setF(x=>({...x,phone:v}))} /></div>
            <div><Label>Email</Label><Input value={f.email} onChange={v => setF(x=>({...x,email:v}))} /></div>
            <div><Label>Vertical</Label><Sel value={f.vertical} onChange={v => setF(x=>({...x,vertical:v}))} options={VERTICALS} /></div>
            <div><Label>Method</Label><Sel value={f.method} onChange={v => setF(x=>({...x,method:v}))} options={METHODS} /></div>
            <div><Label>Outcome</Label><Sel value={f.outcome} onChange={v => setF(x=>({...x,outcome:v}))} options={OUTCOMES} /></div>
            <div><Label>Date</Label><Input type="date" value={f.date} onChange={v => setF(x=>({...x,date:v}))} /></div>
            <div style={{ gridColumn:'1/-1' }}><Label>Notes</Label><Input value={f.notes} onChange={v => setF(x=>({...x,notes:v}))} placeholder="Quick note..." /></div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn onClick={addContact}>Log Contact</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:C.border+'66' }}>
              {['Date','Company','Contact','Vertical','Method','Outcome',''].map(h => (
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:C.muted, fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0 && (
              <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:C.muted }}>No contacts logged yet</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} style={{ borderTop:`1px solid ${C.border}` }}>
                <td style={{ padding:'8px 12px', color:C.muted }}>{c.date}</td>
                <td style={{ padding:'8px 12px', fontWeight:600 }}>{c.company}</td>
                <td style={{ padding:'8px 12px', color:C.muted }}>{c.contact}</td>
                <td style={{ padding:'8px 12px', color:C.muted }}>{c.vertical}</td>
                <td style={{ padding:'8px 12px', color:C.muted }}>{c.method}</td>
                <td style={{ padding:'8px 12px' }}><Badge color={outcomeColor[c.outcome]||C.muted}>{c.outcome}</Badge></td>
                <td style={{ padding:'8px 12px' }}>
                  <button onClick={() => persist(contacts.filter(x=>x.id!==c.id))} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:14 }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Tab: Weekly Plan ────────────────────────────────────────────────────────

const WEEKS_META = [
  { week:1, dates:'June 1–7',   focus:'Force Gualapack decision · Lock message · Build the list' },
  { week:2, dates:'June 8–14',  focus:'First close · Discovery call volume · Referral activation' },
  { week:3, dates:'June 15–21', focus:'Close to 3 clients · Referrals delivering · Onboard clients 1–2' },
  { week:4, dates:'June 22–30', focus:'Close to 5 · Pull early results · Build July pipeline' },
];

function activeWeek() {
  const diff = Math.floor((new Date() - SPRINT_START) / (7*86400000));
  return Math.min(4, Math.max(1, diff+1));
}

function WeeklyTab() {
  const [tasks, setTasks] = useState(() => { const s = load(KEYS.tasks, null); return s || DEFAULT_TASKS; });

  function toggle(id) {
    const updated = tasks.map(t => t.id===id ? { ...t, done:!t.done } : t);
    setTasks(updated); save(KEYS.tasks, updated);
  }

  const cur = activeWeek();

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {WEEKS_META.map(({ week, dates, focus }) => {
        const wt = tasks.filter(t => t.week===week);
        const done = wt.filter(t => t.done).length;
        const pct = wt.length ? Math.round((done/wt.length)*100) : 0;
        const isCur = week===cur;
        const status = done===0 ? 'Not Started' : done===wt.length ? 'Complete' : 'In Progress';
        const statusCol = status==='Complete' ? C.green : status==='In Progress' ? C.yellow : C.muted;

        return (
          <Card key={week} style={{ borderColor: isCur ? C.teal+'55' : C.border }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:700 }}>Week {week} · {dates}</span>
                  {isCur && <Badge color={C.teal}>Current</Badge>}
                  <Badge color={statusCol}>{status}</Badge>
                </div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{focus}</div>
              </div>
              <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{done}/{wt.length} done</span>
            </div>
            <Bar value={done} max={wt.length} color={statusCol} height={4} />
            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:4 }}>
              {wt.map(task => (
                <div
                  key={task.id}
                  onClick={() => toggle(task.id)}
                  style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'6px 8px', borderRadius:6, cursor:'pointer', opacity: task.done ? 0.5 : 1, transition:'opacity .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background=C.border+'44'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{
                    width:16, height:16, borderRadius:4, border:`1.5px solid ${task.done ? C.teal : C.border2}`,
                    background: task.done ? C.teal : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1,
                  }}>
                    {task.done && <span style={{ fontSize:10, color:'#07101c', fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:13, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? C.muted : C.text }}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Tab: Scripts ─────────────────────────────────────────────────────────────

const SCRIPTS = {
  shadowClose: "Here's what I want to do. Let me connect to your QuickBooks and run our system in parallel to exactly what you're doing now — you keep doing everything the same way. At the end of 30 days, I show you the delta: how much faster the invoices moved, how many reminders went out automatically, what your DSO looks like. If the numbers don't move, you owe me nothing and we part as friends. If they do, we talk about going full production. No risk, no disruption, no obligation. Can we start Monday?",
  stalled: "[Name] — I've reached out a few times and haven't heard back. I'm going to assume the timing isn't right and close out your file for now — no hard feelings at all. If that changes and cash flow becomes a priority, just reply to this email and we'll pick up exactly where we left off. Wishing you a strong rest of the month.",
  roi: "You're at [X]-day DSO. Healthy benchmark for a service business is 35 days. That [X-35] day gap, multiplied by your daily revenue, is working capital sitting in your aging report right now instead of your bank account. For a business your size, that's roughly $[X] locked up. We typically close that gap by 40% in 90 days — that's $[0.4 x gap] back in your account.",
};

const VERTICALS_DATA = [
  { name:'Cleaning', opener:"Do your property management clients pay you in 30 days, or are you regularly chasing invoices 45-60 days out?", email:"Property managers owe you money right now — we can get it", pain:"Property managers deliberately slow-walking payments, owner is ops+HR+sales with no AR system" },
  { name:'HVAC / Plumbing / Electrical', opener:"When your commercial clients are on net-45 or net-60, do your techs also create the invoices — or does billing happen after the fact and add more days to the wait?", email:"Your GC clients are sitting on invoices from 60 days ago", pain:"GC clients pay when draw comes in (60-90 days), field techs create invoices late, zero leverage to withhold service" },
  { name:'Landscaping', opener:"You're in your busiest season right now — are your HOA and commercial clients paying in 30 days, or are you watching receivables pile up while you're too busy to chase them?", email:"Peak season billing — are your HOA clients actually paying you?", pain:"HOA and commercial accounts slowest payers, peak season = peak receivables, most complex billing model" },
  { name:'Staffing', opener:"You're running payroll every week while your clients are on net-30 or net-60. How many invoices are sitting past due right now?", email:"You're floating payroll. Your clients are sitting on 30-day invoices.", pain:"Weekly payroll out, net 30-60 in, single slow-paying client can cause crisis, can't stop placing workers" },
  { name:'Agencies', opener:"Does your account team handle client relationships and invoice follow-up? Because that's a direct conflict — and most agency owners end up not chasing the invoices that matter most.", email:"Your account managers shouldn't be making collections calls", pain:"Account managers own relationships AND collections (conflict), nobody pushes on big retainer invoices, scope creep disputes" },
];

const QUALIFIERS = [
  { q:"Do you invoice clients after completing the work, or collect at time of service?", yes:"Invoice after delivery — continue", no:"Point of sale / insurance — disqualify" },
  { q:"What do you use for invoicing — QuickBooks, or something else?", yes:"QuickBooks Online or Desktop — continue", no:"NetSuite / SAP / Oracle — disqualify", maybe:"Xero / FreshBooks — note, continue with caveat" },
  { q:"Are you the one who makes decisions about billing and collections, or is someone else involved?", yes:"Owner, it's my decision — continue", no:"Committee / CFO approves — deprioritize" },
  { q:"How much time does your team spend chasing invoices each week?", yes:"Names a real number or 'too much' — Stage 2-3, close fast", maybe:"'Not that bad' — Stage 1, nurture" },
];

function ScriptsTab() {
  const [openV, setOpenV] = useState(null);
  const [copied, setCopied] = useState(null);

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Qualifier */}
      <Card>
        <div style={{ fontWeight:700, marginBottom:16, fontSize:14 }}>4-Question Qualifier</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {QUALIFIERS.map((q, i) => (
            <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:14 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:C.teal }}>Q{i+1}: {q.q}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12 }}>
                <div style={{ display:'flex', gap:8 }}><span style={{ color:C.green, fontWeight:700, width:14 }}>✓</span><span>{q.yes}</span></div>
                {q.no && <div style={{ display:'flex', gap:8 }}><span style={{ color:C.red, fontWeight:700, width:14 }}>✗</span><span>{q.no}</span></div>}
                {q.maybe && <div style={{ display:'flex', gap:8 }}><span style={{ color:C.yellow, fontWeight:700, width:14 }}>~</span><span>{q.maybe}</span></div>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Vertical scripts */}
      <Card>
        <div style={{ fontWeight:700, marginBottom:12, fontSize:14 }}>Vertical Scripts</div>
        {VERTICALS_DATA.map(v => (
          <div key={v.name} style={{ border:`1px solid ${C.border}`, borderRadius:8, marginBottom:8, overflow:'hidden' }}>
            <button onClick={() => setOpenV(openV===v.name ? null : v.name)} style={{
              width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'10px 14px', background:'transparent', border:'none', color:C.text, cursor:'pointer', fontWeight:600, fontSize:13,
            }}>
              {v.name} <span style={{ color:C.muted, fontSize:16 }}>{openV===v.name ? '−' : '+'}</span>
            </button>
            {openV===v.name && (
              <div style={{ padding:'0 14px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                <div><div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Opener</div><div style={{ background:C.border+'44', borderRadius:6, padding:'8px 12px', fontSize:12, fontStyle:'italic', color:C.text }}>{v.opener}</div></div>
                <div><div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Email Subject</div><div style={{ background:C.border+'44', borderRadius:6, padding:'8px 12px', fontSize:12, fontWeight:600 }}>{v.email}</div></div>
                <div><div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Pain to Listen For</div><div style={{ fontSize:12, color:C.muted }}>{v.pain}</div></div>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Key scripts */}
      <Card>
        <div style={{ fontWeight:700, marginBottom:16, fontSize:14 }}>Key Scripts</div>
        {[
          { key:'shadowClose', title:'Shadow Mode Close', text:SCRIPTS.shadowClose },
          { key:'stalled', title:'Stalled Deal Rescue', text:SCRIPTS.stalled },
          { key:'roi', title:'Live ROI Calculation', text:SCRIPTS.roi },
        ].map(({ key, title, text }) => (
          <div key={key} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{title}</div>
              <button onClick={() => copy(key, text)} style={{
                fontSize:11, padding:'4px 10px', borderRadius:4, border:`1px solid ${copied===key ? C.green : C.border}`,
                background:'transparent', color: copied===key ? C.green : C.muted, cursor:'pointer',
              }}>{copied===key ? 'Copied!' : 'Copy'}</button>
            </div>
            <div style={{ background:C.border+'44', borderRadius:6, padding:'10px 14px', fontSize:12, color:C.muted, fontStyle:'italic', lineHeight:1.6 }}>{text}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Tab: Referrals ──────────────────────────────────────────────────────────

const DEFAULT_PARTNERS = [
  { id:'p1', name:'James Welborn', company:'PwC', type:'Consultant', status:'Contacted', intros:0, converted:0, lastContact:'2026-05-20', nextAction:'Send Loom product walkthrough', notes:'Needs product review before intro to Mike Castro' },
  { id:'p2', name:'Ryan Williams', company:'Assistabyte', type:'Agency', status:'Contacted', intros:0, converted:0, lastContact:'2026-05-22', nextAction:'In-person coffee — bring formal agreement', notes:'Reciprocal referral. Need formal agreement with commission structure in writing.' },
  { id:'p3', name:'Diego Zerga', company:'Siegfried Group Miami', type:'CPA', status:'Not Contacted', intros:0, converted:0, lastContact:'', nextAction:'LinkedIn DM + email by June 7', notes:'Contact by June 7' },
  { id:'p4', name:'Laxman Nadesapillai', company:'Siegfried Group Miami', type:'CPA', status:'Not Contacted', intros:0, converted:0, lastContact:'', nextAction:'LinkedIn DM + email by June 7', notes:'' },
  { id:'p5', name:'Kate Binder', company:'Siegfried Group Miami', type:'CPA', status:'Not Contacted', intros:0, converted:0, lastContact:'', nextAction:'LinkedIn DM + email by June 7', notes:'' },
  { id:'p6', name:'Alexander Marina', company:'Siegfried Group Miami', type:'CPA', status:'Not Contacted', intros:0, converted:0, lastContact:'', nextAction:'LinkedIn DM + email by June 7', notes:'' },
  { id:'p7', name:'Usama Waheed', company:'Siegfried Group Miami', type:'CPA', status:'Not Contacted', intros:0, converted:0, lastContact:'', nextAction:'LinkedIn DM + email by June 7', notes:'' },
];

const PARTNER_STATUSES = ['Not Contacted','Contacted','Loom Sent','Agreement Signed','Delivering Intros','Inactive'];
const PARTNER_TYPES = ['CPA','QB ProAdvisor','Agency','Consultant','Other'];
const pStatusCol = { 'Not Contacted':C.muted,'Contacted':C.blue,'Loom Sent':C.yellow,'Agreement Signed':C.green,'Delivering Intros':C.green,'Inactive':C.muted };

const EMPTY_PARTNER = { name:'', company:'', type:'CPA', status:'Not Contacted', intros:0, converted:0, lastContact:'', nextAction:'', notes:'' };

function PartnersTab() {
  const [partners, setPartners] = useState(() => { const s = load(KEYS.partners, null); return s || DEFAULT_PARTNERS; });
  const [editP, setEditP] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  function persist(p) { setPartners(p); save(KEYS.partners, p); }
  function handleSave(data) {
    if (editP) { persist(partners.map(p => p.id===editP.id ? { ...editP, ...data } : p)); setEditP(null); }
    else { persist([...partners, { ...data, id:`p${Date.now()}` }]); setAddOpen(false); }
  }
  function handleDelete(id) { if(confirm('Delete partner?')) persist(partners.filter(p=>p.id!==id)); }

  const totalMRR = partners.reduce((s,p) => s + p.converted*697*0.2, 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Total Intros', val:partners.reduce((s,p)=>s+p.intros,0), color:C.blue },
          { label:'Clients Converted', val:partners.reduce((s,p)=>s+p.converted,0), color:C.green },
          { label:'Referral MRR', val:`$${totalMRR.toFixed(0)}/mo`, color:C.teal },
        ].map(({ label, val, color }) => (
          <Card key={label} style={{ padding:'12px 16px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
            <div style={{ fontSize:24, fontWeight:800, color }}>{val}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <Btn onClick={() => setAddOpen(true)}>+ Add Partner</Btn>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {partners.map(p => (
          <Card key={p.id} style={{ padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                  <span style={{ fontWeight:700 }}>{p.name}</span>
                  <span style={{ color:C.muted, fontSize:12 }}>· {p.company}</span>
                  <Badge color={C.muted}>{p.type}</Badge>
                  <Badge color={pStatusCol[p.status]}>{p.status}</Badge>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'4px 20px', fontSize:12, color:C.muted, marginBottom:6 }}>
                  <span>Intros: <strong style={{ color:C.text }}>{p.intros}</strong></span>
                  <span>Converted: <strong style={{ color:C.text }}>{p.converted}</strong></span>
                  <span>MRR gen: <strong style={{ color:C.green }}>${(p.converted*697*0.2).toFixed(0)}/mo</strong></span>
                  {p.lastContact && <span>Last: <strong style={{ color:C.text }}>{p.lastContact}</strong></span>}
                </div>
                {p.nextAction && <div style={{ fontSize:12, color:C.muted, background:C.border+'44', borderRadius:5, padding:'5px 10px', display:'inline-block' }}>{p.nextAction}</div>}
                {p.notes && <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{p.notes}</div>}
              </div>
              <div style={{ display:'flex', gap:4, marginLeft:12 }}>
                <button onClick={() => setEditP(p)} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:13 }}>✎</button>
                <button onClick={() => handleDelete(p.id)} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:14 }}>×</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {[{ open:addOpen, onClose:()=>setAddOpen(false), title:'New Partner', init:EMPTY_PARTNER },
        { open:!!editP, onClose:()=>setEditP(null), title:`Edit — ${editP?.name}`, init:editP }
      ].map(({ open, onClose, title, init }, i) => (
        <Modal key={i} open={open} onClose={onClose} title={title}>
          {init && <PartnerForm initial={init} onSave={handleSave} onClose={onClose} />}
        </Modal>
      ))}
    </div>
  );
}

function PartnerForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial);
  const set = (k,v) => setF(x=>({...x,[k]:v}));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div><Label>Name</Label><Input value={f.name} onChange={v=>set('name',v)} /></div>
        <div><Label>Company</Label><Input value={f.company} onChange={v=>set('company',v)} /></div>
        <div><Label>Type</Label><Sel value={f.type} onChange={v=>set('type',v)} options={PARTNER_TYPES} /></div>
        <div><Label>Status</Label><Sel value={f.status} onChange={v=>set('status',v)} options={PARTNER_STATUSES} /></div>
        <div><Label>Intros Delivered</Label><Input type="number" value={f.intros} onChange={v=>set('intros',parseInt(v)||0)} /></div>
        <div><Label>Clients Converted</Label><Input type="number" value={f.converted} onChange={v=>set('converted',parseInt(v)||0)} /></div>
        <div><Label>Last Contact</Label><Input type="date" value={f.lastContact} onChange={v=>set('lastContact',v)} /></div>
        <div><Label>Next Action</Label><Input value={f.nextAction} onChange={v=>set('nextAction',v)} /></div>
      </div>
      <div><Label>Notes</Label><Textarea value={f.notes} onChange={v=>set('notes',v)} rows={2} /></div>
      <div style={{ display:'flex', gap:8 }}>
        <Btn onClick={()=>{if(f.name)onSave(f);}}>Save</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

// ── Main Sprint Dashboard ────────────────────────────────────────────────────

const TABS = [
  { key:'overview',  label:'Overview'   },
  { key:'pipeline',  label:'Pipeline'   },
  { key:'contacts',  label:'Contacts'   },
  { key:'weekly',    label:'Weekly Plan' },
  { key:'scripts',   label:'Scripts'    },
  { key:'partners',  label:'Referrals'  },
];

export default function SprintDashboard() {
  const [tab, setTab] = useState('overview');

  const metrics = load(KEYS.metrics, DEFAULT_METRICS);
  const now = new Date();
  const elapsed = Math.min(30, Math.max(0, Math.ceil((now - SPRINT_START) / 86400000)));
  const remaining = Math.max(0, 30 - elapsed);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Sprint banner */}
      <div style={{ background:'#0a2a4a', borderBottom:`1px solid ${C.border}`, padding:'10px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontWeight:800, color:C.teal, fontSize:14 }}>JUNE SPRINT</span>
          <span style={{ color:C.muted, fontSize:12 }}>Day {elapsed} of 30</span>
          <span style={{ fontSize:12 }}><span style={{ color:C.muted }}>Remaining: </span><strong style={{ color:C.teal }}>{remaining} days</strong></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:12 }}>
            <span style={{ color:C.muted }}>Signed: </span>
            <strong style={{ color: metrics.clientsSigned>=5?C.green:metrics.clientsSigned>=3?C.yellow:C.text }}>{metrics.clientsSigned} / 5</strong>
          </span>
          <span style={{ fontSize:12 }}>
            <span style={{ color:C.muted }}>MRR: </span>
            <strong style={{ color:C.teal }}>${(metrics.clientsSigned*697).toLocaleString()}</strong>
            <span style={{ color:C.muted }}> / $3,485</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, background: C.card, paddingLeft:32, overflowX:'auto' }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding:'12px 20px', border:'none', borderBottom: tab===key ? `2px solid ${C.teal}` : '2px solid transparent',
            background:'transparent', color: tab===key ? C.teal : C.muted, fontWeight: tab===key ? 700 : 400,
            fontSize:13, cursor:'pointer', whiteSpace:'nowrap', transition:'color .15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 32px' }}>
        {tab==='overview'  && <OverviewTab />}
        {tab==='pipeline'  && <PipelineTab />}
        {tab==='contacts'  && <ContactsTab />}
        {tab==='weekly'    && <WeeklyTab />}
        {tab==='scripts'   && <ScriptsTab />}
        {tab==='partners'  && <PartnersTab />}
      </div>
    </div>
  );
}
