import { AutomationHeader, Card, StatTile, BeforeAfter, fmtRunTime, tileGridStyle } from './automationKit';

const PRE_LIVE_MINUTES = 19; // manual data-entry baseline per invoice (pre-LunarLogic)

const CREATION_STEPS = [
  { title: 'Slack request',      desc: 'PDF upload or a text command' },
  { title: 'AI parses',          desc: 'Claude extracts line items & customer' },
  { title: 'Customer match',     desc: 'Validated against QuickBooks' },
  { title: 'Estimate & milestones', desc: 'Built and matched to the job' },
  { title: 'Approval',           desc: 'Quick confirm in Slack' },
  { title: 'Invoice sent',       desc: 'Created in QuickBooks & emailed' },
];

function CreationSequence({ isMobile }) {
  const n = CREATION_STEPS.length;
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {CREATION_STEPS.map((s, i) => (
          <div key={s.title} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={circleStyle}>{i + 1}</div>
              {i < n - 1 && <div style={{ width: 2, flex: 1, minHeight: 22, background: 'var(--border)' }} />}
            </div>
            <div style={{ paddingBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{s.title}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {CREATION_STEPS.map((s, i) => (
        <div key={s.title} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 4px' }}>
          {i < n - 1 && <div style={{ position: 'absolute', top: 13, left: '50%', width: '100%', height: 2, background: 'var(--border)' }} />}
          <div style={{ ...circleStyle, zIndex: 1 }}>{i + 1}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>{s.title}</div>
          <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.3 }}>{s.desc}</div>
        </div>
      ))}
    </div>
  );
}

const circleStyle = { width: 28, height: 28, borderRadius: '50%', background: 'var(--bg)', border: '1.5px solid var(--teal)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0, position: 'relative' };

export default function ClientInvoiceAI({ data, isMobile, onNavigate }) {
  const stats     = data.automationStats;
  const tracked   = !!stats;
  const connected = data.isLive ? data.automationStatus?.wf1?.connected === true : true;
  const statusColor = connected ? 'var(--green)' : 'var(--muted)';

  const autoInvoices = data.invoices.filter(i => i.origin === 'wf1_auto');

  const lastRun = data.isLive ? data.automationStatus?.wf1?.lastRun : data.wf1LastRun;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AutomationHeader
        title="Invoice AI"
        status={connected ? 'Active' : 'Not connected'}
        statusColor={statusColor}
        blurb="Sales orders and job approvals in Slack become QuickBooks invoices automatically — parsed by AI, matched to the right customer, and sent the same day. No manual data entry, no send lag."
        meta={[
          { label: 'Last run', value: fmtRunTime(lastRun) },
          { label: 'Flow', value: 'Slack → AI parse → QuickBooks → Send' },
        ]}
      />

      <div style={tileGridStyle(isMobile, 3)}>
        <StatTile
          label="Invoices auto-created" color="var(--teal)"
          value={tracked ? stats.invoicesProcessedTotal : '—'}
          sub={tracked ? 'since go-live' : 'not yet tracked'}
          source="Total invoices created via the Slack-to-QuickBooks AI workflow since go-live. Each is a PDF upload or text command processed without manual data entry."
        />
        <StatTile
          label="Avg processing time" color="var(--teal)"
          value={tracked ? `${stats.avgProcessingMinutes} min` : '—'}
          sub={tracked ? `was ${PRE_LIVE_MINUTES} min manual` : 'not yet tracked'}
          source="Average time from Slack upload to invoice sent in QuickBooks. Pre-LunarLogic baseline: 19 min of manual data entry per invoice."
        />
        <StatTile
          label="Send lag eliminated" color="var(--green)"
          value="Same day"
          sub="was 3–8 days manual"
          source="Invoices are issued the same day a job is approved. Before LunarLogic, manual invoicing added 3–8 days of lag before the invoice even reached the customer."
        />
      </div>

      <Card title="How an invoice is created" hint="Every invoice runs this sequence automatically — from a Slack message to a sent QuickBooks invoice, same day.">
        <CreationSequence isMobile={isMobile} />
      </Card>

      {tracked && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <Card title="Processing time per invoice" hint="Time from approval to a sent QuickBooks invoice.">
            <BeforeAfter before={PRE_LIVE_MINUTES} after={stats.avgProcessingMinutes} unit=" min" betterIsLower />
          </Card>
          <Card title="Admin hours per year" hint="Staff time spent on invoice creation and data entry.">
            <BeforeAfter before={stats.adminHoursPerYearBefore} after={stats.adminHoursPerYearAfter} unit=" hrs" betterIsLower />
          </Card>
        </div>
      )}

      <Card title="See it in your ledger">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {autoInvoices.length} invoice{autoInvoices.length !== 1 ? 's' : ''} in your ledger {autoInvoices.length !== 1 ? 'were' : 'was'} created by Invoice AI — look for the <span style={{ fontSize: 8, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8, padding: '1px 5px' }}>AI</span> tag.
          </div>
          <button onClick={() => onNavigate?.('invoices')} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--teal)', background: 'rgba(0,212,232,0.08)', color: 'var(--teal)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            Open Invoices ↗
          </button>
        </div>
      </Card>
    </div>
  );
}
