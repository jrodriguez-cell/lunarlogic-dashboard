/**
 * Vercel Serverless Function: Dashboard Data
 * GET /api/dashboard-data
 * 
 * Fetches live data from QuickBooks and transforms it into dashboard format
 */

import { qbApiRequest } from './_lib/quickbooks.js';

const GO_LIVE_DATE = '2026-03-17'; // Your actual go-live date

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = req.query.clientId || 'default';

  try {
    // Fetch unpaid invoices (any age) and last 365 days of invoices for
    // trend/revenue/collection calculations
    const [unpaidInvoices, historicalInvoices] = await Promise.all([
      fetchUnpaidInvoices(clientId),
      fetchLast365DaysInvoices(clientId),
    ]);

    // Calculate dashboard metrics
    const dsoTrend = calculateDSOTrend(historicalInvoices);
    const arAging = calculateARAgingBuckets(unpaidInvoices);
    const invoices = formatInvoicesForBoard(unpaidInvoices);
    const paymentBehavior = calculatePaymentBehavior(historicalInvoices);
    const annualRevenue = calculateAnnualRevenue(historicalInvoices);
    const collectionEfficiency = calculateCollectionEfficiency(historicalInvoices);

    // Return data in the format the dashboard expects
    res.status(200).json({
      dsoTrend,
      arAging,
      invoices,
      paymentBehavior,
      annualRevenue,
      collectionEfficiency,
      goLiveDate: GO_LIVE_DATE,
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message,
    });
  }
}

/**
 * Fetch all unpaid invoices from QuickBooks
 */
async function fetchUnpaidInvoices(clientId) {
  const query = encodeURIComponent("SELECT * FROM Invoice WHERE Balance > '0'");
  const response = await qbApiRequest(`/query?query=${query}`, {}, clientId);
  return response.QueryResponse?.Invoice || [];
}

/**
 * Fetch last 365 days of invoices — used for DSO trend (needs lookback
 * beyond 90 days for the rolling window), annual revenue, payment
 * behavior, and collection efficiency calculations.
 */
async function fetchLast365DaysInvoices(clientId) {
  const date365DaysAgo = new Date();
  date365DaysAgo.setDate(date365DaysAgo.getDate() - 365);
  const dateStr = date365DaysAgo.toISOString().split('T')[0];

  const query = encodeURIComponent(`SELECT * FROM Invoice WHERE TxnDate >= '${dateStr}'`);
  const response = await qbApiRequest(`/query?query=${query}`, {}, clientId);
  return response.QueryResponse?.Invoice || [];
}

/**
 * Calculate DSO trend for last 90 days
 * Formula: (Total AR / Total Revenue) * 90
 */
function calculateDSOTrend(allInvoices) {
  const dsoData = [];
  const today = new Date();

  // Group invoices by date
  const invoicesByDate = {};
  allInvoices.forEach((inv) => {
    const date = inv.TxnDate;
    if (!invoicesByDate[date]) {
      invoicesByDate[date] = { revenue: 0, ar: 0 };
    }
    invoicesByDate[date].revenue += parseFloat(inv.TotalAmt || 0);
    invoicesByDate[date].ar += parseFloat(inv.Balance || 0);
  });

  // Calculate DSO for each day in the last 90 days
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Calculate rolling 90-day totals
    let totalRevenue = 0;
    let totalAR = 0;

    // Sum revenue and AR for the 90-day window ending on this date
    for (let j = 0; j < 90; j++) {
      const lookbackDate = new Date(date);
      lookbackDate.setDate(lookbackDate.getDate() - j);
      const lookbackStr = lookbackDate.toISOString().split('T')[0];

      if (invoicesByDate[lookbackStr]) {
        totalRevenue += invoicesByDate[lookbackStr].revenue;
        totalAR += invoicesByDate[lookbackStr].ar;
      }
    }

    const dso = totalRevenue > 0 ? (totalAR / totalRevenue) * 90 : 0;
    dsoData.push({
      date: dateStr,
      dso: Math.round(dso * 10) / 10, // Round to 1 decimal
    });
  }

  return dsoData;
}

/**
 * Calculate AR aging buckets
 * Buckets: Current, 1-30, 31-60, 61-90, 90+
 */
function calculateARAgingBuckets(unpaidInvoices) {
  const buckets = {
    current: { amount: 0, count: 0 },
    '1-30': { amount: 0, count: 0 },
    '31-60': { amount: 0, count: 0 },
    '61-90': { amount: 0, count: 0 },
    '90+': { amount: 0, count: 0 },
  };

  const today = new Date();

  unpaidInvoices.forEach((inv) => {
    const dueDate = new Date(inv.DueDate);
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const balance = parseFloat(inv.Balance || 0);

    let bucketKey;
    if (daysOverdue < 0) {
      bucketKey = 'current';
    } else if (daysOverdue <= 30) {
      bucketKey = '1-30';
    } else if (daysOverdue <= 60) {
      bucketKey = '31-60';
    } else if (daysOverdue <= 90) {
      bucketKey = '61-90';
    } else {
      bucketKey = '90+';
    }

    buckets[bucketKey].amount += balance;
    buckets[bucketKey].count += 1;
  });

  // Format for dashboard (match mockData structure)
  return [
    { bucket: 'Current', amount: Math.round(buckets.current.amount), count: buckets.current.count },
    { bucket: '1–30', amount: Math.round(buckets['1-30'].amount), count: buckets['1-30'].count },
    { bucket: '31–60', amount: Math.round(buckets['31-60'].amount), count: buckets['31-60'].count },
    { bucket: '61–90', amount: Math.round(buckets['61-90'].amount), count: buckets['61-90'].count },
    { bucket: '90+', amount: Math.round(buckets['90+'].amount), count: buckets['90+'].count },
  ];
}

/**
 * Format invoices for InvoiceBoard component
 */
function formatInvoicesForBoard(unpaidInvoices) {
  const today = new Date();

  return unpaidInvoices
    .map((inv) => {
      const dueDate = new Date(inv.DueDate);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      // Determine status based on email status and days overdue
      let status;
      if (daysOverdue > 0) {
        status = 'Overdue';
      } else if (inv.EmailStatus === 'EmailSent') {
        status = 'Sent';
      } else {
        status = 'Viewed'; // Default for not yet sent
      }

      return {
        id: inv.DocNumber || inv.Id,
        // QuickBooks API calls (send reminder, fetch invoice) require the
        // internal Id, not the customer-facing DocNumber shown as `id`.
        qbId: inv.Id,
        customer: inv.CustomerRef?.name || 'Unknown',
        amount: parseFloat(inv.Balance || 0),
        due: inv.DueDate,
        issued: inv.TxnDate,
        status,
        daysOut: Math.max(0, daysOverdue),
      };
    })
    .sort((a, b) => b.daysOut - a.daysOut) // Sort by most overdue first
    .slice(0, 15); // Limit to 15 invoices like mockData
}

/**
 * Calculate payment behavior by customer
 */
function calculatePaymentBehavior(allInvoices) {
  const customerStats = {};

  allInvoices.forEach((inv) => {
    const customerName = inv.CustomerRef?.name || 'Unknown';

    if (!customerStats[customerName]) {
      customerStats[customerName] = {
        totalDaysToPay: 0,
        paidCount: 0,
        openAmount: 0,
        openCount: 0,
      };
    }

    const balance = parseFloat(inv.Balance || 0);

    if (balance > 0) {
      // Open invoice
      customerStats[customerName].openAmount += balance;
      customerStats[customerName].openCount += 1;
    } else {
      // Paid invoice - calculate days to pay
      const invoiceDate = new Date(inv.TxnDate);
      const paidDate = new Date(inv.MetaData?.LastUpdatedTime || inv.TxnDate);
      const daysToPay = Math.floor((paidDate - invoiceDate) / (1000 * 60 * 60 * 24));

      customerStats[customerName].totalDaysToPay += daysToPay;
      customerStats[customerName].paidCount += 1;
    }
  });

  // Format for dashboard
  const behaviorData = Object.entries(customerStats)
    .map(([customer, stats]) => ({
      customer,
      avgDays: stats.paidCount > 0 ? Math.round(stats.totalDaysToPay / stats.paidCount) : 0,
      openCount: stats.openCount,
      openAmount: Math.round(stats.openAmount),
    }))
    .filter((c) => c.openCount > 0) // Only show customers with open invoices
    .sort((a, b) => b.avgDays - a.avgDays); // Sort by slowest payers first

  return behaviorData.slice(0, 6); // Top 6 customers like mockData
}

/**
 * Calculate trailing-12-month revenue from invoiced amounts.
 * Used as the denominator for DSO/recoverable-cash projections instead of
 * a hardcoded estimate.
 */
function calculateAnnualRevenue(allInvoices) {
  return Math.round(allInvoices.reduce((sum, inv) => sum + parseFloat(inv.TotalAmt || 0), 0));
}

/**
 * Calculate % of invoices paid within 90 days of issue, among invoices
 * that have actually been paid (Balance === 0) in the trailing 12 months.
 * Uses MetaData.LastUpdatedTime as a proxy for payment date — QuickBooks
 * doesn't expose a dedicated "paid on" field via this API, so this is an
 * approximation and can be skewed by unrelated invoice edits.
 */
function calculateCollectionEfficiency(allInvoices) {
  const paidInvoices = allInvoices.filter((inv) => parseFloat(inv.Balance || 0) === 0);
  if (paidInvoices.length === 0) return null;

  const paidWithin90 = paidInvoices.filter((inv) => {
    const invoiceDate = new Date(inv.TxnDate);
    const paidDate = new Date(inv.MetaData?.LastUpdatedTime || inv.TxnDate);
    const daysToPay = Math.floor((paidDate - invoiceDate) / (1000 * 60 * 60 * 24));
    return daysToPay <= 90;
  });

  return Math.round((paidWithin90.length / paidInvoices.length) * 100);
}
