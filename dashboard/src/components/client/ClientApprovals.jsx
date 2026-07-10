import { useState, useMemo } from 'react';
import { useToast } from '../../lib/toast';
import { PageHeader, Card, StatTile, tileGridStyle, fmtM } from './automationKit';

function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Amount-based routing tiers — who signs off, by bill size.
const ROUTING = [
  { range: 'Under $2,500',       approver: 'Auto-approve',       note: 'trusted vendors, coded ≥95%' },
  { range: '$2,500 – $10,000',   approver: 'Controller',         note: 'one-tap mobile confirm' },
  { range: 'Over $10,000',       approver: 'Controller → Owner', note: 'two-step, escalates at 48h' },
];

// Escalation timeline stages (mirrors the reminder cadence idea, for AP).
const STAGES = [
  { day: 'Submitted', name: 'Routed to approver',   tone: '#00d4e8', desc: 'Assigned by amount, vendor & GL category' },
  { day: 'Day 2',     name: 'Reminder if idle',     tone: '#f59e0b', desc: 'Automatic nudge to the assigned approver' },
  { day: 'Day 4',     name: 'Escalated',            tone: '#f97316', desc: 'Bumped to the next approver in the chain' },
  { day: 'Approved',  name: 'Scheduled for payment',tone: '#22c55e', desc: 'Logged with name, timestamp & rule' },
];

/**
 * Approval Workflows — sign-off that doesn't live in an inbox. Bills route by
 * amount / vendor / category, idle approvals escalate automatically, and every
 * decision is logged with a name, a timestamp, and a rule.
 */
export default function ClientApprovals({ ap, isMobile }) {
  const toast = useToast();
  const [decided, setDecided] = useState({});

  // The approval queue is the set of bills awaiting sign-off (status 'review').
  const queue = useMemo(
    () => ap.bills.filter(b => b.status === 'review').map(b => ({ ...b, decision: decided[b.id] })),
    [ap.bills, decided]
  );
  const pending = queue.filter(b => !b.decision);
  const pendingAmt = pending.reduce((s, b) => s + b.amount, 0);

  function decide(b, decision, msg) { setDecided(d => ({ ...d, [b.id]: decision })); toast(msg); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Approvals"
        subtitle="Route each bill to the right approver by amount, vendor, or GL category. Idle approvals get an automatic nudge, then escalate — so nothing sits in an inbox and every sign-off is documented."
      />

      <div style={tileGridStyle(isMobile, 3)}>
        <StatTile label="Awaiting sign-off" value={String(pending.length)} color="#f59e0b" sub={`${fmtM(pendingAmt)} in bills`} />
        <StatTile label="Approval cycle" value="1 day" color="#22c55e" sub="was 6 days — 83% faster" source="Average time from bill submitted to approved. Illustrative AP-automation benchmark: 6 days manual → ~1 day automated." />
        <StatTile label="Late-payment rate" value="<1%" color="#22c55e" sub="was ~8% before routing" source="Share of bills paid after their due date. Consistent routing + escalation cuts late incidents from ~8% to under 1% (illustrative)." />
      </div>

      {/* Routing rules */}
      <Card title="Routing Rules" hint="Each bill is assigned automatically by size. Larger bills require more sign-off and escalate faster.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ROUTING.map(r => (
            <div key={r.range} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px', background: 'var(--bg-row)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', minWidth: 150 }}>{r.range}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}>{r.approver}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', flex: 1, textAlign: 'right', minWidth: 140 }}>{r.note}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Escalation timeline */}
      <Card title="Escalation Timeline" hint="Every step is logged for a full audit trail — the segregation-of-duties evidence auditors and SOC 2 reviews look for.">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 10 }}>
          {STAGES.map((s, i) => (
            <div key={s.day} style={{ position: 'relative', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderTop: `2px solid ${s.tone}`, borderRadius: 10, padding: '12px 13px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: s.tone, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.day}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 3 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5, lineHeight: 1.4 }}>{s.desc}</div>
              {!isMobile && i < STAGES.length - 1 && (
                <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', color: 'var(--border-mid)', fontSize: 14, zIndex: 1 }}>›</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Approval queue */}
      <Card title={`Approval Queue · ${pending.length} pending`} hint="One-tap approve or reject. Each decision carries a name, a timestamp, and the rule that routed it.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {queue.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', background: 'var(--bg-row)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, opacity: b.decision ? 0.55 : 1, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{b.vendor}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{b.id}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{b.gl} · {b.terms} · due {fmtDate(b.dueDate)} · routed to {b.amount > 10000 ? 'Controller → Owner' : b.amount > 2500 ? 'Controller' : 'Auto'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{fmtFull(b.amount)}</span>
                {b.decision === 'approved' ? <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>✓ Approved</span>
                  : b.decision === 'rejected' ? <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>Rejected</span>
                  : <>
                      <button onClick={() => decide(b, 'approved', `${b.id} approved — ${fmtFull(b.amount)} to ${b.vendor}`)} style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => decide(b, 'rejected', `${b.id} rejected`)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Reject</button>
                    </>}
              </div>
            </div>
          ))}
          {queue.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>Nothing awaiting approval — the queue is clear.</div>}
        </div>
      </Card>
    </div>
  );
}
