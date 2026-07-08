import SourceTag from '../SourceTag';

// Shared primitives for the per-automation tabs (Invoice AI / Reminders / Cash Application).
// Keeps the three sections visually consistent so they read as one system.

export function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

export function fmtRunTime(iso) {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Big section header for an automation tab: title, live status dot, run cadence, one-line blurb.
export function AutomationHeader({ title, status, statusColor, blurb, meta = [] }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}`, flexShrink: 0 }} />
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: -0.3 }}>{title}</h2>
        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}35`, borderRadius: 20, padding: '2px 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{status}</span>
      </div>
      {blurb && <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5, maxWidth: 640 }}>{blurb}</div>}
      {meta.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
          {meta.map(m => (
            <div key={m.label} style={{ fontSize: 10, color: 'var(--muted)' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{m.label}:</span>{' '}
              <span style={{ color: 'var(--text-dim)' }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Card({ title, hint, right, children, accent }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, borderTop: accent ? `2px solid ${accent}` : undefined }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: hint ? 4 : 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', display: 'flex', alignItems: 'center', gap: 5 }}>
            {title}
          </div>
          {right}
        </div>
      )}
      {hint && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.5 }}>{hint}</div>}
      {children}
    </div>
  );
}

export function StatTile({ label, value, sub, color = 'var(--text)', source }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-dim)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {source && <SourceTag label={source} />}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// Two-bar "before LunarLogic vs with LunarLogic" magnitude comparison.
// betterIsLower flips which side gets the positive (green) treatment.
export function BeforeAfter({ before, after, unit = '', betterIsLower = true, format }) {
  const fmt = format ?? (v => `${v}${unit}`);
  const max = Math.max(before, after) || 1;
  const rows = [
    { key: 'before', label: 'Before LunarLogic', v: before, good: false },
    { key: 'after',  label: 'With LunarLogic',   v: after,  good: true  },
  ];
  const delta = betterIsLower ? before - after : after - before;
  const pctChange = before > 0 ? Math.round((Math.abs(delta) / before) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(r => (
          <div key={r.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 800, color: r.good ? 'var(--green)' : 'var(--text-dim)' }}>{fmt(r.v)}</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max((r.v / max) * 100, 3)}%`, height: '100%', background: r.good ? '#22c55e' : 'var(--border-mid, #3a4a5c)', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
          </div>
        ))}
      </div>
      {delta > 0 && (
        <div style={{ fontSize: 10.5, color: 'var(--green)', fontWeight: 700, marginTop: 8 }}>
          ▼ {pctChange}% {betterIsLower ? 'reduction' : 'improvement'} · {fmt(Math.abs(delta))} {betterIsLower ? 'saved' : 'gained'}
        </div>
      )}
    </div>
  );
}

export function tileGridStyle(isMobile, n = 3) {
  return { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${n}, 1fr)`, gap: 10 };
}
