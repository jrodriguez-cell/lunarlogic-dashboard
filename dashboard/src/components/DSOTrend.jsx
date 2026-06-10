import { useState } from 'react';
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

const RANGES = [30, 60, 90];

export default function DSOTrend({ data, goLiveDate, preLiveDSO, currentDSO, onDrill }) {
  const [range, setRange] = useState(90);
  const improvement = preLiveDSO - currentDSO;
  const displayed = data.slice(data.length - range);

  return (
    <div className="card">
      <div className="card-header">
        <h2>DSO Trend — {range} Days</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
            ▼ {improvement}d improvement
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${range === r ? 'var(--teal)' : 'var(--border)'}`,
                  background: range === r ? 'rgba(0,212,232,0.1)' : 'none',
                  color: range === r ? 'var(--teal)' : 'var(--muted)',
                }}
              >{r}d</button>
            ))}
          </div>
          <button
            className="card-export-btn"
            onClick={() => onDrill?.({
              title: `DSO Trend — ${range} Days`,
              subtitle: 'Daily rolling DSO',
              source: 'DSO = (Total AR outstanding / Invoice revenue over trailing 90 days) × 90. Calculated daily from ERP data. Go-live annotation marks LunarLogic activation date.',
              filename: `dso_trend_${range}d`,
              columns: [
                { key: 'date', label: 'Date' },
                { key: 'dso',  label: 'DSO (days)' },
              ],
              rows: displayed,
            })}
          >
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/>
              <path d="M1 9.5h9"/>
            </svg>
            Export
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={displayed} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
            interval={Math.floor(range / 5)}
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
