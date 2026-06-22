/**
 * Vercel Serverless Function: Send Reminder
 * POST /api/send-reminder
 * 
 * Manually send a payment reminder email for an invoice
 */

import { getInvoice } from './_lib/quickbooks.js';
import { logReminderToSheets } from './_lib/googleSheets.js';
import { sendOutlookEmail } from './_lib/outlook.js';
import { buildReminderEmail } from './_lib/reminderTemplates.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoice_id, client_id } = req.body;
    const clientId = client_id || 'default';

    if (!invoice_id) {
      return res.status(400).json({ error: 'invoice_id is required' });
    }

    // Step 1: Get invoice details from QuickBooks
    console.log('Fetching invoice:', invoice_id);
    const invoiceData = await getInvoice(invoice_id, clientId);
    const invoice = invoiceData.Invoice;

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Step 2: Resolve recipient and compute reminder tier
    const customerEmail = invoice.BillEmail?.Address;

    if (!customerEmail) {
      return res.status(400).json({ error: 'Invoice has no email address' });
    }

    const dueDate = new Date(invoice.DueDate);
    const today = new Date();
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const tierName = calculateReminderTier(daysOverdue);

    // Step 3: Build tier-appropriate escalating copy and send via Outlook
    // (Microsoft Graph, app-only auth — see _lib/outlook.js). This replaces
    // the old QB-native invoice resend, which only emails QuickBooks' fixed
    // template and can't carry the escalating tone the reminder sequence
    // needs.
    const ccAddresses = (process.env.REMINDER_ESCALATION_CC || '')
      .split(',')
      .map((addr) => addr.trim())
      .filter(Boolean);

    const { subject, htmlBody, cc } = buildReminderEmail(
      tierName,
      {
        customerName: invoice.CustomerRef.name,
        invoiceNumber: invoice.DocNumber,
        dueDateFormatted: dueDate.toLocaleDateString('en-US'),
        amountFormatted: `$${parseFloat(invoice.Balance).toFixed(2)}`,
        daysOverdue: Math.max(0, daysOverdue),
      },
      ccAddresses
    );

    console.log('Sending reminder to:', customerEmail, 'tier:', tierName);
    await sendOutlookEmail({ to: customerEmail, subject, htmlBody, cc });

    // Step 4: Log to AR Reminder Log sheet (same format as WF2)
    await logReminderToSheets({
      customer_name: invoice.CustomerRef.name,
      customer_email: customerEmail,
      invoice_number: invoice.DocNumber,
      due_date: invoice.DueDate,
      invoice_date: invoice.TxnDate,
      amount_outstanding: parseFloat(invoice.Balance),
      days_overdue: Math.max(0, daysOverdue),
      email_status: 'EmailSent',
      reminder_tier: tierName,
    });

    // Step 5: Return success
    res.status(200).json({
      success: true,
      message: 'Reminder sent successfully',
      reminder_sent: {
        invoice_id,
        invoice_number: invoice.DocNumber,
        customer: invoice.CustomerRef.name,
        email: customerEmail,
        amount: parseFloat(invoice.Balance),
        tier: tierName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      error: 'Failed to send reminder',
      message: error.message,
    });
  }
}

/**
 * Calculate reminder tier name based on days overdue.
 * Must exactly match WF2's "Process Invoice Data" node thresholds —
 * this is the only other place tier boundaries are defined, and the
 * dashboard's manual sends write into the same Sheets log WF2 reads/writes,
 * using the same string tier name (not a number) in that column.
 */
function calculateReminderTier(daysOverdue) {
  if (daysOverdue <= 0 && daysOverdue >= -3) return 'Due Soon';
  if (daysOverdue >= 1 && daysOverdue <= 7) return 'Gentle Reminder';
  if (daysOverdue >= 8 && daysOverdue <= 14) return 'Firm Reminder';
  if (daysOverdue >= 15 && daysOverdue <= 30) return 'Urgent';
  return 'Collections';
}
