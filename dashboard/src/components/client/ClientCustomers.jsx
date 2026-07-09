import { useState, useMemo } from 'react';
import { customerScore, scoreBand } from '../../lib/scoring';
import { suggestTemplate, effectiveCadence } from '../../lib/cadences';

function fmtM(v) {
  if (!v) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const BUCKETS = [
  { key: 'current', label: 'Current', color: 'var(--text-dim)', test: d => d <= 0 },
  { key: '1-30',    label: '1–30d',   color: '#f59e0b', test: d => d >= 1 && d <= 30 },
  { key: '31-60',   label: '31–60d',  color: '#f97316', test: d => d >= 31 && d <= 60 },
  { key: '61-90',   label: '61–90d',  color: '#ef4444', test: d => d >= 61 && d <= 90 },
  { key: '90+',     label: '90+d',    color: '#dc2626', test: d => d > 90 },
];

export default function ClientCustomers({ data, clientId, onAction }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    const open = data.invoices.filter(i => i.status !== 'Paid');
    const byCustomer = {};
    open.forEach(inv => {
      const c = byCustomer[inv.customer] || (byCustomer[inv.customer] = { customer: inv.customer, total: 0, overdue: 0, buckets: {}, invoices: [], worst: null });
      c.total += inv.amount;
      if (inv.daysOverdue > 0) c.overdue += inv.amount;
      const b = BUCKETS.find(bk => bk.test(inv.daysOverdue));
      if (b) c.buckets[b.key] = (c.buckets[b.key] || 0) + inv.amount;
      c.invoices.push(inv);
      if (!c.worst || inv.daysOverdue > c.worst.daysOverdue) c.worst = inv;
    });
    const pbMap = Object.fromEntries((data.paymentBehavior ?? []).map(p => [p.customer, p]));
    return Object.values(byCustomer).map(c => {
      const pb = pbMap[c.customer];
      const score = customerScore(pb);
      const cadence = effectiveCadence(clientId, c.customer, suggestTemplate(pb, score)).name;
      return { ...c, score, cadence };
    });
  }, [data.invoices, data.paymentBehavior, clientId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(r => !q || r.customer.toLowerCase().includes(q));
    list.sort((a, b) => {
      const r = sortKey === 'customer' ? a.customer.localeCompare(b.customer)
        : sortKey === 'overdue' ? a.overdue - b.overdue
        : a.total - b.total;
      return sortDir === 'asc' ? r : -r;
    });
    return list;
  }, [rows, query, sortKey, sortDir]);

  const totalOpen = rows.reduce((s, r) => s + r.total, 0);
  const topDebtors = [...rows].sort((a, b) => b.total - a.total).slice(0, 5);
  const maxTop = Math.max(...topDebtors.map(d => d.total), 1);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const cols = [
    { key: 'customer', label: 'Customer', align: 'left' },
    { key: 'health', label: 'Health', align: 'right', noSort: true },
    { key: 'cadence', label: 'Cadence', align: 'left', noSort: true },
    ...BUCKETS.map(b => ({ key: b.key, label: b.label, align: 'right', noSort: true, bucket: b })),
    { key: 'total', label: 'Total', align: 'right' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top debtors */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Top debtors</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}><span style={{ fontWeight: 800, color: 'var(--text)' }}>{fmtM(totalOpen)}</span> across {rows.length} customers</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topDebtors.map(d => (
            <div key={d.customer} onClick={() => d.worst && onAction(d.worst)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                <span style={{ color: 'var(--text-dim)' }}>{d.customer}</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmtM(d.total)}{d.overdue > 0 && <span style={{ color: '#ef4444', fontWeight: 500 }}> · {fmtM(d.overdue)} overdue</span>}</span>
              </div>
              <div style={{ height: 7, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(d.total / maxTop) * 100}%`, height: '100%', background: d.overdue > 0 ? '#f59e0b' : 'var(--teal)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', display: 'flex' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--muted)" strokeWidth="1.6" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="6" cy="6" r="4.5" /><path d="M13 13l-3.2-3.2" strokeLinecap="round" />
        </svg>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customers…"
          style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
      </div>

      {/* Aging table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              {cols.map(c => {
                const active = sortKey === c.key;
                return (
                  <th key={c.key} onClick={() => !c.noSort && toggleSort(c.key)} style={{
                    textAlign: c.align, padding: '9px 12px', fontSize: 9.5, fontWeight: 700,
                    color: active ? 'var(--teal)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    cursor: c.noSort ? 'default' : 'pointer', whiteSpace: 'nowrap', userSelect: 'none', borderBottom: '1px solid var(--border)',
                  }}>{c.label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const band = scoreBand(r.score);
              return (
                <tr key={r.customer} onClick={() => r.worst && onAction(r.worst)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{r.customer}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {r.score != null && <span title={band.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: band.color }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: band.color }} />{r.score}</span>}
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{r.cadence}</td>
                  {BUCKETS.map(b => (
                    <td key={b.key} style={{ padding: '9px 12px', textAlign: 'right', fontSize: 11.5, fontWeight: r.buckets[b.key] ? 700 : 400, color: r.buckets[b.key] ? b.color : 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtM(r.buckets[b.key])}</td>
                  ))}
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 12.5, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmtM(r.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)', fontSize: 13 }}>No customers match “{query}”.</div>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Click a customer to open their account — invoices, cadence, promise-to-pay, and payment link.</div>
    </div>
  );
}
