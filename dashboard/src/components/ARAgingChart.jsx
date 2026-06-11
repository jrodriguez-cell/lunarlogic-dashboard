import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';

const BUCKET_COLORS = ['#00d4e8', '#22c55e', '#f59e0b', '#f97316', '#ef4444'];
const BUCKET_KEYS   = ['current', '1-30', '31-60', '61-90', '90+'];

const RISK_META = {
  high:   { label: 'High',   color: 'var(--red)',    bg: 'rgba(239,68,68,.12)',   border: 'rgba(239,68,68,.25)'   },
  medium: { label: 'Med',    color: 'var(--yellow)', bg: 'rgba(245,158,11,.12)',  border: 'rgba(245,158,11,.25)'  },
  low:    { label: 'Low',    color: 'var(--green)',  bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.25)'   },
};

const HEALTH_LABELS = {
  high:   'Slow payer — collection action recommended',
  medium: 'Moderate — monitor closely',
  low:    'Strong — pays within terms',
};

function fmtK(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return v > 0 ? `$${v}` : '—';
}

function bucketKey(daysOverdue) {
  if (daysOverdue <= 0)  return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const totalAR = d._total || 1;
  const pct = ((d.amount / totalAR) * 100).toFixed(0);
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{label === 'Current' ? 'Current (not yet due)' : `${label} days past due`}</div>
      <div className="tooltip-row"><span>Amount</span><span>${d.amount.toLocaleString()}</span></div>
      <div className="tooltip-row"><span>Invoices</span><span>{d.count}</span></div>
      <div className="tooltip-row"><span>% of AR</span><span>{pct}%</span></div>
    </div>
  );
}

const INV_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',      render: v => `$${v.toLocaleString()}` },
  { key: 'issued',      label: 'Issue Date' },
  { key: 'due',         label: 'Due Date' },
  { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—' },
  { key: 'status',      label: 'Status' },
];

export default function ARAgingChart({ data, invoices = [], paymentBehavior = [], selectedBucket, onSelectBucket, onDrill }) {
  const [sortCol, setSortCol] = useState('balance');
  const [sortDir, setSortDir] = useState(-1);

  const totalAR  = data.reduce((s, d) => s + d.amount, 0);
  const enriched = data.map(d => ({ ...d, _total: totalAR }));

  // Build per-customer aging rows
  const custMap = {};
  invoices.filter(inv => inv.status !== 'Paid').forEach(inv => {
    if (!custMap[inv.customer]) {
      custMap[inv.customer] = { customer: inv.customer, current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, invoiceCount: 0 };
    }
    custMap[inv.customer][bucketKey(inv.daysOverdue)] += inv.amount;
    custMap[inv.customer].invoiceCount += 1;
  });

  const custRows = Object.values(custMap).map(row => {
    const behavior = paymentBehavior.find(b => b.customer === row.customer);
    return {
      ...row,
      balance:   BUCKET_KEYS.reduce((s, k) => s + row[k], 0),
      avgDays:   behavior?.avgDays   ?? null,
      riskLevel: behavior?.riskLevel ?? 'low',
      trend:     behavior?.trend     ?? 0,
    };
  });

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(-1); }
  }

  const sorted = [...custRows].sort((a, b) => {
    const av = a[sortCol] ?? 0;
    const bv = b[sortCol] ?? 0;
    if (typeof av === 'string') return sortDir * av.localeCompare(bv);
    return sortDir * (av - bv);
  });

  function SortIcon({ col }) {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 3 }}>↕</span>;
    return <span style={{ color: 'var(--teal)', marginLeft: 3 }}>{sortDir === -1 ? '↓' : '↑'}</span>;
  }

  function handleBarClick({ activePayload }) {
    if (!activePayload?.length) return;
    const bucket = activePayload[0].payload;
    const key = bucket.key;
    onSelectBucket(selectedBucket === key ? null : key);
    const rows = invoices.filter(inv => bucketKey(inv.daysOverdue) === key);
    onDrill?.({
      title: `AR Aging — ${bucket.bucket}`,
      subtitle: `$${bucket.amount.toLocaleString()} · ${bucket.count} invoices`,
      source: 'AR aging schedule per ASC 310. Standard reserve rates: Current 1%, 1-30d 5%, 31-60d 15%, 61-90d 30%, 90+ 75%.',
      filename: `aging_${key}`,
      columns: INV_COLS,
      rows,
    });
  }

  function handleCustomerDrill(row) {
    const rows = invoices.filter(inv => inv.customer === row.customer && inv.status !== 'Paid');
    onDrill?.({
      title: `AR Detail — ${row.customer}`,
      subtitle: `${fmtK(row.balance)} outstanding · ${row.invoiceCount} open invoice${row.invoiceCount !== 1 ? 's' : ''}`,
      source: `Customer aging detail. Risk: ${row.riskLevel}. Avg days to pay: ${row.avgDays ?? '—'}d.`,
      filename: `aging_customer_${row.customer.replace(/\s+/g, '_').toLowerCase()}`,
      columns: INV_COLS,
      rows,
    });
  }

  const thStyle = (col) => ({
    padding: '6px 10px', textAlign: col === 'customer' ? 'left' : 'right',
    fontSize: 9, fontWeight: 700, color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
    background: sortCol === col ? 'rgba(0,212,232,0.04)' : 'transparent',
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="card-header">
        <h2>AR Aging</h2>
        {selectedBucket && (
          <button className="card-action" onClick={() => onSelectBucket(null)}>Clear filter ×</button>
        )}
      </div>

      {/* Waterfall bar chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={enriched}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          onClick={handleBarClick}
          style={{ cursor: 'pointer' }}
        >
          <XAxis dataKey="bucket" tick={{ fill: '#5a7a9e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fill: '#5a7a9e', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="amount" radius={[5, 5, 0, 0]} maxBarSize={48}>
            {data.map((d, i) => (
              <Cell key={i} fill={BUCKET_COLORS[i]} opacity={selectedBucket && selectedBucket !== d.key ? 0.25 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Bucket chips */}
      <div className="aging-chips" style={{ marginBottom: 20 }}>
        {data.map((d, i) => (
          <div
            key={d.bucket}
            className={`aging-chip${selectedBucket === d.key ? ' selected' : ''}`}
            style={{ '--c': BUCKET_COLORS[i] }}
            onClick={() => {
              onSelectBucket(selectedBucket === d.key ? null : d.key);
              const rows = invoices.filter(inv => bucketKey(inv.daysOverdue) === d.key);
              onDrill?.({
                title: `AR Aging — ${d.bucket}`,
                subtitle: `$${d.amount.toLocaleString()} · ${d.count} invoices`,
                source: 'AR aging schedule per ASC 310.',
                filename: `aging_${d.key}`,
                columns: INV_COLS,
                rows,
              });
            }}
          >
            <span className="chip-bucket">{d.bucket}</span>
            <span className="chip-amount">{fmtK(d.amount)}</span>
          </div>
        ))}
      </div>

      {/* Customer aging table */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Aging by Customer
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 540, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={thStyle('customer')} onClick={() => handleSort('customer')}>Customer <SortIcon col="customer" /></th>
                <th style={thStyle('riskLevel')} onClick={() => handleSort('riskLevel')}>Risk <SortIcon col="riskLevel" /></th>
                <th style={thStyle('avgDays')} onClick={() => handleSort('avgDays')}>Avg Days <SortIcon col="avgDays" /></th>
                <th style={thStyle('current')} onClick={() => handleSort('current')}>Current <SortIcon col="current" /></th>
                <th style={thStyle('1-30')} onClick={() => handleSort('1-30')}>1–30d <SortIcon col="1-30" /></th>
                <th style={thStyle('31-60')} onClick={() => handleSort('31-60')}>31–60d <SortIcon col="31-60" /></th>
                <th style={thStyle('61-90')} onClick={() => handleSort('61-90')}>61–90d <SortIcon col="61-90" /></th>
                <th style={thStyle('90+')} onClick={() => handleSort('90+')}>90+d <SortIcon col="90+" /></th>
                <th style={thStyle('balance')} onClick={() => handleSort('balance')}>Total <SortIcon col="balance" /></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const risk = RISK_META[row.riskLevel] || RISK_META.low;
                const isLast = i === sorted.length - 1;
                return (
                  <tr
                    key={row.customer}
                    title={HEALTH_LABELS[row.riskLevel]}
                    onClick={() => handleCustomerDrill(row)}
                    style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '9px 10px', fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {row.customer}
                    </td>
                    <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: risk.color, background: risk.bg, border: `1px solid ${risk.border}`, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {risk.label}
                      </span>
                    </td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, color: row.avgDays > 30 ? 'var(--yellow)' : 'var(--muted)' }}>
                      {row.avgDays != null ? `${row.avgDays}d` : '—'}
                    </td>
                    {['current', '1-30', '31-60', '61-90', '90+'].map((k, ki) => (
                      <td key={k} style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, color: row[k] > 0 ? BUCKET_COLORS[ki] : 'rgba(90,122,158,0.35)' }}>
                        {fmtK(row[k])}
                      </td>
                    ))}
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {fmtK(row.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={3} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</td>
                {['current', '1-30', '31-60', '61-90', '90+'].map((k, ki) => {
                  const tot = sorted.reduce((s, r) => s + r[k], 0);
                  return (
                    <td key={k} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: tot > 0 ? BUCKET_COLORS[ki] : 'rgba(90,122,158,0.3)' }}>
                      {fmtK(tot)}
                    </td>
                  );
                })}
                <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, fontWeight: 800, color: 'var(--teal)' }}>
                  {fmtK(totalAR)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
