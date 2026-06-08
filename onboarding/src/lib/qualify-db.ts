import { sql } from '@vercel/postgres';
import type { ROIResult } from '@/types/onboarding';
import type { LeadData } from './qualify-validations';

export async function saveLead(data: LeadData, roi: ROIResult): Promise<string> {
  const result = await sql`
    INSERT INTO onboarding_submissions (
      business_name, owner_name, owner_email, owner_phone,
      annual_revenue, industry, industry_other, employee_count,
      qb_version, qb_desktop_version, qb_manager, qb_current_state,
      invoice_creation, invoice_delivery, followup_process, followup_frequency,
      monthly_invoice_count, avg_invoice_size, current_dso, payment_terms,
      biggest_ar_pain, biggest_pain_category, nearly_missed_payroll, biggest_slow_payer,
      uses_stripe, uses_slack, uses_google_sheets, uses_qb_payments, uses_email, uses_other,
      modules_selected, target_start_date, additional_notes,
      roi_annual_revenue, roi_current_dso, roi_working_capital, roi_wc_released,
      status
    ) VALUES (
      ${data.businessName}, ${data.ownerName}, ${data.ownerEmail}, ${data.ownerPhone ?? null},
      ${data.annualRevenue}, ${data.industry}, ${data.industryOther ?? null}, ${data.employeeCount ?? null},
      ${''},  ${null}, ${''},  ${''},
      ${''},  ${''},  ${''},  ${''},
      ${data.monthlyInvoiceCount}, ${''},  ${data.currentDso}, ${''},
      ${data.biggestArPain}, ${JSON.stringify(data.biggestPainCategory)}::jsonb, ${data.nearlyMissedPayroll}, ${null},
      ${false}, ${false}, ${false}, ${false}, ${false}, ${null},
      ${'[]'}::jsonb, ${null}, ${null},
      ${roi.wcLocked + roi.badDebtSavings + roi.unbilledRecovered + roi.laborSaved},
      ${roi.currentDSO}, ${roi.wcLocked}, ${roi.wcReleased},
      'lead'
    )
    RETURNING id
  `;
  return result.rows[0].id as string;
}
