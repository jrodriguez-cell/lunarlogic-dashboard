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
  if (d > 90)  return { action: 'Escalate to collections',       urgency: 'critical', daysLabel: `${d}d overdue` };
  if (d > 60)  return { action: 'Personal call — senior contact', urgency: 'high',    daysLabel: `${d}d overdue` };
  if (d > 30)  return { action: 'Phone call + formal notice',    urgency: 'high',     daysLabel: `${d}d overdue` };
  if (d > 14)  return { action: 'Follow-up call',                urgency: 'medium',   daysLabel: `${d}d overdue` };
  if (d > 7)   return { action: 'Send reminder email',           urgency: 'medium',   daysLabel: `${d}d overdue` };
  if (d > 0)   return { action: 'Auto-reminder sent',            urgency: 'low',      daysLabel: `${d}d overdue` };
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

const ACTION_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',       render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'due',         label: 'Due Date' },
  { key: 'daysOverdue', label: 'Days Overdue',  render: v => v > 0 ? `${v}d` : '—',  csvVal: row => row.daysOverdue > 0 ? row.daysOverdue : '' },
  { key: 'action',      label: 'Recommended Action' },
  { key: 'urgency',     label: 'Priority',     render: v => URGENCY_LABEL[v] ?? v },
  { key: 'impact',      label: 'DSO Impact',   render: v => v != null ? `~${v}d` : '—', csvVal: row => row.impact ?? '' },
];

export default function ClientActionPlan({ invoices, paymentBehavior, payments, currentDSO, isMobile, onDrill, onAction }) {
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
  const onTrack     = allOpen.filter(i => ['ok','low','watch'].includes(i.urgency));

  const totalImpact  = allOpen.filter(i => i.daysOverdue > 0).reduce((s, i) => s + (i.impact ?? 0), 0);
  const projectedDSO = Math.round(Math.max(currentDSO - totalImpact, currentDSO * 0.8));
  const urgentCount  = allOpen.filter(i => ['critical','high','medium'].includes(i.urgency)).length;

  function drillAction(title, rows, sub) {
    onDrill({ title, subtitle: sub, source: 'Priority ranked by days overdue and dollar value. Recommended actions based on LunarLogic collection playbook.', filename: title.toLowerCase().replace(/\s+/g,'_'), columns: ACTION_COLS, rows });
  }

  function drillInvoice(inv) {
    const history = (payments ?? []).filter(p => p.matchedCustomer === inv.customer);
    const HIST_COLS = [
      { key: 'txId',           label: 'Transaction' },
      { key: 'received',       label: 'Date Received' },
      { key: 'amount',         label: 'Amount',   render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
      { key: 'status',         label: 'Status' },
      { key: 'matchedInvoice', label: 'Invoice',  render: v => v ?? '—' },
      { key: 'confidence',     label: 'Match %',  render: v => `${v}%` },
    ];
    const invRow = [{ ...inv, action: inv.action ?? nextAction(inv, pbMap[inv.customer]).action }];
    onDrill({
      title: `Invoice ${inv.id} — ${inv.customer}`,
      subtitle: `$${inv.amount.toLocaleString()} · Due ${inv.due} · ${inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : 'current'}`,
      source: `Payment history for ${inv.customer} — ${history.length} transaction${history.length !== 1 ? 's' : ''} on record.`,
      filename: `invoice_${inv.id}`,
      columns: [
        ...ACTION_COLS,
        ...HIST_COLS.map(c => ({ ...c, key: `_hist_${c.key}`, label: `Pmt: ${c.label}` })),
      ].slice(0, 8),
      rows: invRow.concat(history.map(h => ({ ...h, id: h.txId, customer: h.matchedCustomer, due: '—', daysOverdue: 0, action: 'Payment received', urgency: 'ok', impact: null }))),
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <SummaryTile label="Needs attention" value={urgentCount} sub="invoices to act on" color="var(--red)"
          onClick={() => drillAction('Action Required — All Urgent Invoices', allOpen.filter(i => ['critical','high','medium'].includes(i.urgency)), `${urgentCount} invoice${urgentCount !== 1 ? 's' : ''} need action`)} />
        <SummaryTile label="DSO improvement possible" value={`−${Math.round(totalImpact)}d`} sub="if resolved this week" color="var(--green)"
          onClick={() => drillAction('Overdue Invoices — DSO Impact Analysis', allOpen.filter(i => i.daysOverdue > 0), `${allOpen.filter(i=>i.daysOverdue>0).length} overdue invoices · potential ${Math.round(totalImpact)}d DSO improvement`)} />
        <SummaryTile label="Projected DSO after action" value={projectedDSO} sub={`currently ${Math.round(currentDSO)}d`} color="var(--teal)"
          style={isMobile ? { gridColumn: '1 / -1' } : {}}
          onClick={() => drillAction('Full Action Plan Export', allOpen, `${allOpen.length} open invoices with recommended actions`)} />
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
        <button onClick={() => drillAction('Full Action Plan Export', allOpen, `${allOpen.length} open invoices`)}
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' }}>
          Export all
        </button>
      </div>

      {/* Action queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {needsAction.map(inv => <ActionRow key={inv.id} inv={inv} isMobile={isMobile} onClick={() => drillInvoice(inv)} onAction={() => onAction(inv)} />)}
        {needsAction.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>No urgent items — you're in great shape.</div>
        )}
      </div>

      {/* On track */}
      {onTrack.length > 0 && filter === 'all' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap' }}>
              Handled by LunarLogic ({onTrack.length})
            </div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {onTrack.map(inv => (
              <div key={inv.id} onClick={() => drillInvoice(inv)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.7, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.background='var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity='0.7'; e.currentTarget.style.background='var(--bg-card)'; }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, flex: 1 }}>
                  {!isMobile && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>{inv.id}</span>}
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                  <span style={{ fontSize: 10, color: '#22c55e' }}>On track ↗</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        Click any row to drill into invoice detail and payment history — CSV and Excel export available. Items marked "Automated" are handled by LunarLogic — no action needed.
      </div>
    </div>
  );
}

function ActionRow({ inv, isMobile, onClick, onAction }) {
  const color = URGENCY_COLOR[inv.urgency];
  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${['critical','high'].includes(inv.urgency) ? color+'44' : 'var(--border)'}`, borderLeft: `3px solid ${color}`, borderRadius: 8, overflow: 'hidden' }}>
      <div onClick={onClick} style={{ padding: '12px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              {!isMobile && <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{inv.id}</span>}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{inv.customer}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.daysLabel}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color, fontWeight: 600 }}>{inv.action}</span>
              {inv.impact != null && <span style={{ fontSize: 10, color: 'var(--green)', background: 'rgba(34,197,94,0.08)', borderRadius: 4, padding: '1px 6px' }}>saves ~{inv.impact}d DSO</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{URGENCY_LABEL[inv.urgency]}</span>
          </div>
        </div>
      </div>
      {/* Quick action strip */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '6px 14px', display: 'flex', gap: 6, background: 'rgba(0,0,0,0.12)' }}>
        <QuickBtn label="Take action" primary onClick={e => { e.stopPropagation(); onAction(); }} />
        <QuickBtn label="View & export ↗" onClick={e => { e.stopPropagation(); onClick(); }} />
      </div>
    </div>
  );
}

function QuickBtn({ label, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: 'pointer',
      background: primary ? 'rgba(0,212,232,0.12)' : 'none',
      border: `1px solid ${primary ? 'var(--teal)' : 'var(--border)'}`,
      color: primary ? 'var(--teal)' : 'var(--muted)',
    }}>{label}</button>
  );
}

function SummaryTile({ label, value, sub, color, onClick, style = {} }) {
  return (
    <div onClick={onClick}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s', ...style }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'rgba(0,212,232,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <span style={{ fontSize: 10, color: 'var(--teal)', opacity: 0.6 }}>↗</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}
