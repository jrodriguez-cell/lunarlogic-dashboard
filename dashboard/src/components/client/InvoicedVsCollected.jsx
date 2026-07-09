import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const TODAY = new Date('2026-06-11');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ym(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function fmtAxis(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}
function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }

// Invoiced = value of invoices issued that month. Collected = payments applied that month.
// Collection ratio (collected ÷ invoiced) is the trust line — sustained ≥100% means
// the business is collecting faster than it bills.
export default function InvoicedVsCollected({ invoices, payments, isMobile }) {
  const { series, totInvoiced, totCollected } = useMemo(() => {
    const buckets = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
      buckets[ym(d)] = { key: ym(d), label: MONTHS[d.getMonth()], invoiced: 0, collected: 0 };
    }
    (invoices ?? []).forEach(inv => {
      const b = buckets[inv.issued?.slice(0, 7)];
      if (b) b.invoiced += inv.amount;
    });
    (payments ?? []).forEach(p => {
      if (p.status !== 'Auto-Applied' && p.status !== 'Manual') return;
      const when = (p.appliedAt || p.received || '').slice(0, 7);
      const b = buckets[when];
      if (b) b.collected += p.amount;
    });
    const series = Object.values(buckets).map(b => ({ ...b, ratio: b.invoiced > 0 ? Math.round((b.collected / b.invoiced) * 100) : null }));
    return {
      series,
      totInvoiced: series.reduce((s, b) => s + b.invoiced, 0),
      totCollected: series.reduce((s, b) => s + b.collected, 0),
    };
  }, [invoices, payments]);

  const ratio = totInvoiced > 0 ? Math.round((totCollected / totInvoiced) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Legend swatch="#3b4658" label="Invoiced" value={fmtFull(totInvoiced)} sub="6-mo billed" />
          <Legend swatch="#22c55e" label="Collected" value={fmtFull(totCollected)} sub="6-mo applied" />
        </div>
        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: ratio >= 95 ? 'var(--green)' : '#f59e0b', letterSpacing: -1, lineHeight: 1 }}>{ratio}%</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>collected of billed</div>
        </div>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <ComposedChart data={series} margin={{ top: 8, right: 6, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7d8896' }} axisLine={{ stroke: '#1e2733' }} tickLine={false} />
            <YAxis yAxisId="l" tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: '#7d8896' }} axisLine={false} tickLine={false} width={44} />
            <YAxis yAxisId="r" orientation="right" domain={[0, 'dataMax']} hide />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ background: '#141b24', border: '1px solid #263041', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e6edf3', fontWeight: 700 }}
              formatter={(v, name) => name === 'Collection ratio' ? [`${v}%`, name] : [fmtFull(v), name]}
            />
            <Bar yAxisId="l" dataKey="invoiced" name="Invoiced" fill="#3b4658" radius={[3, 3, 0, 0]} maxBarSize={34} isAnimationActive={false} />
            <Bar yAxisId="l" dataKey="collected" name="Collected" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={34} isAnimationActive={false} />
            <Line yAxisId="r" dataKey="ratio" name="Collection ratio" stroke="#00d4e8" strokeWidth={2} dot={{ r: 3, fill: '#00d4e8' }} connectNulls isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ swatch, label, value, sub }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: swatch, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', letterSpacing: -0.5, marginTop: 3 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{sub}</div>
    </div>
  );
}
