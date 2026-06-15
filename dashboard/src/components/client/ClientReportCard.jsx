const TODAY_ISO = '2026-06-11';

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

  const DSO_COLS = [
    { key: 'date', label: 'Date' },
    { key: 'dso',  label: 'DSO (days)', render: v => v.toFixed(1), csvVal: row => row.dso },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>
          Monthly AR Performance Report — June 2026
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          A shareable summary of AR performance, DSO progress, and automation impact. Designed to be sent to your accountant or reviewed with leadership.
        </div>
        <button
          style={{ marginTop: 10, padding: '5px 14px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', cursor: 'pointer' }}
          onClick={() => alert('PDF export — coming in the next release. Will auto-email your accountant on the 1st of each month.')}
        >
          Export PDF Report
        </button>
      </div>

      {/* 4 metric tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        <MetricTile
          label="DSO This Month"
          value={`${dsoThis}d`}
          sub={dsoMoChg >= 0 ? `${dsoMoChg}d better than May` : `${Math.abs(dsoMoChg)}d above May`}
          detail={`May avg: ${dsoLast}d`}
          color={dsoMoChg >= 0 ? 'var(--green)' : 'var(--red)'}
          onClick={() => onDrill({ title: 'DSO Trend — Last 90 Days', subtitle: `${data.preLiveDSO}d pre-live → ${Math.round(currentDSO)}d today`, source: '30-day rolling DSO. Go-live marks LunarLogic activation.', filename: 'dso_trend', columns: DSO_COLS, rows: data.dsoTrend })}
        />
        <MetricTile
          label="Collection Rate"
          value={`${collEff}%`}
          sub={collEff >= 90 ? 'Top quartile' : collEff >= 80 ? 'Healthy range' : 'Below target'}
          detail="Invoices paid within 90d of issue"
          color={collEff >= 90 ? 'var(--green)' : collEff >= 80 ? 'var(--teal)' : '#f59e0b'}
        />
        <MetricTile
          label="Auto-Matched Payments"
          value={autoPeriod.length}
          sub={`of ${pmtsPeriod.length} received this period`}
          detail={`${Math.round(autoPeriod.length / Math.max(pmtsPeriod.length, 1) * 100)}% automation rate`}
          color="var(--teal)"
        />
        <MetricTile
          label="Hours Saved"
          value={`${hoursSaved}h`}
          sub="vs full manual process"
          detail={`${autoPeriod.length} auto-matched × 17 min each`}
          color="var(--green)"
        />
      </div>

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
          <ImpactRow label="Invoices sent automatically" value={`${totalSent} this period`} color="var(--teal)" />
          <ImpactRow label="Payment reminders sent by LunarLogic" value={`${totalRemindersSent} total`} color="var(--teal)" />
          <ImpactRow label="Payments auto-matched and applied" value={`${autoPeriod.length} this period`} color="var(--green)" />
          <ImpactRow label="Hours saved vs manual process" value={`~${hoursSaved}h this period`} color="var(--green)" />
          <ImpactRow label="Automation coverage of open AR" value={`${coveragePct}% of invoices in sequence`} color={coveragePct >= 80 ? 'var(--green)' : '#f59e0b'} last />
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

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{children}</div>;
}

function MetricTile({ label, value, sub, detail, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        {onClick && <span style={{ fontSize: 10, color: 'var(--teal)', opacity: 0.6 }}>↗</span>}
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

function ImpactRow({ label, value, color, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
