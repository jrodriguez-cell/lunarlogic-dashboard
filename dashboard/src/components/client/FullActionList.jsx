import { useState } from 'react';
import { TEAM, UNASSIGNED, getAssignments, setAssignment, assignmentFor } from '../../lib/actionState';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

/**
 * Full action-items listing — a drawer over the Dashboard showing every task,
 * its underlying invoices/bills, and controls to assign the task to a teammate
 * or mark it done. Opened from the "View all" button on the condensed queue.
 */
export default function FullActionList({ items, cleared, accent = 'var(--teal)', title = 'Action items', clientId, suite, onClear, onUnclear, onClose, onNavigate }) {
  const [assignments, setAssignments] = useState(() => getAssignments(clientId));

  function assign(itemKey, who) {
    const next = setAssignment(clientId, suite, itemKey, who);
    setAssignments({ ...next });
  }

  const pendingCount = items.filter(i => !cleared.has(i.key)).length;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel" style={{ width: 520, maxWidth: '100%' }}>
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{title}</div>
            <div className="drawer-sub">{pendingCount} open · {items.length} total — assign to a teammate or mark done</div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>No action items right now — you're all caught up.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => {
              const isCleared = cleared.has(item.key);
              const who = assignmentFor(assignments, suite, item.key);
              return (
                <div key={item.key} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${item.color}`, borderRadius: 10, padding: 14, opacity: isCleared ? 0.55 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: item.color, background: `${item.color}1a`, border: `1px solid ${item.color}40`, borderRadius: 10, padding: '1px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.tag}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{item.title}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.45 }}>{item.detail}</div>
                    </div>
                    {item.amount > 0 && <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', flexShrink: 0 }}>{fmtM(item.amount)}</span>}
                  </div>

                  {/* Assign + done controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Assign to</span>
                    <select value={who} onChange={e => assign(item.key, e.target.value)} className="composer-select" style={{ width: 'auto', minWidth: 150, padding: '6px 10px', fontSize: 12 }}>
                      <option value={UNASSIGNED}>{UNASSIGNED}</option>
                      {TEAM.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {who !== UNASSIGNED && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: accent }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${accent}22`, border: `1px solid ${accent}55`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>{who.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                        assigned
                      </span>
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                      {item.navTo && onNavigate && !isCleared && (
                        <button onClick={() => { onNavigate(item.navTo); onClose(); }} style={{ fontSize: 11, fontWeight: 700, color: accent, background: `${accent}1f`, border: `1px solid ${accent}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{item.actionLabel || 'Open'} →</button>
                      )}
                      {isCleared ? (
                        <button onClick={() => onUnclear(item.key)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Undo</button>
                      ) : (
                        <button onClick={() => onClear(item.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          Done
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Underlying rows */}
                  {item.rows?.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {item.rows.map(r => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                          <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{r.id}</span>
                            <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
                            <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{r.sub}</span>
                          </div>
                          {r.amount > 0 && <span style={{ fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>{fmtM(r.amount)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
