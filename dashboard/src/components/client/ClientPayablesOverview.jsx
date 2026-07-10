import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, Card, StatTile, BeforeAfter, tileGridStyle, fmtM } from './automationKit';
import DPOProjection from './DPOProjection';

function fmtFull(v) { return `$${Math.round(v).toLocaleString()}`; }
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const BUCKET_COLOR = {
  'Not due': '#22c55e',
  '1–15':    '#00d4e8',
  '16–30':   '#f59e0b',
  '31–45':   '#f97316',
  '45+':     '#ef4444',
};

function AgingTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{p.bucket}</div>
      <div className="tooltip-row"><span>Owed</span><span>{fmtFull(p.amount)}</span></div>
      <div className="tooltip-row"><span>Bills</span><span>{p.count}</span></div>
    </div>
  );
}

/**
 * AP Dashboard — the payables mirror of the AR overview. DPO is the hero
 * metric (shown in the page header ribbon); this tab carries the trend, the
 * payables aging, the upcoming payment calendar preview, and the four-module
 * impact summary.
 */
export default function ClientPayablesOverview({ ap, currentDPO, isMobile, onNavigate }) {
  const inBand = currentDPO >= 26 && currentDPO <= 34;
  const bandLabel = currentDPO < 26 ? 'Paying too early' : currentDPO > 34 ? 'Slipping past terms' : 'On target';
  const bandColor = inBand ? '#22c55e' : currentDPO < 26 ? '#f59e0b' : '#f97316';

  const upcoming = ap.scheduledPayments.slice(0, 5);
  const cashRetained = Math.round((ap.targetDPO - ap.preLiveDPO) * (ap.annualPurchases / 365));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Payables Dashboard"
        subtitle="What you owe, to whom, and when — live. The goal isn’t the lowest DPO; it’s a controlled one, matched to your terms, so cash stays in the business as long as it should."
      />

      {/* Preview banner — AP runs on demo data today */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.22)', borderRadius: 8, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', marginTop: 2 }}>Preview</span>
        <span>The Payables suite is shown here on illustrative data. Bill capture, approvals, and payment scheduling wire to your QuickBooks / Xero AP the same way the Receivables suite already does.</span>
      </div>

      {/* Band status + key tiles */}
      <div style={tileGridStyle(isMobile, 4)}>
        <StatTile label="DPO status" value={bandLabel} color={bandColor} sub={`${Math.round(currentDPO)}d · target ${ap.targetDPO}d`} />
        <StatTile label="Total payables" value={fmtM(ap.totalPayable)} color="var(--text)" sub={`${ap.bills.filter(b => b.status !== 'paid').length} open bills`} source="Sum of all open (unpaid) vendor bills across every aging bucket." />
        <StatTile label="Discounts available" value={fmtM(ap.discountsAvailable)} color="#22c55e" sub="early-pay discounts in window" source="Early-payment discounts (e.g. 2/10 Net 30) still capturable on open bills within their discount window." />
        <StatTile label="Cash retained / yr" value={fmtM(cashRetained)} color="var(--teal)" sub={`${ap.preLiveDPO}d → ${ap.targetDPO}d controlled float`} source="Extra working capital retained by moving from the pre-automation DPO to the controlled target: (target − before) × (annual purchases ÷ 365)." />
      </div>

      {/* DPO trend */}
      <Card title="DPO Trend · 90 Days" hint="Days Payable Outstanding = (Total AP ÷ purchases) × days. The line walks up off an over-eager baseline into the target band after go-live, then holds.">
        <DPOProjection dpoTrend={ap.dpoTrend} goLiveDate={ap.goLiveDate} targetDPO={ap.targetDPO} />
      </Card>

      {/* Aging + upcoming payments */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Card title="Payables Aging" hint="Owed by bucket, relative to each bill’s due date. A healthy book is weighted toward ‘Not due’ — scheduled to pay on time, not early.">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ap.payablesAging} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <XAxis dataKey="bucket" tick={{ fill: '#4e6a88', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4e6a88', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`} />
              <Tooltip content={<AgingTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {ap.payablesAging.map(b => <Cell key={b.key} fill={BUCKET_COLOR[b.bucket] || 'var(--teal)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {ap.payablesAging.map(b => (
              <div key={b.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '5px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 6, flex: 1, minWidth: 60 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: BUCKET_COLOR[b.bucket] }}>{fmtM(b.amount)}</span>
                <span style={{ fontSize: 9, color: 'var(--muted)' }}>{b.bucket} · {b.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Upcoming Payments" hint="Approved and scheduled bills, timed to land on terms." right={<button onClick={() => onNavigate('ap_payments')} style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View schedule →</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {upcoming.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 12 }}>No payments scheduled.</div>}
            {upcoming.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 11px', background: 'var(--bg-row)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.vendor}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.method} · pays {fmtDate(p.scheduledDate)}{p.discountCaptured && <span style={{ color: '#22c55e' }}> · saves {fmtFull(p.discountAmount)}</span>}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmtFull(p.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Four-module impact */}
      <Card title="How the Payables Suite Controls DPO" hint="Four modules move DPO from an erratic, too-fast average into a controlled target — turning cash retained into working capital that simply stays in the account.">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <BeforeAfter before={ap.preLiveDPO} after={ap.targetDPO} unit="d" betterIsLower={false} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
            <ModuleLine label="Bill Capture & Coding" detail="entry lag eliminated — bills visible same day" />
            <ModuleLine label="Approval Workflows" detail="6-day inbox bottleneck → 1 day" />
            <ModuleLine label="Payment Scheduling" detail="hits target DPO on every run" />
            <ModuleLine label="Vendor Management" detail="live visibility + 1099 tracking" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ModuleLine({ label, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 6L9 17l-5-5" /></svg>
      <div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}> — {detail}</span>
      </div>
    </div>
  );
}
