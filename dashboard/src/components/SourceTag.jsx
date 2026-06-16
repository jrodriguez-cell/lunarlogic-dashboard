import { useState, useEffect, useRef } from 'react';

export default function SourceTag({ label }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    }
    function handleScroll() { setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  function toggle(e) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const popW = 220;
      const margin = 12;
      // Prefer opening below; if too close to bottom, open above
      const spaceBelow = window.innerHeight - r.bottom;
      const openBelow = spaceBelow > 120;
      const top = openBelow ? r.bottom + 6 : r.top - 6;
      // Horizontally: center on button, clamp to viewport
      let left = r.left + r.width / 2 - popW / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - popW - margin));
      setCoords({ top, left, openBelow });
    }
    setOpen(v => !v);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 10, padding: '0 2px',
          lineHeight: 1, display: 'inline-flex', alignItems: 'center',
          opacity: 0.7, verticalAlign: 'middle',
        }}
        title="View data source"
        aria-label="View data source"
      >
        ⓘ
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: coords.openBelow ? coords.top : 'auto',
            bottom: coords.openBelow ? 'auto' : window.innerHeight - coords.top,
            left: coords.left,
            width: 220,
            maxWidth: 220,
            boxSizing: 'border-box',
            background: '#1a2235',
            border: '1px solid rgba(0,212,232,0.25)',
            borderRadius: 8,
            padding: '10px 12px',
            zIndex: 99999,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Data Source</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, whiteSpace: 'normal', wordBreak: 'break-word' }}>{label}</div>
        </div>
      )}
    </>
  );
}
