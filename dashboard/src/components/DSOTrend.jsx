import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Label,
} from 'recharts';

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{fmtDate(label)}</div>
      <div className="tooltip-row">
        <span>DSO</span>
        <span style={{ color: '#58a6ff' }}>{payload[0].value} days</span>
      </div>
    </div>
  );
}

export default function DSOTrend({ data, goLiveDate }) {
  return (
    <div className="card">
      <h2>DSO Trend — 90 Days</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#8b949e', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtDate}
            interval={17}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#8b949e', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}d`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={goLiveDate} stroke="#3fb950" strokeDasharray="4 3" strokeWidth={1.5}>
            <Label value="go-live" position="insideTopRight" fill="#3fb950" fontSize={10} fontWeight={600} />
          </ReferenceLine>
          <Line
            type="monotone"
            dataKey="dso"
            stroke="#58a6ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#58a6ff', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
