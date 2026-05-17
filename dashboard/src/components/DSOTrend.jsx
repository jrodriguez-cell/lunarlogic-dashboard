import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Label,
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
        <span style={{ color: '#00d4e8' }}>{payload[0].value} days</span>
      </div>
    </div>
  );
}

export default function DSOTrend({ data, goLiveDate, preLiveDSO, currentDSO }) {
  const improvement = preLiveDSO - currentDSO;

  return (
    <div className="card">
      <div className="card-header">
        <h2>DSO Trend — 90 Days</h2>
        <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
          ▼ {improvement}d improvement
        </span>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="dsoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00d4e8" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#00d4e8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#5a7a9e', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtDate}
            interval={17}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#5a7a9e', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}d`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={goLiveDate} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5}>
            <Label value="go-live" position="insideTopRight" fill="#22c55e" fontSize={9} fontWeight={700} />
          </ReferenceLine>
          <Area
            type="monotone"
            dataKey="dso"
            stroke="#00d4e8"
            strokeWidth={2}
            fill="url(#dsoGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#00d4e8', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
