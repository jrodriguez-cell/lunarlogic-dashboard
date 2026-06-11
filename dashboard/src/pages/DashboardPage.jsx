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
import CashFlowForecast from '../components/CashFlowForecast';
import ARReminderTracker from '../components/ARReminderTracker';
import DrillDrawer from '../components/DrillDrawer';
import AIStatusReport from '../components/AIStatusReport';
import { fetchDashboardData } from '../lib/quickbooks';
import { exportXLSX } from '../lib/excel';

function fmtM(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

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
  const [cashCustomer, setCashCustomer] = useState('All');

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
  const totalAR     = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
  const overdue     = invoices.filter(i => i.status === 'Overdue');
  const overdueAmt  = overdue.reduce((s, i) => s + i.amount, 0);

  const writeOffInvs    = invoices.filter(i => i.daysOverdue > 90);
  const writeOffRisk    = writeOffInvs.reduce((s, i) => s + i.amount, 0);
  const writeOffCount   = writeOffInvs.length;
  const today           = new Date('2026-05-19');
  const in30Days        = new Date(today); in30Days.setDate(in30Days.getDate() + 30);
  const expectedCashIn  = invoices
    .filter(i => i.status !== 'Paid' && i.status !== 'Overdue')
    .filter(i => { const d = new Date(i.due + 'T00:00:00'); return d >= today && d <= in30Days; })
    .reduce((s, i) => s + i.amount, 0);

  const pendingPayments  = payments ? payments.filter(p => p.status === 'Pending Review').length : 0;
  const autoApplied      = payments ? payments.filter(p => p.status === 'Auto-Applied') : [];
  const autoMatchRate    = payments ? Math.round((autoApplied.length / payments.length) * 100) : 0;
  const totalAppliedAmt  = autoApplied.reduce((s, p) => s + p.amount, 0);
  const avgApplyMinutes  = 8;

  const cashCustomers = payments
    ? ['All', ...Array.from(new Set(payments.map(p => p.matchedCustomer).filter(Boolean))).sort()]
    : ['All'];

  const filteredPayments = (payments && cashCustomer !== 'All')
    ? payments.filter(p => p.matchedCustomer === cashCustomer)
    : payments;

  const unappliedPayments   = filteredPayments ? filteredPayments.filter(p => p.status === 'Pending Review') : [];
  const unappliedAmt        = unappliedPayments.reduce((s, p) => s + p.amount, 0);
  const filteredAutoApplied = filteredPayments ? filteredPayments.filter(p => p.status === 'Auto-Applied') : [];
  const filteredAutoMatchRate = filteredPayments && filteredPayments.length > 0
    ? Math.round((filteredAutoApplied.length / filteredPayments.length) * 100)
    : 0;
  const filteredTotalApplied = filteredAutoApplied.reduce((s, p) => s + p.amount, 0);
  const filteredPending      = filteredPayments ? filteredPayments.filter(p => p.status === 'Pending Review').length : 0;

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
          <AIStatusReport
            view={activeView}
            metrics={{
              invoices, payments: filteredPayments || payments || [],
              paymentBehavior, currentDSO, delta, preLiveDSO,
              collectionEfficiency, totalAR, overdue, overdueAmt,
              writeOffRisk, writeOffCount, expectedCashIn,
              unappliedAmt, autoMatchRate: filteredAutoMatchRate,
              unappliedPayments, clientName: data.clientName,
            }}
          />
          {activeView === 'payments' ? (
            <>
              <div className="cash-filter-bar">
                <span className="cash-filter-label">Filter by customer</span>
                <select
                  className="cash-filter-select"
                  value={cashCustomer}
                  onChange={e => setCashCustomer(e.target.value)}
                >
                  {cashCustomers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {cashCustomer !== 'All' && (
                  <button className="cash-filter-clear" onClick={() => setCashCustomer('All')}>
                    Clear ×
                  </button>
                )}
              </div>

              <section className="payments-hero">
                <button
                  className="payments-hero-metric"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => openDrill({
                    title: `Auto-Match Rate — ${filteredAutoMatchRate}%`,
                    source: 'Percentage of transactions matched at ≥90% confidence and posted automatically. Remaining transactions land in the Pending Review queue for manual routing.',
                    filename: 'auto_matched',
                    columns: PMT_COLS,
                    rows: filteredAutoApplied,
                  })}
                >
                  <div className="ph-label">Auto-Match Rate</div>
                  <div className="ph-value" style={{ color: 'var(--teal)' }}>{filteredAutoMatchRate}%</div>
                  <div className="ph-sub">of transactions applied automatically</div>
                </button>
                <div className="payments-hero-divider" />
                <div className="payments-hero-stats">
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'All Transactions — Last 10 Days',
                    source: 'Bank feed transactions received via Plaid integration. Includes auto-applied, pending review, and manually confirmed payments.',
                    filename: 'transactions_all',
                    columns: PMT_COLS,
                    rows: filteredPayments,
                  })}>
                    <div className="stat-value stat-good">{filteredPayments ? filteredPayments.length : 0}</div>
                    <div className="stat-label">Transactions Received</div>
                    <div className="stat-sub">last 10 days</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Cash Applied — Auto-Matched',
                    source: 'Transactions matched at ≥90% confidence and posted to the ledger automatically without staff intervention.',
                    filename: 'cash_applied',
                    columns: PMT_COLS,
                    rows: filteredAutoApplied,
                  })}>
                    <div className="stat-value">{fmtM(filteredTotalApplied)}</div>
                    <div className="stat-label">Cash Applied</div>
                    <div className="stat-sub">auto-matched</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Unapplied Cash',
                    source: 'Payments received in the bank but not yet matched and posted to open invoices. Under ASC 606-10-55, unresolved unapplied cash should be classified as a contract liability (deferred revenue) or customer deposit on the balance sheet until applied. Standard practice is FIFO application to the oldest outstanding invoice. Amounts aging >30 days should be reviewed for proper GL classification and disclosure.',
                    filename: 'unapplied_cash',
                    columns: PMT_COLS,
                    rows: unappliedPayments,
                  })}>
                    <div className={`stat-value${unappliedAmt > 0 ? ' stat-warn' : ' stat-good'}`}>
                      {fmtM(unappliedAmt)}
                    </div>
                    <div className="stat-label">Unapplied Cash</div>
                    <div className="stat-sub">ASC 606 — contract liability</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Pending Review Transactions',
                    source: 'Transactions held below the 90% confidence threshold, or bulk/partial payments requiring manual routing decision.',
                    filename: 'pending_review',
                    columns: PMT_COLS,
                    rows: unappliedPayments,
                  })}>
                    <div className={`stat-value${filteredPending > 0 ? ' stat-warn' : ' stat-good'}`}>
                      {filteredPending}
                    </div>
                    <div className="stat-label">Pending Review</div>
                    <div className="stat-sub">need manual routing</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Avg Apply Time — Methodology',
                    subtitle: 'methodology',
                    source: 'Time from payment receipt (Plaid webhook) to ledger posting. Auto-applied transactions average 8 minutes end-to-end. Manual review adds ~15 minutes for staff decision. Traditional manual process averages 3–5 business days per close cycle. Under ASC 310, timely cash application ensures the AR ledger reflects true outstanding balances.',
                    filename: 'apply_time_log',
                    columns: [
                      { key: 'txId',      label: 'Txn ID' },
                      { key: 'received',  label: 'Received' },
                      { key: 'appliedAt', label: 'Applied At', render: v => v || 'Pending' },
                      { key: 'status',    label: 'Status' },
                      { key: 'confidence', label: 'Confidence', render: v => `${v}%` },
                    ],
                    rows: filteredPayments ? filteredPayments.filter(p => p.status !== 'Pending Review') : [],
                  })}>
                    <div className="stat-value stat-good">{avgApplyMinutes}m</div>
                    <div className="stat-label">Avg Apply Time</div>
                    <div className="stat-sub">vs days manually</div>
                  </button>
                </div>
              </section>

              <PaymentQueue payments={filteredPayments || []} onOpenPayment={p => { setOpenPayment(p); }} />

              <CashFlowForecast
                invoices={invoices || []}
                paymentBehavior={paymentBehavior || []}
                onDrill={openDrill}
              />

              <div className="grid cash-panel-grid">
                <AuditTrailPanel payments={filteredPayments || []} />
              </div>

              <PaymentActivityFeed payments={filteredPayments || []} />
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
                    source: 'DSO = (Total AR / Invoice revenue over trailing 90 days) × 90. Lower is better. Under ASC 310-10, DSO trends are a key indicator of collection effectiveness and AR quality.',
                    filename: 'dso_calculation',
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
                    source: 'All invoices with outstanding balance (Status ≠ Paid). Under ASC 310-10, AR must be reported net of the Allowance for Doubtful Accounts (ADA). The aging schedule is the primary input for the percentage-of-receivables ADA estimation method.',
                    filename: 'ar_outstanding',
                    columns: INV_COLS,
                    rows: invoices.filter(i => i.status !== 'Paid'),
                  })}>
                    <div className="stat-value">{fmtM(totalAR)}</div>
                    <div className="stat-label">Total AR Outstanding</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Overdue Invoices',
                    source: 'Invoices past their contractual due date with outstanding balance. Under ASC 310-10-35, management must assess collectability of overdue balances and adjust the Allowance for Doubtful Accounts accordingly. Invoices >60 days past due typically trigger enhanced collection procedures.',
                    filename: 'overdue_invoices',
                    columns: INV_COLS,
                    rows: overdue,
                  })}>
                    <div className="stat-value stat-warn">{overdue.length}</div>
                    <div className="stat-label">Overdue Invoices</div>
                    <div className="stat-sub">{fmtM(overdueAmt)} outstanding</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Collection Efficiency',
                    source: 'Ratio of invoices paid within agreed terms vs all invoices issued over the trailing 90-day window. A key operational metric for AR quality under ASC 310.',
                    filename: 'collection_efficiency',
                    columns: INV_COLS,
                    rows: invoices,
                  })}>
                    <div className={`stat-value${collectionEfficiency >= 85 ? ' stat-good' : collectionEfficiency >= 70 ? '' : ' stat-warn'}`}>
                      {collectionEfficiency}%
                    </div>
                    <div className="stat-label">Collection Efficiency</div>
                    <div className="stat-sub">paid within terms</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Write-off Risk Exposure',
                    source: 'Invoices in the 90+ day aging bucket. Under ASC 310-10-35-7, balances deemed uncollectable must be written off against the Allowance for Doubtful Accounts. Industry standard ADA reserve rate for 90+ day AR is 50–100%. These balances are the primary write-off risk in the portfolio and should be reviewed each period for impairment.',
                    filename: 'writeoff_risk',
                    columns: INV_COLS,
                    rows: writeOffInvs,
                  })}>
                    <div className="stat-value" style={{ color: writeOffRisk > 0 ? 'var(--red)' : 'var(--green)' }}>
                      {fmtM(writeOffRisk)}
                    </div>
                    <div className="stat-label">Write-off Risk</div>
                    <div className="stat-sub">{writeOffCount} inv · 90+ days</div>
                  </button>
                  <button className="stat-btn" onClick={() => openDrill({
                    title: 'Expected Cash Inflow — Next 30 Days',
                    source: 'Sum of current (non-overdue) invoice balances due within the next 30 days. Represents expected near-term cash receipts based on contractual due dates. Actual collections may vary based on customer payment history.',
                    filename: 'expected_cash_30d',
                    columns: INV_COLS,
                    rows: invoices.filter(i => {
                      if (i.status === 'Paid' || i.status === 'Overdue') return false;
                      const d = new Date(i.due + 'T00:00:00');
                      const t = new Date('2026-05-19');
                      const t30 = new Date('2026-06-18');
                      return d >= t && d <= t30;
                    }),
                  })}>
                    <div className="stat-value stat-good">
                      {fmtM(expectedCashIn)}
                    </div>
                    <div className="stat-label">Expected Cash In</div>
                    <div className="stat-sub">due in next 30 days</div>
                  </button>
                </div>
              </section>

              <DSOTrend
                data={dsoTrend}
                goLiveDate={goLiveDate}
                preLiveDSO={preLiveDSO}
                currentDSO={currentDSO}
                onDrill={openDrill}
              />

              <ARAgingChart
                invoices={invoices}
                paymentBehavior={paymentBehavior}
                selectedBucket={selectedBucket}
                onSelectBucket={setSelectedBucket}
                onDrill={openDrill}
              />

              <div className="grid">
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
      <PaymentMatchDrawer payment={openPayment} invoices={invoices || []} onClose={() => setOpenPayment(null)} />
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

function AuditTrailPanel({ payments }) {
  const [rangeDays, setRangeDays] = useState(null);

  const RANGES = [
    { label: '7d',  days: 7 },
    { label: '14d', days: 14 },
    { label: 'All', days: null },
  ];

  function fmtDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const dates   = payments.map(p => new Date(p.received + 'T00:00:00')).filter(d => !isNaN(d));
  const latest  = dates.length ? new Date(Math.max(...dates)) : new Date();
  const filtered = rangeDays
    ? payments.filter(p => {
        const cutoff = new Date(latest);
        cutoff.setDate(cutoff.getDate() - rangeDays);
        return new Date(p.received + 'T00:00:00') >= cutoff;
      })
    : payments;

  const entries = filtered.map(p => ({
    txId:       p.txId,
    amount:     p.amount,
    customer:   p.matchedCustomer,
    invoice:    p.matchedInvoice || '—',
    confidence: p.confidence,
    decision:   p.status === 'Auto-Applied' ? 'Auto' : p.status === 'Manual' ? 'Manual' : 'Held',
    by:         p.status === 'Auto-Applied' ? 'System' : 'Staff',
    date:       p.received,
  }));

  const STATUS_COLOR = { Auto: 'var(--green)', Manual: 'var(--teal)', Held: 'var(--yellow)' };

  const AUDIT_COLS = [
    { key: 'txId',       label: 'Txn ID' },
    { key: 'amount',     label: 'Amount',     render: v => `$${v.toLocaleString()}` },
    { key: 'customer',   label: 'Customer' },
    { key: 'invoice',    label: 'Invoice' },
    { key: 'confidence', label: 'Confidence', render: v => `${v}%` },
    { key: 'decision',   label: 'Decision' },
    { key: 'by',         label: 'Applied By' },
    { key: 'date',       label: 'Date' },
  ];

  function handleExport() {
    exportXLSX(
      `audit_trail_${rangeDays ? rangeDays + 'd' : 'all'}`,
      'Audit Trail',
      AUDIT_COLS,
      entries,
      { Report: 'Cash Application Audit Trail', Period: rangeDays ? `Last ${rangeDays} days` : 'All time' }
    );
  }

  return (
    <div className="card cash-audit-card">
      <div className="card-header">
        <h2>Audit Trail</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 260, WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Date', 'Customer', 'Amount', 'Conf.', 'Decision'].map(h => (
                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.txId} style={{ borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <td style={{ padding: '7px 8px', color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 10 }}>{fmtDate(e.date)}</td>
                <td style={{ padding: '7px 8px', color: 'var(--text)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.customer}</td>
                <td style={{ padding: '7px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>${e.amount.toLocaleString()}</td>
                <td style={{ padding: '7px 8px', color: e.confidence >= 90 ? 'var(--green)' : e.confidence >= 70 ? 'var(--yellow)' : 'var(--red)', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.confidence}%</td>
                <td style={{ padding: '7px 8px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[e.decision], background: STATUS_COLOR[e.decision] + '18', padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' }}>{e.decision}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        {entries.length} decision{entries.length !== 1 ? 's' : ''} logged — full audit trail for SOC 2 / internal controls compliance.
      </div>
    </div>
  );
}

