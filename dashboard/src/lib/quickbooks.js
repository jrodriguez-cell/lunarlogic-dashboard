import { dsoTrend, arAging, invoices, paymentBehavior, GO_LIVE_DATE } from '../data/mockData';

// Real QB API integration: replace this function body with live calls.
// QB OAuth tokens live in Google Sheets (see WF1A/1B OAuth refresh pattern).
// Sandbox company ID: 9341456702590433
// Endpoints needed:
//   GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice WHERE Balance > '0'
//   GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice (for DSO calc)
// DSO formula: (Total AR / Total Revenue last 90 days) * 90
export async function fetchDashboardData() {
  return { dsoTrend, arAging, invoices, paymentBehavior, goLiveDate: GO_LIVE_DATE };
}
