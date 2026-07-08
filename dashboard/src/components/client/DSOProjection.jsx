import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Label,
} from 'recharts';

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function addDaysISO(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split('T')[0];
}

function ProjTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const actual    = payload.find(p => p.dataKey === 'actual' && p.value != null);
  const projected = payload.find(p => p.dataKey === 'projected' && p.value != null);
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{fmtDate(label)}</div>
      {actual && (
        <div className="tooltip-row"><span>DSO (actual)</span><span style={{ color: 'var(--teal)' }}>{actual.value} days</span></div>
      )}
      {projected && !actual && (
        <div className="tooltip-row"><span>DSO (projected)</span><span style={{ color: '#22c55e' }}>{projected.value} days</span></div>
      )}
    </div>
  );
}

/**
 * The money visual: historical DSO (solid) plus a dashed forward projection
 * showing where DSO lands if the open overdue items are cleared. Go-live and
 * industry-average references frame the improvement.
 */
export default function DSOProjection({ dsoTrend, goLiveDate, currentDSO, targetDSO, industryAvg = 45, projectionDays = 30 }) {
  if (!dsoTrend?.length) return null;

  const cur    = Math.round(currentDSO * 10) / 10;
  const target = Math.round(targetDSO * 10) / 10;

  const hist = dsoTrend.map(d => ({ date: d.date, actual: d.dso, projected: null }));
  hist[hist.length - 1].projected = cur; // seed so the dashed line connects to today

  const lastDate = dsoTrend[dsoTrend.length - 1].date;
  const future = [];
  for (let i = 1; i <= projectionDays; i++) {
    const t = i / projectionDays;
    const val = target + (cur - target) * Math.pow(1 - t, 1.5); // ease toward target
    future.push({ date: addDaysISO(lastDate, i), actual: null, projected: Math.round(val * 10) / 10 });
  }
  const data = [...hist, ...future];

  const lo = Math.max(0, Math.floor(Math.min(target, ...dsoTrend.map(d => d.dso)) - 4));
  const hi = Math.ceil(Math.max(industryAvg, ...dsoTrend.map(d => d.dso)) + 3);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <LegendItem color="var(--teal)" label="DSO to date" />
        <LegendItem color="#22c55e" label="Projected after remediation" dashed />
        <LegendItem color="rgba(245,158,11,0.6)" label={`Industry avg ${industryAvg}d`} dashed />
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="dsoActualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00d4e8" stopOpacity={0.16} />
              <stop offset="95%" stopColor="#00d4e8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date" tick={{ fill: '#4e6a88', fontSize: 10 }}
            axisLine={false} tickLine={false} tickFormatter={fmtDate}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            domain={[lo, hi]} tick={{ fill: '#4e6a88', fontSize: 10 }}
            axisLine={false} tickLine={false} tickFormatter={v => `${v}d`}
          />
          <Tooltip content={<ProjTooltip />} />
          <ReferenceLine y={industryAvg} stroke="rgba(245,158,11,0.5)" strokeDasharray="3 4" strokeWidth={1} />
          <ReferenceLine x={goLiveDate} stroke="var(--green)" strokeDasharray="4 3" strokeWidth={1.5}>
            <Label value="go-live" position="insideTopRight" fill="#22c55e" fontSize={9} fontWeight={700} />
          </ReferenceLine>
          <ReferenceLine x={lastDate} stroke="rgba(255,255,255,0.18)" strokeWidth={1}>
            <Label value="today" position="insideTopLeft" fill="rgba(255,255,255,0.4)" fontSize={9} />
          </ReferenceLine>
          <Area
            type="monotone" dataKey="actual" stroke="var(--teal)" strokeWidth={2}
            fill="url(#dsoActualGrad)" dot={false} connectNulls={false}
            activeDot={{ r: 4, fill: 'var(--teal)', strokeWidth: 0 }} isAnimationActive={false}
          />
          <Line
            type="monotone" dataKey="projected" stroke="#22c55e" strokeWidth={2}
            strokeDasharray="5 4" dot={false} connectNulls
            activeDot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="20" height="4" style={{ flexShrink: 0 }}>
        <line x1="0" y1="2" x2="20" y2="2" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 3' : '0'} />
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{label}</span>
    </div>
  );
}
