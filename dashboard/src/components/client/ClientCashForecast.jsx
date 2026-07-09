import { useRef, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { enrichInvoices, forecastWithin, addDays } from '../../lib/forecast';
import SourceTag from '../SourceTag';
import { PageHeader } from './automationKit';

function fmtM(v) {
  if (!v || v === 0) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function weekLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function riskColor(level) {
  return level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';
}

const FCST_COLS = [
  { key: 'id',              label: 'Invoice' },
  { key: 'customer',        label: 'Customer' },
  { key: 'amount',          label: 'Amount',           render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'due',             label: 'Due Date' },
  { key: 'expectedDateStr', label: 'Expected Receipt' },
  { key: 'riskLevel',       label: 'Collection Risk' },
  { key: 'status',          label: 'Status' },
  { key: 'daysOverdue',     label: 'Days Overdue',      render: v => v > 0 ? `${v}d` : '—', csvVal: row => row.daysOverdue > 0 ? row.daysOverdue : '' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">Week of {label}</div>
      <div className="tooltip-row"><span style={{ color: 'var(--teal)' }}>Expected in</span><span style={{ fontWeight: 700 }}>{fmtM(d?.total)}</span></div>
      {d?.overdue > 0 && <div className="tooltip-row"><span style={{ color: '#ef4444' }}>In collection</span><span>{fmtM(d.overdue)}</span></div>}
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{d?.items?.length ?? 0} invoice{d?.items?.length !== 1 ? 's' : ''} · click to drill</div>
    </div>
  );
}

export default function ClientCashForecast({ invoices, paymentBehavior, annualRevenue, isMobile, onDrill, onAction }) {
  const containerRef = useRef(null);
  const [chartW, setChartW] = useState(0);
  const TODAY = new Date();

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(e => { const w = e[0].contentRect.width; if (w > 0) setChartW(w); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const TODAY_ISO = TODAY.toISOString().slice(0, 10);
  const enriched   = enrichInvoices(invoices, paymentBehavior, TODAY_ISO);
  const rows30     = forecastWithin(enriched, 30);
  const rows60     = forecastWithin(enriched, 60);
  const rows90     = forecastWithin(enriched, 90);
  const overdue    = enriched.filter(i => i.daysOverdue > 0);
  const total30    = rows30.reduce((s, i) => s + i.amount, 0);
  const total60    = rows60.reduce((s, i) => s + i.amount, 0);
  const total90    = rows90.reduce((s, i) => s + i.amount, 0);
  const totalOvd   = overdue.reduce((s, i) => s + i.amount, 0);

  const next7Days = addDays(TODAY, 7);
  const thisWeek  = enriched
    .filter(i => i.expectedDate >= TODAY && i.expectedDate <= next7Days)
    .sort((a, b) => a.expectedDate - b.expectedDate);


  const weeks = Array.from({ length: 13 }, (_, i) => {
    const start = addDays(TODAY, i * 7);
    const end   = addDays(TODAY, (i + 1) * 7 - 1);
    return { label: weekLabel(start), start, end, low: 0, medium: 0, high: 0, overdue: 0, total: 0, items: [] };
  });
  enriched.forEach(inv => {
    const w = weeks.find(w => inv.expectedDate >= w.start && inv.expectedDate <= w.end);
    if (!w) return;
    const key = inv.isOverdue ? 'overdue' : inv.riskLevel;
    w[key] += inv.amount; w.total += inv.amount; w.items.push(inv);
  });
  const visibleWeeks = weeks.filter(w => w.total > 0);

  function drillWeek(w) {
    if (!w?.items?.length) return;
    onDrill({
      title: `Cash Expected — Week of ${w.label}`,
      subtitle: `${fmtM(w.total)} · ${w.items.length} invoice${w.items.length !== 1 ? 's' : ''}`,
      source: 'Expected receipt date = invoice due date adjusted for each customer\'s historical avg days-to-pay.',
      filename: `cash_week_${w.label.replace(/\s/g,'_')}`,
      columns: FCST_COLS,
      rows: w.items,
    });
  }

  function drillTile(title, rows, total) {
    onDrill({ title, subtitle: `${fmtM(total)} · ${rows.length} invoice${rows.length !== 1 ? 's' : ''}`, source: 'Expected receipt dates calculated from customer payment behavior history.', filename: title.toLowerCase().replace(/\s+/g,'_'), columns: FCST_COLS, rows });
  }

  const tiles = [
    { label: 'Next 30 days', value: fmtM(total30), color: 'var(--green)', sub: `${rows30.length} invoices`, rows: rows30, total: total30 },
    { label: 'Next 60 days', value: fmtM(total60), color: 'var(--teal)',  sub: `${rows60.length} invoices`, rows: rows60, total: total60 },
    { label: 'Next 90 days', value: fmtM(total90), color: 'var(--text)',  sub: `${rows90.length} invoices`, rows: rows90, total: total90 },
    { label: 'In collection', value: fmtM(totalOvd), color: totalOvd > 0 ? 'var(--red)' : 'var(--green)', sub: `${overdue.length} overdue`, rows: overdue, total: totalOvd },
  ];

  const monthlyBurn    = annualRevenue ? Math.round(annualRevenue * 0.65 / 12) : 0;
  const next14         = forecastWithin(enriched, 14).reduce((s, i) => s + i.amount, 0);
  const biweeklyBurn   = Math.round(monthlyBurn / 2);
  const nearTermGap    = monthlyBurn ? (biweeklyBurn - next14) : 0;
  const monthlyGap     = monthlyBurn ? (monthlyBurn - total30) : 0;
  const showGap        = nearTermGap > 0 || monthlyGap > 0;
  const gapAmt         = nearTermGap > 0 ? nearTermGap : monthlyGap;
  const gapWindow      = nearTermGap > 0 ? 14 : 30;
  const topOverdue     = [...overdue].sort((a, b) => b.amount - a.amount).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader title="Cash flow" subtitle="What's expected to arrive and when — a forward look at collections against your operating needs. Payment matching and history live under Payments and Activities." />

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
        {tiles.map(s => (
          <div key={s.label} onClick={() => drillTile(s.label, s.rows, s.total)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{s.sub}</div>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>tap to export ↗</div>
          </div>
        ))}
      </div>

      {/* Expected this week */}
      {thisWeek.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>Expected to arrive this week — {fmtM(thisWeek.reduce((s, i) => s + i.amount, 0))} across {thisWeek.length} invoice{thisWeek.length !== 1 ? 's' : ''}</SectionLabel>
          {(() => {
            const withSeqs = thisWeek.filter(i => i.reminders?.length > 0);
            return withSeqs.length > 0 ? (
              <div style={{ fontSize: 10, color: '#00d4e8', margin: '6px 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4e8', display: 'inline-block', flexShrink: 0 }} />
                WF2 actively following up on {withSeqs.length} of these — automated reminders working
                <SourceTag label="Invoices with active WF2 reminder sequences (at least one reminder delivered via Outlook / Microsoft Graph API). These are being followed up automatically — no action needed from you." />
              </div>
            ) : null;
          })()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {thisWeek.map(inv => (
              <div key={inv.id}
                onClick={() => onAction(inv)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.05)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{inv.customer}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.id}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    Expected {new Date(inv.expectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {inv.isOverdue && <span style={{ color: '#f97316', marginLeft: 6 }}>{inv.daysOverdue}d overdue — in active collection</span>}
                    {(inv.reminders?.length > 0) && <span style={{ color: '#00d4e8', marginLeft: 6 }}>WF2 active ({inv.reminders.length} sent)</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: riskColor(inv.riskLevel) }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
            Click any row to open the invoice and take action if needed. Dates are estimates based on customer payment history.
          </div>
        </div>
      )}

      {/* Predictive Cash Gap Alert */}
      {showGap && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
            Cash Gap Alert — Action Window: {gapWindow} days
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{fmtM(gapAmt)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              expected shortfall vs estimated {gapWindow === 14 ? 'bi-weekly' : 'monthly'} operating costs
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 10 }}>
            Expected collections in the next {gapWindow} days: {fmtM(gapWindow === 14 ? next14 : total30)} vs estimated operating costs: {fmtM(gapWindow === 14 ? biweeklyBurn : monthlyBurn)}. Accelerating these overdue collections would close the gap:
          </div>
          {topOverdue.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {topOverdue.map(inv => (
                <div key={inv.id}
                  onClick={() => onAction(inv)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,0.06)', borderRadius: 6, padding: '7px 10px', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                >
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', marginRight: 8 }}>{inv.customer}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.id} · {inv.daysOverdue}d overdue</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{fmtM(inv.amount)}</span>
                    <span style={{ fontSize: 10, color: '#ef4444', opacity: 0.6 }}>act ↗</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>
            Estimate based on 65% of annual revenue as operating costs. Click any invoice to take action.
          </div>
        </div>
      )}

      {/* Overdue — accelerate collection */}
      {overdue.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <SectionLabel>Overdue — accelerate collection · {fmtM(totalOvd)}</SectionLabel>
            <button
              onClick={() => onDrill({ title: 'Overdue Invoices — Collection Action List', subtitle: `${fmtM(totalOvd)} · ${overdue.length} invoices`, source: 'Sorted by amount. Expected receipt dates assume collection within current aging window.', filename: 'overdue_collection', columns: FCST_COLS, rows: [...overdue].sort((a, b) => b.amount - a.amount) })}
              style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              Export all ↗
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...overdue].sort((a, b) => b.amount - a.amount).map(inv => {
              const urgency = inv.daysOverdue > 60 ? { label: 'Critical', color: '#ef4444' } :
                              inv.daysOverdue > 30 ? { label: 'Urgent', color: '#f97316' } :
                                                     { label: 'Follow up', color: '#f59e0b' };
              const action  = inv.daysOverdue > 90 ? 'Escalate to collections' :
                              inv.daysOverdue > 60 ? 'Personal call — senior contact' :
                              inv.daysOverdue > 30 ? 'Phone call + formal notice' : 'Send follow-up email';
              return (
                <div key={inv.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-hover)', border: `1px solid ${urgency.color}22`, borderLeft: `3px solid ${urgency.color}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '10px 12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{inv.customer}</span>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.id}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: urgency.color, background: `${urgency.color}18`, borderRadius: 8, padding: '1px 7px' }}>{urgency.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: urgency.color, fontWeight: 600, marginBottom: 2 }}>{action}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                        {inv.daysOverdue}d overdue · Due {inv.due} · Expected receipt ~{inv.expectedDateStr}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>{fmtM(inv.amount)}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', padding: '5px 12px', background: 'rgba(0,0,0,0.08)' }}>
                    <button
                      onClick={() => onAction(inv)}
                      style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Open invoice — log contact, send reminder, or assign task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>Weekly cash expected — click any bar to drill in</SectionLabel>
        <div ref={containerRef} style={{ width: '100%', height: isMobile ? 150 : 180 }}>
          {chartW > 0 && (
            <BarChart width={chartW} height={isMobile ? 150 : 180} data={visibleWeeks} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              onClick={data => { if (data?.activePayload?.[0]?.payload) drillWeek(data.activePayload[0].payload); }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis dataKey="label" tick={{ fill: '#4e6a88', fontSize: isMobile ? 8 : 9 }} axisLine={false} tickLine={false} interval={isMobile ? 1 : 0} />
              <YAxis tickFormatter={fmtM} tick={{ fill: '#4e6a88', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="low"     stackId="a" fill="#22c55e" opacity={0.85} maxBarSize={36} />
              <Bar dataKey="medium"  stackId="a" fill="#f59e0b" opacity={0.85} maxBarSize={36} />
              <Bar dataKey="high"    stackId="a" fill="#f97316" opacity={0.85} maxBarSize={36} />
              <Bar dataKey="overdue" stackId="a" fill="#ef4444" opacity={0.85} radius={[4,4,0,0]} maxBarSize={36} />
            </BarChart>
          )}
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 10 : 16, marginTop: 8, flexWrap: 'wrap' }}>
          {[{ color: '#22c55e', label: 'Expected on time' }, { color: '#f59e0b', label: 'May be delayed' }, { color: '#f97316', label: 'Follow up needed' }, { color: '#ef4444', label: 'In collection' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
        <span>Click any tile or chart bar to export underlying invoices. Expected receipt dates use each customer's historical payment patterns. Cash gap assumes 65% of annual revenue as operating costs. Payment matching and received-payment history live under the Payments and Activities tabs.</span>
        <SourceTag label="Cash forecast: Expected receipt date = invoice due date + customer's historical avg days-to-pay (from QuickBooks payment history). Cash gap uses 65% of annual revenue as operating cost estimate. WF2 status from Microsoft Outlook delivery records." />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{children}</div>;
}
