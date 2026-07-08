import SourceTag from '../SourceTag';
import DSOProjection from './DSOProjection';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const INV_COLS = [
  { key: 'id', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
  { key: 'issued', label: 'Issued' },
  { key: 'due', label: 'Due Date' },
  { key: 'status', label: 'Status' },
  { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—', csvVal: r => r.daysOverdue > 0 ? r.daysOverdue : '' },
];

function getDisputeSuspects(invoices, paymentBehavior) {
  const pbMap = Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p]));
  return invoices.filter(inv => {
    if (inv.status === 'Paid') return false;
    const pb = pbMap[inv.customer];
    if (inv.status === 'Viewed' && inv.daysOverdue > 7) return true;
    if (pb && pb.riskLevel === 'low' && inv.daysOverdue > pb.avgDays * 1.5) return true;
    if (pb && pb.riskLevel === 'medium' && inv.daysOverdue > pb.avgDays * 2) return true;
    return false;
  });
}

const TODAY = new Date('2026-06-11');
function daysToDue(dueStr) {
  return Math.round((new Date(dueStr) - TODAY) / 86400000);
}

export default function ClientOverview({ data, currentDSO, dsoChange, bpdso, dsoGapDollars, onNavigate, isMobile, onDrill }) {
  const open    = data.invoices.filter(i => i.status !== 'Paid');
  const overdue = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
  const totalOpen    = open.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);

  const payments = data.payments ?? [];
  const paymentDataAvailable = data.isLive ? data.automationStatus?.wf3?.connected === true : true;
  const pending = payments.filter(p => p.status === 'Pending Review');

  const reminderDataAvailable = open.some(i => i.reminders !== undefined || i.nextReminder !== undefined);
  const uncoveredInvs = open.filter(i => !((i.reminders?.length > 0) || i.nextReminder));
  const disputeSuspects = getDisputeSuspects(data.invoices, data.paymentBehavior);

  // ── AR aging buckets (for the health visual) ──────────────────────────
  const BUCKETS = [
    { label: 'Current',  color: '#22c55e', test: d => d <= 0 },
    { label: '1–30d',    color: '#f59e0b', test: d => d >= 1 && d <= 30 },
    { label: '31–60d',   color: '#f97316', test: d => d >= 31 && d <= 60 },
    { label: '60d+',     color: '#ef4444', test: d => d > 60 },
  ].map(b => {
    const rows = open.filter(i => b.test(i.daysOverdue));
    return { ...b, amt: rows.reduce((s, i) => s + i.amount, 0) };
  });
  const pctCurrent = totalOpen > 0 ? Math.round((BUCKETS[0].amt / totalOpen) * 100) : 100;

  // ── Cash coming in (expected collections by due window) ────────────────
  const cashWindows = [
    { label: 'Next 30 days', hi: 30 },
    { label: '31–60 days',   lo: 31, hi: 60 },
    { label: '61–90 days',   lo: 61, hi: 90 },
  ].map(w => {
    const amt = open.filter(i => {
      const d = daysToDue(i.due);
      const eff = Math.max(d, 0); // overdue collectible now → falls in the first window
      return eff <= w.hi && (w.lo ? eff >= w.lo : true);
    }).reduce((s, i) => s + i.amount, 0);
    return { ...w, amt };
  });

  // ── "Needs you today" triage (dedup across categories) ────────────────
  const sumAmt = arr => arr.reduce((s, i) => s + i.amount, 0);
  const disputeSet = new Set(disputeSuspects.map(i => i.id));
  const pendingAmt = pending.reduce((s, p) => s + p.amount, 0);
  const agingRiskInvs = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45 && !disputeSet.has(i.id));
  const agingSet = new Set(agingRiskInvs.map(i => i.id));
  const overdueUncovered = reminderDataAvailable
    ? uncoveredInvs.filter(i => i.daysOverdue > 0 && !disputeSet.has(i.id) && !agingSet.has(i.id))
    : [];

  function drillInvoices(title, rows, sub) {
    onDrill({ title, subtitle: sub, source: 'Invoice data from QuickBooks Online.', filename: title.toLowerCase().replace(/\s+/g, '_'), columns: INV_COLS, rows });
  }
  function drillUnapplied() {
    onDrill({
      title: 'Unapplied Payments — Confirmation Needed',
      subtitle: `${pending.length} payment${pending.length !== 1 ? 's' : ''} · ${fmtM(pendingAmt)} held pending review`,
      source: 'LunarLogic auto-applies at ≥90% match confidence. Below that, your confirmation prevents misapplication.',
      filename: 'unapplied_payments',
      columns: [
        { key: 'txId', label: 'Transaction' }, { key: 'matchedCustomer', label: 'Customer' },
        { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
        { key: 'confidence', label: 'Confidence', render: v => `${v}%` }, { key: 'rule', label: 'Why Held' },
      ],
      rows: pending,
    });
  }
  function drillDisputes() {
    drillInvoices('Possible Disputes — Anomalous Behavior', disputeSuspects, `${disputeSuspects.length} flagged · ${fmtM(sumAmt(disputeSuspects))}`);
  }

  const actionItems = [];
  if (paymentDataAvailable && pending.length > 0) actionItems.push({
    key: 'pending', color: '#f59e0b', tag: 'Confirm', weight: 100, amount: pendingAmt,
    title: `Confirm ${pending.length} payment${pending.length !== 1 ? 's' : ''}`,
    detail: `${fmtM(pendingAmt)} received but AI match was below 90% — tell LunarLogic which invoice it belongs to`, onClick: drillUnapplied,
  });
  if (disputeSuspects.length > 0) actionItems.push({
    key: 'disputes', color: '#a78bfa', tag: 'Call', weight: 90, amount: sumAmt(disputeSuspects),
    title: `Call ${disputeSuspects.length} customer${disputeSuspects.length !== 1 ? 's' : ''} about a possible dispute`,
    detail: `${fmtM(sumAmt(disputeSuspects))} overdue off-pattern — a billing question may be stalling payment`, onClick: drillDisputes,
  });
  if (agingRiskInvs.length > 0) actionItems.push({
    key: 'aging', color: '#f97316', tag: 'Escalate', weight: 80, amount: sumAmt(agingRiskInvs),
    title: `Escalate ${agingRiskInvs.length} invoice${agingRiskInvs.length !== 1 ? 's' : ''} 45+ days overdue`,
    detail: `${fmtM(sumAmt(agingRiskInvs))} at recovery risk — direct contact recommended before 90 days`,
    onClick: () => drillInvoices('Aging Risk — 45+ Days Overdue', agingRiskInvs, `${fmtM(sumAmt(agingRiskInvs))} · ${agingRiskInvs.length} invoices`),
  });
  if (overdueUncovered.length > 0) actionItems.push({
    key: 'uncovered', color: '#f59e0b', tag: 'Follow up', weight: 70, amount: sumAmt(overdueUncovered),
    title: `Follow up on ${overdueUncovered.length} invoice${overdueUncovered.length !== 1 ? 's' : ''} outside automation`,
    detail: `${fmtM(sumAmt(overdueUncovered))} overdue and not in an automated reminder sequence`,
    onClick: () => drillInvoices('Overdue — Outside Automation', overdueUncovered, `${fmtM(sumAmt(overdueUncovered))} · ${overdueUncovered.length} invoices`),
  });
  actionItems.sort((a, b) => b.weight - a.weight);
  const visibleActions = actionItems.slice(0, 4);
  const totalAtStake = actionItems.reduce((s, i) => s + i.amount, 0);

  const target = Math.max(bpdso, Math.round(currentDSO * 0.6));
  const projImprove = Math.max(0, Math.round(currentDSO) - target);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Needs you today */}
      <NeedsToday items={visibleActions} totalItems={actionItems.length} totalAtStake={totalAtStake} isMobile={isMobile} />

      {/* AR Health */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <SectionLabel>AR health at a glance</SectionLabel>
        <div style={{ display: 'flex', gap: isMobile ? 14 : 24, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: pctCurrent >= 60 ? 'var(--green)' : '#f59e0b', letterSpacing: -2, lineHeight: 1 }}>{pctCurrent}%</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>current</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, maxWidth: 150 }}>of your open AR is on track — not yet overdue</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              {BUCKETS.filter(b => b.amt > 0).map(b => (
                <div key={b.label} onClick={() => drillInvoices(`AR Aging — ${b.label}`, open.filter(i => b.test(i.daysOverdue)), fmtM(b.amt))}
                  title={`${b.label}: ${fmtM(b.amt)}`}
                  style={{ width: `${(b.amt / totalOpen) * 100}%`, background: b.color, opacity: 0.9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(b.amt / totalOpen) > 0.1 && <span style={{ fontSize: 9, fontWeight: 700, color: '#0a0f16' }}>{Math.round((b.amt / totalOpen) * 100)}%</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: isMobile ? 10 : 18, marginTop: 10, flexWrap: 'wrap' }}>
              {BUCKETS.map(b => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                  {b.label} · <span style={{ color: 'var(--muted)' }}>{fmtM(b.amt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <MiniStat label="Total open AR" value={fmtM(totalOpen)} sub={`${open.length} invoices`} onClick={() => drillInvoices('All Open Invoices', open, `${fmtM(totalOpen)} · ${open.length} invoices`)} />
          <MiniStat label="Overdue now" value={fmtM(totalOverdue)} color={totalOverdue > 0 ? 'var(--red)' : 'var(--green)'} sub={`${overdue.length} invoices`} onClick={() => drillInvoices('Overdue Invoices', overdue, `${fmtM(totalOverdue)} · ${overdue.length} invoices`)} />
          <MiniStat label="Collection rate" value={data.collectionEfficiency != null ? `${data.collectionEfficiency}%` : '—'} sub="paid within terms" />
        </div>
      </div>

      {/* Path to a lower DSO — the money visual */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <SectionLabel>Your path to a lower DSO</SectionLabel>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 14, maxWidth: 680 }}>
          {overdue.length > 0 ? (
            <>Clearing your <strong style={{ color: 'var(--text)' }}>{overdue.length} overdue invoice{overdue.length !== 1 ? 's' : ''}</strong> ({fmtM(totalOverdue)}) projects DSO from <strong style={{ color: 'var(--teal)' }}>{Math.round(currentDSO)}d</strong> down to <strong style={{ color: 'var(--green)' }}>{target}d</strong>
            {dsoGapDollars > 0 && <> — freeing about <strong style={{ color: 'var(--green)' }}>{fmtM(dsoGapDollars)}</strong> in working capital.</>}</>
          ) : (
            <>Your AR is fully current. Holding this pace keeps DSO near <strong style={{ color: 'var(--green)' }}>{Math.round(currentDSO)}d</strong> — well inside the {45}-day industry average.</>
          )}
        </div>
        <DSOProjection dsoTrend={data.dsoTrend} goLiveDate={data.goLiveDate} currentDSO={currentDSO} targetDSO={target} industryAvg={45} />
        <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <PathStat label="DSO today" value={`${Math.round(currentDSO)}d`} color="var(--teal)" />
          <PathStat label="Projected" value={`${target}d`} color="var(--green)" sub={projImprove > 0 ? `▼ ${projImprove}d` : 'at optimal'} />
          {dsoChange != null && dsoChange < 0 && <PathStat label="Since go-live" value={`▼ ${Math.abs(dsoChange)}d`} color="var(--green)" />}
          <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            <button onClick={() => onNavigate('action')} style={ctaBtn}>See remediation plan ↗</button>
          </div>
        </div>
      </div>

      {/* Cash coming in */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <SectionLabel>
          Cash coming in
          <SourceTag label="Expected collections grouped by invoice due date. Overdue invoices are shown as collectible in the first window. An estimate based on due dates, not a guarantee." />
        </SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10, marginTop: 4 }}>
          {cashWindows.map(w => (
            <div key={w.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{w.label}</div>
              {w.amt > 0 ? (
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)', letterSpacing: -0.5, marginTop: 6, lineHeight: 1 }}>{fmtM(w.amt)}</div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginTop: 8, lineHeight: 1 }}>Nothing due</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Explore automations */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <SectionLabel>How LunarLogic is working for you — explore each automation</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10, marginTop: 4 }}>
          <AutoLink title="Invoice AI" desc="Slack → QuickBooks invoicing, sent same day" color="#22c55e" onClick={() => onNavigate('invoiceai')} />
          <AutoLink title="Payment Reminders" desc="Automated escalating email sequences" color="#22c55e" onClick={() => onNavigate('reminders')} />
          <AutoLink title="Cash Application" desc="Bank payments auto-matched to invoices" color="var(--teal)" onClick={() => onNavigate('cashapp')} />
        </div>
      </div>
    </div>
  );
}

const ctaBtn = { padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--teal)', background: 'rgba(0,212,232,0.1)', color: 'var(--teal)' };

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>{children}</div>;
}

function MiniStat({ label, value, sub, color = 'var(--text)', onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', borderRadius: 8, padding: '2px 4px', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}{onClick && <span style={{ marginLeft: 4 }}>↗</span>}</div>
      <div style={{ fontSize: 19, fontWeight: 900, color, letterSpacing: -0.5, lineHeight: 1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function PathStat({ label, value, color, sub }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: -0.5, lineHeight: 1, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function AutoLink({ title, desc, color, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.12s, background 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}55`; e.currentTarget.style.background = `${color}0a`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>↗</span>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>{desc}</div>
    </button>
  );
}

function NeedsToday({ items, totalItems, totalAtStake, isMobile }) {
  const allClear = items.length === 0;
  return (
    <div style={{ background: allClear ? 'rgba(34,197,94,0.06)' : 'var(--bg-card)', border: `1px solid ${allClear ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: allClear ? 0 : 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Needs you today</div>
          {!allClear && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#ef4444', borderRadius: 10, padding: '1px 7px', lineHeight: 1.6 }}>{totalItems}</span>}
        </div>
        {!allClear && totalAtStake > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}><span style={{ fontWeight: 800, color: 'var(--text)' }}>{fmtM(totalAtStake)}</span> at stake</div>
        )}
      </div>
      {allClear ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>✓</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>You're all caught up</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>LunarLogic is handling everything — no action needed from you right now.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <button key={item.key} onClick={item.onClick} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              background: `${item.color}0d`, border: `1px solid ${item.color}30`, borderRadius: 8,
              padding: isMobile ? '10px 12px' : '10px 14px', cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `${item.color}1a`; e.currentTarget.style.borderColor = `${item.color}55`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${item.color}0d`; e.currentTarget.style.borderColor = `${item.color}30`; }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: item.color, background: `${item.color}22`, borderRadius: 6, padding: '3px 7px', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0, whiteSpace: 'nowrap' }}>{item.tag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>{item.detail}</div>
              </div>
              <span style={{ fontSize: 16, color: item.color, flexShrink: 0, fontWeight: 700 }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
