import { useState, useMemo } from 'react';

function fmtK(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Returns WF2 sequence status for an invoice
function getSequenceStatus(inv) {
  const reminders = inv.reminders ?? [];
  const next = inv.nextReminder;
  return {
    sent: reminders.length,
    lastSent: reminders[reminders.length - 1] ?? null,
    nextDate: next,
  };
}

function getPaymentPrediction(inv, pb) {
  if (!pb || inv.status === 'Paid') return null;
  const { avgDays } = pb;
  if (inv.daysOverdue <= 0) {
    const daysUntilDue = -inv.daysOverdue;
    if (daysUntilDue > 14) return { label: 'On Track',  color: '#22c55e', pct: 88 };
    if (daysUntilDue > 0)  return { label: 'Watch',     color: '#f59e0b', pct: 65 };
    return { label: 'Due Today', color: '#f59e0b', pct: 60 };
  }
  const ratio = inv.daysOverdue / Math.max(avgDays, 1);
  if (ratio < 0.35) return { label: 'At Risk',   color: '#f59e0b', pct: 52 };
  if (ratio < 0.75) return { label: 'High Risk', color: '#f97316', pct: 28 };
  return { label: 'Critical', color: '#ef4444', pct: 11 };
}

function nextAction(inv, pb) {
  const d    = inv.daysOverdue;
  const risk = pb?.riskLevel ?? 'medium';
  if (d > 90)  return { action: 'Escalate to collections',        urgency: 'critical', daysLabel: `${d}d overdue` };
  if (d > 60)  return { action: 'Personal call — senior contact', urgency: 'high',     daysLabel: `${d}d overdue` };
  if (d > 30)  return { action: 'Phone call + formal notice',     urgency: 'high',     daysLabel: `${d}d overdue` };
  if (d > 14)  return { action: 'Follow-up call recommended',     urgency: 'medium',   daysLabel: `${d}d overdue` };
  if (d > 0)   return { action: 'WF2 reminder sequence active',   urgency: 'low',      daysLabel: `${d}d overdue` };
  if (risk === 'high') return { action: 'Monitor — high-risk payer', urgency: 'watch', daysLabel: 'Not yet due' };
  return { action: 'On track', urgency: 'ok', daysLabel: 'Not yet due' };
}

const URGENCY_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e', watch: '#a78bfa', ok: '#4e6a88' };
const URGENCY_LABEL = { critical: 'Critical', high: 'Urgent', medium: 'Follow up', low: 'Automated', watch: 'Watch', ok: 'On track' };

function dsoImpact(inv, totalAR) {
  if (inv.daysOverdue <= 0) return null;
  const pct    = totalAR > 0 ? inv.amount / totalAR : 0;
  const impact = Math.round(pct * inv.daysOverdue * 0.8 * 10) / 10;
  return impact >= 0.1 ? impact : null;
}

// Dispute detection — returns null if no dispute signal, or an object with analysis
function detectDispute(inv, pb) {
  if (inv.status === 'Paid' || inv.daysOverdue <= 0) return null;
  const avgDays = pb?.avgDays ?? 30;
  const risk    = pb?.riskLevel ?? 'medium';

  // Signal 1: Invoice viewed but silent for 7+ days overdue
  if (inv.status === 'Viewed' && inv.daysOverdue > 7) {
    return {
      signal: `Viewed ${inv.daysOverdue}d ago — no payment or response`,
      confidence: 'medium',
      diagnosis: `${inv.customer} opened this invoice but has not paid or replied. This view-then-silence pattern typically indicates a question about line items, a change in AP contact, or an internal approval hold. Standard reminders are unlikely to resolve this without direct outreach.`,
      aiDraft: [
        `Subject: Quick question on ${inv.id} — ${inv.customer}`,
        ``,
        `Hi [Name],`,
        ``,
        `I wanted to follow up on invoice ${inv.id} for $${inv.amount.toLocaleString()}, due ${inv.due}. Our records show it was received — if you have any questions about the billing or need anything clarified to process payment, I'm happy to help.`,
        ``,
        `If there's a specific concern, a quick call or reply works best.`,
        ``,
        `Best,`,
        `[Your name]`,
      ].join('\n'),
      aiStatus: 'draft_ready',
      suggestedAction: 'Send AI-drafted inquiry. If no response in 48h, escalate to call.',
    };
  }

  // Signal 2: Historically reliable customer far outside their normal window
  if (risk === 'low' && inv.daysOverdue > avgDays * 1.5) {
    const pctOver = Math.round((inv.daysOverdue / avgDays) * 100);
    return {
      signal: `Low-risk customer ${pctOver}% past their avg — anomaly detected`,
      confidence: 'high',
      diagnosis: `${inv.customer} consistently pays within ${avgDays} days. Being ${inv.daysOverdue} days overdue is a significant deviation for this account. Most common causes at this stage: AP personnel change, an unraised question about a line item, or an internal approval bottleneck.`,
      aiDraft: [
        `Subject: ${inv.id} — Quick check-in`,
        ``,
        `Hi [Name],`,
        ``,
        `Reaching out about invoice ${inv.id} ($${inv.amount.toLocaleString()}, due ${inv.due}). Given your usual payment pattern, we wanted to check if everything looks correct or if there's something we can help move through on our end.`,
        ``,
        `Let us know if anything needs attention.`,
        ``,
        `Best,`,
        `[Your name]`,
      ].join('\n'),
      aiStatus: 'draft_ready',
      suggestedAction: 'Personalized check-in email — deviation from established pattern warrants direct outreach.',
    };
  }

  // Signal 3: Any customer significantly beyond double their average
  if (inv.daysOverdue > avgDays * 2 && inv.daysOverdue > 30) {
    return {
      signal: `${inv.daysOverdue}d overdue — ${Math.round(inv.daysOverdue / avgDays)}x their historical avg`,
      confidence: 'high',
      diagnosis: `Multiple reminders sent with no payment. At this stage the delay suggests a dispute, internal cash constraint, or a delivery/service quality concern the customer has not raised directly. Automated reminders are no longer sufficient.`,
      aiDraft: [
        `Subject: Invoice ${inv.id} — Requires Your Attention`,
        ``,
        `Dear [Name],`,
        ``,
        `Invoice ${inv.id} for $${inv.amount.toLocaleString()} is now ${inv.daysOverdue} days past due. We've sent several reminders and want to understand if there's an issue we can help resolve.`,
        ``,
        `If there's a concern about the invoice or the work completed, please reply so we can address it directly. We'd prefer to resolve this together rather than escalate further.`,
        ``,
        `A brief call this week would help — please let me know what works for you.`,
        ``,
        `Regards,`,
        `[Your name]`,
      ].join('\n'),
      aiStatus: 'escalated',
      suggestedAction: 'Direct call required. AI email drafted as backup if call is not answered.',
    };
  }

  return null;
}

const ACTION_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',       render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'due',         label: 'Due Date' },
  { key: 'daysOverdue', label: 'Days Overdue',  render: v => v > 0 ? `${v}d` : '—',  csvVal: row => row.daysOverdue > 0 ? row.daysOverdue : '' },
  { key: 'action',      label: 'Recommended Action' },
  { key: 'urgency',     label: 'Priority',     render: v => URGENCY_LABEL[v] ?? v },
  { key: 'impact',      label: 'DSO Impact',   render: v => v != null ? `~${v}d` : '—', csvVal: row => row.impact ?? '' },
];

export default function ClientActionPlan({ invoices, paymentBehavior, payments, currentDSO, isMobile, onDrill, onAction }) {
  const [filter, setFilter] = useState('priority');

  const totalAR = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
  const pbMap   = Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p]));

  const allOpen = invoices
    .filter(i => i.status !== 'Paid')
    .map(inv => {
      const pb      = pbMap[inv.customer];
      const na      = nextAction(inv, pb);
      const impact  = dsoImpact(inv, totalAR);
      const dispute = detectDispute(inv, pb);
      const seq     = getSequenceStatus(inv);
      return { ...inv, ...na, impact, pb, dispute, seq };
    })
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, watch: 4, ok: 5 };
      return (order[a.urgency] - order[b.urgency]) || b.amount - a.amount;
    });

  const disputes    = allOpen.filter(i => i.dispute != null);
  const needsAction = allOpen.filter(i => filter === 'all' ? true : ['critical','high','medium'].includes(i.urgency));
  const onTrack     = allOpen.filter(i => ['ok','low','watch'].includes(i.urgency));

  const totalImpact  = allOpen.filter(i => i.daysOverdue > 0).reduce((s, i) => s + (i.impact ?? 0), 0);
  const projectedDSO = Math.round(Math.max(currentDSO - totalImpact, currentDSO * 0.8));
  const urgentCount  = allOpen.filter(i => ['critical','high','medium'].includes(i.urgency)).length;

  function drillAction(title, rows, sub) {
    onDrill({ title, subtitle: sub, source: 'Priority ranked by days overdue and dollar value. Recommended actions based on LunarLogic collection playbook.', filename: title.toLowerCase().replace(/\s+/g,'_'), columns: ACTION_COLS, rows });
  }

  function drillInvoice(inv) {
    const history = (payments ?? []).filter(p => p.matchedCustomer === inv.customer);
    const HIST_COLS = [
      { key: 'txId',           label: 'Transaction' },
      { key: 'received',       label: 'Date Received' },
      { key: 'amount',         label: 'Amount',   render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
      { key: 'status',         label: 'Status' },
      { key: 'matchedInvoice', label: 'Invoice',  render: v => v ?? '—' },
      { key: 'confidence',     label: 'Match %',  render: v => `${v}%` },
    ];
    const invRow = [{ ...inv, action: inv.action ?? nextAction(inv, pbMap[inv.customer]).action }];
    onDrill({
      title: `Invoice ${inv.id} — ${inv.customer}`,
      subtitle: `$${inv.amount.toLocaleString()} · Due ${inv.due} · ${inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : 'current'}`,
      source: `Payment history for ${inv.customer} — ${history.length} transaction${history.length !== 1 ? 's' : ''} on record.`,
      filename: `invoice_${inv.id}`,
      columns: [
        ...ACTION_COLS,
        ...HIST_COLS.map(c => ({ ...c, key: `_hist_${c.key}`, label: `Pmt: ${c.label}` })),
      ].slice(0, 8),
      rows: invRow.concat(history.map(h => ({ ...h, id: h.txId, customer: h.matchedCustomer, due: '—', daysOverdue: 0, action: 'Payment received', urgency: 'ok', impact: null }))),
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Working capital summary */}
      {(() => {
        const overdueInvs = invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
        const overdueAR   = overdueInvs.reduce((s, i) => s + i.amount, 0);
        const dsoSavings  = totalAR > 0 ? Math.round((overdueAR / totalAR) * currentDSO * 0.6) : 0;
        if (overdueInvs.length === 0) return null;
        return (
          <div style={{ background: 'rgba(0,212,232,0.06)', border: '1px solid rgba(0,212,232,0.25)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Working capital at stake</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{fmtK(overdueAR)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>locked in {overdueInvs.length} overdue invoice{overdueInvs.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Collecting these this week would compress your DSO by approximately <strong style={{ color: 'var(--teal)' }}>{dsoSavings} additional days</strong> — moving it from {Math.round(currentDSO)} toward your best-possible {Math.round(currentDSO - dsoSavings)} days.
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, fontStyle: 'italic' }}>Revenue is a promise. Cash is the reality. LunarLogic moves it between the two.</div>
          </div>
        );
      })()}

      {/* AI Dispute Monitor */}
      {disputes.length > 0 && (
        <DisputeMonitor disputes={disputes} isMobile={isMobile} onAction={onAction} onDrill={onDrill} />
      )}

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        <SummaryTile label="Needs attention" value={urgentCount} sub="invoices to act on" color="var(--red)"
          onClick={() => drillAction('Action Required — All Urgent Invoices', allOpen.filter(i => ['critical','high','medium'].includes(i.urgency)), `${urgentCount} invoice${urgentCount !== 1 ? 's' : ''} need action`)} />
        <SummaryTile label="DSO improvement possible" value={`−${Math.round(totalImpact)}d`} sub="if resolved this week" color="var(--green)"
          onClick={() => drillAction('Overdue Invoices — DSO Impact Analysis', allOpen.filter(i => i.daysOverdue > 0), `${allOpen.filter(i=>i.daysOverdue>0).length} overdue invoices · potential ${Math.round(totalImpact)}d DSO improvement`)} />
        <SummaryTile label="Projected DSO after action" value={projectedDSO} sub={`currently ${Math.round(currentDSO)}d`} color="var(--teal)"
          style={isMobile ? { gridColumn: '1 / -1' } : {}}
          onClick={() => drillAction('Full Action Plan Export', allOpen, `${allOpen.length} open invoices with recommended actions`)} />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ id: 'priority', label: 'Needs action' }, { id: 'all', label: 'All open' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${filter === f.id ? 'var(--teal)' : 'var(--border)'}`,
            background: filter === f.id ? 'rgba(0,212,232,0.08)' : 'none',
            color: filter === f.id ? 'var(--teal)' : 'var(--muted)',
          }}>{f.label}</button>
        ))}
        <button onClick={() => drillAction('Full Action Plan Export', allOpen, `${allOpen.length} open invoices`)}
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' }}>
          Export all
        </button>
      </div>

      {/* Action queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {needsAction.map(inv => <ActionRow key={inv.id} inv={inv} isMobile={isMobile} onClick={() => drillInvoice(inv)} onAction={() => onAction(inv)} />)}
        {needsAction.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>No urgent items — you're in great shape.</div>
        )}
      </div>

      {/* Handled by LunarLogic */}
      {onTrack.length > 0 && filter === 'all' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap' }}>
              Handled by LunarLogic ({onTrack.length})
            </div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {onTrack.map(inv => (
              <AutomatedRow key={inv.id} inv={inv} isMobile={isMobile} onClick={() => drillInvoice(inv)} onAction={() => onAction(inv)} />
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        Click any row to drill into invoice detail and payment history — CSV and Excel export available. Items in "Handled by LunarLogic" are in the WF2 automated reminder sequence — no manual action needed unless escalated.
      </div>
    </div>
  );
}

// AI Dispute Monitor panel
function DisputeMonitor({ disputes, isMobile, onAction, onDrill }) {
  const [expanded, setExpanded] = useState(null);
  const [draftOpen, setDraftOpen] = useState(null);

  return (
    <div style={{ border: '1px solid rgba(167,139,250,0.35)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'rgba(167,139,250,0.08)', borderBottom: '1px solid rgba(167,139,250,0.2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            AI Dispute Monitor — {disputes.length} invoice{disputes.length !== 1 ? 's' : ''} flagged
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
            Anomalies detected by LunarLogic — AI has prepared outreach for each. Review and approve or escalate.
          </div>
        </div>
      </div>

      {/* Dispute cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {disputes.map((inv, idx) => {
          const d = inv.dispute;
          const isOpen = expanded === inv.id;
          const isDraftOpen = draftOpen === inv.id;
          const confidenceColor = d.confidence === 'high' ? '#ef4444' : '#f59e0b';

          return (
            <div key={inv.id} style={{ borderBottom: idx < disputes.length - 1 ? '1px solid rgba(167,139,250,0.15)' : 'none' }}>
              {/* Summary row */}
              <div
                onClick={() => setExpanded(isOpen ? null : inv.id)}
                style={{ padding: '12px 16px', cursor: 'pointer', background: isOpen ? 'rgba(167,139,250,0.06)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(167,139,250,0.04)'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                      {!isMobile && <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{inv.id}</span>}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{inv.customer}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: confidenceColor, background: `${confidenceColor}15`, border: `1px solid ${confidenceColor}30`, borderRadius: 10, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {d.confidence} confidence
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#a78bfa' }}>{d.signal}</div>
                    {d.aiStatus === 'draft_ready' && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>AI draft ready — awaiting your approval to send</div>
                    )}
                    {d.aiStatus === 'escalated' && (
                      <div style={{ fontSize: 10, color: '#f97316', marginTop: 3 }}>Automated sequence exhausted — direct call required</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{isOpen ? '▲ collapse' : '▼ expand'}</span>
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* AI diagnosis */}
                  <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>AI Diagnosis</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{d.diagnosis}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)', borderTop: '1px solid rgba(167,139,250,0.12)', paddingTop: 8 }}>
                      <span style={{ fontWeight: 600, color: '#a78bfa' }}>Suggested action: </span>{d.suggestedAction}
                    </div>
                  </div>

                  {/* WF2 reminder history */}
                  {inv.seq.sent > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>WF2 reminder history: </span>
                      {(inv.reminders ?? []).map((r, i) => (
                        <span key={i} style={{ marginRight: 8 }}>Reminder {i + 1} — {fmtDate(r)}</span>
                      ))}
                      {inv.nextReminder && (
                        <span style={{ color: 'var(--teal)' }}>· Next scheduled: {fmtDate(inv.nextReminder)}</span>
                      )}
                    </div>
                  )}

                  {/* AI draft toggle */}
                  <div>
                    <button
                      onClick={() => setDraftOpen(isDraftOpen ? null : inv.id)}
                      style={{ fontSize: 11, fontWeight: 600, color: isDraftOpen ? '#a78bfa' : 'var(--muted)', background: 'none', border: `1px solid ${isDraftOpen ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`, borderRadius: 5, padding: '4px 12px', cursor: 'pointer', marginBottom: isDraftOpen ? 8 : 0 }}
                    >
                      {isDraftOpen ? 'Hide AI draft' : 'Preview AI draft'}
                    </button>
                    {isDraftOpen && (
                      <pre style={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', lineHeight: 1.7, overflowX: 'auto' }}>
                        {d.aiDraft}
                      </pre>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {d.aiStatus === 'draft_ready' && (
                      <button
                        onClick={() => onAction(inv)}
                        style={{ padding: '5px 14px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}
                      >
                        Approve &amp; send AI draft
                      </button>
                    )}
                    <button
                      onClick={() => onAction(inv)}
                      style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}
                    >
                      Open invoice — take action
                    </button>
                    <button
                      onClick={() => onAction(inv)}
                      style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
                    >
                      Escalate to call
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionRow({ inv, isMobile, onClick, onAction }) {
  const color = URGENCY_COLOR[inv.urgency];
  const isAutomated = inv.urgency === 'low';
  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${['critical','high'].includes(inv.urgency) ? color+'44' : 'var(--border)'}`, borderLeft: `3px solid ${color}`, borderRadius: 8, overflow: 'hidden' }}>
      <div onClick={onClick} style={{ padding: '12px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              {!isMobile && <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{inv.id}</span>}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{inv.customer}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.daysLabel}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color, fontWeight: 600 }}>{inv.action}</span>
              {inv.impact != null && <span style={{ fontSize: 10, color: 'var(--green)', background: 'rgba(34,197,94,0.08)', borderRadius: 4, padding: '1px 6px' }}>saves ~{inv.impact}d DSO</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{URGENCY_LABEL[inv.urgency]}</span>
          </div>
        </div>
      </div>
      {/* Quick action strip */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '6px 14px', display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(0,0,0,0.12)', flexWrap: 'wrap' }}>
        <QuickBtn label="Take action" primary isMobile={isMobile} onClick={e => { e.stopPropagation(); onAction(); }} />
        <QuickBtn label="View detail" isMobile={isMobile} onClick={e => { e.stopPropagation(); onClick(); }} />
        {inv.dispute && (
          <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>
            Dispute flagged — see AI Monitor above
          </span>
        )}
        {!inv.dispute && (() => {
          const pred = getPaymentPrediction(inv, inv.pb);
          if (!pred) return null;
          return (
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: pred.color, background: `${pred.color}15`, border: `1px solid ${pred.color}30`, borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>
              {pred.label} · {pred.pct}% pay likelihood
            </span>
          );
        })()}
      </div>
    </div>
  );
}

// Rows for invoices in WF2 automated sequence
function AutomatedRow({ inv, isMobile, onClick, onAction }) {
  const { seq } = inv;
  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid #22c55e', borderRadius: 8, opacity: 0.85, cursor: 'pointer', gap: 10 }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
          {!isMobile && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>{inv.id}</span>}
          <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</span>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.daysLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {seq.sent > 0 ? (
            <span style={{ fontSize: 10, color: '#22c55e' }}>
              WF2 — Reminder {seq.sent} sent {seq.lastSent ? fmtDate(seq.lastSent) : ''}
            </span>
          ) : (
            <span style={{ fontSize: 10, color: '#22c55e' }}>WF2 — First reminder scheduled</span>
          )}
          {seq.nextDate && (
            <span style={{ fontSize: 10, color: 'var(--teal)' }}>· Next: {fmtDate(seq.nextDate)}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
        <button
          onClick={e => { e.stopPropagation(); onAction(); }}
          style={{ fontSize: 10, fontWeight: 600, color: 'var(--teal)', background: 'none', border: '1px solid rgba(0,212,232,0.3)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}
        >
          Open
        </button>
      </div>
    </div>
  );
}

function QuickBtn({ label, onClick, primary, isMobile }) {
  return (
    <button onClick={onClick} style={{
      padding: isMobile ? '8px 14px' : '4px 10px',
      minHeight: isMobile ? 36 : 'auto',
      fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: 'pointer',
      background: primary ? 'rgba(0,212,232,0.12)' : 'none',
      border: `1px solid ${primary ? 'var(--teal)' : 'var(--border)'}`,
      color: primary ? 'var(--teal)' : 'var(--muted)',
    }}>{label}</button>
  );
}

function SummaryTile({ label, value, sub, color, onClick, style = {} }) {
  return (
    <div onClick={onClick}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s', ...style }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'rgba(0,212,232,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <span style={{ fontSize: 10, color: 'var(--teal)', opacity: 0.6 }}>↗</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}
