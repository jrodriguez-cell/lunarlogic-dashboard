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
      range: 'AR_Reminder_Log', // Appends to next empty row
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
