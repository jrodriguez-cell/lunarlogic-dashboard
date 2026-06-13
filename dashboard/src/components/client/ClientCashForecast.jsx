import { useRef, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { enrichInvoices, forecastWithin, addDays } from '../../lib/forecast';

const TODAY_ISO = '2026-06-11';
const TODAY = new Date(TODAY_ISO + 'T00:00:00');

function fmtM(v) {
  if (!v || v === 0) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function weekLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">Week of {label}</div>
      <div className="tooltip-row">
        <span style={{ color: 'var(--teal)' }}>Expected in</span>
        <span style={{ fontWeight: 700 }}>{fmtM(d?.total)}</span>
      </div>
      {d?.overdue > 0 && (
        <div className="tooltip-row"><span style={{ color: '#ef4444' }}>Overdue (collection)</span><span>{fmtM(d.overdue)}</span></div>
      )}
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{d?.items?.length ?? 0} invoice{d?.items?.length !== 1 ? 's' : ''}</div>
    </div>
  );
}

export default function ClientCashForecast({ invoices, paymentBehavior }) {
  const containerRef = useRef(null);
  const [chartW, setChartW] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(e => { const w = e[0].contentRect.width; if (w > 0) setChartW(w); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const enriched = enrichInvoices(invoices, paymentBehavior, TODAY_ISO);

  const rows30 = forecastWithin(enriched, 30);
  const rows60 = forecastWithin(enriched, 60);
  const rows90 = forecastWithin(enriched, 90);
  const overdue = enriched.filter(i => i.daysOverdue > 0);

  const total30 = rows30.reduce((s, i) => s + i.amount, 0);
  const total60 = rows60.reduce((s, i) => s + i.amount, 0);
  const total90 = rows90.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);

  // Build weekly buckets
  const n = 13;
  const weeks = Array.from({ length: n }, (_, i) => {
    const start = addDays(TODAY, i * 7);
    const end   = addDays(TODAY, (i + 1) * 7 - 1);
    return { label: weekLabel(start), start, end, low: 0, medium: 0, high: 0, overdue: 0, total: 0, items: [] };
  });
  enriched.forEach(inv => {
    const w = weeks.find(w => inv.expectedDate >= w.start && inv.expectedDate <= w.end);
    if (!w) return;
    const key = inv.isOverdue ? 'overdue' : inv.riskLevel;
    w[key]  += inv.amount;
    w.total += inv.amount;
    w.items.push(inv);
  });
  const visibleWeeks = weeks.filter(w => w.total > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Coming in — Next 30 days', value: fmtM(total30), color: 'var(--green)', sub: `${rows30.length} invoice${rows30.length !== 1 ? 's' : ''}` },
          { label: 'Coming in — Next 60 days', value: fmtM(total60), color: 'var(--teal)',  sub: `${rows60.length} invoice${rows60.length !== 1 ? 's' : ''}` },
          { label: 'Coming in — Next 90 days', value: fmtM(total90), color: 'var(--text)',  sub: `${rows90.length} invoice${rows90.length !== 1 ? 's' : ''}` },
          { label: 'In collection (overdue)',   value: fmtM(totalOverdue), color: totalOverdue > 0 ? 'var(--red)' : 'var(--green)', sub: `${overdue.length} invoice${overdue.length !== 1 ? 's' : ''}` },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14 }}>Weekly cash expected</div>
        <div ref={containerRef} style={{ width: '100%', height: 180 }}>
          {chartW > 0 && (
            <BarChart width={chartW} height={180} data={visibleWeeks} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#4e6a88', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtM} tick={{ fill: '#4e6a88', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="low"     stackId="a" fill="#22c55e" opacity={0.85} maxBarSize={40} name="On track" />
              <Bar dataKey="medium"  stackId="a" fill="#f59e0b" opacity={0.85} maxBarSize={40} name="At risk" />
              <Bar dataKey="high"    stackId="a" fill="#f97316" opacity={0.85} maxBarSize={40} name="High risk" />
              <Bar dataKey="overdue" stackId="a" fill="#ef4444" opacity={0.85} radius={[4,4,0,0]} maxBarSize={40} name="Overdue" />
            </BarChart>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {[
            { color: '#22c55e', label: 'Expected on time' },
            { color: '#f59e0b', label: 'May be delayed' },
            { color: '#f97316', label: 'Likely delayed — follow up' },
            { color: '#ef4444', label: 'In collection' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        Expected receipt dates are calculated using each customer's historical payment patterns. LunarLogic adjusts reminders automatically to maximize on-time collection.
      </div>
    </div>
  );
}
