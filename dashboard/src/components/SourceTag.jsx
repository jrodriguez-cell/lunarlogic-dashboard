import { useState, useEffect, useRef } from 'react';

export default function SourceTag({ label, pos = 'above' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const popoverStyle = pos === 'below'
    ? { top: '100%', left: 'auto', right: 0, bottom: 'auto', transform: 'none', marginTop: 6, marginBottom: 0 }
    : { bottom: '100%', left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)', marginBottom: 6, marginTop: 0 };

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 10, padding: '0 2px',
          lineHeight: 1, display: 'inline-flex', alignItems: 'center',
          opacity: 0.7,
        }}
        title="View data source"
        aria-label="View data source"
      >
        ⓘ
      </button>
      {open && (
        <div style={{
          position: 'absolute', width: 240, background: '#1a2235',
          border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px',
          zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          ...popoverStyle,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Data Source</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>{label}</div>
        </div>
      )}
    </span>
  );
}
