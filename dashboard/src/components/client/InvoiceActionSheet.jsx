import { useState } from 'react';
import { useToast } from '../../lib/toast';

const TEAM = ['Jonathan Rodriguez', 'Sarah M. (Admin)', 'Unassigned'];

function emailDraft(inv, companyName) {
  const subj = `Invoice ${inv.id} — Payment Follow-Up`;
  const overdueLine = inv.daysOverdue > 0
    ? `This invoice is now ${inv.daysOverdue} day${inv.daysOverdue !== 1 ? 's' : ''} past due.`
    : `This invoice is due on ${inv.due}.`;
  const tone = inv.daysOverdue > 30
    ? 'We would appreciate your immediate attention to this matter.'
    : 'Please let us know if you have any questions or if there is anything we can help with.';
  return {
    subject: subj,
    body: `Hi ${inv.customer},\n\nI wanted to follow up on Invoice ${inv.id} for $${inv.amount.toLocaleString()}, due ${inv.due}. ${overdueLine}\n\n${tone}\n\nIf payment has already been sent, please disregard this message — we may be experiencing a processing delay.\n\nThank you,\n${companyName}`,
  };
}

export default function InvoiceActionSheet({ inv, companyName, onClose, onDrill }) {
  const toast   = useToast();
  const [tab, setTab]     = useState('actions'); // actions | reminder | log | task | snooze
  const [logForm, setLog] = useState({ method: 'Phone call', outcome: '', promisedDate: '', notes: '' });
  const [taskForm, setTask] = useState({ assignee: TEAM[0], dueDate: '', description: '' });
  const [snoozeDate, setSnooze] = useState('');
  const [copied, setCopied]     = useState(false);

  const draft = emailDraft(inv, companyName);

  function copyEmail() {
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Email draft copied to clipboard');
  }

  function submitLog(e) {
    e.preventDefault();
    toast(`Contact logged — ${logForm.method} with ${inv.customer}`);
    onClose();
  }

  function submitTask(e) {
    e.preventDefault();
    if (!taskForm.description.trim()) return;
    toast(`Task assigned to ${taskForm.assignee}`);
    onClose();
  }

  function submitSnooze(e) {
    e.preventDefault();
    if (!snoozeDate) return;
    toast(`Snoozed until ${snoozeDate} — removed from urgent queue`);
    onClose();
  }

  function markSent() {
    toast(`Reminder marked as sent for ${inv.id}`);
    onClose();
  }

  const TABS = [
    { id: 'actions',  label: 'Actions' },
    { id: 'reminder', label: 'Send Reminder' },
    { id: 'log',      label: 'Log Contact' },
    { id: 'task',     label: 'Assign Task' },
    { id: 'snooze',   label: 'Snooze' },
  ];

  const urgencyColor = inv.daysOverdue > 60 ? '#ef4444' : inv.daysOverdue > 30 ? '#f97316' : inv.daysOverdue > 0 ? '#f59e0b' : '#22c55e';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1101,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        borderRadius: '16px 16px 0 0', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
        maxWidth: 680, margin: '0 auto',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Invoice header */}
        <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginBottom: 2 }}>{inv.id}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{inv.customer}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>${inv.amount.toLocaleString()}</span>
              <span>Due {inv.due}</span>
              {inv.daysOverdue > 0 && <span style={{ color: urgencyColor, fontWeight: 600 }}>{inv.daysOverdue}d overdue</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>✕</button>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '12px 16px 0', gap: 4, borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '6px 12px', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, borderRadius: '6px 6px 0 0', cursor: 'pointer', whiteSpace: 'nowrap',
              border: 'none', borderBottom: tab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
              background: tab === t.id ? 'rgba(0,212,232,0.06)' : 'none',
              color: tab === t.id ? 'var(--teal)' : 'var(--muted)',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>

          {/* ACTIONS tab — quick launch pad */}
          {tab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '✉', label: 'Send a reminder email', sub: 'Generate a pre-written email draft', action: () => setTab('reminder') },
                { icon: '📞', label: 'Log a contact attempt', sub: 'Record a call, email, or meeting', action: () => setTab('log') },
                { icon: '✓',  label: 'Assign a follow-up task', sub: 'Delegate to a team member with due date', action: () => setTab('task') },
                { icon: '⏸',  label: 'Snooze this invoice', sub: 'Customer promised to pay — remove from queue until then', action: () => setTab('snooze') },
                { icon: '↗',  label: 'View full detail & export', sub: 'See all data and download as CSV or Excel', action: () => { onClose(); onDrill(); } },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', width: '100%',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                >
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.sub}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 14 }}>›</span>
                </button>
              ))}
            </div>
          )}

          {/* REMINDER tab */}
          {tab === 'reminder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: -4 }}>Pre-written based on invoice age and amount. Edit before sending.</div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Subject</div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{draft.subject}</div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Body</div>
                <pre style={{ fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>{draft.body}</pre>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={copyEmail} style={{ flex: 1, padding: '10px', background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(0,212,232,0.1)', border: `1px solid ${copied ? '#22c55e' : 'var(--teal)'}`, borderRadius: 8, color: copied ? '#22c55e' : 'var(--teal)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {copied ? 'Copied!' : 'Copy email draft'}
                </button>
                <button onClick={markSent} style={{ padding: '10px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
                  Mark as sent
                </button>
              </div>
            </div>
          )}

          {/* LOG CONTACT tab */}
          {tab === 'log' && (
            <form onSubmit={submitLog} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <Label>Contact method</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Phone call', 'Email', 'Text message', 'In person'].map(m => (
                    <button type="button" key={m} onClick={() => setLog(l => ({ ...l, method: m }))} style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${logForm.method === m ? 'var(--teal)' : 'var(--border)'}`,
                      background: logForm.method === m ? 'rgba(0,212,232,0.1)' : 'none',
                      color: logForm.method === m ? 'var(--teal)' : 'var(--muted)',
                    }}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Outcome</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['No answer', 'Left voicemail', 'Spoke with contact', 'Promised payment', 'Disputed invoice', 'Other'].map(o => (
                    <button type="button" key={o} onClick={() => setLog(l => ({ ...l, outcome: o }))} style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${logForm.outcome === o ? 'var(--teal)' : 'var(--border)'}`,
                      background: logForm.outcome === o ? 'rgba(0,212,232,0.1)' : 'none',
                      color: logForm.outcome === o ? 'var(--teal)' : 'var(--muted)',
                    }}>{o}</button>
                  ))}
                </div>
              </div>
              {logForm.outcome === 'Promised payment' && (
                <div>
                  <Label>Promised payment date</Label>
                  <input type="date" value={logForm.promisedDate} onChange={e => setLog(l => ({ ...l, promisedDate: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', colorScheme: 'dark' }} />
                </div>
              )}
              <div>
                <Label>Notes (optional)</Label>
                <textarea value={logForm.notes} onChange={e => setLog(l => ({ ...l, notes: e.target.value }))} rows={3} placeholder="What was discussed..."
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" style={{ padding: '10px', background: 'rgba(0,212,232,0.1)', border: '1px solid var(--teal)', borderRadius: 8, color: 'var(--teal)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Save contact log
              </button>
            </form>
          )}

          {/* ASSIGN TASK tab */}
          {tab === 'task' && (
            <form onSubmit={submitTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <Label>Assign to</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TEAM.map(m => (
                    <button type="button" key={m} onClick={() => setTask(t => ({ ...t, assignee: m }))} style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${taskForm.assignee === m ? 'var(--teal)' : 'var(--border)'}`,
                      background: taskForm.assignee === m ? 'rgba(0,212,232,0.1)' : 'none',
                      color: taskForm.assignee === m ? 'var(--teal)' : 'var(--muted)',
                    }}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Due date</Label>
                <input type="date" value={taskForm.dueDate} onChange={e => setTask(t => ({ ...t, dueDate: e.target.value }))} required
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', colorScheme: 'dark' }} />
              </div>
              <div>
                <Label>Task description</Label>
                <textarea value={taskForm.description} onChange={e => setTask(t => ({ ...t, description: e.target.value }))} rows={3}
                  placeholder={`Follow up with ${inv.customer} on Invoice ${inv.id}...`} required
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" style={{ padding: '10px', background: 'rgba(0,212,232,0.1)', border: '1px solid var(--teal)', borderRadius: 8, color: 'var(--teal)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Create task
              </button>
            </form>
          )}

          {/* SNOOZE tab */}
          {tab === 'snooze' && (
            <form onSubmit={submitSnooze} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                Snoozing removes this invoice from your urgent queue until the selected date. Use this when a customer has committed to paying by a specific date.
              </div>
              <div>
                <Label>Customer committed to pay by</Label>
                <input type="date" value={snoozeDate} onChange={e => setSnooze(e.target.value)} required
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', colorScheme: 'dark' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[7, 14, 21, 30].map(d => {
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
              <button type="submit" style={{ padding: '10px', background: 'rgba(0,212,232,0.1)', border: '1px solid var(--teal)', borderRadius: 8, color: 'var(--teal)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Snooze invoice
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{children}</div>;
}
