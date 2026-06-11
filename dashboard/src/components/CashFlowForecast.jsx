import { useRef, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, Legend,
} from 'recharts';
import { exportXLSX } from '../lib/excel';
import { FORECAST_TODAY as TODAY, addDays, enrichInvoices, forecastWithin } from '../lib/forecast';

function weekLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtM(v) {
  if (!v || v === 0) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function riskColor(riskLevel) {
  if (riskLevel === 'high')   return '#ef4444';
  if (riskLevel === 'medium') return '#f59e0b';
  return '#22c55e';
}

const EXPORT_COLS = [
  { key: 'id',              label: 'Invoice' },
  { key: 'customer',        label: 'Customer' },
  { key: 'amount',          label: 'Amount',           render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'due',             label: 'Due Date' },
  { key: 'expectedDateStr', label: 'Expected Receipt' },
  { key: 'riskLevel',       label: 'Risk' },
  { key: 'status',          label: 'Status' },
  { key: 'daysOverdue',     label: 'Days Overdue',     render: v => v > 0 ? `${v}d` : '—', csvVal: row => row.daysOverdue > 0 ? row.daysOverdue : '' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">Week of {label}</div>
      {d?.overdue > 0 && (
        <div className="tooltip-row"><span style={{ color: '#ef4444' }}>Overdue</span><span>{fmtM(d.overdue)}</span></div>
      )}
      {d?.high > 0 && (
        <div className="tooltip-row"><span style={{ color: '#f97316' }}>High risk</span><span>{fmtM(d.high)}</span></div>
      )}
      {d?.medium > 0 && (
        <div className="tooltip-row"><span style={{ color: '#f59e0b' }}>Medium risk</span><span>{fmtM(d.medium)}</span></div>
      )}
      {d?.low > 0 && (
        <div className="tooltip-row"><span style={{ color: '#22c55e' }}>Low risk</span><span>{fmtM(d.low)}</span></div>
      )}
      <div className="tooltip-row" style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
        <span>Total expected</span>
        <span style={{ color: 'var(--teal)', fontWeight: 700 }}>{fmtM(d?.total)}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>click to drill down</div>
    </div>
  );
}

export default function CashFlowForecast({ invoices = [], paymentBehavior = [], onDrill }) {
  const [horizon, setHorizon] = useState(90);
  const containerRef = useRef(null);
  const [chartW, setChartW] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(e => {
      const w = e[0].contentRect.width;
      if (w > 0) setChartW(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Build expected receipt date per open invoice (shared logic with DashboardPage)
  const enriched = enrichInvoices(invoices, paymentBehavior);

  // Build weekly buckets from today to horizon
  const numWeeks  = Math.ceil(horizon / 7);
  const weeks     = Array.from({ length: numWeeks }, (_, i) => {
    const start = addDays(TODAY, i * 7);
    const end   = addDays(TODAY, (i + 1) * 7 - 1);
    return { label: weekLabel(start), start, end, low: 0, medium: 0, high: 0, overdue: 0, total: 0, items: [] };
  });

  // Also bucket for overdue (already past due, best-guess landing)
  enriched.forEach(inv => {
    const w = weeks.find(w => inv.expectedDate >= w.start && inv.expectedDate <= w.end);
    if (!w) return;
    const key = inv.isOverdue ? 'overdue' : inv.riskLevel;
    w[key]  += inv.amount;
    w.total += inv.amount;
    w.items.push(inv);
  });

  const visibleWeeks = weeks.filter(w => w.total > 0 || horizon <= 30);

  // Summary stats — use shared forecastWithin so tiles match DashboardPage stats exactly
  const rows30    = forecastWithin(enriched, 30);
  const rows60    = forecastWithin(enriched, 60);
  const rowsAtRisk = enriched.filter(i => i.riskLevel === 'high' || i.isOverdue);
  const total30   = rows30.reduce((s, i) => s + i.amount, 0);
  const total60   = rows60.reduce((s, i) => s + i.amount, 0);
  const total90   = enriched.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = enriched.filter(i => i.isOverdue).reduce((s, i) => s + i.amount, 0);
  const atRisk    = rowsAtRisk.reduce((s, i) => s + i.amount, 0);

  function handleBarClick(data) {
    if (!data?.activePayload?.length) return;
    const w = data.activePayload[0].payload;
    if (!w.items?.length) return;
    onDrill?.({
      title:    `Expected Cash — Week of ${w.label}`,
      subtitle: `${fmtM(w.total)} · ${w.items.length} invoice${w.items.length !== 1 ? 's' : ''}`,
      source:   'Expected receipt date = invoice due date adjusted for each customer\'s historical avg days-to-pay. Overdue balances are shown with a best-estimate collection window.',
      filename: `cashflow_week_${w.label.replace(/\s/g, '_')}`,
      columns:  EXPORT_COLS,
      rows:     w.items,
    });
  }

  function handleExport() {
    exportXLSX(
      `cash_flow_forecast_${horizon}d`,
      'Cash Flow Forecast',
      EXPORT_COLS,
      enriched,
      { Report: 'Cash Flow Forecast', Horizon: `Next ${horizon} days`, AsOf: TODAY.toLocaleDateString() }
    );
  }

  function handleStatDrill(label, rows, total) {
    onDrill?.({
      title:    `Cash Flow — ${label}`,
      subtitle: `${fmtM(total)} · ${rows.length} invoice${rows.length !== 1 ? 's' : ''}`,
      source:   'Expected receipt date = invoice due date adjusted for each customer\'s historical avg days-to-pay. Overdue balances estimated 7–21 days from today.',
      filename: `cashflow_${label.toLowerCase().replace(/\s+/g, '_')}`,
      columns:  EXPORT_COLS,
      rows,
    });
  }

  const HORIZON_OPTS = [
    { label: '30d', days: 30 },
    { label: '60d', days: 60 },
    { label: '90d', days: 90 },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2>Cash Flow Forecast</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {HORIZON_OPTS.map(o => (
              <button
                key={o.days}
                onClick={() => setHorizon(o.days)}
                style={{
                  padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${horizon === o.days ? 'var(--teal)' : 'var(--border)'}`,
                  background: horizon === o.days ? 'rgba(0,212,232,0.1)' : 'none',
                  color: horizon === o.days ? 'var(--teal)' : 'var(--muted)',
                }}
              >{o.label}</button>
            ))}
          </div>
          <button className="card-export-btn" onClick={handleExport}>
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/><path d="M1 9.5h9"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Summary stat strip — each tile is clickable and drills to underlying invoices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginBottom: 20, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {[
          {
            label: 'Next 30 Days',
            value: fmtM(total30),
            color: 'var(--green)',
            sub: 'expected receipts',
            rows: rows30,
            total: total30,
          },
          {
            label: 'Next 60 Days',
            value: fmtM(total60),
            color: 'var(--teal)',
            sub: 'cumulative',
            rows: rows60,
            total: total60,
          },
          {
            label: 'Next 90 Days',
            value: fmtM(total90),
            color: 'var(--text)',
            sub: 'total pipeline',
            rows: enriched,
            total: total90,
          },
          {
            label: 'At-Risk Balance',
            value: fmtM(atRisk),
            color: atRisk > 0 ? 'var(--red)' : 'var(--green)',
            sub: totalOverdue > 0 ? `${fmtM(totalOverdue)} overdue` : 'no overdue',
            rows: rowsAtRisk,
            total: atRisk,
          },
        ].map((s, i) => (
          <div
            key={s.label}
            onClick={() => s.rows.length && handleStatDrill(s.label, s.rows, s.total)}
            style={{
              padding: '14px 16px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              background: 'rgba(255,255,255,0.02)',
              cursor: s.rows.length ? 'pointer' : 'default',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (s.rows.length) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{s.sub}</div>
            {s.rows.length > 0 && (
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 5 }}>{s.rows.length} invoice{s.rows.length !== 1 ? 's' : ''} · click to drill</div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ width: '100%', height: 200 }}>
        {chartW > 0 && (
          <BarChart
            width={chartW} height={200}
            data={visibleWeeks}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          >
            <XAxis dataKey="label" tick={{ fill: '#4e6a88', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtM} tick={{ fill: '#4e6a88', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="low"    stackId="a" fill="#22c55e" opacity={0.85} radius={[0,0,0,0]} maxBarSize={40} name="Low risk" />
            <Bar dataKey="medium" stackId="a" fill="#f59e0b" opacity={0.85} radius={[0,0,0,0]} maxBarSize={40} name="Medium risk" />
            <Bar dataKey="high"   stackId="a" fill="#f97316" opacity={0.85} radius={[0,0,0,0]} maxBarSize={40} name="High risk" />
            <Bar dataKey="overdue" stackId="a" fill="#ef4444" opacity={0.85} radius={[4,4,0,0]} maxBarSize={40} name="Overdue" />
          </BarChart>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { color: '#22c55e', label: 'Low risk — likely on time' },
          { color: '#f59e0b', label: 'Medium risk — monitor' },
          { color: '#f97316', label: 'High risk — slow payer' },
          { color: '#ef4444', label: 'Overdue — collection action' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-dim)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        Expected receipt dates are adjusted for each customer's historical avg days-to-pay. Click any summary tile or bar to drill into underlying invoices — CSV and Excel export available in the detail view.
      </div>
    </div>
  );
}
