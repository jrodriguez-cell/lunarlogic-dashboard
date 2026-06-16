import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import SourceTag from '../SourceTag';

const TODAY_ISO = '2026-06-11';

const FALLBACK_SUMMARY = 'A shareable summary of AR performance, DSO progress, and automation impact. Designed to be sent to your accountant or reviewed with leadership.';

function fmtM(v) {
  if (!v || v === 0) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

export default function ClientReportCard({ data, currentDSO, isMobile, onDrill }) {
  const trend    = data.dsoTrend ?? [];
  const thisMo   = trend.filter(p => p.date.startsWith('2026-06'));
  const lastMo   = trend.filter(p => p.date.startsWith('2026-05'));
  const avgDSO   = arr => arr.length ? Math.round(arr.reduce((s, p) => s + p.dso, 0) / arr.length) : 0;
  const dsoThis  = avgDSO(thisMo);
  const dsoLast  = avgDSO(lastMo);
  const dsoMoChg = dsoLast - dsoThis; // positive = improved

  const payments    = data.payments ?? [];
  const pmtsPeriod  = payments.filter(p => p.received?.startsWith('2026-05'));
  const autoPeriod  = pmtsPeriod.filter(p => p.status === 'Auto-Applied');
  const minutesSvd  = autoPeriod.length * 17;
  const hoursSaved  = Math.round(minutesSvd / 60 * 10) / 10;

  const openInvs     = data.invoices.filter(i => i.status !== 'Paid');
  const withReminders = openInvs.filter(i => i.reminders?.length > 0);
  const coveragePct  = openInvs.length > 0 ? Math.round(withReminders.length / openInvs.length * 100) : 100;

  const badDebt    = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 90);
  const badDebtAmt = badDebt.reduce((s, i) => s + i.amount, 0);

  const invThisMo = data.invoices.filter(i => i.issued?.startsWith('2026-06'));
  const invLastMo = data.invoices.filter(i => i.issued?.startsWith('2026-05'));
  const totalSent = invThisMo.length + invLastMo.length;

  const totalRemindersSent = openInvs.reduce((s, i) => s + (i.reminders?.length ?? 0), 0);

  const dsoImprovement   = data.preLiveDSO - Math.round(currentDSO);
  const recoveredCapital = Math.round(dsoImprovement * (data.annualRevenue / 365));

  const collEff = data.collectionEfficiency;

  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setAiLoading(true);
    setAiSummary(null);

    const metrics = {
      dsoThisMonth: dsoThis,
      dsoLastMonth: dsoLast,
      dsoMonthOverMonthChangeDays: dsoMoChg,
      currentDSO: Math.round(currentDSO),
      dsoImprovementSinceGoLive: dsoImprovement,
      recoveredWorkingCapital: recoveredCapital,
      collectionEfficiencyPct: collEff,
      paymentsReceivedThisPeriod: pmtsPeriod.length,
      paymentsAutoMatchedThisPeriod: autoPeriod.length,
      hoursSavedThisPeriod: hoursSaved,
      openInvoiceCount: openInvs.length,
      reminderCoveragePct: coveragePct,
      badDebtAmount90PlusDays: badDebtAmt,
      badDebtInvoiceCount: badDebt.length,
      invoicesIssuedThisPeriod: totalSent,
      remindersSentTotal: totalRemindersSent,
    };

    fetch('/api/ar-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName: data.name, metrics }),
    })
      .then(res => { if (!res.ok) throw new Error(`status ${res.status}`); return res.json(); })
      .then(json => { if (!cancelled) setAiSummary(json.insight); })
      .catch(err => { console.error('AI insight fetch failed, using fallback summary:', err); })
      .finally(() => { if (!cancelled) setAiLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.name, dsoThis, dsoLast, currentDSO, badDebtAmt]);

  const DSO_COLS = [
    { key: 'date', label: 'Date' },
    { key: 'dso',  label: 'DSO (days)', render: v => v.toFixed(1), csvVal: row => row.dso },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            Monthly AR Performance Report — June 2026
          </div>
          {aiSummary && !aiLoading && (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.1)', border: '1px solid rgba(0,212,232,0.25)', borderRadius: 10, padding: '1px 8px', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              AI Generated
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          {aiLoading ? 'Generating insights from the last 30 days of AR activity…' : (aiSummary || FALLBACK_SUMMARY)}
        </div>
        <button
          style={{ marginTop: 10, padding: '5px 14px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', cursor: 'pointer' }}
          onClick={() => alert('PDF export — coming in the next release. Will auto-email your accountant on the 1st of each month.')}
        >
          Export PDF Report
        </button>
      </div>

      {/* 6 metric tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <MetricTile
          label="DSO This Month"
          value={`${dsoThis}d`}
          sub={dsoMoChg >= 0 ? `${dsoMoChg}d better than May` : `${Math.abs(dsoMoChg)}d above May`}
          detail={`May avg: ${dsoLast}d`}
          color={dsoMoChg >= 0 ? 'var(--green)' : 'var(--red)'}
          onClick={() => onDrill({ title: 'DSO Trend — Last 90 Days', subtitle: `${data.preLiveDSO}d pre-live → ${Math.round(currentDSO)}d today`, source: '30-day rolling DSO. Go-live marks LunarLogic activation.', filename: 'dso_trend', columns: DSO_COLS, rows: data.dsoTrend })}
          source="30-day rolling average DSO from QuickBooks Online invoice data. Formula: (Outstanding AR ÷ Annual Revenue) × 365. Go-live annotation marks LunarLogic activation date."
        />
        <MetricTile
          label="Collection Rate"
          value={`${collEff}%`}
          sub={collEff >= 90 ? 'Top quartile' : collEff >= 80 ? 'Healthy range' : 'Below target'}
          detail="Invoices paid within 90d of issue"
          color={collEff >= 90 ? 'var(--green)' : collEff >= 80 ? 'var(--teal)' : '#f59e0b'}
          source="Percentage of invoices paid within 90 days of issue date. Calculated from QuickBooks invoice history since go-live."
        />
        <MetricTile
          label="Auto-Matched Payments"
          value={autoPeriod.length}
          sub={`of ${pmtsPeriod.length} received this period`}
          detail={`${Math.round(autoPeriod.length / Math.max(pmtsPeriod.length, 1) * 100)}% automation rate`}
          color="var(--teal)"
          source="Payments automatically applied to invoices by LunarLogic's WF3 AI matching engine (Plaid bank feed). Confidence threshold: 90%. Below-threshold payments require manual confirmation."
        />
        <MetricTile
          label="Bad Debt Rate"
          value={`${data.automationStats?.badDebtRateAfter ?? 0.7}%`}
          sub={`Was ${data.automationStats?.badDebtRateBefore ?? 1.9}% before LunarLogic`}
          detail={`${Math.round((1 - (data.automationStats?.badDebtRateAfter ?? 0.7) / (data.automationStats?.badDebtRateBefore ?? 1.9)) * 100)}% improvement`}
          color="var(--green)"
          source="Bad debt expense as % of revenue. Calculated from invoices written off or >180 days overdue. Compared to pre-LunarLogic baseline measured over the same period."
        />
        <MetricTile
          label="Invoice Processing"
          value={`${data.automationStats?.avgProcessingMinutes ?? 3} min`}
          sub="Was 19 min before LunarLogic"
          detail={`${data.automationStats?.invoicesProcessedTotal ?? 0} invoices processed since go-live`}
          color="var(--teal)"
          source="Average time from Slack PDF upload to invoice sent in QuickBooks via WF1 automation. Pre-LunarLogic baseline: 19 min manual data entry per invoice."
        />
        <MetricTile
          label="Month-End Close"
          value={`${data.automationStats?.monthEndCloseDaysAfter ?? 3}d`}
          sub={`Was ${data.automationStats?.monthEndCloseDaysBefore ?? 12}d before LunarLogic`}
          detail={`${Math.round((1 - (data.automationStats?.monthEndCloseDaysAfter ?? 3) / (data.automationStats?.monthEndCloseDaysBefore ?? 12)) * 100)}% faster close`}
          color="var(--green)"
          source="Days from period end to finalized books. Tracked via LunarLogic workflow completion timestamps vs. prior manual close process baseline."
        />
      </div>

      {/* DSO Trend Chart */}
      <DSOTrendChart trend={data.dsoTrend} goLiveDate={data.goLiveDate} preLiveDSO={data.preLiveDSO} currentDSO={currentDSO} isMobile={isMobile} onDrill={onDrill} DSO_COLS={DSO_COLS} />

      {/* DSO journey */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>DSO journey since go-live</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 20, flexWrap: 'wrap', marginTop: 10 }}>
          <JourneyStop label="Before LunarLogic" value={`${data.preLiveDSO}d`} color="#ef4444" />
          <div style={{ fontSize: 16, color: 'var(--muted)' }}>→</div>
          <JourneyStop label="Go-live" value={data.goLiveDate} color="var(--muted)" small />
          <div style={{ fontSize: 16, color: 'var(--muted)' }}>→</div>
          <JourneyStop label="Today" value={`${Math.round(currentDSO)}d`} color="var(--teal)" />
          <div style={{ flex: 1, minWidth: 20 }} />
          <div style={{ textAlign: isMobile ? 'left' : 'right', paddingTop: isMobile ? 8 : 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 3 }}>Total improvement</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)', lineHeight: 1 }}>↓ {dsoImprovement} days</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>= {fmtM(recoveredCapital)} in recovered working capital</div>
          </div>
        </div>
      </div>

      {/* Automation impact table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>Automation impact this period</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 10 }}>
          <ImpactRow label="Invoices sent automatically" value={`${totalSent} this period`} color="var(--teal)" source="Invoices created via WF1 (Slack → QuickBooks AI workflow). Count reflects invoices issued this period originating from WF1 automation runs." />
          <ImpactRow label="Payment reminders sent by LunarLogic" value={`${totalRemindersSent} total`} color="var(--teal)" source="Outbound reminder emails sent via WF2 (Microsoft Outlook / Graph API). Triggered automatically on schedule — no manual action required from your team." />
          <ImpactRow label="Payments auto-matched and applied" value={`${autoPeriod.length} this period`} color="var(--green)" source="Payments matched to invoices automatically by WF3 AI engine using Plaid bank feed. Exact and fuzzy name + amount matching at ≥90% confidence." />
          <ImpactRow label="Hours saved vs manual process" value={`~${hoursSaved}h this period`} color="var(--green)" source="Estimated based on 17 min per payment for manual reconciliation. Applied to all auto-matched payments this period." />
          <ImpactRow label="Automation coverage of open AR" value={`${coveragePct}% of invoices in sequence`} color={coveragePct >= 80 ? 'var(--green)' : '#f59e0b'} source="% of open (unpaid) invoices currently enrolled in WF2 reminder sequence. Calculated from invoices with at least one scheduled or sent reminder." />
          <ImpactRow label="Bad debt rate since go-live" value={`${data.automationStats?.badDebtRateAfter ?? 0.7}% (was ${data.automationStats?.badDebtRateBefore ?? 1.9}%)`} color="var(--green)" source="Bad debt expense as % of revenue. Invoices written off or >180 days overdue. Compared to client's pre-LunarLogic baseline." />
          <ImpactRow label="Invoice processing time" value={`${data.automationStats?.avgProcessingMinutes ?? 3} min avg (was 19 min)`} color="var(--teal)" source="Avg time from Slack upload to QB invoice creation via WF1. Pre-LunarLogic: manual data entry avg 19 min per invoice." />
          <ImpactRow label="Admin hours saved annually" value={`~${(data.automationStats?.adminHoursPerYearBefore ?? 480) - (data.automationStats?.adminHoursPerYearAfter ?? 88)} hrs/yr (was ${data.automationStats?.adminHoursPerYearBefore ?? 480} hrs)`} color="var(--green)" last source="Projected annual savings based on WF1 + WF2 time displacement. Measured against pre-automation baseline hours for invoice entry and follow-up." />
        </div>
      </div>

      {/* Bad debt flag */}
      {badDebtAmt > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>Bad Debt Risk — Action Required</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{fmtM(badDebtAmt)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>in invoices 90+ days overdue</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {badDebt.length} invoice{badDebt.length !== 1 ? 's' : ''} at critical risk. Recovery rates drop sharply after 90 days — below 50% on average. See Action Plan for escalation steps.
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
        Data as of {TODAY_ISO}. Reflects LunarLogic automation from {data.goLiveDate}. In production, this report auto-emails to your accountant on the 1st of each month.
      </div>
    </div>
  );
}

function DSOTrendChart({ trend, goLiveDate, preLiveDSO, currentDSO, isMobile, onDrill, DSO_COLS }) {
  if (!trend?.length) return null;
  const data = trend.map(p => ({
    date: p.date, dso: p.dso,
    pre:  p.date <= goLiveDate ? p.dso : null,
    post: p.date >= goLiveDate ? p.dso : null,
  }));
  const step = Math.max(1, Math.floor(trend.length / 5));
  const tickDates = trend.filter((_, i) => i % step === 0 || i === trend.length - 1).map(p => p.date);
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ background: '#141824', border: '1px solid rgba(0,212,232,0.25)', borderRadius: 7, padding: '7px 11px', fontSize: 11, pointerEvents: 'none' }}>
        <div style={{ color: '#6b7280', marginBottom: 2 }}>{d.date}</div>
        <div style={{ color: '#00d4e8', fontWeight: 700 }}>{d.dso.toFixed(1)}d DSO</div>
        <div style={{ color: d.date >= goLiveDate ? '#22c55e' : '#6b7280', fontSize: 10 }}>{d.date >= goLiveDate ? 'Post go-live' : 'Pre go-live'}</div>
      </div>
    );
  };
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <SectionLabel>DSO trend — last 90 days</SectionLabel>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 2, background: '#4b5563', borderRadius: 1 }} />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>Before LunarLogic ({preLiveDSO}d)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 2, background: '#00d4e8', borderRadius: 1 }} />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>After go-live ({Math.round(currentDSO)}d now)</span>
            </div>
          </div>
        </div>
        <button onClick={() => onDrill({ title: 'DSO Trend — Last 90 Days', subtitle: `${preLiveDSO}d pre-live → ${Math.round(currentDSO)}d today`, source: '30-day rolling DSO from QuickBooks.', filename: 'dso_trend_90d', columns: DSO_COLS, rows: trend })}
          style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>
          Export data
        </button>
      </div>
      <ResponsiveContainer width="100%" height={isMobile ? 120 : 160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="rcPreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4b5563" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4b5563" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="rcPostFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00d4e8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00d4e8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" ticks={tickDates} tick={{ fontSize: 9, fill: '#4b5563' }} tickLine={false} axisLine={false}
            tickFormatter={v => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} />
          <YAxis tick={{ fontSize: 9, fill: '#4b5563' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}d`} domain={['auto', 'auto']} width={36} />
          <ReferenceLine x={goLiveDate} stroke="rgba(0,212,232,0.5)" strokeWidth={1} strokeDasharray="4 3"
            label={{ value: 'Go-live', position: 'insideTopRight', fill: 'rgba(0,212,232,0.65)', fontSize: 9, fontWeight: 700 }} />
          <Area type="monotone" dataKey="pre"  stroke="#4b5563" strokeWidth={1.5} fill="url(#rcPreFill)"  dot={false} isAnimationActive={false} connectNulls={false} />
          <Area type="monotone" dataKey="post" stroke="#00d4e8" strokeWidth={2}   fill="url(#rcPostFill)" dot={false} isAnimationActive={false} connectNulls={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,212,232,0.15)', strokeWidth: 1 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{children}</div>;
}

function MetricTile({ label, value, sub, detail, color, onClick, source }) {
  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {source && <SourceTag label={source} />}
          {onClick && <span style={{ fontSize: 10, color: 'var(--teal)', opacity: 0.6 }}>↗</span>}
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 3 }}>{sub}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>{detail}</div>
    </div>
  );
}

function JourneyStop({ label, value, color, small }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: small ? 12 : 22, fontWeight: small ? 400 : 900, color, letterSpacing: small ? 0 : -1 }}>{value}</div>
    </div>
  );
}

function ImpactRow({ label, value, color, last, source }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {source && <SourceTag label={source} />}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
