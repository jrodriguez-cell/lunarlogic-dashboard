import { useState } from 'react';

const TABS = ['All', 'Auto-Applied', 'Pending Review', 'Manual'];

const STATUS_META = {
  'Auto-Applied':   { color: 'var(--green)',  bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.2)'   },
  'Pending Review': { color: 'var(--yellow)', bg: 'rgba(245,158,11,.12)',  border: 'rgba(245,158,11,.2)'  },
  'Manual':         { color: 'var(--muted)',  bg: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.12)' },
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

export default function PaymentQueue({ payments, onOpenPayment }) {
  const [tab, setTab] = useState('All');

  const displayed = tab === 'All' ? payments : payments.filter(p => p.status === tab);
  const counts    = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? payments.length : payments.filter(p => p.status === t).length;
    return acc;
  }, {});

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-header">
        <h2>Payment Match Queue</h2>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Powered by Plaid · Click row to review</span>
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
              <th>Txn ID</th>
              <th>Bank Description</th>
              <th>Matched Customer</th>
              <th>Amount</th>
              <th>Confidence</th>
              <th>Invoice</th>
              <th>Status</th>
              <th>Applied</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(p => {
              const meta   = STATUS_META[p.status];
              const cColor = confidenceColor(p.confidence);
              return (
                <tr key={p.txId} className="pq-row" onClick={() => onOpenPayment(p)}>
                  <td>
                    <span className="invoice-id">{p.txId}</span>
                  </td>
                  <td className="pq-desc">{p.description}</td>
                  <td style={{ fontWeight: 500 }}>{p.matchedCustomer || '—'}</td>
                  <td style={{ fontWeight: 600 }}>${p.amount.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: cColor, fontWeight: 700, fontSize: 12, minWidth: 34 }}>{p.confidence}%</span>
                      <div className="conf-bar-track">
                        <div className="conf-bar-fill" style={{ width: `${p.confidence}%`, background: cColor }} />
                      </div>
                    </div>
                  </td>
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
