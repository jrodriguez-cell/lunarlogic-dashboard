import { useState, useEffect, useCallback } from 'react';
import DSOMeter from './components/DSOMeter';
import ARAgingChart from './components/ARAgingChart';
import DSOTrend from './components/DSOTrend';
import InvoiceBoard from './components/InvoiceBoard';
import PaymentTable from './components/PaymentTable';
import { fetchDashboardData } from './lib/quickbooks';

const REFRESH_MS = 15 * 60 * 1000;

export default function App() {
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const d = await fetchDashboardData();
    setData(d);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!data) {
    return <div className="loading">Loading AR data…</div>;
  }

  const { dsoTrend, arAging, invoices, paymentBehavior, goLiveDate } = data;
  const currentDSO  = Math.round(dsoTrend[dsoTrend.length - 1].dso);
  const preLiveDSO  = Math.round(dsoTrend.slice(0, 30).reduce((s, d) => s + d.dso, 0) / 30);
  const delta       = preLiveDSO - currentDSO;
  const totalAR     = arAging.reduce((s, b) => s + b.amount, 0);
  const overdue     = invoices.filter((i) => i.status === 'Overdue');
  const overdueAmt  = overdue.reduce((s, i) => s + i.amount, 0);
  const totalOpen   = arAging.reduce((s, b) => s + b.count, 0);

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="brand-name">LunarLogic</span>
          <span className="brand-sep">·</span>
          <span className="brand-sub">AR Dashboard</span>
        </div>
        <div className="header-right">
          {lastUpdated && (
            <span className="last-updated">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="refresh-btn" onClick={load} disabled={refreshing}>
            {refreshing ? '…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <DSOMeter current={currentDSO} delta={delta} preLive={preLiveDSO} />
          <div className="hero-divider" />
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">${(totalAR / 1000).toFixed(0)}k</div>
              <div className="stat-label">Total AR Outstanding</div>
            </div>
            <div className="stat">
              <div className="stat-value stat-warn">{overdue.length}</div>
              <div className="stat-label">Overdue Invoices</div>
            </div>
            <div className="stat">
              <div className="stat-value stat-warn">${(overdueAmt / 1000).toFixed(0)}k</div>
              <div className="stat-label">Overdue Amount</div>
            </div>
            <div className="stat">
              <div className="stat-value">{totalOpen}</div>
              <div className="stat-label">Open Invoices</div>
            </div>
          </div>
        </section>

        <div className="grid">
          <ARAgingChart data={arAging} />
          <DSOTrend data={dsoTrend} goLiveDate={goLiveDate} />
          <InvoiceBoard invoices={invoices} />
          <PaymentTable data={paymentBehavior} />
        </div>
      </main>
    </div>
  );
}
