import { useState, useMemo } from 'react';
import { useToast } from '../../lib/toast';
import { PageHeader, StatTile, tileGridStyle, fmtM } from './automationKit';

function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS = {
  review:    { label: 'Needs review', color: '#f59e0b' },
  approved:  { label: 'Approved',     color: '#00d4e8' },
  scheduled: { label: 'Scheduled',    color: '#22c55e' },
  paid:      { label: 'Paid',         color: 'var(--muted)' },
};
const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'review', label: 'Needs review' },
  { id: 'approved', label: 'Approved' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'paid', label: 'Paid' },
  { id: 'all', label: 'All' },
];

/**
 * Bill Capture & Coding — a bill lands (email / portal / upload), AI extracts
 * the vendor, amount, and due date and suggests the GL code from vendor
 * history. It leaves ready for approval, not a data-entry queue.
 */
export default function ClientBills({ ap }) {
  const toast = useToast();
  const [filter, setFilter] = useState('open');
  const [overrides, setOverrides] = useState({});

  const bills = useMemo(
    () => ap.bills.map(b => ({ ...b, status: overrides[b.id] ?? b.status })),
    [ap.bills, overrides]
  );

  const visible = bills.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'open') return b.status !== 'paid';
    return b.status === filter;
  });

  const openAmt = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0);
  const reviewCount = bills.filter(b => b.status === 'review').length;
  const codedPct = Math.round((bills.filter(b => b.glConfidence >= 90).length / bills.length) * 100);

  function act(b, next, msg) { setOverrides(o => ({ ...o, [b.id]: next })); toast(msg); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Bills"
        subtitle="Forward or upload a vendor bill — AI extracts the vendor, amount, and due date and suggests the GL code from vendor history. Bills post the day they arrive, coded and ready for approval."
        right={<button onClick={() => toast('Upload / forward a bill (demo) — wires to the AP bill-capture workflow in production')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.12)', border: '1px solid var(--teal)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>+ Add bill</button>}
      />

      <div style={tileGridStyle(false, 3)}>
        <StatTile label="Open bills" value={fmtM(openAmt)} color="var(--text)" sub={`${bills.filter(b => b.status !== 'paid').length} unpaid`} />
        <StatTile label="Needs review" value={String(reviewCount)} color="#f59e0b" sub="captured, awaiting approval" />
        <StatTile label="Auto-coded" value={`${codedPct}%`} color="#22c55e" sub="GL suggested with ≥90% confidence" source="Share of bills where the AI GL-coding confidence (from vendor history) is 90% or higher — no manual coding needed." />
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
            border: `1px solid ${filter === f.id ? 'var(--teal)' : 'var(--border)'}`,
            background: filter === f.id ? 'rgba(0,212,232,0.1)' : 'none', color: filter === f.id ? 'var(--teal)' : 'var(--muted)',
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(b => {
          const st = STATUS[b.status];
          const overdue = b.daysToDue < 0 && b.status !== 'paid';
          return (
            <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${st.color}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{b.vendor}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{b.id}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: `${st.color}1a`, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>{b.gl}</span>
                    {b.status === 'review' && (
                      <span style={{ fontSize: 10, color: b.glConfidence >= 90 ? '#22c55e' : '#f59e0b' }}>
                        AI-coded · {b.glConfidence}% confidence
                      </span>
                    )}
                    {b.discountTerms && b.discountEligible && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '1px 7px' }}>{b.discountTerms} · save {fmtFull(b.discountAmount)}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                    Bill {fmtDate(b.billDate)} · {b.terms} · <span style={{ color: overdue ? '#ef4444' : 'var(--muted)', fontWeight: overdue ? 700 : 400 }}>due {fmtDate(b.dueDate)}{overdue ? ` (${-b.daysToDue}d past due)` : ''}</span>
                    {b.approver && <span> · approver {b.approver}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmtFull(b.amount)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {b.status === 'review' && <>
                  <Btn primary onClick={() => act(b, 'approved', `${b.id} approved — routed for scheduling`)}>Approve &amp; route</Btn>
                  <Btn onClick={() => toast(`GL code editor for ${b.id} (demo)`)}>Edit GL code</Btn>
                  <Btn onClick={() => toast(`${b.id} flagged for follow-up`)}>Flag</Btn>
                </>}
                {b.status === 'approved' && <>
                  <Btn primary onClick={() => act(b, 'scheduled', `${b.id} scheduled for payment near its ${fmtDate(b.dueDate)} due date`)}>Schedule payment</Btn>
                  <Btn onClick={() => act(b, 'review', `${b.id} sent back for review`)}>Send back</Btn>
                </>}
                {b.status === 'scheduled' && <>
                  <Btn onClick={() => act(b, 'paid', `${b.id} marked paid to ${b.vendor}`)} primary>Mark paid</Btn>
                  <Btn onClick={() => toast(`Payment for ${b.id} rescheduled (demo)`)}>Reschedule</Btn>
                </>}
                {b.status === 'paid' && <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Paid — posted to {b.gl}.</span>}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>No bills in this view.</div>}
      </div>
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
