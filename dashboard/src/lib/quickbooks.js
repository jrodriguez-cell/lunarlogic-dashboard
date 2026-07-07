import { getClientData } from '../data/mockData';
import { authedFetch } from './api';

// Clients with a live QuickBooks connection (token seeded via /api/qb-auth-connect).
// Everything else still runs on mock data until onboarded the same way.
const LIVE_CLIENTS = new Set(['qbsandbox']);

// ERP-agnostic data layer. DSO formula: (Total AR / Total Revenue last 90 days) * 90
export async function fetchDashboardData(clientId) {
  const client = getClientData(clientId);

  if (!LIVE_CLIENTS.has(clientId)) {
    return mockShape(client);
  }

  try {
    // No clientId in the URL — the server resolves it from the verified session
    // token attached by authedFetch, so the browser can't request another
    // client's data.
    const [dashRes, statusRes] = await Promise.all([
      authedFetch(`/api/dashboard-data`),
      authedFetch(`/api/automation-status`).catch(() => null),
    ]);
    if (!dashRes.ok) throw new Error(`dashboard-data request failed: ${dashRes.status}`);
    const live = await dashRes.json();
    // automation-status is best-effort — if it fails, automationStatus stays
    // undefined and every component falls back to its honest "not connected" state.
    const automationStatus = statusRes?.ok ? await statusRes.json() : undefined;

    // Only attach a `reminders` field when WF2 telemetry is actually
    // connected — components check `reminders !== undefined` to decide
    // whether to trust reminder-derived claims, so an always-present empty
    // array would silently defeat that honesty check.
    const remindersByInvoice = automationStatus?.wf2?.byInvoice ?? {};
    const invoices = live.invoices.map(inv => {
      const base = { ...inv, daysOverdue: inv.status === 'Overdue' ? inv.daysOut : 0, origin: 'live_qb' };
      if (automationStatus?.wf2?.connected) {
        base.reminders = (remindersByInvoice[inv.id] ?? []).filter(r => r.skipReason === '' || r.skipReason == null);
      }
      return base;
    });

    const payments = automationStatus?.wf3?.connected ? automationStatus.wf3.appliedPayments : [];

    return {
      clientName:           client.name,
      industry:             client.industry,
      dsoTrend:             live.dsoTrend,
      arAging:              live.arAging,
      invoices,
      paymentBehavior:      live.paymentBehavior,
      goLiveDate:           live.goLiveDate,
      annualRevenue:        live.annualRevenue,
      collectionEfficiency: live.collectionEfficiency,
      automationStatus,
      // preLiveDSO has no real baseline (sandbox never had an actual go-live
      // transition) — still honestly unavailable.
      preLiveDSO:           null,
      automationStats:      null,
      payments,
      isLive:               true,
    };
  } catch (err) {
    console.error(`Live QB fetch failed for client "${clientId}", falling back to mock data:`, err);
    return mockShape(client);
  }
}

function mockShape(client) {
  return {
    clientName:           client.name,
    industry:             client.industry,
    dsoTrend:             client.dsoTrend,
    arAging:              client.arAging,
    invoices:             client.invoices,
    paymentBehavior:      client.paymentBehavior,
    goLiveDate:           client.goLiveDate,
    annualRevenue:        client.annualRevenue,
    preLiveDSO:           client.preLiveDSO,
    collectionEfficiency: client.collectionEfficiency,
    automationStats:      client.automationStats,
    payments:             client.payments,
    isLive:               false,
  };
}
