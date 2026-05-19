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

function fmt(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PaymentMatchDrawer({ payment, onClose }) {
  if (!payment) return null;

  const meta   = STATUS_META[payment.status];
  const cColor = confidenceColor(payment.confidence);
  const isPending = payment.status === 'Pending Review';

  function handleAction(msg) {
    alert(msg + '\n\n(This triggers the WF3 cash application workflow in production.)');
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{payment.txId}</div>
            <div className="drawer-sub">{payment.bank} · Received {fmt(payment.received)}</div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="drawer-amount">${payment.amount.toLocaleString()}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span className="pq-status-badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, fontSize: 11, padding: '4px 12px' }}>
              {payment.status}
            </span>
            {payment.appliedAt && (
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Applied {fmtDateTime(payment.appliedAt)}</span>
            )}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Transaction Details</div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-item-label">Bank Description</div>
                <div className="detail-item-value" style={{ fontSize: 12 }}>{payment.description}</div>
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Bank Account</div>
                <div className="detail-item-value" style={{ fontSize: 12 }}>{payment.bank}</div>
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Received</div>
                <div className="detail-item-value">{fmt(payment.received)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Matched Customer</div>
                <div className="detail-item-value" style={{ color: 'var(--teal)', fontSize: 12 }}>
                  {payment.matchedCustomer || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">AI Match Analysis</div>
            <div style={{ padding: '14px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Match Confidence</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: cColor, letterSpacing: -1 }}>{payment.confidence}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: `${payment.confidence}%`, height: '100%', background: cColor, borderRadius: 3, transition: 'width .4s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>
                <span>0%</span>
                <span style={{ color: payment.confidence >= 90 ? 'var(--green)' : 'var(--border-mid)' }}>90% auto-apply threshold</span>
                <span>100%</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text)', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, borderLeft: `3px solid ${cColor}` }}>
                {payment.rule}
              </div>
            </div>
          </div>

          {payment.matchedInvoice && (
            <div className="drawer-section">
              <div className="drawer-section-title">Applied To</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" stroke="var(--green)" strokeWidth="1.5"/>
                  <path d="M5.5 9l2.5 2.5 4.5-5" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'ui-monospace, monospace' }}>{payment.matchedInvoice}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Payment applied · QuickBooks updated</div>
                </div>
              </div>
            </div>
          )}

          {isPending && payment.candidates?.length > 0 && (
            <div className="drawer-section">
              <div className="drawer-section-title">Invoice Candidates</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {payment.candidates.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--teal)' }}>{c}</span>
                    <button
                      style={{ fontSize: 11, color: 'var(--text)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-mid)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}
                      onClick={() => handleAction(`Applying $${payment.amount.toLocaleString()} to ${c}...`)}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="drawer-section">
            <div className="drawer-section-title">Processing Log</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {payment.appliedAt && (
                <LogItem icon="✅" text={`Applied to ${payment.matchedInvoice} in QuickBooks`} time={fmtDateTime(payment.appliedAt)} />
              )}
              {isPending && (
                <LogItem icon="⚠️" text="Routed to Slack for manual review" time={fmt(payment.received)} />
              )}
              <LogItem icon="🔍" text={`AI analysis complete · ${payment.confidence}% confidence`} time={fmt(payment.received)} />
              <LogItem icon="🏦" text="Transaction received via Plaid webhook" time={fmt(payment.received)} />
            </div>
          </div>
        </div>

        <div className="drawer-actions">
          {isPending && (
            <button className="btn-primary" onClick={() => handleAction(`Routing ${payment.txId} to Slack for team review...`)}>
              Route to Slack
            </button>
          )}
          <button
            className={isPending ? 'btn-secondary' : 'btn-primary'}
            onClick={() => handleAction(`Opening ${payment.txId} in QuickBooks...`)}
          >
            View in QuickBooks
          </button>
        </div>
      </div>
    </>
  );
}

function LogItem({ icon, text, time }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 13, lineHeight: 1.5 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text)' }}>{text}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{time}</div>
      </div>
    </div>
  );
}
