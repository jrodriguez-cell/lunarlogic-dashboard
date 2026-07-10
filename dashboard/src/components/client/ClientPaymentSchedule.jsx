import { useState, useMemo } from 'react';
import { useToast } from '../../lib/toast';
import { PageHeader, Card, StatTile, tileGridStyle, fmtM } from './automationKit';

function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group scheduled payments into weekly run windows for the calendar view.
function weekOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - day); // back to Sunday
  return dt.toISOString().split('T')[0];
}

/**
 * Payment Scheduling & Optimization — approved bills are batched by due date,
 * early-payment discounts are captured when cash allows, and ACH/check runs are
 * timed to hit a controlled target DPO instead of paying early out of habit.
 */
export default function ClientPaymentSchedule({ ap, isMobile }) {
  const toast = useToast();
  const [paid, setPaid] = useState({});

  const payments = useMemo(
    () => ap.scheduledPayments.map(p => ({ ...p, done: paid[p.id] })),
    [ap.scheduledPayments, paid]
  );

  const runTotal = payments.filter(p => !p.done).reduce((s, p) => s + p.amount, 0);
  const discountsCaptured = payments.filter(p => p.discountCaptured && !p.done).reduce((s, p) => s + p.discountAmount, 0);
  const avgDPO = ap.targetDPO;

  // Group into weekly payment runs.
  const runs = useMemo(() => {
    const map = {};
    payments.forEach(p => {
      const wk = weekOf(p.scheduledDate);
      (map[wk] ??= []).push(p);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [payments]);

  function pay(p) { setPaid(m => ({ ...m, [p.id]: true })); toast(`${p.method} sent — ${fmtFull(p.amount)} to ${p.vendor}${p.discountCaptured ? `, ${fmtFull(p.discountAmount)} discount captured` : ''}`); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Payment Schedule"
        subtitle="Approved bills, batched by due date and timed to a target DPO. Every eligible early-payment discount is captured automatically; no cash leaves before it has to."
        right={<button onClick={() => toast(`Payment run queued — ${fmtFull(runTotal)} across ${payments.filter(p => !p.done).length} bills (demo)`)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.12)', border: '1px solid var(--teal)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>Run batch →</button>}
      />

      <div style={tileGridStyle(isMobile, 4)}>
        <StatTile label="Scheduled total" value={fmtM(runTotal)} color="var(--text)" sub={`${payments.filter(p => !p.done).length} bills queued`} />
        <StatTile label="Target DPO" value={`${avgDPO}d`} color="#22c55e" sub="this run averages on-target" source="The controlled Days Payable Outstanding this schedule aims for — matched to terms, in the 28–32 day sweet spot." />
        <StatTile label="Discounts captured" value={fmtM(discountsCaptured)} color="#22c55e" sub="early-pay windows hit" source="Early-payment discounts captured on this run by paying inside the discount window (e.g. the 10 days of 2/10 Net 30)." />
        <StatTile label="Duplicate payments" value="0" color="var(--teal)" sub="blocked by matching" source="Bills matched to prevent paying the same invoice twice — a common manual-AP error the scheduler eliminates." />
      </div>

      {runs.map(([wk, list]) => {
        const wkTotal = list.filter(p => !p.done).reduce((s, p) => s + p.amount, 0);
        return (
          <Card key={wk} title={`Payment Run · week of ${fmtDate(wk)}`} right={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{fmtFull(wkTotal)}</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {list.map(p => {
                const overdueRisk = p.daysToDue < 0;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', background: 'var(--bg-row)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, opacity: p.done ? 0.5 : 1, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{p.vendor}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '1px 7px' }}>{p.method}</span>
                        {p.discountCaptured && <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '1px 7px' }}>discount · {fmtFull(p.discountAmount)}</span>}
                      </div>
                      <div style={{ fontSize: 10.5, color: overdueRisk ? '#ef4444' : 'var(--muted)', marginTop: 3 }}>
                        due {fmtDate(p.dueDate)} · scheduled {fmtDate(p.scheduledDate)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{fmtFull(p.amount)}</span>
                      {p.done
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>✓ Sent</span>
                        : <button onClick={() => pay(p)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.12)', border: '1px solid var(--teal)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Pay now</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
      {runs.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>No payments scheduled — approve bills to build a run.</div>}
    </div>
  );
}
