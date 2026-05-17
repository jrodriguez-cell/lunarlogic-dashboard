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

export default function InvoiceDrawer({ invoice, onClose }) {
  if (!invoice) return null;

  const isOverdue = invoice.status === 'Overdue';

  function handleAction(msg) {
    alert(msg + '\n\n(This action will be wired to the n8n workflow in production.)');
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
          <button className="drawer-close" onClick={onClose}>✕</button>
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
                  {invoice.status === 'Paid' ? '—' : `${invoice.daysOut}d`}
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

          <div className="drawer-section">
            <div className="drawer-section-title">Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invoice.status !== 'Paid' && (
                <ActivityItem icon="📧" text="Reminder email sent via Outlook" time="2 days ago" />
              )}
              {(invoice.status === 'Viewed' || invoice.status === 'Paid') && (
                <ActivityItem icon="👁" text="Invoice viewed by recipient" time="3 days ago" />
              )}
              <ActivityItem icon="📄" text={`Invoice created in QuickBooks`} time={`${invoice.daysOut || 5}d ago`} />
              <ActivityItem icon="✅" text="Invoice approved via Slack" time={`${(invoice.daysOut || 5) + 1}d ago`} />
            </div>
          </div>
        </div>

        <div className="drawer-actions">
          {isOverdue && (
            <button className="btn-primary" onClick={() => handleAction(`Sending payment reminder to ${invoice.customer}...`)}>
              Send Reminder
            </button>
          )}
          <button
            className={isOverdue ? 'btn-secondary' : 'btn-primary'}
            onClick={() => handleAction(`Marking ${invoice.id} as paid in QuickBooks...`)}
            disabled={invoice.status === 'Paid'}
          >
            {invoice.status === 'Paid' ? 'Already Paid' : 'Mark as Paid'}
          </button>
        </div>
      </div>
    </>
  );
}

function ActivityItem({ icon, text, time }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text)' }}>{text}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{time}</div>
      </div>
    </div>
  );
}
