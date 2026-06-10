import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#00d4e8', '#22c55e', '#f59e0b', '#f97316', '#ef4444'];
const TOTAL_AR_CAP = 100000;

const INV_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',       render: v => `$${v.toLocaleString()}`, csvVal: r => `$${r.amount.toLocaleString()}` },
  { key: 'issued',      label: 'Issue Date' },
  { key: 'due',         label: 'Due Date' },
  { key: 'daysOut',     label: 'Days Out',      render: (v, r) => r.status === 'Paid' ? '—' : `${v}d` },
  { key: 'daysOverdue', label: 'Days Overdue',  render: v => v > 0 ? `${v}d` : '—' },
  { key: 'status',      label: 'Status' },
];

function fmtK(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const total = payload[0].payload._total || 1;
  const pct = ((d.amount / total) * 100).toFixed(0);
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{label === 'Current' ? 'Current (not yet due)' : `${label} days past due`}</div>
      <div className="tooltip-row"><span>Amount</span><span>${d.amount.toLocaleString()}</span></div>
      <div className="tooltip-row"><span>Invoices</span><span>{d.count}</span></div>
      <div className="tooltip-row"><span>% of AR</span><span>{pct}%</span></div>
    </div>
  );
}

export default function ARAgingChart({ data, invoices, selectedBucket, onSelectBucket, onDrill }) {
  const totalAR = data.reduce((s, d) => s + d.amount, 0);
  const enriched = data.map(d => ({ ...d, _total: totalAR }));

  return (
    <div className="card">
      <div className="card-header">
        <h2>AR Aging</h2>
        {selectedBucket && (
          <button className="card-action" onClick={() => onSelectBucket(null)}>
            Clear filter ×
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={enriched}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          onClick={({ activePayload }) => {
            if (!activePayload?.length) return;
            const bucket = activePayload[0].payload;
            const key = bucket.key;
            onSelectBucket(selectedBucket === key ? null : key);
            if (invoices) {
              const filteredInvs = invoices.filter(inv => {
                const days = inv.daysOverdue;
                if (key === 'current') return days <= 0;
                if (key === '1-30')    return days > 0  && days <= 30;
                if (key === '31-60')   return days > 30 && days <= 60;
                if (key === '61-90')   return days > 60 && days <= 90;
                return days > 90;
              });
              onDrill?.({
                title: `AR Aging — ${bucket.bucket} Bucket`,
                subtitle: `$${bucket.amount.toLocaleString()} · ${bucket.count} invoices`,
                source: `AR aging schedule required under ASC 310 as the primary input for the Allowance for Doubtful Accounts (ADA) estimate. Standard reserve rates by bucket: Current 1%, 1-30 days 5%, 31-60 days 15%, 61-90 days 30%, 90+ days 75%. Invoices in this bucket should be reviewed for collectability each reporting period.`,
                filename: `aging_${bucket.key}.csv`,
                columns: INV_COLS,
                rows: filteredInvs,
              });
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <XAxis dataKey="bucket" tick={{ fill: '#5a7a9e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fill: '#5a7a9e', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="amount" radius={[5, 5, 0, 0]} maxBarSize={52}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={COLORS[i]}
                opacity={selectedBucket && selectedBucket !== d.key ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="aging-chips">
        {data.map((d, i) => (
          <div
            key={d.bucket}
            className={`aging-chip${selectedBucket === d.key ? ' selected' : ''}`}
            style={{ '--c': COLORS[i] }}
            onClick={() => {
              onSelectBucket(selectedBucket === d.key ? null : d.key);
              if (invoices) {
                const key = d.key;
                const filteredInvs = invoices.filter(inv => {
                  const days = inv.daysOverdue;
                  if (key === 'current') return days <= 0;
                  if (key === '1-30')    return days > 0  && days <= 30;
                  if (key === '31-60')   return days > 30 && days <= 60;
                  if (key === '61-90')   return days > 60 && days <= 90;
                  return days > 90;
                });
                onDrill?.({
                  title: `AR Aging — ${d.bucket} Bucket`,
                  subtitle: `$${d.amount.toLocaleString()} · ${d.count} invoices`,
                  source: `AR aging schedule required under ASC 310 as the primary input for the Allowance for Doubtful Accounts (ADA) estimate. Standard reserve rates by bucket: Current 1%, 1-30 days 5%, 31-60 days 15%, 61-90 days 30%, 90+ days 75%. Invoices in this bucket should be reviewed for collectability each reporting period.`,
                  filename: `aging_${d.key}.csv`,
                  columns: INV_COLS,
                  rows: filteredInvs,
                });
              }
            }}
          >
            <span className="chip-bucket">{d.bucket}</span>
            <span className="chip-amount">{fmtK(d.amount)}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10 }}>
        Total AR: <strong style={{ color: 'var(--text)' }}>${totalAR.toLocaleString()}</strong>
        {selectedBucket && <span style={{ color: 'var(--teal)', marginLeft: 10 }}>↑ Click bar or chip to filter invoices</span>}
        {!selectedBucket && <span style={{ marginLeft: 6, opacity: 0.6 }}>— click a bar to filter invoices</span>}
      </div>
    </div>
  );
}
