import type { OnboardingData, ROIResult } from '@/types/onboarding';

export interface RequirementCheck {
  name: string;
  required: boolean; // true = hard requirement, false = soft
  met: boolean;
  clientValue: string;
  notes: string;
}

export interface WorkflowGap {
  severity: 'blocking' | 'major' | 'minor';
  item: string;
  resolution: string;
  estimatedEffort: string;
}

export interface WorkflowAnalysis {
  workflowId: 'WF1A' | 'WF1B' | 'WF2' | 'WF3' | 'AR';
  workflowName: string;
  selected: boolean;
  readinessScore: number;
  status: 'ready' | 'minor-gaps' | 'major-gaps' | 'blocked';
  requirements: RequirementCheck[];
  gaps: WorkflowGap[];
  deploymentPhase: number;
}

export interface GapAnalysisReport {
  overallReadiness: number;
  recommendedDeploymentOrder: string[];
  blockers: string[];
  workflowAnalyses: WorkflowAnalysis[];
  quickWins: string[];
  implementationNotes: string[];
  generatedAt: string;
}

function computeScore(gaps: WorkflowGap[]): number {
  let score = 100;
  for (const gap of gaps) {
    if (gap.severity === 'blocking') score -= 40;
    else if (gap.severity === 'major') score -= 20;
    else score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

function scoreToStatus(score: number): WorkflowAnalysis['status'] {
  if (score >= 80) return 'ready';
  if (score >= 60) return 'minor-gaps';
  if (score >= 30) return 'major-gaps';
  return 'blocked';
}

function analyzeWF1A(data: OnboardingData): WorkflowAnalysis {
  const requirements: RequirementCheck[] = [];
  const gaps: WorkflowGap[] = [];

  // QB Online — blocking
  const qbOnline = data.qbVersion === 'Online';
  requirements.push({
    name: 'QuickBooks Online',
    required: true,
    met: qbOnline,
    clientValue: data.qbVersion || 'Not specified',
    notes: qbOnline
      ? 'QBO confirmed — required for API integration.'
      : 'WF1A requires QuickBooks Online. Desktop is not supported.',
  });
  if (!qbOnline) {
    gaps.push({
      severity: 'blocking',
      item: 'QuickBooks Desktop detected',
      resolution: 'Client must migrate to QuickBooks Online before WF1A can be deployed.',
      estimatedEffort: '2-4 weeks (QBO migration)',
    });
  }

  // Slack — blocking
  const hasSlack = data.usesSlack === true;
  requirements.push({
    name: 'Slack (PDF upload + approvals)',
    required: true,
    met: hasSlack,
    clientValue: data.usesSlack ? 'Yes' : 'No',
    notes: hasSlack
      ? 'Slack confirmed — required for PDF upload trigger and approval flows.'
      : 'WF1A requires Slack for PDF invoice upload and human-in-the-loop approvals.',
  });
  if (!hasSlack) {
    gaps.push({
      severity: 'blocking',
      item: 'Slack not in use',
      resolution: 'Client must adopt Slack and install the LunarLogic bot before WF1A can be deployed.',
      estimatedEffort: '1-2 weeks (Slack onboarding + bot setup)',
    });
  }

  // Google Sheets — major
  const hasSheets = data.usesGoogleSheets === true;
  requirements.push({
    name: 'Google Sheets (OAuth token store + logging)',
    required: true,
    met: hasSheets,
    clientValue: data.usesGoogleSheets ? 'Yes' : 'No',
    notes: hasSheets
      ? 'Google Sheets confirmed — used for OAuth token storage and workflow logging.'
      : 'Google Sheets is required for OAuth token storage and audit logging.',
  });
  if (!hasSheets) {
    gaps.push({
      severity: 'major',
      item: 'Google Sheets not in use',
      resolution: 'Set up a Google Workspace account and share the LunarLogic sheets template with the service account.',
      estimatedEffort: '2-4 hours',
    });
  }

  // QB books cleanliness — major
  const qbState = data.qbCurrentState.toLowerCase();
  const hasQBCleanupIssue = qbState.includes('significant') || qbState.includes('cleanup');
  requirements.push({
    name: 'Clean QuickBooks books',
    required: false,
    met: !hasQBCleanupIssue,
    clientValue: data.qbCurrentState,
    notes: hasQBCleanupIssue
      ? 'QB books need cleanup — customer matching accuracy may be reduced until resolved.'
      : 'QB books appear to be in acceptable state for automated customer matching.',
  });
  if (hasQBCleanupIssue) {
    gaps.push({
      severity: 'major',
      item: 'QuickBooks books need cleanup',
      resolution: 'Reconcile and clean QB records before go-live. Duplicate customers and stale invoices will reduce AI matching accuracy.',
      estimatedEffort: '1-2 sprints (client-side cleanup)',
    });
  }

  // Invoice creation method — minor
  const invoiceCreation = data.invoiceCreation.toLowerCase();
  const hasIdealInvoiceMethod =
    invoiceCreation.includes('sales order') || invoiceCreation.includes('third-party') || invoiceCreation.includes('third party');
  requirements.push({
    name: 'Invoice creation via sales orders or third-party software',
    required: false,
    met: hasIdealInvoiceMethod,
    clientValue: data.invoiceCreation,
    notes: hasIdealInvoiceMethod
      ? 'Invoice creation method is compatible with PDF automation path.'
      : 'Client invoices manually — WF1A PDF path still works but may require additional training on the approval flow.',
  });
  if (!hasIdealInvoiceMethod) {
    gaps.push({
      severity: 'minor',
      item: 'Invoice creation not via sales orders or third-party software',
      resolution: 'Adjust approval workflow prompts for manual invoice context. No technical blocker — training only.',
      estimatedEffort: '1-2 hours (prompt tuning)',
    });
  }

  const readinessScore = computeScore(gaps);
  return {
    workflowId: 'WF1A',
    workflowName: 'Invoice Automation — PDF Upload',
    selected: data.modulesSelected.includes('IA'),
    readinessScore,
    status: scoreToStatus(readinessScore),
    requirements,
    gaps,
    deploymentPhase: 1,
  };
}

function analyzeWF1B(data: OnboardingData): WorkflowAnalysis {
  const requirements: RequirementCheck[] = [];
  const gaps: WorkflowGap[] = [];

  // QB Online — blocking
  const qbOnline = data.qbVersion === 'Online';
  requirements.push({
    name: 'QuickBooks Online',
    required: true,
    met: qbOnline,
    clientValue: data.qbVersion || 'Not specified',
    notes: qbOnline
      ? 'QBO confirmed — required for API integration.'
      : 'WF1B requires QuickBooks Online. Desktop is not supported.',
  });
  if (!qbOnline) {
    gaps.push({
      severity: 'blocking',
      item: 'QuickBooks Desktop detected',
      resolution: 'Client must migrate to QuickBooks Online before WF1B can be deployed.',
      estimatedEffort: '2-4 weeks (QBO migration)',
    });
  }

  // Slack — blocking
  const hasSlack = data.usesSlack === true;
  requirements.push({
    name: 'Slack (text command input + approvals)',
    required: true,
    met: hasSlack,
    clientValue: data.usesSlack ? 'Yes' : 'No',
    notes: hasSlack
      ? 'Slack confirmed — required for text command trigger and approval flows.'
      : 'WF1B requires Slack for text-based invoice requests and approvals.',
  });
  if (!hasSlack) {
    gaps.push({
      severity: 'blocking',
      item: 'Slack not in use',
      resolution: 'Client must adopt Slack and install the LunarLogic bot before WF1B can be deployed.',
      estimatedEffort: '1-2 weeks (Slack onboarding + bot setup)',
    });
  }

  // Google Sheets — major
  const hasSheets = data.usesGoogleSheets === true;
  requirements.push({
    name: 'Google Sheets (OAuth token store + logging)',
    required: true,
    met: hasSheets,
    clientValue: data.usesGoogleSheets ? 'Yes' : 'No',
    notes: hasSheets
      ? 'Google Sheets confirmed — used for OAuth token storage and workflow logging.'
      : 'Google Sheets is required for OAuth token storage and audit logging.',
  });
  if (!hasSheets) {
    gaps.push({
      severity: 'major',
      item: 'Google Sheets not in use',
      resolution: 'Set up Google Workspace and configure the LunarLogic sheets template.',
      estimatedEffort: '2-4 hours',
    });
  }

  // QB books cleanliness — major
  const qbState = data.qbCurrentState.toLowerCase();
  const hasQBCleanupIssue = qbState.includes('significant') || qbState.includes('cleanup');
  requirements.push({
    name: 'Clean QuickBooks books',
    required: false,
    met: !hasQBCleanupIssue,
    clientValue: data.qbCurrentState,
    notes: hasQBCleanupIssue
      ? 'QB books need cleanup — customer lookup accuracy may be reduced.'
      : 'QB books appear to be in acceptable state for customer lookups.',
  });
  if (hasQBCleanupIssue) {
    gaps.push({
      severity: 'major',
      item: 'QuickBooks books need cleanup',
      resolution: 'Reconcile QB records. Duplicate customer names will cause ambiguous matches on text commands.',
      estimatedEffort: '1-2 sprints (client-side cleanup)',
    });
  }

  // Invoice creation method — for WF1B, manual is actually ideal
  const invoiceCreation = data.invoiceCreation.toLowerCase();
  const isManualEntry =
    invoiceCreation.includes('manually in quickbooks') ||
    invoiceCreation.includes('manually in spreadsheet') ||
    invoiceCreation.includes('manual');
  requirements.push({
    name: 'Invoices created manually (ideal for text command path)',
    required: false,
    met: isManualEntry,
    clientValue: data.invoiceCreation,
    notes: isManualEntry
      ? 'Manual invoice entry is the ideal use case for WF1B — text commands replace the manual QB entry step entirely.'
      : 'Client already uses automated invoice creation — WF1B text path adds an alternative channel but may have lower adoption.',
  });
  if (!isManualEntry) {
    gaps.push({
      severity: 'minor',
      item: 'Client uses automated invoice creation — WF1B text path may see lower adoption',
      resolution: 'Position WF1B as a quick ad-hoc invoice tool alongside existing automation.',
      estimatedEffort: '1 hour (positioning + training)',
    });
  }

  const readinessScore = computeScore(gaps);
  return {
    workflowId: 'WF1B',
    workflowName: 'Invoice Automation — Text Command',
    selected: data.modulesSelected.includes('IA'),
    readinessScore,
    status: scoreToStatus(readinessScore),
    requirements,
    gaps,
    deploymentPhase: 1,
  };
}

function analyzeWF2(data: OnboardingData): WorkflowAnalysis {
  const requirements: RequirementCheck[] = [];
  const gaps: WorkflowGap[] = [];

  // QB Online — blocking
  const qbOnline = data.qbVersion === 'Online';
  requirements.push({
    name: 'QuickBooks Online',
    required: true,
    met: qbOnline,
    clientValue: data.qbVersion || 'Not specified',
    notes: qbOnline
      ? 'QBO confirmed — required for querying unpaid invoices.'
      : 'WF2 requires QuickBooks Online to query open invoices daily.',
  });
  if (!qbOnline) {
    gaps.push({
      severity: 'blocking',
      item: 'QuickBooks Desktop detected',
      resolution: 'Client must migrate to QuickBooks Online before WF2 can be deployed.',
      estimatedEffort: '2-4 weeks (QBO migration)',
    });
  }

  // Slack — major
  const hasSlack = data.usesSlack === true;
  requirements.push({
    name: 'Slack (daily AR summary)',
    required: true,
    met: hasSlack,
    clientValue: data.usesSlack ? 'Yes' : 'No',
    notes: hasSlack
      ? 'Slack confirmed — WF2 posts daily AR aging summaries to a Slack channel.'
      : 'Slack is required for daily AR aging summaries. This can be configured as a non-blocking alternative channel but is strongly recommended.',
  });
  if (!hasSlack) {
    gaps.push({
      severity: 'major',
      item: 'Slack not in use',
      resolution: 'Adopt Slack for the daily AR summary channel. Alternatively, configure email digest (additional setup required).',
      estimatedEffort: '1-2 weeks (Slack onboarding)',
    });
  }

  // Email (Outlook or Gmail) — major
  const hasEmail = data.usesEmail === true;
  requirements.push({
    name: 'Outlook or Gmail (customer-facing reminder emails)',
    required: true,
    met: hasEmail,
    clientValue: data.usesEmail ? 'Yes' : 'No',
    notes: hasEmail
      ? 'Email integration confirmed — WF2 sends customer-facing reminders via Outlook (Microsoft Graph) or Gmail API.'
      : 'An email provider (Outlook or Gmail) is required for sending customer-facing payment reminders.',
  });
  if (!hasEmail) {
    gaps.push({
      severity: 'major',
      item: 'No email provider configured',
      resolution: 'Connect Outlook (Microsoft Graph API) or Gmail API. Client must have a business email account to use as sender.',
      estimatedEffort: '4-8 hours (OAuth setup + testing)',
    });
  }

  // Google Sheets — major
  const hasSheets = data.usesGoogleSheets === true;
  requirements.push({
    name: 'Google Sheets (VIP exemption list + pilot list)',
    required: true,
    met: hasSheets,
    clientValue: data.usesGoogleSheets ? 'Yes' : 'No',
    notes: hasSheets
      ? 'Google Sheets confirmed — used for VIP exemption list and pilot customer list.'
      : 'Google Sheets is required for managing VIP exemptions and pilot customer targeting.',
  });
  if (!hasSheets) {
    gaps.push({
      severity: 'major',
      item: 'Google Sheets not in use',
      resolution: 'Set up Google Workspace and configure the VIP exemption and pilot customer sheets.',
      estimatedEffort: '2-4 hours',
    });
  }

  // DSO > 25 days — soft
  const dsoValue = data.currentDso.toLowerCase();
  const dsoIsHealthy =
    dsoValue.includes('under 20') || dsoValue === '20 – 30 days' || dsoValue === '20-30';
  requirements.push({
    name: 'DSO > 25 days (meaningful ROI threshold)',
    required: false,
    met: !dsoIsHealthy,
    clientValue: data.currentDso,
    notes: dsoIsHealthy
      ? 'Client DSO is already healthy (under ~25 days). Payment reminders will still add value but ROI may be lower than typical.'
      : 'DSO is above the 25-day threshold — WF2 payment reminders will have meaningful impact.',
  });
  if (dsoIsHealthy) {
    gaps.push({
      severity: 'minor',
      item: 'DSO is already healthy — lower-than-typical ROI from reminders',
      resolution: 'Set expectation with client that reminders are more of a hygiene measure. Focus proposal on other modules.',
      estimatedEffort: '0 hours (expectation management only)',
    });
  }

  // Invoice count — soft
  const invoiceCount = data.monthlyInvoiceCount;
  const tooFewInvoices = invoiceCount === 'Under 30';
  requirements.push({
    name: 'At least 30 invoices per month',
    required: false,
    met: !tooFewInvoices,
    clientValue: invoiceCount,
    notes: tooFewInvoices
      ? 'Under 30 invoices/month — reminders will still work but automation ROI is lower at this volume.'
      : 'Invoice volume is sufficient for meaningful reminder automation ROI.',
  });
  if (tooFewInvoices) {
    gaps.push({
      severity: 'minor',
      item: 'Low invoice volume (under 30/month)',
      resolution: 'WF2 will still function, but ROI calculation should reflect lower volume. Consider the Essentials tier.',
      estimatedEffort: '0 hours (pricing guidance only)',
    });
  }

  const readinessScore = computeScore(gaps);
  return {
    workflowId: 'WF2',
    workflowName: 'Payment Reminders',
    selected: data.modulesSelected.includes('PR'),
    readinessScore,
    status: scoreToStatus(readinessScore),
    requirements,
    gaps,
    deploymentPhase: 1,
  };
}

function analyzeWF3(data: OnboardingData): WorkflowAnalysis {
  const requirements: RequirementCheck[] = [];
  const gaps: WorkflowGap[] = [];

  // QB Online — blocking
  const qbOnline = data.qbVersion === 'Online';
  requirements.push({
    name: 'QuickBooks Online',
    required: true,
    met: qbOnline,
    clientValue: data.qbVersion || 'Not specified',
    notes: qbOnline
      ? 'QBO confirmed — required for cash application to invoices.'
      : 'WF3 requires QuickBooks Online.',
  });
  if (!qbOnline) {
    gaps.push({
      severity: 'blocking',
      item: 'QuickBooks Desktop detected',
      resolution: 'Client must migrate to QuickBooks Online before WF3 can be deployed.',
      estimatedEffort: '2-4 weeks (QBO migration)',
    });
  }

  // WF3 not yet built — always flag
  gaps.push({
    severity: 'major',
    item: 'WF3 is not yet built — in development',
    resolution: 'Payment Receipt & Cash Application is on the LunarLogic roadmap. Estimated delivery: Q3 2026.',
    estimatedEffort: '1 sprint (LunarLogic development)',
  });

  const readinessScore = computeScore(gaps);
  return {
    workflowId: 'WF3',
    workflowName: 'Payment Receipt & Cash Application',
    selected: data.modulesSelected.includes('SO'),
    readinessScore,
    status: scoreToStatus(readinessScore),
    requirements,
    gaps,
    deploymentPhase: 3,
  };
}

function analyzeAR(data: OnboardingData): WorkflowAnalysis {
  const requirements: RequirementCheck[] = [];
  const gaps: WorkflowGap[] = [];

  // QB Online — blocking
  const qbOnline = data.qbVersion === 'Online';
  requirements.push({
    name: 'QuickBooks Online (read-only API access)',
    required: true,
    met: qbOnline,
    clientValue: data.qbVersion || 'Not specified',
    notes: qbOnline
      ? 'QBO confirmed — dashboard pulls live AR data via read-only API.'
      : 'AR Dashboard requires QuickBooks Online for live data.',
  });
  if (!qbOnline) {
    gaps.push({
      severity: 'blocking',
      item: 'QuickBooks Desktop detected',
      resolution: 'Client must migrate to QuickBooks Online before the AR Dashboard can be deployed.',
      estimatedEffort: '2-4 weeks (QBO migration)',
    });
  }

  const readinessScore = computeScore(gaps);
  return {
    workflowId: 'AR',
    workflowName: 'AR Aging Dashboard',
    selected: data.modulesSelected.includes('AR'),
    readinessScore,
    status: scoreToStatus(readinessScore),
    requirements,
    gaps,
    deploymentPhase: 2,
  };
}

export function runGapAnalysis(data: OnboardingData, _roi: ROIResult): GapAnalysisReport {
  const wf1a = analyzeWF1A(data);
  const wf1b = analyzeWF1B(data);
  const wf2 = analyzeWF2(data);
  const wf3 = analyzeWF3(data);
  const ar = analyzeAR(data);

  const allAnalyses = [wf1a, wf1b, wf2, wf3, ar];

  // Compute weighted overall readiness across selected workflows only
  const selectedAnalyses = allAnalyses.filter((a) => a.selected);
  const overallReadiness =
    selectedAnalyses.length > 0
      ? Math.round(
          selectedAnalyses.reduce((sum, a) => sum + a.readinessScore, 0) / selectedAnalyses.length
        )
      : 0;

  // Blockers: all blocking gaps across selected workflows
  const blockers: string[] = [];
  for (const analysis of selectedAnalyses) {
    for (const gap of analysis.gaps) {
      if (gap.severity === 'blocking') {
        blockers.push(`[${analysis.workflowName}] ${gap.item}`);
      }
    }
  }

  // Quick wins: selected workflows with status 'ready'
  const quickWins: string[] = [];
  for (const analysis of selectedAnalyses) {
    if (analysis.status === 'ready') {
      quickWins.push(`${analysis.workflowName} — no blockers, ready to deploy immediately.`);
    }
  }

  // Recommended deployment order: by phase, then by readiness score desc
  const recommendedDeploymentOrder = [...selectedAnalyses]
    .sort((a, b) => a.deploymentPhase - b.deploymentPhase || b.readinessScore - a.readinessScore)
    .map((a) => `Phase ${a.deploymentPhase}: ${a.workflowName}`);

  // Deduplicate
  const seen = new Set<string>();
  const deduped = recommendedDeploymentOrder.filter((entry) => {
    if (seen.has(entry)) return false;
    seen.add(entry);
    return true;
  });

  // Implementation notes
  const implementationNotes: string[] = [];
  if (!data.usesGoogleSheets && (data.modulesSelected.includes('IA') || data.modulesSelected.includes('PR'))) {
    implementationNotes.push('Google Sheets setup is a prerequisite for both Invoice Automation and Payment Reminders. Prioritize this in week 1.');
  }
  if (!data.usesSlack && (data.modulesSelected.includes('IA') || data.modulesSelected.includes('PR'))) {
    implementationNotes.push('Slack adoption is required for human-in-the-loop approvals. Recommend starting a Slack trial before the LunarLogic kickoff call.');
  }
  if (data.modulesSelected.includes('SO')) {
    implementationNotes.push('WF3 (Payment Receipt & Cash Application) is in development. Client should be aware of the Q3 2026 target delivery date.');
  }
  if (data.qbVersion === 'Desktop') {
    implementationNotes.push('QuickBooks Desktop is a universal blocker. All modules require QBO migration before any deployment can begin.');
  }

  return {
    overallReadiness,
    recommendedDeploymentOrder: deduped,
    blockers,
    workflowAnalyses: allAnalyses,
    quickWins,
    implementationNotes,
    generatedAt: new Date().toISOString(),
  };
}
