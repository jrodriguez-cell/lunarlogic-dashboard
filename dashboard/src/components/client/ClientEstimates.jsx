import { useState } from 'react';
import { useToast } from '../../lib/toast';
import { Card, StatTile, fmtM, tileGridStyle } from './automationKit';

const TODAY = new Date('2026-06-11');

function daysUntil(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - TODAY) / 86400000);
}

const STATUS_CONFIG = {
  'Pending Approval': { color: '#f59e0b' },
  'Approved':          { color: 'var(--teal)' },
  'Converted':         { color: '#22c55e' },
  'Expired':           { color: 'var(--muted)' },
  'Declined':          { color: '#ef4444' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { color: 'var(--muted)' };
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

export default function ClientEstimates({ data, isMobile, onDrill }) {
  const toast = useToast();
  const estimates = data.estimates ?? [];
  const [overrides, setOverrides] = useState({}); // id -> { status, convertedInvoice }
  const [filter, setFilter] = useState('needsAction');

  const merged = estimates.map(e => overrides[e.id] ? { ...e, ...overrides[e.id] } : e);

  const pending  = merged.filter(e => e.status === 'Pending Approval');
  const approved = merged.filter(e => e.status === 'Approved');
  const converted = merged.filter(e => e.status === 'Converted');
  const expiring = merged.filter(e => (e.status === 'Pending Approval' || e.status === 'Approved') && daysUntil(e.expires) <= 3 && daysUntil(e.expires) >= 0);

  const pendingAmt  = pending.reduce((s, e) => s + e.amount, 0);
  const approvedAmt = approved.reduce((s, e) => s + e.amount, 0);

  const needsAction = merged.filter(e => e.status === 'Pending Approval' || e.status === 'Approved');
  const visible = filter === 'needsAction' ? needsAction : merged;

  function approve(e) {
    setOverrides(o => ({ ...o, [e.id]: { status: 'Approved' } }));
    toast(`${e.id} approved for ${e.customer}`);
  }

  function convert(e) {
    const invId = `INV-${9000 + Math.floor(Math.random() * 999)}`;
    setOverrides(o => ({ ...o, [e.id]: { status: 'Converted', convertedInvoice: invId } }));
    toast(`${e.id} converted to invoice ${invId}`);
  }

  function decline(e) {
    setOverrides(o => ({ ...o, [e.id]: { status: 'Declined' } }));
    toast(`${e.id} declined`);
  }

  const EST_COLS = [
    { key: 'id', label: 'Estimate' },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
    { key: 'issued', label: 'Issued' },
    { key: 'expires', label: 'Expires' },
    { key: 'status', label: 'Status' },
  ];

  if (estimates.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
            Sales Order Processing isn't connected for this client yet — there are no estimates to show. Once quotes start flowing through LunarLogic, pending approvals and conversions will appear here.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div style={tileGridStyle(isMobile, 3)}>
        <StatTile label="Awaiting your approval" color={pending.length > 0 ? '#f59e0b' : 'var(--green)'}
          value={pending.length} sub={pending.length > 0 ? `${fmtM(pendingAmt)} pending` : 'all clear'} />
        <StatTile label="Approved — ready to convert" color={approved.length > 0 ? 'var(--teal)' : 'var(--green)'}
          value={approved.length} sub={approved.length > 0 ? `${fmtM(approvedAmt)} ready to invoice` : 'none waiting'} />
        <StatTile label="Converted this period" color="var(--green)"
          value={converted.length} sub="became invoices" />
      </div>

      {expiring.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>Expiring soon</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {expiring.length} estimate{expiring.length !== 1 ? 's' : ''} expire{expiring.length === 1 ? 's' : ''} within 3 days — act now or the customer will need a new quote.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        {[{ id: 'needsAction', label: 'Needs action' }, { id: 'all', label: 'All estimates' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${filter === f.id ? 'var(--teal)' : 'var(--border)'}`,
            background: filter === f.id ? 'rgba(0,212,232,0.08)' : 'none',
            color: filter === f.id ? 'var(--teal)' : 'var(--muted)',
          }}>{f.label}</button>
        ))}
        <button onClick={() => onDrill({ title: 'All Estimates', subtitle: `${merged.length} estimates`, source: 'Estimates created via the Sales Order Processing workflow (PDF quote -> AI extraction -> QuickBooks estimate).', filename: 'estimates_export', columns: EST_COLS, rows: merged })}
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' }}>
          Export all
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>Nothing needs action — you're caught up.</div>
        )}
        {visible.map(e => {
          const dLeft = daysUntil(e.expires);
          const cfg = STATUS_CONFIG[e.status] ?? { color: 'var(--muted)' };
          return (
            <div key={e.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${cfg.color}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: (e.status === 'Pending Approval' || e.status === 'Approved') ? 10 : 0 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    {!isMobile && <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--muted)' }}>{e.id}</span>}
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{e.customer}</span>
                    <StatusBadge status={e.status} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {e.lineItems} line item{e.lineItems !== 1 ? 's' : ''} · issued {e.issued}
                    {(e.status === 'Pending Approval' || e.status === 'Approved') && (
                      dLeft >= 0
                        ? <span style={{ color: dLeft <= 3 ? '#f59e0b' : 'var(--muted)' }}> · expires in {dLeft}d</span>
                        : <span style={{ color: '#ef4444' }}> · expired</span>
                    )}
                    {e.status === 'Converted' && e.convertedInvoice && <span style={{ color: 'var(--green)' }}> · → {e.convertedInvoice}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', flexShrink: 0 }}>{fmtM(e.amount)}</span>
              </div>
              {e.status === 'Pending Approval' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => approve(e)} style={primaryBtn}>Approve</button>
                  <button onClick={() => convert(e)} style={secondaryBtn}>Approve &amp; convert to invoice</button>
                  <button onClick={() => decline(e)} style={dangerBtn}>Decline</button>
                </div>
              )}
              {e.status === 'Approved' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => convert(e)} style={primaryBtn}>Convert to invoice</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        Estimates are created automatically from PDF quotes via Sales Order Processing. Approve to lock pricing, then convert to a QuickBooks invoice in one click.
      </div>
    </div>
  );
}

const primaryBtn   = { padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', border: '1px solid #22c55e', background: 'rgba(34,197,94,0.12)', color: '#22c55e' };
const secondaryBtn = { padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--teal)', background: 'rgba(0,212,232,0.08)', color: 'var(--teal)' };
const dangerBtn    = { padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' };
