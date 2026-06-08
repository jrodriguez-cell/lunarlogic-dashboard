import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import type { OnboardingData, ROIResult } from '@/types/onboarding';
import type { GapAnalysisReport, WorkflowAnalysis } from './gap-analysis';
import { formatCurrency } from './roi';

// ─── Brand colours ───────────────────────────────────────────────────────────
const C = {
  bg: '#080D1A',
  accent: '#00CFFF',
  text: '#F0F4FF',
  muted: '#8A94A6',
  surface: '#0F1729',
  border: '#1A2744',
  red: '#EF4444',
  green: '#10B981',
  amber: '#F59E0B',
  orange: '#F97316',
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Page
  page: { backgroundColor: C.bg, padding: 48, fontFamily: 'Helvetica' },
  coverPage: { backgroundColor: C.bg, padding: 0, fontFamily: 'Helvetica' },

  // Cover
  coverInner: { flex: 1, padding: 56, justifyContent: 'space-between' },
  coverWordmark: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 4 },
  coverTitle: { fontSize: 38, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 16 },
  coverSubLine: { fontSize: 13, color: C.muted, marginBottom: 6 },
  coverDate: { fontSize: 11, color: C.muted, marginTop: 8 },
  coverBottomBar: {
    borderTopWidth: 2, borderTopColor: C.accent,
    paddingTop: 14, paddingHorizontal: 56, paddingBottom: 36,
    backgroundColor: C.surface,
  },
  coverConfidential: { fontSize: 10, color: C.muted, fontFamily: 'Helvetica-Oblique' },

  // Section header
  sectionHeader: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.accent,
    letterSpacing: 3, marginBottom: 14, marginTop: 4,
  },

  // Body text
  body: { fontSize: 10, color: C.text, lineHeight: 1.7, marginBottom: 8 },
  muted: { fontSize: 9, color: C.muted },

  // ROI grid
  roiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  roiCell: {
    width: '50%', padding: 14,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  roiNumber: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.accent, marginBottom: 3 },
  roiLabel: { fontSize: 9, color: C.muted },

  // Module card
  moduleCard: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    borderRadius: 6, padding: 14, marginBottom: 12,
  },
  moduleBadge: {
    backgroundColor: C.accent, borderRadius: 3,
    paddingVertical: 2, paddingHorizontal: 6,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  moduleBadgeText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.bg },
  moduleName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 6 },
  moduleDesc: { fontSize: 9, color: C.muted, lineHeight: 1.6, marginBottom: 10 },

  // Workflow diagram
  wfDiagram: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  wfBox: {
    borderWidth: 1, borderColor: C.accent, borderRadius: 3,
    paddingVertical: 5, paddingHorizontal: 8, flex: 1,
  },
  wfBoxText: { fontSize: 8, color: C.accent, textAlign: 'center' },
  wfArrow: { fontSize: 10, color: C.muted, paddingHorizontal: 4 },

  // Readiness table
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: C.surface, padding: 8 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.muted, letterSpacing: 1 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, padding: 8 },
  tableCell: { fontSize: 9, color: C.text },
  tableCellMuted: { fontSize: 9, color: C.muted },

  // Callout boxes
  calloutRed: {
    borderWidth: 1, borderColor: '#7F1D1D', backgroundColor: '#1C0A0A',
    borderRadius: 5, padding: 12, marginBottom: 10,
  },
  calloutCyan: {
    borderWidth: 1, borderColor: C.accent, backgroundColor: '#001A24',
    borderRadius: 5, padding: 12, marginBottom: 10,
  },
  calloutLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 2, marginBottom: 6 },
  calloutItem: { fontSize: 9, color: C.text, marginBottom: 3, lineHeight: 1.5 },

  // Phase boxes
  phaseBox: {
    flex: 1, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    padding: 12, marginRight: 8,
  },
  phaseBoxLast: {
    flex: 1, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    padding: 12,
  },
  phaseLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 2, marginBottom: 4 },
  phaseTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 6 },
  phaseItem: { fontSize: 8, color: C.muted, marginBottom: 2 },

  // Pricing table
  pricingRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border,
    paddingVertical: 9, paddingHorizontal: 10,
  },
  pricingRowHighlight: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border,
    paddingVertical: 9, paddingHorizontal: 10, backgroundColor: '#001F2E',
  },
  pricingCell: { flex: 1, fontSize: 9, color: C.text },
  pricingCellAccent: { flex: 1, fontSize: 9, color: C.accent, fontFamily: 'Helvetica-Bold' },

  // ROI table
  roiTableRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border,
    paddingVertical: 7, paddingHorizontal: 10,
  },
  roiTableLabel: { flex: 2, fontSize: 9, color: C.muted },
  roiTableValue: { flex: 1, fontSize: 9, color: C.text, textAlign: 'right' },
  roiTableValueAccent: { flex: 1, fontSize: 9, color: C.accent, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  // MSA
  msaHeading: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.accent, marginTop: 14, marginBottom: 4 },
  msaBody: { fontSize: 8.5, color: C.muted, lineHeight: 1.65, marginBottom: 2 },
  sigBlock: {
    flexDirection: 'row', marginTop: 28, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16,
  },
  sigCol: { flex: 1, paddingRight: 20 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: C.muted, marginBottom: 4, marginTop: 20, height: 1 },
  sigLabel: { fontSize: 8, color: C.muted },

  // Next Steps
  nextStepRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  nextStepNum: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  nextStepNumText: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.accent },
  nextStepTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 3 },
  nextStepDesc: { fontSize: 9, color: C.muted, lineHeight: 1.6 },

  // Footer
  footer: {
    position: 'absolute', bottom: 28, left: 48, right: 48,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: C.muted },
  footerAccent: { fontSize: 8, color: C.accent },

  // Readiness score
  readinessScore: { fontSize: 48, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readinessColor(score: number): string {
  if (score >= 80) return C.green;
  if (score >= 60) return C.amber;
  if (score >= 30) return C.orange;
  return C.red;
}

const MODULE_NAMES: Record<string, string> = {
  IA: 'Invoice Automation (WF1A + WF1B)',
  PR: 'Proactive Payment Reminders (WF2)',
  SO: 'Payment Receipt & Cash Application (WF3)',
  AR: 'AR Aging Dashboard',
};

const MODULE_DESCS: Record<string, string> = {
  IA: 'Eliminates manual invoice entry by automating the full order-to-invoice cycle via Slack. Sales staff upload a PDF or type a text command; LunarLogic extracts the data using Claude AI, validates the customer in QuickBooks, and creates the invoice — all with a single Slack approval step. Designed specifically for professional services firms where speed of invoicing directly impacts cash collection.',
  PR: 'Sends professional, branded payment reminder emails to customers with open invoices on a daily schedule (Mon-Fri at 9 AM). Pulls live unpaid invoice data from QuickBooks Online, skips VIP-exempt customers, and posts a daily AR aging summary to your Slack channel so you always know where you stand. Proven to reduce DSO by an average of 19 days.',
  SO: 'Closes the final loop in the Order-to-Cash cycle by automatically applying incoming bank payments to the correct QuickBooks invoices using AI-powered fuzzy matching (90% confidence threshold). Ambiguous or bulk payments are routed to a Slack prompt for human approval. NOTE: This module is currently in development — estimated delivery Q3 2026.',
  AR: 'A live, mobile-responsive dashboard showing your AR health at a glance: AR aging waterfall (Current / 1-30 / 31-60 / 61-90 / 90+), DSO trend line with LunarLogic go-live annotation, invoice status board, and customer payment behavior table. Data syncs from QuickBooks every 15 minutes. The go-live annotation on the DSO chart is a direct visual proof of LunarLogic impact.',
};

const MODULE_DIAGRAMS: Record<string, string[]> = {
  IA: ['Slack PDF Upload', 'AI Extraction (Claude)', 'QB Invoice Created'],
  PR: ['Daily Schedule 9AM', 'QB Unpaid Query', 'Outlook Reminder Sent'],
  SO: ['Plaid Webhook', 'AI Payment Match', 'QB Cash Applied'],
  AR: ['QB Sync (15 min)', 'AR Aging Engine', 'Live Dashboard Updated'],
};

const MODULE_IA_B_DIAGRAM: string[] = ['Slack Text Command', 'AI Classification', 'QB Invoice Created'];

// ─── Sub-components ───────────────────────────────────────────────────────────
interface WFDiagramProps {
  steps: string[];
}
function WFDiagram({ steps }: WFDiagramProps) {
  return (
    <View style={s.wfDiagram}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <View style={s.wfBox}>
            <Text style={s.wfBoxText}>{step}</Text>
          </View>
          {i < steps.length - 1 && <Text style={s.wfArrow}>{'->'}</Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

function Footer({ pageNum, total, businessName }: { pageNum: number; total: number; businessName: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>CONFIDENTIAL - prepared exclusively for {businessName} - LunarLogic LLC</Text>
      <Text style={s.footerAccent}>Page {pageNum} of {total}</Text>
    </View>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────
interface ProposalDocProps {
  submission: OnboardingData & { id: string };
  gapAnalysis: GapAnalysisReport;
  roi: ROIResult;
  proposalDraft: string;
}

function ProposalDocument({ submission, gapAnalysis, roi, proposalDraft }: ProposalDocProps) {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalPages = 7;

  const invoiceCount = submission.monthlyInvoiceCount ?? '';
  const recommendedTier =
    invoiceCount.includes('150') || invoiceCount.includes('100') || invoiceCount.includes('50') || invoiceCount === 'Under 30'
      ? 'Essentials'
      : invoiceCount.includes('200') || invoiceCount.includes('250')
      ? 'Professional'
      : 'Business';

  const pricingTiers = [
    { name: 'Essentials', monthly: '$697', impl: '$2,500', overage: '$5/invoice', invoices: '150/mo' },
    { name: 'Professional', monthly: '$1,497', impl: '$2,500', overage: '$5/invoice', invoices: '250/mo' },
    { name: 'Business', monthly: '$2,497', impl: 'Waived*', overage: '$5/invoice', invoices: '400/mo' },
  ];

  const selectedModules = submission.modulesSelected;
  const phase1Modules = selectedModules.filter((m) => m === 'IA' || m === 'PR');
  const phase2Modules = selectedModules.filter((m) => m === 'AR');
  const phase3Modules = selectedModules.filter((m) => m === 'SO');
  const selectedAnalyses = gapAnalysis.workflowAnalyses.filter((a: WorkflowAnalysis) => a.selected);

  return (
    <Document>

      {/* PAGE 1 — Cover */}
      <Page size="LETTER" style={s.coverPage}>
        <View style={s.coverInner}>
          <Text style={s.coverWordmark}>lunarlogic</Text>
          <View>
            <Text style={s.coverTitle}>BUSINESS{'\n'}PROPOSAL</Text>
            <Text style={s.coverSubLine}>Prepared for: {submission.businessName} | {submission.ownerName}</Text>
            <Text style={s.coverSubLine}>Prepared by: LunarLogic LLC - Charlotte, NC</Text>
            <Text style={s.coverDate}>{dateStr}</Text>
          </View>
          <View />
        </View>
        <View style={s.coverBottomBar}>
          <Text style={s.coverConfidential}>
            Confidential - prepared exclusively for {submission.businessName}
          </Text>
        </View>
      </Page>

      {/* PAGE 2 — Executive Summary + Situation */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionHeader}>SITUATION</Text>
        <Text style={s.body}>{proposalDraft}</Text>

        <Text style={[s.sectionHeader, { marginTop: 18 }]}>ROI AT A GLANCE</Text>
        <View style={s.roiGrid}>
          <View style={s.roiCell}>
            <Text style={s.roiNumber}>{roi.currentDSO - roi.targetDSO} days</Text>
            <Text style={s.roiLabel}>Projected DSO Improvement</Text>
          </View>
          <View style={s.roiCell}>
            <Text style={s.roiNumber}>{formatCurrency(roi.wcReleased)}</Text>
            <Text style={s.roiLabel}>Working Capital Released</Text>
          </View>
          <View style={s.roiCell}>
            <Text style={s.roiNumber}>{formatCurrency(roi.totalYear1)}</Text>
            <Text style={s.roiLabel}>Total Year 1 Value</Text>
          </View>
          <View style={s.roiCell}>
            <Text style={s.roiNumber}>{roi.roi}x</Text>
            <Text style={s.roiLabel}>ROI Multiple</Text>
          </View>
        </View>

        <Footer pageNum={2} total={totalPages} businessName={submission.businessName} />
      </Page>

      {/* PAGE 3 — Recommended Modules */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionHeader}>RECOMMENDED MODULES</Text>

        {selectedModules.map((mod) => (
          <View key={mod} style={s.moduleCard}>
            <View style={s.moduleBadge}>
              <Text style={s.moduleBadgeText}>{mod}</Text>
            </View>
            <Text style={s.moduleName}>{MODULE_NAMES[mod] ?? mod}</Text>
            <Text style={s.moduleDesc}>{MODULE_DESCS[mod] ?? ''}</Text>
            {mod === 'IA' ? (
              <View>
                <Text style={[s.muted, { marginBottom: 4, fontSize: 8 }]}>Path A - PDF Upload:</Text>
                <WFDiagram steps={MODULE_DIAGRAMS['IA'] ?? []} />
                <Text style={[s.muted, { marginBottom: 4, marginTop: 8, fontSize: 8 }]}>Path B - Text Command:</Text>
                <WFDiagram steps={MODULE_IA_B_DIAGRAM} />
              </View>
            ) : (
              <WFDiagram steps={MODULE_DIAGRAMS[mod] ?? []} />
            )}
          </View>
        ))}

        {selectedModules.length === 0 && (
          <Text style={s.body}>No modules selected.</Text>
        )}

        <Footer pageNum={3} total={totalPages} businessName={submission.businessName} />
      </Page>

      {/* PAGE 4 — Implementation Readiness & Timeline */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionHeader}>IMPLEMENTATION READINESS</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[s.readinessScore, { color: readinessColor(gapAnalysis.overallReadiness) }]}>
            {gapAnalysis.overallReadiness}%
          </Text>
          <View style={{ marginLeft: 16 }}>
            <Text style={[s.body, { marginBottom: 2 }]}>Overall Readiness Score</Text>
            <Text style={s.muted}>
              {gapAnalysis.overallReadiness >= 80
                ? 'Ready to deploy immediately.'
                : gapAnalysis.overallReadiness >= 60
                ? 'Minor configuration required before go-live.'
                : gapAnalysis.overallReadiness >= 30
                ? 'Significant gaps must be addressed before deployment.'
                : 'Blocking issues prevent deployment - see below.'}
            </Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 2 }]}>WORKFLOW</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>READINESS</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>STATUS</Text>
            <Text style={[s.tableHeaderCell, { flex: 2 }]}>KEY GAP</Text>
          </View>
          {selectedAnalyses.map((a: WorkflowAnalysis) => {
            const firstGap = a.gaps[0];
            return (
              <View key={a.workflowId} style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 2 }]}>{a.workflowName}</Text>
                <Text style={[s.tableCell, { flex: 1, color: readinessColor(a.readinessScore) }]}>
                  {a.readinessScore}%
                </Text>
                <Text style={[s.tableCellMuted, { flex: 1 }]}>{a.status}</Text>
                <Text style={[s.tableCellMuted, { flex: 2 }]}>
                  {firstGap ? firstGap.item : 'None'}
                </Text>
              </View>
            );
          })}
        </View>

        {gapAnalysis.blockers.length > 0 && (
          <View style={s.calloutRed}>
            <Text style={[s.calloutLabel, { color: C.red }]}>BLOCKING ISSUES</Text>
            {gapAnalysis.blockers.map((b, i) => (
              <Text key={i} style={[s.calloutItem, { color: '#FCA5A5' }]}>X  {b}</Text>
            ))}
          </View>
        )}

        {gapAnalysis.quickWins.length > 0 && (
          <View style={s.calloutCyan}>
            <Text style={[s.calloutLabel, { color: C.accent }]}>QUICK WINS</Text>
            {gapAnalysis.quickWins.map((w, i) => (
              <Text key={i} style={[s.calloutItem, { color: C.text }]}>OK  {w}</Text>
            ))}
          </View>
        )}

        <Text style={[s.sectionHeader, { marginTop: 16 }]}>DEPLOYMENT TIMELINE</Text>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <View style={s.phaseBox}>
            <Text style={s.phaseLabel}>PHASE 1</Text>
            <Text style={s.phaseTitle}>Foundation{'\n'}Weeks 1-3</Text>
            {(phase1Modules.length > 0 ? phase1Modules : ['IA', 'PR']).map((m) => (
              <Text key={m} style={s.phaseItem}>- {MODULE_NAMES[m] ?? m}</Text>
            ))}
          </View>
          <View style={s.phaseBox}>
            <Text style={s.phaseLabel}>PHASE 2</Text>
            <Text style={s.phaseTitle}>Full Automation{'\n'}Weeks 4-6</Text>
            {phase2Modules.length > 0 ? (
              phase2Modules.map((m) => (
                <Text key={m} style={s.phaseItem}>- {MODULE_NAMES[m] ?? m}</Text>
              ))
            ) : (
              <Text style={s.phaseItem}>- Optimization and tuning</Text>
            )}
            <Text style={s.phaseItem}>- DSO baseline established</Text>
          </View>
          <View style={s.phaseBoxLast}>
            <Text style={s.phaseLabel}>PHASE 3</Text>
            <Text style={s.phaseTitle}>Cash Application{'\n'}Q3 2026</Text>
            {phase3Modules.length > 0 ? (
              phase3Modules.map((m) => (
                <Text key={m} style={s.phaseItem}>- {MODULE_NAMES[m] ?? m}</Text>
              ))
            ) : (
              <Text style={s.phaseItem}>- WF3 optional add-on</Text>
            )}
            <Text style={s.phaseItem}>- Full O2C automation</Text>
          </View>
        </View>

        <Footer pageNum={4} total={totalPages} businessName={submission.businessName} />
      </Page>

      {/* PAGE 5 — Investment */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionHeader}>INVESTMENT</Text>

        <View style={[s.table, { marginBottom: 14 }]}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>TIER</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>MONTHLY</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>IMPL. FEE</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>OVERAGE</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>VOLUME</Text>
          </View>
          {pricingTiers.map((tier) => {
            const isRec = tier.name === recommendedTier;
            return (
              <View key={tier.name} style={isRec ? s.pricingRowHighlight : s.pricingRow}>
                <Text style={[isRec ? s.pricingCellAccent : s.pricingCell, { flex: 1.5 }]}>
                  {tier.name}{isRec ? ' (Recommended)' : ''}
                </Text>
                <Text style={isRec ? s.pricingCellAccent : s.pricingCell}>{tier.monthly}</Text>
                <Text style={isRec ? s.pricingCellAccent : s.pricingCell}>{tier.impl}</Text>
                <Text style={isRec ? s.pricingCellAccent : s.pricingCell}>{tier.overage}</Text>
                <Text style={isRec ? s.pricingCellAccent : s.pricingCell}>{tier.invoices}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[s.muted, { marginBottom: 14, fontSize: 8 }]}>
          * $2,500 implementation fee waived for 12-month commitments. 20% referral fee on MRR for partner introductions.
        </Text>

        <Text style={[s.sectionHeader, { marginTop: 4 }]}>ROI PROJECTION</Text>
        <View style={[s.table, { marginBottom: 14 }]}>
          {([
            ['Current DSO', `${roi.currentDSO} days`, false],
            ['Target DSO (post go-live)', `${roi.targetDSO} days`, true],
            ['Working Capital Released', formatCurrency(roi.wcReleased), true],
            ['Bad Debt Savings (70% reduction)', formatCurrency(roi.badDebtSavings), true],
            ['Unbilled Revenue Recovered', formatCurrency(roi.unbilledRecovered), true],
            ['Labor Hours Saved', formatCurrency(roi.laborSaved), true],
            ['Total Year 1 Value', formatCurrency(roi.totalYear1), true],
            ['ROI Multiple', `${roi.roi}x`, true],
          ] as [string, string, boolean][]).map(([label, value, accent], i) => (
            <View key={i} style={s.roiTableRow}>
              <Text style={s.roiTableLabel}>{label}</Text>
              <Text style={accent ? s.roiTableValueAccent : s.roiTableValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={s.calloutCyan}>
          <Text style={[s.calloutLabel, { color: C.accent }]}>60-DAY SATISFACTION GUARANTEE</Text>
          <Text style={s.calloutItem}>
            If you don't see measurable DSO improvement within 60 days of go-live, cancel with no penalty. We are that confident in the results.
          </Text>
        </View>

        <View style={[s.calloutCyan, { backgroundColor: '#001005', borderColor: C.green }]}>
          <Text style={[s.calloutLabel, { color: C.green }]}>PROOF POINT</Text>
          <Text style={s.calloutItem}>
            Kaptain Clean LLC: 84% reduction in invoice processing time - 19-day DSO improvement
          </Text>
        </View>

        <Footer pageNum={5} total={totalPages} businessName={submission.businessName} />
      </Page>

      {/* PAGE 6 — Master Services Agreement */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionHeader}>MASTER SERVICES AGREEMENT</Text>

        <Text style={s.msaBody}>
          This Master Services Agreement ("Agreement") is entered into as of the date of signature below by and between LunarLogic LLC, a North Carolina limited liability company with its principal place of business in Charlotte, North Carolina ("LunarLogic"), and {submission.businessName} ("Client"). Collectively, LunarLogic and Client are referred to as the "Parties."
        </Text>

        <Text style={s.msaHeading}>1. SERVICES</Text>
        <Text style={s.msaBody}>
          LunarLogic shall provide accounts receivable automation services as described in the selected modules of this proposal: {selectedModules.join(', ') || 'TBD'}. LunarLogic reserves the right to update, improve, or modify the platform at any time without reducing core service functionality.
        </Text>

        <Text style={s.msaHeading}>2. TERM AND TERMINATION</Text>
        <Text style={s.msaBody}>
          This Agreement commences on the go-live date and continues on a month-to-month basis following any initial commitment period. Either Party may terminate with thirty (30) days' written notice. LunarLogic may terminate immediately upon material breach, including non-payment. Upon termination, LunarLogic shall provide Client with a data export within fifteen (15) business days.
        </Text>

        <Text style={s.msaHeading}>3. PAYMENT TERMS</Text>
        <Text style={s.msaBody}>
          Monthly subscription fees are due in advance on the first day of each billing period. Implementation fees are due upon execution. Overdue balances accrue interest at 1.5% per month (18% per annum). Services may be suspended after fifteen (15) days of non-payment notice. Overage fees ($5 per invoice above plan limit) are billed monthly in arrears.
        </Text>

        <Text style={s.msaHeading}>4. IMPLEMENTATION FEE</Text>
        <Text style={s.msaBody}>
          A one-time $2,500 implementation fee covers initial setup, QuickBooks integration, workflow configuration, and onboarding support. This fee is waived for Clients committing to a 12-month subscription. Early cancellation after a waived fee results in a prorated implementation fee becoming immediately due.
        </Text>

        <Text style={s.msaHeading}>5. 60-DAY SATISFACTION GUARANTEE</Text>
        <Text style={s.msaBody}>
          If Client does not achieve a measurable DSO reduction within sixty (60) days of go-live (defined as any reduction greater than 5% of baseline DSO), Client may cancel without penalty. This guarantee does not apply if Client has failed to provide required access, has not completed onboarding tasks, or if DSO increase is attributable to factors outside LunarLogic's control.
        </Text>

        <Text style={s.msaHeading}>6. INTELLECTUAL PROPERTY</Text>
        <Text style={s.msaBody}>
          LunarLogic retains all IP rights in the platform, workflows, and underlying technology. Client retains all rights to their own business data, customer data, and financial records. LunarLogic is granted a limited license to access Client Data solely to provide the Services. LunarLogic shall not sell or disclose Client Data to third parties except as required by law or to operate the Services.
        </Text>

        <Text style={s.msaHeading}>7. DATA SECURITY AND QUICKBOOKS ACCESS</Text>
        <Text style={s.msaBody}>
          LunarLogic accesses QuickBooks Online solely as necessary to create invoices and apply payments as authorized by Client. OAuth tokens are stored encrypted and refreshed automatically. LunarLogic does not store financial data beyond operational requirements. LunarLogic shall notify Client within 48 hours of becoming aware of any unauthorized access to Client Data.
        </Text>

        <Text style={s.msaHeading}>8. LIMITATION OF LIABILITY</Text>
        <Text style={s.msaBody}>
          LunarLogic's cumulative liability shall not exceed fees paid by Client in the three (3) months preceding the claim. LunarLogic shall not be liable for indirect, incidental, or consequential damages, including loss of profits.
        </Text>

        <Text style={s.msaHeading}>9. GOVERNING LAW</Text>
        <Text style={s.msaBody}>
          This Agreement is governed by the laws of the State of North Carolina. Disputes shall be resolved in the state or federal courts of Mecklenburg County, North Carolina.
        </Text>

        <View style={s.sigBlock}>
          <View style={s.sigCol}>
            <Text style={[s.msaBody, { fontFamily: 'Helvetica-Bold', color: C.text }]}>CLIENT</Text>
            <Text style={[s.msaBody, { marginTop: 4 }]}>{submission.businessName}</Text>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Signature</Text>
            <View style={[s.sigLine, { marginTop: 20 }]} />
            <Text style={s.sigLabel}>Printed Name</Text>
            <View style={[s.sigLine, { marginTop: 20 }]} />
            <Text style={s.sigLabel}>Title</Text>
            <View style={[s.sigLine, { marginTop: 20 }]} />
            <Text style={s.sigLabel}>Date</Text>
          </View>
          <View style={s.sigCol}>
            <Text style={[s.msaBody, { fontFamily: 'Helvetica-Bold', color: C.text }]}>LUNARLOGIC LLC</Text>
            <Text style={[s.msaBody, { marginTop: 4 }]}>Charlotte, North Carolina</Text>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Signature</Text>
            <View style={[s.sigLine, { marginTop: 20 }]} />
            <Text style={s.sigLabel}>Printed Name</Text>
            <View style={[s.sigLine, { marginTop: 20 }]} />
            <Text style={s.sigLabel}>Title</Text>
            <View style={[s.sigLine, { marginTop: 20 }]} />
            <Text style={s.sigLabel}>Date</Text>
          </View>
        </View>

        <Footer pageNum={6} total={totalPages} businessName={submission.businessName} />
      </Page>

      {/* PAGE 7 — Next Steps */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionHeader}>NEXT STEPS</Text>

        <View style={s.nextStepRow}>
          <View style={s.nextStepNum}><Text style={s.nextStepNumText}>1</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.nextStepTitle}>Schedule Your Kickoff Call</Text>
            <Text style={s.nextStepDesc}>
              Reply to this proposal or email support@lunarlogic.ai to book a 30-minute kickoff call. We'll review your QuickBooks setup, confirm selected modules, and set a go-live target date. Most clients are live within 3 weeks of kickoff.
            </Text>
          </View>
        </View>

        <View style={s.nextStepRow}>
          <View style={s.nextStepNum}><Text style={s.nextStepNumText}>2</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.nextStepTitle}>Sign the MSA and Submit Initial Payment</Text>
            <Text style={s.nextStepDesc}>
              Sign the Master Services Agreement included in this proposal and submit the first month's subscription fee plus the implementation fee (if applicable). We will send a DocuSign link and payment instructions within 24 hours of your kickoff call.
            </Text>
          </View>
        </View>

        <View style={s.nextStepRow}>
          <View style={s.nextStepNum}><Text style={s.nextStepNumText}>3</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.nextStepTitle}>Complete the Pre-Launch Checklist</Text>
            <Text style={s.nextStepDesc}>
              We will send a short pre-launch checklist covering: QuickBooks Online access grant, Slack bot installation, Google Sheets template setup, and Outlook/Gmail OAuth connection. Most clients complete this in under 2 hours. Our team is available for screen-share support throughout.
            </Text>
          </View>
        </View>

        <View style={[s.calloutCyan, { marginTop: 24 }]}>
          <Text style={[s.calloutLabel, { color: C.accent }]}>CONTACT</Text>
          <Text style={s.calloutItem}>support@lunarlogic.ai - LunarLogic LLC - Charlotte, NC</Text>
        </View>

        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: C.accent, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 8 }}>
            We earn your business every month through results.
          </Text>
          <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>- LunarLogic LLC</Text>
          <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.accent, marginTop: 20, letterSpacing: 4 }}>
            lunarlogic
          </Text>
        </View>

        <Footer pageNum={7} total={totalPages} businessName={submission.businessName} />
      </Page>

    </Document>
  );
}

// ─── Export function ──────────────────────────────────────────────────────────
export async function generateProposalPDF(
  submission: OnboardingData & { id: string },
  gapAnalysis: GapAnalysisReport,
  roi: ROIResult,
  proposalDraft: string
): Promise<Buffer> {
  const element = React.createElement(ProposalDocument, {
    submission,
    gapAnalysis,
    roi,
    proposalDraft,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uint8 = await renderToBuffer(element as unknown as React.ReactElement<any>);
  return Buffer.from(uint8);
}
