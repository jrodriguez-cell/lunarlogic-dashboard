import { useState } from 'react';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function nextAction(inv, pb) {
  const d    = inv.daysOverdue;
  const risk = pb?.riskLevel ?? 'medium';
  if (d > 90)  return { action: 'Escalate to collections',      urgency: 'critical', daysLabel: `${d}d overdue` };
  if (d > 60)  return { action: 'Personal call — senior contact', urgency: 'high',   daysLabel: `${d}d overdue` };
  if (d > 30)  return { action: 'Phone call + formal notice',   urgency: 'high',     daysLabel: `${d}d overdue` };
  if (d > 14)  return { action: 'Follow-up call',               urgency: 'medium',   daysLabel: `${d}d overdue` };
  if (d > 7)   return { action: 'Send reminder email',          urgency: 'medium',   daysLabel: `${d}d overdue` };
  if (d > 0)   return { action: 'Auto-reminder sent',           urgency: 'low',      daysLabel: `${d}d overdue` };
  if (risk === 'high') return { action: 'Monitor — high-risk payer', urgency: 'watch', daysLabel: 'Not yet due' };
  return { action: 'On track', urgency: 'ok', daysLabel: 'Not yet due' };
}

const URGENCY_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e', watch: '#a78bfa', ok: '#4e6a88' };
const URGENCY_LABEL = { critical: 'Critical', high: 'Urgent', medium: 'Follow up', low: 'Automated', watch: 'Watch', ok: 'On track' };

function dsoImpact(inv, totalAR) {
  if (inv.daysOverdue <= 0) return null;
  const pct    = totalAR > 0 ? inv.amount / totalAR : 0;
  const impact = Math.round(pct * inv.daysOverdue * 0.8 * 10) / 10;
  return impact >= 0.1 ? impact : null;
}

export default function ClientActionPlan({ invoices, paymentBehavior, currentDSO, isMobile }) {
  const [filter, setFilter] = useState('priority');

  const totalAR = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
  const pbMap   = Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p]));

  const allOpen = invoices
    .filter(i => i.status !== 'Paid')
    .map(inv => {
      const pb     = pbMap[inv.customer];
      const na     = nextAction(inv, pb);
      const impact = dsoImpact(inv, totalAR);
      return { ...inv, ...na, impact, pb };
    })
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, watch: 4, ok: 5 };
      return (order[a.urgency] - order[b.urgency]) || b.amount - a.amount;
    });

  const needsAction = allOpen.filter(i => filter === 'all' ? true : ['critical','high','medium'].includes(i.urgency));
  const onTrack     = allOpen.filter(i => i.urgency === 'ok' || i.urgency === 'low' || i.urgency === 'watch');

  const totalImpact  = allOpen.filter(i => i.daysOverdue > 0).reduce((s, i) => s + (i.impact ?? 0), 0);
  const projectedDSO = Math.round(Math.max(currentDSO - totalImpact, currentDSO * 0.8));
  const urgentCount  = allOpen.filter(i => ['critical','high','medium'].includes(i.urgency)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <SummaryTile label="Needs attention"         value={urgentCount}                         sub="invoices to act on"          color="var(--red)"   />
        <SummaryTile label="DSO improvement possible" value={`−${Math.round(totalImpact)}d`}     sub="if resolved this week"       color="var(--green)" />
        <SummaryTile label="Projected DSO after action" value={projectedDSO}                     sub={`currently ${Math.round(currentDSO)}d`} color="var(--teal)" style={isMobile ? { gridColumn: '1 / -1' } : {}} />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ id: 'priority', label: 'Needs action' }, { id: 'all', label: 'All open' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${filter === f.id ? 'var(--teal)' : 'var(--border)'}`,
            background: filter === f.id ? 'rgba(0,212,232,0.08)' : 'none',
            color: filter === f.id ? 'var(--teal)' : 'var(--muted)',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Action queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {needsAction.map(inv => <ActionRow key={inv.id} inv={inv} isMobile={isMobile} />)}
        {needsAction.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No urgent items — you're in great shape.
          </div>
        )}
      </div>

      {/* On track */}
      {onTrack.length > 0 && filter === 'all' && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
            LunarLogic monitoring ({onTrack.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {onTrack.map(inv => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.65 }}>
                <div style={{ display: 'flex', gap: isMobile ? 8 : 12, alignItems: 'center', minWidth: 0, flex: 1 }}>
                  {!isMobile && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>{inv.id}</span>}
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                  <span style={{ fontSize: 10, color: '#22c55e' }}>On track</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        LunarLogic automatically sends reminders on your behalf. Items marked "Automated" are handled — no action needed from you.
      </div>
    </div>
  );
}

function ActionRow({ inv, isMobile }) {
  const color = URGENCY_COLOR[inv.urgency];
  return (
    <div style={{
      padding: '12px 14px', background: 'var(--bg-card)',
      border: `1px solid ${['critical','high'].includes(inv.urgency) ? color + '44' : 'var(--border)'}`,
      borderLeft: `3px solid ${color}`, borderRadius: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            {!isMobile && <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{inv.id}</span>}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{inv.customer}</span>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.daysLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color, fontWeight: 600 }}>{inv.action}</span>
            {inv.impact != null && (
              <span style={{ fontSize: 10, color: 'var(--green)', background: 'rgba(34,197,94,0.08)', borderRadius: 4, padding: '1px 6px' }}>
                saves ~{inv.impact}d DSO
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{URGENCY_LABEL[inv.urgency]}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, sub, color, style = {} }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', ...style }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}
