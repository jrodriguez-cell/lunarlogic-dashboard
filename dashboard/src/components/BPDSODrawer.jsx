import { useMobile } from '../lib/useMobile';

function fmtK(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

const URGENCY = {
  critical: { color: '#ef4444', label: 'Critical' },
  high:     { color: '#f97316', label: 'Urgent' },
  medium:   { color: '#f59e0b', label: 'Follow up' },
  low:      { color: '#00d4e8', label: 'WF2 active' },
};

function getUrgency(daysOverdue) {
  if (daysOverdue > 90) return 'critical';
  if (daysOverdue > 60) return 'high';
  if (daysOverdue > 30) return 'high';
  if (daysOverdue > 14) return 'medium';
  return 'low';
}

function getAction(daysOverdue) {
  if (daysOverdue > 90) return 'Escalate to collections immediately';
  if (daysOverdue > 60) return 'Personal call — senior contact required';
  if (daysOverdue > 30) return 'Phone call + formal written notice';
  if (daysOverdue > 14) return 'Follow-up call recommended';
  return 'WF2 reminder sequence active — monitor';
}

export default function BPDSODrawer({ data, currentDSO, bpdso, dsoGapDays, dsoGapDollars, onClose, onAction }) {
  const isMobile = useMobile();
  if (!data) return null;

  const dailyRev = data.annualRevenue / 365;
  const overdueInvs = data.invoices
    .filter(i => i.status !== 'Paid' && i.daysOverdue > 0)
    .map(inv => ({
      ...inv,
      dsoContrib: Math.round((inv.amount / dailyRev) * 10) / 10,
      urgency: getUrgency(inv.daysOverdue),
      action: getAction(inv.daysOverdue),
    }))
    .sort((a, b) => b.dsoContrib - a.dsoContrib);

  // Build running DSO: what DSO would be after collecting each invoice
  let runningDSO = Math.round(currentDSO * 10) / 10;
  const withRunning = overdueInvs.map(inv => {
    runningDSO = Math.round((runningDSO - inv.dsoContrib) * 10) / 10;
    return { ...inv, dsoAfter: Math.max(runningDSO, bpdso) };
  });

  const nonOverdueAR = data.invoices
    .filter(i => i.status !== 'Paid' && i.daysOverdue <= 0)
    .reduce((s, i) => s + i.amount, 0);

  const p = isMobile ? '16px' : '24px';

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel drill-drawer" style={{ maxWidth: isMobile ? '100%' : 520 }}>

        {/* Header */}
        <div className="drawer-header" style={{ padding: isMobile ? '14px 16px' : '18px 24px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="drawer-title" style={{ fontSize: isMobile ? 14 : 16 }}>Path to Best Possible DSO</div>
            <div className="drawer-sub" style={{ fontSize: isMobile ? 11 : 12 }}>
              {Math.round(currentDSO)}d today → {bpdso}d target · {dsoGapDays}d gap · {fmtK(dsoGapDollars)} recoverable
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} style={{ width: isMobile ? 40 : 28, height: isMobile ? 40 : 28, fontSize: isMobile ? 16 : 14 }}>✕</button>
        </div>

        <div className="drill-body" style={{ padding: `0 ${p} ${p}` }}>

          {/* How it's calculated */}
          <div style={{ background: 'rgba(0,212,232,0.05)', border: '1px solid rgba(0,212,232,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>How BPDSO is calculated</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FormulaRow label="Non-overdue AR" value={fmtK(nonOverdueAR)} muted />
              <FormulaRow label="÷ Daily revenue" value={`${fmtK(Math.round(dailyRev))}/day`} muted />
              <div style={{ borderTop: '1px solid rgba(0,212,232,0.2)', paddingTop: 6, marginTop: 2 }}>
                <FormulaRow label="= Best Possible DSO" value={`${bpdso}d`} highlight />
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
              BPDSO is your theoretical DSO floor — the number you'd have today if every overdue invoice were collected right now. It's driven by billing volume and timing, not collections failure. The {dsoGapDays}-day gap above {bpdso}d is entirely from the overdue invoices below.
            </div>
          </div>

          {/* Gap visualization */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>DSO gap breakdown</div>
            <div style={{ position: 'relative', height: 28, borderRadius: 6, overflow: 'hidden', background: 'var(--bg)' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.round((bpdso / Math.round(currentDSO)) * 100)}%`, background: 'rgba(0,212,232,0.25)', borderRight: '2px solid #00d4e8' }} />
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', background: 'rgba(239,68,68,0.1)' }} />
              <div style={{ position: 'absolute', left: 6, top: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#00d4e8' }}>{bpdso}d BPDSO</span>
              </div>
              <div style={{ position: 'absolute', right: 6, top: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>+{dsoGapDays}d overdue gap</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)' }}>0d</span>
              <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700 }}>{Math.round(currentDSO)}d current</span>
            </div>
          </div>

          {/* Action plan */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>
              Prioritized action plan — highest DSO impact first
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 10 }}>
              Collecting in this order gives the fastest DSO improvement per action taken.
            </div>

            {withRunning.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--green)', fontStyle: 'italic', padding: '12px 0' }}>
                No overdue invoices — you are already at your best possible DSO.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {withRunning.map((inv, idx) => {
                  const urg = URGENCY[inv.urgency];
                  return (
                    <div key={inv.id} style={{ borderRadius: 8, border: `1px solid ${urg.color}22`, borderLeft: `3px solid ${urg.color}`, background: 'var(--bg-card)', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>#{idx + 1} {inv.customer}</span>
                              <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace' }}>{inv.id}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, color: urg.color, background: `${urg.color}15`, borderRadius: 8, padding: '1px 6px' }}>{urg.label}</span>
                            </div>
                            <div style={{ fontSize: 11, color: urg.color, fontWeight: 600, marginBottom: 3 }}>{inv.action}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.daysOverdue}d overdue · due {inv.due}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>${inv.amount.toLocaleString()}</div>
                            <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>+{inv.dsoContrib}d DSO</div>
                          </div>
                        </div>

                        {/* DSO after collecting this invoice */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(0,212,232,0.05)', borderRadius: 6, border: '1px solid rgba(0,212,232,0.1)' }}>
                          <span style={{ fontSize: 10, color: 'var(--muted)', flex: 1 }}>DSO after collecting this invoice:</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: inv.dsoAfter <= bpdso * 1.05 ? '#22c55e' : '#00d4e8' }}>
                            {inv.dsoAfter}d
                          </span>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                            {inv.dsoAfter <= bpdso ? '= BPDSO ✓' : `(${Math.round(inv.dsoAfter - bpdso)}d from BPDSO)`}
                          </span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', padding: '6px 12px', background: 'rgba(0,0,0,0.08)' }}>
                        <button
                          onClick={() => { onClose(); if (onAction) onAction(inv); }}
                          style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Open invoice — take action ↗
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 16, paddingTop: 10, borderTop: '1px solid var(--border)', lineHeight: 1.6 }}>
            BPDSO = Non-overdue AR ÷ (Annual Revenue ÷ 365). DSO contribution per invoice = Invoice amount ÷ Daily revenue. Collecting higher-amount invoices first reduces DSO the fastest.
          </div>
        </div>
      </div>
    </>
  );
}

function FormulaRow({ label, value, muted, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: muted ? 'var(--text-dim)' : 'var(--text)' }}>{label}</span>
      <span style={{ fontSize: highlight ? 14 : 12, fontWeight: highlight ? 900 : 600, color: highlight ? '#00d4e8' : 'var(--text-dim)', letterSpacing: highlight ? -0.5 : 0 }}>{value}</span>
    </div>
  );
}
