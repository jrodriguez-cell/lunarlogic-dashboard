import { useState, useMemo, useEffect } from 'react';
import { logout } from '../lib/auth';
import { getClientData } from '../data/mockData';
import { fetchDashboardData } from '../lib/quickbooks';
import { useMobile } from '../lib/useMobile';
import DrillDrawer from '../components/DrillDrawer';
import CustomerPanel from '../components/client/CustomerPanel';
import ClientOverview from '../components/client/ClientOverview';
import ClientActionPlan from '../components/client/ClientActionPlan';
import ClientCashForecast from '../components/client/ClientCashForecast';
import ClientInvoices from '../components/client/ClientInvoices';
import ClientReportCard from '../components/client/ClientReportCard';
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

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'action',   label: 'Action Plan' },
  { id: 'cash',     label: 'Cash In' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'report',   label: 'Report Card' },
];

export default function ClientDashboardPage({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [drill, setDrill]         = useState(null);
  const [actionInv, setActionInv] = useState(null);
  const [actionPlanSort, setActionPlanSort] = useState(null);
  const isMobile = useMobile();
  const base = useMemo(() => getClientData(session.clientId), [session.clientId]);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    setLiveData(null);
    let cancelled = false;
    fetchDashboardData(session.clientId).then(d => { if (!cancelled) setLiveData(d); });
    return () => { cancelled = true; };
  }, [session.clientId]);

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)' }}>

      {/* Topbar */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: `0 ${isMobile ? 16 : 24}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--teal)', letterSpacing: -0.3, flexShrink: 0 }}>LunarLogic</div>
          <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {!isMobile && <div style={{ fontSize: 11, color: 'var(--muted)' }}>As of June 11, 2026</div>}
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

      {/* Tab nav */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', padding: isMobile ? '0 4px' : '0 24px', minWidth: 'max-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: isMobile ? '10px 14px' : '12px 20px',
              fontSize: isMobile ? 12 : 13,
              fontWeight: activeTab === t.id ? 700 : 400,
              color: activeTab === t.id ? 'var(--teal)' : 'var(--muted)',
              borderBottom: activeTab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
              background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer',
              transition: 'color 0.12s', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              {t.id === 'action' && urgentCount > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 10, padding: '1px 6px', lineHeight: 1.6 }}>{urgentCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        {activeTab === 'overview' && <ClientOverview data={data} currentDSO={currentDSO} dsoChange={dsoChange} onNavigate={setActiveTab} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
        {activeTab === 'action'   && <ClientActionPlan invoices={data.invoices} paymentBehavior={data.paymentBehavior} payments={data.payments} currentDSO={currentDSO} preLiveDSO={data.preLiveDSO} annualRevenue={data.annualRevenue} bpdso={bpdso} dsoGapDays={dsoGapDays} dsoGapDollars={dsoGapDollars} initialSort={actionPlanSort} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
        {activeTab === 'cash'     && <ClientCashForecast invoices={data.invoices} paymentBehavior={data.paymentBehavior} annualRevenue={data.annualRevenue} payments={data.payments} isLive={data.isLive} wf3Connected={data.automationStatus?.wf3?.connected === true} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
        {activeTab === 'invoices' && <ClientInvoices invoices={data.invoices} paymentBehavior={data.paymentBehavior} isMobile={isMobile} onDrill={setDrill} onAction={setActionInv} />}
        {activeTab === 'report'   && <ClientReportCard data={data} clientId={session.clientId} currentDSO={currentDSO} isMobile={isMobile} onDrill={setDrill} />}
      </div>

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
