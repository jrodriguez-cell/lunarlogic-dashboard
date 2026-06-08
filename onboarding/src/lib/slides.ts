import PptxGenJS from 'pptxgenjs';
import type { OnboardingData, ROIResult } from '@/types/onboarding';
import type { GapAnalysisReport } from './gap-analysis';
import { formatCurrency } from './roi';

// Brand palette
const C = {
  navy:    '0A0F1E',
  navyMid: '0D1526',
  panel:   '1A2236',
  blue:    '2D5BE3',
  cyan:    '00CFFF',
  green:   '00C48C',
  amber:   'F59E0B',
  red:     'EF4444',
  white:   'F7F9FC',
  gray:    '8A94A6',
  grayMid: 'D1D9E6',
};

function addBg(slide: PptxGenJS.Slide) {
  slide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.navy } });
}

function addAccentBar(slide: PptxGenJS.Slide, y = 0.18) {
  slide.addShape('rect', { x: 0, y, w: 0.07, h: 5.5, fill: { color: C.blue } });
}

function logo(slide: PptxGenJS.Slide, x = 0.3, y = 0.18) {
  slide.addText(
    [
      { text: 'LUNAR', options: { color: C.cyan, bold: true } },
      { text: 'LOGIC', options: { color: C.white, bold: true } },
    ],
    { x, y, w: 1.6, h: 0.32, fontSize: 13, fontFace: 'Arial' }
  );
}

function sectionLabel(slide: PptxGenJS.Slide, text: string, y: number) {
  slide.addText(text.toUpperCase(), {
    x: 0.3, y, w: 9.4, h: 0.22,
    fontSize: 8, bold: true, color: C.cyan,
    fontFace: 'Arial', charSpacing: 3,
  });
}

function divider(slide: PptxGenJS.Slide, y: number) {
  slide.addShape('line', {
    x: 0.3, y, w: 9.4, h: 0,
    line: { color: C.blue, width: 0.75, dashType: 'solid' },
  });
}

function metricBox(
  slide: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  label: string, value: string, color: string
) {
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: C.panel },
    line: { color: C.blue, width: 0.5 },
  });
  slide.addText(label.toUpperCase(), {
    x: x + 0.12, y: y + 0.14, w: w - 0.24, h: 0.2,
    fontSize: 7, color: C.gray, bold: true, fontFace: 'Arial', charSpacing: 1.5,
  });
  slide.addText(value, {
    x: x + 0.12, y: y + 0.36, w: w - 0.24, h: h - 0.5,
    fontSize: 22, bold: true, color, fontFace: 'Arial',
  });
}

// ── Slide 1: Cover ────────────────────────────────────────────────────────────
function slide1Cover(pptx: PptxGenJS, submission: OnboardingData) {
  const slide = pptx.addSlide();
  addBg(slide);

  // Blue left stripe
  slide.addShape('rect', { x: 0, y: 0, w: 3.2, h: '100%', fill: { color: C.navyMid } });
  slide.addShape('rect', { x: 3.2, y: 0, w: 0.06, h: '100%', fill: { color: C.blue } });

  // Logo on left panel
  slide.addText('LUNAR', { x: 0.45, y: 0.5, w: 2.5, h: 0.45, fontSize: 28, bold: true, color: C.cyan, fontFace: 'Arial' });
  slide.addText('LOGIC', { x: 0.45, y: 0.9, w: 2.5, h: 0.45, fontSize: 28, bold: true, color: C.white, fontFace: 'Arial' });
  slide.addText('AR AUTOMATION', { x: 0.45, y: 1.45, w: 2.5, h: 0.22, fontSize: 9, color: C.gray, fontFace: 'Arial', charSpacing: 2 });

  // Left panel bottom text
  slide.addText('Prepared for:', { x: 0.45, y: 3.6, w: 2.5, h: 0.22, fontSize: 9, color: C.gray, fontFace: 'Arial' });
  slide.addText(submission.businessName, { x: 0.45, y: 3.84, w: 2.5, h: 0.35, fontSize: 14, bold: true, color: C.white, fontFace: 'Arial' });
  slide.addText(submission.ownerName, { x: 0.45, y: 4.18, w: 2.5, h: 0.25, fontSize: 11, color: C.grayMid, fontFace: 'Arial' });

  // Right panel — main title
  slide.addText('Discovery Call', {
    x: 3.5, y: 1.2, w: 6.0, h: 0.7,
    fontSize: 36, bold: true, color: C.white, fontFace: 'Arial',
  });
  slide.addText('AR Automation Proposal', {
    x: 3.5, y: 1.9, w: 6.0, h: 0.4,
    fontSize: 18, color: C.cyan, fontFace: 'Arial',
  });

  divider(slide, 2.45);

  slide.addText(`${submission.industry}  ·  ${submission.annualRevenue}  ·  ${submission.employeeCount ?? ''} employees`, {
    x: 3.5, y: 2.6, w: 6.0, h: 0.28,
    fontSize: 11, color: C.gray, fontFace: 'Arial',
  });

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  slide.addText(today, {
    x: 3.5, y: 2.9, w: 6.0, h: 0.25,
    fontSize: 10, color: C.gray, fontFace: 'Arial',
  });

  // Proof point box
  slide.addShape('roundRect', { x: 3.5, y: 3.5, w: 5.8, h: 1.7, rectRadius: 0.1, fill: { color: C.panel }, line: { color: C.green, width: 0.75 } });
  slide.addText('CLIENT PROOF POINT', { x: 3.7, y: 3.65, w: 5.4, h: 0.2, fontSize: 7, bold: true, color: C.green, fontFace: 'Arial', charSpacing: 2 });
  slide.addText('"84% reduction in invoice processing time.\n19-day DSO improvement."', {
    x: 3.7, y: 3.9, w: 5.4, h: 0.6,
    fontSize: 12, italic: true, color: C.white, fontFace: 'Arial',
  });
  slide.addText('— Kaptain Clean LLC', { x: 3.7, y: 4.9, w: 5.4, h: 0.2, fontSize: 9, color: C.gray, fontFace: 'Arial' });
}

// ── Slide 2: Your AR Challenge ────────────────────────────────────────────────
function slide2Challenge(pptx: PptxGenJS, submission: OnboardingData, roi: ROIResult) {
  const slide = pptx.addSlide();
  addBg(slide);
  addAccentBar(slide);
  logo(slide);

  sectionLabel(slide, 'The Challenge', 0.18);
  slide.addText('Your AR Reality Today', {
    x: 0.3, y: 0.42, w: 9.4, h: 0.5,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Arial',
  });
  divider(slide, 0.94);

  // DSO metrics row
  metricBox(slide, 0.3,  1.05, 2.2, 1.0, 'Current DSO',  `${roi.currentDSO} days`, C.red);
  metricBox(slide, 2.65, 1.05, 2.2, 1.0, 'Target DSO',   `${roi.targetDSO} days`, C.green);
  metricBox(slide, 5.0,  1.05, 2.2, 1.0, 'Monthly Invoices', submission.monthlyInvoiceCount, C.cyan);
  metricBox(slide, 7.35, 1.05, 2.3, 1.0, 'Annual Revenue', submission.annualRevenue, C.white);

  // Pain point quote
  slide.addShape('roundRect', { x: 0.3, y: 2.2, w: 9.4, h: 1.55, rectRadius: 0.1, fill: { color: C.panel }, line: { color: C.blue, width: 0.5 } });
  slide.addText('IN THEIR OWN WORDS', { x: 0.5, y: 2.3, w: 9.0, h: 0.2, fontSize: 7, bold: true, color: C.cyan, charSpacing: 2, fontFace: 'Arial' });
  const painTruncated = submission.biggestArPain.length > 280 ? submission.biggestArPain.substring(0, 277) + '...' : submission.biggestArPain;
  slide.addText(`"${painTruncated}"`, {
    x: 0.5, y: 2.52, w: 9.0, h: 1.1,
    fontSize: 12, italic: true, color: C.grayMid, fontFace: 'Arial',
  });

  // Pain categories + flags row
  slide.addText('Pain Categories:', { x: 0.3, y: 3.88, w: 2.0, h: 0.25, fontSize: 9, bold: true, color: C.gray, fontFace: 'Arial' });
  slide.addText(submission.biggestPainCategory.join('  ·  '), { x: 2.3, y: 3.88, w: 5.5, h: 0.25, fontSize: 9, color: C.grayMid, fontFace: 'Arial' });

  if (submission.nearlyMissedPayroll) {
    slide.addShape('roundRect', { x: 7.9, y: 3.82, w: 1.8, h: 0.35, rectRadius: 0.06, fill: { color: 'EF444420' }, line: { color: C.red, width: 0.75 } });
    slide.addText('⚠ PAYROLL SCARE', { x: 7.9, y: 3.82, w: 1.8, h: 0.35, fontSize: 8, bold: true, color: C.red, align: 'center', fontFace: 'Arial' });
  }

  // QB info
  slide.addText(`QuickBooks ${submission.qbVersion}  ·  Payment Terms: ${submission.paymentTerms}  ·  Follow-up: ${submission.followupFrequency}`, {
    x: 0.3, y: 4.3, w: 9.4, h: 0.25,
    fontSize: 9, color: C.gray, fontFace: 'Arial',
  });
}

// ── Slide 3: ROI Projection ───────────────────────────────────────────────────
function slide3ROI(pptx: PptxGenJS, roi: ROIResult, submission: OnboardingData) {
  const slide = pptx.addSlide();
  addBg(slide);
  addAccentBar(slide);
  logo(slide);

  sectionLabel(slide, 'Financial Impact', 0.18);
  slide.addText('Your ROI Projection', {
    x: 0.3, y: 0.42, w: 9.4, h: 0.5,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Arial',
  });
  divider(slide, 0.94);

  // Hero number
  slide.addShape('roundRect', { x: 0.3, y: 1.05, w: 4.5, h: 2.2, rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.green, width: 1 } });
  slide.addText('PROJECTED YEAR 1 VALUE', { x: 0.5, y: 1.18, w: 4.1, h: 0.22, fontSize: 7, bold: true, color: C.green, charSpacing: 2, fontFace: 'Arial' });
  slide.addText(formatCurrency(roi.totalYear1), {
    x: 0.5, y: 1.42, w: 4.1, h: 0.85,
    fontSize: 40, bold: true, color: C.green, fontFace: 'Arial',
  });
  slide.addText(`${roi.roi}x ROI Multiple`, { x: 0.5, y: 2.28, w: 4.1, h: 0.3, fontSize: 16, bold: true, color: C.amber, fontFace: 'Arial' });
  slide.addText('on annual investment', { x: 0.5, y: 2.6, w: 4.1, h: 0.22, fontSize: 9, color: C.gray, fontFace: 'Arial' });

  // DSO improvement
  slide.addShape('roundRect', { x: 5.1, y: 1.05, w: 4.6, h: 2.2, rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.cyan, width: 1 } });
  slide.addText('DSO IMPROVEMENT', { x: 5.3, y: 1.18, w: 4.2, h: 0.22, fontSize: 7, bold: true, color: C.cyan, charSpacing: 2, fontFace: 'Arial' });
  slide.addText(`${roi.currentDSO}`, { x: 5.3, y: 1.42, w: 1.5, h: 0.75, fontSize: 40, bold: true, color: C.red, fontFace: 'Arial' });
  slide.addText('days', { x: 5.3, y: 2.12, w: 1.5, h: 0.22, fontSize: 10, color: C.gray, fontFace: 'Arial' });
  slide.addText('→', { x: 6.8, y: 1.75, w: 0.6, h: 0.4, fontSize: 24, bold: true, color: C.blue, fontFace: 'Arial' });
  slide.addText(`${roi.targetDSO}`, { x: 7.4, y: 1.42, w: 1.5, h: 0.75, fontSize: 40, bold: true, color: C.green, fontFace: 'Arial' });
  slide.addText('days', { x: 7.4, y: 2.12, w: 1.5, h: 0.22, fontSize: 10, color: C.gray, fontFace: 'Arial' });
  slide.addText(`${Math.round(((roi.currentDSO - roi.targetDSO) / roi.currentDSO) * 100)}% reduction target`, { x: 5.3, y: 2.6, w: 4.2, h: 0.22, fontSize: 9, color: C.gray, fontFace: 'Arial' });

  // Value breakdown table
  const rows = [
    ['Working Capital Released', formatCurrency(roi.wcReleased)],
    ['Bad Debt Savings', formatCurrency(roi.badDebtSavings)],
    ['Unbilled Revenue Recovered', formatCurrency(roi.unbilledRecovered)],
    ['Labor Saved', formatCurrency(roi.laborSaved)],
  ];
  divider(slide, 3.38);
  slide.addText('VALUE BREAKDOWN', { x: 0.3, y: 3.44, w: 9.4, h: 0.2, fontSize: 7, bold: true, color: C.gray, charSpacing: 2, fontFace: 'Arial' });

  rows.forEach((row, i) => {
    const y = 3.7 + i * 0.3;
    slide.addText(row[0], { x: 0.3, y, w: 7.0, h: 0.26, fontSize: 11, color: C.grayMid, fontFace: 'Arial' });
    slide.addText(row[1], { x: 7.3, y, w: 2.4, h: 0.26, fontSize: 11, bold: true, color: C.cyan, fontFace: 'Arial', align: 'right' });
  });

  // Disclaimer
  slide.addText('Projections based on industry benchmarks. Actual results may vary.', {
    x: 0.3, y: 5.0, w: 9.4, h: 0.18,
    fontSize: 7, color: C.gray, italic: true, fontFace: 'Arial',
  });
}

// ── Slide 4: Recommended Modules ──────────────────────────────────────────────
function slide4Modules(pptx: PptxGenJS, submission: OnboardingData, gapAnalysis: GapAnalysisReport) {
  const slide = pptx.addSlide();
  addBg(slide);
  addAccentBar(slide);
  logo(slide);

  sectionLabel(slide, 'Solution', 0.18);
  slide.addText('Recommended Modules', {
    x: 0.3, y: 0.42, w: 9.4, h: 0.5,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Arial',
  });
  divider(slide, 0.94);

  const moduleDetails: Record<string, { name: string; desc: string; color: string }> = {
    IA: { name: 'Invoice Automation', desc: 'Automates invoice creation from Slack PDF uploads or text commands into QuickBooks — eliminating manual entry and approval delays.', color: C.cyan },
    PR: { name: 'Payment Reminders', desc: 'Sends personalized reminder emails via Outlook on a daily schedule with full QB aging data — no more manual follow-ups.', color: C.blue },
    SO: { name: 'Payment Receipt & Cash Application', desc: 'Plaid-connected payment matching against open QB invoices with 90%+ confidence auto-apply. Estimated delivery Q3 2026.', color: C.amber },
    AR: { name: 'AR Aging Dashboard', desc: 'Real-time AR aging waterfall, DSO trend line, invoice status board, and customer payment behavior — all in one view.', color: C.green },
  };

  const selectedModules = submission.modulesSelected;
  const colW = selectedModules.length <= 2 ? 4.5 : selectedModules.length === 3 ? 3.0 : 2.2;
  const gap = selectedModules.length <= 2 ? 0.25 : 0.2;

  selectedModules.forEach((mod, i) => {
    const details = moduleDetails[mod];
    if (!details) return;
    const x = 0.3 + i * (colW + gap);
    const analysis = gapAnalysis.workflowAnalyses.find((a) => {
      if (mod === 'IA') return a.workflowId === 'WF1A' || a.workflowId === 'WF1B';
      if (mod === 'PR') return a.workflowId === 'WF2';
      if (mod === 'SO') return a.workflowId === 'WF3';
      if (mod === 'AR') return a.workflowId === 'AR';
    });
    const readiness = analysis ? `${analysis.readinessScore}% ready` : '';

    slide.addShape('roundRect', { x, y: 1.08, w: colW, h: 3.5, rectRadius: 0.1, fill: { color: C.panel }, line: { color: details.color, width: 0.75 } });
    slide.addShape('rect', { x, y: 1.08, w: colW, h: 0.06, fill: { color: details.color } });
    slide.addText(mod, { x: x + 0.15, y: 1.22, w: colW - 0.3, h: 0.28, fontSize: 14, bold: true, color: details.color, fontFace: 'Arial' });
    slide.addText(details.name, { x: x + 0.15, y: 1.5, w: colW - 0.3, h: 0.35, fontSize: 11, bold: true, color: C.white, fontFace: 'Arial' });
    slide.addText(details.desc, { x: x + 0.15, y: 1.9, w: colW - 0.3, h: 1.8, fontSize: 9.5, color: C.grayMid, fontFace: 'Arial' });

    if (readiness) {
      const readyColor = (analysis?.readinessScore ?? 0) >= 80 ? C.green : (analysis?.readinessScore ?? 0) >= 60 ? C.amber : C.red;
      slide.addText(readiness, { x: x + 0.15, y: 4.22, w: colW - 0.3, h: 0.22, fontSize: 8, bold: true, color: readyColor, fontFace: 'Arial' });
    }
  });

  // Footer note if WF3 selected
  if (submission.modulesSelected.includes('SO')) {
    slide.addText('* Payment Receipt & Cash Application is in active development — Q3 2026 estimated delivery.', {
      x: 0.3, y: 5.0, w: 9.4, h: 0.18,
      fontSize: 7, italic: true, color: C.amber, fontFace: 'Arial',
    });
  }
}

// ── Slide 5: Readiness & Deployment Plan ──────────────────────────────────────
function slide5Readiness(pptx: PptxGenJS, gapAnalysis: GapAnalysisReport) {
  const slide = pptx.addSlide();
  addBg(slide);
  addAccentBar(slide);
  logo(slide);

  sectionLabel(slide, 'Implementation', 0.18);
  slide.addText('Readiness & Deployment Plan', {
    x: 0.3, y: 0.42, w: 9.4, h: 0.5,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Arial',
  });
  divider(slide, 0.94);

  // Readiness score
  const score = gapAnalysis.overallReadiness;
  const scoreColor = score >= 80 ? C.green : score >= 60 ? C.amber : C.red;
  slide.addShape('roundRect', { x: 0.3, y: 1.05, w: 2.4, h: 1.9, rectRadius: 0.1, fill: { color: C.panel }, line: { color: scoreColor, width: 1 } });
  slide.addText('OVERALL READINESS', { x: 0.5, y: 1.18, w: 2.0, h: 0.2, fontSize: 7, bold: true, color: scoreColor, charSpacing: 1.5, fontFace: 'Arial' });
  slide.addText(`${score}%`, { x: 0.5, y: 1.4, w: 2.0, h: 0.9, fontSize: 52, bold: true, color: scoreColor, fontFace: 'Arial' });
  const label = score >= 80 ? 'Deploy Ready' : score >= 60 ? 'Minor Config' : score >= 30 ? 'Gaps to Fix' : 'Blocked';
  slide.addText(label, { x: 0.5, y: 2.32, w: 2.0, h: 0.25, fontSize: 10, color: C.gray, fontFace: 'Arial' });

  // Deployment order
  slide.addText('DEPLOYMENT ORDER', { x: 3.0, y: 1.08, w: 6.7, h: 0.2, fontSize: 7, bold: true, color: C.cyan, charSpacing: 2, fontFace: 'Arial' });
  gapAnalysis.recommendedDeploymentOrder.slice(0, 5).forEach((step, i) => {
    const y = 1.35 + i * 0.32;
    slide.addShape('ellipse', { x: 3.0, y, w: 0.25, h: 0.25, fill: { color: C.blue } });
    slide.addText(String(i + 1), { x: 3.0, y, w: 0.25, h: 0.25, fontSize: 8, bold: true, color: C.white, align: 'center', fontFace: 'Arial' });
    slide.addText(step, { x: 3.35, y: y + 0.01, w: 6.3, h: 0.26, fontSize: 10, color: C.grayMid, fontFace: 'Arial' });
  });

  divider(slide, 3.02);

  // Blockers
  if (gapAnalysis.blockers.length > 0) {
    slide.addText('BLOCKERS TO RESOLVE BEFORE GO-LIVE', { x: 0.3, y: 3.1, w: 4.5, h: 0.2, fontSize: 7, bold: true, color: C.red, charSpacing: 1.5, fontFace: 'Arial' });
    gapAnalysis.blockers.slice(0, 3).forEach((b, i) => {
      slide.addText(`✗  ${b}`, { x: 0.3, y: 3.35 + i * 0.3, w: 4.5, h: 0.26, fontSize: 9.5, color: 'EF9090', fontFace: 'Arial' });
    });
  }

  // Quick wins
  if (gapAnalysis.quickWins.length > 0) {
    slide.addText('QUICK WINS', { x: 5.1, y: 3.1, w: 4.5, h: 0.2, fontSize: 7, bold: true, color: C.green, charSpacing: 1.5, fontFace: 'Arial' });
    gapAnalysis.quickWins.slice(0, 3).forEach((w, i) => {
      slide.addText(`✓  ${w}`, { x: 5.1, y: 3.35 + i * 0.3, w: 4.5, h: 0.26, fontSize: 9.5, color: '6EE7B7', fontFace: 'Arial' });
    });
  }

  // Implementation notes
  if (gapAnalysis.implementationNotes.length > 0) {
    divider(slide, 4.35);
    slide.addText(gapAnalysis.implementationNotes[0], {
      x: 0.3, y: 4.42, w: 9.4, h: 0.25,
      fontSize: 9, color: C.gray, italic: true, fontFace: 'Arial',
    });
  }
}

// ── Slide 6: Investment ───────────────────────────────────────────────────────
function slide6Investment(pptx: PptxGenJS, submission: OnboardingData, roi: ROIResult) {
  const slide = pptx.addSlide();
  addBg(slide);
  addAccentBar(slide);
  logo(slide);

  sectionLabel(slide, 'Investment', 0.18);
  slide.addText('Pricing & Terms', {
    x: 0.3, y: 0.42, w: 9.4, h: 0.5,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Arial',
  });
  divider(slide, 0.94);

  // Tier determination
  const count = submission.monthlyInvoiceCount;
  let tier: string, price: string, invoiceLimit: string;
  if (count === 'Under 30' || count === '30 – 50') {
    tier = 'Essentials'; price = '$697'; invoiceLimit = '150 invoices/mo';
  } else if (['50 – 100', '100 – 150', '150 – 250'].includes(count)) {
    tier = 'Professional'; price = '$1,497'; invoiceLimit = '250 invoices/mo';
  } else {
    tier = 'Business'; price = '$2,497'; invoiceLimit = '400 invoices/mo';
  }

  // Tier box
  slide.addShape('roundRect', { x: 0.3, y: 1.1, w: 5.5, h: 2.5, rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.cyan, width: 1.5 } });
  slide.addText('RECOMMENDED TIER', { x: 0.55, y: 1.22, w: 5.0, h: 0.22, fontSize: 7, bold: true, color: C.cyan, charSpacing: 2, fontFace: 'Arial' });
  slide.addText(tier, { x: 0.55, y: 1.46, w: 5.0, h: 0.5, fontSize: 28, bold: true, color: C.white, fontFace: 'Arial' });
  slide.addText(price, { x: 0.55, y: 1.96, w: 2.5, h: 0.55, fontSize: 36, bold: true, color: C.cyan, fontFace: 'Arial' });
  slide.addText('/mo', { x: 3.05, y: 2.24, w: 1.0, h: 0.26, fontSize: 14, color: C.gray, fontFace: 'Arial' });
  slide.addText(invoiceLimit, { x: 0.55, y: 2.56, w: 5.0, h: 0.25, fontSize: 11, color: C.gray, fontFace: 'Arial' });
  slide.addText('Overage: $5/invoice', { x: 0.55, y: 2.82, w: 5.0, h: 0.22, fontSize: 9, color: C.gray, italic: true, fontFace: 'Arial' });

  // Terms boxes
  const terms = [
    { label: 'Implementation Fee', value: '$2,500', note: 'Waived on 12-mo commitment', color: C.amber },
    { label: 'Guarantee', value: '60-Day', note: 'Satisfaction guarantee', color: C.green },
    { label: 'Referral Program', value: '20%', note: 'Recurring MRR for referrals', color: C.blue },
  ];
  terms.forEach((t, i) => {
    const x = 6.05 + (i === 0 ? 0 : 0);
    const y = 1.1 + i * 1.0;
    slide.addShape('roundRect', { x: 6.05, y, w: 3.65, h: 0.85, rectRadius: 0.08, fill: { color: C.panel }, line: { color: t.color, width: 0.5 } });
    slide.addText(t.label.toUpperCase(), { x: 6.25, y: y + 0.1, w: 3.25, h: 0.2, fontSize: 7, bold: true, color: t.color, charSpacing: 1.5, fontFace: 'Arial' });
    slide.addText(t.value, { x: 6.25, y: y + 0.3, w: 1.5, h: 0.32, fontSize: 20, bold: true, color: t.color, fontFace: 'Arial' });
    slide.addText(t.note, { x: 6.25, y: y + 0.6, w: 3.25, h: 0.2, fontSize: 8, color: C.gray, fontFace: 'Arial' });
  });

  // ROI reminder
  divider(slide, 3.75);
  slide.addShape('roundRect', { x: 0.3, y: 3.85, w: 9.4, h: 1.3, rectRadius: 0.1, fill: { color: '00C48C08' }, line: { color: C.green, width: 0.5 } });
  slide.addText('AT THIS INVESTMENT LEVEL', { x: 0.55, y: 3.98, w: 9.0, h: 0.2, fontSize: 7, bold: true, color: C.green, charSpacing: 2, fontFace: 'Arial' });
  const annualCost = (price === '$697' ? 697 : price === '$1,497' ? 1497 : 2497) * 12;
  slide.addText(
    `${formatCurrency(annualCost)} annual investment  →  ${formatCurrency(roi.totalYear1)} Year 1 value  =  ${roi.roi}x return`,
    { x: 0.55, y: 4.22, w: 9.0, h: 0.35, fontSize: 14, bold: true, color: C.green, fontFace: 'Arial' }
  );
  slide.addText('"We earn your business every month through results." — LunarLogic LLC', {
    x: 0.55, y: 4.62, w: 9.0, h: 0.25,
    fontSize: 10, italic: true, color: C.gray, fontFace: 'Arial',
  });
}

// ── Slide 7: Next Steps ───────────────────────────────────────────────────────
function slide7NextSteps(pptx: PptxGenJS, submission: OnboardingData) {
  const slide = pptx.addSlide();
  addBg(slide);
  addAccentBar(slide);
  logo(slide);

  sectionLabel(slide, 'Action Plan', 0.18);
  slide.addText('Next Steps', {
    x: 0.3, y: 0.42, w: 9.4, h: 0.5,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Arial',
  });
  divider(slide, 0.94);

  const steps = [
    {
      num: '01',
      title: 'Confirm Scope',
      desc: `Review these recommended modules with ${submission.ownerName} and confirm the deployment order and timeline.`,
      color: C.cyan,
    },
    {
      num: '02',
      title: 'QuickBooks Read-Only Audit',
      desc: 'Connect QuickBooks Online via read-only API access. We run a 2-week parallel test — zero changes to your existing process.',
      color: C.blue,
    },
    {
      num: '03',
      title: 'Sign & Schedule Go-Live',
      desc: `Review the Master Services Agreement. ${submission.targetStartDate ? `Target start: ${submission.targetStartDate}.` : 'Set a go-live date that fits your schedule.'}`,
      color: C.green,
    },
  ];

  steps.forEach((step, i) => {
    const y = 1.1 + i * 1.25;
    slide.addShape('roundRect', { x: 0.3, y, w: 9.4, h: 1.1, rectRadius: 0.1, fill: { color: C.panel }, line: { color: step.color, width: 0.5 } });
    slide.addText(step.num, { x: 0.5, y: y + 0.1, w: 0.8, h: 0.9, fontSize: 36, bold: true, color: `${step.color}40`, fontFace: 'Arial' });
    slide.addText(step.title, { x: 1.4, y: y + 0.1, w: 7.9, h: 0.35, fontSize: 15, bold: true, color: step.color, fontFace: 'Arial' });
    slide.addText(step.desc, { x: 1.4, y: y + 0.45, w: 7.9, h: 0.55, fontSize: 10, color: C.grayMid, fontFace: 'Arial' });
  });

  // Contact
  divider(slide, 4.88);
  slide.addText('Jonathan Rodriguez  ·  jrodriguez@lunarlogic.ai  ·  LunarLogic LLC', {
    x: 0.3, y: 4.95, w: 9.4, h: 0.25,
    fontSize: 10, color: C.gray, fontFace: 'Arial',
  });
  slide.addText('"We earn your business every month through results."', {
    x: 0.3, y: 5.22, w: 9.4, h: 0.22,
    fontSize: 9, italic: true, color: C.blue, fontFace: 'Arial',
  });
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateSlideDeck(
  submission: OnboardingData,
  gapAnalysis: GapAnalysisReport,
  roi: ROIResult
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"
  pptx.title = `LunarLogic Discovery Call — ${submission.businessName}`;
  pptx.author = 'LunarLogic LLC';
  pptx.company = 'LunarLogic LLC';

  slide1Cover(pptx, submission);
  slide2Challenge(pptx, submission, roi);
  slide3ROI(pptx, roi, submission);
  slide4Modules(pptx, submission, gapAnalysis);
  slide5Readiness(pptx, gapAnalysis);
  slide6Investment(pptx, submission, roi);
  slide7NextSteps(pptx, submission);

  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return buffer as Buffer;
}
