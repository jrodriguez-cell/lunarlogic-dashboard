import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#00d4e8', '#22c55e', '#f59e0b', '#f97316', '#ef4444'];
const TOTAL_AR_CAP = 100000;

function fmtK(v) {
  return v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = ((d.amount / TOTAL_AR_CAP) * 100).toFixed(0);
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{label === 'Current' ? 'Current (not yet due)' : `${label} days past due`}</div>
      <div className="tooltip-row"><span>Amount</span><span>${d.amount.toLocaleString()}</span></div>
      <div className="tooltip-row"><span>Invoices</span><span>{d.count}</span></div>
      <div className="tooltip-row"><span>% of AR</span><span>{pct}%</span></div>
    </div>
  );
}

export default function ARAgingChart({ data, selectedBucket, onSelectBucket }) {
  const totalAR = data.reduce((s, d) => s + d.amount, 0);

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
          data={data}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          onClick={({ activePayload }) => {
            if (!activePayload?.length) return;
            const key = activePayload[0].payload.key;
            onSelectBucket(selectedBucket === key ? null : key);
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
            onClick={() => onSelectBucket(selectedBucket === d.key ? null : d.key)}
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
