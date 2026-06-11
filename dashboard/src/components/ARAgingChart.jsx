import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';

const BUCKETS = [
  { key: 'current', label: 'Current', test: d => d <= 0  },
  { key: '1-30',    label: '1–30',    test: d => d > 0  && d <= 30 },
  { key: '31-60',   label: '31–60',   test: d => d > 30 && d <= 60 },
  { key: '61-90',   label: '61–90',   test: d => d > 60 && d <= 90 },
  { key: '90+',     label: '90+',     test: d => d > 90 },
];
const BUCKET_COLORS = ['#00d4e8', '#22c55e', '#f59e0b', '#f97316', '#ef4444'];

const RISK_META = {
  high:   { label: 'High', color: 'var(--red)',    bg: 'rgba(239,68,68,.12)',  border: 'rgba(239,68,68,.25)'  },
  medium: { label: 'Med',  color: 'var(--yellow)', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.25)' },
  low:    { label: 'Low',  color: 'var(--green)',  bg: 'rgba(34,197,94,.12)',  border: 'rgba(34,197,94,.25)'  },
};

function fmtK(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return v > 0 ? `$${v}` : '—';
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = ((d.amount / (d._total || 1)) * 100).toFixed(0);
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{label === 'Current' ? 'Current (not yet due)' : `${label} days past due`}</div>
      <div className="tooltip-row"><span>Amount</span><span>${d.amount.toLocaleString()}</span></div>
      <div className="tooltip-row"><span>Invoices</span><span>{d.count}</span></div>
      <div className="tooltip-row"><span>% of AR</span><span>{pct}%</span></div>
    </div>
  );
}

export default function ARAgingChart({ invoices = [], paymentBehavior = [], selectedBucket, onSelectBucket, onDrill }) {
  const [sortCol, setSortCol] = useState('balance');
  const [sortDir, setSortDir] = useState(-1);

  // Single source of truth: derive all bucket data from invoices
  const openInvoices = invoices.filter(inv => inv.status !== 'Paid');

  const bucketData = BUCKETS.map(b => {
    const rows = openInvoices.filter(inv => b.test(inv.daysOverdue));
    return { ...b, bucket: b.label, amount: rows.reduce((s, i) => s + i.amount, 0), count: rows.length };
  });

  const totalAR  = bucketData.reduce((s, b) => s + b.amount, 0);
  const enriched = bucketData.map(b => ({ ...b, _total: totalAR }));

  // Per-customer aging — same invoices, same bucket logic
  const custMap = {};
  openInvoices.forEach(inv => {
    if (!custMap[inv.customer]) {
      custMap[inv.customer] = { customer: inv.customer, current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, invoiceCount: 0 };
    }
    const bKey = BUCKETS.find(b => b.test(inv.daysOverdue))?.key ?? 'current';
    custMap[inv.customer][bKey] += inv.amount;
    custMap[inv.customer].invoiceCount += 1;
  });

  const custRows = Object.values(custMap).map(row => {
    const beh = paymentBehavior.find(b => b.customer === row.customer);
    return {
      ...row,
      balance:   BUCKETS.reduce((s, b) => s + row[b.key], 0),
      avgDays:   beh?.avgDays   ?? null,
      riskLevel: beh?.riskLevel ?? 'low',
    };
  });

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(-1); }
  }

  const sorted = [...custRows].sort((a, b) => {
    const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
    return typeof av === 'string' ? sortDir * av.localeCompare(bv) : sortDir * (av - bv);
  });

  function SortIcon({ col }) {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 3 }}>↕</span>;
    return <span style={{ color: 'var(--teal)', marginLeft: 3 }}>{sortDir === -1 ? '↓' : '↑'}</span>;
  }

  function drillBucket(b) {
    const rows = openInvoices.filter(inv => b.test(inv.daysOverdue));
    onDrill?.({
      title: `AR Aging — ${b.label === 'Current' ? 'Current (not yet due)' : b.label + ' days past due'}`,
      subtitle: `$${bucketData.find(bd => bd.key === b.key)?.amount.toLocaleString()} · ${rows.length} invoice${rows.length !== 1 ? 's' : ''}`,
      source: 'AR aging schedule per ASC 310. Reserve rates: Current 1%, 1-30d 5%, 31-60d 15%, 61-90d 30%, 90+ 75%.',
      filename: `aging_${b.key}`,
      columns: INV_COLS,
      rows,
    });
  }

  function drillCustomer(row) {
    const rows = openInvoices.filter(inv => inv.customer === row.customer);
    onDrill?.({
      title: `AR Detail — ${row.customer}`,
      subtitle: `${fmtK(row.balance)} outstanding · ${row.invoiceCount} open invoice${row.invoiceCount !== 1 ? 's' : ''}`,
      source: `Risk: ${row.riskLevel}. Avg days to pay: ${row.avgDays ?? '—'}d.`,
      filename: `aging_cust_${row.customer.replace(/\s+/g, '_').toLowerCase()}`,
      columns: INV_COLS,
      rows,
    });
  }

  const thStyle = col => ({
    padding: '6px 10px',
    textAlign: col === 'customer' ? 'left' : 'right',
    fontSize: 9, fontWeight: 700, color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
    background: sortCol === col ? 'rgba(0,212,232,0.04)' : 'transparent',
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2>AR Aging</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            Total AR: <strong style={{ color: 'var(--text)' }}>{fmtK(totalAR)}</strong>
          </span>
          {selectedBucket && (
            <button className="card-action" onClick={() => onSelectBucket(null)}>Clear filter ×</button>
          )}
        </div>
      </div>

      {/* Two-column layout: chart left, legend right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, marginBottom: 16, alignItems: 'center' }}>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={enriched}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            onClick={({ activePayload }) => {
              if (!activePayload?.length) return;
              const b = BUCKETS.find(b => b.key === activePayload[0].payload.key);
              onSelectBucket(selectedBucket === b.key ? null : b.key);
              if (b) drillBucket(b);
            }}
            style={{ cursor: 'pointer' }}
          >
            <XAxis dataKey="label" tick={{ fill: '#5a7a9e', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: '#5a7a9e', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="amount" radius={[5, 5, 0, 0]} maxBarSize={48}>
              {enriched.map((d, i) => (
                <Cell key={i} fill={BUCKET_COLORS[i]} opacity={selectedBucket && selectedBucket !== d.key ? 0.25 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Bucket summary chips — vertical stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
          {bucketData.map((b, i) => (
            <div
              key={b.key}
              onClick={() => { onSelectBucket(selectedBucket === b.key ? null : b.key); drillBucket(BUCKETS[i]); }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 12, padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${selectedBucket === b.key ? BUCKET_COLORS[i] : 'var(--border)'}`,
                background: selectedBucket === b.key ? `${BUCKET_COLORS[i]}14` : 'transparent',
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: BUCKET_COLORS[i] }}>{b.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{fmtK(b.amount)}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer aging breakdown */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Aging by Customer
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={thStyle('customer')} onClick={() => handleSort('customer')}>Customer <SortIcon col="customer" /></th>
                <th style={thStyle('riskLevel')} onClick={() => handleSort('riskLevel')}>Risk <SortIcon col="riskLevel" /></th>
                <th style={thStyle('avgDays')} onClick={() => handleSort('avgDays')}>Avg Days <SortIcon col="avgDays" /></th>
                {BUCKETS.map((b, i) => (
                  <th key={b.key} style={{ ...thStyle(b.key), color: BUCKET_COLORS[i] }} onClick={() => handleSort(b.key)}>
                    {b.label} <SortIcon col={b.key} />
                  </th>
                ))}
                <th style={{ ...thStyle('balance'), color: 'var(--teal)' }} onClick={() => handleSort('balance')}>Total <SortIcon col="balance" /></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const risk = RISK_META[row.riskLevel] || RISK_META.low;
                return (
                  <tr
                    key={row.customer}
                    onClick={() => drillCustomer(row)}
                    style={{ borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '9px 10px', fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>{row.customer}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: risk.color, background: risk.bg, border: `1px solid ${risk.border}`, padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {risk.label}
                      </span>
                    </td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, color: row.avgDays > 30 ? 'var(--yellow)' : 'var(--muted)' }}>
                      {row.avgDays != null ? `${row.avgDays}d` : '—'}
                    </td>
                    {BUCKETS.map((b, bi) => (
                      <td key={b.key} style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, color: row[b.key] > 0 ? BUCKET_COLORS[bi] : 'rgba(90,122,158,0.3)' }}>
                        {fmtK(row[b.key])}
                      </td>
                    ))}
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {fmtK(row.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={3} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</td>
                {BUCKETS.map((b, bi) => {
                  const tot = bucketData.find(bd => bd.key === b.key)?.amount ?? 0;
                  return (
                    <td key={b.key} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: tot > 0 ? BUCKET_COLORS[bi] : 'rgba(90,122,158,0.3)' }}>
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
