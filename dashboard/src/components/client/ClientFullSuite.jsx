import { PageHeader, Card, StatTile, tileGridStyle, fmtM } from './automationKit';
import SourceTag from '../SourceTag';

/**
 * Full Suite — both sides of the ledger on one screen. AR accelerates cash in,
 * AP controls cash out, and the two compound into a single number: the Cash
 * Conversion Cycle (CCC = DSO − DPO), how many days the business's cash is
 * actually tied up.
 */
export default function ClientFullSuite({ data, ap, currentDSO, currentDPO, isMobile, onNavigate }) {
  const dso = Math.round(currentDSO);
  const dpo = Math.round(currentDPO);
  const ccc = dso - dpo;

  const beforeDSO = data.preLiveDSO ?? 50;
  const beforeDPO = ap.preLiveDPO;
  const beforeCCC = beforeDSO - beforeDPO;
  const cccImprove = beforeCCC - ccc;

  const dailyRev = data.annualRevenue / 365;
  // Cash freed by compressing the conversion cycle.
  const cashFreed = Math.round(Math.max(cccImprove, 0) * dailyRev);

  const totalAR = data.invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
  const totalAP = ap.totalPayable;
  const netPosition = totalAR - totalAP;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Full Suite · Both Sides of the Ledger"
        subtitle="Accelerating what you're owed and controlling what you owe compound into one number: how many days your cash is actually tied up. AR in, AP out, one system."
      />

      {/* Cash Conversion Cycle hero */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? '18px 16px' : '24px 28px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
          Cash Conversion Cycle
          <SourceTag label="Cash Conversion Cycle (simplified) = DSO − DPO. The net number of days cash is tied up: how long after paying suppliers you wait to collect from customers. Lower is better; near zero means AR and AP are balanced." />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 22, flexWrap: 'wrap' }}>
          {/* DSO */}
          <CycleTerm label="DSO" sublabel="cash in" value={dso} color="var(--teal)" onClick={() => onNavigate('ar')} />
          <Operator symbol="−" />
          {/* DPO */}
          <CycleTerm label="DPO" sublabel="cash out" value={dpo} color="#818CF8" onClick={() => onNavigate('ap')} />
          <Operator symbol="=" />
          {/* CCC */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: isMobile ? 44 : 56, fontWeight: 900, color: ccc <= 10 ? '#22c55e' : ccc <= 25 ? '#f59e0b' : '#ef4444', lineHeight: 1, letterSpacing: -3 }}>{ccc}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>days tied up</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>Was {beforeCCC}d</span>
              {cccImprove > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)' }}>↓ {cccImprove}d = {fmtM(cashFreed)} freed</span>
              )}
            </div>
          </div>
        </div>

        {/* Compression bar */}
        <div style={{ marginTop: 20 }}>
          <CompressionRow label="Before LunarLogic" dso={beforeDSO} dpo={beforeDPO} muted />
          <CompressionRow label="With LunarLogic" dso={dso} dpo={dpo} />
        </div>
      </div>

      {/* Combined value tiles */}
      <div style={tileGridStyle(isMobile, 4)}>
        <StatTile label="Open receivables" value={fmtM(totalAR)} color="var(--teal)" sub="cash coming in" />
        <StatTile label="Open payables" value={fmtM(totalAP)} color="#818CF8" sub="cash going out" />
        <StatTile label="Net AR − AP" value={fmtM(netPosition)} color={netPosition >= 0 ? '#22c55e' : '#ef4444'} sub={netPosition >= 0 ? 'more owed to you than you owe' : 'you owe more than is owed to you'} source="Open receivables minus open payables — a live snapshot of net working-capital position across both ledgers." />
        <StatTile label="Cash freed" value={fmtM(cashFreed)} color="#22c55e" sub={`${cccImprove}-day cycle compression`} source="Working capital released by compressing the cash conversion cycle: (before CCC − current CCC) × (annual revenue ÷ 365)." />
      </div>

      {/* Two sides */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <SideCard
          accent="var(--teal)"
          title="Receivables (AR)"
          metric={`${dso}d DSO`}
          points={[
            'Invoices sent in ~90 seconds from Slack',
            'Five-tier reminders chase every open invoice',
            'Payments auto-matched and applied',
          ]}
          cta="Open Receivables →"
          onClick={() => onNavigate('ar')}
        />
        <SideCard
          accent="#818CF8"
          title="Payables (AP)"
          metric={`${dpo}d DPO`}
          points={[
            'Bills captured and GL-coded the day they arrive',
            'Approvals routed and escalated automatically',
            'Payments timed to terms, discounts captured',
          ]}
          cta="Open Payables →"
          onClick={() => onNavigate('ap')}
        />
      </div>

      <Card title="Why One System, Not Two Tools" hint="Point solutions split the problem: AP-only platforms can't see receivables, AR-only platforms can't see payables. Run together, the two sides reinforce each other.">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          <Insight title="One number to manage" body="Ownership gets a single cash-conversion-cycle number trending down, with the levers on both sides on one screen — not a DSO conversation and a separate DPO conversation." />
          <Insight title="Each side informs the other" body="Vendor payment history sharpens cash forecasting; customer collection patterns inform how aggressively you can extend your own terms." />
          <Insight title="Books a lender can trust" body="Fast, consistent collections and an accurate, controlled payables schedule present cleaner financials for a line of credit, equipment financing, or diligence." />
        </div>
      </Card>
    </div>
  );
}

function CycleTerm({ label, sublabel, value, color, onClick }) {
  return (
    <button onClick={onClick} title={`Go to ${label === 'DSO' ? 'Receivables' : 'Payables'}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1, letterSpacing: -2 }}>{value}</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>d</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {sublabel}</span></div>
    </button>
  );
}

function Operator({ symbol }) {
  return <span style={{ fontSize: 28, fontWeight: 300, color: 'var(--muted)', lineHeight: 1 }}>{symbol}</span>;
}

function CompressionRow({ label, dso, dpo, muted }) {
  const scale = 1.6; // px per day
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, color: muted ? 'var(--muted)' : 'var(--text-dim)', fontWeight: muted ? 400 : 600, minWidth: 128 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 200 }}>
        <div style={{ height: 14, width: dso * scale, background: muted ? 'rgba(96,165,250,0.25)' : 'var(--teal)', borderRadius: '3px 0 0 3px' }} title={`DSO ${dso}d`} />
        <div style={{ height: 14, width: dpo * scale, background: muted ? 'rgba(129,140,248,0.25)' : '#818CF8', borderRadius: '0 3px 3px 0', opacity: 0.9 }} title={`DPO ${dpo}d (offsets)`} />
        <span style={{ fontSize: 11, fontWeight: 700, color: muted ? 'var(--muted)' : (dso - dpo <= 10 ? '#22c55e' : 'var(--text)'), marginLeft: 10, whiteSpace: 'nowrap' }}>{dso - dpo} days tied up</span>
      </div>
    </div>
  );
}

function SideCard({ accent, title, metric, points, cta, onClick }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `2px solid ${accent}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{title}</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: accent, letterSpacing: -0.5 }}>{metric}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {points.map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 6L9 17l-5-5" /></svg>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{p}</span>
          </div>
        ))}
      </div>
      <button onClick={onClick} style={{ marginTop: 2, alignSelf: 'flex-start', fontSize: 12, fontWeight: 700, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{cta}</button>
    </div>
  );
}

function Insight({ title, body }) {
  return (
    <div style={{ background: 'var(--bg-row)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
