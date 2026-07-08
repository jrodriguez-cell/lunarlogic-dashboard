import { useState } from 'react';
import { useToast } from '../../lib/toast';
import { setPromise, promiseDate, isBroken } from '../../lib/promises';
import { customerScore, scoreBand } from '../../lib/scoring';

const TEAM = ['Jonathan Rodriguez', 'Sarah M. (Admin)', 'Unassigned'];

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const RISK_CONFIG = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'High risk' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Medium risk' },
  low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Low payer' },
};

const STATUS_COLOR = {
  Paid: '#22c55e', Sent: '#60a5fa', Viewed: '#a78bfa', Overdue: '#ef4444',
};

function emailDraft(inv, companyName) {
  const d = inv.daysOverdue;
  const tone = d > 60
    ? 'We must request your immediate attention to resolve this outstanding balance to avoid escalation.'
    : d > 30
    ? 'We would appreciate your prompt attention to settle this balance at your earliest convenience.'
    : 'Please let us know if you have any questions or if there is anything we can help with.';
  return {
    subject: `Invoice ${inv.id} — Payment Follow-Up`,
    body: `Hi ${inv.customer},\n\nI wanted to follow up on Invoice ${inv.id} for $${inv.amount.toLocaleString()}, due ${inv.due}${d > 0 ? ` (${d} days overdue)` : ''}.\n\n${tone}\n\nIf payment has already been sent, please disregard this message — we may be experiencing a processing delay.\n\nThank you,\n${companyName}`,
  };
}

export default function CustomerPanel({ inv, allInvoices, paymentBehavior, payments, companyName, clientId, isLive, onClose }) {
  const toast = useToast();
  const [action, setAction] = useState(null); // null | 'reminder' | 'log' | 'task' | 'snooze'
  const [logForm, setLog]   = useState({ method: 'Phone call', outcome: '', promisedDate: '', notes: '' });
  const [taskForm, setTask] = useState({ assignee: TEAM[0], dueDate: '', description: '' });
  const [snoozeDate, setSnooze] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const pb = paymentBehavior?.find(p => p.customer === inv.customer);
  const risk = RISK_CONFIG[pb?.riskLevel ?? 'medium'];
  const score = customerScore(pb);
  const band = scoreBand(score);
  const [promise, setPromiseState] = useState(() => promiseDate(clientId, inv.id));
  const promiseBroken = isBroken(promise);

  // All invoices for this customer
  const custInvoices = allInvoices.filter(i => i.customer === inv.customer);
  const openInvs     = custInvoices.filter(i => i.status !== 'Paid');
  const paidInvs     = custInvoices.filter(i => i.status === 'Paid');
  const totalOpen    = openInvs.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = openInvs.filter(i => i.daysOverdue > 0).reduce((s, i) => s + i.amount, 0);

  // Payment history for this customer
  const custPayments = (payments ?? []).filter(p => p.matchedCustomer === inv.customer);

  const draft = emailDraft(inv, companyName);

  function copyEmail() {
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast('Email draft copied to clipboard');
  }
  async function sendReminder() {
    if (!isLive || !inv.qbId) {
      toast(`Can't send — ${inv.customer} isn't connected to QuickBooks for this client yet`);
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: inv.qbId, client_id: clientId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || 'Send failed');
      toast(`Reminder sent for ${inv.id}`);
      setAction(null);
    } catch (err) {
      toast(`Failed to send reminder: ${err.message}`);
    } finally {
      setSending(false);
    }
  }
  async function logActivity(payload) {
    const res = await fetch('/api/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, customer_name: inv.customer, invoice_number: inv.id, ...payload }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.error || 'Save failed');
  }

  async function submitLog(e) {
    e.preventDefault();
    setSending(true);
    try {
      await logActivity({ activity_type: 'contact', detail_1: logForm.method, detail_2: logForm.outcome, detail_3: logForm.promisedDate, notes: logForm.notes });
      toast(`Contact logged — ${logForm.method} with ${inv.customer}`);
      setAction(null);
    } catch (err) {
      toast(`Failed to save log: ${err.message}`);
    } finally {
      setSending(false);
    }
  }
  async function submitTask(e) {
    e.preventDefault();
    setSending(true);
    try {
      await logActivity({ activity_type: 'task', detail_1: taskForm.assignee, detail_2: taskForm.dueDate, notes: taskForm.description });
      toast(`Task assigned to ${taskForm.assignee}`);
      setAction(null);
    } catch (err) {
      toast(`Failed to assign task: ${err.message}`);
    } finally {
      setSending(false);
    }
  }
  async function submitSnooze(e) {
    e.preventDefault();
    setSending(true);
    // Persist the promise locally so it shows here and can surface as a broken
    // promise in "Needs you today". Best-effort log to the activity sheet too.
    setPromise(clientId, inv.id, snoozeDate);
    setPromiseState(snoozeDate);
    try {
      await logActivity({ activity_type: 'promise_to_pay', detail_1: snoozeDate });
    } catch { /* logging is best-effort; the promise is already saved locally */ }
    toast(`Promise recorded — ${inv.customer} to pay by ${snoozeDate}`);
    setAction(null);
    setSending(false);
  }

  const urgColor = inv.daysOverdue > 60 ? '#ef4444' : inv.daysOverdue > 30 ? '#f97316' : inv.daysOverdue > 0 ? '#f59e0b' : '#22c55e';

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel" style={{ width: 420, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace' }}>{inv.id}</span>
                <span style={{ background: risk.bg, color: risk.color, fontSize: 9, fontWeight: 700, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{risk.label}</span>
                {score != null && (
                  <span title="Payment health score — likelihood of paying on time" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${band.color}1a`, color: band.color, fontSize: 9, fontWeight: 700, borderRadius: 10, padding: '2px 8px' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: band.color }} />{score}/100 · {band.label}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{inv.customer}</div>
            </div>
            <button onClick={onClose} className="drawer-close">✕</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px' }}>

          {/* Customer health strip */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <HealthStat label="Open balance" value={fmtM(totalOpen)} color="var(--text)" />
            <HealthStat label="Overdue now"  value={fmtM(totalOverdue)} color={totalOverdue > 0 ? '#ef4444' : '#22c55e'} />
            <HealthStat label="Avg days to pay" value={pb ? `${pb.avgDays}d` : '—'} color={pb?.trend > 0 ? '#f59e0b' : '#22c55e'} sub={pb?.trend ? `${pb.trend > 0 ? '+' : ''}${pb.trend}d trend` : null} />
          </div>

          {/* Customer health bar */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
            <SectionLabel>Payment health</SectionLabel>
            <HealthBar pb={pb} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
              <span style={{ color: 'var(--muted)' }}>{paidInvs.length} paid on record</span>
              <span style={{ color: risk.color, fontWeight: 600 }}>{risk.label}</span>
            </div>
          </div>

          {/* This invoice */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
            <SectionLabel>This invoice</SectionLabel>
            <div style={{ background: 'var(--bg)', border: `1px solid ${urgColor}44`, borderLeft: `3px solid ${urgColor}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: -0.5 }}>{fmtM(inv.amount)}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Due {inv.due} · Issued {inv.issued}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {inv.daysOverdue > 0
                    ? <div style={{ fontSize: 13, fontWeight: 700, color: urgColor }}>{inv.daysOverdue}d overdue</div>
                    : <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Current</div>}
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{inv.status}</div>
                </div>
              </div>
              {/* Recommendation */}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: urgColor, fontWeight: 600 }}>
                {inv.daysOverdue > 90 ? 'Escalate to collections immediately'
                  : inv.daysOverdue > 60 ? 'Personal call — senior contact required'
                  : inv.daysOverdue > 30 ? 'Phone call + formal written notice'
                  : inv.daysOverdue > 14 ? 'Follow-up call recommended'
                  : inv.daysOverdue > 7  ? 'Send reminder email'
                  : inv.daysOverdue > 0  ? 'Auto-reminder sent by LunarLogic'
                  : 'On track — LunarLogic monitoring'}
              </div>
              {promise && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 11, color: promiseBroken ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                    {promiseBroken ? '⚠ Broken promise' : 'Promised to pay'} — {new Date(promise).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button onClick={() => { setPromise(clientId, inv.id, null); setPromiseState(null); toast('Promise cleared'); }} style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {action === null && (
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
              <SectionLabel>Take action</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { id: 'reminder', label: 'Send Reminder',  sub: 'Email draft ready',    primary: true },
                  { id: 'log',      label: 'Log Contact',    sub: 'Call, email, meeting'               },
                  { id: 'task',     label: 'Assign Task',    sub: 'Delegate follow-up'                 },
                  { id: 'snooze',   label: 'Promise to Pay', sub: 'Record an expected pay date'        },
                ].map(a => (
                  <button key={a.id} onClick={() => setAction(a.id)} style={{
                    padding: '10px 12px', background: a.primary ? 'rgba(0,212,232,0.08)' : 'var(--bg)',
                    border: `1px solid ${a.primary ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.1s, border-color 0.1s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--teal)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = a.primary ? 'rgba(0,212,232,0.08)' : 'var(--bg)'; e.currentTarget.style.borderColor = a.primary ? 'var(--teal)' : 'var(--border)'; }}
                  >
                    <div style={{ fontSize: 13, marginBottom: 2 }}><span style={{ fontWeight: 600, color: a.primary ? 'var(--teal)' : 'var(--text)' }}>{a.label}</span></div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{a.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REMINDER action */}
          {action === 'reminder' && (
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <button onClick={() => setAction(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <SectionLabel style={{ margin: 0 }}>Send reminder email</SectionLabel>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>SUBJECT</div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{draft.subject}</div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>BODY</div>
                <pre style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>{draft.body}</pre>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={copyEmail} style={{ flex: 1, padding: '9px', background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(0,212,232,0.1)', border: `1px solid ${copied ? '#22c55e' : 'var(--teal)'}`, borderRadius: 7, color: copied ? '#22c55e' : 'var(--teal)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  {copied ? 'Copied!' : 'Copy email'}
                </button>
                <button onClick={sendReminder} disabled={sending} style={{ padding: '9px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--muted)', fontSize: 12, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}>
                  {sending ? 'Sending…' : 'Send via QuickBooks'}
                </button>
              </div>
              {!isLive && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, fontStyle: 'italic' }}>This client isn't connected to live QuickBooks yet — sending is disabled.</div>
              )}
            </div>
          )}

          {/* LOG action */}
          {action === 'log' && (
            <form onSubmit={submitLog} style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <button type="button" onClick={() => setAction(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <SectionLabel style={{ margin: 0 }}>Log contact</SectionLabel>
              </div>
              <ChipGroup label="Method" options={['Phone call','Email','Text','In person']} value={logForm.method} onChange={v => setLog(l => ({...l, method: v}))} />
              <ChipGroup label="Outcome" options={['No answer','Left voicemail','Spoke with contact','Promised payment','Disputed','Other']} value={logForm.outcome} onChange={v => setLog(l => ({...l, outcome: v}))} />
              {logForm.outcome === 'Promised payment' && (
                <div>
                  <FieldLabel>Promised by</FieldLabel>
                  <input type="date" value={logForm.promisedDate} onChange={e => setLog(l => ({...l, promisedDate: e.target.value}))}
                    style={{ width: '100%', padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, boxSizing: 'border-box', colorScheme: 'dark' }} />
                </div>
              )}
              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea value={logForm.notes} onChange={e => setLog(l => ({...l, notes: e.target.value}))} rows={3} placeholder="What was discussed..."
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" disabled={sending} style={{ padding: '9px', background: 'rgba(0,212,232,0.1)', border: '1px solid var(--teal)', borderRadius: 7, color: 'var(--teal)', fontWeight: 700, fontSize: 12, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}>{sending ? 'Saving…' : 'Save log'}</button>
            </form>
          )}

          {/* TASK action */}
          {action === 'task' && (
            <form onSubmit={submitTask} style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <button type="button" onClick={() => setAction(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <SectionLabel style={{ margin: 0 }}>Assign task</SectionLabel>
              </div>
              <ChipGroup label="Assign to" options={TEAM} value={taskForm.assignee} onChange={v => setTask(t => ({...t, assignee: v}))} />
              <div>
                <FieldLabel>Due date</FieldLabel>
                <input type="date" value={taskForm.dueDate} onChange={e => setTask(t => ({...t, dueDate: e.target.value}))} required
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, boxSizing: 'border-box', colorScheme: 'dark' }} />
              </div>
              <div>
                <FieldLabel>Task</FieldLabel>
                <textarea value={taskForm.description} onChange={e => setTask(t => ({...t, description: e.target.value}))} rows={3}
                  placeholder={`Follow up with ${inv.customer} on ${inv.id}...`} required
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" disabled={sending} style={{ padding: '9px', background: 'rgba(0,212,232,0.1)', border: '1px solid var(--teal)', borderRadius: 7, color: 'var(--teal)', fontWeight: 700, fontSize: 12, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}>{sending ? 'Saving…' : 'Create task'}</button>
            </form>
          )}

          {/* SNOOZE action */}
          {action === 'snooze' && (
            <form onSubmit={submitSnooze} style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <button type="button" onClick={() => setAction(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <SectionLabel style={{ margin: 0 }}>Record promise to pay</SectionLabel>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>Customer committed to pay by a date. LunarLogic eases off urgent nudges until then — and flags it in "Needs you today" if the date passes.</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[7,14,21,30].map(d => {
                  const dt = new Date(); dt.setDate(dt.getDate() + d);
                  const iso = dt.toISOString().split('T')[0];
                  return (
                    <button type="button" key={d} onClick={() => setSnooze(iso)} style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${snoozeDate === iso ? 'var(--teal)' : 'var(--border)'}`,
                      background: snoozeDate === iso ? 'rgba(0,212,232,0.1)' : 'none',
                      color: snoozeDate === iso ? 'var(--teal)' : 'var(--muted)',
                    }}>+{d} days</button>
                  );
                })}
              </div>
              <div>
                <FieldLabel>Or pick a date</FieldLabel>
                <input type="date" value={snoozeDate} onChange={e => setSnooze(e.target.value)} required
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, boxSizing: 'border-box', colorScheme: 'dark' }} />
              </div>
              <button type="submit" disabled={sending} style={{ padding: '9px', background: 'rgba(0,212,232,0.1)', border: '1px solid var(--teal)', borderRadius: 7, color: 'var(--teal)', fontWeight: 700, fontSize: 12, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}>{sending ? 'Saving…' : 'Record promise'}</button>
            </form>
          )}

          {/* All invoices for this customer */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
            <SectionLabel>All invoices — {inv.customer}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {custInvoices.sort((a,b) => b.daysOverdue - a.daysOverdue || b.amount - a.amount).map(ci => {
                const sc = STATUS_COLOR[ci.status] ?? '#4e6a88';
                const isThis = ci.id === inv.id;
                return (
                  <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: isThis ? 'rgba(0,212,232,0.06)' : 'var(--bg)', border: `1px solid ${isThis ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 7 }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{ci.id}</span>
                        {isThis && <span style={{ fontSize: 9, color: 'var(--teal)', fontWeight: 700 }}>THIS</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Due {ci.due}{ci.daysOverdue > 0 ? ` · ${ci.daysOverdue}d overdue` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmtM(ci.amount)}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: sc, textTransform: 'uppercase' }}>{ci.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment history */}
          {custPayments.length > 0 && (
            <div style={{ padding: '14px 24px' }}>
              <SectionLabel>Payment history</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {custPayments.slice(0, 5).map(p => (
                  <div key={p.txId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.received}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.matchedInvoice ?? 'Unmatched'} · {p.confidence}% match</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmtM(p.amount)}</div>
                      <div style={{ fontSize: 9, color: p.status === 'Auto-Applied' ? '#22c55e' : '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>{p.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function HealthStat({ label, value, color, sub }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function HealthBar({ pb }) {
  if (!pb) return <div style={{ height: 8, borderRadius: 4, background: 'var(--border)' }} />;
  const score = Math.max(0, Math.min(100, 100 - (pb.avgDays / 60) * 100));
  const color = score > 66 ? '#22c55e' : score > 33 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function SectionLabel({ children, style = {} }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, ...style }}>{children}</div>;
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{children}</div>;
}

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {options.map(o => (
          <button type="button" key={o} onClick={() => onChange(o)} style={{
            padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${value === o ? 'var(--teal)' : 'var(--border)'}`,
            background: value === o ? 'rgba(0,212,232,0.1)' : 'none',
            color: value === o ? 'var(--teal)' : 'var(--muted)',
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}
