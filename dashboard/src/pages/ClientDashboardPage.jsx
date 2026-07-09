import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { logout } from '../lib/auth';
import { getClientData } from '../data/mockData';
import { fetchDashboardData } from '../lib/quickbooks';
import { useMobile } from '../lib/useMobile';
import DrillDrawer from '../components/DrillDrawer';
import CustomerPanel from '../components/client/CustomerPanel';
import ClientOverview from '../components/client/ClientOverview';
import ClientInvoiceAI from '../components/client/ClientInvoiceAI';
import ClientReminders from '../components/client/ClientReminders';
import ClientCashApplication from '../components/client/ClientCashApplication';
import ClientActionPlan from '../components/client/ClientActionPlan';
import ClientInvoices from '../components/client/ClientInvoices';
import ClientReportCard from '../components/client/ClientReportCard';
import ClientCashForecast from '../components/client/ClientCashForecast';
import ClientSettings from '../components/client/ClientSettings';
import AIAssistant from '../components/client/AIAssistant';
import SourceTag from '../components/SourceTag';

const DSO_BENCHMARKS = [
  { max: 30,       label: 'Excellent', color: '#22c55e', desc: 'Top-quartile efficiency'   },
  { max: 45,       label: 'Healthy',   color: '#00d4e8', desc: 'Industry average'           },
  { max: 60,       label: 'Friction',  color: '#f59e0b', desc: 'Friction in collections'    },
  { max: 90,       label: 'Breakdown', color: '#f97316', desc: 'Collections under pressure' },
  { max: Infinity, label: 'Crisis',    color: '#ef4444', desc: 'Existential cash-flow risk' },
];
function getDSOBenchmark(dso) {
  return DSO_BENCHMARKS.find(b => dso < b.max) ?? DSO_BENCHMARKS[4];
}

function fmtK(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

// QuickBooks data is refreshed on this cadence (matches the copy shown in the UI).
const REFRESH_MS = 15 * 60 * 1000;

function timeAgo(date, nowMs) {
  const secs = Math.max(0, Math.round((nowMs - date.getTime()) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Left-sidebar navigation. Items with `soon` are placeholders being built next.
const NAV = [
  { id: 'overview',   label: 'Dashboard',  icon: 'grid' },
  { id: 'customers',  label: 'Customers',  icon: 'users' },
  { id: 'estimates',  label: 'Estimates',  icon: 'file', soon: true },
  { id: 'invoices',   label: 'Invoices',   icon: 'fileText' },
  { id: 'invoiceai',  label: 'Invoice AI', icon: 'bolt' },
  { id: 'cashapp',    label: 'Payments',   icon: 'card' },
  { id: 'activities', label: 'Activities', icon: 'activity', soon: true },
  { id: 'action',     label: 'Action Plan', icon: 'check' },
  { id: 'report',     label: 'Reports',    icon: 'bars' },
  { id: 'cashflow',   label: 'Cash Flow',  icon: 'trend' },
];
const NAV_SETTINGS = { id: 'settings', label: 'Settings', icon: 'cog' };

function NavIcon({ name }) {
  const p = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M17 3.13a4 4 0 010 7.75',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
    fileText: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6',
    bolt: 'M13 2L4 14h6v8l9-12h-6z',
    card: 'M2 5h20v14H2zM2 10h20',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    check: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    bars: 'M12 20V10M18 20V4M6 20v-4',
    trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    cog: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 2h-4l-.3 2.6a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.3 2.6h4l.3-2.6a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6a7 7 0 00.1-1z',
  }[name] || '';
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={p} /></svg>;
}

export default function ClientDashboardPage({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [drill, setDrill]         = useState(null);
  const [actionInv, setActionInv] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [actionPlanSort, setActionPlanSort] = useState(null);
  const isMobile = useMobile();
  const base = useMemo(() => getClientData(session.clientId), [session.clientId]);
  const [liveData, setLiveData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // A monotonically-increasing request id guards against a slow fetch from a
  // previous clientId (or a superseded refresh) landing after a newer one.
  const reqRef = useRef(0);
  const load = useCallback(async () => {
    const myReq = ++reqRef.current;
    setRefreshing(true);
    try {
      const d = await fetchDashboardData(session.clientId);
      if (reqRef.current === myReq) { setLiveData(d); setLastUpdated(new Date()); }
    } finally {
      if (reqRef.current === myReq) setRefreshing(false);
    }
  }, [session.clientId]);

  useEffect(() => {
    setLiveData(null);
    setLastUpdated(null);
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Re-render the "Updated X ago" label as time passes, without refetching.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Live-connected clients (e.g. qbsandbox) overlay real QB numbers onto the
  // static metadata (name, industry) mock data still provides. preLiveDSO,
  // automationStats, and payments have no real source for live clients yet,
  // so they're nulled out rather than falling back to fabricated mock values.
  const data = useMemo(() => {
    if (!liveData) return base;
    return {
      ...base,
      dsoTrend: liveData.dsoTrend,
      arAging: liveData.arAging,
      invoices: liveData.invoices,
      paymentBehavior: liveData.paymentBehavior,
      goLiveDate: liveData.goLiveDate,
      annualRevenue: liveData.annualRevenue,
      collectionEfficiency: liveData.collectionEfficiency,
      preLiveDSO: liveData.preLiveDSO,
      automationStats: liveData.automationStats,
      automationStatus: liveData.automationStatus,
      payments: liveData.payments,
      isLive: liveData.isLive,
    };
  }, [base, liveData]);

  function handleLogout() { logout(); onLogout(); }

  const currentDSOEntry = data.dsoTrend[data.dsoTrend.length - 1];
  const currentDSO  = currentDSOEntry?.dso ?? 0;
  const dsoChange   = data.preLiveDSO != null ? Math.round(currentDSO - data.preLiveDSO) : null;
  const urgentCount = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 0).length;

  const nonOverdueAR   = data.invoices.filter(i => i.status !== 'Paid' && i.daysOverdue <= 0).reduce((s, i) => s + i.amount, 0);
  const bpdso          = Math.round(nonOverdueAR / (data.annualRevenue / 365));
  const dsoGapDays     = Math.max(0, Math.round(currentDSO) - bpdso);
  const dsoGapDollars  = Math.round(dsoGapDays * (data.annualRevenue / 365));

  const overdueInvs = data.invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
  const totalAR     = data.invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
  const overdueAR   = overdueInvs.reduce((s, i) => s + i.amount, 0);
  const pct         = totalAR > 0 ? overdueAR / totalAR : 0;
  const projectedDSO      = Math.max(Math.round(currentDSO * (1 - pct * 0.6)), Math.round(currentDSO * 0.75));
  const projectedImprove  = Math.round(currentDSO - projectedDSO);

  const bm = getDSOBenchmark(Math.round(currentDSO));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>

      {/* Left sidebar — always visible (compact icon rail on mobile) */}
      <aside style={{
        width: isMobile ? 56 : 208, flexShrink: 0, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: isMobile ? '12px 6px' : '14px 12px',
        position: 'sticky', top: 0, height: '100vh', alignSelf: 'flex-start',
      }}>
        <div className="sidebar-wordmark" style={{ fontSize: 16, padding: isMobile ? '4px 0 14px' : '4px 8px 14px', display: 'flex', alignItems: 'center', gap: 7, justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#moonGradientSb)">
            <defs><linearGradient id="moonGradientSb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#818CF8" /></linearGradient></defs>
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
          {!isMobile && <span className="sidebar-wordmark-name"><span className="sidebar-wordmark-text">lunarlogic</span><span className="sidebar-wordmark-suffix">.ai</span></span>}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          {NAV.map(n => (
            <NavItem key={n.id} item={n} active={activeTab === n.id} badge={n.id === 'action' ? urgentCount : 0}
              compact={isMobile} onClick={() => setActiveTab(n.id)} />
          ))}
        </nav>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
          <NavItem item={NAV_SETTINGS} active={activeTab === 'settings'} compact={isMobile} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: `0 ${isMobile ? 16 : 24}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {!isMobile && lastUpdated && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Updated {timeAgo(lastUpdated, now)}</span>
          )}
          <button
            onClick={load}
            disabled={refreshing}
            title="Refresh from QuickBooks"
            style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 10px', cursor: refreshing ? 'default' : 'pointer', opacity: refreshing ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ animation: refreshing ? 'aiSpin 0.8s linear infinite' : 'none' }}>
              <path d="M10 5.5A4.5 4.5 0 111.5 3M1.5 1v2h2" />
            </svg>
            {!isMobile && (refreshing ? 'Refreshing…' : 'Refresh')}
          </button>
          <button onClick={handleLogout} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Hero — DSO + stat grid */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: isMobile ? '14px 16px' : '14px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', gap: isMobile ? 14 : 20 }}>

          {/* Left — DSO number */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 4 }}>
              Days Sales Outstanding
              <SourceTag label="Days Sales Outstanding: average number of days to collect payment after invoice issue. Formula: (Total Open AR ÷ Annual Revenue) × 365. Calculated daily from QuickBooks data." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: isMobile ? 44 : 52, fontWeight: 900, color: 'var(--teal)', lineHeight: 1, letterSpacing: -3 }}>{Math.round(currentDSO)}</span>
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, display: 'block', marginBottom: 4 }}>days</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: bm.color,
                  background: `${bm.color}18`, border: `1px solid ${bm.color}35`,
                  borderRadius: 20, padding: '2px 9px', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>
                  {bm.label} — {bm.desc}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {data.preLiveDSO != null && (
                <>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>Was {data.preLiveDSO}d</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>·</span>
                </>
              )}
              <span style={{ fontSize: 10, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>45d</span> avg
                <SourceTag label="Industry average DSO for professional services firms per APQC Process & Performance Management benchmarks (2024 report). Range: 40–60 days." />
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>·</span>
              <span style={{ fontSize: 10, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>28d</span> best-in-class
                <SourceTag label="Best-in-class DSO for professional services per APQC benchmarks. Top quartile performers sustain 25–35 day DSO through systematic AR automation." />
              </span>
              {Math.round(currentDSO) <= 45 && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '1px 7px', whiteSpace: 'nowrap' }}>
                  {45 - Math.round(currentDSO)}d ahead
                </span>
              )}
              {dsoChange < 0 && (
                <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                  · ↓{Math.abs(dsoChange)}d = {fmtK(Math.abs(dsoChange) * Math.round(data.annualRevenue / 365))} freed
                  <SourceTag label="Working capital freed = DSO improvement (days) × (Annual Revenue ÷ 365). Represents cash that was previously tied up in the collection cycle and is now available sooner." />
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          {!isMobile && <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />}

          {/* Right — stat grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 8 : 10, alignContent: 'center' }}>

            {/* Projected if overdue cleared */}
            {overdueInvs.length > 0 ? (
              <StatCard
                label="If overdue resolved"
                value={`${projectedDSO}d`}
                sub={`↓ ${projectedImprove} more days this week`}
                color="#22c55e"
                onClick={() => setDrill({
                  title: 'Overdue Invoices — DSO Impact',
                  subtitle: 'Resolving these would improve your DSO this week',
                  source: "Expected receipt dates adjusted for each customer's historical avg days-to-pay.",
                  filename: `overdue_dso_impact_${data.name.replace(/\s/g,'_')}`,
                  columns: INV_COLS,
                  rows: overdueInvs,
                })}
                clickable
              />
            ) : (
              <StatCard label="Overdue" value="None" sub="All invoices current" color="#22c55e" />
            )}

            {/* Best possible DSO */}
            <StatCard
              label="Best possible DSO"
              value={`${bpdso}d`}
              sub={dsoGapDays > 0 ? `${dsoGapDays}d gap = ${fmtK(dsoGapDollars)} recoverable` : 'At optimal efficiency'}
              color="var(--teal)"
              clickable
              onClick={() => { setActionPlanSort('dsoImpact'); setActiveTab('action'); }}
            />

          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 940, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
          {activeTab === 'overview'   && <ClientOverview data={data} clientId={session.clientId} currentDSO={currentDSO} dsoChange={dsoChange} bpdso={bpdso} dsoGapDollars={dsoGapDollars} onNavigate={setActiveTab} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'customers'  && <ClientReminders data={data} clientId={session.clientId} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'estimates'  && <ComingSoon title="Estimates" note="Generate estimates, send them for customer approval, and collect deposits once approved. Building this next." />}
          {activeTab === 'invoices'   && <ClientInvoices invoices={data.invoices} paymentBehavior={data.paymentBehavior} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'invoiceai'  && <ClientInvoiceAI data={data} clientId={session.clientId} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'cashapp'    && <ClientCashApplication data={data} clientId={session.clientId} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'activities' && <ComingSoon title="Activities" note="A running log of everything LunarLogic and your team have done — reminders sent, calls logged, promises recorded, payments applied. Building this next." />}
          {activeTab === 'action'     && <ClientActionPlan invoices={data.invoices} paymentBehavior={data.paymentBehavior} payments={data.payments} currentDSO={currentDSO} preLiveDSO={data.preLiveDSO} annualRevenue={data.annualRevenue} bpdso={bpdso} dsoGapDays={dsoGapDays} dsoGapDollars={dsoGapDollars} initialSort={actionPlanSort} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'report'     && <ClientReportCard data={data} clientId={session.clientId} currentDSO={currentDSO} isMobile={isMobile} onDrill={setDrill} />}
          {activeTab === 'cashflow'   && <ClientCashForecast invoices={data.invoices} paymentBehavior={data.paymentBehavior} annualRevenue={data.annualRevenue} payments={data.payments} isLive={data.isLive} wf3Connected={data.automationStatus?.wf3?.connected === true} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'settings'   && <ClientSettings data={data} clientId={session.clientId} isMobile={isMobile} />}
        </div>
      </div>

      </div>{/* /main column */}

      {/* AI assistant — always available */}
      {!assistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          title="Ask the AR assistant"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
            borderRadius: 24, border: '1px solid var(--teal)', background: 'var(--bg-card)',
            color: 'var(--teal)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M2 3.5h12v8H6.5L3 15v-3.5H2z" /></svg> Ask AI
        </button>
      )}
      {assistantOpen && (
        <AIAssistant data={data} currentDSO={currentDSO} clientId={session.clientId} isLive={data.isLive} onClose={() => setAssistantOpen(false)} />
      )}

      <DrillDrawer drill={drill} onClose={() => setDrill(null)} />
      {actionInv && (
        <CustomerPanel
          inv={actionInv}
          allInvoices={data.invoices}
          paymentBehavior={data.paymentBehavior}
          payments={data.payments}
          companyName={data.name}
          clientId={session.clientId}
          isLive={data.isLive}
          onClose={() => setActionInv(null)}
        />
      )}
    </div>
  );
}

function NavItem({ item, active, badge = 0, compact, onClick }) {
  return (
    <button onClick={onClick} title={compact ? item.label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      textAlign: 'left', justifyContent: compact ? 'center' : 'flex-start', position: 'relative',
      padding: compact ? '9px 0' : '8px 10px', borderRadius: 8, cursor: 'pointer', border: 'none',
      background: active ? 'rgba(0,212,232,0.12)' : 'none',
      color: active ? 'var(--teal)' : 'var(--text-dim)',
      fontSize: 13, fontWeight: active ? 700 : 500, transition: 'background 0.1s, color 0.1s',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}>
      <NavIcon name={item.icon} />
      {!compact && <span style={{ flex: 1 }}>{item.label}</span>}
      {!compact && badge > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 10, padding: '1px 6px', lineHeight: 1.6 }}>{badge}</span>}
      {!compact && item.soon && <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Soon</span>}
      {compact && badge > 0 && <span style={{ position: 'absolute', top: 4, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />}
    </button>
  );
}

function ComingSoon({ title, note }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '44px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>{note}</div>
      <div style={{ marginTop: 16, display: 'inline-block', fontSize: 10, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.1)', border: '1px solid rgba(0,212,232,0.3)', borderRadius: 20, padding: '4px 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>In progress</div>
    </div>
  );
}

function StatCard({ label, value, sub, color, onClick, clickable, span }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 12px',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color 0.12s, background 0.12s',
        gridColumn: span ? '1 / -1' : undefined,
      }}
      onMouseEnter={e => { if (clickable) { e.currentTarget.style.borderColor = `${color}50`; e.currentTarget.style.background = `${color}08`; } }}
      onMouseLeave={e => { if (clickable) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; } }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: -0.5, lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{sub}</div>
      {clickable && <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>tap to view invoices</div>}
    </div>
  );
}

// Shared column definitions used across all drill views
export const INV_COLS = [
  { key: 'id',          label: 'Invoice' },
  { key: 'customer',    label: 'Customer' },
  { key: 'amount',      label: 'Amount',       render: v => `$${v.toLocaleString()}`, csvVal: row => row.amount },
  { key: 'issued',      label: 'Issued' },
  { key: 'due',         label: 'Due Date' },
  { key: 'status',      label: 'Status' },
  { key: 'daysOverdue', label: 'Days Overdue',  render: v => v > 0 ? `${v}d` : '—',  csvVal: row => row.daysOverdue > 0 ? row.daysOverdue : '' },
];
