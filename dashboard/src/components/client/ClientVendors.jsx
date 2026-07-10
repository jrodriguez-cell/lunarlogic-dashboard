import { useState, useMemo } from 'react';
import { useToast } from '../../lib/toast';
import { PageHeader, Card, StatTile, tileGridStyle, fmtM } from './automationKit';

function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }

/**
 * Vendor Management & AP Dashboard — every vendor obligation on one screen:
 * payables by vendor, terms, average days-to-pay, and W-9 / 1099 status tracked
 * continuously instead of reconstructed in a January scramble.
 */
export default function ClientVendors({ ap, isMobile }) {
  const toast = useToast();
  const [sort, setSort] = useState('openAmount');

  const vendors = useMemo(() => {
    const v = [...ap.vendors];
    v.sort((a, b) => (sort === 'name' ? a.vendor.localeCompare(b.vendor) : b[sort] - a[sort]));
    return v;
  }, [ap.vendors, sort]);

  const totalOpen = ap.vendors.reduce((s, v) => s + v.openAmount, 0);
  const needs1099 = ap.vendors.filter(v => v.needs1099);
  const ready1099 = needs1099.filter(v => v.form1099Ready).length;
  const missingW9 = ap.vendors.filter(v => v.needs1099 && !v.form1099Ready);

  const cols = [
    { id: 'openAmount', label: 'Open balance' },
    { id: 'avgPayDays', label: 'Avg days to pay' },
    { id: 'ytdPaid',    label: 'YTD paid' },
    { id: 'name',       label: 'Name' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Vendors"
        subtitle="What you owe, to whom, and on what terms — plus W-9 and 1099 status tracked all year, so tax season is a running total instead of a scramble."
        right={<button onClick={() => toast('New vendor (demo) — captures W-9 and default terms')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.12)', border: '1px solid var(--teal)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>+ Add vendor</button>}
      />

      <div style={tileGridStyle(isMobile, 4)}>
        <StatTile label="Active vendors" value={String(ap.vendors.length)} color="var(--text)" sub="with open or YTD activity" />
        <StatTile label="Total owed" value={fmtM(totalOpen)} color="var(--text)" sub="across all vendors" />
        <StatTile label="1099 ready" value={`${ready1099}/${needs1099.length}`} color={missingW9.length ? '#f59e0b' : '#22c55e'} sub="reportable vendors with W-9 on file" source="Vendors that will need a 1099-NEC/MISC (services/contractors paid > $600) and already have a W-9 on file — ready to file without a scramble." />
        <StatTile label="Discount vendors" value={String(ap.vendors.filter(v => v.discountTerms).length)} color="#22c55e" sub="offer early-pay terms" />
      </div>

      {missingW9.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: 8, fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', marginTop: 2 }}>Action</span>
          <span><strong>{missingW9.length} reportable vendor{missingW9.length > 1 ? 's' : ''}</strong> ({missingW9.map(v => v.vendor).join(', ')}) {missingW9.length > 1 ? 'are' : 'is'} missing a W-9. Request now to stay 1099-ready.
            <button onClick={() => toast(`W-9 request sent to ${missingW9.map(v => v.vendor).join(', ')} (demo)`)} style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'none', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Request W-9</button>
          </span>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sort by</span>
          {cols.map(c => (
            <button key={c.id} onClick={() => setSort(c.id)} style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${sort === c.id ? 'var(--teal)' : 'var(--border)'}`,
              background: sort === c.id ? 'rgba(0,212,232,0.1)' : 'none', color: sort === c.id ? 'var(--teal)' : 'var(--muted)',
            }}>{c.label}</button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="rmt-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Terms</th>
                <th style={{ textAlign: 'right' }}>Open balance</th>
                <th style={{ textAlign: 'right' }}>Past due</th>
                <th style={{ textAlign: 'right' }}>Avg days</th>
                <th style={{ textAlign: 'right' }}>YTD paid</th>
                <th style={{ textAlign: 'center' }}>W-9 / 1099</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.vendor}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v.vendor}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{v.gl}{v.discountTerms && <span style={{ color: '#22c55e' }}> · {v.discountTerms}</span>}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{v.terms}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{v.openAmount ? fmtFull(v.openAmount) : '—'}</td>
                  <td style={{ textAlign: 'right', color: v.pastDue ? '#ef4444' : 'var(--muted)', fontWeight: v.pastDue ? 700 : 400 }}>{v.pastDue ? fmtFull(v.pastDue) : '—'}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>{v.avgPayDays}d</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>{fmtFull(v.ytdPaid)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {!v.needs1099
                      ? <span style={{ fontSize: 10, color: 'var(--muted)' }}>n/a</span>
                      : v.form1099Ready
                        ? <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '2px 8px' }}>1099 ready</span>
                        : <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: 10, padding: '2px 8px' }}>W-9 needed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
