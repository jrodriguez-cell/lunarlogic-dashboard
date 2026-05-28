import { useState } from 'react';

const STAGES = [
  {
    id: 1, day: 7, name: 'Friendly Nudge', subject: 'Invoice due soon',
    tone: 'Friendly', toneColor: 'var(--teal)', toneBg: 'rgba(0,212,232,0.10)',
    cc: null, type: 'Auto',
  },
  {
    id: 2, day: 15, name: 'Follow-Up', subject: 'Invoice outstanding',
    tone: 'Professional', toneColor: '#60a5fa', toneBg: 'rgba(96,165,250,0.10)',
    cc: null, type: 'Auto',
  },
  {
    id: 3, day: 30, name: 'Escalation', subject: 'Requires manual follow-up',
    tone: 'Urgent', toneColor: 'var(--yellow)', toneBg: 'rgba(245,158,11,0.10)',
    cc: 'Jonathan + Geraldine', type: 'Manual',
  },
  {
    id: 4, day: 60, name: 'Firm Notice', subject: 'Immediate action required',
    tone: 'Critical', toneColor: 'var(--orange)', toneBg: 'rgba(249,115,22,0.10)',
    cc: null, type: 'Auto',
  },
  {
    id: 5, day: 90, name: 'Final Notice', subject: 'Balance due — service interruption warning',
    tone: 'Final', toneColor: 'var(--red)', toneBg: 'rgba(239,68,68,0.10)',
    cc: null, type: 'Auto',
  },
];

const STAGE_OPTIONS = [
  { value: 0, label: 'Pre-sequence' },
  ...STAGES.map(s => ({ value: s.id, label: `Day ${s.day} — ${s.name}` })),
];

const TERMS_OPTIONS = ['Net 7', 'Net 21', 'Net 30', 'Net 60'];
const STATUS_OPTIONS = ['On Track', 'Overdue', 'Escalated', 'Paid'];

const STATUS_STYLES = {
  'On Track':  { color: 'var(--green)',  bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.2)'   },
  'Overdue':   { color: 'var(--yellow)', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.2)'  },
  'Escalated': { color: 'var(--red)',    bg: 'rgba(239,68,68,.12)',   border: 'rgba(239,68,68,.2)'   },
  'Paid':      { color: 'var(--muted)',  bg: 'rgba(90,122,158,.08)', border: 'rgba(90,122,158,.15)' },
};

const INITIAL_CUSTOMERS = [
  { id: 1, name: 'Customer 1', terms: 'Net 30', amount: 128500, daysOut: 97,  stage: 5, lastContact: '2026-05-01', status: 'Escalated', nextAction: 'Legal review pending'              },
  { id: 2, name: 'Customer 2', terms: 'Net 30', amount: 89200,  daysOut: 78,  stage: 4, lastContact: '2026-05-10', status: 'Escalated', nextAction: 'Await Day 60 notice response'      },
  { id: 3, name: 'Customer 3', terms: 'Net 21', amount: 112800, daysOut: 63,  stage: 4, lastContact: '2026-05-12', status: 'Escalated', nextAction: 'Confirm receipt of firm notice'    },
  { id: 4, name: 'Customer 4', terms: 'Net 60', amount: 95400,  daysOut: 45,  stage: 3, lastContact: '2026-05-18', status: 'Overdue',   nextAction: 'Manual call — Jonathan assigned'   },
  { id: 5, name: 'Customer 5', terms: 'Net 30', amount: 94100,  daysOut: 22,  stage: 2, lastContact: '2026-05-20', status: 'On Track',  nextAction: 'Monitor for payment'               },
];

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const POC_START = new Date('2026-05-16');
const TODAY     = new Date('2026-05-28');
const POC_DAYS_ELAPSED = Math.round((TODAY - POC_START) / 86400000);
const POC_DAYS_TOTAL   = 30;

export default function ARReminderTracker() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [editCell, setEditCell]   = useState(null);
  const [editValue, setEditValue] = useState('');

  const activeCustomers = customers.filter(c => c.status !== 'Paid');
  const totalAR       = activeCustomers.reduce((s, c) => s + c.amount, 0);
  const bucket90      = activeCustomers.filter(c => c.daysOut >= 90);
  const bucket90Amt   = bucket90.reduce((s, c) => s + c.amount, 0);
  const pct90Plus     = totalAR > 0 ? Math.round((bucket90Amt / totalAR) * 100) : 0;
  const remindersSent = activeCustomers.reduce((s, c) => s + c.stage, 0);

  function startEdit(rowId, field, currentValue) {
    setEditCell({ rowId, field });
    setEditValue(String(currentValue));
  }

  function commitEdit() {
    if (!editCell) return;
    const { rowId, field } = editCell;
    setCustomers(prev => prev.map(c => {
      if (c.id !== rowId) return c;
      let val = editValue;
      if (field === 'amount') val = parseInt(editValue.replace(/[^0-9]/g, ''), 10) || c.amount;
      if (field === 'daysOut') val = parseInt(editValue.replace(/[^0-9]/g, ''), 10) || c.daysOut;
      if (field === 'stage') val = parseInt(editValue, 10);
      return { ...c, [field]: val };
    }));
    setEditCell(null);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditCell(null);
  }

  function exportCSV() {
    const headers = ['Customer Name','Payment Terms','Invoice Amount','Days Outstanding','Current Stage','Last Contact','Status','Next Action'];
    const rows = customers.map(c => {
      const st = c.stage > 0 ? STAGES[c.stage - 1] : null;
      return [
        c.name, c.terms, c.amount, c.daysOut,
        st ? `Day ${st.day} — ${st.name}` : 'Pre-sequence',
        c.lastContact, c.status, c.nextAction,
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'gualapack-poc-reminders.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function renderCell(customer, field) {
    const isEditing = editCell?.rowId === customer.id && editCell?.field === field;
    const inputStyle = {
      background: 'var(--bg-hover)', border: '1px solid var(--teal)',
      color: 'var(--text)', borderRadius: 4, padding: '3px 6px', fontSize: 12, outline: 'none',
    };

    if (field === 'terms' || field === 'status' || field === 'stage') {
      const options = field === 'terms' ? TERMS_OPTIONS : field === 'status' ? STATUS_OPTIONS : STAGE_OPTIONS.map(o => o.label);
      if (isEditing) {
        return (
          <select
            autoFocus value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {(field === 'stage' ? STAGE_OPTIONS : options).map((opt, i) => {
              const val  = field === 'stage' ? opt.value : opt;
              const label = field === 'stage' ? opt.label : opt;
              return <option key={i} value={val}>{label}</option>;
            })}
          </select>
        );
      }

      if (field === 'status') {
        const s = STATUS_STYLES[customer.status] || STATUS_STYLES['On Track'];
        return (
          <span className="rmt-editable rmt-badge"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
            onClick={() => startEdit(customer.id, 'status', customer.status)}>
            {customer.status}
          </span>
        );
      }

      if (field === 'stage') {
        const st = customer.stage > 0 ? STAGES[customer.stage - 1] : null;
        if (!st) return <span className="rmt-editable rmt-stage-none" onClick={() => startEdit(customer.id, 'stage', 0)}>Pre-sequence</span>;
        return (
          <span className="rmt-editable rmt-badge"
            style={{ color: st.toneColor, background: st.toneBg, border: `1px solid ${st.toneColor}33` }}
            onClick={() => startEdit(customer.id, 'stage', customer.stage)}>
            Day {st.day} · {st.name}
          </span>
        );
      }

      // terms
      return <span className="rmt-editable" onClick={() => startEdit(customer.id, 'terms', customer.terms)}>{customer.terms}</span>;
    }

    if (field === 'lastContact') {
      if (isEditing) {
        return (
          <input type="date" autoFocus value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit} onKeyDown={handleKeyDown}
            style={{ ...inputStyle, width: 130, colorScheme: 'dark' }} />
        );
      }
      return <span className="rmt-editable" onClick={() => startEdit(customer.id, 'lastContact', customer.lastContact)}>{fmtDate(customer.lastContact)}</span>;
    }

    if (isEditing) {
      const w = field === 'amount' ? 90 : field === 'daysOut' ? 60 : field === 'name' ? 110 : 180;
      return (
        <input autoFocus value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit} onKeyDown={handleKeyDown}
          style={{ ...inputStyle, width: w }} />
      );
    }

    let display = customer[field];
    if (field === 'amount')  display = `$${customer.amount.toLocaleString()}`;
    if (field === 'daysOut') display = `${customer.daysOut}d`;

    return <span className="rmt-editable" onClick={() => startEdit(customer.id, field, customer[field])}>{display}</span>;
  }

  const pocPct = Math.min(100, Math.round((POC_DAYS_ELAPSED / POC_DAYS_TOTAL) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Summary Metrics ─────────────────────────────── */}
      <section className="rmt-hero">
        <div className="rmt-metric">
          <div className="rmt-metric-label">Total AR Outstanding</div>
          <div className="rmt-metric-value">${(totalAR / 1000).toFixed(0)}k</div>
          <div className="rmt-metric-sub">Gualapack POC</div>
        </div>
        <div className="rmt-hero-divider" />
        <div className="rmt-metric">
          <div className="rmt-metric-label">In 90+ Day Bucket</div>
          <div className="rmt-metric-value" style={{ color: 'var(--red)' }}>{pct90Plus}%</div>
          <div className="rmt-metric-sub">${(bucket90Amt / 1000).toFixed(0)}k at risk</div>
        </div>
        <div className="rmt-hero-divider" />
        <div className="rmt-metric">
          <div className="rmt-metric-label">Reminders Sent</div>
          <div className="rmt-metric-value" style={{ color: 'var(--teal)' }}>{remindersSent}</div>
          <div className="rmt-metric-sub">across {customers.length} accounts</div>
        </div>
        <div className="rmt-hero-divider" />
        <div className="rmt-metric">
          <div className="rmt-metric-label">Avg Days to Respond</div>
          <div className="rmt-metric-value">3.2</div>
          <div className="rmt-metric-sub">days after reminder</div>
        </div>
        <div className="rmt-hero-divider" />
        <div className="rmt-metric">
          <div className="rmt-metric-label">POC Progress</div>
          <div className="rmt-metric-value" style={{ color: 'var(--green)' }}>
            {POC_DAYS_ELAPSED}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)' }}>/{POC_DAYS_TOTAL}</span>
          </div>
          <div className="rmt-metric-sub">
            <div className="rmt-poc-bar">
              <div className="rmt-poc-bar-fill" style={{ width: `${pocPct}%` }} />
            </div>
            days since go-live
          </div>
        </div>
      </section>

      {/* ── Sequence Visualization ───────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h2>5-Stage Escalation Sequence</h2>
          <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            WF2 · Production
          </span>
        </div>

        <div className="rmt-sequence">
          {STAGES.map((stage, i) => (
            <div key={stage.id} className="rmt-stage-wrap">
              <div className="rmt-stage-card" style={{ borderColor: `${stage.toneColor}33` }}>
                <div className="rmt-stage-day" style={{ color: stage.toneColor }}>Day {stage.day}</div>
                <div className="rmt-stage-name">{stage.name}</div>

                <span className="rmt-badge rmt-tone-badge" style={{ color: stage.toneColor, background: stage.toneBg, border: `1px solid ${stage.toneColor}33`, marginTop: 8 }}>
                  {stage.tone}
                </span>

                <div className="rmt-stage-subject">"{stage.subject}"</div>

                <div className="rmt-stage-footer">
                  <span className={`rmt-action-chip${stage.type === 'Manual' ? ' rmt-manual' : ''}`}>
                    {stage.type === 'Auto' ? (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="5" cy="5" r="4"/><path d="M3.5 5l1 1 2-2"/>
                      </svg>
                    ) : (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="5" cy="3.5" r="1.5"/><path d="M1.5 9c0-1.9 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5"/>
                      </svg>
                    )}
                    {stage.type}
                  </span>
                  {stage.cc && (
                    <span className="rmt-cc-chip">
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1 2.5h8v6H1zM1 2.5l4 3 4-3"/>
                      </svg>
                      CC: {stage.cc}
                    </span>
                  )}
                </div>
              </div>

              {i < STAGES.length - 1 && (
                <div className="rmt-stage-arrow">
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                    <path d="M0 4h11M8 1l3 3-3 3" stroke="var(--border-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── POC Tracker Table ────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h2>Gualapack POC — Account Tracker</h2>
          <button className="card-action" onClick={exportCSV}>
            Export CSV ↓
          </button>
        </div>

        <div className="rmt-table-wrap">
          <table className="rmt-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Terms</th>
                <th>Amount</th>
                <th>Days Out</th>
                <th>Current Stage</th>
                <th>Last Contact</th>
                <th>Status</th>
                <th>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id} className={customer.status === 'Paid' ? 'rmt-row-paid' : ''}>
                  <td>{renderCell(customer, 'name')}</td>
                  <td>{renderCell(customer, 'terms')}</td>
                  <td style={{ fontWeight: 600 }}>{renderCell(customer, 'amount')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {renderCell(customer, 'daysOut')}
                      <div className="rmt-days-bar">
                        <div className="rmt-days-bar-fill" style={{
                          width: `${Math.min(100, (customer.daysOut / 90) * 100)}%`,
                          background: customer.daysOut >= 90 ? 'var(--red)' : customer.daysOut >= 60 ? 'var(--orange)' : customer.daysOut >= 30 ? 'var(--yellow)' : 'var(--teal)',
                        }} />
                      </div>
                    </div>
                  </td>
                  <td>{renderCell(customer, 'stage')}</td>
                  <td>{renderCell(customer, 'lastContact')}</td>
                  <td>{renderCell(customer, 'status')}</td>
                  <td className="rmt-td-action">{renderCell(customer, 'nextAction')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="5" cy="5" r="4"/><path d="M5 4.5v2.5M5 3.5v.1"/>
          </svg>
          Click any cell to edit · Enter to save · Esc to cancel
        </div>
      </div>
    </div>
  );
}
