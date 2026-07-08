import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AutomationHeader, Card, StatTile, fmtM, fmtRunTime, tileGridStyle } from './automationKit';

const CADENCE = [
  { at: '−7d', label: 'Friendly heads-up', note: 'before due' },
  { at: '+1d', label: 'Payment due', note: 'day after due' },
  { at: '+7d', label: 'First follow-up', note: '' },
  { at: '+14d', label: 'Second follow-up', note: '' },
  { at: '+21d', label: 'Firm reminder', note: '' },
  { at: '+28d', label: 'Final notice', note: 'before escalation' },
];
const CADENCE_N = CADENCE.length;

function RiskDot({ level }) {
  const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Med' : 'Low';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color, flexShrink: 0 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />{label}
    </div>
  );
}

function weekStartISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // Monday = 0
  dt.setDate(dt.getDate() - dow);
  return dt.toISOString().split('T')[0];
}
function weekLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function FreqTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">Week of {label}</div>
      <div className="tooltip-row"><span>Reminders sent</span><span style={{ color: 'var(--teal)' }}>{payload[0].value}</span></div>
    </div>
  );
}

export default function ClientReminders({ data, isMobile, onDrill, onAction }) {
  const connected = data.isLive ? data.automationStatus?.wf2?.connected === true : true;
  const statusColor = connected ? 'var(--green)' : 'var(--muted)';

  const open = data.invoices.filter(i => i.status !== 'Paid');
  const reminderDataAvailable = open.some(i => i.reminders !== undefined || i.nextReminder !== undefined);
  const covered   = open.filter(i => (i.reminders?.length > 0) || i.nextReminder);
  const uncovered = open.filter(i => !((i.reminders?.length > 0) || i.nextReminder));
  const coveragePct = open.length > 0 ? Math.round((covered.length / open.length) * 100) : 100;
  const totalReminders = data.automationStats?.remindersSentTotal ?? null;

  const lastRun = data.isLive ? data.automationStatus?.wf2?.lastRun : data.wf2LastRun;
  const nextRun = data.isLive ? null : data.wf2NextRun;

  // Outcomes among reminded / open invoices
  const opened     = open.filter(i => i.status === 'Viewed').length;   // engaged after outreach
  const chasing    = open.filter(i => i.status === 'Overdue').length;  // still overdue
  const paidPeriod = data.invoices.filter(i => i.status === 'Paid').length;

  // Reminder frequency by week (from delivered reminder dates on open invoices)
  const freqData = (() => {
    const counts = {};
    open.forEach(i => (i.reminders ?? []).forEach(r => { const w = weekStartISO(r); counts[w] = (counts[w] ?? 0) + 1; }));
    const weeks = Object.keys(counts).sort();
    if (weeks.length === 0) return [];
    const out = [];
    const [sy, sm, sd] = weeks[0].split('-').map(Number);
    const cur = new Date(sy, sm - 1, sd);
    const end = new Date(...weeks[weeks.length - 1].split('-').map((v, i) => i === 1 ? v - 1 : Number(v)));
    while (cur <= end) {
      const iso = cur.toISOString().split('T')[0];
      out.push({ week: weekLabel(iso), count: counts[iso] ?? 0 });
      cur.setDate(cur.getDate() + 7);
    }
    return out;
  })();

  // Per-invoice reminder sequences, most-overdue first
  const sequences = covered.slice().sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AutomationHeader
        title="Payment Reminders"
        status={connected ? 'Operational' : 'Not connected'}
        statusColor={statusColor}
        blurb="Every open invoice is enrolled in an escalating reminder sequence, delivered by email on your behalf — so nothing slips and you never have to make the awkward first call. Frequency adapts to each customer's payment history."
        meta={[
          { label: 'Last run', value: fmtRunTime(lastRun) },
          ...(nextRun ? [{ label: 'Next run', value: fmtRunTime(nextRun) }] : []),
          { label: 'Channel', value: 'Outlook / Microsoft Graph' },
        ]}
      />

      <div style={tileGridStyle(isMobile, 3)}>
        <StatTile label="Reminders sent" color="var(--teal)"
          value={totalReminders ?? '—'} sub={totalReminders != null ? 'hands-free, since go-live' : 'not yet tracked'}
          source="Total outbound reminder emails sent via the automated sequence since go-live. Sent automatically — no calls or manual emails from your team." />
        <StatTile label="Coverage" color={coveragePct >= 80 ? 'var(--green)' : '#f59e0b'}
          value={reminderDataAvailable ? `${coveragePct}%` : '—'} sub={reminderDataAvailable ? `${covered.length} of ${open.length} open invoices` : 'reminder logging not linked yet'}
          source="Share of open invoices currently enrolled in the reminder sequence (at least one reminder scheduled or delivered)." />
        <StatTile label="In active sequence" color="var(--text)"
          value={reminderDataAvailable ? covered.length : '—'} sub={reminderDataAvailable ? 'being followed up automatically' : 'not yet tracked'}
          source="Open invoices with at least one reminder delivered or scheduled — LunarLogic is actively chasing these." />
      </div>

      {reminderDataAvailable && (
        <Card title="Automation coverage" hint="Which open invoices LunarLogic is handling vs. those that still need you.">
          <div style={{ height: 10, background: 'var(--bg-hover)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${coveragePct}%`, height: '100%', background: coveragePct >= 80 ? '#22c55e' : '#f59e0b', borderRadius: 5 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)' }}>
            <span>{covered.length} handled by LunarLogic</span>
            <span>{uncovered.length} need manual attention</span>
          </div>
          {uncovered.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Outside coverage — needs you</div>
              {uncovered.map(inv => (
                <div key={inv.id} onClick={() => onAction(inv)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 6px', margin: '0 -6px', borderRadius: 6, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ color: 'var(--text-dim)' }}>{inv.customer} — {inv.id}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmtM(inv.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Reminder activity — outcomes + frequency */}
      {reminderDataAvailable && (
        <Card title="Reminder activity & outcomes" hint="Volume of reminders going out, and how invoices respond.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            <OutcomeTile label="Opened after outreach" value={opened} color="#a78bfa" sub="viewed, engaged" />
            <OutcomeTile label="Still chasing" value={chasing} color="#f59e0b" sub="overdue, sequence active" />
            <OutcomeTile label="Paid this period" value={paidPeriod} color="#22c55e" sub="resolved" />
          </div>
          {freqData.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Reminders sent per week</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={freqData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fill: '#4e6a88', fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(freqData.length / 7))} />
                  <YAxis tick={{ fill: '#4e6a88', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<FreqTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false}>
                    {freqData.map((d, i) => <Cell key={i} fill={d.count > 0 ? '#00d4e8' : '#26364a'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>
      )}

      {/* Per-invoice reminder sequences */}
      {sequences.length > 0 && (
        <Card title="Active reminder sequences" hint="Where each open invoice sits in its cadence. Filled = sent · amber ring = next scheduled.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sequences.map(inv => {
              const sent = inv.reminders?.length ?? 0;
              return (
                <div key={inv.id} onClick={() => onAction(inv)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', margin: '0 -6px', borderRadius: 6, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                      {!isMobile && <span style={{ fontFamily: 'monospace', marginRight: 6 }}>{inv.id}</span>}
                      {inv.daysOverdue > 0 ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>{inv.daysOverdue}d overdue</span> : <span>due {inv.due}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                    {Array.from({ length: CADENCE_N }).map((_, i) => {
                      const isSent = i < sent;
                      const isNext = i === sent && inv.nextReminder;
                      return <div key={i} title={CADENCE[i].label} style={{ width: 9, height: 9, borderRadius: '50%', background: isSent ? 'var(--teal)' : 'transparent', border: isSent ? 'none' : isNext ? '1.5px solid #f59e0b' : '1.5px solid var(--border)' }} />;
                    })}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flexShrink: 0, width: 64, textAlign: 'right' }}>{fmtM(inv.amount)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <Card title="Reminder cadence" hint="The escalating sequence each invoice follows, relative to its due date.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {CADENCE.map((c, i) => (
              <div key={c.at} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < CADENCE.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal)', width: 34, flexShrink: 0 }}>{c.at}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{c.label}</span>
                {c.note && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{c.note}</span>}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Customer payment risk" hint="Reminder frequency adapts automatically to each customer's history.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(data.paymentBehavior ?? []).map(pb => (
              <div key={pb.customer} onClick={() => onDrill({
                title: `${pb.customer} — Open Invoices`,
                subtitle: `${fmtM(pb.openAmount)} outstanding · avg ${pb.avgDays}d to pay · ${pb.riskLevel} risk`,
                source: 'Historical payment pattern from past invoices. Risk level drives reminder frequency.',
                filename: `customer_${pb.customer.toLowerCase().replace(/\s+/g, '_')}`,
                columns: [
                  { key: 'id', label: 'Invoice' }, { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
                  { key: 'due', label: 'Due' }, { key: 'status', label: 'Status' }, { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—' },
                ],
                rows: open.filter(i => i.customer === pb.customer),
              })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px', margin: '0 -6px', borderRadius: 6, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pb.customer}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{pb.avgDays}d avg</span>
                <RiskDot level={pb.riskLevel} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function OutcomeTile({ label, value, color, sub }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
    </div>
  );
}
