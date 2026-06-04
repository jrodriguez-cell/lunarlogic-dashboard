import { sql } from '@vercel/postgres';
import type { OnboardingData, ROIResult, Submission } from '@/types/onboarding';
import type { GapAnalysisReport } from './gap-analysis';

export async function saveSubmission(data: OnboardingData, roi: ROIResult): Promise<string> {
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
      ${data.qbVersion}, ${data.qbDesktopVersion ?? null}, ${data.qbManager}, ${data.qbCurrentState},
      ${data.invoiceCreation}, ${data.invoiceDelivery}, ${data.followupProcess}, ${data.followupFrequency},
      ${data.monthlyInvoiceCount}, ${data.avgInvoiceSize}, ${data.currentDso}, ${data.paymentTerms},
      ${data.biggestArPain}, ${data.biggestPainCategory.join(', ')}, ${data.nearlyMissedPayroll}, ${data.biggestSlowPayer ?? null},
      ${data.usesStripe}, ${data.usesSlack}, ${data.usesGoogleSheets}, ${data.usesQBPayments ?? false}, ${data.usesEmail ?? false}, ${data.usesOther ?? null},
      ${`{${data.modulesSelected.join(',')}}`}, ${data.targetStartDate ?? null}, ${data.additionalNotes ?? null},
      ${roi.wcLocked + roi.badDebtSavings + roi.unbilledRecovered + roi.laborSaved}, ${roi.currentDSO}, ${roi.wcLocked}, ${roi.wcReleased},
      'new'
    )
    RETURNING id
  `;
  return result.rows[0].id as string;
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const result = await sql`
    SELECT * FROM onboarding_submissions WHERE id = ${id}
  `;
  if (result.rows.length === 0) return null;
  return mapRowToSubmission(result.rows[0]);
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const result = await sql`
    SELECT * FROM onboarding_submissions ORDER BY created_at DESC
  `;
  return result.rows.map(mapRowToSubmission);
}

export async function updateSubmissionStatus(id: string, status: string): Promise<void> {
  await sql`
    UPDATE onboarding_submissions SET status = ${status}, updated_at = NOW() WHERE id = ${id}
  `;
}

export async function updateAdminNotes(id: string, notes: string): Promise<void> {
  await sql`
    UPDATE onboarding_submissions SET admin_notes = ${notes}, updated_at = NOW() WHERE id = ${id}
  `;
}

export async function saveAnalysis(
  id: string,
  gapAnalysis: GapAnalysisReport,
  proposalDraft: string
): Promise<void> {
  await sql`
    UPDATE onboarding_submissions
    SET
      gap_analysis = ${JSON.stringify(gapAnalysis)}::jsonb,
      proposal_draft = ${proposalDraft},
      analysis_generated_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function getAnalysis(id: string): Promise<{
  gapAnalysis: GapAnalysisReport | null;
  proposalDraft: string | null;
  analysisGeneratedAt: string | null;
}> {
  const result = await sql`
    SELECT gap_analysis, proposal_draft, analysis_generated_at
    FROM onboarding_submissions
    WHERE id = ${id}
  `;

  if (result.rows.length === 0) {
    return { gapAnalysis: null, proposalDraft: null, analysisGeneratedAt: null };
  }

  const row = result.rows[0];
  return {
    gapAnalysis: row.gap_analysis ? (row.gap_analysis as GapAnalysisReport) : null,
    proposalDraft: row.proposal_draft ? String(row.proposal_draft) : null,
    analysisGeneratedAt: row.analysis_generated_at ? String(row.analysis_generated_at) : null,
  };
}

function mapRowToSubmission(row: Record<string, unknown>): Submission {
  const biggestPainCategory = typeof row.biggest_pain_category === 'string'
    ? row.biggest_pain_category.split(', ').filter(Boolean)
    : [];

  const modulesSelected = Array.isArray(row.modules_selected)
    ? (row.modules_selected as string[]).filter((m): m is 'IA' | 'PR' | 'SO' | 'AR' =>
        ['IA', 'PR', 'SO', 'AR'].includes(m)
      )
    : [];

  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    status: (row.status as 'new' | 'reviewed' | 'proposal_sent' | 'active') ?? 'new',
    adminNotes: row.admin_notes ? String(row.admin_notes) : undefined,
    roiAnnualRevenue: row.roi_annual_revenue ? Number(row.roi_annual_revenue) : undefined,
    roiCurrentDso: row.roi_current_dso ? Number(row.roi_current_dso) : undefined,
    roiWorkingCapital: row.roi_working_capital ? Number(row.roi_working_capital) : undefined,
    roiWcReleased: row.roi_wc_released ? Number(row.roi_wc_released) : undefined,
    businessName: String(row.business_name ?? ''),
    ownerName: String(row.owner_name ?? ''),
    ownerEmail: String(row.owner_email ?? ''),
    ownerPhone: row.owner_phone ? String(row.owner_phone) : undefined,
    annualRevenue: String(row.annual_revenue ?? ''),
    industry: String(row.industry ?? ''),
    industryOther: row.industry_other ? String(row.industry_other) : undefined,
    employeeCount: row.employee_count ? String(row.employee_count) : undefined,
    qbVersion: (row.qb_version as 'Online' | 'Desktop' | '') ?? '',
    qbDesktopVersion: row.qb_desktop_version ? String(row.qb_desktop_version) : undefined,
    qbManager: String(row.qb_manager ?? ''),
    qbCurrentState: String(row.qb_current_state ?? ''),
    invoiceCreation: String(row.invoice_creation ?? ''),
    invoiceDelivery: String(row.invoice_delivery ?? ''),
    followupProcess: String(row.followup_process ?? ''),
    followupFrequency: String(row.followup_frequency ?? ''),
    monthlyInvoiceCount: String(row.monthly_invoice_count ?? ''),
    avgInvoiceSize: String(row.avg_invoice_size ?? ''),
    currentDso: String(row.current_dso ?? ''),
    paymentTerms: String(row.payment_terms ?? ''),
    biggestArPain: String(row.biggest_ar_pain ?? ''),
    biggestPainCategory,
    nearlyMissedPayroll: Boolean(row.nearly_missed_payroll),
    biggestSlowPayer: row.biggest_slow_payer ? String(row.biggest_slow_payer) : undefined,
    usesStripe: Boolean(row.uses_stripe),
    usesSlack: Boolean(row.uses_slack),
    usesGoogleSheets: Boolean(row.uses_google_sheets),
    usesQBPayments: Boolean(row.uses_qb_payments),
    usesEmail: Boolean(row.uses_email),
    usesOther: row.uses_other ? String(row.uses_other) : undefined,
    modulesSelected,
    targetStartDate: row.target_start_date ? String(row.target_start_date) : undefined,
    additionalNotes: row.additional_notes ? String(row.additional_notes) : undefined,
  };
}
