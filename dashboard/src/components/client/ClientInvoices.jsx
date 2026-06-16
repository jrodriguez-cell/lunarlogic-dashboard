import { useState } from 'react';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const STATUS_CONFIG = {
  Paid:    { color: '#22c55e', label: 'Paid',    bg: 'rgba(34,197,94,0.1)'   },
  Sent:    { color: '#60a5fa', label: 'Sent',    bg: 'rgba(96,165,250,0.1)'  },
  Viewed:  { color: '#a78bfa', label: 'Viewed',  bg: 'rgba(167,139,250,0.1)' },
  Overdue: { color: '#ef4444', label: 'Overdue', bg: 'rgba(239,68,68,0.1)'   },
};

const FILTERS = ['All', 'Overdue', 'Sent', 'Viewed', 'Paid'];

const INV_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',      render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'issued',      label: 'Issued' },
  { key: 'due',         label: 'Due Date' },
  { key: 'status',      label: 'Status' },
  { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—', csvVal: row => row.daysOverdue > 0 ? row.daysOverdue : '' },
];

export default function ClientInvoices({ invoices, paymentBehavior, isMobile, onDrill, onAction }) {
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

  function drillInvoice(inv) {
    const pb = pbMap[inv.customer];
    onDrill({
      title: `Invoice ${inv.id} — ${inv.customer}`,
      subtitle: `$${inv.amount.toLocaleString()} · Due ${inv.due}${inv.daysOverdue > 0 ? ` · ${inv.daysOverdue}d overdue` : ''}${pb ? ` · Customer avg pay: ${pb.avgDays}d` : ''}`,
      source: 'Invoice data from QuickBooks Online. LunarLogic tracks opens and sends automated reminders.',
      filename: `invoice_${inv.id}`,
      columns: INV_COLS,
      rows: [inv],
    });
  }

  function drillFilter(f) {
    const rows = f === 'All' ? invoices : invoices.filter(i => i.status === f);
    const total = rows.reduce((s, i) => s + i.amount, 0);
    onDrill({
      title: f === 'All' ? 'All Invoices' : `${f} Invoices`,
      subtitle: `${fmtM(total)} · ${rows.length} invoice${rows.length !== 1 ? 's' : ''}`,
      source: 'Invoice data from QuickBooks Online.',
      filename: `invoices_${f.toLowerCase()}`,
      columns: INV_COLS,
      rows,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count  = f === 'All' ? invoices.length : invoices.filter(i => i.status === f).length;
          const cfg    = STATUS_CONFIG[f] ?? { color: 'var(--muted)', bg: 'rgba(255,255,255,0.04)' };
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${active ? cfg.color : 'var(--border)'}`,
              background: active ? cfg.bg : 'none',
              color: active ? cfg.color : 'var(--muted)',
            }}>{f}{count > 0 ? ` (${count})` : ''}</button>
          );
        })}
      </div>
      {/* Sort + export row */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>Sort by:</span>
        {[{ id: 'urgency', label: 'Priority' }, { id: 'amount', label: 'Amount' }, { id: 'due', label: 'Due date' }].map(s => (
          <button key={s.id} onClick={() => setSort(s.id)} style={{
            padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${sort === s.id ? 'var(--teal)' : 'var(--border)'}`,
            background: sort === s.id ? 'rgba(0,212,232,0.08)' : 'none',
            color: sort === s.id ? 'var(--teal)' : 'var(--muted)',
          }}>{s.label}</button>
        ))}
        <button onClick={() => drillFilter(filter)} style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', flexShrink: 0 }}>
          Export ↗
        </button>
      </div>

      {/* Invoice rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map(inv => {
          const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.Sent;
          const pb  = pbMap[inv.customer];
          return (
            <div key={inv.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${cfg.color}`, borderRadius: 8, overflow: 'hidden' }}>
              <div onClick={() => drillInvoice(inv)} style={{ padding: isMobile ? '10px 12px' : '12px 16px', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      {!isMobile && <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)', flexShrink: 0 }}>{inv.id}</span>}
                      {inv.origin === 'wf1_auto' && (
                        <span style={{ fontSize: 8, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8, padding: '1px 5px', flexShrink: 0 }}>AI</span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</span>
                    </div>
                    <div style={{ display: 'flex', gap: isMobile ? 8 : 12, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
                      {!isMobile && <span>Issued {inv.issued}</span>}
                      <span>Due {inv.due}</span>
                      {inv.daysOverdue > 0 && <span style={{ color: cfg.color, fontWeight: 600 }}>{inv.daysOverdue}d overdue</span>}
                      {pb && !isMobile && <span>Avg pay: {pb.avgDays}d</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</span>
                  </div>
                </div>
              </div>
              {inv.status !== 'Paid' && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '6px 12px', display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(0,0,0,0.12)', flexWrap: 'wrap' }}>
                  <button onClick={() => onAction(inv)} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: 'pointer', background: 'rgba(0,212,232,0.12)', border: '1px solid var(--teal)', color: 'var(--teal)' }}>Take action</button>
                  <button onClick={() => drillInvoice(inv)} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: 'pointer', background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}>View & export ↗</button>
                  {inv.reminders && inv.reminders.length > 0 ? (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                      ↻ {inv.reminders.length} reminder{inv.reminders.length !== 1 ? 's' : ''} sent
                      {inv.nextReminder && ` · Next: ${new Date(inv.nextReminder).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </span>
                  ) : inv.nextReminder ? (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                      ↻ Reminder queued: {new Date(inv.nextReminder).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>No invoices matching this filter.</div>
        )}
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        Click any invoice to view detail and export. Use the Export button to download the current filtered view as CSV or Excel.
      </div>
    </div>
  );
}
