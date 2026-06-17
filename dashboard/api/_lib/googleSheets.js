/**
 * Google Sheets API Helper for Vercel Serverless Functions
 * Handles non-sensitive reminder activity logging.
 *
 * QB OAuth tokens are NOT stored here — they live encrypted in Vercel KV
 * via ./tokenStore.js. Plaintext credentials in a shared spreadsheet are
 * not an acceptable storage pattern for client onboarding.
 */

import { google } from 'googleapis';

// Initialize Google Sheets client
function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID; // Your "Demo Data" sheet ID

/**
 * Log reminder activity to Google Sheets
 * Writes to AR_Reminder_Log tab (same format as WF2)
 */
export async function logReminderToSheets(data) {
  const sheets = getSheets();
  const now = new Date();

  const row = [
    now.toISOString().split('T')[0], // event_date
    now.toISOString(), // event_timestamp
    data.customer_name,
    data.customer_email,
    data.invoice_number,
    data.due_date,
    data.invoice_date,
    data.amount_outstanding,
    data.days_overdue,
    'Unpaid', // payment_status
    'FALSE', // is_paid
    '', // paid_date
    data.reminder_tier || 3, // Default to tier 3 (Firm) for manual reminders
    '', // skip_reason
    data.email_status,
    '', // days_since_last_reminder
    `manual-${Date.now()}`, // workflow_run_id
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "'AR Reminder Log'", // Appends to next empty row — must match the tab WF2 and getWF2ReminderLog() read from
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log('Reminder logged to Google Sheets');
  } catch (error) {
    console.error('Error logging reminder to Sheets:', error);
    throw new Error(`Failed to log reminder: ${error.message}`);
  }
}

/**
 * Read invoice data from Execution_Log sheet
 * (Optional - if you want to fall back to sheets instead of QB API)
 */
export async function getInvoicesFromSheets() {
  const sheets = getSheets();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Execution_Log!A2:Z', // Skip header row
    });

    const rows = response.data.values || [];

    return rows.map((row) => ({
      timestamp: row[0],
      invoice_id: row[1],
      invoice_number: row[2],
      invoice_date: row[3],
      due_date: row[4],
      total_amount: parseFloat(row[5]) || 0,
      customer_id: row[6],
      customer_name: row[7],
      customer_email: row[8],
      email_status: row[9],
      print_status: row[10],
      balance: parseFloat(row[11]) || 0,
      agreement_number: row[12],
      services: row[13],
      estimate_id: row[14],
    }));
  } catch (error) {
    console.error('Error reading invoices from Sheets:', error);
    throw new Error(`Failed to get invoices: ${error.message}`);
  }
}

/**
 * Read WF1's Execution_Log tab — one row per invoice WF1 created in QuickBooks.
 * Used to derive WF1's real "last run" / activity status for the dashboard,
 * instead of fabricating an "Operational" badge with no backing data.
 */
export async function getWF1ExecutionLog() {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Execution_Log!A2:S',
  });

  const rows = response.data.values || [];

  return rows
    .filter((row) => row[0]) // must have a timestamp
    .map((row) => ({
      timestamp: row[0],
      invoiceId: row[1],
      invoiceNumber: row[2],
      customerName: row[7],
      totalAmount: parseFloat(row[5]) || 0,
    }));
}

/**
 * Read WF2's AR_Reminder_Log tab — one row per reminder send/skip decision.
 * Used to derive WF2's real "last run" status and reminder counts.
 */
export async function getWF2ReminderLog() {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'AR Reminder Log'!A2:Q",
  });

  const rows = response.data.values || [];

  return rows
    .filter((row) => row[1]) // must have event_timestamp
    .map((row) => ({
      eventDate: row[0],
      eventTimestamp: row[1],
      customerName: row[2],
      customerEmail: row[3],
      invoiceNumber: row[4],
      dueDate: row[5],
      invoiceDate: row[6],
      amountOutstanding: parseFloat(row[7]) || 0,
      daysOverdue: parseInt(row[8], 10) || 0,
      paymentStatus: row[9],
      isPaid: row[10] === 'TRUE' || row[10] === true,
      paidDate: row[11],
      reminderTier: row[12],
      skipReason: row[13],
      emailStatus: row[14],
    }));
}

/**
 * Read WF3's Payment Tracking tab — one row per QB payment link sent /
 * payment matched. Used to derive WF3's real status. Returns an empty
 * array (not an error) if the tab doesn't exist yet, since WF3 may not
 * be activated for every client.
 */
export async function getWF3PaymentTracking() {
  const sheets = getSheets();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Payment Tracking!A2:W',
    });

    const rows = response.data.values || [];

    return rows
      .filter((row) => row[1]) // must have invoice_id
      .map((row) => ({
        invoiceId: row[1],
        invoiceNumber: row[2],
        customerName: row[3],
        amount: parseFloat(row[5]) || 0,
        status: row[8],
        paymentLink: row[9],
        paidAt: row[12],
        qbPaymentApplied: row[13] === 'TRUE' || row[13] === true,
        timestamp: row[18],
      }));
  } catch (error) {
    console.error('Payment Tracking tab not readable (may not exist yet):', error.message);
    return [];
  }
}
