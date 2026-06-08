import PptxGenJS from 'pptxgenjs';
import type { OnboardingData, ROIResult } from '@/types/onboarding';
import type { GapAnalysisReport } from './gap-analysis';
import { formatCurrency } from './roi';

// ── Brand colours ─────────────────────────────────────────────────────────────
const C = {
  navy:    '0A0F1E',
  navyMid: '0D1526',
  panel:   '152035',
  blue:    '2D5BE3',
  cyan:    '00CFFF',
  green:   '00C48C',
  amber:   'F59E0B',
  red:     'EF4444',
  white:   'FFFFFF',
  offWhite:'F0F4FF',
  gray:    '8A94A6',
  grayMid: 'B8C4D6',
};

// Layout constants — LAYOUT_WIDE is 13.33" × 7.5"
const W = 13.33;
const H = 7.5;
const MARGIN = 0.55;
const HEADER_H = 0.72;
const CONTENT_Y = HEADER_H + 0.45;
const CONTENT_W = W - MARGIN * 2;

// ── Shared helpers ────────────────────────────────────────────────────────────

function bg(slide: PptxGenJS.Slide) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
}

/** Top header band with logo left and page title right */
function header(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
  // Header band
  slide.addShape('rect', { x: 0, y: 0, w: W, h: HEADER_H, fill: { color: C.navyMid } });
  // Bottom border line
  slide.addShape('rect', { x: 0, y: HEADER_H - 0.025, w: W, h: 0.025, fill: { color: C.blue } });

  // Logo — left side
  slide.addText([
    { text: 'LUNAR', options: { color: C.cyan, bold: true } },
    { text: 'LOGIC', options: { color: C.white, bold: true } },
  ], {
    x: MARGIN, y: 0, w: 1.8, h: HEADER_H,
    fontSize: 16, fontFace: 'Calibri', valign: 'middle',
  });

  // Page title — right side
  const titleBlock: PptxGenJS.TextProps[] = [{ text: title, options: { color: C.offWhite, bold: true } }];
  if (subtitle) {
    titleBlock.push({ text: `  ·  ${subtitle}`, options: { color: C.gray, bold: false } });
  }
  slide.addText(titleBlock, {
    x: 2.6, y: 0, w: W - 2.6 - MARGIN, h: HEADER_H,
    fontSize: 13, fontFace: 'Calibri', valign: 'middle', align: 'right',
  });
}

/** Section heading inside the content area */
function sectionHeading(slide: PptxGenJS.Slide, text: string, y: number) {
  slide.addText(text, {
    x: MARGIN, y, w: CONTENT_W, h: 0.55,
    fontSize: 28, bold: true, color: C.white, fontFace: 'Calibri',
  });
}

/** Thin cyan rule under a section heading */
function rule(slide: PptxGenJS.Slide, y: number) {
  slide.addShape('rect', { x: MARGIN, y, w: CONTENT_W, h: 0.025, fill: { color: C.blue } });
}

/** Metric card */
function metric(
  slide: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  label: string, value: string, valueColor: string,
  sub?: string
) {
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: C.panel },
    line: { color: '1E3A5F', width: 0.75 },
  });
  slide.addText(label.toUpperCase(), {
    x: x + 0.2, y: y + 0.18, w: w - 0.4, h: 0.25,
    fontSize: 8.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText(value, {
    x: x + 0.2, y: y + 0.44, w: w - 0.4, h: h - 0.7,
    fontSize: 26, bold: true, color: valueColor, fontFace: 'Calibri',
  });
  if (sub) {
    slide.addText(sub, {
      x: x + 0.2, y: y + h - 0.3, w: w - 0.4, h: 0.25,
      fontSize: 9, color: C.gray, fontFace: 'Calibri',
    });
  }
}

/** Small label badge */
function badge(slide: PptxGenJS.Slide, x: number, y: number, text: string, bgColor: string, textColor: string) {
  slide.addShape('roundRect', { x, y, w: 1.5, h: 0.3, rectRadius: 0.05, fill: { color: bgColor + '30' }, line: { color: bgColor, width: 0.5 } });
  slide.addText(text, { x, y, w: 1.5, h: 0.3, fontSize: 8.5, bold: true, color: textColor, align: 'center', fontFace: 'Calibri' });
}

/** Footer strip */
function footer(slide: PptxGenJS.Slide, clientName: string) {
  slide.addShape('rect', { x: 0, y: H - 0.32, w: W, h: 0.32, fill: { color: C.navyMid } });
  slide.addText('LunarLogic LLC  ·  Confidential', {
    x: MARGIN, y: H - 0.32, w: CONTENT_W / 2, h: 0.32,
    fontSize: 8, color: C.gray, fontFace: 'Calibri', valign: 'middle',
  });
  slide.addText(clientName, {
    x: MARGIN + CONTENT_W / 2, y: H - 0.32, w: CONTENT_W / 2, h: 0.32,
    fontSize: 8, color: C.gray, fontFace: 'Calibri', valign: 'middle', align: 'right',
  });
}

// ── Slide 1: Cover ────────────────────────────────────────────────────────────
function slide1Cover(pptx: PptxGenJS, submission: OnboardingData) {
  const slide = pptx.addSlide();
  bg(slide);

  // Left panel — 40% width
  const panelW = W * 0.42;
  slide.addShape('rect', { x: 0, y: 0, w: panelW, h: H, fill: { color: C.navyMid } });
  slide.addShape('rect', { x: panelW, y: 0, w: 0.04, h: H, fill: { color: C.blue } });

  // Logo on left panel
  slide.addText([
    { text: 'LUNAR', options: { color: C.cyan } },
    { text: 'LOGIC', options: { color: C.white } },
  ], {
    x: 0.7, y: 0.6, w: panelW - 1.0, h: 0.6,
    fontSize: 32, bold: true, fontFace: 'Calibri',
  });
  slide.addText('AR AUTOMATION PLATFORM', {
    x: 0.7, y: 1.2, w: panelW - 1.0, h: 0.3,
    fontSize: 9, color: C.gray, fontFace: 'Calibri', charSpacing: 2,
  });

  // Divider
  slide.addShape('rect', { x: 0.7, y: 1.65, w: panelW - 1.4, h: 0.025, fill: { color: C.blue } });

  // Prepared for
  slide.addText('PREPARED FOR', {
    x: 0.7, y: 1.9, w: panelW - 1.0, h: 0.25,
    fontSize: 8.5, color: C.cyan, bold: true, fontFace: 'Calibri', charSpacing: 2,
  });
  slide.addText(submission.businessName, {
    x: 0.7, y: 2.18, w: panelW - 1.0, h: 0.55,
    fontSize: 22, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText(submission.ownerName, {
    x: 0.7, y: 2.76, w: panelW - 1.0, h: 0.35,
    fontSize: 14, color: C.grayMid, fontFace: 'Calibri',
  });
  slide.addText(`${submission.industry}`, {
    x: 0.7, y: 3.14, w: panelW - 1.0, h: 0.28,
    fontSize: 12, color: C.gray, fontFace: 'Calibri',
  });

  // Date bottom of left panel
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  slide.addText(today, {
    x: 0.7, y: H - 0.7, w: panelW - 1.0, h: 0.28,
    fontSize: 10, color: C.gray, fontFace: 'Calibri',
  });

  // Right panel — main content
  const rx = panelW + 0.3;
  const rw = W - rx - 0.5;

  slide.addText('Discovery Call', {
    x: rx, y: 1.0, w: rw, h: 0.75,
    fontSize: 44, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('AR Automation Proposal', {
    x: rx, y: 1.78, w: rw, h: 0.42,
    fontSize: 22, color: C.cyan, fontFace: 'Calibri',
  });

  slide.addShape('rect', { x: rx, y: 2.35, w: rw, h: 0.025, fill: { color: C.blue } });

  slide.addText(`${submission.annualRevenue}  ·  ${submission.employeeCount ?? ''} employees  ·  ${submission.monthlyInvoiceCount} invoices/mo`, {
    x: rx, y: 2.55, w: rw, h: 0.3,
    fontSize: 12, color: C.gray, fontFace: 'Calibri',
  });

  // Proof point box
  slide.addShape('roundRect', {
    x: rx, y: 3.25, w: rw, h: 2.1,
    rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.green, width: 1 },
  });
  slide.addShape('rect', { x: rx, y: 3.25, w: rw, h: 0.04, fill: { color: C.green } });
  slide.addText('CLIENT PROOF POINT', {
    x: rx + 0.3, y: 3.38, w: rw - 0.6, h: 0.28,
    fontSize: 9, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText('"84% reduction in invoice processing time.\n19-day DSO improvement."', {
    x: rx + 0.3, y: 3.7, w: rw - 0.6, h: 0.9,
    fontSize: 16, italic: true, color: C.offWhite, fontFace: 'Calibri',
  });
  slide.addText('— Kaptain Clean LLC, Anchor Client', {
    x: rx + 0.3, y: 4.68, w: rw - 0.6, h: 0.28,
    fontSize: 10, color: C.gray, fontFace: 'Calibri',
  });
}

// ── Slide 2: AR Challenge ─────────────────────────────────────────────────────
function slide2Challenge(pptx: PptxGenJS, submission: OnboardingData, roi: ROIResult) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'Your AR Reality Today', submission.businessName);
  footer(slide, submission.businessName);

  // Metric row
  const mY = CONTENT_Y + 0.1;
  const mH = 1.4;
  const mW = (CONTENT_W - 0.45) / 4;
  const gap = 0.15;

  metric(slide, MARGIN,               mY, mW, mH, 'Current DSO',     `${roi.currentDSO} days`, C.red,   'before LunarLogic');
  metric(slide, MARGIN + (mW + gap),  mY, mW, mH, 'Target DSO',      `${roi.targetDSO} days`,  C.green, 'projected');
  metric(slide, MARGIN + (mW + gap)*2,mY, mW, mH, 'Monthly Invoices', submission.monthlyInvoiceCount, C.cyan);
  metric(slide, MARGIN + (mW + gap)*3,mY, mW, mH, 'Annual Revenue',  submission.annualRevenue, C.offWhite);

  // Pain point quote box
  const qY = mY + mH + 0.35;
  slide.addShape('roundRect', {
    x: MARGIN, y: qY, w: CONTENT_W, h: 1.7,
    rectRadius: 0.1, fill: { color: C.panel }, line: { color: C.blue, width: 0.5 },
  });
  slide.addText('IN THEIR OWN WORDS', {
    x: MARGIN + 0.3, y: qY + 0.2, w: CONTENT_W - 0.6, h: 0.25,
    fontSize: 8.5, bold: true, color: C.cyan, fontFace: 'Calibri', charSpacing: 2,
  });
  const pain = submission.biggestArPain.length > 220
    ? submission.biggestArPain.substring(0, 217) + '…'
    : submission.biggestArPain;
  slide.addText(`"${pain}"`, {
    x: MARGIN + 0.3, y: qY + 0.5, w: CONTENT_W - 0.6, h: 1.0,
    fontSize: 13, italic: true, color: C.grayMid, fontFace: 'Calibri',
  });

  // Pain categories + flags row
  const infoY = qY + 1.7 + 0.28;
  slide.addText([
    { text: 'Pain categories:  ', options: { color: C.gray, bold: false } },
    { text: submission.biggestPainCategory.join('   ·   '), options: { color: C.grayMid, bold: false } },
  ], {
    x: MARGIN, y: infoY, w: CONTENT_W - 2.5, h: 0.3,
    fontSize: 10.5, fontFace: 'Calibri',
  });

  if (submission.nearlyMissedPayroll) {
    badge(slide, W - MARGIN - 1.5, infoY, '⚠  PAYROLL SCARE', C.red, C.red);
  }

  // QB / terms info
  slide.addText(
    `QuickBooks ${submission.qbVersion}   ·   Payment Terms: ${submission.paymentTerms}   ·   Follow-up: ${submission.followupFrequency}`,
    {
      x: MARGIN, y: infoY + 0.38, w: CONTENT_W, h: 0.26,
      fontSize: 9.5, color: C.gray, fontFace: 'Calibri',
    }
  );
}

// ── Slide 3: ROI Projection ───────────────────────────────────────────────────
function slide3ROI(pptx: PptxGenJS, roi: ROIResult, submission: OnboardingData) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'ROI Projection', submission.businessName);
  footer(slide, submission.businessName);

  const topY = CONTENT_Y + 0.1;

  // Hero value box — left
  const heroW = 4.8;
  const heroH = 2.5;
  slide.addShape('roundRect', {
    x: MARGIN, y: topY, w: heroW, h: heroH,
    rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.green, width: 1.2 },
  });
  slide.addShape('rect', { x: MARGIN, y: topY, w: heroW, h: 0.04, fill: { color: C.green } });
  slide.addText('PROJECTED YEAR 1 VALUE', {
    x: MARGIN + 0.3, y: topY + 0.2, w: heroW - 0.6, h: 0.28,
    fontSize: 9, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText(formatCurrency(roi.totalYear1), {
    x: MARGIN + 0.3, y: topY + 0.52, w: heroW - 0.6, h: 1.1,
    fontSize: 52, bold: true, color: C.green, fontFace: 'Calibri',
  });
  slide.addText(`${roi.roi}x return on annual investment`, {
    x: MARGIN + 0.3, y: topY + 1.65, w: heroW - 0.6, h: 0.35,
    fontSize: 14, bold: true, color: C.amber, fontFace: 'Calibri',
  });
  slide.addText('Based on industry benchmarks', {
    x: MARGIN + 0.3, y: topY + 2.05, w: heroW - 0.6, h: 0.25,
    fontSize: 9, italic: true, color: C.gray, fontFace: 'Calibri',
  });

  // DSO box — right
  const dsoX = MARGIN + heroW + 0.3;
  const dsoW = CONTENT_W - heroW - 0.3;
  slide.addShape('roundRect', {
    x: dsoX, y: topY, w: dsoW, h: heroH,
    rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.cyan, width: 1.0 },
  });
  slide.addShape('rect', { x: dsoX, y: topY, w: dsoW, h: 0.04, fill: { color: C.cyan } });
  slide.addText('DSO IMPROVEMENT', {
    x: dsoX + 0.3, y: topY + 0.2, w: dsoW - 0.6, h: 0.28,
    fontSize: 9, bold: true, color: C.cyan, fontFace: 'Calibri', charSpacing: 1.5,
  });

  const dsoNumW = (dsoW - 0.6 - 0.8) / 2;
  slide.addText(`${roi.currentDSO}`, {
    x: dsoX + 0.3, y: topY + 0.55, w: dsoNumW, h: 1.0,
    fontSize: 56, bold: true, color: C.red, fontFace: 'Calibri',
  });
  slide.addText('days\nbefore', {
    x: dsoX + 0.3, y: topY + 1.5, w: dsoNumW, h: 0.45,
    fontSize: 10, color: C.gray, fontFace: 'Calibri',
  });
  slide.addText('→', {
    x: dsoX + 0.3 + dsoNumW, y: topY + 0.8, w: 0.8, h: 0.7,
    fontSize: 30, bold: true, color: C.blue, fontFace: 'Calibri', align: 'center',
  });
  slide.addText(`${roi.targetDSO}`, {
    x: dsoX + 0.3 + dsoNumW + 0.8, y: topY + 0.55, w: dsoNumW, h: 1.0,
    fontSize: 56, bold: true, color: C.green, fontFace: 'Calibri',
  });
  slide.addText('days\ntarget', {
    x: dsoX + 0.3 + dsoNumW + 0.8, y: topY + 1.5, w: dsoNumW, h: 0.45,
    fontSize: 10, color: C.gray, fontFace: 'Calibri',
  });
  const pct = Math.round(((roi.currentDSO - roi.targetDSO) / roi.currentDSO) * 100);
  slide.addText(`${pct}% reduction`, {
    x: dsoX + 0.3, y: topY + 2.05, w: dsoW - 0.6, h: 0.28,
    fontSize: 11, color: C.cyan, bold: true, fontFace: 'Calibri', align: 'center',
  });

  // Value breakdown table
  const tableY = topY + heroH + 0.38;
  slide.addText('VALUE BREAKDOWN', {
    x: MARGIN, y: tableY, w: CONTENT_W, h: 0.28,
    fontSize: 9, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 2,
  });

  const rows: [string, string][] = [
    ['Working Capital Released', formatCurrency(roi.wcReleased)],
    ['Bad Debt Savings (est.)', formatCurrency(roi.badDebtSavings)],
    ['Unbilled Revenue Recovered', formatCurrency(roi.unbilledRecovered)],
    ['Labor Hours Saved', formatCurrency(roi.laborSaved)],
  ];

  const colW = (CONTENT_W - 0.5) / 2;
  rows.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = MARGIN + col * (colW + 0.5);
    const cy = tableY + 0.38 + row * 0.52;

    slide.addShape('roundRect', {
      x: cx, y: cy, w: colW, h: 0.44,
      rectRadius: 0.06, fill: { color: C.panel }, line: { color: '1E3A5F', width: 0.5 },
    });
    slide.addText(label, {
      x: cx + 0.2, y: cy + 0.04, w: colW * 0.65, h: 0.38,
      fontSize: 10.5, color: C.grayMid, fontFace: 'Calibri', valign: 'middle',
    });
    slide.addText(val, {
      x: cx + colW * 0.65, y: cy + 0.04, w: colW * 0.32, h: 0.38,
      fontSize: 13, bold: true, color: C.cyan, fontFace: 'Calibri', align: 'right', valign: 'middle',
    });
  });
}

// ── Slide 4: Recommended Modules ──────────────────────────────────────────────
function slide4Modules(pptx: PptxGenJS, submission: OnboardingData, gapAnalysis: GapAnalysisReport) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'Recommended Modules', submission.businessName);
  footer(slide, submission.businessName);

  const moduleDetails: Record<string, { name: string; why: string; color: string }> = {
    IA: {
      name: 'Invoice Automation',
      why: 'Automates invoice creation from Slack PDF uploads or text commands directly into QuickBooks — eliminating manual data entry and approval delays.',
      color: C.cyan,
    },
    PR: {
      name: 'Payment Reminders',
      why: 'Sends personalized reminder emails via Outlook on a daily schedule, pulling live AR aging data from QuickBooks. No more manual follow-ups.',
      color: C.blue,
    },
    SO: {
      name: 'Cash Application',
      why: 'Plaid-connected payment matching against open QuickBooks invoices with 90%+ confidence auto-apply. Ambiguous payments are routed to Slack for review.',
      color: C.amber,
    },
    AR: {
      name: 'AR Aging Dashboard',
      why: 'Real-time AR aging waterfall, DSO trend chart, invoice status board, and customer payment behavior — all in a single bookmarkable URL.',
      color: C.green,
    },
  };

  const selected = submission.modulesSelected;
  const cardW = (CONTENT_W - (selected.length - 1) * 0.25) / selected.length;
  const cardH = H - CONTENT_Y - 0.1 - 0.32 - 0.45; // full height minus header/footer/gap
  const cardY = CONTENT_Y + 0.2;

  selected.forEach((mod, i) => {
    const details = moduleDetails[mod];
    if (!details) return;
    const x = MARGIN + i * (cardW + 0.25);

    const wf = gapAnalysis.workflowAnalyses.find((a) => {
      if (mod === 'IA') return a.workflowId === 'WF1A';
      if (mod === 'PR') return a.workflowId === 'WF2';
      if (mod === 'SO') return a.workflowId === 'WF3';
      if (mod === 'AR') return a.workflowId === 'AR';
    });
    const score = wf ? wf.readinessScore : null;
    const scoreColor = score != null ? (score >= 80 ? C.green : score >= 60 ? C.amber : C.red) : C.gray;

    // Card
    slide.addShape('roundRect', {
      x, y: cardY, w: cardW, h: cardH,
      rectRadius: 0.1, fill: { color: C.panel }, line: { color: details.color, width: 0.75 },
    });
    // Color top bar
    slide.addShape('rect', { x, y: cardY, w: cardW, h: 0.06, fill: { color: details.color } });

    // Module code badge
    slide.addShape('roundRect', {
      x: x + 0.22, y: cardY + 0.18, w: 0.55, h: 0.34,
      rectRadius: 0.05, fill: { color: details.color + '25' }, line: { color: details.color, width: 0.5 },
    });
    slide.addText(mod, {
      x: x + 0.22, y: cardY + 0.18, w: 0.55, h: 0.34,
      fontSize: 11, bold: true, color: details.color, fontFace: 'Calibri', align: 'center', valign: 'middle',
    });

    // Module name
    slide.addText(details.name, {
      x: x + 0.22, y: cardY + 0.65, w: cardW - 0.44, h: 0.55,
      fontSize: 15, bold: true, color: C.white, fontFace: 'Calibri',
    });

    // Divider
    slide.addShape('rect', { x: x + 0.22, y: cardY + 1.28, w: cardW - 0.44, h: 0.02, fill: { color: details.color + '60' } });

    // Why text
    slide.addText(details.why, {
      x: x + 0.22, y: cardY + 1.45, w: cardW - 0.44, h: cardH - 2.2,
      fontSize: 10.5, color: C.grayMid, fontFace: 'Calibri',
    });

    // Readiness score at bottom
    if (score != null) {
      slide.addText(`${score}% ready`, {
        x: x + 0.22, y: cardY + cardH - 0.5, w: cardW - 0.44, h: 0.3,
        fontSize: 10, bold: true, color: scoreColor, fontFace: 'Calibri',
      });
    }

    // WF3 note
    if (mod === 'SO') {
      slide.addText('Est. delivery: Q3 2026', {
        x: x + 0.22, y: cardY + cardH - 0.75, w: cardW - 0.44, h: 0.25,
        fontSize: 8.5, italic: true, color: C.amber, fontFace: 'Calibri',
      });
    }
  });
}

// ── Slide 5: Implementation Readiness ─────────────────────────────────────────
function slide5Readiness(pptx: PptxGenJS, gapAnalysis: GapAnalysisReport, submission: OnboardingData) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'Implementation Readiness', submission.businessName);
  footer(slide, submission.businessName);

  const score = gapAnalysis.overallReadiness;
  const scoreColor = score >= 80 ? C.green : score >= 60 ? C.amber : score >= 40 ? C.red : C.red;
  const scoreLabel = score >= 80 ? 'Deployment Ready' : score >= 60 ? 'Minor Configuration Needed' : 'Gaps to Address First';

  const colY = CONTENT_Y + 0.1;
  const leftW = 3.5;
  const rightX = MARGIN + leftW + 0.4;
  const rightW = CONTENT_W - leftW - 0.4;
  const fullH = H - colY - 0.32 - 0.55;

  // Score card
  slide.addShape('roundRect', {
    x: MARGIN, y: colY, w: leftW, h: fullH,
    rectRadius: 0.12, fill: { color: C.panel }, line: { color: scoreColor, width: 1.2 },
  });
  slide.addText('OVERALL READINESS', {
    x: MARGIN + 0.25, y: colY + 0.22, w: leftW - 0.5, h: 0.28,
    fontSize: 9, bold: true, color: scoreColor, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText(`${score}%`, {
    x: MARGIN + 0.25, y: colY + 0.55, w: leftW - 0.5, h: 1.4,
    fontSize: 80, bold: true, color: scoreColor, fontFace: 'Calibri',
  });
  slide.addText(scoreLabel, {
    x: MARGIN + 0.25, y: colY + 1.95, w: leftW - 0.5, h: 0.45,
    fontSize: 13, color: C.grayMid, fontFace: 'Calibri',
  });

  // Deployment order
  slide.addText('RECOMMENDED DEPLOYMENT ORDER', {
    x: MARGIN + 0.25, y: colY + 2.55, w: leftW - 0.5, h: 0.28,
    fontSize: 8.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 1.5,
  });
  gapAnalysis.recommendedDeploymentOrder.slice(0, 4).forEach((step, i) => {
    const sy = colY + 2.92 + i * 0.42;
    slide.addShape('ellipse', { x: MARGIN + 0.25, y: sy + 0.04, w: 0.28, h: 0.28, fill: { color: C.blue } });
    slide.addText(String(i + 1), {
      x: MARGIN + 0.25, y: sy + 0.04, w: 0.28, h: 0.28,
      fontSize: 9, bold: true, color: C.white, fontFace: 'Calibri', align: 'center', valign: 'middle',
    });
    slide.addText(step, {
      x: MARGIN + 0.65, y: sy, w: leftW - 0.9, h: 0.36,
      fontSize: 10, color: C.grayMid, fontFace: 'Calibri', valign: 'middle',
    });
  });

  // Right column — blockers + quick wins
  const halfH = (fullH - 0.3) / 2;

  // Blockers
  slide.addShape('roundRect', {
    x: rightX, y: colY, w: rightW, h: halfH,
    rectRadius: 0.1, fill: { color: 'EF444408' }, line: { color: C.red, width: 0.6 },
  });
  slide.addText('BLOCKERS', {
    x: rightX + 0.25, y: colY + 0.2, w: rightW - 0.5, h: 0.28,
    fontSize: 9, bold: true, color: C.red, fontFace: 'Calibri', charSpacing: 2,
  });
  if (gapAnalysis.blockers.length === 0) {
    slide.addText('✓  No blockers — ready to proceed', {
      x: rightX + 0.25, y: colY + 0.58, w: rightW - 0.5, h: 0.35,
      fontSize: 12, color: C.green, fontFace: 'Calibri',
    });
  } else {
    gapAnalysis.blockers.slice(0, 3).forEach((b, i) => {
      slide.addText(`✗  ${b}`, {
        x: rightX + 0.25, y: colY + 0.58 + i * 0.45, w: rightW - 0.5, h: 0.38,
        fontSize: 11, color: 'EF9090', fontFace: 'Calibri',
      });
    });
  }

  // Quick wins
  const qY = colY + halfH + 0.3;
  slide.addShape('roundRect', {
    x: rightX, y: qY, w: rightW, h: halfH,
    rectRadius: 0.1, fill: { color: '00C48C08' }, line: { color: C.green, width: 0.6 },
  });
  slide.addText('QUICK WINS', {
    x: rightX + 0.25, y: qY + 0.2, w: rightW - 0.5, h: 0.28,
    fontSize: 9, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 2,
  });
  if (gapAnalysis.quickWins.length === 0) {
    slide.addText('Resolve blockers to unlock quick wins', {
      x: rightX + 0.25, y: qY + 0.58, w: rightW - 0.5, h: 0.35,
      fontSize: 11, color: C.gray, italic: true, fontFace: 'Calibri',
    });
  } else {
    gapAnalysis.quickWins.slice(0, 3).forEach((w, i) => {
      slide.addText(`✓  ${w}`, {
        x: rightX + 0.25, y: qY + 0.58 + i * 0.45, w: rightW - 0.5, h: 0.38,
        fontSize: 11, color: '6EE7B7', fontFace: 'Calibri',
      });
    });
  }
}

// ── Slide 6: Investment ───────────────────────────────────────────────────────
function slide6Investment(pptx: PptxGenJS, submission: OnboardingData, roi: ROIResult) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'Pricing & Investment', submission.businessName);
  footer(slide, submission.businessName);

  // Determine tier
  const count = submission.monthlyInvoiceCount;
  let tierName: string, price: number, limit: string;
  if (count === 'Under 30' || count === '30 – 50') {
    tierName = 'Essentials'; price = 697; limit = 'Up to 150 invoices / mo';
  } else if (['50 – 100', '100 – 150', '150 – 250'].includes(count)) {
    tierName = 'Professional'; price = 1497; limit = 'Up to 250 invoices / mo';
  } else {
    tierName = 'Business'; price = 2497; limit = 'Up to 400 invoices / mo';
  }
  const annualCost = price * 12;

  const topY = CONTENT_Y + 0.1;
  const fullH = H - topY - 0.32 - 0.55;

  // Tier card — left
  const tierW = 5.5;
  slide.addShape('roundRect', {
    x: MARGIN, y: topY, w: tierW, h: fullH,
    rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.cyan, width: 1.5 },
  });
  slide.addShape('rect', { x: MARGIN, y: topY, w: tierW, h: 0.05, fill: { color: C.cyan } });

  slide.addText('RECOMMENDED TIER', {
    x: MARGIN + 0.3, y: topY + 0.22, w: tierW - 0.6, h: 0.28,
    fontSize: 9, bold: true, color: C.cyan, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText(tierName, {
    x: MARGIN + 0.3, y: topY + 0.55, w: tierW - 0.6, h: 0.65,
    fontSize: 38, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText(`$${price.toLocaleString()} / month`, {
    x: MARGIN + 0.3, y: topY + 1.22, w: tierW - 0.6, h: 0.52,
    fontSize: 26, bold: true, color: C.cyan, fontFace: 'Calibri',
  });
  slide.addText(limit, {
    x: MARGIN + 0.3, y: topY + 1.78, w: tierW - 0.6, h: 0.3,
    fontSize: 12, color: C.gray, fontFace: 'Calibri',
  });
  slide.addText('Overage: $5 / invoice', {
    x: MARGIN + 0.3, y: topY + 2.12, w: tierW - 0.6, h: 0.28,
    fontSize: 11, color: C.gray, italic: true, fontFace: 'Calibri',
  });

  slide.addShape('rect', { x: MARGIN + 0.3, y: topY + 2.55, w: tierW - 0.6, h: 0.02, fill: { color: C.blue } });

  // ROI at a glance
  slide.addText('AT THIS INVESTMENT', {
    x: MARGIN + 0.3, y: topY + 2.75, w: tierW - 0.6, h: 0.25,
    fontSize: 8.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText(`${formatCurrency(annualCost)} / year`, {
    x: MARGIN + 0.3, y: topY + 3.05, w: tierW - 0.6, h: 0.38,
    fontSize: 16, color: C.grayMid, fontFace: 'Calibri',
  });
  slide.addText('→', {
    x: MARGIN + 0.3, y: topY + 3.45, w: 0.4, h: 0.38,
    fontSize: 18, color: C.blue, bold: true, fontFace: 'Calibri',
  });
  slide.addText(`${formatCurrency(roi.totalYear1)} Year 1 value`, {
    x: MARGIN + 0.75, y: topY + 3.45, w: tierW - 1.05, h: 0.38,
    fontSize: 16, bold: true, color: C.green, fontFace: 'Calibri',
  });
  slide.addText(`${roi.roi}x ROI`, {
    x: MARGIN + 0.3, y: topY + 3.88, w: tierW - 0.6, h: 0.38,
    fontSize: 22, bold: true, color: C.amber, fontFace: 'Calibri',
  });

  // Right column — terms
  const rx = MARGIN + tierW + 0.35;
  const rw = CONTENT_W - tierW - 0.35;
  const termH = (fullH - 0.4) / 3;

  const terms = [
    { label: 'IMPLEMENTATION FEE', value: '$2,500', note: 'Waived on 12-month commitment', color: C.amber },
    { label: '60-DAY GUARANTEE', value: '60 Days', note: 'Full satisfaction guarantee — cancel if not satisfied', color: C.green },
    { label: 'REFERRAL PROGRAM', value: '20% MRR', note: 'Recurring revenue share for qualified referrals', color: C.blue },
  ];

  terms.forEach((t, i) => {
    const ty = topY + i * (termH + 0.2);
    slide.addShape('roundRect', {
      x: rx, y: ty, w: rw, h: termH,
      rectRadius: 0.1, fill: { color: C.panel }, line: { color: t.color, width: 0.6 },
    });
    slide.addText(t.label, {
      x: rx + 0.25, y: ty + 0.2, w: rw - 0.5, h: 0.28,
      fontSize: 8.5, bold: true, color: t.color, fontFace: 'Calibri', charSpacing: 1.5,
    });
    slide.addText(t.value, {
      x: rx + 0.25, y: ty + 0.52, w: rw - 0.5, h: 0.55,
      fontSize: 28, bold: true, color: t.color, fontFace: 'Calibri',
    });
    slide.addText(t.note, {
      x: rx + 0.25, y: ty + termH - 0.42, w: rw - 0.5, h: 0.35,
      fontSize: 10.5, color: C.gray, fontFace: 'Calibri',
    });
  });
}

// ── Slide 7: Next Steps ───────────────────────────────────────────────────────
function slide7NextSteps(pptx: PptxGenJS, submission: OnboardingData) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'Next Steps', submission.businessName);
  footer(slide, submission.businessName);

  const steps = [
    {
      num: '01',
      title: 'Confirm Scope & Sign Agreement',
      desc: `Review the recommended modules and deployment order. Sign the Master Services Agreement to lock in your implementation date.${submission.targetStartDate ? `  Target start: ${submission.targetStartDate}.` : ''}`,
      color: C.cyan,
    },
    {
      num: '02',
      title: 'QuickBooks Read-Only Audit',
      desc: 'We connect your QuickBooks Online via a read-only API — no changes to your books. A 2-week parallel test runs alongside your existing process so you can verify accuracy before anything goes live.',
      color: C.blue,
    },
    {
      num: '03',
      title: 'Go Live & Measure Results',
      desc: 'Your AR automation goes live. We track DSO weekly, send a monthly impact report, and adjust workflows based on results. You\'ll see the line bending down within 30 days.',
      color: C.green,
    },
  ];

  const topY = CONTENT_Y + 0.15;
  const cardH = (H - topY - 0.32 - 0.55 - 0.4) / 3;

  steps.forEach((step, i) => {
    const y = topY + i * (cardH + 0.2);

    slide.addShape('roundRect', {
      x: MARGIN, y, w: CONTENT_W, h: cardH,
      rectRadius: 0.1, fill: { color: C.panel }, line: { color: step.color, width: 0.6 },
    });
    slide.addShape('rect', { x: MARGIN, y, w: 0.05, h: cardH, fill: { color: step.color } });

    // Step number
    slide.addText(step.num, {
      x: MARGIN + 0.25, y: y + (cardH - 1.1) / 2, w: 1.0, h: 1.1,
      fontSize: 52, bold: true, color: step.color + '35', fontFace: 'Calibri',
    });

    // Title + description
    slide.addText(step.title, {
      x: MARGIN + 1.35, y: y + 0.18, w: CONTENT_W - 1.6, h: 0.4,
      fontSize: 16, bold: true, color: step.color, fontFace: 'Calibri',
    });
    slide.addText(step.desc, {
      x: MARGIN + 1.35, y: y + 0.6, w: CONTENT_W - 1.6, h: cardH - 0.7,
      fontSize: 11.5, color: C.grayMid, fontFace: 'Calibri',
    });
  });

  // Contact line above footer
  slide.addText('"We earn your business every month through results."  —  Jonathan Rodriguez  ·  jrodriguez@lunarlogic.ai', {
    x: MARGIN, y: H - 0.32 - 0.38, w: CONTENT_W, h: 0.3,
    fontSize: 10, italic: true, color: C.gray, fontFace: 'Calibri', align: 'center',
  });
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateSlideDeck(
  submission: OnboardingData,
  gapAnalysis: GapAnalysisReport,
  roi: ROIResult
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = `LunarLogic Discovery Call — ${submission.businessName}`;
  pptx.author = 'LunarLogic LLC';
  pptx.company = 'LunarLogic LLC';

  slide1Cover(pptx, submission);
  slide2Challenge(pptx, submission, roi);
  slide3ROI(pptx, roi, submission);
  slide4Modules(pptx, submission, gapAnalysis);
  slide5Readiness(pptx, gapAnalysis, submission);
  slide6Investment(pptx, submission, roi);
  slide7NextSteps(pptx, submission);

  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return buffer as Buffer;
}
