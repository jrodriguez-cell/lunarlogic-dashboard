import { useState } from 'react';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function nextAction(inv, pb) {
  const d = inv.daysOverdue;
  const risk = pb?.riskLevel ?? 'medium';
  if (d > 90)  return { action: 'Escalate to collections', urgency: 'critical', daysLabel: `${d}d overdue` };
  if (d > 60)  return { action: 'Personal call — senior contact', urgency: 'high', daysLabel: `${d}d overdue` };
  if (d > 30)  return { action: 'Phone call + formal notice', urgency: 'high', daysLabel: `${d}d overdue` };
  if (d > 14)  return { action: 'Follow-up call', urgency: 'medium', daysLabel: `${d}d overdue` };
  if (d > 7)   return { action: 'Send reminder email', urgency: 'medium', daysLabel: `${d}d overdue` };
  if (d > 0)   return { action: 'LunarLogic auto-reminder sent', urgency: 'low', daysLabel: `${d}d overdue` };
  if (risk === 'high') return { action: 'Monitor — high-risk payer', urgency: 'watch', daysLabel: 'Not yet due' };
  return { action: 'On track', urgency: 'ok', daysLabel: 'Not yet due' };
}

const URGENCY_COLOR = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#22c55e',
  watch:    '#a78bfa',
  ok:       '#4e6a88',
};

const URGENCY_LABEL = {
  critical: 'Critical',
  high:     'Urgent',
  medium:   'Follow up',
  low:      'Automated',
  watch:    'Watch',
  ok:       'On track',
};

function dsoImpact(inv, totalAR, currentDSO) {
  if (inv.daysOverdue <= 0) return null;
  const pct = totalAR > 0 ? inv.amount / totalAR : 0;
  const impact = Math.round(pct * inv.daysOverdue * 0.8 * 10) / 10;
  return impact >= 0.1 ? impact : null;
}

export default function ClientActionPlan({ invoices, paymentBehavior, currentDSO, preLiveDSO }) {
  const [filter, setFilter] = useState('all');

  const totalAR    = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
  const pbMap      = Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p]));

  const needsAction = invoices
    .filter(i => i.status !== 'Paid')
    .map(inv => {
      const pb     = pbMap[inv.customer];
      const na     = nextAction(inv, pb);
      const impact = dsoImpact(inv, totalAR, currentDSO);
      return { ...inv, ...na, impact, pb };
    })
    .filter(i => filter === 'all' ? i.urgency !== 'ok' : ['critical','high','medium'].includes(i.urgency))
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, watch: 4, ok: 5 };
      return (order[a.urgency] - order[b.urgency]) || b.amount - a.amount;
    });

  const onTrack = invoices.filter(i => i.status !== 'Paid' && i.daysOverdue <= 0);
  const totalImpact = needsAction.reduce((s, i) => s + (i.impact ?? 0), 0);
  const projectedDSO = Math.round(Math.max(currentDSO - totalImpact, currentDSO * 0.8));

  const urgentCount = needsAction.filter(i => ['critical','high','medium'].includes(i.urgency)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <SummaryTile label="Needs your attention" value={urgentCount} sub="invoices requiring action" color="var(--red)" />
        <SummaryTile label="Potential DSO improvement" value={`−${Math.round(totalImpact)}d`} sub="if resolved this week" color="var(--green)" />
        <SummaryTile label="Projected DSO after action" value={projectedDSO} sub={`currently ${Math.round(currentDSO)} days`} color="var(--teal)" />
      </div>

      {/* Filter toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { id: 'priority', label: 'Needs action' },
          { id: 'all',      label: 'All open' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${filter === f.id ? 'var(--teal)' : 'var(--border)'}`,
              background: filter === f.id ? 'rgba(0,212,232,0.08)' : 'none',
              color: filter === f.id ? 'var(--teal)' : 'var(--muted)',
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Action queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {needsAction.map(inv => (
          <ActionRow key={inv.id} inv={inv} />
        ))}
        {needsAction.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No urgent items — you're in great shape.
          </div>
        )}
      </div>

      {/* On track section */}
      {onTrack.length > 0 && filter === 'all' && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
            On track — LunarLogic monitoring ({onTrack.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {onTrack.map(inv => {
              const pb  = pbMap[inv.customer];
              const na  = nextAction(inv, pb);
              return (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.7 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{inv.id}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{inv.customer}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Due {inv.due}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                    <span style={{ fontSize: 10, color: '#22c55e' }}>On track</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        LunarLogic automatically sends reminders on your behalf based on each customer's payment history. Items marked "Automated" are being handled — no action needed from you.
      </div>
    </div>
  );
}

function ActionRow({ inv }) {
  const color = URGENCY_COLOR[inv.urgency];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 16px', background: 'var(--bg-card)',
      border: `1px solid ${inv.urgency === 'critical' || inv.urgency === 'high' ? color + '44' : 'var(--border)'}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 8,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{inv.id}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{inv.customer}</span>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.daysLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color, fontWeight: 600 }}>{inv.action}</span>
          {inv.impact != null && (
            <span style={{ fontSize: 10, color: 'var(--green)', background: 'rgba(34,197,94,0.08)', borderRadius: 4, padding: '1px 6px' }}>
              saves ~{inv.impact}d DSO
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{URGENCY_LABEL[inv.urgency]}</span>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 5 }}>{sub}</div>
    </div>
  );
}
