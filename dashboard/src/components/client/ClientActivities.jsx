import { useMemo, useState } from 'react';
import { getPromises } from '../../lib/promises';

function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPES = {
  reminder: { label: 'Reminder', color: '#00d4e8', verb: 'Reminder sent' },
  payment:  { label: 'Payment',  color: '#22c55e', verb: 'Payment applied' },
  invoice:  { label: 'Invoice',  color: '#a78bfa', verb: 'Invoice created' },
  promise:  { label: 'Promise',  color: '#f59e0b', verb: 'Promise to pay recorded' },
};
const FILTERS = ['All', 'Reminder', 'Payment', 'Invoice', 'Promise'];

export default function ClientActivities({ data, clientId, onAction }) {
  const [filter, setFilter] = useState('All');

  const activities = useMemo(() => {
    const out = [];
    const invById = Object.fromEntries(data.invoices.map(i => [i.id, i]));

    data.invoices.forEach(inv => {
      (inv.reminders ?? []).forEach(r => {
        out.push({ date: r, type: 'reminder', customer: inv.customer, invoice: inv.id, inv, detail: `Reminder sent for ${inv.id}` });
      });
      if (inv.origin === 'wf1_auto') {
        out.push({ date: inv.issued, type: 'invoice', customer: inv.customer, invoice: inv.id, inv, amount: inv.amount, detail: `Invoice ${inv.id} auto-created and sent` });
      }
    });

    (data.payments ?? []).filter(p => p.status === 'Auto-Applied' || p.status === 'Manual').forEach(p => {
      out.push({ date: (p.appliedAt || p.received)?.split('T')[0], type: 'payment', customer: p.matchedCustomer, invoice: p.matchedInvoice, inv: invById[p.matchedInvoice], amount: p.amount, detail: `${fmtFull(p.amount)} applied${p.matchedInvoice ? ` to ${p.matchedInvoice}` : ''} (${p.status === 'Auto-Applied' ? 'auto' : 'manual'})` });
    });

    const promises = getPromises(clientId);
    Object.entries(promises).forEach(([invId, date]) => {
      const inv = invById[invId];
      out.push({ date, type: 'promise', customer: inv?.customer ?? invId, invoice: invId, inv, detail: `Promise to pay ${invId} by ${fmtDate(date)}` });
    });

    return out.filter(a => a.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 80);
  }, [data.invoices, data.payments, clientId]);

  const visible = activities.filter(a => filter === 'All' || TYPES[a.type].label === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Activity</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Everything LunarLogic and your team have done — reminders, payments, invoices, and promises — newest first.{onAction ? ' Click any item to open the invoice.' : ''}</div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
            border: `1px solid ${filter === f ? 'var(--teal)' : 'var(--border)'}`,
            background: filter === f ? 'rgba(0,212,232,0.1)' : 'none', color: filter === f ? 'var(--teal)' : 'var(--muted)',
          }}>{f}{f !== 'All' ? 's' : ''}</button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '6px 16px' }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}activity to show.</div>
        ) : visible.map((a, i) => {
          const t = TYPES[a.type];
          const clickable = !!(onAction && a.inv);
          return (
            <div key={i} onClick={clickable ? () => onAction(a.inv) : undefined}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 8px', margin: '0 -8px', borderRadius: 8, cursor: clickable ? 'pointer' : 'default', borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={clickable ? e => (e.currentTarget.style.background = 'var(--bg-hover)') : undefined}
              onMouseLeave={clickable ? e => (e.currentTarget.style.background = 'transparent') : undefined}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${t.color}` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
                  <span style={{ fontWeight: 700 }}>{a.customer}</span> — {a.detail}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                  <span style={{ color: t.color, fontWeight: 700 }}>{t.label}</span> · {fmtDate(a.date)}
                </div>
              </div>
              {clickable && <span style={{ fontSize: 14, color: 'var(--muted)', flexShrink: 0, alignSelf: 'center' }}>›</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
