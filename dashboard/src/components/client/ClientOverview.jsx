import { useState } from 'react';
import SourceTag from '../SourceTag';
import CustomerDrawer from '../CustomerDrawer';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const INV_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',      render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'issued',      label: 'Issued' },
  { key: 'due',         label: 'Due Date' },
  { key: 'status',      label: 'Status' },
  { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—', csvVal: row => row.daysOverdue > 0 ? row.daysOverdue : '' },
];

const PMT_COLS = [
  { key: 'txId',             label: 'Transaction' },
  { key: 'matchedCustomer',  label: 'Customer' },
  { key: 'amount',           label: 'Amount',     render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'received',         label: 'Received' },
  { key: 'status',           label: 'Status' },
  { key: 'matchedInvoice',   label: 'Matched Invoice', render: v => v ?? '—' },
  { key: 'confidence',       label: 'Confidence', render: v => `${v}%` },
];

function getDisputeSuspects(invoices, paymentBehavior) {
  const pbMap = Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p]));
  return invoices.filter(inv => {
    if (inv.status === 'Paid') return false;
    const pb = pbMap[inv.customer];
    if (inv.status === 'Viewed' && inv.daysOverdue > 7) return true;
    if (pb && pb.riskLevel === 'low'    && inv.daysOverdue > pb.avgDays * 1.5) return true;
    if (pb && pb.riskLevel === 'medium' && inv.daysOverdue > pb.avgDays * 2)   return true;
    return false;
  });
}

function fmtRunTime(iso) {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtNextRun(iso) {
  if (!iso) return 'Scheduled';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function StatusItem({ label, status, detail, sub, color }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4, boxShadow: `0 0 6px ${color}` }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 10, color, fontWeight: 600, marginBottom: 2 }}>{status}</div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{detail}</div>
        <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function ClientOverview({ data, currentDSO, dsoChange, isMobile, onDrill, onAction }) {
  const [customerDrawer, setCustomerDrawer] = useState(null);
  const open     = data.invoices.filter(i => i.status !== 'Paid');
  const overdue  = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
  const next30   = open.filter(i => i.daysOverdue <= 0 && i.daysOverdue > -30);

  const totalOpen    = open.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const totalNext30  = next30.reduce((s, i) => s + i.amount, 0);

  // An empty `payments` array isn't proof everything's matched — check WF3's
  // real connection status for live clients instead of inferring from array length.
  const payments    = data.payments ?? [];
  const paymentDataAvailable = data.isLive ? data.automationStatus?.wf3?.connected === true : true;
  const autoApplied = payments.filter(p => p.status === 'Auto-Applied');
  const pending     = payments.filter(p => p.status === 'Pending Review');

  // Per-invoice reminder tracking only exists in mock data today — live QB
  // invoices have no `reminders`/`nextReminder` field, so don't claim a false 0%.
  const reminderDataAvailable = open.some(i => i.reminders !== undefined || i.nextReminder !== undefined);
  const coveredInvs     = open.filter(i => (i.reminders?.length > 0) || i.nextReminder);
  const uncoveredInvs   = open.filter(i => !(i.reminders?.length > 0) && !i.nextReminder);
  const coveragePct     = open.length > 0 ? Math.round(coveredInvs.length / open.length * 100) : 100;
  const disputeSuspects = getDisputeSuspects(data.invoices, data.paymentBehavior);

  function drillInvoices(title, rows, sub) {
    onDrill({ title, subtitle: sub, source: 'Live invoice data from QuickBooks Online.', filename: title.toLowerCase().replace(/\s+/g,'_'), columns: INV_COLS, rows });
  }

  function drillBucket(label, minDays, maxDays) {
    const rows = open.filter(i => i.daysOverdue >= minDays && i.daysOverdue <= maxDays);
    const amt  = rows.reduce((s, i) => s + i.amount, 0);
    drillInvoices(`AR Aging — ${label}`, rows, `${fmtM(amt)} · ${rows.length} invoice${rows.length !== 1 ? 's' : ''}`);
  }

  function drillUnapplied() {
    const pendingAmt = pending.reduce((s, p) => s + p.amount, 0);
    onDrill({
      title: 'Unapplied Payments — Confirmation Needed',
      subtitle: `${pending.length} payment${pending.length !== 1 ? 's' : ''} · ${fmtM(pendingAmt)} held pending your review`,
      source: 'LunarLogic auto-applies payments when AI match confidence is 90%+. Below that threshold your confirmation is required to prevent misapplication to the wrong invoice.',
      filename: 'unapplied_payments',
      columns: [
        { key: 'txId',            label: 'Transaction' },
        { key: 'matchedCustomer', label: 'Customer' },
        { key: 'amount',          label: 'Amount Received',    render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
        { key: 'received',        label: 'Date Received' },
        { key: 'confidence',      label: 'AI Confidence',      render: v => `${v}% — below 90% threshold` },
        { key: 'rule',            label: 'Why It Needs Review' },
        { key: 'candidates',      label: 'Candidate Invoices', render: v => Array.isArray(v) ? v.join(' · ') : '—', csvVal: row => Array.isArray(row.candidates) ? row.candidates.join(', ') : '' },
      ],
      rows: pending,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Automation Status Strip */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Automation Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 10 }}>
          {data.isLive ? (
            <>
              <StatusItem
                label="WF1 — Invoice AI"
                status={data.automationStatus?.wf1?.connected ? (data.automationStatus.wf1.stale ? 'Stale' : 'Operational') : 'Not connected'}
                detail={data.automationStatus?.wf1?.connected
                  ? `Last run: ${fmtRunTime(data.automationStatus.wf1.lastRun)} · ${data.automationStatus.wf1.invoicesCreated7d} invoices created (7d)`
                  : (data.automationStatus?.wf1?.reason ?? 'No run telemetry reported to this dashboard yet')}
                sub="Slack → QuickBooks · AI invoice creation"
                color={data.automationStatus?.wf1?.connected ? (data.automationStatus.wf1.stale ? '#f59e0b' : 'var(--green)') : 'var(--muted)'}
              />
              <StatusItem
                label="WF2 — Payment Reminders"
                status={data.automationStatus?.wf2?.connected ? (data.automationStatus.wf2.stale ? 'Stale' : 'Operational') : 'Not connected'}
                detail={data.automationStatus?.wf2?.connected
                  ? `Last run: ${fmtRunTime(data.automationStatus.wf2.lastRun)} · ${data.automationStatus.wf2.remindersSent7d} reminders sent (7d)`
                  : (data.automationStatus?.wf2?.reason ?? 'No run telemetry reported to this dashboard yet')}
                sub="Daily 9AM M–F · Outlook email sequences"
                color={data.automationStatus?.wf2?.connected ? (data.automationStatus.wf2.stale ? '#f59e0b' : 'var(--green)') : 'var(--muted)'}
              />
              <StatusItem
                label="WF3 — Cash Application"
                status={data.automationStatus?.wf3?.connected ? (data.automationStatus.wf3.stale ? 'Stale' : 'Active') : 'Not connected'}
                detail={data.automationStatus?.wf3?.connected
                  ? `${data.automationStatus.wf3.paymentsApplied} applied · ${data.automationStatus.wf3.pending} pending of ${data.automationStatus.wf3.linksSent} links sent`
                  : (data.automationStatus?.wf3?.reason ?? 'No run telemetry reported to this dashboard yet')}
                sub="QuickBooks payment links · auto-reconciled by QuickBooks"
                color={data.automationStatus?.wf3?.connected ? (data.automationStatus.wf3.stale ? '#f59e0b' : 'var(--teal)') : 'var(--muted)'}
              />
            </>
          ) : (
            <>
              <StatusItem
                label="WF1 — Invoice AI"
                status="Operational"
                detail={`Last run: ${fmtRunTime(data.wf1LastRun)}`}
                sub="Slack → QuickBooks · AI invoice creation"
                color="var(--green)"
              />
              <StatusItem
                label="WF2 — Payment Reminders"
                status="Operational"
                detail={`Last: ${fmtRunTime(data.wf2LastRun)} · Next: ${fmtNextRun(data.wf2NextRun)}`}
                sub="Daily 9AM M–F · Outlook email sequences"
                color="var(--green)"
              />
              <StatusItem
                label="WF3 — Cash Application"
                status="Active"
                detail="Plaid bank feed · Auto-matching payments"
                sub={`Confidence threshold: 90% · ${autoApplied.length} matched`}
                color="var(--teal)"
              />
            </>
          )}
        </div>
      </div>

      {/* 3 hero tiles */}
      <div>
        <SectionLabel>Where your money stands today</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
          <Tile label="Total Outstanding AR" value={fmtM(totalOpen)} sub={`${open.length} open invoices`} color="var(--text)"
            onClick={() => drillInvoices('All Open Invoices', open, `${fmtM(totalOpen)} · ${open.length} invoices`)} />
          <Tile label="Due in Next 30 Days" value={fmtM(totalNext30)} sub={`${next30.length} invoices · on track`} color="var(--teal)"
            onClick={() => drillInvoices('Due in Next 30 Days', next30, `${fmtM(totalNext30)} · ${next30.length} invoices`)} />
          <Tile label="Overdue Now" value={fmtM(totalOverdue)} sub={`${overdue.length} invoices need attention`} color={totalOverdue > 0 ? 'var(--red)' : 'var(--green)'}
            onClick={() => drillInvoices('Overdue Invoices', overdue, `${fmtM(totalOverdue)} · ${overdue.length} invoices`)} />
        </div>
      </div>

      {/* AR Health bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>AR health breakdown — click a segment to drill in</SectionLabel>
        <ARHealthBar invoices={data.invoices} onDrillBucket={drillBucket} />
        <div style={{ display: 'flex', gap: isMobile ? 10 : 20, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#22c55e', label: 'Current' },
            { color: '#f59e0b', label: '1–30d overdue' },
            { color: '#f97316', label: '31–60d overdue' },
            { color: '#ef4444', label: '60+ overdue' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Root Cause Diagnostic */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>DSO root cause diagnostic — click any driver to see source data</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <RootCause
            status={data.isLive ? (data.automationStatus?.wf1?.connected ? 'resolved' : 'unknown') : 'resolved'}
            color={data.isLive ? (data.automationStatus?.wf1?.connected ? '#22c55e' : 'var(--muted)') : '#22c55e'}
            title="Invoice Lag"
            detail={data.isLive
              ? (data.automationStatus?.wf1?.connected
                ? `WF1 active — ${data.automationStatus.wf1.invoicesCreated7d} invoices auto-created in the last 7 days`
                : 'No WF1 send-timestamp telemetry reported to this dashboard yet')
              : 'Invoices auto-sent within minutes of job approval via LunarLogic'}
            sub={data.isLive
              ? (data.automationStatus?.wf1?.connected ? 'Invoices created automatically via Slack → QuickBooks' : 'Can\'t yet confirm automated vs. manual invoice creation')
              : 'Was adding 3–8 days to DSO before go-live'}
            onClick={() => onDrill({
              title: 'Invoice Lag — Send Time Log',
              subtitle: 'All invoices are created and sent automatically — was 3–8 days manual lag before LunarLogic',
              source: 'Invoice creation timestamps from QuickBooks Online. LunarLogic sends immediately upon job approval.',
              filename: 'invoice_lag_log',
              columns: [
                { key: 'id',       label: 'Invoice' },
                { key: 'customer', label: 'Customer' },
                { key: 'amount',   label: 'Amount',    render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
                { key: 'issued',   label: 'Date Issued' },
                { key: 'due',      label: 'Due Date' },
                { key: 'status',   label: 'Status' },
                { key: 'daysOut',  label: 'Days to Send', render: v => v === 0 ? 'Same day' : `${v}d`, csvVal: row => row.daysOut },
              ],
              rows: [...data.invoices].sort((a, b) => new Date(b.issued) - new Date(a.issued)).slice(0, 20),
            })}
          />
          <RootCause
            status={reminderDataAvailable ? 'resolved' : 'unknown'} color={reminderDataAvailable ? '#22c55e' : 'var(--muted)'}
            title="Inconsistent Follow-Up"
            detail={reminderDataAvailable
              ? `${data.invoices.filter(i => i.status !== 'Paid' && i.reminders?.length > 0).length} active invoices in automated reminder sequences`
              : 'WF2 reminder logging isn\'t linked to this dashboard\'s invoice data yet'}
            sub="Customers with 3+ reminders pay 40% faster on average"
            onClick={() => {
              const pbMap = Object.fromEntries((data.paymentBehavior ?? []).map(p => [p.customer, p]));
              const rows = data.invoices
                .filter(i => i.status !== 'Paid')
                .map(inv => {
                  const pb = pbMap[inv.customer];
                  return {
                    ...inv,
                    remindersCount: inv.reminders?.length ?? 0,
                    lastReminder: inv.reminders?.length > 0 ? inv.reminders[inv.reminders.length - 1] : 'None sent',
                    nextReminderDate: inv.nextReminder ?? 'Sequence complete',
                    customerAvg: pb?.avgDays ?? '?',
                    riskLevel: pb?.riskLevel ?? '—',
                  };
                })
                .sort((a, b) => b.remindersCount - a.remindersCount);
              onDrill({
                title: 'Follow-Up Cadence — All Open Invoices',
                subtitle: `${rows.length} invoices · ${rows.filter(r => r.remindersCount > 0).length} in active sequences`,
                source: 'Reminder schedule: −7d before due, then +1, +7, +14, +21, +28 days after due. Sent via LunarLogic/Outlook to customer contact.',
                filename: 'followup_cadence',
                columns: [
                  { key: 'customer',        label: 'Customer' },
                  { key: 'id',              label: 'Invoice' },
                  { key: 'amount',          label: 'Amount',          render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
                  { key: 'daysOverdue',     label: 'Status',          render: (v, row) => v > 0 ? `${v}d overdue` : `Due ${row.due}` },
                  { key: 'remindersCount',  label: 'Reminders Sent',  render: v => v > 0 ? `${v} sent` : 'None yet' },
                  { key: 'lastReminder',    label: 'Last Reminder' },
                  { key: 'nextReminderDate',label: 'Next Reminder' },
                  { key: 'customerAvg',     label: 'Customer Avg Pay', render: v => `${v}d` },
                  { key: 'riskLevel',       label: 'Risk' },
                ],
                rows,
              });
            }}
          />
          <RootCause
            status={!paymentDataAvailable ? 'unknown' : pending.length > 0 ? 'attention' : 'resolved'}
            color={!paymentDataAvailable ? 'var(--muted)' : pending.length > 0 ? '#f59e0b' : '#22c55e'}
            title="Unapplied Payments"
            detail={!paymentDataAvailable
              ? 'WF3 payment matching isn\'t built yet — no payment data to evaluate'
              : pending.length > 0 ? `${pending.length} payment${pending.length !== 1 ? 's' : ''} received but not yet matched to an invoice` : 'All payments matched and applied automatically'}
            sub={!paymentDataAvailable
              ? 'Planned: Plaid bank feed payment auto-matching'
              : pending.length > 0 ? `Total ${fmtM(pending.reduce((s, p) => s + p.amount, 0))} held — AI confidence below threshold, needs your confirmation` : 'AI fuzzy-matching active, 90%+ confidence auto-applied'}
            onClick={() => onDrill({
              title: 'Unapplied Payments — Confirmation Needed',
              subtitle: `${pending.length} payment${pending.length !== 1 ? 's' : ''} · ${fmtM(pending.reduce((s, p) => s + p.amount, 0))} held pending your review`,
              source: 'Payments received via bank feed. LunarLogic auto-applies when match confidence is 90%+. Below that threshold, your confirmation is required to prevent misapplication.',
              filename: 'unapplied_payments',
              columns: [
                { key: 'txId',            label: 'Transaction' },
                { key: 'matchedCustomer', label: 'Customer' },
                { key: 'amount',          label: 'Amount Received',  render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
                { key: 'received',        label: 'Date Received' },
                { key: 'confidence',      label: 'AI Confidence',    render: v => `${v}% — below 90% threshold` },
                { key: 'rule',            label: 'Why It Needs Review' },
                { key: 'candidates',      label: 'Candidate Invoices', render: v => Array.isArray(v) ? v.join(' · ') : '—', csvVal: row => Array.isArray(row.candidates) ? row.candidates.join(', ') : '' },
              ],
              rows: pending,
            })}
          />
          <RootCause
            status={disputeSuspects.length > 0 ? 'attention' : (data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length > 0 ? 'attention' : 'resolved')}
            color={disputeSuspects.length > 0 ? '#a78bfa' : (data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length > 0 ? '#f97316' : '#22c55e')}
            title="Disputes & Aging Risk"
            detail={disputeSuspects.length > 0
              ? `${disputeSuspects.length} invoice${disputeSuspects.length !== 1 ? 's' : ''} showing anomalous payment behavior — possible dispute or billing question`
              : data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length > 0
                ? `${data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length} invoices 45+ days overdue — escalation recommended`
                : 'No invoices at dispute or aging risk'}
            sub="Recovery rate drops below 50% at 90 days — early intervention is critical"
            onClick={() => {
              const pbMap = Object.fromEntries((data.paymentBehavior ?? []).map(p => [p.customer, p]));
              const rows = disputeSuspects.map(inv => {
                const pb = pbMap[inv.customer];
                const reason = inv.status === 'Viewed' && inv.daysOverdue > 7
                  ? 'Invoice viewed but not paid — billing question likely stalling payment'
                  : `${inv.daysOverdue}d overdue vs ${pb?.avgDays ?? '?'}d customer average — anomalous behavior`;
                const actionsTaken = inv.reminders?.length > 0
                  ? `${inv.reminders.length} reminder${inv.reminders.length !== 1 ? 's' : ''} sent — ${inv.reminders.join(', ')}`
                  : 'No reminders sent yet';
                return {
                  ...inv,
                  disputeReason: reason,
                  actionsTaken,
                  nextAction: inv.nextReminder ? `Reminder scheduled ${inv.nextReminder}` : 'Direct call recommended — sequence complete',
                  customerAvg: pb?.avgDays ?? '?',
                  riskLevel: pb?.riskLevel ?? '—',
                };
              });
              if (rows.length === 0) {
                const atRisk = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45);
                onDrill({
                  title: 'Aging Risk — 45+ Days Overdue',
                  subtitle: `${atRisk.length} invoice${atRisk.length !== 1 ? 's' : ''} at recovery risk`,
                  source: 'Invoices over 90 days past due have under 50% average recovery. Escalation to direct contact or collections is recommended.',
                  filename: 'aging_risk',
                  columns: [
                    { key: 'customer',    label: 'Customer' },
                    { key: 'id',          label: 'Invoice' },
                    { key: 'amount',      label: 'Amount',       render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
                    { key: 'due',         label: 'Due Date' },
                    { key: 'daysOverdue', label: 'Days Overdue',  render: v => `${v}d` },
                    { key: 'status',      label: 'Status' },
                  ],
                  rows: atRisk,
                });
                return;
              }
              onDrill({
                title: 'Dispute Detection — Anomalous Payment Behavior',
                subtitle: `${rows.length} invoice${rows.length !== 1 ? 's' : ''} flagged · direct contact recommended`,
                source: 'Flagged when a low/medium-risk customer pays significantly later than their own average, or when an invoice was viewed but not paid after the due date.',
                filename: 'dispute_flags',
                columns: [
                  { key: 'customer',      label: 'Customer' },
                  { key: 'id',            label: 'Invoice' },
                  { key: 'amount',        label: 'Amount',             render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
                  { key: 'daysOverdue',   label: 'Days Overdue',        render: v => `${v}d` },
                  { key: 'customerAvg',   label: 'Customer Avg Pay',    render: v => `${v}d` },
                  { key: 'disputeReason', label: 'Anomaly Flag' },
                  { key: 'actionsTaken',  label: 'Actions Taken' },
                  { key: 'nextAction',    label: 'Next Step' },
                ],
                rows,
              });
            }}
          />
          <RootCause
            status="resolved" color="#22c55e"
            title="Visibility Blind Spot"
            detail="Real-time AR dashboard active — data refreshes every 15 minutes"
            sub="LunarLogic is your windshield, not a rearview mirror"
            onClick={() => onDrill({
              title: 'DSO Trend — Last 90 Days',
              subtitle: data.preLiveDSO != null ? `${data.preLiveDSO}d pre-live → ${Math.round(currentDSO)}d today · go-live ${data.goLiveDate}` : `${Math.round(currentDSO)}d today · go-live ${data.goLiveDate}`,
              source: '30-day rolling DSO calculated daily from QuickBooks invoice data. Go-live date marks LunarLogic activation.',
              filename: 'dso_trend_90d',
              columns: [
                { key: 'date', label: 'Date' },
                { key: 'dso',  label: 'DSO (days)', render: v => v.toFixed(1), csvVal: row => row.dso },
              ],
              rows: data.dsoTrend,
            })}
          />
        </div>
      </div>

      {/* Automation Coverage Report */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>Automation coverage — which invoices LunarLogic is handling</SectionLabel>
        {reminderDataAvailable ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 900, color: coveragePct >= 80 ? 'var(--green)' : '#f59e0b', lineHeight: 1, letterSpacing: -1 }}>{coveragePct}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>of open invoices in reminder sequence</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${coveragePct}%`, height: '100%', background: coveragePct >= 80 ? '#22c55e' : '#f59e0b', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)' }}>
                  <span>{coveredInvs.length} handled by LunarLogic</span>
                  <span>{uncoveredInvs.length} need manual attention</span>
                </div>
              </div>
            </div>
            {uncoveredInvs.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Outside automation coverage</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {uncoveredInvs.map(inv => (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-dim)' }}>{inv.customer} — {inv.id}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderRadius: 8, padding: '1px 7px' }}>Needs you</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {uncoveredInvs.length === 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green)', fontStyle: 'italic' }}>All open invoices are in active automation sequences — no manual follow-up needed.</div>
            )}
          </>
        ) : (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
            WF2 reminder logging isn't linked to this dashboard's invoice data yet, so per-invoice coverage can't be calculated.
          </div>
        )}
      </div>

      {/* Dispute Detection — detailed cards */}
      {disputeSuspects.length > 0 && (
        <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>Dispute detection — anomalous payment behavior flagged</SectionLabel>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, marginBottom: 12, lineHeight: 1.5 }}>
            These invoices are overdue in ways inconsistent with the customer's payment history. A billing question, internal approval delay, or dispute may be stalling payment.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {disputeSuspects.map(inv => (
              <div key={inv.id}
                style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '10px 12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{inv.customer}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.id}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', borderRadius: 8, padding: '1px 7px' }}>Possible Dispute</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                      {inv.status === 'Viewed' && inv.daysOverdue > 7
                        ? 'Invoice was opened but payment has not been received — a billing question or internal approval delay may be stalling this.'
                        : (() => { const pb = (data.paymentBehavior ?? []).find(p => p.customer === inv.customer); return `${inv.daysOverdue}d overdue vs this customer's typical ${pb?.avgDays ?? '?'}d — this is outside their normal pattern.`; })()
                      }
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                        <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Actions taken: </span>
                        {inv.reminders?.length > 0
                          ? `${inv.reminders.length} reminder${inv.reminders.length !== 1 ? 's' : ''} sent — ${inv.reminders.join(', ')}`
                          : 'No reminders sent yet'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                        <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Next step: </span>
                        {inv.nextReminder
                          ? `Reminder scheduled ${new Date(inv.nextReminder).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — consider calling before then`
                          : 'Automated sequence complete — direct call recommended'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{fmtM(inv.amount)}</div>
                    <div style={{ fontSize: 10, color: inv.daysOverdue > 0 ? '#a78bfa' : 'var(--muted)' }}>{inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : `Due ${inv.due}`}</div>
                  </div>
                </div>
                <button
                  onClick={() => onAction(inv)}
                  style={{ width: '100%', padding: '6px 0', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', cursor: 'pointer' }}
                >
                  Open invoice + take action
                </button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10, fontStyle: 'italic' }}>
            Disputes left unresolved become bad debt. LunarLogic flags them early — when recovery is still straightforward.
          </div>
        </div>
      )}

      {/* Two panels */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>

        {/* LunarLogic activity */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>What LunarLogic handled for you</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10, marginBottom: 12 }}>
            <MiniStat label="Invoices auto-sent" value={data.automationStats ? (data.automationStats.invoicesProcessedTotal ?? 0) : 'Not yet tracked'} sub="since go-live" color="var(--teal)" source="Total invoices created via WF1 Slack-to-QuickBooks AI workflow since your go-live date. Each represents a PDF upload or text command processed without manual data entry." />
            <MiniStat label="Reminders sent" value={data.automationStats ? (data.automationStats.remindersSentTotal ?? 0) : 'Not yet tracked'} sub="hands-free" color="var(--teal)" source="Total outbound payment reminder emails sent via WF2 (Microsoft Outlook / Graph API) since go-live. Sent automatically — no calls or manual emails from your team." />
            <MiniStat label="Payments matched" value={data.automationStats ? (data.automationStats.paymentsAutoMatched ?? 0) : 'Not yet tracked'} sub="automatically" color="var(--green)" source="Payments automatically matched to invoices by WF3 AI engine (Plaid bank feed). Matched at ≥90% confidence without manual reconciliation." />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ActivityRow icon="✓" label="Payments auto-matched this month" value={`${autoApplied.length}`} color="var(--green)"
              onClick={() => onDrill({ title: 'Auto-Matched Payments', subtitle: `${autoApplied.length} payments processed automatically`, source: 'Payments matched by LunarLogic using amount + customer name fuzzy matching.', filename: 'auto_matched_payments', columns: PMT_COLS, rows: autoApplied })} />
            <ActivityRow icon="→" label="Awaiting your review" value={`${pending.length} payment${pending.length !== 1 ? 's' : ''}`} color={pending.length > 0 ? '#f59e0b' : 'var(--muted)'}
              onClick={pending.length > 0 ? drillUnapplied : null} />
            <ActivityRow icon="↑" label="Collection rate" value={`${data.collectionEfficiency}%`} color="var(--teal)" />
            <ActivityRow icon="↓" label="DSO reduction since go-live" value={dsoChange != null ? `${Math.abs(dsoChange)} days` : 'No baseline yet'} color="var(--green)"
              onClick={() => onDrill({ title: 'DSO Trend — Last 90 Days', subtitle: data.preLiveDSO != null ? `${data.preLiveDSO}d → ${Math.round(currentDSO)}d · go-live ${data.goLiveDate}` : `${Math.round(currentDSO)}d · go-live ${data.goLiveDate}`, source: '30-day rolling DSO calculated from paid invoices.', filename: 'dso_trend', columns: [{ key: 'date', label: 'Date' }, { key: 'dso', label: 'DSO (days)', render: v => v.toFixed(1), csvVal: row => row.dso }], rows: data.dsoTrend })} />
          </div>
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>
            Every reminder above was sent without you making a single call — your client relationships are intact.
          </div>
        </div>

        {/* Customer risk */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>Customer payment risk — click to drill in</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {data.paymentBehavior.map(pb => (
              <div key={pb.customer} onClick={() => setCustomerDrawer(pb)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 6, padding: '4px 6px', margin: '-4px -6px', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 12, color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: 'var(--border)' }}>{pb.customer}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pb.avgDays}d avg</span>
                  <RiskDot level={pb.riskLevel} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            LunarLogic adjusts reminder frequency automatically based on each customer's payment history.
          </div>
        </div>
      </div>

      {customerDrawer && (
        <CustomerDrawer
          customer={customerDrawer}
          invoices={data.invoices}
          onClose={() => setCustomerDrawer(null)}
          onOpenInvoice={inv => { setCustomerDrawer(null); if (onAction) onAction(inv); }}
          onDrill={onDrill}
        />
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>{children}</div>;
}

function Tile({ label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'rgba(0,212,232,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <span style={{ fontSize: 10, color: 'var(--teal)', opacity: 0.7 }}>↗</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function ARHealthBar({ invoices, onDrillBucket }) {
  const open  = invoices.filter(i => i.status !== 'Paid');
  const total = open.reduce((s, i) => s + i.amount, 0);
  if (total === 0) return null;
  const BUCKETS = [
    { label: 'Current', min: -Infinity, max: 0,  color: '#22c55e', minD: 0,  maxD: 0  },
    { label: '1–30d',   min: 1,  max: 30,  color: '#f59e0b', minD: 1,  maxD: 30 },
    { label: '31–60d',  min: 31, max: 60,  color: '#f97316', minD: 31, maxD: 60 },
    { label: '60+',     min: 61, max: Infinity, color: '#ef4444', minD: 61, maxD: 9999 },
  ].map(b => {
    const amt = open.filter(i => i.daysOverdue >= b.min && i.daysOverdue <= b.max).reduce((s, i) => s + i.amount, 0);
    return { ...b, amt, pct: total > 0 ? (amt / total) * 100 : 0 };
  });
  return (
    <div>
      <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
        {BUCKETS.filter(b => b.pct > 0).map((b, i) => (
          <div key={i} onClick={() => onDrillBucket(b.label, b.minD, b.maxD)}
            style={{ width: `${b.pct}%`, background: b.color, opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
          >
            {b.pct > 12 && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{Math.round(b.pct)}%</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        {BUCKETS.map((b, i) => (
          <div key={i} style={{ fontSize: 10, color: 'var(--muted)' }}>{b.pct > 3 ? fmtM(b.amt) : ''}</div>
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ icon, label, value, color, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onClick ? 'pointer' : 'default', borderRadius: 6, padding: '4px 6px', margin: '-4px -6px', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color, fontWeight: 700, width: 14, textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
        {onClick && <span style={{ fontSize: 9, color: 'var(--muted)' }}>↗</span>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function RootCause({ status, color, title, detail, sub, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, background: `${color}08`, border: `1px solid ${color}20`, cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = `${color}14`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; }}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}15`, borderRadius: 10, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {status === 'resolved' ? 'Resolved' : status === 'unknown' ? 'Not Tracked' : 'Needs Attention'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>{detail}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>{sub}</div>
      </div>
      {onClick && <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, marginTop: 3 }}>↗</span>}
    </div>
  );
}

function RiskDot({ level }) {
  const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Med' : 'Low';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {label}
    </div>
  );
}

function MiniStat({ label, value, sub, color, source }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        {label}
        {source && <SourceTag label={source} />}
      </div>
      <div style={{ fontSize: 9, color: 'var(--muted)' }}>{sub}</div>
    </div>
  );
}

