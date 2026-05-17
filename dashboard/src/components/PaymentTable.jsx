const MAX_DAYS = 90;

function daysColor(d) {
  if (d <= 21) return 'var(--green)';
  if (d <= 45) return 'var(--yellow)';
  return 'var(--red)';
}

export default function PaymentTable({ data, onOpenCustomer }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Payment Behavior</h2>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Click row for details</span>
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
