const STATUS_COLOR = {
  Paid:    '#22c55e',
  Sent:    '#00d4e8',
  Viewed:  '#f59e0b',
  Overdue: '#ef4444',
};

function fmt(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Small filled circle used as activity timeline dot
function Dot({ color }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0, marginTop: 3 }}>
      <circle cx="4" cy="4" r="4" fill={color || 'var(--border-mid)'} />
    </svg>
  );
}

export default function InvoiceDrawer({ invoice, onClose }) {
  if (!invoice) return null;

  const isOverdue = invoice.status === 'Overdue';
  const isPaid    = invoice.status === 'Paid';
  const canRemind = invoice.status === 'Overdue' || invoice.status === 'Sent';

  function handleAction(label, detail) {
    alert(`${label} (${detail})`);
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{invoice.id}</div>
            <div className="drawer-sub">{invoice.customer}</div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l8 8M9 1l-8 8"/>
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-amount">${invoice.amount.toLocaleString()}</div>

          <div style={{ marginBottom: 20 }}>
            <span
              className="invoice-status"
              style={{ color: STATUS_COLOR[invoice.status], borderColor: STATUS_COLOR[invoice.status], fontSize: 11, padding: '4px 12px' }}
            >
              {invoice.status}
            </span>
            {isOverdue && (
              <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>
                {invoice.daysOverdue}d overdue
              </span>
            )}
          </div>

          {/* Invoice Details */}
          <div className="drawer-section">
            <div className="drawer-section-title">Invoice Details</div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-item-label">Issue Date</div>
                <div className="detail-item-value">{fmt(invoice.issued)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Due Date</div>
                <div className="detail-item-value" style={{ color: isOverdue ? 'var(--red)' : undefined }}>
                  {fmt(invoice.due)}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Days Outstanding</div>
                <div className={`detail-item-value${invoice.daysOut > 30 ? ' warn' : ''}`}>
                  {isPaid ? '—' : `${invoice.daysOut}d`}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Days Overdue</div>
                <div className={`detail-item-value${isOverdue ? ' warn' : ' good'}`}>
                  {isOverdue ? `${invoice.daysOverdue}d` : 'On time'}
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Summary */}
          {isOverdue && (
            <div className="drawer-section">
              <div className="drawer-section-title">Overdue Summary</div>
              <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                This invoice is <strong style={{ color: 'var(--red)' }}>{invoice.daysOverdue} days past due</strong>.
                A payment reminder was last sent automatically via WF2.
                Consider escalating if no response within 48 hours.
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="drawer-section">
            <div className="drawer-section-title">Payment History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isPaid ? (
                <PayHistoryItem
                  dot="var(--green)"
                  text={`Full payment of $${invoice.amount.toLocaleString()} received`}
                  time="Recently"
                />
              ) : invoice.amount > 50000 ? (
                <>
                  <PayHistoryItem
                    dot="var(--yellow)"
                    text={`Partial payment $${Math.round(invoice.amount * 0.4).toLocaleString()} received`}
                    time="12 days ago"
                  />
                  <PayHistoryItem
                    dot="var(--border-mid)"
                    text={`Balance $${Math.round(invoice.amount * 0.6).toLocaleString()} outstanding`}
                    time="Pending"
                  />
                </>
              ) : (
                <PayHistoryItem
                  dot="var(--border-mid)"
                  text="No payments received yet"
                  time={isOverdue ? `${invoice.daysOverdue}d past due` : 'Awaiting payment'}
                />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="drawer-section">
            <div className="drawer-section-title">Quick Actions</div>
            <div className="quick-actions">
              <button
                className="quick-action-btn"
                onClick={() => handleAction(
                  `Invoice duplicated as draft.`,
                  'Will sync to ERP in production.'
                )}
              >
                Duplicate
              </button>
              <button
                className="quick-action-btn"
                onClick={() => handleAction(
                  `Generating PDF for ${invoice.id}...`,
                  'ERP integration in production.'
                )}
              >
                Download PDF
              </button>
              {canRemind && (
                <button
                  className="quick-action-btn"
                  onClick={() => handleAction(
                    `Sending payment reminder to ${invoice.customer} via Outlook.`,
                    'Wired to WF2 in production.'
                  )}
                >
                  Send Reminder
                </button>
              )}
              {!isPaid && (
                <button
                  className="quick-action-btn"
                  style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.35)' }}
                  onClick={() => handleAction(
                    `Invoice void requires ERP confirmation.`,
                    'In production.'
                  )}
                >
                  Void Invoice
                </button>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="drawer-section">
            <div className="drawer-section-title">Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!isPaid && (
                <ActivityItem
                  dot="var(--teal)"
                  text="Reminder email sent via Outlook"
                  time="2 days ago"
                />
              )}
              {(invoice.status === 'Viewed' || isPaid) && (
                <ActivityItem
                  dot="var(--yellow)"
                  text="Invoice viewed by recipient"
                  time="3 days ago"
                />
              )}
              <ActivityItem
                dot="var(--border-mid)"
                text="Invoice created in QuickBooks"
                time={`${invoice.daysOut || 5}d ago`}
              />
              <ActivityItem
                dot="var(--green)"
                text="Invoice approved via Slack"
                time={`${(invoice.daysOut || 5) + 1}d ago`}
              />
            </div>
          </div>
        </div>

        <div className="drawer-actions">
          {isOverdue && (
            <button
              className="btn-primary"
              onClick={() => handleAction(
                `Sending payment reminder to ${invoice.customer}...`,
                'Wired to WF2 in production.'
              )}
            >
              Send Reminder
            </button>
          )}
          <button
            className={isOverdue ? 'btn-secondary' : 'btn-primary'}
            onClick={() => handleAction(
              `Marking ${invoice.id} as paid in QuickBooks...`,
              'Wired to QB API in production.'
            )}
            disabled={isPaid}
          >
            {isPaid ? 'Already Paid' : 'Mark as Paid'}
          </button>
        </div>
      </div>
    </>
  );
}

function ActivityItem({ dot, text, time }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Dot color={dot} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text)' }}>{text}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{time}</div>
      </div>
    </div>
  );
}

function PayHistoryItem({ dot, text, time }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Dot color={dot} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text)' }}>{text}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{time}</div>
      </div>
    </div>
  );
}
