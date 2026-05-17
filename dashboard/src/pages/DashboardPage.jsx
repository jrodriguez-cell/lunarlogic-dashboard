import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import DSOMeter from '../components/DSOMeter';
import ARAgingChart from '../components/ARAgingChart';
import DSOTrend from '../components/DSOTrend';
import InvoiceBoard from '../components/InvoiceBoard';
import InvoiceDrawer from '../components/InvoiceDrawer';
import PaymentTable from '../components/PaymentTable';
import CustomerDrawer from '../components/CustomerDrawer';
import { fetchDashboardData } from '../lib/quickbooks';

const REFRESH_MS = 15 * 60 * 1000;

const VIEW_TITLES = {
  overview:  { title: 'Overview',  sub: 'Full AR health at a glance' },
  invoices:  { title: 'Invoices',  sub: 'All open and recent invoices' },
  customers: { title: 'Customers', sub: 'Payment behavior by customer' },
  reports:   { title: 'Reports',   sub: 'Coming soon' },
};

export default function DashboardPage({ session, onLogout }) {
  const [data, setData]               = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeView, setActiveView]   = useState('overview');
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [openInvoice, setOpenInvoice] = useState(null);
  const [openCustomer, setOpenCustomer] = useState(null);

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

  const { dsoTrend, arAging, invoices, paymentBehavior, goLiveDate, preLiveDSO, collectionEfficiency } = data;
  const currentDSO  = Math.round(dsoTrend[dsoTrend.length - 1].dso);
  const delta       = preLiveDSO - currentDSO;
  const totalAR     = arAging.reduce((s, b) => s + b.amount, 0);
  const overdue     = invoices.filter(i => i.status === 'Overdue');
  const overdueAmt  = overdue.reduce((s, i) => s + i.amount, 0);

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
          {activeView === 'reports' ? (
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
            />
          ) : activeView === 'customers' ? (
            <PaymentTable data={paymentBehavior} onOpenCustomer={handleOpenCustomer} />
          ) : (
            <>
              <section className="hero">
                <DSOMeter current={currentDSO} delta={delta} preLive={preLiveDSO} efficiency={collectionEfficiency} />
                <div className="hero-divider" />
                <div className="hero-stats">
                  <div className="stat">
                    <div className="stat-value">${(totalAR / 1000).toFixed(0)}k</div>
                    <div className="stat-label">Total AR Outstanding</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value stat-warn">{overdue.length}</div>
                    <div className="stat-label">Overdue Invoices</div>
                    <div className="stat-sub">${(overdueAmt / 1000).toFixed(0)}k outstanding</div>
                  </div>
                  <div className="stat">
                    <div className={`stat-value${collectionEfficiency >= 85 ? ' stat-good' : collectionEfficiency >= 70 ? '' : ' stat-warn'}`}>
                      {collectionEfficiency}%
                    </div>
                    <div className="stat-label">Collection Efficiency</div>
                    <div className="stat-sub">paid within terms</div>
                  </div>
                </div>
              </section>

              <div className="grid">
                <ARAgingChart
                  data={arAging}
                  selectedBucket={selectedBucket}
                  onSelectBucket={setSelectedBucket}
                />
                <DSOTrend
                  data={dsoTrend}
                  goLiveDate={goLiveDate}
                  preLiveDSO={preLiveDSO}
                  currentDSO={currentDSO}
                />
                <InvoiceBoard
                  invoices={invoices}
                  filterBucket={selectedBucket}
                  onClearBucket={() => setSelectedBucket(null)}
                  onOpenInvoice={handleOpenInvoice}
                />
                <PaymentTable data={paymentBehavior} onOpenCustomer={handleOpenCustomer} />
              </div>
            </>
          )}
        </main>
      </div>

      <InvoiceDrawer invoice={openInvoice} onClose={() => setOpenInvoice(null)} />
      <CustomerDrawer
        customer={openCustomer}
        invoices={invoices}
        onClose={() => setOpenCustomer(null)}
        onOpenInvoice={handleOpenInvoice}
      />
    </div>
  );
}
