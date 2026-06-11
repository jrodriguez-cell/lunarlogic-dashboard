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
        <span style={{ color: 'var(--teal)' }}>{payload[0].value} days</span>
      </div>
    </div>
  );
}

const RANGES = [30, 60, 90];

export default function DSOTrend({ data, goLiveDate, preLiveDSO, currentDSO, onDrill }) {
  const [range, setRange] = useState(90);
  const improvement = preLiveDSO - currentDSO;
  const displayed   = data.slice(data.length - range);

  // Derive period high/low from visible window
  const dsoValues  = displayed.map(d => d.dso);
  const periodHigh = Math.max(...dsoValues);
  const periodLow  = Math.min(...dsoValues);

  const stats = [
    { label: 'Current DSO',   value: `${currentDSO}d`,   color: 'var(--teal)',  bold: true },
    { label: 'Pre-LunarLogic', value: `${preLiveDSO}d`,  color: 'var(--text-dim)' },
    { label: 'Improvement',   value: `▼ ${improvement}d`, color: 'var(--green)', bold: true },
    { label: `${range}d High`, value: `${Math.round(periodHigh)}d`, color: 'var(--text-dim)' },
    { label: `${range}d Low`,  value: `${Math.round(periodLow)}d`,  color: 'var(--green)' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2>DSO Trend</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
              title:    `DSO Trend — ${range} Days`,
              subtitle: 'Daily rolling DSO',
              source:   'DSO = (Total AR / Invoice revenue over trailing 90 days) × 90. Calculated daily from ERP data. Go-live annotation marks LunarLogic activation date.',
              filename: `dso_trend_${range}d`,
              columns:  [{ key: 'date', label: 'Date' }, { key: 'dso', label: 'DSO (days)' }],
              rows:     displayed,
            })}
          >
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/><path d="M1 9.5h9"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Stat strip + chart side by side */}
      <div className="dso-trend-inner" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 24, alignItems: 'center' }}>

        {/* Left: key stats */}
        <div className="dso-stat-strip" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              display: 'flex', flexDirection: 'column',
              padding: '10px 0',
              borderBottom: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</span>
              <span style={{ fontSize: s.bold ? 22 : 16, fontWeight: s.bold ? 800 : 600, color: s.color, letterSpacing: s.bold ? -0.5 : 0, lineHeight: 1 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Right: trend chart */}
        <div>
          {/* Annotation bar above chart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, paddingLeft: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 2, background: 'var(--green)', opacity: 0.6 }} />
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Go-live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 2, background: 'var(--teal)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>DSO</span>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>
              ▼ {improvement}d since go-live · was {preLiveDSO}d
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={displayed} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="dsoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4e8" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#00d4e8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#4e6a88', fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={fmtDate}
                interval={Math.floor(range / 5)}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#4e6a88', fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${v}d`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={goLiveDate} stroke="var(--green)" strokeDasharray="4 3" strokeWidth={1.5}>
                <Label value="go-live" position="insideTopRight" fill="#22c55e" fontSize={9} fontWeight={700} />
              </ReferenceLine>
              {/* Pre-live baseline reference */}
              <ReferenceLine y={preLiveDSO} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 4" strokeWidth={1}>
                <Label value={`${preLiveDSO}d baseline`} position="insideTopLeft" fill="rgba(255,255,255,0.25)" fontSize={9} />
              </ReferenceLine>
              <Area
                type="monotone" dataKey="dso"
                stroke="var(--teal)" strokeWidth={2}
                fill="url(#dsoGrad)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--teal)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
