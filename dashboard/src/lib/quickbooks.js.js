/**
 * Dashboard API Client
 * Calls Vercel serverless functions instead of mock data
 */

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://lunarlogic-dashboard.vercel.app'
  : 'http://localhost:3000';

/**
 * Fetch all dashboard data from Vercel API
 * Replaces mock data with live QuickBooks data
 */
export async function fetchDashboardData() {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    throw error;
  }
}

/**
 * Send payment reminder for an invoice
 * @param {string} invoiceId - QuickBooks invoice ID
 * @returns {Promise} Success confirmation
 */
export async function sendReminder(invoiceId) {
  try {
    const response = await fetch(`${API_BASE}/api/send-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice_id: invoiceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reminder');
    }

    return response.json();
  } catch (error) {
    console.error('Failed to send reminder:', error);
    throw error;
  }
}
