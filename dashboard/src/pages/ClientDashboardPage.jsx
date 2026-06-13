import { useState, useMemo } from 'react';
import { logout } from '../lib/auth';
import { getClientData } from '../data/mockData';
import ClientOverview from '../components/client/ClientOverview';
import ClientActionPlan from '../components/client/ClientActionPlan';
import ClientCashForecast from '../components/client/ClientCashForecast';
import ClientInvoices from '../components/client/ClientInvoices';

const TABS = [
  { id: 'overview',  label: 'My AR Health' },
  { id: 'action',    label: 'Action Plan' },
  { id: 'cash',      label: 'Cash Coming In' },
  { id: 'invoices',  label: 'Invoice Status' },
];

export default function ClientDashboardPage({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const data = useMemo(() => getClientData(session.clientId), [session.clientId]);

  function handleLogout() {
    logout();
    onLogout();
  }

  const currentDSOEntry = data.dsoTrend[data.dsoTrend.length - 1];
  const currentDSO = currentDSOEntry?.dso ?? 0;
  const dsoChange = Math.round(currentDSO - data.preLiveDSO);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)' }}>
      {/* Topbar */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--teal)', letterSpacing: -0.3 }}>LunarLogic</div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{data.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>As of June 11, 2026</div>
          <button
            onClick={handleLogout}
            style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}
          >Sign out</button>
        </div>
      </div>

      {/* DSO Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(0,212,232,0.06) 0%, rgba(0,212,232,0.02) 100%)', borderBottom: '1px solid var(--border)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Days Sales Outstanding</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: 'var(--teal)', lineHeight: 1, letterSpacing: -2 }}>{Math.round(currentDSO)}</span>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>days</span>
              <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>
                ↓ {Math.abs(dsoChange)} days since LunarLogic
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Was {data.preLiveDSO} days before go-live · {data.goLiveDate}</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <DSOMiniChart trend={data.dsoTrend} goLiveDate={data.goLiveDate} preLiveDSO={data.preLiveDSO} />
          </div>
          <ProjectedDSO invoices={data.invoices} currentDSO={currentDSO} preLiveDSO={data.preLiveDSO} />
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 900, margin: '0 auto' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '12px 20px', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
                color: activeTab === t.id ? 'var(--teal)' : 'var(--muted)',
                borderBottom: activeTab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
                background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer',
                transition: 'color 0.12s',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        {activeTab === 'overview'  && <ClientOverview data={data} currentDSO={currentDSO} dsoChange={dsoChange} onNavigate={setActiveTab} />}
        {activeTab === 'action'    && <ClientActionPlan invoices={data.invoices} paymentBehavior={data.paymentBehavior} currentDSO={currentDSO} preLiveDSO={data.preLiveDSO} />}
        {activeTab === 'cash'      && <ClientCashForecast invoices={data.invoices} paymentBehavior={data.paymentBehavior} />}
        {activeTab === 'invoices'  && <ClientInvoices invoices={data.invoices} paymentBehavior={data.paymentBehavior} />}
      </div>
    </div>
  );
}

function DSOMiniChart({ trend, goLiveDate, preLiveDSO }) {
  const W = 260, H = 48;
  if (!trend?.length) return null;
  const vals = trend.map(p => p.dso);
  const min = Math.min(...vals) - 2;
  const max = Math.max(...vals) + 2;
  const pts = trend.map((p, i) => {
    const x = (i / (trend.length - 1)) * W;
    const y = H - ((p.dso - min) / (max - min)) * H;
    return `${x},${y}`;
  }).join(' ');
  const goLiveIdx = trend.findIndex(p => p.date >= goLiveDate);
  const glX = goLiveIdx >= 0 ? (goLiveIdx / (trend.length - 1)) * W : null;
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke="var(--teal)" strokeWidth="1.5" strokeOpacity="0.7" />
      {glX !== null && (
        <>
          <line x1={glX} y1={0} x2={glX} y2={H} stroke="var(--teal)" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.5" />
          <text x={glX + 4} y={10} fontSize={8} fill="var(--teal)" opacity={0.7}>Go-live</text>
        </>
      )}
    </svg>
  );
}

function ProjectedDSO({ invoices, currentDSO, preLiveDSO }) {
  const overdue = invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 0);
  const totalAR = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
  const overdueAR = overdue.reduce((s, i) => s + i.amount, 0);
  const pct = totalAR > 0 ? overdueAR / totalAR : 0;
  const projected = Math.max(Math.round(currentDSO * (1 - pct * 0.6)), Math.round(currentDSO * 0.75));
  const improvement = Math.round(currentDSO - projected);
  if (overdue.length === 0) return null;
  return (
    <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 16px', minWidth: 180 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>If overdue resolved this week</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--green)', lineHeight: 1, letterSpacing: -1 }}>{projected}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>days</span></div>
      <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 4 }}>↓ {improvement} day{improvement !== 1 ? 's' : ''} additional improvement</div>
    </div>
  );
}
