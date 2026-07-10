import { useState } from 'react';

/**
 * Clearable action queue — the condensed "what needs you today" list that sits
 * at the top of each suite's Dashboard, directly under the metric banner.
 *
 * Cleared state is controlled by the parent (persisted per client) so the nav
 * badge, this queue, and the full listing always agree. Each item has a quick
 * primary action plus a Done control that clears it; "View all" opens the full
 * listing where tasks can also be assigned to teammates.
 *
 * items: [{ key, tag, color, title, detail, amount, actions:[{label,onClick,primary}] }]
 */
function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const CONDENSED_LIMIT = 3;

export default function ActionQueue({ items, cleared, accent = 'var(--teal)', title = 'Action plan', isMobile, onClear, onUnclear, onReset, onViewAll }) {
  const [lastCleared, setLastCleared] = useState(null);

  const pending = items.filter(i => !cleared.has(i.key));
  const doneCount = items.filter(i => cleared.has(i.key)).length;
  const atStake = pending.reduce((s, i) => s + (i.amount || 0), 0);
  const allClear = pending.length === 0;
  const shown = pending.slice(0, CONDENSED_LIMIT);
  const moreCount = pending.length - shown.length;

  function clear(key) { onClear(key); setLastCleared(key); }
  function undo() { if (lastCleared) { onUnclear(lastCleared); setLastCleared(null); } }

  return (
    <div style={{ background: allClear ? 'rgba(34,197,94,0.06)' : 'var(--bg-card)', border: `1px solid ${allClear ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`, borderRadius: 12, padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: allClear ? 0 : 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.2 }}>{title}</div>
          {!allClear && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#ef4444', borderRadius: 10, padding: '1px 7px', lineHeight: 1.6 }}>{pending.length}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!allClear && atStake > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}><span style={{ fontWeight: 800, color: 'var(--text)' }}>{fmtM(atStake)}</span> at stake</div>
          )}
          {doneCount > 0 && (
            <button onClick={onReset} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>
              {doneCount} cleared · reset
            </button>
          )}
          <button onClick={onViewAll} style={{ fontSize: 11, fontWeight: 700, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>View all &amp; assign →</button>
        </div>
      </div>

      {allClear ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>✓</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            {doneCount > 0 ? 'Queue cleared — nice work. ' : "You're all caught up — nothing needs action right now. "}
            {lastCleared && <button onClick={undo} style={{ fontSize: 12, fontWeight: 700, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Undo</button>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map(item => (
            <div key={item.key} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: `3px solid ${item.color}`, borderRadius: 8, padding: '11px 13px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 12, alignItems: isMobile ? 'stretch' : 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: item.color, background: `${item.color}1a`, border: `1px solid ${item.color}40`, borderRadius: 10, padding: '1px 8px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{item.tag}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.title}</span>
                  {item.amount > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{fmtM(item.amount)}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.45 }}>{item.detail}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                {(item.actions || []).map((a, i) => (
                  <button key={i} onClick={a.onClick} style={{
                    fontSize: 11, fontWeight: 700, borderRadius: 6, padding: isMobile ? '8px 12px' : '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                    border: `1px solid ${a.primary ? accent : 'var(--border)'}`,
                    background: a.primary ? `${accent}1f` : 'none',
                    color: a.primary ? accent : 'var(--muted)',
                  }}>{a.label}</button>
                ))}
                <button onClick={() => clear(item.key)} title="Mark done — clear from queue" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, borderRadius: 6,
                  padding: isMobile ? '8px 12px' : '6px 10px', cursor: 'pointer',
                  border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', whiteSpace: 'nowrap',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  Done
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {moreCount > 0
              ? <button onClick={onViewAll} style={{ fontSize: 11, fontWeight: 700, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ {moreCount} more — view all &amp; assign →</button>
              : <span />}
            {lastCleared && (
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                Cleared an item · <button onClick={undo} style={{ fontSize: 10.5, fontWeight: 700, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Undo</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
