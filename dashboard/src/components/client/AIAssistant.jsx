import { useState, useRef, useEffect } from 'react';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const SUGGESTIONS = [
  'What should I chase today?',
  'Who are my slowest payers?',
  'How much is overdue?',
  'How is my DSO trending?',
];

// Compact metrics passed to the n8n workflow as context (no raw QB rows).
function buildContext(data, currentDSO) {
  const open = data.invoices.filter(i => i.status !== 'Paid');
  const overdue = open.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
  return {
    currentDSO: Math.round(currentDSO),
    preLiveDSO: data.preLiveDSO ?? null,
    collectionEfficiency: data.collectionEfficiency ?? null,
    openCount: open.length,
    totalOpen: open.reduce((s, i) => s + i.amount, 0),
    overdueCount: overdue.length,
    totalOverdue: overdue.reduce((s, i) => s + i.amount, 0),
    paymentBehavior: data.paymentBehavior ?? [],
    topOverdue: overdue.slice().sort((a, b) => b.amount - a.amount).slice(0, 5)
      .map(i => ({ customer: i.customer, id: i.id, amount: i.amount, daysOverdue: i.daysOverdue })),
  };
}

// Local rule-based answerer — used for demo logins and as a fallback when the
// n8n ai_assistant workflow isn't configured.
function localAnswer(qRaw, data, currentDSO) {
  const q = qRaw.toLowerCase();
  const open = data.invoices.filter(i => i.status !== 'Paid');
  const overdue = open.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const totalOpen = open.reduce((s, i) => s + i.amount, 0);
  const pb = data.paymentBehavior ?? [];

  const list = arr => arr.map(x => `• ${x}`).join('\n');

  if (/(chase|today|priorit|focus|action|next)/.test(q)) {
    const top = overdue.slice().sort((a, b) => b.amount - a.amount).slice(0, 3);
    if (top.length === 0) return "Nothing is overdue right now — you're all caught up. LunarLogic is following up on everything else automatically.";
    return `Chase these ${top.length} first — biggest overdue exposure:\n${list(top.map(i => `${i.customer} (${i.id}) — ${fmtM(i.amount)}, ${i.daysOverdue}d overdue`))}\nTogether that's ${fmtM(top.reduce((s, i) => s + i.amount, 0))} of your ${fmtM(totalOverdue)} overdue.`;
  }
  if (/(worst|slow|late|risk)/.test(q)) {
    const worst = pb.slice().sort((a, b) => b.avgDays - a.avgDays).slice(0, 3);
    return `Your slowest-paying customers by average days to pay:\n${list(worst.map(c => `${c.customer} — ${c.avgDays}d avg (${c.riskLevel} risk, ${fmtM(c.openAmount)} open)`))}`;
  }
  if (/(owe|most|biggest|largest|outstanding|balance)/.test(q)) {
    const big = pb.slice().sort((a, b) => b.openAmount - a.openAmount).slice(0, 3);
    return `Largest open balances:\n${list(big.map(c => `${c.customer} — ${fmtM(c.openAmount)} across ${c.openCount} invoice${c.openCount !== 1 ? 's' : ''}`))}`;
  }
  if (/(dso|days sales|collection period|trend)/.test(q)) {
    const base = data.preLiveDSO != null ? ` — down from ${data.preLiveDSO}d before LunarLogic` : '';
    return `Your DSO is ${Math.round(currentDSO)} days${base}. The industry average is ~45 days, so you're ${Math.round(currentDSO) <= 45 ? 'ahead of' : 'behind'} the benchmark. Clearing overdue invoices is the fastest lever to push it lower.`;
  }
  if (/(overdue|past due)/.test(q)) {
    return `You have ${fmtM(totalOverdue)} overdue across ${overdue.length} invoice${overdue.length !== 1 ? 's' : ''} — that's ${totalOpen > 0 ? Math.round((totalOverdue / totalOpen) * 100) : 0}% of your ${fmtM(totalOpen)} open AR. Ask "what should I chase today?" for the priority list.`;
  }
  if (/(paid|collect|efficien)/.test(q)) {
    return data.collectionEfficiency != null
      ? `Your collection rate is ${data.collectionEfficiency}% — the share of invoices paid within terms.`
      : `Collection-rate telemetry isn't wired in for this view yet.`;
  }
  // Fallback summary
  return `Here's where your AR stands: ${fmtM(totalOpen)} open across ${open.length} invoices, ${fmtM(totalOverdue)} of it overdue (${overdue.length} invoices). DSO is ${Math.round(currentDSO)} days. Try asking what to chase today, who your slowest payers are, or how your DSO is trending.`;
}

export default function AIAssistant({ data, currentDSO, clientId, isLive, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi — I'm your AR assistant. Ask me anything about your receivables: what to chase, who's slow to pay, how your DSO is trending." },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => { bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight); }, [messages, thinking]);

  async function ask(text) {
    const q = (text ?? input).trim();
    if (!q || thinking) return;
    setMessages(m => [...m, { role: 'user', text: q }]);
    setInput('');
    setThinking(true);
    let answer = null;
    try {
      if (isLive) {
        const resp = await fetch('/api/ai-assistant', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, question: q, context: buildContext(data, currentDSO) }),
        });
        const json = await resp.json().catch(() => ({}));
        if (resp.ok && json.ok && json.answer) answer = json.answer;
      }
    } catch { /* fall through to local */ }
    if (!answer) answer = localAnswer(q, data, currentDSO);
    setMessages(m => [...m, { role: 'assistant', text: answer }]);
    setThinking(false);
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 'min(380px, calc(100vw - 32px))', height: 'min(520px, calc(100vh - 100px))',
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: 'rgba(0,212,232,0.12)', color: 'var(--teal)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M2 3.5h12v8H6.5L3 15v-3.5H2z" /></svg>
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AR Assistant</div>
            <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>Ask about what to collect next</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', padding: '8px 11px', borderRadius: 10,
              background: m.role === 'user' ? 'rgba(0,212,232,0.14)' : 'var(--bg)',
              border: `1px solid ${m.role === 'user' ? 'rgba(0,212,232,0.3)' : 'var(--border)'}`,
              color: m.role === 'user' ? 'var(--teal)' : 'var(--text-dim)',
            }}>{m.text}</div>
          </div>
        ))}
        {thinking && <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Thinking…</div>}
      </div>

      {/* Quick questions — always one tap away */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px 0', overflowX: 'auto', flexShrink: 0 }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => ask(s)} disabled={thinking} style={{ whiteSpace: 'nowrap', fontSize: 11, color: 'var(--text-dim)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>{s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: 'none' }}>
        <input
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ask(); }}
          placeholder="Ask about your AR…"
          style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: 'var(--text)', outline: 'none' }}
        />
        <button onClick={() => ask()} disabled={thinking || !input.trim()} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--teal)', background: 'rgba(0,212,232,0.12)', color: 'var(--teal)', opacity: thinking || !input.trim() ? 0.5 : 1 }}>Send</button>
      </div>
    </div>
  );
}
