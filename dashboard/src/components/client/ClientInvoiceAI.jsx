import { AutomationHeader, Card, StatTile, BeforeAfter, fmtM, fmtRunTime, tileGridStyle } from './automationKit';

const PRE_LIVE_MINUTES = 19; // manual data-entry baseline per invoice (pre-LunarLogic)

export default function ClientInvoiceAI({ data, isMobile, onDrill }) {
  const stats     = data.automationStats;
  const tracked   = !!stats;
  const connected = data.isLive ? data.automationStatus?.wf1?.connected === true : true;
  const statusColor = connected ? 'var(--green)' : 'var(--muted)';

  const autoInvoices = data.invoices
    .filter(i => i.origin === 'wf1_auto')
    .slice()
    .sort((a, b) => new Date(b.issued) - new Date(a.issued));
  const recent = autoInvoices.slice(0, 8);

  const lastRun = data.isLive ? data.automationStatus?.wf1?.lastRun : data.wf1LastRun;

  const INV_COLS = [
    { key: 'id', label: 'Invoice' },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
    { key: 'issued', label: 'Issued' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AutomationHeader
        title="Invoice AI"
        status={connected ? 'Operational' : 'Not connected'}
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

      <Card
        title="Recently auto-created invoices"
        right={recent.length > 0 && (
          <button onClick={() => onDrill({
            title: 'Invoices Created by Invoice AI', subtitle: `${autoInvoices.length} invoices auto-created`,
            source: 'Invoices created automatically via the Slack → QuickBooks AI workflow (origin = wf1_auto).',
            filename: 'invoice_ai_created', columns: INV_COLS, rows: autoInvoices,
          })} style={exportBtn}>View all ↗</button>
        )}
      >
        {recent.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No AI-created invoices to show yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8, padding: '1px 5px', flexShrink: 0 }}>AI</span>
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</span>
                {!isMobile && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>{inv.id}</span>}
                <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{inv.issued}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flexShrink: 0, width: 70, textAlign: 'right' }}>{fmtM(inv.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

const exportBtn = { padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)' };
