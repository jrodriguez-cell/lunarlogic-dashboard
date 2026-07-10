import {
  ComposedChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea,
  ResponsiveContainer, Label,
} from 'recharts';

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function DPOTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const actual = payload.find(p => p.dataKey === 'actual' && p.value != null);
  if (!actual) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{fmtDate(label)}</div>
      <div className="tooltip-row"><span>DPO</span><span style={{ color: 'var(--teal)' }}>{actual.value} days</span></div>
    </div>
  );
}

/**
 * DPO trend, framed by the target "sweet spot" band. Unlike DSO (where lower is
 * always better) the healthy DPO line rises off an over-eager, too-fast baseline
 * up into the target band and then holds — paying on purpose, not on habit.
 */
export default function DPOProjection({ dpoTrend, goLiveDate, targetDPO = 30, bandLow = 28, bandHigh = 32 }) {
  if (!dpoTrend?.length) return null;

  const data = dpoTrend.map(d => ({ date: d.date, actual: d.dpo }));
  const lastDate = dpoTrend[dpoTrend.length - 1].date;

  const lo = Math.max(0, Math.floor(Math.min(...dpoTrend.map(d => d.dpo)) - 4));
  const hi = Math.ceil(Math.max(bandHigh, ...dpoTrend.map(d => d.dpo)) + 4);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <LegendItem color="var(--teal)" label="DPO to date" />
        <LegendItem color="rgba(34,197,94,0.5)" label={`Target sweet spot ${bandLow}–${bandHigh}d`} swatch />
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="dpoActualGrad" x1="0" y1="0" x2="0" y2="1">
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
          <Tooltip content={<DPOTooltip />} />
          {/* Target sweet-spot band */}
          <ReferenceArea y1={bandLow} y2={bandHigh} fill="rgba(34,197,94,0.10)" stroke="rgba(34,197,94,0.25)" strokeDasharray="3 4" />
          <ReferenceLine y={targetDPO} stroke="rgba(34,197,94,0.5)" strokeDasharray="3 4" strokeWidth={1}>
            <Label value={`target ${targetDPO}d`} position="insideBottomRight" fill="#22c55e" fontSize={9} fontWeight={700} />
          </ReferenceLine>
          <ReferenceLine x={goLiveDate} stroke="var(--green)" strokeDasharray="4 3" strokeWidth={1.5}>
            <Label value="go-live" position="insideTopRight" fill="#22c55e" fontSize={9} fontWeight={700} />
          </ReferenceLine>
          <ReferenceLine x={lastDate} stroke="rgba(255,255,255,0.18)" strokeWidth={1}>
            <Label value="today" position="insideTopLeft" fill="rgba(255,255,255,0.4)" fontSize={9} />
          </ReferenceLine>
          <Area
            type="monotone" dataKey="actual" stroke="var(--teal)" strokeWidth={2}
            fill="url(#dpoActualGrad)" dot={false} connectNulls={false}
            activeDot={{ r: 4, fill: 'var(--teal)', strokeWidth: 0 }} isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function LegendItem({ color, label, swatch }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {swatch
        ? <span style={{ width: 16, height: 10, borderRadius: 2, background: color, flexShrink: 0, display: 'inline-block' }} />
        : <svg width="20" height="4" style={{ flexShrink: 0 }}><line x1="0" y1="2" x2="20" y2="2" stroke={color} strokeWidth="2" /></svg>}
      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{label}</span>
    </div>
  );
}
