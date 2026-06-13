function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

export default function ClientOverview({ data, currentDSO, dsoChange, onNavigate, isMobile }) {
  const open      = data.invoices.filter(i => i.status !== 'Paid');
  const overdue   = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
  const current   = data.invoices.filter(i => i.status !== 'Paid' && i.daysOverdue <= 0);
  const next30    = open.filter(i => i.daysOverdue <= 0 && i.daysOverdue > -30);

  const totalOpen    = open.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const totalNext30  = next30.reduce((s, i) => s + i.amount, 0);

  const payments    = data.payments ?? [];
  const autoApplied = payments.filter(p => p.status === 'Auto-Applied').length;
  const pending     = payments.filter(p => p.status === 'Pending Review').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Money snapshot — 3 tiles */}
      <div>
        <SectionLabel>Where your money stands today</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
          <Tile label="Total Outstanding AR" value={fmtM(totalOpen)} sub={`${open.length} open invoice${open.length !== 1 ? 's' : ''}`} color="var(--text)" onClick={() => onNavigate('invoices')} hint="tap to view all" />
          <Tile label="Due in Next 30 Days"  value={fmtM(totalNext30)} sub={`${next30.length} invoice${next30.length !== 1 ? 's' : ''} · on track`} color="var(--teal)" onClick={() => onNavigate('cash')} hint="tap to see cash forecast" />
          <Tile label="Overdue Now"           value={fmtM(totalOverdue)} sub={`${overdue.length} invoice${overdue.length !== 1 ? 's' : ''} need attention`} color={totalOverdue > 0 ? 'var(--red)' : 'var(--green)'} onClick={() => onNavigate('action')} hint="tap to see action plan" />
        </div>
      </div>

      {/* AR Health bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>AR health breakdown</SectionLabel>
        <ARHealthBar invoices={data.invoices} />
        <div style={{ display: 'flex', gap: isMobile ? 10 : 20, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#22c55e', label: 'Current' },
            { color: '#f59e0b', label: '1–30d overdue' },
            { color: '#f97316', label: '31–60d overdue' },
            { color: '#ef4444', label: '60+ overdue' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Two panels — stack on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>What LunarLogic handled for you</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            <ActivityRow icon="✓" label="Payments auto-matched"      value={`${autoApplied} this month`}           color="var(--green)" />
            <ActivityRow icon="→" label="Awaiting your review"       value={`${pending} payment${pending !== 1 ? 's' : ''}`} color={pending > 0 ? 'var(--amber)' : 'var(--muted)'} />
            <ActivityRow icon="↑" label="Collection rate"            value={`${data.collectionEfficiency}%`}       color="var(--teal)" />
            <ActivityRow icon="↓" label="DSO reduction since go-live" value={`${Math.abs(dsoChange)} days`}        color="var(--green)" />
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>Customer payment risk</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {data.paymentBehavior.map(pb => (
              <div key={pb.customer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pb.customer}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pb.avgDays}d avg</span>
                  <RiskDot level={pb.riskLevel} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            LunarLogic sends reminders automatically based on each customer's behavior.
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>{children}</div>;
}

function Tile({ label, value, sub, color, onClick, hint }) {
  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{sub}</div>
      {hint && onClick && <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function ARHealthBar({ invoices }) {
  const open  = invoices.filter(i => i.status !== 'Paid');
  const total = open.reduce((s, i) => s + i.amount, 0);
  if (total === 0) return null;
  const buckets = [
    { min: -Infinity, max: 0,  color: '#22c55e' },
    { min: 1,  max: 30,  color: '#f59e0b' },
    { min: 31, max: 60,  color: '#f97316' },
    { min: 61, max: Infinity, color: '#ef4444' },
  ].map(b => {
    const amt = open.filter(i => i.daysOverdue >= b.min && i.daysOverdue <= b.max).reduce((s, i) => s + i.amount, 0);
    return { ...b, amt, pct: total > 0 ? (amt / total) * 100 : 0 };
  });
  return (
    <div>
      <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
        {buckets.filter(b => b.pct > 0).map((b, i) => (
          <div key={i} style={{ width: `${b.pct}%`, background: b.color, opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {b.pct > 12 && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{Math.round(b.pct)}%</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ fontSize: 10, color: 'var(--muted)' }}>{b.pct > 3 ? fmtM(b.amt) : ''}</div>
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color, fontWeight: 700, width: 14, textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function RiskDot({ level }) {
  const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Med' : 'Low';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {label}
    </div>
  );
}
