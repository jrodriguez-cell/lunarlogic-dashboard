import Anthropic from '@anthropic-ai/sdk';
import type { OnboardingData, ROIResult } from '@/types/onboarding';
import type { GapAnalysisReport } from './gap-analysis';
import { formatCurrency } from './roi';

function getPricingTier(monthlyInvoiceCount: string): { tier: string; price: string } {
  if (monthlyInvoiceCount === 'Under 30' || monthlyInvoiceCount === '30 – 50') {
    return { tier: 'Essentials', price: '$697/mo (up to 150 invoices)' };
  }
  if (
    monthlyInvoiceCount === '50 – 100' ||
    monthlyInvoiceCount === '100 – 150' ||
    monthlyInvoiceCount === '150 – 250'
  ) {
    return { tier: 'Professional', price: '$1,497/mo (up to 250 invoices)' };
  }
  return { tier: 'Business', price: '$2,497/mo (up to 400 invoices)' };
}

function buildSystemPrompt(): string {
  return `You are a senior solutions consultant at LunarLogic LLC, an AR automation company that helps small professional services firms (8–20 employees) using QuickBooks Online and Slack automate their Order-to-Cash cycle.

Your task is to write professional business proposals for prospective clients. Each proposal should be:
- Specific to the client's business name, industry, and stated pain points
- Grounded in the actual gap analysis and ROI figures provided
- Professional but direct — no filler, no fluff
- Structured with clear section headers

LunarLogic's core proof point: Kaptain Clean LLC achieved an 84% reduction in invoice processing time and a 19-day DSO improvement. Lead with DSO reduction as the core value proposition.

The proposal should feel like it was written by someone who deeply understands the client's situation, not a template.`;
}

function buildUserPrompt(
  submission: OnboardingData,
  gapAnalysis: GapAnalysisReport,
  roi: ROIResult
): string {
  const pricing = getPricingTier(submission.monthlyInvoiceCount);
  const selectedAnalyses = gapAnalysis.workflowAnalyses.filter((a) => a.selected);
  const moduleDescriptions: Record<string, string> = {
    IA: 'Invoice Automation (WF1A/WF1B)',
    PR: 'Payment Reminders (WF2)',
    SO: 'Payment Receipt & Cash Application (WF3)',
    AR: 'AR Aging Dashboard',
  };
  const selectedModuleNames = submission.modulesSelected
    .map((m) => moduleDescriptions[m] ?? m)
    .join(', ');

  const workflowSummary = selectedAnalyses
    .map(
      (a) =>
        `- ${a.workflowName}: ${a.readinessScore}% ready (${a.status})${
          a.gaps.length > 0
            ? `, gaps: ${a.gaps.map((g) => g.item).join('; ')}`
            : ', no gaps'
        }`
    )
    .join('\n');

  const deploymentOrder = gapAnalysis.recommendedDeploymentOrder.join(' → ');
  const wf3Selected = submission.modulesSelected.includes('SO');

  return `Write a complete business proposal for the following prospect. Use plain text with clear section headers (using ALL CAPS or dashes for headers, not markdown).

CLIENT DETAILS:
- Business Name: ${submission.businessName}
- Owner: ${submission.ownerName}
- Industry: ${submission.industry}${submission.industryOther ? ` (${submission.industryOther})` : ''}
- Annual Revenue: ${submission.annualRevenue}
- Employee Count: ${submission.employeeCount ?? 'Not specified'}
- Monthly Invoice Volume: ${submission.monthlyInvoiceCount}
- Current DSO: ${roi.currentDSO} days
- Stated Pain Point: "${submission.biggestArPain}"
- Pain Categories: ${submission.biggestPainCategory.join(', ')}
- Nearly Missed Payroll: ${submission.nearlyMissedPayroll ? 'YES — high urgency' : 'No'}
- QuickBooks: ${submission.qbVersion}
- Modules Selected: ${selectedModuleNames}
- Target Start Date: ${submission.targetStartDate ?? 'Not specified'}

GAP ANALYSIS SUMMARY:
- Overall Readiness: ${gapAnalysis.overallReadiness}%
- Blockers: ${gapAnalysis.blockers.length > 0 ? gapAnalysis.blockers.join('; ') : 'None'}
- Quick Wins: ${gapAnalysis.quickWins.length > 0 ? gapAnalysis.quickWins.join('; ') : 'None identified'}
- Workflow Readiness:
${workflowSummary}
- Recommended Deployment Order: ${deploymentOrder}
${gapAnalysis.implementationNotes.length > 0 ? `- Implementation Notes: ${gapAnalysis.implementationNotes.join('; ')}` : ''}

ROI PROJECTION:
- Current DSO: ${roi.currentDSO} days → Target DSO: ${roi.targetDSO} days
- Working Capital Released: ${formatCurrency(roi.wcReleased)}
- Bad Debt Savings: ${formatCurrency(roi.badDebtSavings)}
- Unbilled Revenue Recovered: ${formatCurrency(roi.unbilledRecovered)}
- Labor Saved: ${formatCurrency(roi.laborSaved)}
- Total Year 1 Value: ${formatCurrency(roi.totalYear1)}
- ROI Multiple: ${roi.roi}x

PRICING:
- Recommended Tier: ${pricing.tier} — ${pricing.price}
- Implementation Fee: $2,500 (waivable on 12-month commitment)
- Overage: $5/invoice
- Guarantee: 60-day satisfaction guarantee
${wf3Selected ? '- NOTE: WF3 (Payment Receipt & Cash Application) is in development — estimated Q3 2026 delivery' : ''}

Write the proposal with these exact sections:
1. EXECUTIVE SUMMARY
2. RECOMMENDED MODULES
3. IMPLEMENTATION READINESS
4. DEPLOYMENT TIMELINE
5. ROI PROJECTION
6. INVESTMENT
7. NEXT STEPS
8. CLOSING

End with exactly this line: "We earn your business every month through results. — LunarLogic LLC"`;
}

export async function generateProposalDraft(
  submission: OnboardingData,
  gapAnalysis: GapAnalysisReport,
  roi: ROIResult
): Promise<string> {
  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(submission, gapAnalysis, roi),
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in response');
    }
    return textBlock.text;
  } catch (err) {
    console.error('Failed to generate proposal draft:', err);

    // Fallback template
    const pricing = getPricingTier(submission.monthlyInvoiceCount);
    return `LUNARLOGIC LLC — PROPOSAL FOR ${submission.businessName.toUpperCase()}
Prepared for: ${submission.ownerName}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

EXECUTIVE SUMMARY

[AI generation unavailable — please regenerate from the admin panel]

This proposal outlines LunarLogic's recommended AR automation solution for ${submission.businessName}. Based on your current DSO of ${roi.currentDSO} days and monthly invoice volume of ${submission.monthlyInvoiceCount}, our platform projects a DSO reduction to ${roi.targetDSO} days and ${formatCurrency(roi.totalYear1)} in Year 1 value.

---

RECOMMENDED MODULES

${submission.modulesSelected.join(', ')}

---

IMPLEMENTATION READINESS

Overall Readiness: ${gapAnalysis.overallReadiness}%
${gapAnalysis.blockers.length > 0 ? `Blockers to resolve: ${gapAnalysis.blockers.join('; ')}` : 'No blocking gaps identified.'}

---

DEPLOYMENT TIMELINE

${gapAnalysis.recommendedDeploymentOrder.join('\n')}

---

ROI PROJECTION

Current DSO: ${roi.currentDSO} days → Target DSO: ${roi.targetDSO} days
Working Capital Released: ${formatCurrency(roi.wcReleased)}
Total Year 1 Value: ${formatCurrency(roi.totalYear1)}
ROI Multiple: ${roi.roi}x

---

INVESTMENT

Recommended Tier: ${pricing.tier} — ${pricing.price}
Implementation Fee: $2,500 (waivable on 12-month commitment)
60-day satisfaction guarantee

---

NEXT STEPS

• Schedule a 45-minute discovery call to confirm scope and timeline
• Connect QuickBooks Online for a read-only data audit
• Review and sign the Master Services Agreement

---

We earn your business every month through results. — LunarLogic LLC`;
  }
}
