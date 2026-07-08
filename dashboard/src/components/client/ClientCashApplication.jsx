import { AutomationHeader, Card, StatTile, fmtM, tileGridStyle } from './automationKit';

const PMT_COLS = [
  { key: 'txId', label: 'Transaction' },
  { key: 'matchedCustomer', label: 'Customer' },
  { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
  { key: 'received', label: 'Received' },
  { key: 'matchedInvoice', label: 'Matched Invoice', render: v => v ?? '—' },
  { key: 'confidence', label: 'Confidence', render: v => `${v}%` },
  { key: 'status', label: 'Status' },
];

export default function ClientCashApplication({ data, isMobile, onDrill }) {
  const connected = data.isLive ? data.automationStatus?.wf3?.connected === true : true;
  const statusColor = connected ? 'var(--teal)' : 'var(--muted)';

  const payments = data.payments ?? [];
  const available = data.isLive ? connected : payments.length > 0;
  const auto    = payments.filter(p => p.status === 'Auto-Applied');
  const manual  = payments.filter(p => p.status === 'Manual');
  const pending = payments.filter(p => p.status === 'Pending Review');
  const matched = auto.length + manual.length;
  const autoRate = matched > 0 ? Math.round((auto.length / matched) * 100) : 0;
  const pendingAmt = pending.reduce((s, p) => s + p.amount, 0);

  const segTotal = payments.length || 1;
  const segments = [
    { label: 'Auto-applied',        n: auto.length,    color: '#22c55e' },
    { label: 'Manually confirmed',  n: manual.length,  color: '#00d4e8' },
    { label: 'Pending your review', n: pending.length, color: '#f59e0b' },
  ].filter(s => s.n > 0);

  if (!available) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AutomationHeader
          title="Cash Application" status="Not connected" statusColor="var(--muted)"
          blurb="Incoming bank payments are matched to open invoices automatically using amount and customer-name matching, then applied in QuickBooks — no manual reconciliation. Below 90% confidence, LunarLogic holds the payment for your confirmation."
        />
        <Card>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
            Payment matching isn't connected for this client yet — there's no payment data to show. Once the bank feed is live, matched and pending payments will appear here.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AutomationHeader
        title="Cash Application" status={connected ? 'Active' : 'Not connected'} statusColor={statusColor}
        blurb="Incoming bank payments are matched to open invoices automatically using amount and customer-name matching, then applied in QuickBooks — no manual reconciliation. Anything below 90% confidence is held for your quick confirmation."
        meta={[{ label: 'Source', value: 'Plaid bank feed' }, { label: 'Auto-apply threshold', value: '≥ 90% confidence' }]}
      />

      <div style={tileGridStyle(isMobile, 3)}>
        <StatTile label="Payments auto-matched" color="var(--green)"
          value={data.automationStats?.paymentsAutoMatched ?? auto.length}
          sub="applied without reconciliation"
          source="Payments automatically matched to invoices and applied in QuickBooks at ≥90% confidence, using exact and fuzzy name + amount matching." />
        <StatTile label="Auto-match rate" color="var(--teal)"
          value={`${autoRate}%`} sub={`${auto.length} of ${matched} matched hands-free`}
          source="Share of matched payments applied automatically (≥90% confidence) vs. those needing manual confirmation." />
        <StatTile label="Awaiting your review" color={pending.length > 0 ? '#f59e0b' : 'var(--muted)'}
          value={pending.length} sub={pending.length > 0 ? `${fmtM(pendingAmt)} held` : 'nothing pending'}
          source="Payments received but matched below the 90% threshold — held so they aren't applied to the wrong invoice until you confirm." />
      </div>

      <Card title="Match outcomes" hint="How incoming payments were resolved this period.">
        <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
          {segments.map(s => (
            <div key={s.label} title={`${s.label}: ${s.n}`} style={{ width: `${(s.n / segTotal) * 100}%`, background: s.color, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(s.n / segTotal) > 0.1 && <span style={{ fontSize: 10, fontWeight: 800, color: '#0a0f16' }}>{s.n}</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
          {segments.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-dim)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />{s.label} ({s.n})
            </div>
          ))}
        </div>
      </Card>

      {pending.length > 0 && (
        <Card title="Needs your confirmation" accent="#f59e0b"
          hint="These payments matched below 90% confidence. Confirm which invoice each belongs to so LunarLogic can apply it.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(p => (
              <div key={p.txId} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{p.matchedCustomer}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{p.txId} · received {p.received}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{fmtM(p.amount)}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b' }}>{p.confidence}% match</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: p.candidates?.length ? 6 : 0 }}>{p.rule}</div>
                {p.candidates?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.candidates.map(c => (
                      <span key={c} style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => onDrill({
            title: 'Unapplied Payments — Confirmation Needed',
            subtitle: `${pending.length} payment${pending.length !== 1 ? 's' : ''} · ${fmtM(pendingAmt)} held pending review`,
            source: 'Payments received via bank feed. LunarLogic auto-applies at ≥90% confidence; below that, your confirmation prevents misapplication.',
            filename: 'unapplied_payments',
            columns: [
              { key: 'txId', label: 'Transaction' }, { key: 'matchedCustomer', label: 'Customer' },
              { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
              { key: 'received', label: 'Received' }, { key: 'confidence', label: 'Confidence', render: v => `${v}%` },
              { key: 'rule', label: 'Why Held' },
              { key: 'candidates', label: 'Candidate Invoices', render: v => Array.isArray(v) ? v.join(' · ') : '—', csvVal: r => Array.isArray(r.candidates) ? r.candidates.join(', ') : '' },
            ],
            rows: pending,
          })} style={{ marginTop: 10, padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            Review all pending ↗
          </button>
        </Card>
      )}

      <Card title="Recently auto-applied payments"
        right={auto.length > 0 && (
          <button onClick={() => onDrill({
            title: 'Auto-Applied Payments', subtitle: `${auto.length} payments matched and applied automatically`,
            source: 'Payments matched by amount + customer-name fuzzy matching at ≥90% confidence and applied in QuickBooks.',
            filename: 'auto_applied_payments', columns: PMT_COLS, rows: auto,
          })} style={exportBtn}>View all ↗</button>
        )}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {auto.slice(0, 6).map(p => (
            <div key={p.txId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: '#22c55e', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.matchedCustomer}</span>
              {!isMobile && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>{p.matchedInvoice ?? '—'}</span>}
              <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>{p.confidence}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flexShrink: 0, width: 70, textAlign: 'right' }}>{fmtM(p.amount)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const exportBtn = { padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' };
