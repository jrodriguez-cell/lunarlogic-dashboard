import { getClientData } from '../data/mockData';

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
    const res = await fetch(`/api/dashboard-data?clientId=${encodeURIComponent(clientId)}`);
    if (!res.ok) throw new Error(`dashboard-data request failed: ${res.status}`);
    const live = await res.json();

    return {
      clientName:           client.name,
      industry:             client.industry,
      dsoTrend:             live.dsoTrend,
      arAging:              live.arAging,
      invoices:             live.invoices.map(inv => ({
        ...inv,
        daysOverdue: inv.status === 'Overdue' ? inv.daysOut : 0,
        origin: 'live_qb',
      })),
      paymentBehavior:      live.paymentBehavior,
      goLiveDate:           live.goLiveDate,
      annualRevenue:        live.annualRevenue,
      collectionEfficiency: live.collectionEfficiency,
      // No real source yet for these — don't fabricate them for a live client.
      // preLiveDSO has no real baseline (sandbox never had an actual go-live
      // transition); automationStats/payments require WF1/2/3 telemetry that
      // isn't wired into this dashboard yet.
      preLiveDSO:           null,
      automationStats:      null,
      payments:             [],
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
