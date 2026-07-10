import { useState, useRef, useEffect } from 'react';

/**
 * Suite switcher — the primary control for moving between the Receivables,
 * Payables, and Full Suite workspaces, and the persistent indicator of which
 * one you're currently in.
 *
 * Two variants:
 *   - "sidebar": a full-width workspace-switcher button (code badge + suite
 *     name + one-line context + chevron) that opens a dropdown of all suites.
 *   - "topbar": a compact, accent-tinted pill (code + name + chevron) that
 *     lives in the always-visible header so the current suite is clear on
 *     every tab and on mobile, where there is no sidebar.
 *
 * `items` is [{ id, label, sublabel, code, accent }]; `current` is the active
 * suite id; `onSwitch(id)` changes suite.
 */
export default function SuiteSwitcher({ current, items, onSwitch, variant = 'sidebar', align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = items.find(i => i.id === current) ?? items[0];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  function pick(id) { if (id !== current) onSwitch(id); setOpen(false); }

  const Badge = ({ code, accent, size = 26 }) => (
    <span style={{
      width: size, height: size, borderRadius: 7, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${accent}1f`, border: `1px solid ${accent}59`,
      color: accent, fontSize: size >= 24 ? 10 : 9, fontWeight: 800, letterSpacing: '0.02em',
    }}>{code}</span>
  );

  const Chevron = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M6 9l6 6 6-6" /></svg>
  );

  const Menu = () => (
    <div role="listbox" style={{
      position: 'absolute', zIndex: 1200, top: 'calc(100% + 6px)',
      left: align === 'left' ? 0 : 'auto', right: align === 'right' ? 0 : 'auto',
      minWidth: variant === 'topbar' ? 248 : '100%',
      background: '#101a2c', border: '1px solid var(--border-mid)', borderRadius: 10,
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)', padding: 6,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '5px 8px 6px' }}>Switch suite</div>
      {items.map(it => {
        const isActive = it.id === current;
        return (
          <button key={it.id} role="option" aria-selected={isActive} onClick={() => pick(it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
            padding: '8px 8px', borderRadius: 8, cursor: 'pointer', border: 'none',
            background: isActive ? `${it.accent}14` : 'transparent',
          }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
            <Badge code={it.code} accent={it.accent} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isActive ? it.accent : 'var(--text)' }}>{it.label}</span>
              <span style={{ display: 'block', fontSize: 10.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sublabel}</span>
            </span>
            {isActive && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={it.accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Topbar pill variant ─────────────────────────────────────────────
  if (variant === 'topbar') {
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} title="Switch suite" aria-haspopup="listbox" aria-expanded={open} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px 5px 6px', borderRadius: 20, cursor: 'pointer',
          background: `${active.accent}14`, border: `1px solid ${active.accent}45`, color: active.accent,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: active.accent, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{active.label}</span>
          <Chevron />
        </button>
        {open && <Menu />}
      </div>
    );
  }

  // ── Sidebar workspace-switcher variant ──────────────────────────────
  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open} style={{
        display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
        padding: '8px 9px', borderRadius: 9, cursor: 'pointer',
        background: open ? 'var(--bg-hover)' : `${active.accent}12`,
        border: `1px solid ${open ? 'var(--border-mid)' : `${active.accent}3d`}`,
        transition: 'background .12s, border-color .12s',
      }}>
        <Badge code={active.code} accent={active.accent} size={28} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suite</span>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: active.accent, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.label}</span>
        </span>
        <span style={{ color: 'var(--muted)' }}><Chevron /></span>
      </button>
      {open && <Menu />}
    </div>
  );
}
