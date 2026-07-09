import { useMemo, useState } from 'react';
import { useToast } from '../../lib/toast';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}
function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }

const STATUS = {
  draft:    { label: 'Draft',    color: 'var(--muted)' },
  sent:     { label: 'Sent',     color: '#60a5fa' },
  approved: { label: 'Approved', color: '#22c55e' },
  declined: { label: 'Declined', color: '#ef4444' },
};
const FILTERS = ['All', 'Draft', 'Sent', 'Approved', 'Declined'];

export default function ClientEstimates({ data }) {
  const toast = useToast();
  const [filter, setFilter] = useState('All');
  // Local optimistic status overrides for demo actions.
  const [overrides, setOverrides] = useState({});

  const estimates = useMemo(() => {
    const statuses = ['approved', 'sent', 'sent', 'draft', 'approved', 'declined', 'sent'];
    const customers = (data.paymentBehavior ?? []);
    return statuses.map((st, i) => {
      const cust = customers[i % Math.max(customers.length, 1)]?.customer ?? 'New Customer';
      const amount = 8000 + ((i * 4200) % 40000);
      const d = new Date('2026-06-11'); d.setDate(d.getDate() - (i * 5 + 3));
      return { id: `EST-${2100 + i}`, customer: cust, amount, date: d.toISOString().split('T')[0], status: st, deposit: Math.round(amount * 0.3) };
    });
  }, [data.paymentBehavior]);

  const withStatus = estimates.map(e => ({ ...e, status: overrides[e.id] ?? e.status }));
  const visible = withStatus.filter(e => filter === 'All' || STATUS[e.status].label === filter);

  const openAmt = withStatus.filter(e => e.status === 'sent' || e.status === 'draft').reduce((s, e) => s + e.amount, 0);
  const approvedAmt = withStatus.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const decided = withStatus.filter(e => e.status === 'approved' || e.status === 'declined');
  const winRate = decided.length ? Math.round(withStatus.filter(e => e.status === 'approved').length / decided.length * 100) : 0;

  function act(e, next, msg) { setOverrides(o => ({ ...o, [e.id]: next })); toast(msg); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Estimates</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Send estimates for approval; collect a deposit and convert to an invoice once approved.</div>
        </div>
        <button onClick={() => toast('New estimate (demo) — wires to the QuickBooks estimate workflow in production')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.12)', border: '1px solid var(--teal)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>+ New estimate</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <Tile label="Open estimates" value={fmtM(openAmt)} color="#60a5fa" sub="sent or draft, awaiting decision" />
        <Tile label="Approved — to convert" value={fmtM(approvedAmt)} color="var(--green)" sub="ready to invoice / collect deposit" />
        <Tile label="Win rate" value={`${winRate}%`} color="var(--teal)" sub="approved of decided" />
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
            border: `1px solid ${filter === f ? 'var(--teal)' : 'var(--border)'}`,
            background: filter === f ? 'rgba(0,212,232,0.1)' : 'none', color: filter === f ? 'var(--teal)' : 'var(--muted)',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(e => {
          const st = STATUS[e.status];
          return (
            <div key={e.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${st.color}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{e.customer}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{e.id}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: `${st.color}1a`, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Issued {e.date} · deposit {fmtFull(e.deposit)} (30%)</div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{fmtFull(e.amount)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {e.status === 'draft' && <Btn onClick={() => act(e, 'sent', `Estimate ${e.id} sent to ${e.customer}`)} primary>Send for approval</Btn>}
                {e.status === 'sent' && <>
                  <Btn onClick={() => act(e, 'approved', `${e.id} marked approved`)} primary>Mark approved</Btn>
                  <Btn onClick={() => act(e, 'declined', `${e.id} marked declined`)}>Mark declined</Btn>
                </>}
                {e.status === 'approved' && <>
                  <Btn onClick={() => toast(`Deposit invoice for ${fmtFull(e.deposit)} created from ${e.id} (demo)`)} primary>Collect deposit</Btn>
                  <Btn onClick={() => toast(`${e.id} converted to an invoice (demo)`)}>Convert to invoice</Btn>
                </>}
                {e.status === 'declined' && <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Customer declined this estimate.</span>}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>No {filter.toLowerCase()} estimates.</div>}
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
function Btn({ children, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
      border: `1px solid ${primary ? 'var(--teal)' : 'var(--border)'}`,
      background: primary ? 'rgba(0,212,232,0.12)' : 'none', color: primary ? 'var(--teal)' : 'var(--muted)',
    }}>{children}</button>
  );
}
