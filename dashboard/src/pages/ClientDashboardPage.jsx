import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { logout } from '../lib/auth';
import { getClientData } from '../data/mockData';
import { getClientAPData } from '../data/apData';
import { fetchDashboardData } from '../lib/quickbooks';
import { useMobile } from '../lib/useMobile';
import DrillDrawer from '../components/DrillDrawer';
import CustomerPanel from '../components/client/CustomerPanel';
import ClientOverview from '../components/client/ClientOverview';
import ClientCashApplication from '../components/client/ClientCashApplication';
import ClientInvoices from '../components/client/ClientInvoices';
import ClientReportCard from '../components/client/ClientReportCard';
import ClientCashForecast from '../components/client/ClientCashForecast';
import ClientSettings from '../components/client/ClientSettings';
import ClientCustomers from '../components/client/ClientCustomers';
import ClientSubscriptions from '../components/client/ClientSubscriptions';
import ClientEstimates from '../components/client/ClientEstimates';
import ClientActivities from '../components/client/ClientActivities';
import ClientReminders from '../components/client/ClientReminders';
import ClientPayablesOverview from '../components/client/ClientPayablesOverview';
import ClientBills from '../components/client/ClientBills';
import ClientApprovals from '../components/client/ClientApprovals';
import ClientPaymentSchedule from '../components/client/ClientPaymentSchedule';
import ClientVendors from '../components/client/ClientVendors';
import ClientFullSuite from '../components/client/ClientFullSuite';
import SuiteSwitcher from '../components/client/SuiteSwitcher';
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

// Left-sidebar navigation, split by suite. LunarLogic runs both sides of the
// ledger: Receivables (AR), Payables (AP), and the combined Full Suite view.
const AR_NAV = [
  { id: 'overview',    label: 'Dashboard',    icon: 'grid' },
  { id: 'customers',   label: 'Customers',    icon: 'users' },
  { id: 'estimates',   label: 'Estimates',    icon: 'file' },
  { id: 'invoices',    label: 'Invoices',     icon: 'fileText' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'repeat' },
  { id: 'reminders',   label: 'Reminders',    icon: 'bell' },
  { id: 'cashapp',     label: 'Payments',     icon: 'card' },
  { id: 'activities',  label: 'Activities',   icon: 'activity' },
  { id: 'report',      label: 'Reports',      icon: 'bars' },
  { id: 'cashflow',    label: 'Cash Flow',    icon: 'trend' },
];
const AP_NAV = [
  { id: 'ap_overview',  label: 'AP Dashboard', icon: 'grid' },
  { id: 'ap_bills',     label: 'Bills',        icon: 'fileText' },
  { id: 'ap_approvals', label: 'Approvals',    icon: 'check' },
  { id: 'ap_payments',  label: 'Payments',     icon: 'card' },
  { id: 'ap_vendors',   label: 'Vendors',      icon: 'users' },
];
const FULL_NAV = [
  { id: 'full',         label: 'Cash Cycle',   icon: 'trend' },
];
const NAV_SETTINGS = { id: 'settings', label: 'Settings', icon: 'cog' };

// Per-suite config: nav list, landing tab, the mobile bottom-bar tabs, plus
// the identity used by the suite switcher (code badge, one-line context, and
// an accent colour that carries through the nav so you always know where you
// are). AR = blue, AP = indigo, Full Suite = green (the combined/net view).
const SUITES = {
  ar:   { label: 'Receivables', short: 'AR',   code: 'AR', sublabel: 'Money in · get paid faster',   accent: '#60A5FA', nav: AR_NAV,   home: 'overview',    bottom: ['overview', 'invoices', 'customers', 'cashapp'] },
  ap:   { label: 'Payables',    short: 'AP',   code: 'AP', sublabel: 'Money out · pay on purpose',    accent: '#818CF8', nav: AP_NAV,   home: 'ap_overview', bottom: ['ap_overview', 'ap_bills', 'ap_approvals', 'ap_payments'] },
  full: { label: 'Full Suite',  short: 'Full', code: 'FS', sublabel: 'Both sides · cash conversion',  accent: '#34D399', nav: FULL_NAV, home: 'full',        bottom: ['full'] },
};
const SUITE_ORDER = ['ar', 'ap', 'full'];
const HOME_TAB = SUITES.ar.home;

const ALL_NAV = [...AR_NAV, ...AP_NAV, ...FULL_NAV, NAV_SETTINGS];
const NAV_BY_ID = Object.fromEntries(ALL_NAV.map(n => [n.id, n]));
const BOTTOM_LABEL = {
  overview: 'Dashboard', invoices: 'Invoices', customers: 'Customers', cashapp: 'Payments',
  ap_overview: 'AP', ap_bills: 'Bills', ap_approvals: 'Approvals', ap_payments: 'Payments',
  full: 'Cash Cycle',
};

function NavIcon({ name }) {
  const p = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M17 3.13a4 4 0 010 7.75',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
    fileText: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6',
    bolt: 'M13 2L4 14h6v8l9-12h-6z',
    card: 'M2 5h20v14H2zM2 10h20',
    bell: 'M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    check: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    bars: 'M12 20V10M18 20V4M6 20v-4',
    trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3',
    cog: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 2h-4l-.3 2.6a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.3 2.6h4l.3-2.6a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6a7 7 0 00.1-1z',
  }[name] || '';
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={p} /></svg>;
}

export default function ClientDashboardPage({ session, onLogout }) {
  const [suite, setSuite]         = useState('ar');
  const [activeTab, setActiveTab] = useState(HOME_TAB);
  const [drill, setDrill]         = useState(null);
  const [actionInv, setActionInv] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isMobile = useMobile();
  const base = useMemo(() => getClientData(session.clientId), [session.clientId]);
  const ap = useMemo(() => getClientAPData(session.clientId), [session.clientId]);

  // Switch suite (Receivables / Payables / Full Suite) and land on its home tab.
  const switchSuite = useCallback((next) => {
    setSuite(next);
    setActiveTab(SUITES[next].home);
    setMoreOpen(false);
  }, []);
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

  // Payables (AP) hero metric — DPO. Unlike DSO, the goal is a controlled
  // number inside the target sweet spot, not the lowest.
  const currentDPO = ap.currentDPO;
  const dpoInBand  = currentDPO >= 26 && currentDPO <= 34;
  const dpoLabel   = currentDPO < 26 ? 'Paying too early' : currentDPO > 34 ? 'Slipping past terms' : 'On target';
  const dpoColor   = dpoInBand ? '#22c55e' : currentDPO < 26 ? '#f59e0b' : '#f97316';

  // The nav list and mobile bottom tabs follow the active suite.
  const activeSuite  = SUITES[suite];
  const suiteNav     = activeSuite.nav;
  const suiteAccent  = activeSuite.accent;
  const bottomIds    = activeSuite.bottom;
  const moreIds      = [...suiteNav.map(n => n.id).filter(id => !bottomIds.includes(id)), 'settings'];
  // Options for the suite switcher (both sidebar and topbar variants).
  const suiteItems   = SUITE_ORDER.map(id => ({ id, label: SUITES[id].label, sublabel: SUITES[id].sublabel, code: SUITES[id].code, accent: SUITES[id].accent }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>

      {/* Left sidebar — desktop only (mobile uses the bottom tab bar) */}
      {!isMobile && (
      <aside style={{
        width: 208, flexShrink: 0, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '14px 12px',
        position: 'sticky', top: 0, height: '100vh', alignSelf: 'flex-start',
      }}>
        <div className="sidebar-wordmark" onClick={() => setActiveTab(HOME_TAB)} title="Go to home (Action Plan)" style={{ fontSize: 16, padding: isMobile ? '4px 0 14px' : '4px 8px 14px', display: 'flex', alignItems: 'center', gap: 7, justifyContent: isMobile ? 'center' : 'flex-start', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#moonGradientSb)">
            <defs><linearGradient id="moonGradientSb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#818CF8" /></linearGradient></defs>
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
          {!isMobile && <span className="sidebar-wordmark-name"><span className="sidebar-wordmark-text">lunarlogic</span><span className="sidebar-wordmark-suffix">.ai</span></span>}
        </div>

        {/* Suite switcher — Receivables / Payables / Full Suite */}
        <SuiteSwitcher current={suite} items={suiteItems} onSwitch={switchSuite} variant="sidebar" />

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          {suiteNav.map(n => (
            <NavItem key={n.id} item={n} active={activeTab === n.id} accent={suiteAccent} badge={n.id === 'overview' ? urgentCount : n.id === 'ap_approvals' ? ap.counts.review : 0}
              compact={isMobile} onClick={() => setActiveTab(n.id)} />
          ))}
        </nav>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
          <NavItem item={NAV_SETTINGS} active={activeTab === 'settings'} compact={false} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>
      )}

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: `0 ${isMobile ? 16 : 24}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {isMobile && (
            <svg onClick={() => setActiveTab(HOME_TAB)} width="20" height="20" viewBox="0 0 24 24" fill="url(#moonGradientTop)" style={{ flexShrink: 0, cursor: 'pointer' }}>
              <defs><linearGradient id="moonGradientTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#818CF8" /></linearGradient></defs>
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
            </svg>
          )}
          {!isMobile && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{data.name}</div>}
          {!isMobile && <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />}
          {/* Persistent, always-visible indicator of (and control for) the active suite */}
          <SuiteSwitcher current={suite} items={suiteItems} onSwitch={switchSuite} variant="topbar" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {!isMobile && lastUpdated && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Updated {timeAgo(lastUpdated, now)} · {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
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

      {/* AP Hero — DPO + band (AP Dashboard tab only) */}
      {activeTab === 'ap_overview' && (
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: isMobile ? '14px 16px' : '14px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', gap: isMobile ? 14 : 20 }}>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 4 }}>
              Days Payable Outstanding
              <SourceTag label="Days Payable Outstanding: average days between receiving a bill and paying it. Formula: (Total AP ÷ annual purchases) × 365. The goal is a controlled number in the target band (≈28–32d) matched to terms — not the lowest possible." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: isMobile ? 44 : 52, fontWeight: 900, color: 'var(--teal)', lineHeight: 1, letterSpacing: -3 }}>{Math.round(currentDPO)}</span>
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, display: 'block', marginBottom: 4 }}>days</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: dpoColor, background: `${dpoColor}18`, border: `1px solid ${dpoColor}35`, borderRadius: 20, padding: '2px 9px', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{dpoLabel}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>Was {ap.preLiveDPO}d</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>·</span>
              <span style={{ fontSize: 10, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>{ap.targetDPO}d</span> target
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>·</span>
              <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>
                +{ap.targetDPO - ap.preLiveDPO}d controlled float
              </span>
            </div>
          </div>

          {!isMobile && <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />}

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 8 : 10, alignContent: 'center' }}>
            <StatCard label="Total payables" value={fmtK(ap.totalPayable)} sub={`${ap.bills.filter(b => b.status !== 'paid').length} open bills`} color="var(--text)" />
            <StatCard label="Discounts available" value={fmtK(ap.discountsAvailable)} sub="early-pay, still in window" color="#22c55e" clickable hint="tap to view schedule" onClick={() => setActiveTab('ap_payments')} />
          </div>
        </div>
      </div>
      )}

      {/* Hero — DSO + stat grid (Dashboard tab only) */}
      {activeTab === 'overview' && (
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
              clickable={overdueInvs.length > 0}
              hint="tap to view overdue"
              onClick={overdueInvs.length > 0 ? () => setDrill({
                title: 'Recoverable DSO — Overdue Invoices',
                subtitle: `${dsoGapDays}d gap = ${fmtK(dsoGapDollars)} recoverable`,
                source: 'Overdue invoices ranked by value — collecting these compresses DSO toward best-in-class.',
                filename: `recoverable_dso_${data.name.replace(/\s/g, '_')}`,
                columns: INV_COLS,
                rows: overdueInvs,
              }) : undefined}
            />

          </div>
        </div>
      </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 940, margin: '0 auto', padding: isMobile ? '16px 16px 88px' : '24px' }}>
          {activeTab === 'overview'   && <ClientOverview data={data} clientId={session.clientId} currentDSO={currentDSO} dsoChange={dsoChange} bpdso={bpdso} dsoGapDollars={dsoGapDollars} onNavigate={setActiveTab} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'customers'  && <ClientCustomers data={data} clientId={session.clientId} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'estimates'  && <ClientEstimates data={data} />}
          {activeTab === 'invoices'   && <ClientInvoices data={data} clientId={session.clientId} invoices={data.invoices} paymentBehavior={data.paymentBehavior} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'subscriptions' && <ClientSubscriptions data={data} />}
          {activeTab === 'reminders'  && <ClientReminders data={data} clientId={session.clientId} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'cashapp'    && <ClientCashApplication data={data} clientId={session.clientId} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'activities' && <ClientActivities data={data} clientId={session.clientId} onAction={setActionInv} onDrill={setDrill} />}
          {activeTab === 'report'     && <ClientReportCard data={data} clientId={session.clientId} currentDSO={currentDSO} isMobile={isMobile} onDrill={setDrill} />}
          {activeTab === 'cashflow'   && <ClientCashForecast invoices={data.invoices} paymentBehavior={data.paymentBehavior} annualRevenue={data.annualRevenue} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
          {activeTab === 'settings'   && <ClientSettings data={data} clientId={session.clientId} isMobile={isMobile} />}

          {/* Payables (AP) suite */}
          {activeTab === 'ap_overview'  && <ClientPayablesOverview ap={ap} currentDPO={currentDPO} isMobile={isMobile} onNavigate={setActiveTab} />}
          {activeTab === 'ap_bills'     && <ClientBills ap={ap} isMobile={isMobile} />}
          {activeTab === 'ap_approvals' && <ClientApprovals ap={ap} isMobile={isMobile} />}
          {activeTab === 'ap_payments'  && <ClientPaymentSchedule ap={ap} isMobile={isMobile} />}
          {activeTab === 'ap_vendors'   && <ClientVendors ap={ap} isMobile={isMobile} />}

          {/* Full Suite — combined AR + AP */}
          {activeTab === 'full'         && <ClientFullSuite data={data} ap={ap} currentDSO={currentDSO} currentDPO={currentDPO} isMobile={isMobile} onNavigate={id => (id === 'ar' || id === 'ap' || id === 'full') ? switchSuite(id) : setActiveTab(id)} />}
        </div>
      </div>

      </div>{/* /main column */}

      {/* AI assistant — AR suite only (its context + answer engine are AR-scoped) */}
      {suite === 'ar' && !assistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          title="Ask the AR assistant"
          style={{
            position: 'fixed', bottom: isMobile ? 74 : 20, right: isMobile ? 14 : 20, zIndex: 1000,
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
            borderRadius: 24, border: '1px solid var(--teal)', background: 'var(--bg-card)',
            color: 'var(--teal)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M2 3.5h12v8H6.5L3 15v-3.5H2z" /></svg> Ask AI
        </button>
      )}
      {suite === 'ar' && assistantOpen && (
        <AIAssistant data={data} currentDSO={currentDSO} clientId={session.clientId} isLive={data.isLive} onClose={() => setAssistantOpen(false)} />
      )}

      {/* Mobile bottom tab bar + More sheet */}
      {isMobile && (
        <>
          {moreOpen && (
            <>
              <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1150 }} />
              <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1151, background: '#151E31', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '10px 12px calc(16px + env(safe-area-inset-bottom))', maxHeight: '72vh', overflowY: 'auto', boxShadow: '0 -8px 30px rgba(0,0,0,0.4)' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '4px auto 14px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {moreIds.map(id => {
                    const item = NAV_BY_ID[id];
                    const active = activeTab === id;
                    return (
                      <button key={id} onClick={() => { setActiveTab(id); setMoreOpen(false); }} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '13px 4px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${active ? suiteAccent : 'var(--border)'}`, background: active ? `${suiteAccent}1a` : 'var(--bg)', color: active ? suiteAccent : 'var(--text-dim)',
                      }}>
                        <NavIcon name={item.icon} />
                        <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1100, height: 60, background: '#151E31', borderTop: '1px solid var(--border)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 20px rgba(0,0,0,0.35)' }}>
            {bottomIds.map(id => {
              const item = NAV_BY_ID[id];
              const active = activeTab === id && !moreOpen;
              return (
                <button key={id} onClick={() => { setActiveTab(id); setMoreOpen(false); }} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: 'none', border: 'none', cursor: 'pointer', color: active ? suiteAccent : 'var(--muted)', position: 'relative',
                }}>
                  <NavIcon name={item.icon} />
                  <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500 }}>{BOTTOM_LABEL[id]}</span>
                  {id === 'overview' && urgentCount > 0 && <span style={{ position: 'absolute', top: 7, right: 'calc(50% - 17px)', width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />}
                </button>
              );
            })}
            <button onClick={() => setMoreOpen(v => !v)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', color: (moreOpen || moreIds.includes(activeTab)) ? suiteAccent : 'var(--muted)',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>
              <span style={{ fontSize: 9.5, fontWeight: (moreOpen || moreIds.includes(activeTab)) ? 700 : 500 }}>More</span>
            </button>
          </nav>
        </>
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

function NavItem({ item, active, badge = 0, compact, onClick, accent = 'var(--teal)' }) {
  return (
    <button onClick={onClick} title={compact ? item.label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      textAlign: 'left', justifyContent: compact ? 'center' : 'flex-start', position: 'relative',
      padding: compact ? '9px 0' : '8px 10px', borderRadius: 8, cursor: 'pointer', border: 'none',
      background: active ? `${accent}1f` : 'none',
      color: active ? accent : 'var(--text-dim)',
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

function StatCard({ label, value, sub, color, onClick, clickable, span, hint = 'tap to view invoices' }) {
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
      {clickable && <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>{hint}</div>}
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
