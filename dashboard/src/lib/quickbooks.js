import { getClientData } from '../data/mockData';

/**
 * Fetch dashboard data from the Vercel API, which queries QuickBooks live.
 * Falls back to mock data if the API is unreachable or returns an error
 * (e.g. during local dev without env vars set).
 */
export async function fetchDashboardData(clientId) {
  try {
    const res = await fetch('/api/dashboard-data');

    if (!res.ok) {
      console.warn(`Dashboard API returned ${res.status} — falling back to mock data`);
      return getMockData(clientId);
    }

    const live = await res.json();

    // Merge live QB data with static client metadata from mock
    const meta = getClientData(clientId);
    return {
      clientName:           meta.name,
      industry:             meta.industry,
      preLiveDSO:           meta.preLiveDSO,
      collectionEfficiency: meta.collectionEfficiency,
      payments:             meta.payments,  // WF3 mock until Plaid is live
      // Live from QuickBooks:
      dsoTrend:             live.dsoTrend,
      arAging:              live.arAging,
      invoices:             live.invoices,
      paymentBehavior:      live.paymentBehavior,
      goLiveDate:           live.goLiveDate,
    };
  } catch (err) {
    console.warn('Dashboard API unreachable — falling back to mock data:', err.message);
    return getMockData(clientId);
  }
}

function getMockData(clientId) {
  const client = getClientData(clientId);
  return {
    clientName:           client.name,
    industry:             client.industry,
    dsoTrend:             client.dsoTrend,
    arAging:              client.arAging,
    invoices:             client.invoices,
    paymentBehavior:      client.paymentBehavior,
    goLiveDate:           client.goLiveDate,
    preLiveDSO:           client.preLiveDSO,
    collectionEfficiency: client.collectionEfficiency,
    payments:             client.payments,
  };
}
