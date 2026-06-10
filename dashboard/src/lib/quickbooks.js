import { getClientData } from '../data/mockData';

// ERP-agnostic data layer — replace this function body with live ERP connector calls.
// Supports any accounting system via REST API adapter (NetSuite, SAP, Dynamics, etc.).
// DSO formula: (Total AR / Total Revenue last 90 days) * 90
export async function fetchDashboardData(clientId) {
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
