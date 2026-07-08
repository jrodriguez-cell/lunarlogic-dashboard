import { useState } from 'react';
import { useToast } from '../../lib/toast';
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

export default function ClientCashApplication({ data, clientId, isMobile, onDrill }) {
  const toast = useToast();
  const [resolved, setResolved] = useState({}); // txId -> { action, label }
  const [suggestions, setSuggestions] = useState({}); // txId -> { invoiceId, reason }
  const [suggesting, setSuggesting] = useState({});

  function parseCandidate(c) {
    const id = c.match(/^(\S+)/)?.[1] ?? c;
    const amt = c.match(/\$([\d,]+(?:\.\d+)?)/);
    return { id, amount: amt ? parseFloat(amt[1].replace(/,/g, '')) : null };
  }
  function localSuggest(p) {
    if (p.matchedInvoice) return { invoiceId: p.matchedInvoice, reason: 'Name and amount align with this invoice.' };
    const cands = (p.candidates || []).map(parseCandidate);
    if (cands.length === 0) return { invoiceId: null, reason: 'No candidate invoices — likely a new or partial payment; confirm manually.' };
    let best = cands[0];
    for (const c of cands) {
      if (c.amount != null && Math.abs(c.amount - p.amount) < Math.abs((best.amount ?? Infinity) - p.amount)) best = c;
    }
    const exact = best.amount != null && Math.abs(best.amount - p.amount) < 0.5;
    const reason = exact
      ? `Amount matches ${best.id} exactly.`
      : best.amount != null
        ? `Closest match — ${p.amount < best.amount ? 'partial payment toward' : 'nearest to'} ${best.id} ($${best.amount.toLocaleString()}).`
        : `Best available candidate.`;
    return { invoiceId: best.id, reason };
  }
  async function handleSuggest(p) {
    setSuggesting(s => ({ ...s, [p.txId]: true }));
    let suggestion = null;
    try {
      if (data.isLive) {
        const resp = await fetch('/api/ai-payment-match', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, payment: p }),
        });
        const json = await resp.json().catch(() => ({}));
        if (resp.ok && json.ok && json.suggestion) suggestion = json.suggestion;
      }
    } catch { /* fall through */ }
    if (!suggestion) suggestion = localSuggest(p);
    setSuggestions(s => ({ ...s, [p.txId]: suggestion }));
    setSuggesting(s => ({ ...s, [p.txId]: false }));
  }

  const connected = data.isLive ? data.automationStatus?.wf3?.connected === true : true;
  const statusColor = connected ? 'var(--teal)' : 'var(--muted)';

  const payments = data.payments ?? [];
  const available = data.isLive ? connected : payments.length > 0;
  const auto    = payments.filter(p => p.status === 'Auto-Applied');
  const manual  = payments.filter(p => p.status === 'Manual');
  const pending = payments.filter(p => p.status === 'Pending Review');
  const activePending = pending.filter(p => !resolved[p.txId]);
  const matched = auto.length + manual.length;
  const autoRate = matched > 0 ? Math.round((auto.length / matched) * 100) : 0;
  const pendingAmt = activePending.reduce((s, p) => s + p.amount, 0);

  function drillPayment(p) {
    onDrill({
      title: `Payment ${p.txId}`,
      subtitle: `${fmtM(p.amount)} · ${p.matchedCustomer} · ${p.confidence}% match`,
      source: 'Payment matched to an invoice using amount + customer-name matching from the bank feed.',
      filename: `payment_${p.txId}`,
      columns: [
        { key: 'txId', label: 'Transaction' }, { key: 'received', label: 'Received' }, { key: 'bank', label: 'Bank' },
        { key: 'description', label: 'Bank Description' }, { key: 'matchedCustomer', label: 'Customer' },
        { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
        { key: 'matchedInvoice', label: 'Matched Invoice', render: v => v ?? '—' },
        { key: 'confidence', label: 'Confidence', render: v => `${v}%` }, { key: 'rule', label: 'Match Rule' },
        { key: 'appliedAt', label: 'Applied At', render: v => v ?? '—' },
      ],
      rows: [p],
    });
  }

  function resolve(p, action) {
    const target = suggestions[p.txId]?.invoiceId ?? p.matchedInvoice ?? p.candidates?.[0]?.split(' ')[0] ?? null;
    const label = action === 'applied' ? (target ?? 'invoice') : 'reviewed';
    setResolved(r => ({ ...r, [p.txId]: { action, label } }));
    toast(action === 'applied' ? `${fmtM(p.amount)} applied to ${target ?? 'invoice'}` : `${p.txId} marked reviewed`);
  }

  if (!available) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AutomationHeader title="Cash Application" status="Not connected" statusColor="var(--muted)"
          blurb="Incoming bank payments are matched to open invoices automatically using amount and customer-name matching, then applied in QuickBooks — no manual reconciliation. Below 90% confidence, LunarLogic holds the payment for your confirmation." />
        <Card>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
            Payment matching isn't connected for this client yet — there's no payment data to show. Once the bank feed is live, matched and pending payments will appear here.
          </div>
        </Card>
      </div>
    );
  }

  const segTotal = payments.length || 1;
  const segments = [
    { label: 'Auto-applied',        n: auto.length,          color: '#22c55e' },
    { label: 'Manually confirmed',  n: manual.length,        color: '#00d4e8' },
    { label: 'Pending your review', n: activePending.length, color: '#f59e0b' },
  ].filter(s => s.n > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AutomationHeader title="Cash Application" status={connected ? 'Active' : 'Not connected'} statusColor={statusColor}
        blurb="Incoming bank payments are matched to open invoices automatically using amount and customer-name matching, then applied in QuickBooks — no manual reconciliation. Anything below 90% confidence is held for your quick confirmation."
        meta={[{ label: 'Source', value: 'Plaid bank feed' }, { label: 'Auto-apply threshold', value: '≥ 90% confidence' }]}
      />

      <div style={tileGridStyle(isMobile, 3)}>
        <StatTile label="Payments auto-matched" color="var(--green)"
          value={data.automationStats?.paymentsAutoMatched ?? auto.length} sub="applied without reconciliation"
          source="Payments automatically matched to invoices and applied in QuickBooks at ≥90% confidence, using exact and fuzzy name + amount matching." />
        <StatTile label="Auto-match rate" color="var(--teal)"
          value={`${autoRate}%`} sub={`${auto.length} of ${matched} matched hands-free`}
          source="Share of matched payments applied automatically (≥90% confidence) vs. those needing manual confirmation." />
        <StatTile label="Awaiting your review" color={activePending.length > 0 ? '#f59e0b' : 'var(--green)'}
          value={activePending.length} sub={activePending.length > 0 ? `${fmtM(pendingAmt)} held` : 'all cleared'}
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
          hint="These payments matched below 90% confidence. Apply each to the right invoice, or mark it reviewed — that's a real action being recorded.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(p => {
              const done = resolved[p.txId];
              if (done) {
                return (
                  <div key={p.txId} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '10px 12px' }}>
                    <span style={{ color: '#22c55e', fontSize: 14, flexShrink: 0 }}>✓</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{p.matchedCustomer}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
                        {done.action === 'applied' ? `Applied to ${done.label} by you` : 'Marked reviewed by you'}
                      </span>
                    </div>
                    <button onClick={() => setResolved(r => { const n = { ...r }; delete n[p.txId]; return n; })} style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>Undo</button>
                  </div>
                );
              }
              const sug = suggestions[p.txId];
              const target = sug?.invoiceId ?? p.matchedInvoice ?? p.candidates?.[0]?.split(' ')[0];
              return (
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
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: p.candidates?.length ? 6 : 8 }}>{p.rule}</div>
                  {p.candidates?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {p.candidates.map(c => (
                        <span key={c} style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>{c}</span>
                      ))}
                    </div>
                  )}
                  {sug && (
                    <div style={{ fontSize: 11, color: 'var(--teal)', background: 'rgba(0,212,232,0.08)', border: '1px solid rgba(0,212,232,0.25)', borderRadius: 6, padding: '6px 9px', marginBottom: 8, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 700 }}>✨ AI:</span> {sug.invoiceId ? `apply to ${sug.invoiceId}` : 'needs manual review'} — {sug.reason}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => resolve(p, 'applied')} style={primaryBtn}>
                      {target ? `Apply to ${target}` : 'Mark applied'}
                    </button>
                    <button onClick={() => resolve(p, 'reviewed')} style={secondaryBtn}>Mark reviewed</button>
                    {!sug && (
                      <button onClick={() => handleSuggest(p)} disabled={suggesting[p.txId]} style={aiBtn}>
                        {suggesting[p.txId] ? 'Analyzing…' : '✨ Suggest match'}
                      </button>
                    )}
                    <button onClick={() => drillPayment(p)} style={ghostBtn}>Details ↗</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="Recently auto-applied payments"
        hint="Click any payment to see the match detail — bank description, confidence, and rule."
        right={auto.length > 0 && (
          <button onClick={() => onDrill({
            title: 'Auto-Applied Payments', subtitle: `${auto.length} payments matched and applied automatically`,
            source: 'Payments matched by amount + customer-name fuzzy matching at ≥90% confidence and applied in QuickBooks.',
            filename: 'auto_applied_payments', columns: PMT_COLS, rows: auto,
          })} style={ghostBtn}>View all ↗</button>
        )}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {auto.slice(0, 8).map(p => (
            <div key={p.txId} onClick={() => drillPayment(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', margin: '0 -6px', borderRadius: 6, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: 11, color: '#22c55e', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.matchedCustomer}</span>
              {!isMobile && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>{p.matchedInvoice ?? '—'}</span>}
              <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>{p.confidence}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flexShrink: 0, width: 70, textAlign: 'right' }}>{fmtM(p.amount)}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>↗</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const primaryBtn   = { padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', border: '1px solid #22c55e', background: 'rgba(34,197,94,0.12)', color: '#22c55e' };
const secondaryBtn = { padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)' };
const ghostBtn     = { padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' };
const aiBtn        = { padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(0,212,232,0.4)', background: 'rgba(0,212,232,0.1)', color: 'var(--teal)' };
