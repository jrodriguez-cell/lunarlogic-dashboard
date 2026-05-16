import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3fb950', '#e3b341', '#f0883e', '#f85149', '#991b1b'];

function fmtDollar(v) {
  return v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{label} days past due</div>
      <div className="tooltip-row">
        <span>Amount</span>
        <span>${d.amount.toLocaleString()}</span>
      </div>
      <div className="tooltip-row">
        <span>Invoices</span>
        <span>{d.count}</span>
      </div>
    </div>
  );
}

export default function ARAgingChart({ data }) {
  return (
    <div className="card">
      <h2>AR Aging</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="bucket" tick={{ fill: '#8b949e', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtDollar} tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="aging-chips">
        {data.map((d, i) => (
          <div key={d.bucket} className="aging-chip" style={{ '--c': COLORS[i] }}>
            <span className="chip-bucket">{d.bucket}d</span>
            <span className="chip-count">{d.count} inv</span>
          </div>
        ))}
      </div>
    </div>
  );
}
