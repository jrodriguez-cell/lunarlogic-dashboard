import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

function buildBuckets(payments) {
  const buckets = [
    { label: '50–59%', min: 50, max: 59, count: 0 },
    { label: '60–69%', min: 60, max: 69, count: 0 },
    { label: '70–79%', min: 70, max: 79, count: 0 },
    { label: '80–89%', min: 80, max: 89, count: 0 },
    { label: '90–94%', min: 90, max: 94, count: 0 },
    { label: '95–99%', min: 95, max: 99, count: 0 },
    { label: '100%',   min: 100, max: 100, count: 0 },
  ];
  payments.forEach(p => {
    const b = buckets.find(b => p.confidence >= b.min && p.confidence <= b.max);
    if (b) b.count++;
  });
  return buckets.filter(b => b.count > 0 || b.min >= 90);
}

function bucketColor(label) {
  const min = parseInt(label);
  if (min >= 90) return '#22c55e';
  if (min >= 70) return '#f59e0b';
  return '#ef4444';
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
        {isAuto ? '✓ Auto-applied' : '⚠ Needs review'}
      </div>
    </div>
  );
}

export default function MatchConfidenceChart({ payments, onDrill }) {
  const data     = buildBuckets(payments);
  const autoCount = payments.filter(p => p.confidence >= 90).length;
  const autoRate  = Math.round((autoCount / payments.length) * 100);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Confidence Distribution</h2>
        <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
          {autoRate}% above threshold
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          onClick={({ activePayload }) => {
            if (!activePayload?.length) return;
            const bucket = activePayload[0].payload;
            const filtered = payments.filter(p => p.confidence >= bucket.min && p.confidence <= bucket.max);
            onDrill?.({
              title: `Confidence Band — ${bucket.label}`,
              subtitle: `${filtered.length} transactions`,
              source: 'Confidence score combines: exact amount match, fuzzy name match (Levenshtein), payment history, and bank description normalization. ≥90% = auto-applied, <90% = manual review queue.',
              filename: `confidence_${bucket.label.replace(/[^a-z0-9]/gi,'_')}.csv`,
              columns: [
                { key: 'txId',            label: 'Txn ID' },
                { key: 'amount',          label: 'Amount',      render: v => `$${v.toLocaleString()}` },
                { key: 'received',        label: 'Received' },
                { key: 'matchedCustomer', label: 'Customer' },
                { key: 'matchedInvoice',  label: 'Invoice',     render: v => v || '—' },
                { key: 'confidence',      label: 'Confidence',  render: v => `${v}%` },
                { key: 'status',          label: 'Status' },
                { key: 'rule',            label: 'Match Rule' },
              ],
              rows: filtered,
            });
          }}
          style={{ cursor: 'pointer' }}
        >
          <XAxis dataKey="label" tick={{ fill: '#5a7a9e', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#5a7a9e', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <ReferenceLine x="90–94%" stroke="rgba(34,197,94,0.4)" strokeDasharray="4 3" strokeWidth={1.5} />
          <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={48}>
            {data.map((d, i) => (
              <Cell key={i} fill={bucketColor(d.label)} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)' }} />
          ≥90% auto-applied
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--yellow)' }} />
          70–89% manual review
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)' }} />
          &lt;70% low confidence
        </div>
      </div>
    </div>
  );
}
