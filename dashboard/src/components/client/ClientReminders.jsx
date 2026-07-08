import { useState } from 'react';
import { useToast } from '../../lib/toast';
import { customerScore, scoreBand } from '../../lib/scoring';
import { AutomationHeader, Card, StatTile, fmtM, fmtRunTime, tileGridStyle } from './automationKit';

const CADENCE = [
  { at: '−7d', label: 'Friendly heads-up' },
  { at: '+1d', label: 'Payment due' },
  { at: '+7d', label: 'First follow-up' },
  { at: '+14d', label: 'Second follow-up' },
  { at: '+21d', label: 'Firm reminder' },
  { at: '+28d', label: 'Final notice' },
];

function ScoreChip({ score }) {
  if (score == null) return null;
  const b = scoreBand(score);
  return <span title={`Payment health: ${b.label}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: b.color }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: b.color }} />{score} · {b.label}</span>;
}

function localReminderDraft(inv, companyName) {
  const sent = inv.reminders?.length ?? 0;
  const stage = sent <= 1 ? 'friendly' : sent <= 3 ? 'firm' : 'final';
  const amt = `$${inv.amount.toLocaleString()}`;
  const who = inv.customer;
  const sig = `\n\nPay online in one click: https://pay.lunarlogic.ai/i/${inv.id}\n\nThank you,\n${companyName || 'Accounts Receivable'}`;
  if (stage === 'friendly') return {
    subject: `Friendly reminder — invoice ${inv.id}`,
    body: `Hi ${who},\n\nJust a friendly reminder that invoice ${inv.id} for ${amt} ${inv.daysOverdue > 0 ? `was due on ${inv.due}` : `is due ${inv.due}`}. If it's already on its way, thank you — please disregard.\n\nHappy to resend the invoice or answer any questions.${sig}`,
  };
  if (stage === 'firm') return {
    subject: `Payment overdue — invoice ${inv.id} (${inv.daysOverdue}d)`,
    body: `Hi ${who},\n\nOur records show invoice ${inv.id} for ${amt} is now ${inv.daysOverdue} days past due (due ${inv.due}). Could you let us know the expected payment date, or flag anything holding it up?${sig}`,
  };
  return {
    subject: `Final notice — invoice ${inv.id}, ${inv.daysOverdue}d overdue`,
    body: `Hi ${who},\n\nInvoice ${inv.id} for ${amt} is now ${inv.daysOverdue} days past due despite prior reminders. Please arrange payment within 5 business days, or reply so we can discuss a plan before this escalates further.${sig}`,
  };
}

export default function ClientReminders({ data, clientId, isMobile, onDrill }) {
  const toast = useToast();
  const [draft, setDraft] = useState(null);
  const [drafting, setDrafting] = useState(null);

  const connected = data.isLive ? data.automationStatus?.wf2?.connected === true : true;
  const statusColor = connected ? 'var(--green)' : 'var(--muted)';

  const open = data.invoices.filter(i => i.status !== 'Paid');
  const reminderDataAvailable = open.some(i => i.reminders !== undefined || i.nextReminder !== undefined);
  const covered = open.filter(i => (i.reminders?.length > 0) || i.nextReminder);
  const coveragePct = open.length > 0 ? Math.round((covered.length / open.length) * 100) : 100;
  const totalReminders = data.automationStats?.remindersSentTotal ?? null;
  const lastRun = data.isLive ? data.automationStatus?.wf2?.lastRun : data.wf2LastRun;
  const nextRun = data.isLive ? null : data.wf2NextRun;

  // ── Follow-up organized by customer ───────────────────────────────────
  const pbMap = Object.fromEntries((data.paymentBehavior ?? []).map(p => [p.customer, p]));
  const collectedBy = {};
  (data.payments ?? []).filter(p => p.status === 'Auto-Applied' || p.status === 'Manual')
    .forEach(p => { collectedBy[p.matchedCustomer] = (collectedBy[p.matchedCustomer] || 0) + p.amount; });

  const byCustomer = Object.values(open.reduce((acc, inv) => {
    const c = acc[inv.customer] || (acc[inv.customer] = { customer: inv.customer, outstanding: 0, reminders: 0, overdue: 0, oldestInv: null });
    c.outstanding += inv.amount;
    c.reminders += inv.reminders?.length ?? 0;
    if (inv.daysOverdue > 0) c.overdue += inv.amount;
    if (!c.oldestInv || inv.daysOverdue > c.oldestInv.daysOverdue) c.oldestInv = inv;
    return acc;
  }, {})).map(c => ({
    ...c,
    collected: collectedBy[c.customer] || 0,
    score: customerScore(pbMap[c.customer]),
    avgDays: pbMap[c.customer]?.avgDays,
  })).sort((a, b) => b.outstanding - a.outstanding);
  const maxOut = Math.max(...byCustomer.map(c => c.outstanding), 1);

  async function handleDraftReminder(inv) {
    setDrafting(inv.id);
    let content = null;
    try {
      if (data.isLive) {
        const resp = await fetch('/api/ai-reminder-draft', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, invoice: { id: inv.id, customer: inv.customer, amount: inv.amount, due: inv.due, daysOverdue: inv.daysOverdue, remindersSent: inv.reminders?.length ?? 0 } }),
        });
        const json = await resp.json().catch(() => ({}));
        if (resp.ok && json.ok && json.draft?.body) content = json.draft;
      }
    } catch { /* fall through */ }
    if (!content) content = localReminderDraft(inv, data.name);
    setDraft({ invoice: inv, ...content });
    setDrafting(null);
  }

  function drillCustomer(c) {
    onDrill({
      title: `${c.customer} — Open Invoices`,
      subtitle: `${fmtM(c.outstanding)} outstanding · ${c.reminders} reminder${c.reminders !== 1 ? 's' : ''} sent${c.avgDays ? ` · avg ${c.avgDays}d to pay` : ''}`,
      source: 'Open invoices for this customer, with LunarLogic reminder activity. Collected = payments applied to this customer this period.',
      filename: `followup_${c.customer.toLowerCase().replace(/\s+/g, '_')}`,
      columns: [
        { key: 'id', label: 'Invoice' },
        { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
        { key: 'due', label: 'Due' },
        { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—' },
        { key: 'remindersCount', label: 'Reminders', render: (_, r) => `${r.reminders?.length ?? 0}` },
      ],
      rows: open.filter(i => i.customer === c.customer),
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AutomationHeader
        title="Payment Reminders"
        status={connected ? 'Operational' : 'Not connected'}
        statusColor={statusColor}
        blurb="Every open invoice is enrolled in an escalating email sequence sent on your behalf, so nothing slips and you never make the awkward first call. It pauses automatically the moment a payment lands."
        meta={[
          { label: 'Last run', value: fmtRunTime(lastRun) },
          ...(nextRun ? [{ label: 'Next run', value: fmtRunTime(nextRun) }] : []),
          { label: 'Channel', value: 'Outlook / Microsoft Graph' },
        ]}
      />

      <div style={tileGridStyle(isMobile, 3)}>
        <StatTile label="Reminders sent" color="var(--teal)"
          value={totalReminders ?? '—'} sub={totalReminders != null ? 'hands-free, since go-live' : 'not yet tracked'}
          source="Total reminder emails sent automatically since go-live. No calls or manual emails from your team." />
        <StatTile label="Coverage" color={coveragePct >= 80 ? 'var(--green)' : '#f59e0b'}
          value={reminderDataAvailable ? `${coveragePct}%` : '—'} sub={reminderDataAvailable ? `${covered.length} of ${open.length} open invoices` : 'reminder logging not linked yet'}
          source="Share of open invoices currently in the reminder sequence." />
        <StatTile label="Balances followed up" color="var(--text)"
          value={byCustomer.filter(c => c.reminders > 0).length} sub={`of ${byCustomer.length} customers with open balances`}
          source="Customers with at least one reminder sent on an open invoice." />
      </div>

      {/* Follow-up by customer — the core view */}
      <Card title="Follow-up by customer"
        hint="What LunarLogic is chasing, and what's come in. Bar = amount outstanding · below each: reminders sent and payments collected this period.">
        {byCustomer.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No open balances — everything's collected.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byCustomer.map(c => (
              <div key={c.customer}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <button onClick={() => drillCustomer(c)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{c.customer}</button>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', flexShrink: 0 }}>{fmtM(c.outstanding)}</span>
                </div>
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-hover)' }}>
                  <div style={{ width: `${(c.outstanding / maxOut) * 100}%`, background: c.overdue > 0 ? '#f59e0b' : 'var(--teal)', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, color: 'var(--muted)' }}>
                    <span>{c.reminders} reminder{c.reminders !== 1 ? 's' : ''} sent</span>
                    {c.collected > 0 && <span style={{ color: 'var(--green)', fontWeight: 600 }}>{fmtM(c.collected)} collected</span>}
                    <ScoreChip score={c.score} />
                  </div>
                  {c.oldestInv && (
                    <button onClick={() => handleDraftReminder(c.oldestInv)} disabled={drafting === c.oldestInv.id}
                      style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.1)', border: '1px solid rgba(0,212,232,0.3)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', flexShrink: 0 }}>
                      {drafting === c.oldestInv.id ? 'Drafting…' : 'Draft reminder'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Reminder cadence" hint="The escalating sequence each invoice follows, relative to its due date. Stops automatically when paid.">
        <div style={{ display: 'flex', gap: isMobile ? 8 : 4, flexWrap: 'wrap' }}>
          {CADENCE.map((c, i) => (
            <div key={c.at} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 4 }}>
              <div style={{ textAlign: 'center', padding: '2px 4px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)' }}>{c.at}</div>
                <div style={{ fontSize: 9.5, color: 'var(--muted)', maxWidth: 78 }}>{c.label}</div>
              </div>
              {i < CADENCE.length - 1 && !isMobile && <div style={{ width: 16, height: 1, background: 'var(--border)' }} />}
            </div>
          ))}
        </div>
      </Card>

      {draft && (
        <ReminderDraftModal draft={draft} isLive={data.isLive} onClose={() => setDraft(null)}
          onCopy={() => { navigator.clipboard?.writeText(`Subject: ${draft.subject}\n\n${draft.body}`); toast('Reminder copied to clipboard'); }} />
      )}
    </div>
  );
}

function ReminderDraftModal({ draft, isLive, onClose, onCopy }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(520px, calc(100vw - 32px))', maxHeight: '80vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, zIndex: 1101, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Reminder draft</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{draft.invoice.customer} · {draft.invoice.id}{isLive ? '' : ' · demo'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Subject</div>
        <div style={{ fontSize: 13, color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 11px', marginBottom: 12 }}>{draft.subject}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Body</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{draft.body}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' }}>Close</button>
          <button onClick={onCopy} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--teal)', background: 'rgba(0,212,232,0.12)', color: 'var(--teal)' }}>Copy to clipboard</button>
        </div>
      </div>
    </>
  );
}
