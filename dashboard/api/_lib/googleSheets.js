/**
 * Google Sheets API Helper for Vercel Serverless Functions
 * Handles OAuth token storage and reminder activity logging
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
 * Get QuickBooks OAuth token from Google Sheets
 * Reads from QB_OAuth_Credentials tab (same sheet n8n uses)
 */
export async function getQBTokenFromSheets() {
  const sheets = getSheets();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'QB_OAuth_Credentials!A2:C2', // Row 2 has the actual token data
    });

    const [row] = response.data.values || [];

    if (!row || row.length < 3) {
      throw new Error('No QB OAuth credentials found in Google Sheets');
    }

    return {
      access_token: row[0],
      refresh_token: row[1],
      expires_at: row[2],
    };
  } catch (error) {
    console.error('Error reading QB token from Sheets:', error);
    throw new Error(`Failed to get QB token: ${error.message}`);
  }
}

/**
 * Save refreshed QuickBooks token back to Google Sheets
 * Keeps n8n and Vercel in sync
 */
export async function saveQBTokenToSheets(token) {
  const sheets = getSheets();

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'QB_OAuth_Credentials!A2:C2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[token.access_token, token.refresh_token, token.expires_at]],
      },
    });

    console.log('QB token updated in Google Sheets');
  } catch (error) {
    console.error('Error saving QB token to Sheets:', error);
    throw new Error(`Failed to save QB token: ${error.message}`);
  }
}

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
