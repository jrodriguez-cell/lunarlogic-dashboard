import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { Submission } from '@/types/onboarding';
import { computeROI, formatCurrency, parseRevenueToNumber, parseDSOToNumber } from './roi';
import { format } from 'date-fns';

const colors = {
  navy: '#0A0F1E',
  blue: '#1A3A6B',
  indigo: '#2D5BE3',
  sky: '#4A9FFF',
  white: '#F7F9FC',
  gray: '#8A94A6',
  silver: '#D1D9E6',
  success: '#00C48C',
  warn: '#F59E0B',
  surface: '#141C2F',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.navy,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.blue,
    paddingBottom: 16,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.sky,
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 2,
  },
  pageNumber: {
    fontSize: 10,
    color: colors.gray,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.blue,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.indigo,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.blue,
  },
  rowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  label: {
    fontSize: 10,
    color: colors.gray,
    flex: 1,
  },
  value: {
    fontSize: 10,
    color: colors.white,
    flex: 1,
    textAlign: 'right',
  },
  valueHighlight: {
    fontSize: 10,
    color: colors.success,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  bigNumber: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.success,
    textAlign: 'center',
    marginVertical: 8,
  },
  bigLabel: {
    fontSize: 11,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 4,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  modulePill: {
    backgroundColor: colors.indigo,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  modulePillText: {
    fontSize: 10,
    color: colors.white,
    fontFamily: 'Helvetica-Bold',
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.indigo,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotText: {
    fontSize: 10,
    color: colors.white,
    fontFamily: 'Helvetica-Bold',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  timelineDesc: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.blue,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: colors.gray,
  },
});

interface PDFDocumentProps {
  submission: Submission;
}

const pricingTiers = [
  { name: 'Essentials', price: '$697/mo', invoices: '150 invoices' },
  { name: 'Professional', price: '$1,497/mo', invoices: '250 invoices' },
  { name: 'Business', price: '$2,497/mo', invoices: '400 invoices' },
];

const moduleDescriptions: Record<string, string> = {
  IA: 'Intelligent Automation — AI-powered invoice creation and approval workflows',
  PR: 'Proactive Reminders — Automated payment reminder sequences via email and Slack',
  SO: 'Sales Order Processing — End-to-end order-to-invoice automation',
  AR: 'AR Dashboard — Real-time AR aging and DSO visualization',
};

export function PDFDocument({ submission }: PDFDocumentProps) {
  const revenue = parseRevenueToNumber(submission.annualRevenue);
  const dso = parseDSOToNumber(submission.currentDso);
  const roi = computeROI(revenue, dso);
  const dateStr = format(new Date(submission.createdAt), 'MMMM d, yyyy');

  const recommendedTier = submission.monthlyInvoiceCount?.includes('50') ? pricingTiers[0]
    : submission.monthlyInvoiceCount?.includes('100') ? pricingTiers[0]
    : submission.monthlyInvoiceCount?.includes('200') ? pricingTiers[1]
    : pricingTiers[1];

  return (
    <Document>
      {/* Page 1: Client Overview */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>LUNARLOGIC</Text>
            <Text style={styles.logoSub}>AR Automation Platform</Text>
          </View>
          <Text style={styles.pageNumber}>Page 1 of 4</Text>
        </View>

        <Text style={styles.title}>Client Overview</Text>
        <Text style={styles.subtitle}>Prepared for {submission.businessName} · {dateStr}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Information</Text>
          <View style={styles.row}><Text style={styles.label}>Business Name</Text><Text style={styles.value}>{submission.businessName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Owner</Text><Text style={styles.value}>{submission.ownerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{submission.ownerEmail}</Text></View>
          {submission.ownerPhone && <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{submission.ownerPhone}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Industry</Text><Text style={styles.value}>{submission.industry}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Annual Revenue</Text><Text style={styles.value}>{submission.annualRevenue}</Text></View>
          <View style={styles.rowLast}><Text style={styles.label}>Employee Count</Text><Text style={styles.value}>{submission.employeeCount ?? 'Not specified'}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>QuickBooks Configuration</Text>
          <View style={styles.row}><Text style={styles.label}>QB Version</Text><Text style={styles.value}>{submission.qbVersion}</Text></View>
          <View style={styles.row}><Text style={styles.label}>QB Manager</Text><Text style={styles.value}>{submission.qbManager}</Text></View>
          <View style={styles.rowLast}><Text style={styles.label}>Current State</Text><Text style={styles.value}>{submission.qbCurrentState}</Text></View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>CONFIDENTIAL · LunarLogic LLC · support@lunarlogic.ai</Text>
          <Text style={styles.footerText}>{dateStr}</Text>
        </View>
      </Page>

      {/* Page 2: ROI Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>LUNARLOGIC</Text>
            <Text style={styles.logoSub}>AR Automation Platform</Text>
          </View>
          <Text style={styles.pageNumber}>Page 2 of 4</Text>
        </View>

        <Text style={styles.title}>ROI Analysis</Text>
        <Text style={styles.subtitle}>Projected 12-month financial impact for {submission.businessName}</Text>

        <View style={styles.card}>
          <Text style={styles.bigLabel}>Projected Year 1 Value</Text>
          <Text style={styles.bigNumber}>{formatCurrency(roi.totalYear1)}</Text>
          <Text style={[styles.bigLabel, { color: colors.warn }]}>{roi.roi}x ROI multiple</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>DSO Improvement</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Current DSO</Text>
            <Text style={[styles.value, { color: colors.warn }]}>{roi.currentDSO} days</Text>
          </View>
          <View style={styles.rowLast}>
            <Text style={styles.label}>Target DSO (after LunarLogic)</Text>
            <Text style={styles.valueHighlight}>{roi.targetDSO} days ({Math.round((1 - roi.targetDSO / roi.currentDSO) * 100)}% reduction)</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Value Breakdown</Text>
          <View style={styles.row}><Text style={styles.label}>Working Capital Currently Locked</Text><Text style={[styles.value, { color: colors.warn }]}>{formatCurrency(roi.wcLocked)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Working Capital to be Released</Text><Text style={styles.valueHighlight}>{formatCurrency(roi.wcReleased)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Bad Debt Savings (70% reduction)</Text><Text style={styles.valueHighlight}>{formatCurrency(roi.badDebtSavings)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Unbilled Revenue Recovered</Text><Text style={styles.valueHighlight}>{formatCurrency(roi.unbilledRecovered)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Labor Hours Saved</Text><Text style={styles.valueHighlight}>{formatCurrency(roi.laborSaved)}</Text></View>
          <View style={[styles.rowLast, { borderTopWidth: 1, borderTopColor: colors.indigo, paddingTop: 8, marginTop: 4 }]}>
            <Text style={[styles.label, { fontFamily: 'Helvetica-Bold', fontSize: 11 }]}>Total Year 1 Value</Text>
            <Text style={[styles.valueHighlight, { fontSize: 13 }]}>{formatCurrency(roi.totalYear1)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>CONFIDENTIAL · LunarLogic LLC · support@lunarlogic.ai</Text>
          <Text style={styles.footerText}>ROI projections based on Kaptain Clean LLC results</Text>
        </View>
      </Page>

      {/* Page 3: Recommended Workflow */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>LUNARLOGIC</Text>
            <Text style={styles.logoSub}>AR Automation Platform</Text>
          </View>
          <Text style={styles.pageNumber}>Page 3 of 4</Text>
        </View>

        <Text style={styles.title}>Recommended Workflow</Text>
        <Text style={styles.subtitle}>Selected modules and deployment plan for {submission.businessName}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Modules</Text>
          <View style={styles.moduleGrid}>
            {submission.modulesSelected.map((mod) => (
              <View key={mod} style={styles.modulePill}>
                <Text style={styles.modulePillText}>{mod}</Text>
              </View>
            ))}
          </View>
          {submission.modulesSelected.map((mod) => (
            <View key={mod} style={{ marginTop: 10 }}>
              <Text style={[styles.label, { fontFamily: 'Helvetica-Bold', color: colors.sky }]}>{mod}</Text>
              <Text style={[styles.label, { marginTop: 2 }]}>{moduleDescriptions[mod] ?? mod}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Integrations</Text>
          {submission.usesSlack && <View style={styles.row}><Text style={styles.label}>Slack</Text><Text style={[styles.value, { color: colors.success }]}>Connected</Text></View>}
          {submission.usesStripe && <View style={styles.row}><Text style={styles.label}>Stripe</Text><Text style={[styles.value, { color: colors.success }]}>Connected</Text></View>}
          {submission.usesGoogleSheets && <View style={styles.row}><Text style={styles.label}>Google Sheets</Text><Text style={[styles.value, { color: colors.success }]}>Connected</Text></View>}
          <View style={styles.rowLast}><Text style={styles.label}>QuickBooks Online</Text><Text style={[styles.value, { color: colors.success }]}>Required</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>4-Phase Deployment Timeline</Text>
          <View style={styles.timeline}>
            {([
              { phase: '1', title: 'Discovery & Setup (Week 1-2)', desc: 'QB connection, data audit, workflow configuration, team onboarding' },
              { phase: '2', title: 'Parallel Testing (Week 3-4)', desc: 'Run alongside existing process, validate accuracy, tune AI matching' },
              { phase: '3', title: 'Go Live (Week 5)', desc: 'Full cutover, monitor first invoice cycle, Slack approval training' },
              { phase: '4', title: 'Optimization (Month 2-3)', desc: 'DSO tracking, payment behavior analysis, workflow refinements' },
            ] as const).map((item) => (
              <View key={item.phase} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <Text style={styles.timelineDotText}>{item.phase}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>CONFIDENTIAL · LunarLogic LLC · support@lunarlogic.ai</Text>
          <Text style={styles.footerText}>Target start: {submission.targetStartDate ?? 'TBD'}</Text>
        </View>
      </Page>

      {/* Page 4: Proposal Footer */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>LUNARLOGIC</Text>
            <Text style={styles.logoSub}>AR Automation Platform</Text>
          </View>
          <Text style={styles.pageNumber}>Page 4 of 4</Text>
        </View>

        <Text style={styles.title}>Investment & Next Steps</Text>
        <Text style={styles.subtitle}>Pricing recommendation for {submission.businessName}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing Tiers</Text>
          {pricingTiers.map((tier) => (
            <View key={tier.name} style={[
              styles.row,
              tier.name === recommendedTier.name ? { backgroundColor: colors.blue, borderRadius: 4, paddingHorizontal: 8 } : {},
            ]}>
              <Text style={[styles.label, tier.name === recommendedTier.name ? { color: colors.white, fontFamily: 'Helvetica-Bold' } : {}]}>
                {tier.name}{tier.name === recommendedTier.name ? ' (Recommended)' : ''}
              </Text>
              <Text style={[styles.value, tier.name === recommendedTier.name ? { color: colors.sky } : {}]}>
                {tier.price} · {tier.invoices}
              </Text>
            </View>
          ))}
          <View style={[styles.rowLast, { marginTop: 8 }]}>
            <Text style={[styles.label, { fontFamily: 'Helvetica-Oblique', fontSize: 9 }]}>Implementation fee: $2,500 (waived for 12-month commitments)</Text>
          </View>
        </View>

        <View style={[styles.card, { borderColor: colors.success }]}>
          <Text style={[styles.cardTitle, { color: colors.success }]}>60-Day Satisfaction Guarantee</Text>
          <Text style={[styles.label, { fontSize: 10, lineHeight: 1.6 }]}>
            If you do not see measurable DSO improvement within 60 days of go-live, we will refund your implementation fee in full. We are that confident in the results.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.indigo }]}>
          <Text style={[styles.cardTitle, { color: colors.white }]}>Contact LunarLogic</Text>
          <View style={styles.row}><Text style={[styles.label, { color: colors.silver }]}>Email</Text><Text style={[styles.value, { color: colors.white }]}>support@lunarlogic.ai</Text></View>
          <View style={styles.rowLast}><Text style={[styles.label, { color: colors.silver }]}>Overage Rate</Text><Text style={[styles.value, { color: colors.white }]}>$5/invoice above plan limit</Text></View>
        </View>

        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.sky, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>
            We earn your business every month through results.
          </Text>
          <Text style={{ fontSize: 10, color: colors.gray, marginTop: 8, textAlign: 'center' }}>
            — LunarLogic LLC
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>CONFIDENTIAL · LunarLogic LLC · support@lunarlogic.ai</Text>
          <Text style={[styles.footerText, { color: colors.sky }]}>lunarlogic.ai</Text>
        </View>
      </Page>
    </Document>
  );
}
