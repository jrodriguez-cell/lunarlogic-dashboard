function daysColor(d) {
  if (d <= 21) return '#3fb950';
  if (d <= 45) return '#e3b341';
  return '#f85149';
}

export default function PaymentTable({ data }) {
  return (
    <div className="card">
      <h2>Payment Behavior</h2>
      <table className="payment-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Avg Days</th>
            <th>Open Inv</th>
            <th>Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.customer}>
              <td>{row.customer}</td>
              <td style={{ color: daysColor(row.avgDays), fontWeight: 600 }}>{row.avgDays}</td>
              <td>{row.openCount}</td>
              <td>${row.openAmount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
