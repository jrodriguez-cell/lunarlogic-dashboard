/**
 * Escalating reminder email copy, one template per WF2 tier.
 *
 * Cadence and tone match what was scoped with Pedro Fernandez (Gualapack)
 * on the 2026-05-04 call: a friendly pre-due nudge, a plain reminder once
 * overdue, a firm notice that CCs accounting, and a final notice before the
 * "stop taking orders" consequence kicks in — not formal collections.
 */

const TIERS = {
  'Due Soon': {
    subject: (inv) => `Upcoming invoice ${inv.invoiceNumber} due ${inv.dueDateFormatted}`,
    cc: false,
    body: (inv) => `
      <p>Hi ${inv.customerName},</p>
      <p>Just a friendly heads up that invoice ${inv.invoiceNumber}
      (${inv.amountFormatted}) is due on ${inv.dueDateFormatted}.</p>
      <p>No action needed if payment is already scheduled — thanks for being
      a great customer.</p>
    `,
  },
  'Gentle Reminder': {
    subject: (inv) => `Invoice ${inv.invoiceNumber} is now past due`,
    cc: false,
    body: (inv) => `
      <p>Hi ${inv.customerName},</p>
      <p>Invoice ${inv.invoiceNumber} (${inv.amountFormatted}) was due on
      ${inv.dueDateFormatted} and shows as outstanding on our end. If you've
      already sent payment, please disregard this note.</p>
      <p>Otherwise, we'd appreciate it if you could take care of this soon.
      Let us know if anything's holding it up.</p>
    `,
  },
  'Firm Reminder': {
    subject: (inv) => `Action needed: Invoice ${inv.invoiceNumber} ${inv.daysOverdue} days overdue`,
    cc: false,
    body: (inv) => `
      <p>Hi ${inv.customerName},</p>
      <p>Invoice ${inv.invoiceNumber} (${inv.amountFormatted}) is now
      ${inv.daysOverdue} days past its due date of ${inv.dueDateFormatted}.</p>
      <p>Please arrange payment at your earliest convenience, or reach out
      if there's an issue we should know about.</p>
    `,
  },
  Urgent: {
    subject: (inv) => `Urgent: Invoice ${inv.invoiceNumber} ${inv.daysOverdue} days overdue`,
    cc: true,
    body: (inv) => `
      <p>Hi ${inv.customerName},</p>
      <p>Invoice ${inv.invoiceNumber} (${inv.amountFormatted}) is
      ${inv.daysOverdue} days overdue. This requires prompt attention to
      keep your account in good standing.</p>
      <p>Please remit payment as soon as possible, or contact us right away
      to work out next steps.</p>
    `,
  },
  Collections: {
    subject: (inv) => `Final notice: Invoice ${inv.invoiceNumber} ${inv.daysOverdue} days overdue`,
    cc: true,
    body: (inv) => `
      <p>Hi ${inv.customerName},</p>
      <p>This is a final notice for invoice ${inv.invoiceNumber}
      (${inv.amountFormatted}), now ${inv.daysOverdue} days overdue.</p>
      <p>Without payment or a response from you, we will need to place new
      orders on hold until this balance is resolved.</p>
      <p>Please contact us immediately to settle this or discuss a payment
      plan.</p>
    `,
  },
};

/**
 * Build the subject/HTML body/CC list for a reminder email, given the tier
 * name (must match calculateReminderTier's output exactly) and invoice
 * fields formatted for display.
 */
export function buildReminderEmail(tierName, invoiceFields, ccAddresses = []) {
  const tier = TIERS[tierName];
  if (!tier) {
    throw new Error(`Unknown reminder tier: ${tierName}`);
  }

  return {
    subject: tier.subject(invoiceFields),
    htmlBody: tier.body(invoiceFields),
    cc: tier.cc ? ccAddresses : [],
  };
}
