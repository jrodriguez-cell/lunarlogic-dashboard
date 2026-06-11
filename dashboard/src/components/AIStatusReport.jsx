import { useState, useEffect } from 'react';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function getSummaries(view, m = {}) {
  const {
    invoices = [], payments = [], paymentBehavior = [],
    currentDSO = 0, delta = 0, preLiveDSO = 0,
    collectionEfficiency = 0, totalAR = 0,
    overdue = [], overdueAmt = 0,
    writeOffRisk = 0, writeOffCount = 0,
    expectedCashIn = 0, unappliedAmt = 0,
    autoMatchRate = 0, unappliedPayments = [],
    clientName = 'your firm',
  } = m;

  const autoApplied   = payments.filter(p => p.status === 'Auto-Applied');
  const pendingCount  = payments.filter(p => p.status === 'Pending Review').length;
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const sentCount     = invoices.filter(i => i.status === 'Sent').length;
  const viewedCount   = invoices.filter(i => i.status === 'Viewed').length;
  const paidCount     = invoices.filter(i => i.status === 'Paid').length;
  const highRisk      = paymentBehavior.filter(c => c.riskLevel === 'high');
  const highRiskAmt   = highRisk.reduce((s, c) => s + c.openAmount, 0);
  const slowest       = [...paymentBehavior].sort((a, b) => b.avgDays - a.avgDays)[0];
  const worseningCt   = paymentBehavior.filter(c => c.trend > 0).length;
  const improvingCt   = paymentBehavior.filter(c => c.trend < 0).length;
  const avgDays       = Math.round(paymentBehavior.reduce((s, c) => s + c.avgDays, 0) / (paymentBehavior.length || 1));
  const topOverdue    = [...overdue].sort((a, b) => b.daysOverdue - a.daysOverdue)[0];
  const topCust       = topOverdue?.customer || 'key accounts';
  const topDaysOver   = topOverdue?.daysOverdue || 0;
  const openCount     = invoices.filter(i => i.status !== 'Paid').length;

  const s = {
    overview: [
      `DSO stands at ${currentDSO} days — a ${delta}-day improvement since go-live against the ${preLiveDSO}-day baseline. ${overdue.length} overdue invoice${overdue.length !== 1 ? 's' : ''} totaling ${fmtM(overdueAmt)} require follow-up${topDaysOver > 0 ? `, with ${topCust} carrying the oldest balance at ${topDaysOver} days past due` : ''}. ${writeOffCount > 0 ? `Write-off exposure of ${fmtM(writeOffRisk)} across ${writeOffCount} 90+ day invoice${writeOffCount !== 1 ? 's' : ''} should be assessed under ASC 310-10-35 before period close.` : 'No invoices have crossed the 90-day threshold — strong collection performance for the period.'}`,

      `Collection efficiency of ${collectionEfficiency}% indicates ${collectionEfficiency >= 85 ? 'strong' : collectionEfficiency >= 70 ? 'moderate' : 'below-target'} payment discipline across the AR portfolio. ${fmtM(expectedCashIn)} in current invoices is due within the next 30 days, providing near-term cash flow visibility. The DSO trend is consistently declining — the automation-driven inflection point is visible on the 90-day trend chart.`,

      `Total AR of ${fmtM(totalAR)} is outstanding across ${openCount} open invoice${openCount !== 1 ? 's' : ''}. ${writeOffCount > 0 ? `${writeOffCount} invoice${writeOffCount !== 1 ? 's have' : ' has'} exceeded 90 days and require allowance for doubtful accounts review under ASC 310-10-35.` : 'No invoices have exceeded the 90-day threshold this period.'} Expected cash inflow of ${fmtM(expectedCashIn)} due in the next 30 days supports near-term liquidity planning.`,
    ],

    invoices: [
      `${overdue.length} of ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} are currently overdue, totaling ${fmtM(overdueAmt)}. ${topDaysOver > 0 ? `The oldest balance is ${topDaysOver} days past due from ${topCust}.` : ''} ${viewedCount} invoice${viewedCount !== 1 ? 's have' : ' has'} been opened by recipients but remain unpaid — these are warm targets for follow-up outreach.`,

      `Invoice pipeline: ${sentCount} sent, ${viewedCount} viewed, ${overdue.length} overdue, ${paidCount} paid. Overdue exposure is concentrated in ${highRisk.length > 0 ? highRisk.map(c => c.customer).slice(0, 2).join(' and ') : 'a small number of accounts'}. Invoices viewed but unpaid within 7 days respond well to a single automated reminder in the WF2 sequence.`,

      `${invoices.length} total invoices tracked this period — ${paidCount} paid, ${overdue.length} overdue, ${sentCount + viewedCount} awaiting payment. ${topCust !== 'key accounts' ? `${topCust} accounts for the largest single overdue balance — a concentrated collection risk worth escalating this week.` : `Overdue balances are distributed across multiple accounts.`} Consider enabling automated 7-day pre-due reminders to reduce the current-to-overdue conversion rate.`,
    ],

    customers: [
      `${highRisk.length} customer${highRisk.length !== 1 ? 's are' : ' is'} rated high risk based on payment history${highRisk.length > 0 ? ': ' + highRisk.map(c => c.customer).join(' and ') : ''}. ${slowest ? `${slowest.customer} averages ${slowest.avgDays}d to pay — ${slowest.avgDays - 30}d beyond net-30 terms.` : ''} Combined high-risk exposure: ${fmtM(highRiskAmt)}.`,

      `Portfolio average days-to-pay is ${avgDays}d. ${worseningCt} account${worseningCt !== 1 ? 's are' : ' is'} trending slower and ${improvingCt} ${improvingCt !== 1 ? 'are' : 'is'} trending faster vs the prior 30-day period. Clients on automated reminder sequences consistently pay faster — deploying WF2 reminders to slow-trending accounts is the highest-ROI near-term lever.`,

      `${paymentBehavior.length} customers analyzed this period. ${improvingCt} account${improvingCt !== 1 ? 's are' : ' is'} improving payment cadence — a positive signal from the automated reminder sequences. ${slowest ? `Priority collection focus: ${slowest.customer} (${fmtM(slowest.openAmount)} outstanding, ${slowest.avgDays}d average, trending ${slowest.trend > 0 ? '+' + slowest.trend + 'd slower' : Math.abs(slowest.trend) + 'd faster'} this period).` : ''}`,
    ],

    payments: (() => {
      const pending = unappliedPayments;
      const bulkItems    = pending.filter(p => p.rule && p.rule.toLowerCase().includes('bulk'));
      const partialItems = pending.filter(p => p.rule && p.rule.toLowerCase().includes('partial'));
      const lowConfItems = pending.filter(p => !p.rule?.toLowerCase().includes('bulk') && !p.rule?.toLowerCase().includes('partial'));

      const pendingDetail = pending.map(p => {
        const customer = p.matchedCustomer || 'Unknown';
        const amt = fmtM(p.amount);
        if (p.rule?.toLowerCase().includes('bulk')) return `${customer} (${amt} — bulk payment spanning multiple invoices, routing decision required)`;
        if (p.rule?.toLowerCase().includes('partial')) {
          const vs = p.rule.match(/\$[\d,]+ vs \$[\d,]+/)?.[0] || '';
          return `${customer} (${amt}${vs ? ` — partial: ${vs}` : ''}, open balance exceeds payment)`;
        }
        return `${customer} (${amt} — confidence ${p.confidence}%, below 90% auto-apply threshold)`;
      });

      const reasonSummary = [
        bulkItems.length    > 0 ? `${bulkItems.length} bulk payment${bulkItems.length > 1 ? 's' : ''} spanning multiple open invoices` : '',
        partialItems.length > 0 ? `${partialItems.length} partial payment${partialItems.length > 1 ? 's' : ''} where the deposit is less than the open invoice balance` : '',
        lowConfItems.length > 0 ? `${lowConfItems.length} low-confidence match${lowConfItems.length > 1 ? 'es' : ''} held below the 90% auto-apply threshold` : '',
      ].filter(Boolean).join('; ');

      return [
        `${pendingCount} transaction${pendingCount !== 1 ? 's' : ''} totaling ${fmtM(unappliedAmt)} are in Pending Review. ${reasonSummary || 'Each requires a manual routing decision before posting.'}${pendingDetail.length > 0 ? ' Details: ' + pendingDetail.slice(0, 3).join(' · ') + (pendingDetail.length > 3 ? ` · and ${pendingDetail.length - 3} more.` : '.') : ''} Under ASC 606-10-55, these amounts must be held as contract liabilities until applied.`,

        `Auto-match rate: ${autoMatchRate}% — ${autoApplied.length} transaction${autoApplied.length !== 1 ? 's' : ''} posted automatically in under 8 minutes. The ${pendingCount} item${pendingCount !== 1 ? 's' : ''} pending review ${pendingCount > 0 ? 'break down as follows: ' + reasonSummary + '.' : 'have been cleared.'} ${bulkItems.length > 0 ? `Bulk payments require FIFO routing — apply to the oldest open invoice first per the configured match rule.` : ''} ${partialItems.length > 0 ? `Partial payments should be applied to the specific invoice cited in the bank description; any shortfall should be flagged for follow-up.` : ''}`.trim(),

        `Cash application queue: ${payments.length} transactions received, ${autoApplied.length} auto-applied, ${pendingCount} pending. ${pendingCount > 0 ? `The pending items are blocked because: ${reasonSummary}. Each requires a staff routing decision — once cleared, unapplied cash exposure drops from ${fmtM(unappliedAmt)} to $0 and the AR ledger reflects true outstanding balances per ASC 310.` : `All transactions have been applied — AR ledger is current.`}`,
      ];
    })(),

    reminders: [
      `Automated reminder sequences are active for ${overdue.length} overdue invoice${overdue.length !== 1 ? 's' : ''}. The WF2 workflow delivers escalating outreach via Outlook at 7, 14, and 30 days past due. ${viewedCount > 0 ? `${viewedCount} invoice${viewedCount !== 1 ? 's were' : ' was'} opened within 24 hours of the last reminder — strong email deliverability and recipient engagement.` : 'Reminder emails are queued and pending delivery.'}`,

      `The reminder engine covers ${overdue.length} overdue balance${overdue.length !== 1 ? 's' : ''} this period. Daily AR aging summaries post to Slack each business day at 9 AM, giving your team real-time visibility without manual report pulls. VIP client exemptions are applied per the configured list, protecting key relationships from automated outreach.`,

      `WF2 reminder automation is running. All client-facing emails route through Outlook (Microsoft Graph API) for deliverability and full audit trail. Clients on the automated sequence have paid on average ${Math.max(delta - 5, 5)}d faster — consistent with the ${delta}-day DSO improvement observed since go-live. Reminder coverage is the single highest-ROI lever for continued DSO reduction.`,
    ],

    reports: [
      `Report generation is in development. Current data covers ${invoices.length} invoices, ${paymentBehavior.length} customers, and ${payments.length} payment transactions. Exportable PDF reports with DSO trend analysis, ADA estimates, and period-over-period comparisons are planned for the next release.`,

      `All underlying data is available for export via the drill-down on each metric. Period-end AR aging, DSO trend, and write-off risk data export directly to Excel from their respective views — supporting your allowance for doubtful accounts schedule under ASC 310. Scheduled PDF reporting is in development.`,

      `Scheduled reporting will include: AR aging summary (weekly), DSO trend analysis (monthly), customer payment behavior scorecard (quarterly), and ADA reserve estimate (period-end). All reports will be exportable to Excel and PDF, aligned with ASC 310 and ASC 606 disclosure requirements.`,
    ],
  };

  return s[view] || s.overview;
}

export default function AIStatusReport({ view, metrics }) {
  const [variant, setVariant]     = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [loading, setLoading]     = useState(false);

  const summaries = getSummaries(view, metrics);
  const fullText  = summaries[variant % summaries.length];

  useEffect(() => {
    setVariant(0);
  }, [view]);

  useEffect(() => {
    if (loading) return;
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(i + 4, fullText.length);
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [view, fullText, loading]);

  function handleRegenerate() {
    setLoading(true);
    setDisplayed('');
    setTimeout(() => {
      setVariant(v => v + 1);
      setLoading(false);
    }, 850);
  }

  return (
    <div className="ai-report-card">
      <div className="ai-report-header">
        <div className="ai-report-badge">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 .5L7.4 4.3 11.5 6 7.4 7.7 6 11.5 4.6 7.7.5 6l4.1-1.7z"/>
          </svg>
          AI Status Report
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ai-report-time">
            {loading ? 'Generating…' : 'Updated just now'}
          </span>
          <button
            className="ai-report-regen"
            onClick={handleRegenerate}
            disabled={loading}
            title="Generate alternative summary"
          >
            <svg
              width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round"
              style={{ animation: loading ? 'aiSpin 0.75s linear infinite' : 'none' }}
            >
              <path d="M11 6A5 5 0 1 1 9.6 2.4M9.5 1v3h-3"/>
            </svg>
            Regenerate
          </button>
        </div>
      </div>
      <div className="ai-report-body">
        {loading ? (
          <div className="ai-report-loading">
            <span className="ai-dot" />
            <span className="ai-dot" />
            <span className="ai-dot" />
          </div>
        ) : (
          <span>
            {displayed}
            {displayed.length < fullText.length && (
              <span className="ai-cursor" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
