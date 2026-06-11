import { useState } from 'react';

const TABS = ['All', 'Auto-Applied', 'Pending Review', 'Manual'];

const DATE_RANGES = [
  { label: '7d',  days: 7 },
  { label: '14d', days: 14 },
  { label: 'All', days: null },
];

function filterByRange(payments, days) {
  if (!days) return payments;
  const dates = payments.map(p => new Date(p.received + 'T00:00:00')).filter(d => !isNaN(d));
  if (!dates.length) return payments;
  const latest = new Date(Math.max(...dates));
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - days);
  return payments.filter(p => new Date(p.received + 'T00:00:00') >= cutoff);
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

const STATUS_META = {
  'Auto-Applied':   { color: 'var(--green)',  bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.2)'   },
  'Pending Review': { color: 'var(--yellow)', bg: 'rgba(245,158,11,.12)',  border: 'rgba(245,158,11,.2)'  },
  'Manual':         { color: 'var(--muted)',  bg: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.12)' },
};

const COL_TIPS = {
  date:     'Date the payment was received from the bank feed (Plaid). Used to sequence transactions and match against open invoice due dates.',
  txnId:    'Unique transaction identifier assigned by the bank feed (Plaid). Used to trace any payment end-to-end through the matching and posting workflow.',
  bankDesc: 'Raw payment description transmitted by the bank exactly as received via Plaid. This string is parsed by the matching engine to extract customer name and reference signals.',
  customer: 'Customer name resolved by the matching engine using fuzzy string comparison (Levenshtein distance) against your active customer list. A score ≥ 0.90 qualifies as a name match.',
  amount:   'Payment amount received from the bank in USD. Compared against open invoice balances. An exact match (+/- $0.01) is the highest-confidence signal. Partial or bulk amounts reduce confidence.',
  invoice:  'Invoice number matched to this payment. Shown as a reference if auto-applied. If multiple candidates exist, the count is displayed — click the row to review and route manually.',
  status:   'Auto-Applied: posted automatically at ≥90% confidence. Pending Review: held below threshold — needs manual routing. Manual: confirmed by a staff member after review.',
  applied:  'Time elapsed since this payment was posted to the AR ledger. Pending Review items show no time because they have not yet been applied.',
};

function confidenceColor(c) {
  if (c >= 90) return 'var(--green)';
  if (c >= 70) return 'var(--yellow)';
  return 'var(--red)';
}

function fmtTime(iso) {
  if (!iso) return '—';
  const applied = new Date(iso);
  const now     = new Date('2026-05-19T23:59:00');
  const diffH   = Math.floor((now - applied) / 3600000);
  if (diffH < 1)  return '< 1h ago';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function getConfidenceSignals(payment) {
  const rule = payment.rule || '';
  const conf = payment.confidence;

  const hasExactAmount  = rule.includes('Exact amount');
  const hasAmountMatch  = hasExactAmount || rule.toLowerCase().includes('amount match');
  const hasExactName    = rule.includes('name match') && !rule.includes('fuzzy') && !rule.includes('partial name');
  const hasFuzzyName    = rule.includes('fuzzy name') || rule.includes('partial name');
  const hasMemo         = rule.toLowerCase().includes('memo') || rule.toLowerCase().includes('reference') || rule.toLowerCase().includes('ref');
  const isBulk          = rule.toLowerCase().includes('bulk');
  const isPartial       = rule.toLowerCase().includes('partial payment') || rule.toLowerCase().includes('partial —');

  return [
    {
      label: 'Exact amount match',
      pass:  hasExactAmount,
      warn:  !hasExactAmount && hasAmountMatch,
      fail:  isBulk || isPartial,
      note:  isBulk ? 'Bulk — spans multiple invoices' : isPartial ? 'Partial — less than open balance' : hasExactAmount ? 'Payment = invoice amount' : hasAmountMatch ? 'Within tolerance' : 'No amount match',
    },
    {
      label: 'Customer name match',
      pass:  hasExactName,
      warn:  hasFuzzyName && !hasExactName,
      fail:  !hasExactName && !hasFuzzyName,
      note:  hasExactName ? 'Exact match' : hasFuzzyName ? `Fuzzy match — ${rule.match(/\([\d.]+\)/)?.[0] || 'partial'}` : 'No name match found',
    },
    {
      label: 'Memo / reference',
      pass:  hasMemo,
      warn:  false,
      fail:  !hasMemo,
      note:  hasMemo ? 'Invoice ref found in memo' : 'No reference in bank memo',
    },
    {
      label: 'Payment history',
      pass:  conf >= 90,
      warn:  conf >= 70 && conf < 90,
      fail:  conf < 70,
      note:  conf >= 90 ? 'Customer has strong pay history' : conf >= 70 ? 'Limited history — lower weight' : 'Insufficient history signal',
    },
  ];
}

/* ── Header tooltip ─────────────────────────────────────────────────────────── */
function Th({ tip, children, style }) {
  const [pos, setPos] = useState(null);
  return (
    <th
      style={{ position: 'relative', cursor: 'help', userSelect: 'none', ...style }}
      onMouseEnter={e => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top });
      }}
      onMouseLeave={() => setPos(null)}
    >
      <span style={{ borderBottom: '1px dashed rgba(90,122,158,0.5)', paddingBottom: 1 }}>
        {children}
      </span>
      {pos && (
        <div style={{
          position: 'fixed',
          left: pos.x, top: pos.y - 8,
          transform: 'translate(-50%, -100%)',
          background: '#0f1c30', border: '1px solid rgba(0,212,232,0.2)',
          borderRadius: 6, padding: '8px 12px', fontSize: 11, color: 'var(--text)',
          width: 230, zIndex: 9999, lineHeight: 1.55, fontWeight: 400,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)', whiteSpace: 'normal',
          textTransform: 'none', letterSpacing: 'normal', pointerEvents: 'none',
        }}>
          {tip}
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, background: '#0f1c30', border: '1px solid rgba(0,212,232,0.2)', borderTop: 'none', borderLeft: 'none', rotate: '45deg' }} />
        </div>
      )}
    </th>
  );
}

/* ── Confidence cell with signal breakdown ──────────────────────────────────── */
function ConfidenceCell({ payment }) {
  const [pos, setPos] = useState(null);
  const conf    = payment.confidence;
  const cColor  = confidenceColor(conf);
  const signals = getConfidenceSignals(payment);

  return (
    <td
      style={{ cursor: 'help' }}
      onMouseEnter={e => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.left, y: r.top });
      }}
      onMouseLeave={() => setPos(null)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: cColor, fontWeight: 700, fontSize: 12, minWidth: 34 }}>{conf}%</span>
        <div className="conf-bar-track">
          <div className="conf-bar-fill" style={{ width: `${conf}%`, background: cColor }} />
        </div>
      </div>

      {pos && (
        <div style={{
          position: 'fixed',
          left: pos.x, top: pos.y - 8,
          transform: 'translateY(-100%)',
          background: '#0f1c30', border: '1px solid rgba(0,212,232,0.2)',
          borderRadius: 7, padding: '10px 13px',
          zIndex: 9999, width: 255,
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Confidence signals — {conf}%
          </div>
          {signals.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <span style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700, minWidth: 14, marginTop: 1,
                color: s.pass ? 'var(--green)' : s.warn ? 'var(--yellow)' : 'var(--red)',
              }}>
                {s.pass ? '✓' : s.warn ? '~' : '✗'}
              </span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4, marginTop: 1 }}>{s.note}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'var(--muted)' }}>
            ≥90% = auto-applied · &lt;90% = manual review
          </div>
        </div>
      )}
    </td>
  );
}

export default function PaymentQueue({ payments, onOpenPayment }) {
  const [tab, setTab]           = useState('All');
  const [rangeDays, setRangeDays] = useState(null);

  const dateFiltered = filterByRange(payments, rangeDays);
  const displayed    = tab === 'All' ? dateFiltered : dateFiltered.filter(p => p.status === tab);
  const counts       = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? dateFiltered.length : dateFiltered.filter(p => p.status === t).length;
    return acc;
  }, {});

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-header">
        <h2>Payment Match Queue</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Powered by Plaid · Click row to review</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {DATE_RANGES.map(r => (
              <button
                key={r.label}
                onClick={() => setRangeDays(r.days)}
                style={{
                  padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${rangeDays === r.days ? 'var(--teal)' : 'var(--border)'}`,
                  background: rangeDays === r.days ? 'rgba(0,212,232,0.1)' : 'none',
                  color: rangeDays === r.days ? 'var(--teal)' : 'var(--muted)',
                }}
              >{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="status-tabs" style={{ marginBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} className={`status-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
            <span className="tab-count">{counts[t]}</span>
          </button>
        ))}
      </div>

      <div className="pq-table-wrap">
        <table className="pq-table">
          <thead>
            <tr>
              <Th tip={COL_TIPS.date}>Date</Th>
              <Th tip={COL_TIPS.txnId}>Txn ID</Th>
              <Th tip={COL_TIPS.bankDesc}>Bank Description</Th>
              <Th tip={COL_TIPS.customer}>Matched Customer</Th>
              <Th tip={COL_TIPS.amount}>Amount</Th>
              <Th tip="Composite match score (0–100%) derived from four signals: exact amount match, customer name match, memo/reference match, and payment history. ≥90% is posted automatically. Hover any row's confidence score to see the full signal breakdown.">
                Confidence
              </Th>
              <Th tip={COL_TIPS.invoice}>Invoice</Th>
              <Th tip={COL_TIPS.status}>Status</Th>
              <Th tip={COL_TIPS.applied}>Applied</Th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(p => {
              const meta = STATUS_META[p.status];
              return (
                <tr key={p.txId} className="pq-row" onClick={() => onOpenPayment(p)}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 11 }}>{fmtDate(p.received)}</td>
                  <td>
                    <span className="invoice-id">{p.txId}</span>
                  </td>
                  <td className="pq-desc">{p.description}</td>
                  <td style={{ fontWeight: 500 }}>{p.matchedCustomer || '—'}</td>
                  <td style={{ fontWeight: 600 }}>${p.amount.toLocaleString()}</td>
                  <ConfidenceCell payment={p} />
                  <td>
                    <span className="pq-invoice-ref">
                      {p.matchedInvoice
                        ? p.matchedInvoice
                        : p.candidates?.length
                        ? `${p.candidates.length} candidates`
                        : '—'}
                    </span>
                  </td>
                  <td>
                    <span className="pq-status-badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                      {p.status === 'Auto-Applied' ? '✓ Auto' : p.status === 'Pending Review' ? '⚠ Review' : '✎ Manual'}
                    </span>
                  </td>
                  <td className="pq-time">{fmtTime(p.appliedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <div className="empty-state">No transactions in this filter</div>
        )}
      </div>
    </div>
  );
}
