import { useRef, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
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

export default function ClientCashForecast({ invoices, paymentBehavior, annualRevenue, payments, isMobile, onDrill, onAction }) {
  const containerRef = useRef(null);
  const [chartW, setChartW] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(e => { const w = e[0].contentRect.width; if (w > 0) setChartW(w); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const enriched   = enrichInvoices(invoices, paymentBehavior, TODAY_ISO);
  const rows30     = forecastWithin(enriched, 30);
  const rows60     = forecastWithin(enriched, 60);
  const rows90     = forecastWithin(enriched, 90);
  const overdue    = enriched.filter(i => i.daysOverdue > 0);
  const total30    = rows30.reduce((s, i) => s + i.amount, 0);
  const total60    = rows60.reduce((s, i) => s + i.amount, 0);
  const total90    = rows90.reduce((s, i) => s + i.amount, 0);
  const totalOvd   = overdue.reduce((s, i) => s + i.amount, 0);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
      {(() => {
        const thisWeekEnd = addDays(TODAY, 7);
        const thisWeek = enriched.filter(i => i.expectedDate >= TODAY && i.expectedDate <= thisWeekEnd);
        if (thisWeek.length === 0) return null;
        const thisWeekTotal = thisWeek.reduce((s, i) => s + i.amount, 0);
        return (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
              Expected this week — {fmtM(thisWeekTotal)} · {thisWeek.length} invoice{thisWeek.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {thisWeek.sort((a, b) => b.amount - a.amount).map(inv => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer} — {inv.id}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>Expected {inv.expectedDateStr}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{fmtM(inv.amount)}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'capitalize' }}>{inv.riskLevel} risk</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Predictive Cash Gap Alert */}
      {(() => {
        if (!annualRevenue) return null;
        const monthlyBurn = Math.round(annualRevenue * 0.65 / 12);
        const next30Gap   = monthlyBurn - total30;
        const next14      = forecastWithin(enriched, 14).reduce((s, i) => s + i.amount, 0);
        const biweeklyBurn = Math.round(monthlyBurn / 2);
        const nearTermGap  = biweeklyBurn - next14;

        if (nearTermGap <= 0 && next30Gap <= 0) return null;

        const gapAmt     = nearTermGap > 0 ? nearTermGap : next30Gap;
        const gapWindow  = nearTermGap > 0 ? 14 : 30;
        const urgentInvs = enriched
          .filter(i => i.daysOverdue > 0)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3);

        return (
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
              Based on expected collections in the next {gapWindow} days ({fmtM(gapWindow === 14 ? next14 : total30)}) vs estimated operating costs ({fmtM(gapWindow === 14 ? biweeklyBurn : monthlyBurn)}). Accelerating these collections would close the gap:
            </div>
            {urgentInvs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {urgentInvs.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,0.06)', borderRadius: 6, padding: '6px 10px' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{inv.customer} — {inv.id} ({inv.daysOverdue}d overdue)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{fmtM(inv.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, fontStyle: 'italic' }}>
              Estimate based on 65% of annual revenue as operating costs. Your actual burn rate may differ.
            </div>
          </div>
        );
      })()}

      {/* Overdue: Accelerate Collection */}
      {overdue.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
            Overdue — accelerate collection · {fmtM(totalOvd)} outstanding
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...overdue].sort((a, b) => b.amount - a.amount).map(inv => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer} — {inv.id}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.daysOverdue}d overdue · expected receipt {inv.expectedDateStr}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>{fmtM(inv.amount)}</div>
                </div>
                <button
                  onClick={() => onAction(inv)}
                  style={{ fontSize: 10, fontWeight: 600, borderRadius: 6, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', padding: '5px 10px', flexShrink: 0 }}
                >
                  Take action
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>Weekly cash expected — click any bar to drill in</div>
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

      {/* Payment confirmations + recent payments */}
      {(() => {
        const allPayments = payments ?? [];
        const pendingReview = allPayments.filter(p => p.status === 'Pending Review');
        const recentApplied = allPayments.filter(p => p.status === 'Auto-Applied').slice(-6).reverse();
        if (pendingReview.length === 0 && recentApplied.length === 0) return null;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {pendingReview.length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
                  Payment confirmations needed — {pendingReview.length} pending
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pendingReview.map(p => (
                    <div key={p.txId} style={{ borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{p.matchedCustomer}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>{fmtM(p.amount)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{p.rule ?? 'AI confidence below threshold'}</div>
                      {Array.isArray(p.candidates) && p.candidates.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Candidates: {p.candidates.join(' · ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {recentApplied.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
                  Recent payments received
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recentApplied.map(p => (
                    <div key={p.txId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.matchedCustomer}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.received} · {p.matchedInvoice ?? p.txId} · {p.confidence}% match</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>{fmtM(p.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        Click any tile or chart bar to drill into underlying invoices — CSV and Excel export available. Expected receipt dates use each customer's historical payment patterns.
      </div>
    </div>
  );
}
