import { useState, useMemo } from 'react';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const STATUS_CONFIG = {
  Paid:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  Sent:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  Viewed:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
};
const STATUS_FILTERS = ['All', 'Overdue', 'Sent', 'Viewed', 'Paid'];
const AGING_FILTERS = [
  { id: 'all',     label: 'Any age' },
  { id: 'current', label: 'Current', test: d => d <= 0 },
  { id: '1-30',    label: '1–30d',   test: d => d >= 1 && d <= 30 },
  { id: '31-60',   label: '31–60d',  test: d => d >= 31 && d <= 60 },
  { id: '61-90',   label: '61–90d',  test: d => d >= 61 && d <= 90 },
  { id: '90+',     label: '90+d',    test: d => d > 90 },
];

const COLUMNS = [
  { key: 'id',          label: 'Invoice',      sort: (a, b) => a.id.localeCompare(b.id) },
  { key: 'customer',    label: 'Customer',     sort: (a, b) => a.customer.localeCompare(b.customer) },
  { key: 'amount',      label: 'Amount',       align: 'right', sort: (a, b) => a.amount - b.amount },
  { key: 'issued',      label: 'Issued',       sort: (a, b) => a.issued.localeCompare(b.issued) },
  { key: 'due',         label: 'Due',          sort: (a, b) => a.due.localeCompare(b.due) },
  { key: 'status',      label: 'Status',       sort: (a, b) => a.status.localeCompare(b.status) },
  { key: 'daysOverdue', label: 'Overdue',      align: 'right', sort: (a, b) => a.daysOverdue - b.daysOverdue },
];

const EXPORT_COLS = [
  { key: 'id', label: 'Invoice' }, { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
  { key: 'issued', label: 'Issued' }, { key: 'due', label: 'Due Date' }, { key: 'status', label: 'Status' },
  { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—', csvVal: r => r.daysOverdue > 0 ? r.daysOverdue : '' },
];

export default function ClientInvoices({ invoices, paymentBehavior, isMobile, onDrill, onAction }) {
  const [query, setQuery]     = useState('');
  const [status, setStatus]   = useState('All');
  const [aging, setAging]     = useState('all');
  const [sortKey, setSortKey] = useState('daysOverdue');
  const [sortDir, setSortDir] = useState('desc');

  const pbMap = useMemo(() => Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p])), [paymentBehavior]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const agingDef = AGING_FILTERS.find(a => a.id === aging);
    const col = COLUMNS.find(c => c.key === sortKey);
    const filtered = invoices.filter(inv => {
      if (status !== 'All' && inv.status !== status) return false;
      if (agingDef?.test && !agingDef.test(inv.daysOverdue)) return false;
      if (q && !inv.id.toLowerCase().includes(q) && !inv.customer.toLowerCase().includes(q)) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const r = col ? col.sort(a, b) : 0;
      return sortDir === 'asc' ? r : -r;
    });
    return filtered;
  }, [invoices, query, status, aging, sortKey, sortDir]);

  const totalAmt = results.reduce((s, i) => s + i.amount, 0);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'amount' || key === 'daysOverdue' ? 'desc' : 'asc'); }
  }

  function exportCurrent() {
    onDrill({
      title: 'Invoice Search Results',
      subtitle: `${results.length} invoice${results.length !== 1 ? 's' : ''} · ${fmtM(totalAmt)}${query ? ` · “${query}”` : ''}`,
      source: 'Invoice data from QuickBooks Online, filtered to your current search.',
      filename: 'invoice_search', columns: EXPORT_COLS, rows: results,
    });
  }

  const inputStyle = {
    flex: 1, minWidth: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 12px 8px 32px', fontSize: 13, color: 'var(--text)', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search + controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180, display: 'flex' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--muted)" strokeWidth="1.6" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4.5" /><path d="M13 13l-3.2-3.2" strokeLinecap="round" />
          </svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search invoice # or customer…" style={inputStyle} />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
          )}
        </div>
        <select value={aging} onChange={e => setAging(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer' }}>
          {AGING_FILTERS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <button onClick={exportCurrent} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' }}>Export ↗</button>
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => {
          const count  = f === 'All' ? invoices.length : invoices.filter(i => i.status === f).length;
          const cfg    = STATUS_CONFIG[f] ?? { color: 'var(--teal)', bg: 'rgba(0,212,232,0.1)' };
          const active = status === f;
          return (
            <button key={f} onClick={() => setStatus(f)} style={{
              padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${active ? cfg.color : 'var(--border)'}`,
              background: active ? cfg.bg : 'none', color: active ? cfg.color : 'var(--muted)',
            }}>{f}{count > 0 ? ` (${count})` : ''}</button>
          );
        })}
      </div>

      {/* Result summary */}
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
        {results.length} result{results.length !== 1 ? 's' : ''} · <span style={{ color: 'var(--text-dim)', fontWeight: 700 }}>{fmtM(totalAmt)}</span> total
      </div>

      {/* Sortable table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              {COLUMNS.map(c => {
                if (isMobile && (c.key === 'issued' || c.key === 'due')) return null;
                const active = sortKey === c.key;
                return (
                  <th key={c.key} onClick={() => toggleSort(c.key)} style={{
                    textAlign: c.align ?? 'left', padding: '9px 12px', fontSize: 9.5, fontWeight: 700,
                    color: active ? 'var(--teal)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', borderBottom: '1px solid var(--border)',
                  }}>
                    {c.label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {results.map(inv => {
              const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.Sent;
              return (
                <tr key={inv.id} onClick={() => onAction(inv)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {inv.origin === 'wf1_auto' && <span style={{ fontSize: 8, fontWeight: 800, color: '#a78bfa', marginRight: 5 }}>AI</span>}
                    {inv.id}
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtM(inv.amount)}</td>
                  {!isMobile && <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{inv.issued}</td>}
                  {!isMobile && <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{inv.due}</td>}
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inv.status}</span>
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 11, fontWeight: 600, color: inv.daysOverdue > 0 ? cfg.color : 'var(--muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>{inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No invoices match {query ? `“${query}”` : 'these filters'}.
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)' }}>
        Click a column header to sort · click any row to open the invoice and take action · Export downloads the current results as CSV or Excel.
      </div>
    </div>
  );
}
