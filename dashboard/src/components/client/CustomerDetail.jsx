import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { customerScore, scoreBand } from '../../lib/scoring';
import { suggestTemplate, effectiveCadence } from '../../lib/cadences';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_TODAY = new Date('2026-06-11');

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}
function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }

const STATUS_CONFIG = {
  Paid:    { color: '#22c55e' },
  Sent:    { color: '#60a5fa' },
  Viewed:  { color: '#a78bfa' },
  Overdue: { color: '#ef4444' },
};
const BUCKETS = [
  { key: 'current', label: 'Current', color: '#3b4658', test: d => d <= 0 },
  { key: '1-30',    label: '1–30d',   color: '#f59e0b', test: d => d >= 1 && d <= 30 },
  { key: '31-60',   label: '31–60d',  color: '#f97316', test: d => d >= 31 && d <= 60 },
  { key: '61-90',   label: '61–90d',  color: '#ef4444', test: d => d >= 61 && d <= 90 },
  { key: '90+',     label: '90+d',    color: '#dc2626', test: d => d > 90 },
];

export default function CustomerDetail({ data, clientId, customer, onBack, onAction, onDrill }) {
  const { invoices, open, overdue, totalOpen, totalOverdue, buckets, pb, score, cadence, payments, remindersSent, paymentSeries } = useMemo(() => {
    const invoices = data.invoices.filter(i => i.customer === customer);
    const open = invoices.filter(i => i.status !== 'Paid');
    const overdue = open.filter(i => i.daysOverdue > 0);
    const totalOpen = open.reduce((s, i) => s + i.amount, 0);
    const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
    const buckets = BUCKETS.map(b => ({ ...b, amt: open.filter(i => b.test(i.daysOverdue)).reduce((s, i) => s + i.amount, 0) }));
    const pb = (data.paymentBehavior ?? []).find(p => p.customer === customer);
    const score = customerScore(pb);
    const cadence = effectiveCadence(clientId, customer, suggestTemplate(pb, score)).name;
    const payments = (data.payments ?? []).filter(p => p.matchedCustomer === customer);
    const remindersSent = open.reduce((s, i) => s + (i.reminders?.length ?? 0), 0);
    // Payments received per month over the last 6 months.
    const monthBuckets = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(CHART_TODAY.getFullYear(), CHART_TODAY.getMonth() - i, 1);
      monthBuckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = { label: MONTHS[d.getMonth()], amount: 0 };
    }
    payments.forEach(p => {
      const key = (p.appliedAt || p.received || '').slice(0, 7);
      if (monthBuckets[key]) monthBuckets[key].amount += p.amount;
    });
    const paymentSeries = Object.values(monthBuckets);
    return { invoices, open, overdue, totalOpen, totalOverdue, buckets, pb, score, cadence, payments, remindersSent, paymentSeries };
  }, [data, clientId, customer]);

  const band = scoreBand(score);
  const sortedInvoices = [...invoices].sort((a, b) => b.daysOverdue - a.daysOverdue || b.amount - a.amount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header + back */}
      <div>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}>
          <span style={{ fontSize: 15 }}>‹</span> All customers
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}>{customer}</div>
          {score != null && (
            <span title={`Payment health: ${band.label}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: band.color, background: `${band.color}15`, border: `1px solid ${band.color}35`, borderRadius: 20, padding: '2px 10px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: band.color }} />{score} · {band.label}
            </span>
          )}
        </div>
      </div>

      {/* Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <Tile label="Open balance" value={fmtM(totalOpen)} color="var(--text)" sub={`${open.length} open invoice${open.length !== 1 ? 's' : ''}`} />
        <Tile label="Overdue" value={fmtM(totalOverdue)} color={totalOverdue > 0 ? '#ef4444' : '#22c55e'} sub={`${overdue.length} invoice${overdue.length !== 1 ? 's' : ''}`} />
        <Tile label="Avg days to pay" value={pb?.avgDays != null ? `${pb.avgDays}d` : '—'} color="var(--teal)" sub={pb?.trend ? `${pb.trend}` : 'history'} />
        <Tile label="Reminders sent" value={remindersSent} color="#00d4e8" sub={`cadence: ${cadence}`} />
      </div>

      {/* Aging */}
      {totalOpen > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Open balance by age</div>
          <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
            {buckets.filter(b => b.amt > 0).map(b => (
              <div key={b.key} title={`${b.label}: ${fmtFull(b.amt)}`} style={{ width: `${(b.amt / totalOpen) * 100}%`, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(b.amt / totalOpen) > 0.12 && <span style={{ fontSize: 9, fontWeight: 700, color: '#0a0f16' }}>{Math.round((b.amt / totalOpen) * 100)}%</span>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {buckets.map(b => (
              <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                {b.label} · <span style={{ color: 'var(--muted)' }}>{fmtM(b.amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Invoices ({invoices.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr>
                {['Invoice', 'Amount', 'Issued', 'Due', 'Status', 'Overdue'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 1 || i === 5 ? 'right' : 'left', padding: '6px 10px', fontSize: 9.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map(inv => {
                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.Sent;
                return (
                  <tr key={inv.id} onClick={() => onAction(inv)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 10px', fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {inv.origin === 'wf1_auto' && <span style={{ fontSize: 8, fontWeight: 800, color: '#a78bfa', marginRight: 5 }}>AI</span>}{inv.id}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtM(inv.amount)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{inv.issued}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{inv.due}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: `${cfg.color}1f`, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: inv.daysOverdue > 0 ? cfg.color : 'var(--muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>{inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>Click any invoice to open it — payment link, reminder, promise to pay, log contact.</div>
      </div>

      {/* Payments over time */}
      {payments.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Payments received over time</div>
          <div style={{ width: '100%', height: 170 }}>
            <ResponsiveContainer>
              <BarChart data={paymentSeries} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7d8896' }} axisLine={{ stroke: '#1e2733' }} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`} tick={{ fontSize: 10, fill: '#7d8896' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#141b24', border: '1px solid #263041', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#e6edf3', fontWeight: 700 }} formatter={v => [fmtFull(v), 'Received']} />
                <Bar dataKey="amount" name="Received" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={38} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Payment history</div>
            {onDrill && (
              <button onClick={() => onDrill({
                title: `${customer} — Payment History`, subtitle: `${payments.length} payment${payments.length !== 1 ? 's' : ''}`,
                source: 'Payments matched to this customer from the bank feed.', filename: `payments_${customer.toLowerCase().replace(/\s+/g, '_')}`,
                columns: [
                  { key: 'txId', label: 'Transaction' }, { key: 'received', label: 'Received' },
                  { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
                  { key: 'matchedInvoice', label: 'Applied To', render: v => v ?? '—' },
                  { key: 'confidence', label: 'Confidence', render: v => `${v}%` }, { key: 'status', label: 'Status' },
                ],
                rows: payments,
              })} style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Export ↗</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {payments.slice(0, 10).map((p, idx) => (
              <div key={p.txId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < Math.min(payments.length, 10) - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.received}</span>
                  {p.matchedInvoice && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>→ {p.matchedInvoice}</span>}
                  <span style={{ fontSize: 9, fontWeight: 700, color: p.status === 'Auto-Applied' ? '#22c55e' : p.status === 'Manual' ? '#00d4e8' : '#f59e0b', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '1px 6px' }}>{p.status}</span>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green)' }}>{fmtM(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
    </div>
  );
}
