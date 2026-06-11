import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { exportXLSX } from '../lib/excel';

const ALL_BUCKETS = [
  { label: '50–59%', min: 50, max: 59 },
  { label: '60–69%', min: 60, max: 69 },
  { label: '70–79%', min: 70, max: 79 },
  { label: '80–89%', min: 80, max: 89 },
  { label: '90–94%', min: 90, max: 94 },
  { label: '95–99%', min: 95, max: 99 },
  { label: '100%',   min: 100, max: 100 },
];

const RANGES = [
  { label: '7d',  days: 7 },
  { label: '14d', days: 14 },
  { label: 'All', days: null },
];

const DRILL_COLS = [
  { key: 'txId',            label: 'Txn ID' },
  { key: 'amount',          label: 'Amount',      render: v => `$${v.toLocaleString()}` },
  { key: 'received',        label: 'Date' },
  { key: 'matchedCustomer', label: 'Customer' },
  { key: 'matchedInvoice',  label: 'Invoice',     render: v => v || '—' },
  { key: 'confidence',      label: 'Confidence',  render: v => `${v}%` },
  { key: 'status',          label: 'Status' },
  { key: 'rule',            label: 'Match Rule' },
];

function bucketColor(label) {
  const min = parseInt(label);
  if (min >= 90) return '#22c55e';
  if (min >= 70) return '#f59e0b';
  return '#ef4444';
}

function filterByRange(payments, days) {
  if (!days) return payments;
  const dates = payments.map(p => new Date(p.received + 'T00:00:00')).filter(d => !isNaN(d));
  if (!dates.length) return payments;
  const latest = new Date(Math.max(...dates));
  const cutoff  = new Date(latest);
  cutoff.setDate(cutoff.getDate() - days);
  return payments.filter(p => new Date(p.received + 'T00:00:00') >= cutoff);
}

function buildBuckets(payments) {
  return ALL_BUCKETS.map(b => ({
    ...b,
    count: payments.filter(p => p.confidence >= b.min && p.confidence <= b.max).length,
  })).filter(b => b.count > 0 || b.min >= 90);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const isAuto = parseInt(label) >= 90;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{label} confidence</div>
      <div className="tooltip-row">
        <span>Transactions</span>
        <span style={{ color: isAuto ? 'var(--green)' : 'var(--yellow)' }}>{payload[0].value}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
        {isAuto ? '✓ Auto-applied' : '⚠ Needs review'}  ·  click to drill down
      </div>
    </div>
  );
}

export default function MatchConfidenceChart({ payments, onDrill }) {
  const [rangeDays, setRangeDays] = useState(null);

  const filtered   = filterByRange(payments, rangeDays);
  const data       = buildBuckets(filtered);
  const autoCount  = filtered.filter(p => p.confidence >= 90).length;
  const autoRate   = filtered.length > 0 ? Math.round((autoCount / filtered.length) * 100) : 0;

  function handleBarClick({ activePayload }) {
    if (!activePayload?.length) return;
    const bucket = activePayload[0].payload;
    const rows = filtered.filter(p => p.confidence >= bucket.min && p.confidence <= bucket.max);
    onDrill?.({
      title: `Confidence Band — ${bucket.label}`,
      subtitle: `${rows.length} transaction${rows.length !== 1 ? 's' : ''}`,
      source: 'Confidence score combines: exact amount match, fuzzy name match (Levenshtein), payment history, and bank description normalization. ≥90% = auto-applied, <90% = manual review queue.',
      filename: `confidence_${bucket.label.replace(/[^a-z0-9]/gi, '_')}`,
      columns: DRILL_COLS,
      rows,
    });
  }

  function handleExport() {
    exportXLSX(
      `confidence_distribution_${rangeDays ? rangeDays + 'd' : 'all'}`,
      'Confidence Distribution',
      DRILL_COLS,
      filtered,
      { Report: 'Confidence Distribution', Period: rangeDays ? `Last ${rangeDays} days` : 'All time' }
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Confidence Distribution</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{autoRate}% above threshold</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {RANGES.map(r => (
              <button
                key={r.label}
                onClick={() => setRangeDays(r.days)}
                style={{
                  padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${rangeDays === r.days ? 'var(--teal)' : 'var(--border)'}`,
                  background: rangeDays === r.days ? 'rgba(0,212,232,0.1)' : 'none',
                  color: rangeDays === r.days ? 'var(--teal)' : 'var(--muted)',
                }}
              >{r.label}</button>
            ))}
          </div>
          <button className="card-export-btn" onClick={handleExport}>
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/><path d="M1 9.5h9"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <ResponsiveContainer width="99%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          >
            <XAxis dataKey="label" tick={{ fill: '#5a7a9e', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5a7a9e', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <ReferenceLine x="90–94%" stroke="rgba(34,197,94,0.4)" strokeDasharray="4 3" strokeWidth={1.5} />
            <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={52}>
              {data.map((d, i) => (
                <Cell key={i} fill={bucketColor(d.label)} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        {[
          { color: 'var(--green)',  label: '≥90% auto-applied' },
          { color: 'var(--yellow)', label: '70–89% manual review' },
          { color: 'var(--red)',    label: '<70% low confidence' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
