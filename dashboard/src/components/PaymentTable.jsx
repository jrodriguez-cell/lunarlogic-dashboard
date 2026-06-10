const MAX_DAYS = 90;

function daysColor(d) {
  if (d <= 21) return 'var(--green)';
  if (d <= 45) return 'var(--yellow)';
  return 'var(--red)';
}

export default function PaymentTable({ data, onOpenCustomer, onDrill }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Payment Behavior</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>Click row for details</span>
          <button
            className="card-export-btn"
            onClick={() => onDrill?.({
              title: 'Customer Payment Behavior',
              subtitle: 'Avg days to pay, risk level, outstanding AR',
              source: 'Average days to pay calculated from historical invoice payment history. Risk level = Low (<30d avg), Medium (30–60d), High (>60d). Trend = change vs prior 30-day period.',
              filename: 'payment_behavior.csv',
              columns: [
                { key: 'customer',    label: 'Customer' },
                { key: 'avgDays',     label: 'Avg Days to Pay', render: v => `${v}d` },
                { key: 'riskLevel',   label: 'Risk Level' },
                { key: 'openCount',   label: 'Open Invoices' },
                { key: 'openAmount',  label: 'Open Amount',     render: v => `$${v.toLocaleString()}` },
                { key: 'trend',       label: 'Trend (days)',    render: v => v > 0 ? `+${v}d slower` : v < 0 ? `${v}d faster` : 'Stable' },
              ],
              rows: data,
            })}
          >
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/>
              <path d="M1 9.5h9"/>
            </svg>
            Export
          </button>
        </div>
      </div>
      <table className="payment-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Risk</th>
            <th>Avg Days</th>
            <th>Trend</th>
            <th>Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => {
            const barPct = Math.min((row.avgDays / MAX_DAYS) * 100, 100);
            const trendColor = row.trend < 0 ? 'var(--green)' : row.trend > 0 ? 'var(--red)' : 'var(--muted)';
            const trendStr   = row.trend < 0 ? `↓${Math.abs(row.trend)}d` : row.trend > 0 ? `↑${row.trend}d` : '—';
            return (
              <tr key={row.customer} onClick={() => onOpenCustomer(row)}>
                <td style={{ fontWeight: 500 }}>{row.customer}</td>
                <td>
                  <span className={`risk-badge risk-${row.riskLevel}`}>{row.riskLevel}</span>
                </td>
                <td>
                  <div className="days-bar-wrap">
                    <span style={{ color: daysColor(row.avgDays), fontWeight: 600 }}>{row.avgDays}d</span>
                    <div className="days-bar">
                      <div
                        className="days-bar-fill"
                        style={{ width: `${barPct}%`, background: daysColor(row.avgDays) }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span className="trend-indicator" style={{ color: trendColor }}>{trendStr}</span>
                </td>
                <td style={{ fontWeight: 600 }}>${row.openAmount.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
