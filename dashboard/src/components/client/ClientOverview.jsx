function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const INV_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',      render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'issued',      label: 'Issued' },
  { key: 'due',         label: 'Due Date' },
  { key: 'status',      label: 'Status' },
  { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—', csvVal: row => row.daysOverdue > 0 ? row.daysOverdue : '' },
];

const PMT_COLS = [
  { key: 'txId',             label: 'Transaction' },
  { key: 'matchedCustomer',  label: 'Customer' },
  { key: 'amount',           label: 'Amount',     render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'received',         label: 'Received' },
  { key: 'status',           label: 'Status' },
  { key: 'matchedInvoice',   label: 'Matched Invoice', render: v => v ?? '—' },
  { key: 'confidence',       label: 'Confidence', render: v => `${v}%` },
];

function getDisputeSuspects(invoices, paymentBehavior) {
  const pbMap = Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p]));
  return invoices.filter(inv => {
    if (inv.status === 'Paid') return false;
    const pb = pbMap[inv.customer];
    // Viewed but still unpaid past due — they saw it, something is wrong
    if (inv.status === 'Viewed' && inv.daysOverdue > 7) return true;
    // Low-risk customer paying anomalously late vs their own average
    if (pb && pb.riskLevel === 'low' && inv.daysOverdue > pb.avgDays * 1.5) return true;
    // Medium-risk paying >2x their average
    if (pb && pb.riskLevel === 'medium' && inv.daysOverdue > pb.avgDays * 2) return true;
    return false;
  });
}

export default function ClientOverview({ data, currentDSO, dsoChange, onNavigate, isMobile, onDrill }) {
  const open     = data.invoices.filter(i => i.status !== 'Paid');
  const overdue  = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
  const next30   = open.filter(i => i.daysOverdue <= 0 && i.daysOverdue > -30);

  const totalOpen    = open.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const totalNext30  = next30.reduce((s, i) => s + i.amount, 0);

  const payments    = data.payments ?? [];
  const autoApplied = payments.filter(p => p.status === 'Auto-Applied');
  const pending     = payments.filter(p => p.status === 'Pending Review');

  const coveredInvs    = open.filter(i => (i.reminders?.length > 0) || i.nextReminder);
  const uncoveredInvs  = open.filter(i => !(i.reminders?.length > 0) && !i.nextReminder);
  const coveragePct    = open.length > 0 ? Math.round(coveredInvs.length / open.length * 100) : 100;
  const disputeSuspects = getDisputeSuspects(data.invoices, data.paymentBehavior);

  function drillInvoices(title, rows, sub) {
    onDrill({ title, subtitle: sub, source: 'Live invoice data from QuickBooks Online.', filename: title.toLowerCase().replace(/\s+/g,'_'), columns: INV_COLS, rows });
  }

  function drillBucket(label, minDays, maxDays) {
    const rows = open.filter(i => i.daysOverdue >= minDays && i.daysOverdue <= maxDays);
    const amt  = rows.reduce((s, i) => s + i.amount, 0);
    drillInvoices(`AR Aging — ${label}`, rows, `${fmtM(amt)} · ${rows.length} invoice${rows.length !== 1 ? 's' : ''}`);
  }

  function drillCustomer(pb) {
    const rows = open.filter(i => i.customer === pb.customer);
    onDrill({
      title: `${pb.customer} — Open Invoices`,
      subtitle: `${fmtM(pb.openAmount)} outstanding · avg ${pb.avgDays}d to pay · ${pb.riskLevel} risk`,
      source: 'Historical payment pattern based on past invoices. Risk level drives reminder frequency.',
      filename: `customer_${pb.customer.toLowerCase().replace(/\s+/g,'_')}`,
      columns: INV_COLS,
      rows,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 3 hero tiles */}
      <div>
        <SectionLabel>Where your money stands today</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
          <Tile label="Total Outstanding AR" value={fmtM(totalOpen)} sub={`${open.length} open invoices`} color="var(--text)"
            onClick={() => drillInvoices('All Open Invoices', open, `${fmtM(totalOpen)} · ${open.length} invoices`)} />
          <Tile label="Due in Next 30 Days" value={fmtM(totalNext30)} sub={`${next30.length} invoices · on track`} color="var(--teal)"
            onClick={() => drillInvoices('Due in Next 30 Days', next30, `${fmtM(totalNext30)} · ${next30.length} invoices`)} />
          <Tile label="Overdue Now" value={fmtM(totalOverdue)} sub={`${overdue.length} invoices need attention`} color={totalOverdue > 0 ? 'var(--red)' : 'var(--green)'}
            onClick={() => drillInvoices('Overdue Invoices', overdue, `${fmtM(totalOverdue)} · ${overdue.length} invoices`)} />
        </div>
      </div>

      {/* AR Health bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>AR health breakdown — click a segment to drill in</SectionLabel>
        <ARHealthBar invoices={data.invoices} onDrillBucket={drillBucket} />
        <div style={{ display: 'flex', gap: isMobile ? 10 : 20, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#22c55e', label: 'Current' },
            { color: '#f59e0b', label: '1–30d overdue' },
            { color: '#f97316', label: '31–60d overdue' },
            { color: '#ef4444', label: '60+ overdue' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Root Cause Diagnostic */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>DSO root cause diagnostic — your 5 drivers tracked live</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <RootCause
            status="resolved" color="#22c55e"
            title="Invoice Lag"
            detail="Invoices auto-sent within minutes of job approval via LunarLogic"
            sub="Was adding 3–8 days to DSO before go-live"
          />
          <RootCause
            status="resolved" color="#22c55e"
            title="Inconsistent Follow-Up"
            detail={`${data.invoices.filter(i => i.status !== 'Paid' && i.reminders && i.reminders.length > 0).length} active invoices in automated reminder sequences`}
            sub="Customers with 3+ reminders pay 40% faster on average"
          />
          <RootCause
            status={pending.length > 0 ? 'attention' : 'resolved'}
            color={pending.length > 0 ? '#f59e0b' : '#22c55e'}
            title="Unapplied Payments"
            detail={pending.length > 0 ? `${pending.length} payment${pending.length !== 1 ? 's' : ''} pending match confirmation` : 'All payments matched and applied automatically'}
            sub={pending.length > 0 ? 'Review in Cash In tab — one-click approval' : 'AI fuzzy-matching active, 90%+ confidence auto-applied'}
            onClick={pending.length > 0 ? () => onNavigate('cash') : null}
          />
          <RootCause
            status={data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length > 0 ? 'attention' : 'resolved'}
            color={data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length > 0 ? '#f97316' : '#22c55e'}
            title="Disputes & Aging Risk"
            detail={data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length > 0
              ? `${data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length} invoice${data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45).length !== 1 ? 's' : ''} 45+ days overdue — recovery rate drops below 50% at 90 days`
              : 'No invoices at critical aging risk'}
            sub="Invoices over 90 days past due have under 50% average recovery"
          />
          <RootCause
            status="resolved" color="#22c55e"
            title="Visibility Blind Spot"
            detail="Real-time AR dashboard active — data refreshes every 15 minutes"
            sub="LunarLogic is your windshield, not a rearview mirror"
          />
        </div>
      </div>

      {/* Automation Coverage Report */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <SectionLabel>Automation coverage — which invoices LunarLogic is handling</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: coveragePct >= 80 ? 'var(--green)' : '#f59e0b', lineHeight: 1, letterSpacing: -1 }}>{coveragePct}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>of open invoices in reminder sequence</div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${coveragePct}%`, height: '100%', background: coveragePct >= 80 ? '#22c55e' : '#f59e0b', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)' }}>
              <span>{coveredInvs.length} handled by LunarLogic</span>
              <span>{uncoveredInvs.length} need manual attention</span>
            </div>
          </div>
        </div>
        {uncoveredInvs.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Invoices outside automation coverage</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uncoveredInvs.map(inv => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0' }}>
                  <span style={{ color: 'var(--text-dim)' }}>{inv.customer} — {inv.id}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderRadius: 8, padding: '1px 7px' }}>Needs you</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {uncoveredInvs.length === 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green)', fontStyle: 'italic' }}>All open invoices are in active automation sequences — no manual follow-up needed.</div>
        )}
      </div>

      {/* Dispute Detection */}
      {disputeSuspects.length > 0 && (
        <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>Dispute detection — invoices showing anomalous payment behavior</SectionLabel>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, marginBottom: 12, lineHeight: 1.5 }}>
            These invoices are overdue in ways that don't match the customer's payment history — a billing question, dispute, or internal delay may be stalling payment.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {disputeSuspects.map(inv => {
              const pb = (data.paymentBehavior ?? []).find(p => p.customer === inv.customer);
              const reason = inv.status === 'Viewed' && inv.daysOverdue > 7
                ? 'Invoice viewed but payment not received — possible billing question'
                : `${inv.daysOverdue}d overdue vs ${pb?.avgDays ?? '?'}d typical — anomalous for this customer`;
              return (
                <div key={inv.id} style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{inv.customer}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', borderRadius: 8, padding: '1px 7px' }}>Possible Dispute</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>{reason}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Recommended: direct call to {inv.customer} to confirm receipt and address any questions</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{fmtM(inv.amount)}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.id}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10, fontStyle: 'italic' }}>
            Disputes left unresolved become bad debt. LunarLogic flags them early — when recovery is still straightforward.
          </div>
        </div>
      )}

      {/* Two panels */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>

        {/* LunarLogic activity */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>What LunarLogic handled for you</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <ActivityRow icon="✓" label="Payments auto-matched" value={`${autoApplied.length} this month`} color="var(--green)"
              onClick={() => onDrill({ title: 'Auto-Matched Payments', subtitle: `${autoApplied.length} payments processed automatically`, source: 'Payments matched by LunarLogic using amount + customer name fuzzy matching.', filename: 'auto_matched_payments', columns: PMT_COLS, rows: autoApplied })} />
            <ActivityRow icon="→" label="Awaiting your review" value={`${pending.length} payment${pending.length !== 1 ? 's' : ''}`} color={pending.length > 0 ? 'var(--amber)' : 'var(--muted)'}
              onClick={pending.length > 0 ? () => onDrill({ title: 'Payments Awaiting Review', subtitle: `${pending.length} payment${pending.length !== 1 ? 's' : ''} need your attention`, source: 'These payments could not be matched automatically. Your confirmation is needed before applying to invoices.', filename: 'pending_review_payments', columns: PMT_COLS, rows: pending }) : null} />
            <ActivityRow icon="↑" label="Collection rate" value={`${data.collectionEfficiency}%`} color="var(--teal)" />
            <ActivityRow icon="↓" label="DSO reduction since go-live" value={`${Math.abs(dsoChange)} days`} color="var(--green)"
              onClick={() => onDrill({ title: 'DSO Trend — Last 90 Days', subtitle: `${data.preLiveDSO}d → ${Math.round(currentDSO)}d · go-live ${data.goLiveDate}`, source: '30-day rolling DSO calculated from paid invoices. Go-live date marks LunarLogic activation.', filename: 'dso_trend', columns: [{ key: 'date', label: 'Date' }, { key: 'dso', label: 'DSO (days)', render: v => v.toFixed(1), csvVal: row => row.dso }], rows: data.dsoTrend })} />
          </div>
        </div>

        {/* Customer risk */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <SectionLabel>Customer payment risk — click to drill in</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {data.paymentBehavior.map(pb => (
              <div key={pb.customer} onClick={() => drillCustomer(pb)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 6, padding: '4px 6px', margin: '-4px -6px', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 12, color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pb.customer}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pb.avgDays}d avg</span>
                  <RiskDot level={pb.riskLevel} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            LunarLogic sends reminders automatically based on each customer's behavior.
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>{children}</div>;
}

function Tile({ label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'rgba(0,212,232,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <span style={{ fontSize: 10, color: 'var(--teal)', opacity: 0.7 }}>↗</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function ARHealthBar({ invoices, onDrillBucket }) {
  const open  = invoices.filter(i => i.status !== 'Paid');
  const total = open.reduce((s, i) => s + i.amount, 0);
  if (total === 0) return null;
  const BUCKETS = [
    { label: 'Current', min: -Infinity, max: 0,  color: '#22c55e', minD: 0,  maxD: 0  },
    { label: '1–30d',   min: 1,  max: 30,  color: '#f59e0b', minD: 1,  maxD: 30 },
    { label: '31–60d',  min: 31, max: 60,  color: '#f97316', minD: 31, maxD: 60 },
    { label: '60+',     min: 61, max: Infinity, color: '#ef4444', minD: 61, maxD: 9999 },
  ].map(b => {
    const amt = open.filter(i => i.daysOverdue >= b.min && i.daysOverdue <= b.max).reduce((s, i) => s + i.amount, 0);
    return { ...b, amt, pct: total > 0 ? (amt / total) * 100 : 0 };
  });
  return (
    <div>
      <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
        {BUCKETS.filter(b => b.pct > 0).map((b, i) => (
          <div key={i} onClick={() => onDrillBucket(b.label, b.minD, b.maxD)}
            style={{ width: `${b.pct}%`, background: b.color, opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
          >
            {b.pct > 12 && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{Math.round(b.pct)}%</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        {BUCKETS.map((b, i) => (
          <div key={i} style={{ fontSize: 10, color: 'var(--muted)' }}>{b.pct > 3 ? fmtM(b.amt) : ''}</div>
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ icon, label, value, color, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onClick ? 'pointer' : 'default', borderRadius: 6, padding: '4px 6px', margin: '-4px -6px', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color, fontWeight: 700, width: 14, textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
        {onClick && <span style={{ fontSize: 9, color: 'var(--muted)' }}>↗</span>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function RootCause({ icon, status, color, title, detail, sub, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: `${color}08`, border: `1px solid ${color}20`, cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = `${color}14`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; }}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}15`, borderRadius: 10, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status === 'resolved' ? 'Resolved' : 'Needs Attention'}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>{detail}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>{sub}</div>
      </div>
      {onClick && <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, marginTop: 4 }}>↗</span>}
    </div>
  );
}

function RiskDot({ level }) {
  const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Med' : 'Low';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {label}
    </div>
  );
}
