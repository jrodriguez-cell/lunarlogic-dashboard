const STATUS_COLOR = {
  Paid:    '#22c55e',
  Sent:    '#00d4e8',
  Viewed:  '#f59e0b',
  Overdue: '#ef4444',
};

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function CustomerDrawer({ customer, invoices, onClose, onOpenInvoice, onDrill }) {
  if (!customer) return null;

  const allInvoices = invoices.filter(inv => inv.customer === customer.customer);
  const customerInvoices = allInvoices.filter(inv => inv.status !== 'Paid');
  const recentPaid = allInvoices.filter(inv => inv.status === 'Paid');
  const overdueCount = customerInvoices.filter(inv => inv.status === 'Overdue').length;

  const trendAbs = Math.abs(customer.trend);
  const trendLabel = customer.trend < 0
    ? `↓ ${trendAbs}d faster recently`
    : customer.trend > 0
    ? `↑ ${trendAbs}d slower recently`
    : 'Stable';
  const trendColor = customer.trend < 0 ? 'var(--green)' : customer.trend > 0 ? 'var(--red)' : 'var(--muted)';

  function handleAction(msg) {
    alert(msg + '\n\n(This action triggers the WF2 reminder workflow in production.)');
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <div className="customer-header-row" style={{ marginBottom: 0 }}>
            <div className="customer-avatar">{initials(customer.customer)}</div>
            <div>
              <div className="drawer-title">{customer.customer}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span className={`risk-badge risk-${customer.riskLevel}`}>
                  {customer.riskLevel} risk
                </span>
                <span style={{ fontSize: 11, color: trendColor }}>{trendLabel}</span>
              </div>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="detail-grid" style={{ marginBottom: 24 }}>
            <div className="detail-item">
              <div className="detail-item-label">Avg Days to Pay</div>
              <div className={`detail-item-value${customer.avgDays > 45 ? ' warn' : customer.avgDays < 25 ? ' good' : ''}`}>
                {customer.avgDays}d
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Open Invoices</div>
              <div className={`detail-item-value${overdueCount > 0 ? ' warn' : ''}`}>
                {customer.openCount}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Total Outstanding</div>
              <div className="detail-item-value">${customer.openAmount.toLocaleString()}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Overdue</div>
              <div className={`detail-item-value${overdueCount > 0 ? ' warn' : ' good'}`}>
                {overdueCount > 0 ? `${overdueCount} inv` : 'None'}
              </div>
            </div>
          </div>

          {customerInvoices.length > 0 && (
            <div className="drawer-section">
              <div className="drawer-section-title">Open Invoices</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customerInvoices.map(inv => (
                  <div
                    key={inv.id}
                    className="invoice-row"
                    onClick={() => onOpenInvoice(inv)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="invoice-left">
                      <span className="invoice-id">{inv.id}</span>
                      <span className="invoice-customer" style={{ fontSize: 12 }}>
                        Due {new Date(inv.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="invoice-right">
                      <span className="invoice-amount">${inv.amount.toLocaleString()}</span>
                      <span
                        className="invoice-status"
                        style={{ color: STATUS_COLOR[inv.status], borderColor: STATUS_COLOR[inv.status] }}
                      >
                        {inv.status}
                      </span>
                      {inv.daysOverdue > 0 && (
                        <span className="invoice-days warn">{inv.daysOverdue}d</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentPaid.length > 0 && (
            <div className="drawer-section">
              <div className="drawer-section-title">Recently Paid</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentPaid.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', fontSize: 10 }}>{inv.id}</span>
                    <span style={{ color: 'var(--text)' }}>${inv.amount.toLocaleString()}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>Paid</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="drawer-section">
            <div className="drawer-section-title">Risk Assessment</div>
            <div style={{ padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, lineHeight: 1.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Risk Level</span>
                <span className={`risk-badge risk-${customer.riskLevel}`}>{customer.riskLevel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Avg days vs net 30</span>
                <span style={{ color: customer.avgDays > 30 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                  {customer.avgDays > 30 ? `+${customer.avgDays - 30}d late` : `${30 - customer.avgDays}d early`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Payment trend</span>
                <span style={{ color: trendColor, fontWeight: 600 }}>{trendLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-actions">
          <button
            className="card-export-btn"
            onClick={() => onDrill?.({
              title: `${customer.customer} — All Invoices`,
              subtitle: `${allInvoices.length} total invoices`,
              source: `All invoices for this customer. Includes paid and open invoices. Data sourced from your accounting system.`,
              filename: `customer_${customer.customer.replace(/[^a-z0-9]/gi,'_').toLowerCase()}.csv`,
              columns: [
                { key: 'id',          label: 'Invoice' },
                { key: 'amount',      label: 'Amount',       render: v => `$${v.toLocaleString()}` },
                { key: 'issued',      label: 'Issue Date' },
                { key: 'due',         label: 'Due Date' },
                { key: 'daysOut',     label: 'Days Out',      render: (v, r) => r.status === 'Paid' ? '—' : `${v}d` },
                { key: 'daysOverdue', label: 'Days Overdue',  render: v => v > 0 ? `${v}d` : '—' },
                { key: 'status',      label: 'Status' },
              ],
              rows: allInvoices,
            })}
          >
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/>
              <path d="M1 9.5h9"/>
            </svg>
            Export CSV
          </button>
          {overdueCount > 0 && (
            <button className="btn-primary" onClick={() => handleAction(`Sending payment reminder to ${customer.customer}...`)}>
              Send Reminder
            </button>
          )}
          <button className={overdueCount > 0 ? 'btn-secondary' : 'btn-primary'} onClick={() => handleAction(`Viewing full statement for ${customer.customer}...`)}>
            View Statement
          </button>
        </div>
      </div>
    </>
  );
}
