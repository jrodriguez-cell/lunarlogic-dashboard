import { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

// Aging bucket definitions — single source of truth for labels, keys, and colors.
// Color philosophy: teal (brand/neutral) → green (healthy) → escalating warm
// tones as age increases. Red is reserved for 90+ (write-off risk territory).
const BUCKETS = [
  { key: 'current', label: 'Current', test: d => d <= 0,              color: '#00d4e8' },
  { key: '1-30',    label: '1–30d',   test: d => d > 0  && d <= 30,   color: '#22c55e' },
  { key: '31-60',   label: '31–60d',  test: d => d > 30 && d <= 60,   color: '#f59e0b' },
  { key: '61-90',   label: '61–90d',  test: d => d > 60 && d <= 90,   color: '#f97316' },
  { key: '90+',     label: '90+d',    test: d => d > 90,              color: '#ef4444' },
];

const RISK_META = {
  high:   { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,.10)',  border: 'rgba(239,68,68,.22)'  },
  medium: { label: 'Med',  color: '#f59e0b', bg: 'rgba(245,158,11,.10)', border: 'rgba(245,158,11,.22)' },
  low:    { label: 'Low',  color: '#22c55e', bg: 'rgba(34,197,94,.10)',  border: 'rgba(34,197,94,.22)'  },
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
  { key: 'due',         label: 'Due Date' },
  { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—' },
  { key: 'status',      label: 'Status' },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = ((d.amount / (d._total || 1)) * 100).toFixed(0);
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{d.key === 'current' ? 'Current — not yet due' : `${d.label} past due`}</div>
      <div className="tooltip-row"><span>Amount</span><span>${d.amount.toLocaleString()}</span></div>
      <div className="tooltip-row"><span>Invoices</span><span>{d.count}</span></div>
      <div className="tooltip-row"><span>% of AR</span><span>{pct}%</span></div>
    </div>
  );
}

export default function ARAgingChart({ invoices = [], paymentBehavior = [], selectedBucket, onSelectBucket, onDrill }) {
  const [sortCol, setSortCol] = useState('balance');
  const [sortDir, setSortDir] = useState(-1);
  const chartRef  = useRef(null);
  const [chartW, setChartW] = useState(260);
  const [chartH, setChartH] = useState(170);
  useEffect(() => {
    if (!chartRef.current) return;
    const ro = new ResizeObserver(e => {
      const { width, height } = e[0].contentRect;
      if (width  > 0) setChartW(width);
      if (height > 0) setChartH(height);
    });
    ro.observe(chartRef.current);
    return () => ro.disconnect();
  }, []);

  // Derive all numbers from invoices — single source of truth.
  const open = invoices.filter(i => i.status !== 'Paid');

  const bucketData = BUCKETS.map(b => {
    const rows = open.filter(i => b.test(i.daysOverdue));
    return { ...b, amount: rows.reduce((s, i) => s + i.amount, 0), count: rows.length };
  });
  const totalAR  = bucketData.reduce((s, b) => s + b.amount, 0);
  const chartData = bucketData.map(b => ({ ...b, _total: totalAR }));

  // Per-customer aging
  const custMap = {};
  open.forEach(inv => {
    if (!custMap[inv.customer]) {
      custMap[inv.customer] = { customer: inv.customer, invoiceCount: 0, balance: 0 };
      BUCKETS.forEach(b => { custMap[inv.customer][b.key] = 0; });
    }
    const bKey = BUCKETS.find(b => b.test(inv.daysOverdue))?.key ?? 'current';
    custMap[inv.customer][bKey]      += inv.amount;
    custMap[inv.customer].balance    += inv.amount;
    custMap[inv.customer].invoiceCount += 1;
  });

  const custRows = Object.values(custMap).map(row => {
    const beh = paymentBehavior.find(b => b.customer === row.customer);
    return { ...row, avgDays: beh?.avgDays ?? null, riskLevel: beh?.riskLevel ?? 'low' };
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
    if (sortCol !== col) return <span style={{ opacity: 0.25, marginLeft: 3, fontSize: 9 }}>↕</span>;
    return <span style={{ color: 'var(--teal)', marginLeft: 3, fontSize: 9 }}>{sortDir === -1 ? '↓' : '↑'}</span>;
  }

  function drillBucket(b) {
    const rows = open.filter(i => b.test(i.daysOverdue));
    const bd   = bucketData.find(bd => bd.key === b.key);
    onDrill?.({
      title:    `AR Aging — ${b.key === 'current' ? 'Current (not yet due)' : b.label + ' past due'}`,
      subtitle: `${fmtK(bd?.amount)} · ${rows.length} invoice${rows.length !== 1 ? 's' : ''}`,
      source:   'ASC 310 aging schedule. Reserve rates: Current 1%, 1–30d 5%, 31–60d 15%, 61–90d 30%, 90+ 75%.',
      filename: `aging_${b.key}`,
      columns:  INV_COLS,
      rows,
    });
  }

  function drillCustomer(row) {
    const rows = open.filter(i => i.customer === row.customer);
    onDrill?.({
      title:    `AR Detail — ${row.customer}`,
      subtitle: `${fmtK(row.balance)} · ${row.invoiceCount} open invoice${row.invoiceCount !== 1 ? 's' : ''}`,
      source:   `Risk: ${row.riskLevel}. Avg days to pay: ${row.avgDays ?? '—'}d.`,
      filename: `aging_cust_${row.customer.replace(/\s+/g, '_').toLowerCase()}`,
      columns:  INV_COLS,
      rows,
    });
  }

  const th = (col, align = 'right') => ({
    padding: '6px 10px', textAlign: align,
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
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Total AR: <strong style={{ color: 'var(--text)' }}>{fmtK(totalAR)}</strong>
          </span>
          {selectedBucket && (
            <button className="card-action" onClick={() => onSelectBucket(null)}>Clear filter ×</button>
          )}
        </div>
      </div>

      {/* ── Side-by-side: waterfall chart + customer table ── */}
      <div className="ar-aging-inner" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left: bar chart + bucket summary */}
        <div className="ar-aging-chart-col">
          <div ref={chartRef} style={{ width: '100%', minHeight: 170, height: 170 }}>
            <BarChart
              width={chartW} height={chartH}
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              onClick={({ activePayload }) => {
                if (!activePayload?.length) return;
                const b = BUCKETS.find(b => b.key === activePayload[0].payload.key);
                if (!b) return;
                onSelectBucket(selectedBucket === b.key ? null : b.key);
                drillBucket(b);
              }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis dataKey="label" tick={{ fill: '#4e6a88', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fill: '#4e6a88', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} opacity={selectedBucket && selectedBucket !== d.key ? 0.2 : 0.9} />
                ))}
              </Bar>
            </BarChart>
          </div>

          {/* Bucket chips below chart */}
          <div className="ar-aging-chips" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {bucketData.map(b => (
              <div
                key={b.key}
                className="ar-aging-chip"
                onClick={() => { onSelectBucket(selectedBucket === b.key ? null : b.key); drillBucket(b); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${selectedBucket === b.key ? b.color : 'var(--border)'}`,
                  background: selectedBucket === b.key ? `${b.color}12` : 'transparent',
                  transition: 'all .14s',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, color: b.color, minWidth: 52 }}>{b.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{fmtK(b.amount)}</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', minWidth: 28, textAlign: 'right' }}>{b.count} inv</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderTop: '1px solid var(--border)', marginTop: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)' }}>TOTAL</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal)' }}>{fmtK(totalAR)}</span>
            </div>
          </div>
        </div>

        {/* Right: customer aging table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            By Customer
          </div>
          <table style={{ width: '100%', minWidth: 400, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={th('customer', 'left')} onClick={() => handleSort('customer')}>Customer <SortIcon col="customer" /></th>
                <th style={th('riskLevel')} onClick={() => handleSort('riskLevel')}>Risk <SortIcon col="riskLevel" /></th>
                <th style={th('avgDays')} onClick={() => handleSort('avgDays')}>Avg Days <SortIcon col="avgDays" /></th>
                {BUCKETS.map(b => (
                  <th key={b.key} style={{ ...th(b.key), color: b.color }} onClick={() => handleSort(b.key)}>
                    {b.label} <SortIcon col={b.key} />
                  </th>
                ))}
                <th style={{ ...th('balance'), color: 'var(--teal)' }} onClick={() => handleSort('balance')}>Total <SortIcon col="balance" /></th>
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
                    <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>{row.customer}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: risk.color, background: risk.bg, border: `1px solid ${risk.border}`, padding: '2px 6px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {risk.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, color: row.avgDays > 30 ? 'var(--yellow)' : 'var(--text-dim)' }}>
                      {row.avgDays != null ? `${row.avgDays}d` : '—'}
                    </td>
                    {BUCKETS.map(b => (
                      <td key={b.key} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, color: row[b.key] > 0 ? b.color : 'rgba(78,106,136,0.35)' }}>
                        {fmtK(row[b.key])}
                      </td>
                    ))}
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {fmtK(row.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={3} style={{ padding: '7px 10px', fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</td>
                {BUCKETS.map(b => {
                  const tot = bucketData.find(bd => bd.key === b.key)?.amount ?? 0;
                  return (
                    <td key={b.key} style={{ padding: '7px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: tot > 0 ? b.color : 'rgba(78,106,136,0.3)' }}>
                      {fmtK(tot)}
                    </td>
                  );
                })}
                <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 12, fontWeight: 800, color: 'var(--teal)' }}>
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
