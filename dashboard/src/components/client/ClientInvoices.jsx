import { useState } from 'react';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const STATUS_CONFIG = {
  Paid:    { color: '#22c55e', label: 'Paid',           bg: 'rgba(34,197,94,0.1)' },
  Sent:    { color: '#60a5fa', label: 'Sent',           bg: 'rgba(96,165,250,0.1)' },
  Viewed:  { color: '#a78bfa', label: 'Viewed',         bg: 'rgba(167,139,250,0.1)' },
  Overdue: { color: '#ef4444', label: 'Overdue',        bg: 'rgba(239,68,68,0.1)' },
};

const FILTERS = ['All', 'Overdue', 'Sent', 'Viewed', 'Paid'];

export default function ClientInvoices({ invoices, paymentBehavior }) {
  const [filter, setFilter] = useState('All');
  const [sort, setSort]     = useState('urgency');

  const pbMap = Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p]));

  const urgencyOrder = { Overdue: 0, Viewed: 1, Sent: 2, Paid: 3 };

  const visible = invoices
    .filter(inv => filter === 'All' || inv.status === filter)
    .sort((a, b) => {
      if (sort === 'urgency') return (urgencyOrder[a.status] - urgencyOrder[b.status]) || b.daysOverdue - a.daysOverdue;
      if (sort === 'amount')  return b.amount - a.amount;
      if (sort === 'due')     return a.due.localeCompare(b.due);
      return 0;
    });

  const overduePct = Math.round((invoices.filter(i => i.status === 'Overdue').length / invoices.filter(i => i.status !== 'Paid').length) * 100) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Status summary chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = f === 'All' ? invoices.length : invoices.filter(i => i.status === f).length;
          const cfg   = STATUS_CONFIG[f] ?? { color: 'var(--muted)', bg: 'rgba(255,255,255,0.04)' };
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${active ? cfg.color : 'var(--border)'}`,
                background: active ? cfg.bg : 'none',
                color: active ? cfg.color : 'var(--muted)',
              }}
            >{f} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}</button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>Sort:</span>
          {[{ id: 'urgency', label: 'Priority' }, { id: 'amount', label: 'Amount' }, { id: 'due', label: 'Due date' }].map(s => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              style={{
                padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
                border: `1px solid ${sort === s.id ? 'var(--teal)' : 'var(--border)'}`,
                background: sort === s.id ? 'rgba(0,212,232,0.08)' : 'none',
                color: sort === s.id ? 'var(--teal)' : 'var(--muted)',
              }}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Invoice rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map(inv => {
          const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.Sent;
          const pb  = pbMap[inv.customer];
          return (
            <div key={inv.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderLeft: `3px solid ${cfg.color}`, borderRadius: 8,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{inv.id}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
                  <span>Issued {inv.issued}</span>
                  <span>Due {inv.due}</span>
                  {inv.daysOverdue > 0 && <span style={{ color: cfg.color, fontWeight: 600 }}>{inv.daysOverdue}d overdue</span>}
                  {pb && <span style={{ color: 'var(--muted)' }}>Avg pay: {pb.avgDays}d</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0, marginLeft: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No invoices matching this filter.
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        Invoice status reflects the latest data from QuickBooks. LunarLogic automatically sends reminders and tracks opens. Overdue invoices have active follow-up sequences running.
      </div>
    </div>
  );
}
