const STATUS_COLOR = {
  Paid:    '#3fb950',
  Sent:    '#58a6ff',
  Viewed:  '#e3b341',
  Overdue: '#f85149',
};

export default function InvoiceBoard({ invoices }) {
  return (
    <div className="card">
      <h2>Invoice Status</h2>
      <div className="invoice-list">
        {invoices.map((inv) => (
          <div key={inv.id} className="invoice-row">
            <div className="invoice-left">
              <span className="invoice-id">{inv.id}</span>
              <span className="invoice-customer">{inv.customer}</span>
            </div>
            <div className="invoice-right">
              <span className="invoice-amount">${inv.amount.toLocaleString()}</span>
              <span
                className="invoice-status"
                style={{ color: STATUS_COLOR[inv.status], borderColor: STATUS_COLOR[inv.status] }}
              >
                {inv.status}
              </span>
              <span className="invoice-days">
                {inv.status !== 'Paid' ? `${inv.daysOut}d` : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
