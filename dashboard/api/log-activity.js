/**
 * Vercel Serverless Function: Log Activity
 * POST /api/log-activity
 *
 * Persists manual CRM actions taken from the dashboard (contact logged,
 * task assigned, invoice snoozed) to the "CRM Activity" Sheets tab.
 * These actions have no QuickBooks or n8n equivalent — this is the only
 * place they're recorded.
 */

import { logActivityToSheets } from './_lib/googleSheets.js';

const VALID_TYPES = new Set(['contact', 'task', 'snooze']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { activity_type, client_id, customer_name, invoice_number, detail_1, detail_2, detail_3, notes } = req.body;

    if (!VALID_TYPES.has(activity_type)) {
      return res.status(400).json({ error: `activity_type must be one of: ${[...VALID_TYPES].join(', ')}` });
    }
    if (!client_id || !customer_name) {
      return res.status(400).json({ error: 'client_id and customer_name are required' });
    }

    await logActivityToSheets({ activity_type, client_id, customer_name, invoice_number, detail_1, detail_2, detail_3, notes });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ error: 'Failed to log activity', message: error.message });
  }
}
