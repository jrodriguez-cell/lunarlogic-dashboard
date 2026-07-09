import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, StatTile, fmtM, tileGridStyle } from './automationKit';

function RiskBadge({ level }) {
  const meta = {
    low:    { color: '#22c55e', label: 'Low risk' },
    medium: { color: '#f59e0b', label: 'Medium risk' },
    high:   { color: '#ef4444', label: 'High risk' },
  }[level] ?? { color: 'var(--muted)', label: 'Unknown' };
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}35`, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {meta.label}
    </span>
  );
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PaymentTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{fmtDate(label)}</div>
      <div className="tooltip-row"><span>Received</span><span style={{ color: 'var(--teal)' }}>{fmtM(payload[0].value)}</span></div>
    </div>
  );
}

export default function ClientCustomers({ data, isMobile, onDrill, onAction }) {
  const paymentBehavior = data.paymentBehavior;
  const payments = data.payments;
  const invoices = data.invoices;

  const [sortKey, setSortKey] = useState('avgDays');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(paymentBehavior?.[0]?.customer ?? null);

  const rows = useMemo(() => {
    const sorted = [...(paymentBehavior ?? [])].sort((a, b) => {
      const r = a[sortKey] > b[sortKey] ? 1 : a[sortKey] < b[sortKey] ? -1 : 0;
      return sortDir === 'asc' ? r : -r;
    });
    return sorted;
  }, [paymentBehavior, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const selectedHistory = useMemo(() => {
    if (!selected) return [];
    return (payments ?? [])
      .filter(p => p.matchedCustomer === selected)
      .slice()
      .sort((a, b) => a.received.localeCompare(b.received))
      .map(p => ({ received: p.received, amount: p.amount }));
  }, [payments, selected]);

  const selectedInvoices = useMemo(() => (invoices ?? []).filter(i => i.customer === selected), [invoices, selected]);
  const selectedPB = (paymentBehavior ?? []).find(p => p.customer === selected);

  const totalReceived = selectedHistory.reduce((s, p) => s + p.amount, 0);
  const avgPayment     = selectedHistory.length > 0 ? Math.round(totalReceived / selectedHistory.length) : 0;

  const HIST_COLS = [
    { key: 'received', label: 'Received' },
    { key: 'amount',   label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
  ];

  if (!paymentBehavior || paymentBehavior.length === 0) {
    return (
      <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', padding: '20px 0' }}>
        No customer payment-behavior data available yet for this account.
      </div>
    );
  }

  const COLS = [
    { key: 'customer',   label: 'Customer' },
    { key: 'avgDays',    label: 'Avg days to pay', align: 'right' },
    { key: 'openCount',  label: 'Open invoices',   align: 'right' },
    { key: 'openAmount', label: 'Open amount',     align: 'right' },
    { key: 'trend',      label: 'Trend',           align: 'right' },
    { key: 'riskLevel',  label: 'Risk' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div style={tileGridStyle(isMobile, 3)}>
        <StatTile label="Customers tracked" color="var(--teal)" value={paymentBehavior.length} sub="with payment history" />
        <StatTile label="Fastest payer" color="var(--green)"
          value={rows.length ? `${Math.min(...rows.map(r => r.avgDays))}d` : '—'}
          sub={rows.length ? [...rows].sort((a, b) => a.avgDays - b.avgDays)[0].customer : ''} />
        <StatTile label="Slowest payer" color="#f59e0b"
          value={rows.length ? `${Math.max(...rows.map(r => r.avgDays))}d` : '—'}
          sub={rows.length ? [...rows].sort((a, b) => b.avgDays - a.avgDays)[0].customer : ''} />
      </div>

      <Card title="Payment behavior by customer" hint="Click a customer to see their payment history over time.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr>
                {COLS.map(c => {
                  const active = sortKey === c.key;
                  return (
                    <th key={c.key} onClick={() => toggleSort(c.key)} style={{
                      textAlign: c.align ?? 'left', padding: '8px 10px', fontSize: 9.5, fontWeight: 700,
                      color: active ? 'var(--teal)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                      cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', borderBottom: '1px solid var(--border)',
                    }}>
                      {c.label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.customer} onClick={() => setSelected(r.customer)} style={{
                  cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: selected === r.customer ? 'var(--bg-hover)' : 'transparent',
                }}
                  onMouseEnter={e => { if (selected !== r.customer) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (selected !== r.customer) e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '9px 10px', fontSize: 12, fontWeight: selected === r.customer ? 700 : 400, color: 'var(--text)' }}>{r.customer}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, textAlign: 'right', color: 'var(--text-dim)' }}>{r.avgDays}d</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, textAlign: 'right', color: 'var(--text-dim)' }}>{r.openCount}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>{fmtM(r.openAmount)}</td>
                  <td style={{ padding: '9px 10px', fontSize: 11, textAlign: 'right', color: r.trend < 0 ? 'var(--green)' : r.trend > 0 ? '#ef4444' : 'var(--muted)' }}>
                    {r.trend > 0 ? `▲ +${r.trend}d` : r.trend < 0 ? `▼ ${r.trend}d` : '—'}
                  </td>
                  <td style={{ padding: '9px 10px' }}><RiskBadge level={r.riskLevel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <Card
          title={`Payment history — ${selected}`}
          hint="Every payment received from this customer, over time."
          right={selectedHistory.length > 0 && (
            <button onClick={() => onDrill({
              title: `Payment History — ${selected}`,
              subtitle: `${selectedHistory.length} payments · ${fmtM(totalReceived)} total`,
              source: 'Payments matched to this customer via the bank feed (Plaid), applied to invoices in QuickBooks.',
              filename: `payment_history_${selected.replace(/\s+/g, '_')}`,
              columns: HIST_COLS,
              rows: selectedHistory,
            })} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' }}>
              Export ↗
            </button>
          )}
        >
          {selectedHistory.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No payment history recorded yet for this customer.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={isMobile ? 140 : 180}>
                <BarChart data={selectedHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="received" tick={{ fontSize: 9, fill: '#4b5563' }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                  <YAxis tick={{ fontSize: 9, fill: '#4b5563' }} tickLine={false} axisLine={false} tickFormatter={v => `$${Math.round(v / 1000)}k`} width={40} />
                  <Tooltip content={<PaymentTooltip />} cursor={{ fill: 'rgba(0,212,232,0.06)' }} />
                  <Bar dataKey="amount" radius={[3, 3, 0, 0]} maxBarSize={32} fill="#00d4e8" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total received</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginTop: 3 }}>{fmtM(totalReceived)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payments</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginTop: 3 }}>{selectedHistory.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg payment</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginTop: 3 }}>{fmtM(avgPayment)}</div>
                </div>
                {selectedPB && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg days to pay</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--teal)', marginTop: 3 }}>{selectedPB.avgDays}d</div>
                  </div>
                )}
              </div>
              {selectedInvoices.some(i => i.status !== 'Paid') && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Open invoices for this customer</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {selectedInvoices.filter(i => i.status !== 'Paid').map(inv => (
                      <div key={inv.id} onClick={() => onAction?.(inv)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{inv.id}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', flex: 1 }}>{inv.status}{inv.daysOverdue > 0 ? ` · ${inv.daysOverdue}d overdue` : ''}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
