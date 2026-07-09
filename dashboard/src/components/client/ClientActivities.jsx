import { useMemo, useState } from 'react';
import { getPromises } from '../../lib/promises';

function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TODAY = new Date('2026-06-11');

const TYPES = {
  reminder: { label: 'Reminder', color: '#00d4e8', verb: 'Reminder sent' },
  payment:  { label: 'Payment',  color: '#22c55e', verb: 'Payment applied' },
  invoice:  { label: 'Invoice',  color: '#a78bfa', verb: 'Invoice created' },
  promise:  { label: 'Promise',  color: '#f59e0b', verb: 'Promise to pay recorded' },
};
const FILTERS = ['All', 'Reminder', 'Payment', 'Invoice', 'Promise'];
const PERIODS = [
  { id: '7',   label: 'Last 7 days',  days: 7 },
  { id: '30',  label: 'Last 30 days', days: 30 },
  { id: '90',  label: 'Last 90 days', days: 90 },
  { id: 'all', label: 'All time',     days: null },
];

// Payment source columns — bank transaction detail behind an applied payment.
const PAYMENT_SOURCE_COLS = [
  { key: 'txId', label: 'Transaction' },
  { key: 'received', label: 'Received' },
  { key: 'bank', label: 'Bank' },
  { key: 'description', label: 'Bank Description' },
  { key: 'matchedCustomer', label: 'Customer' },
  { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
  { key: 'matchedInvoice', label: 'Applied To', render: v => v ?? '—' },
  { key: 'confidence', label: 'Confidence', render: v => `${v}%` },
  { key: 'rule', label: 'Match Rule' },
];

export default function ClientActivities({ data, clientId, onAction, onDrill }) {
  const [filter, setFilter] = useState('All');
  const [period, setPeriod] = useState('30');

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
      out.push({ date: (p.appliedAt || p.received)?.split('T')[0], type: 'payment', customer: p.matchedCustomer, invoice: p.matchedInvoice, payment: p, amount: p.amount, detail: `${fmtFull(p.amount)} applied${p.matchedInvoice ? ` to ${p.matchedInvoice}` : ''} (${p.status === 'Auto-Applied' ? 'auto' : 'manual'})` });
    });

    const promises = getPromises(clientId);
    Object.entries(promises).forEach(([invId, date]) => {
      const inv = invById[invId];
      out.push({ date, type: 'promise', customer: inv?.customer ?? invId, invoice: invId, inv, detail: `Promise to pay ${invId} by ${fmtDate(date)}` });
    });

    return out.filter(a => a.date).sort((a, b) => b.date.localeCompare(a.date));
  }, [data.invoices, data.payments, clientId]);

  const periodDef = PERIODS.find(p => p.id === period);
  const cutoff = periodDef?.days != null ? new Date(TODAY.getTime() - periodDef.days * 86400000).toISOString().slice(0, 10) : null;

  const visible = activities
    .filter(a => filter === 'All' || TYPES[a.type].label === filter)
    .filter(a => !cutoff || a.date >= cutoff)
    .slice(0, 120);

  // Payment activities route to their source (bank transaction); everything
  // else opens the related invoice.
  function activityTarget(a) {
    if (a.type === 'payment' && a.payment && onDrill) return () => drillPayment(a.payment);
    if (a.inv && onAction) return () => onAction(a.inv);
    return null;
  }
  function drillPayment(p) {
    onDrill({
      title: `Payment ${p.txId}`,
      subtitle: `${fmtFull(p.amount)} · ${p.matchedCustomer}${p.matchedInvoice ? ` → ${p.matchedInvoice}` : ''} · ${p.confidence}% match`,
      source: 'Source bank transaction and the rule LunarLogic used to match it to an invoice.',
      filename: `payment_${p.txId}`,
      columns: PAYMENT_SOURCE_COLS,
      rows: [p],
    });
  }

  const chipStyle = (active) => ({
    padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--teal)' : 'var(--border)'}`,
    background: active ? 'rgba(0,212,232,0.1)' : 'none', color: active ? 'var(--teal)' : 'var(--muted)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Activity</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Everything LunarLogic and your team have done — reminders, payments, invoices, and promises — newest first. Click a payment to see its bank source; click anything else to open the invoice.</div>
      </div>

      {/* Type filters */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={chipStyle(filter === f)}>{f}{f !== 'All' ? 's' : ''}</button>
        ))}
      </div>

      {/* Date filter */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>Period</span>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={chipStyle(period === p.id)}>{p.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{visible.length} item{visible.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '6px 16px' }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}activity in this period.</div>
        ) : visible.map((a, i) => {
          const t = TYPES[a.type];
          const onClick = activityTarget(a);
          const clickable = !!onClick;
          return (
            <div key={i} onClick={onClick ?? undefined}
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
                  {a.type === 'payment' && <span> · view source</span>}
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
