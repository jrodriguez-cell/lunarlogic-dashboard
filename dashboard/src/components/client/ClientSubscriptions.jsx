import { useMemo } from 'react';
import { useToast } from '../../lib/toast';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v}`;
}
function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }

const PLANS = [
  { name: 'Retainer — Standard', amount: 4000, interval: 'mo' },
  { name: 'Retainer — Premium',  amount: 8500, interval: 'mo' },
  { name: 'Advisory — Quarterly', amount: 15000, interval: 'qtr' },
  { name: 'Managed Service',      amount: 6200, interval: 'mo' },
  { name: 'Support Plan',         amount: 2400, interval: 'mo' },
];
const STATUS = {
  active:   { label: 'Active',    color: '#22c55e' },
  pastdue:  { label: 'Past due',  color: '#ef4444' },
  paused:   { label: 'Paused',    color: '#f59e0b' },
};

function addMonths(base, n) { const d = new Date(base); d.setMonth(d.getMonth() + n); return d; }
function fmtDate(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

export default function ClientSubscriptions({ data }) {
  const toast = useToast();

  const subs = useMemo(() => {
    const today = new Date('2026-06-11');
    const customers = (data.paymentBehavior ?? []).slice(0, 6);
    return customers.map((c, i) => {
      const plan = PLANS[i % PLANS.length];
      const mrr = plan.interval === 'qtr' ? Math.round(plan.amount / 3) : plan.amount;
      const nextBill = addMonths(today, 1); nextBill.setDate(1 + (i * 3) % 26);
      const contractEnd = addMonths(today, 12 - i * 2);
      const status = c.riskLevel === 'high' && i % 2 === 0 ? 'pastdue' : i === 4 ? 'paused' : 'active';
      return { id: `SUB-${1040 + i}`, customer: c.customer, plan: plan.name, amount: plan.amount, interval: plan.interval, mrr, nextBill, contractEnd, status };
    });
  }, [data.paymentBehavior]);

  const activeMRR = subs.filter(s => s.status === 'active').reduce((s, x) => s + x.mrr, 0);
  const activeCount = subs.filter(s => s.status === 'active').length;
  const renewals90 = subs.filter(s => (s.contractEnd - new Date('2026-06-11')) / 86400000 <= 90).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Subscriptions</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Recurring billing — invoices generate automatically each cycle.</div>
        </div>
        <button onClick={() => toast('New subscription (demo) — wires to QuickBooks recurring billing in production')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.12)', border: '1px solid var(--teal)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>+ New subscription</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <Tile label="Active MRR" value={fmtM(activeMRR)} color="var(--teal)" sub={`${fmtM(activeMRR * 12)} ARR`} />
        <Tile label="Active subscriptions" value={activeCount} color="var(--text)" sub={`of ${subs.length} total`} />
        <Tile label="Renewals in 90 days" value={renewals90} color={renewals90 > 0 ? '#f59e0b' : 'var(--green)'} sub="contracts to renew" />
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              {['Customer', 'Plan', 'Amount', 'MRR', 'Next bill', 'Contract end', 'Status'].map((h, i) => (
                <th key={h} style={{ textAlign: i >= 2 && i <= 3 ? 'right' : 'left', padding: '9px 12px', fontSize: 9.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.map(s => {
              const st = STATUS[s.status];
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{s.customer}<div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400, fontFamily: 'monospace' }}>{s.id}</div></td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{s.plan}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtFull(s.amount)}/{s.interval}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--teal)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtFull(s.mrr)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(s.nextBill)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(s.contractEnd)}</td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: `${st.color}1a`, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}
