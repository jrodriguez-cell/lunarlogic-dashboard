import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import DSOMeter from '../components/DSOMeter';
import ARAgingChart from '../components/ARAgingChart';
import DSOTrend from '../components/DSOTrend';
import InvoiceBoard from '../components/InvoiceBoard';
import InvoiceDrawer from '../components/InvoiceDrawer';
import PaymentTable from '../components/PaymentTable';
import CustomerDrawer from '../components/CustomerDrawer';
import PaymentQueue from '../components/PaymentQueue';
import PaymentMatchDrawer from '../components/PaymentMatchDrawer';
import MatchConfidenceChart from '../components/MatchConfidenceChart';
import ARReminderTracker from '../components/ARReminderTracker';
import DrillDrawer from '../components/DrillDrawer';
import { fetchDashboardData } from '../lib/quickbooks';

const INV_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',       render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
  { key: 'issued',      label: 'Issue Date' },
  { key: 'due',         label: 'Due Date' },
  { key: 'daysOut',     label: 'Days Out',      render: (v, r) => r.status === 'Paid' ? '—' : `${v}d` },
  { key: 'daysOverdue', label: 'Days Overdue',  render: v => v > 0 ? `${v}d` : '—' },
  { key: 'status',      label: 'Status' },
];

const PMT_COLS = [
  { key: 'txId',            label: 'Txn ID' },
  { key: 'amount',          label: 'Amount',      render: v => `$${v.toLocaleString()}` },
  { key: 'received',        label: 'Received' },
  { key: 'bank',            label: 'Bank' },
  { key: 'description',     label: 'Description' },
  { key: 'matchedCustomer', label: 'Customer' },
  { key: 'matchedInvoice',  label: 'Invoice',     render: v => v || '—' },
  { key: 'confidence',      label: 'Confidence',  render: v => `${v}%` },
  { key: 'status',          label: 'Status' },
  { key: 'rule',            label: 'Match Rule' },
];

const REFRESH_MS = 15 * 60 * 1000;

const VIEW_TITLES = {
  overview:   { title: 'Overview',            sub: 'Full AR health at a glance'              },
  invoices:   { title: 'Invoices',            sub: 'All open and recent invoices'            },
  customers:  { title: 'Customers',           sub: 'Payment behavior by customer'            },
  reminders:  { title: 'Reminder Sequence',   sub: 'Escalation tracker · Gualapack POC'      },
  reports:    { title: 'Reports',             sub: 'Coming soon'                             },
  payments:   { title: 'Cash Application',    sub: 'Plaid-powered payment matching · WF3'   },
};

export default function DashboardPage({ session, onLogout }) {
  const [data, setData]               = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeView, setActiveView]   = useState('overview');
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [openInvoice, setOpenInvoice]   = useState(null);
  const [openCustomer, setOpenCustomer] = useState(null);
  const [openPayment, setOpenPayment]   = useState(null);
  const [drill, setDrill] = useState(null);
  const openDrill = config => setDrill(config);

  const load = useCallback(async () => {
    setRefreshing(true);
    const d = await fetchDashboardData(session.clientId);
    setData(d);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [session.clientId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!data) {
    return (
      <div className="loading">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    );
  }

  const { dsoTrend, arAging, invoices, paymentBehavior, goLiveDate, preLiveDSO, collectionEfficiency, payments } = data;
  const currentDSO  = Math.round(dsoTrend[dsoTrend.length - 1].dso);
  const delta       = preLiveDSO - currentDSO;
  const totalAR     = arAging.reduce((s, b) => s + b.amount, 0);
  const overdue     = invoices.filter(i => i.status === 'Overdue');
  const overdueAmt  = overdue.reduce((s, i) => s + i.amount, 0);

  const pendingPayments  = payments ? payments.filter(p => p.status === 'Pending Review').length : 0;
  const autoApplied      = payments ? payments.filter(p => p.status === 'Auto-Applied') : [];
  const autoMatchRate    = payments ? Math.round((autoApplied.length / payments.length) * 100) : 0;
  const totalAppliedAmt  = autoApplied.reduce((s, p) => s + p.amount, 0);
  const avgApplyMinutes  = 8;

  const { title, sub } = VIEW_TITLES[activeView];

  function handleOpenInvoice(inv) {
    setOpenCustomer(null);
    setOpenInvoice(inv);
  }

  function handleOpenCustomer(cust) {
    setOpenInvoice(null);
    setOpenCustomer(cust);
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        activeView={activeView}
        onNav={setActiveView}
        session={session}
        onLogout={onLogout}
        pendingPayments={pendingPayments}
      />

      <div className="dashboard-main">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-sub">{sub}</div>
          </div>
          <div className="topbar-right">
            {lastUpdated && (
              <span className="last-updated">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button className="refresh-btn" onClick={load} disabled={refreshing}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 5.5A4.5 4.5 0 111.5 3M1.5 1v2h2"/>
              </svg>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        <main className="main-content">
          {activeView === 'payments' ? (
            <>
              <section className="payments-hero">
                <button
                  className="payments-hero-metric"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => openDrill({
                    title: `Auto-Match Rate — ${autoMatchRate}%`,
                    source: 'Percentage of transactions matched at ≥90% confidence and posted automatically. Remaining transactions land in the Pending Review queue for manual routing.',
                    filename: 'auto_matched.csv',
                    columns: PMT_COLS,
                    rows: autoApplied,
                  })}
                >
                  <div className="ph-label">Auto-Match Rate</div>
                  <div className="ph-value" style={{ color: 'var(--teal)' }}>{autoMatchRate}%</div>
                  <div className="ph-sub">of transactions applied automatically</div>
                </button>
                <div className="payments-hero-divider" />
                <div className="payments-hero-stats">
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'All Transactions — Last 10 Days',
                    source: 'Bank feed transactions received via Plaid integration. Includes auto-applied, pending review, and manually confirmed payments.',
                    filename: 'transactions_all.csv',
                    columns: PMT_COLS,
                    rows: payments,
                  })}>
                    <div className="stat-value stat-good">{payments.length}</div>
                    <div className="stat-label">Transactions Received</div>
                    <div className="stat-sub">last 10 days</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Cash Applied — Auto-Matched',
                    source: 'Transactions matched at ≥90% confidence and posted to the ledger automatically without staff intervention.',
                    filename: 'cash_applied.csv',
                    columns: PMT_COLS,
                    rows: autoApplied,
                  })}>
                    <div className="stat-value">${(totalAppliedAmt / 1000).toFixed(0)}k</div>
                    <div className="stat-label">Cash Applied</div>
                    <div className="stat-sub">auto-matched</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Pending Review Transactions',
                    source: 'Transactions held below the 90% confidence threshold, or bulk/partial payments requiring manual routing decision.',
                    filename: 'pending_review.csv',
                    columns: PMT_COLS,
                    rows: payments.filter(p => p.status === 'Pending Review'),
                  })}>
                    <div className={`stat-value${pendingPayments > 0 ? ' stat-warn' : ' stat-good'}`}>
                      {pendingPayments}
                    </div>
                    <div className="stat-label">Pending Review</div>
                    <div className="stat-sub">need manual routing</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Avg Apply Time — How It Is Calculated',
                    subtitle: 'methodology',
                    source: 'Time from payment receipt (Plaid webhook) to ledger posting. Auto-applied transactions average 8 minutes end-to-end (webhook → match → post). Manual review adds ~15 minutes for staff decision. Traditional manual process averages 3–5 business days per close cycle.',
                    filename: 'apply_time_log.csv',
                    columns: [
                      { key: 'txId',       label: 'Txn ID' },
                      { key: 'received',   label: 'Received' },
                      { key: 'appliedAt',  label: 'Applied At', render: v => v || 'Pending' },
                      { key: 'status',     label: 'Status' },
                      { key: 'confidence', label: 'Confidence', render: v => `${v}%` },
                    ],
                    rows: payments.filter(p => p.status !== 'Pending Review'),
                  })}>
                    <div className="stat-value stat-good">{avgApplyMinutes}m</div>
                    <div className="stat-label">Avg Apply Time</div>
                    <div className="stat-sub">vs days manually</div>
                  </button>
                </div>
              </section>

              <PaymentQueue payments={payments} onOpenPayment={p => { setOpenPayment(p); }} />

              <CommonQuestions />

              <div className="grid">
                <MatchConfidenceChart payments={payments} onDrill={openDrill} />
                <PaymentActivityFeed payments={payments} />
              </div>
            </>
          ) : activeView === 'reminders' ? (
            <ARReminderTracker />
          ) : activeView === 'reports' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 12, color: 'var(--muted)' }}>
              <div style={{ fontSize: 32 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Reports Coming Soon</div>
              <div style={{ fontSize: 13 }}>Exportable PDF reports and trend analysis are in development.</div>
            </div>
          ) : activeView === 'invoices' ? (
            <InvoiceBoard
              invoices={invoices}
              filterBucket={selectedBucket}
              onClearBucket={() => setSelectedBucket(null)}
              onOpenInvoice={handleOpenInvoice}
              onDrill={openDrill}
            />
          ) : activeView === 'customers' ? (
            <PaymentTable data={paymentBehavior} onOpenCustomer={handleOpenCustomer} onDrill={openDrill} />
          ) : (
            <>
              <section className="hero">
                <DSOMeter
                  current={currentDSO}
                  delta={delta}
                  preLive={preLiveDSO}
                  efficiency={collectionEfficiency}
                  onClick={() => openDrill({
                    title: 'DSO — Days Sales Outstanding',
                    source: 'DSO = (Total AR / Invoice revenue over trailing 90 days) × 90. Lower is better. The go-live date marks when LunarLogic automation was activated.',
                    filename: 'dso_calculation.csv',
                    columns: [
                      { key: 'date', label: 'Date' },
                      { key: 'dso',  label: 'DSO (days)' },
                    ],
                    rows: dsoTrend,
                  })}
                />
                <div className="hero-divider" />
                <div className="hero-stats">
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Total AR Outstanding',
                    source: 'All invoices with outstanding balance (Status ≠ Paid). Refreshed every 15 minutes from your accounting system.',
                    filename: 'ar_outstanding.csv',
                    columns: INV_COLS,
                    rows: invoices.filter(i => i.status !== 'Paid'),
                  })}>
                    <div className="stat-value">${(totalAR / 1000).toFixed(0)}k</div>
                    <div className="stat-label">Total AR Outstanding</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Overdue Invoices',
                    source: 'Invoices past their due date with outstanding balance. Sorted by days overdue descending.',
                    filename: 'overdue_invoices.csv',
                    columns: INV_COLS,
                    rows: overdue,
                  })}>
                    <div className="stat-value stat-warn">{overdue.length}</div>
                    <div className="stat-label">Overdue Invoices</div>
                    <div className="stat-sub">${(overdueAmt / 1000).toFixed(0)}k outstanding</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Collection Efficiency — All Invoices',
                    source: 'Ratio of invoices paid within agreed terms vs all invoices issued. Calculated over rolling 90-day window.',
                    filename: 'collection_efficiency.csv',
                    columns: INV_COLS,
                    rows: invoices,
                  })}>
                    <div className={`stat-value${collectionEfficiency >= 85 ? ' stat-good' : collectionEfficiency >= 70 ? '' : ' stat-warn'}`}>
                      {collectionEfficiency}%
                    </div>
                    <div className="stat-label">Collection Efficiency</div>
                    <div className="stat-sub">paid within terms</div>
                  </button>
                </div>
              </section>

              <div className="grid">
                <ARAgingChart
                  data={arAging}
                  invoices={invoices}
                  selectedBucket={selectedBucket}
                  onSelectBucket={setSelectedBucket}
                  onDrill={openDrill}
                />
                <DSOTrend
                  data={dsoTrend}
                  goLiveDate={goLiveDate}
                  preLiveDSO={preLiveDSO}
                  currentDSO={currentDSO}
                  onDrill={openDrill}
                />
                <InvoiceBoard
                  invoices={invoices}
                  filterBucket={selectedBucket}
                  onClearBucket={() => setSelectedBucket(null)}
                  onOpenInvoice={handleOpenInvoice}
                  onDrill={openDrill}
                />
                <PaymentTable data={paymentBehavior} onOpenCustomer={handleOpenCustomer} onDrill={openDrill} />
              </div>
            </>
          )}
        </main>
      </div>

      <MobileBottomNav activeView={activeView} onNav={setActiveView} pendingPayments={pendingPayments} />

      <InvoiceDrawer invoice={openInvoice} onClose={() => setOpenInvoice(null)} />
      <CustomerDrawer
        customer={openCustomer}
        invoices={invoices}
        onClose={() => setOpenCustomer(null)}
        onOpenInvoice={handleOpenInvoice}
        onDrill={openDrill}
      />
      <PaymentMatchDrawer payment={openPayment} onClose={() => setOpenPayment(null)} />
      <DrillDrawer drill={drill} onClose={() => setDrill(null)} />
    </div>
  );
}

function MobileBottomNav({ activeView, onNav, pendingPayments }) {
  const tabs = [
    { key: 'overview',  label: 'Overview',  icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="currentColor">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1"/>
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1"/>
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="1"/>
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/>
      </svg>
    )},
    { key: 'invoices',  label: 'Invoices',  icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <rect x="2" y="1.5" width="11" height="12" rx="1.5"/>
        <path d="M4.5 5.5h6M4.5 8h6M4.5 10.5h3.5"/>
      </svg>
    )},
    { key: 'customers', label: 'Customers', icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="currentColor">
        <circle cx="5.5" cy="4.5" r="2.5"/>
        <path d="M0.5 13c0-2.8 2.2-5 5-5s5 2.2 5 5" opacity="0.9"/>
        <circle cx="11.5" cy="4.5" r="2" opacity="0.55"/>
        <path d="M10 13c.4-1.5 1.8-2.5 3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55"/>
      </svg>
    )},
    { key: 'reminders', label: 'Reminders', icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 1.5a4.5 4.5 0 014.5 4.5c0 2.5.7 3.5 1.5 4H2c.8-.5 1.5-1.5 1.5-4A4.5 4.5 0 017.5 1.5z"/>
        <path d="M6.2 13a1.3 1.3 0 002.6 0"/>
        <line x1="7.5" y1="1.5" x2="7.5" y2=".5"/>
      </svg>
    )},
    { key: 'payments',  label: 'Payments',  icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3.5" width="13" height="9" rx="1.5"/>
        <path d="M1 6.5h13"/>
        <circle cx="4" cy="9.5" r="1" fill="currentColor" stroke="none"/>
        <path d="M7 9.5h4" strokeWidth="1.5"/>
      </svg>
    )},
    { key: 'reports',   label: 'Reports',   icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="currentColor">
        <rect x="1.5" y="9" width="3" height="4.5" rx="0.5"/>
        <rect x="6" y="5.5" width="3" height="8" rx="0.5"/>
        <rect x="10.5" y="2.5" width="3" height="11" rx="0.5"/>
      </svg>
    )},
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map(({ key, label, icon }) => {
        const isActive = activeView === key;
        const hasBadge = key === 'payments' && pendingPayments > 0 && !isActive;
        return (
          <button
            key={key}
            className={`mobile-tab${isActive ? ' active' : ''}`}
            onClick={() => onNav(key)}
          >
            <span className="mobile-tab-icon-wrap">
              {icon}
              {hasBadge && <span className="mobile-tab-badge">{pendingPayments}</span>}
            </span>
            <span className="mobile-tab-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const FAQ_ITEMS = [
  {
    tag: 'Manual Labor',
    tagColor: 'var(--teal)',
    tagBg: 'rgba(34,211,238,.08)',
    q: 'How much staff time does this actually save?',
    a: 'Traditional cash application averages 3–5 days of AR staff time per close cycle — mostly spent cross-referencing bank statements against open invoices by hand. Our system auto-matches >90% of transactions in under 10 minutes, with full audit trail. The remaining edge cases (bulk payments, partial remittances) are surfaced here for one-click resolution instead of manual research.',
    metric: '~8 min avg apply time vs. 3–5 days manually',
    metricColor: 'var(--green)',
  },
  {
    tag: 'Misapplication Risk',
    tagColor: '#f87171',
    tagBg: 'rgba(248,113,113,.08)',
    q: 'How do you prevent payments from being applied to the wrong invoice?',
    a: 'Every match is scored on a confidence algorithm combining payment amount, bank description fuzzy match, payment history, and client name normalization. Matches below 90% confidence are never auto-applied — they are held in the Pending Review queue so your team confirms before anything posts to the ledger. Every decision, auto or manual, is logged with a timestamp and confidence score for audit purposes.',
    metric: '90% confidence threshold before auto-post',
    metricColor: '#f87171',
  },
  {
    tag: 'Month-End Close',
    tagColor: 'var(--yellow)',
    tagBg: 'rgba(245,158,11,.08)',
    q: 'How does this help us close faster?',
    a: 'Unapplied cash is one of the top causes of delayed closes — your team can\'t finalize AR until every bank transaction is reconciled. Because payments are matched and posted within minutes of receipt (not at end-of-day or week), your ledger stays current in real time. Month-end becomes a review, not a catch-up sprint. Firms running this process report 1–3 day reductions in close cycle time.',
    metric: '1–3 day close cycle reduction reported',
    metricColor: 'var(--yellow)',
  },
  {
    tag: 'Multi-Office Consistency',
    tagColor: '#a78bfa',
    tagBg: 'rgba(167,139,250,.08)',
    q: 'Our offices each handle this differently. How does that work at scale?',
    a: 'Each office or practice group gets its own queue with configurable match rules, bank feed connectors, and approval routing — but all activity rolls up to a single firm-wide dashboard for leadership visibility. Standardized confidence thresholds and audit logs mean every office is applying cash the same way, which matters significantly at audit time. The POC we\'re running here is one office; adding additional offices is a configuration exercise, not a rebuild.',
    metric: 'Per-office queues · firm-wide roll-up view',
    metricColor: '#a78bfa',
  },
];

function CommonQuestions() {
  const [open, setOpen] = useState(null);

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-header" style={{ marginBottom: 4 }}>
        <h2>Common Questions</h2>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Click any question to expand</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              paddingTop: i === 0 ? 8 : 0,
            }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 0', textAlign: 'left',
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 4,
                  background: item.tagBg, color: item.tagColor,
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {item.tag}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  {item.q}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--muted)"
                  strokeWidth="1.5" strokeLinecap="round"
                  style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>
              {isOpen && (
                <div style={{ paddingBottom: 16, paddingLeft: 0 }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65, margin: '0 0 12px' }}>
                    {item.a}
                  </p>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontWeight: 600, color: item.metricColor,
                    background: item.tagBg, padding: '5px 10px', borderRadius: 6,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ flexShrink: 0 }}>
                      <circle cx="5" cy="5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1"/>
                      <path d="M3 5l1.5 1.5L7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                    </svg>
                    {item.metric}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentActivityFeed({ payments }) {
  const STATUS_META = {
    'Auto-Applied':   { color: 'var(--green)',  icon: '✓' },
    'Pending Review': { color: 'var(--yellow)', icon: '⚠' },
    'Manual':         { color: 'var(--muted)',  icon: '✎' },
  };

  function fmtDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const recent = [...payments].slice(0, 8);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Recent Activity</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {recent.map((p, i) => {
          const meta = STATUS_META[p.status];
          return (
            <div key={p.txId} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: p.status === 'Auto-Applied' ? 'rgba(34,197,94,.1)' : p.status === 'Pending Review' ? 'rgba(245,158,11,.1)' : 'rgba(255,255,255,.05)',
                color: meta.color,
                border: `1px solid ${p.status === 'Auto-Applied' ? 'rgba(34,197,94,.2)' : p.status === 'Pending Review' ? 'rgba(245,158,11,.2)' : 'rgba(255,255,255,.1)'}`,
              }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ${p.amount.toLocaleString()} · {p.matchedCustomer}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                  {p.status === 'Auto-Applied' && p.matchedInvoice ? `→ ${p.matchedInvoice}` : p.rule.split('—')[0].trim()}
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{fmtDate(p.received)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
