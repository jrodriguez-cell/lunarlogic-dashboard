import PptxGenJS from '/tmp/pptx-gen/node_modules/pptxgenjs/dist/pptxgen.cjs.js';
import { writeFileSync } from 'fs';

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

const W = 13.33;
const H = 7.5;
const M = 0.55;
const HEADER_H = 0.72;
const CONTENT_Y = HEADER_H + 0.45;
const CW = W - M * 2;

function bg(slide) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
}

function header(slide, title, subtitle) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: HEADER_H, fill: { color: C.navyMid } });
  slide.addShape('rect', { x: 0, y: HEADER_H - 0.025, w: W, h: 0.025, fill: { color: C.blue } });
  slide.addText([
    { text: 'LUNAR', options: { color: C.cyan, bold: true } },
    { text: 'LOGIC', options: { color: C.white, bold: true } },
  ], { x: M, y: 0, w: 1.8, h: HEADER_H, fontSize: 16, fontFace: 'Calibri', valign: 'middle' });

  const titleBlock = [{ text: title, options: { color: C.offWhite, bold: true } }];
  if (subtitle) titleBlock.push({ text: `  ·  ${subtitle}`, options: { color: C.gray, bold: false } });
  slide.addText(titleBlock, {
    x: 2.6, y: 0, w: W - 2.6 - M, h: HEADER_H,
    fontSize: 13, fontFace: 'Calibri', valign: 'middle', align: 'right',
  });
}

function footer(slide) {
  slide.addShape('rect', { x: 0, y: H - 0.32, w: W, h: 0.32, fill: { color: C.navyMid } });
  slide.addText('LunarLogic LLC  ·  Confidential', {
    x: M, y: H - 0.32, w: CW / 2, h: 0.32,
    fontSize: 8, color: C.gray, fontFace: 'Calibri', valign: 'middle',
  });
  slide.addText('Forvis Mazars  ·  Chicago Office', {
    x: M + CW / 2, y: H - 0.32, w: CW / 2, h: 0.32,
    fontSize: 8, color: C.gray, fontFace: 'Calibri', valign: 'middle', align: 'right',
  });
}

function metricCard(slide, x, y, w, h, label, value, valueColor, sub) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.1, fill: { color: C.panel }, line: { color: '1E3A5F', width: 0.75 } });
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

// ── Slide 1: Cover ─────────────────────────────────────────────────────────────
function slide1(pptx) {
  const slide = pptx.addSlide();
  bg(slide);

  const panelW = W * 0.42;
  slide.addShape('rect', { x: 0, y: 0, w: panelW, h: H, fill: { color: C.navyMid } });
  slide.addShape('rect', { x: panelW, y: 0, w: 0.04, h: H, fill: { color: C.blue } });

  slide.addText([
    { text: 'LUNAR', options: { color: C.cyan } },
    { text: 'LOGIC', options: { color: C.white } },
  ], { x: 0.7, y: 0.6, w: panelW - 1.0, h: 0.6, fontSize: 32, bold: true, fontFace: 'Calibri' });
  slide.addText('AR AUTOMATION PLATFORM', {
    x: 0.7, y: 1.2, w: panelW - 1.0, h: 0.3,
    fontSize: 9, color: C.gray, fontFace: 'Calibri', charSpacing: 2,
  });
  slide.addShape('rect', { x: 0.7, y: 1.65, w: panelW - 1.4, h: 0.025, fill: { color: C.blue } });

  slide.addText('PREPARED FOR', {
    x: 0.7, y: 1.9, w: panelW - 1.0, h: 0.25,
    fontSize: 8.5, color: C.cyan, bold: true, fontFace: 'Calibri', charSpacing: 2,
  });
  slide.addText('Forvis Mazars', {
    x: 0.7, y: 2.18, w: panelW - 1.0, h: 0.55,
    fontSize: 22, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('Peter Sukits', {
    x: 0.7, y: 2.76, w: panelW - 1.0, h: 0.35,
    fontSize: 14, color: C.grayMid, fontFace: 'Calibri',
  });
  slide.addText('Accounting Advisory  ·  Chicago Office', {
    x: 0.7, y: 3.14, w: panelW - 1.0, h: 0.28,
    fontSize: 12, color: C.gray, fontFace: 'Calibri',
  });
  slide.addText('June 2026', {
    x: 0.7, y: H - 0.7, w: panelW - 1.0, h: 0.28,
    fontSize: 10, color: C.gray, fontFace: 'Calibri',
  });

  const rx = panelW + 0.3;
  const rw = W - rx - 0.5;

  slide.addText('Exploratory Call', {
    x: rx, y: 1.0, w: rw, h: 0.75,
    fontSize: 44, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('AR Automation for Professional Services Firms', {
    x: rx, y: 1.78, w: rw, h: 0.42,
    fontSize: 18, color: C.cyan, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: rx, y: 2.35, w: rw, h: 0.025, fill: { color: C.blue } });
  slide.addText('Automate the full Order-to-Cash cycle — from invoice creation to cash application — without changing your ERP or accounting workflows.', {
    x: rx, y: 2.55, w: rw, h: 0.5,
    fontSize: 12, color: C.gray, fontFace: 'Calibri',
  });

  slide.addShape('roundRect', {
    x: rx, y: 3.25, w: rw, h: 2.1,
    rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.green, width: 1 },
  });
  slide.addShape('rect', { x: rx, y: 3.25, w: rw, h: 0.04, fill: { color: C.green } });
  slide.addText('CLIENT PROOF POINT', {
    x: rx + 0.3, y: 3.38, w: rw - 0.6, h: 0.28,
    fontSize: 9, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText('"84% reduction in invoice processing time.\n19-day DSO improvement in under 90 days."', {
    x: rx + 0.3, y: 3.7, w: rw - 0.6, h: 0.9,
    fontSize: 16, italic: true, color: C.offWhite, fontFace: 'Calibri',
  });
  slide.addText('— Kaptain Clean LLC, Anchor Client', {
    x: rx + 0.3, y: 4.68, w: rw - 0.6, h: 0.28,
    fontSize: 10, color: C.gray, fontFace: 'Calibri',
  });
}

// ── Slide 2: The Problem ───────────────────────────────────────────────────────
function slide2(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'The Problem', 'AR in professional services today');
  footer(slide);

  const topY = CONTENT_Y + 0.1;

  const problems = [
    {
      icon: '⏱',
      title: 'Manual follow-up is time-consuming',
      desc: 'Staff spend 3–8 hours per week manually chasing invoices, building aging reports, and sending reminder emails — work that generates zero revenue.',
      color: C.red,
    },
    {
      icon: '📊',
      title: 'No real-time visibility into AR health',
      desc: 'DSO, aging buckets, and overdue balances live in spreadsheets or ERP exports — not a live dashboard. By the time someone sees the data, it is already stale.',
      color: C.amber,
    },
    {
      icon: '💰',
      title: 'Cash application is slow and error-prone',
      desc: 'Matching bank deposits to open invoices takes days. Partial payments, bulk wires, and name mismatches create a permanent pending queue that delays the close.',
      color: C.amber,
    },
    {
      icon: '⚠',
      title: 'Write-off risk is invisible until it is too late',
      desc: '90+ day balances accumulate quietly. By the time they surface in a period-end review, the write-off conversation is already difficult — and ASC 310 compliance is at risk.',
      color: C.red,
    },
  ];

  const cardW = (CW - 0.45) / 2;
  const cardH = 1.7;
  const gap = 0.25;

  problems.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (cardW + gap);
    const y = topY + row * (cardH + gap);

    slide.addShape('roundRect', { x, y, w: cardW, h: cardH, rectRadius: 0.1, fill: { color: C.panel }, line: { color: p.color, width: 0.6 } });
    slide.addShape('rect', { x, y, w: 0.05, h: cardH, fill: { color: p.color } });
    slide.addText(p.icon + '  ' + p.title, {
      x: x + 0.25, y: y + 0.18, w: cardW - 0.45, h: 0.38,
      fontSize: 13, bold: true, color: C.white, fontFace: 'Calibri',
    });
    slide.addText(p.desc, {
      x: x + 0.25, y: y + 0.62, w: cardW - 0.45, h: cardH - 0.8,
      fontSize: 10.5, color: C.grayMid, fontFace: 'Calibri',
    });
  });
}

// ── Slide 3: Solution Overview ─────────────────────────────────────────────────
function slide3(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'The LunarLogic Solution', 'ERP-agnostic · multi-office ready');
  footer(slide);

  const topY = CONTENT_Y + 0.05;

  slide.addText('One platform. Four modules. Full Order-to-Cash automation.', {
    x: M, y: topY, w: CW, h: 0.38,
    fontSize: 15, color: C.grayMid, fontFace: 'Calibri',
  });

  const modules = [
    { code: 'WF1', name: 'Invoice Automation',    color: C.cyan,  desc: 'Create and send invoices from Slack commands or PDF uploads. AI-parsed into your ERP — no manual data entry.' },
    { code: 'WF2', name: 'Payment Reminders',     color: C.blue,  desc: 'Scheduled escalating reminders via Outlook at 7, 14, and 30 days past due. VIP exemption list. Daily AR aging to Slack.' },
    { code: 'WF3', name: 'Cash Application',      color: C.amber, desc: 'Bank-connected payment matching at 90%+ confidence. Auto-apply or Slack-route ambiguous bulk payments. FIFO by default.' },
    { code: 'WF4', name: 'AR Aging Dashboard',    color: C.green, desc: 'Live DSO trend, aging waterfall, invoice board, customer behavior scoring. Bookmarkable URL — no ERP login required.' },
  ];

  const cardW = (CW - 0.45) / 4;
  const cardH = H - topY - 0.38 - 0.55 - 0.32 - 0.4;
  const gap = 0.15;

  modules.forEach((mod, i) => {
    const x = M + i * (cardW + gap);
    const y = topY + 0.55;

    slide.addShape('roundRect', { x, y, w: cardW, h: cardH, rectRadius: 0.1, fill: { color: C.panel }, line: { color: mod.color, width: 0.75 } });
    slide.addShape('rect', { x, y, w: cardW, h: 0.06, fill: { color: mod.color } });

    slide.addShape('roundRect', {
      x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.32,
      rectRadius: 0.05, fill: { color: mod.color, transparency: 80 }, line: { color: mod.color, width: 0.5 },
    });
    slide.addText(mod.code, {
      x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.32,
      fontSize: 10, bold: true, color: mod.color, fontFace: 'Calibri', align: 'center', valign: 'middle',
    });
    slide.addText(mod.name, {
      x: x + 0.2, y: y + 0.66, w: cardW - 0.4, h: 0.55,
      fontSize: 13, bold: true, color: C.white, fontFace: 'Calibri',
    });
    slide.addShape('rect', { x: x + 0.2, y: y + 1.28, w: cardW - 0.4, h: 0.02, fill: { color: mod.color, transparency: 60 } });
    slide.addText(mod.desc, {
      x: x + 0.2, y: y + 1.44, w: cardW - 0.4, h: cardH - 1.7,
      fontSize: 10, color: C.grayMid, fontFace: 'Calibri',
    });
  });

  slide.addText('ERP connectors: NetSuite  ·  Microsoft Dynamics  ·  SAP  ·  QuickBooks  ·  Sage  ·  Custom API', {
    x: M, y: H - 0.32 - 0.42, w: CW, h: 0.3,
    fontSize: 9.5, color: C.gray, fontFace: 'Calibri', align: 'center', italic: true,
  });
}

// ── Slide 4: Live Demo ─────────────────────────────────────────────────────────
function slide4(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'Live Demo', 'AR Dashboard · Forvis Mazars Chicago');
  footer(slide);

  const topY = CONTENT_Y + 0.05;

  const mW = (CW - 0.6) / 5;
  const mH = 1.3;
  const gap = 0.15;
  const metrics = [
    { label: 'Current DSO',         value: '36d',   color: C.cyan,  sub: 'down from 58d' },
    { label: 'DSO Improvement',     value: '-22d',  color: C.green, sub: 'since go-live' },
    { label: 'Total AR',            value: '$892k', color: C.offWhite, sub: '22 open invoices' },
    { label: 'Overdue',             value: '7 inv', color: C.amber, sub: '$218k outstanding' },
    { label: 'Collection Eff.',     value: '82%',   color: C.green, sub: 'paid within terms' },
  ];

  metrics.forEach((m, i) => {
    metricCard(slide, M + i * (mW + gap), topY, mW, mH, m.label, m.value, m.color, m.sub);
  });

  const demoY = topY + mH + 0.3;
  const demoH = H - demoY - 0.32 - 0.55 - 0.1;

  const features = [
    { title: 'DSO Trend Chart',           desc: 'Rolling 90-day DSO with go-live annotation. The inflection point is the single most compelling retention visual — the line bends down at go-live.' },
    { title: 'AR Aging Waterfall',         desc: 'Current / 1-30 / 31-60 / 61-90 / 90+ buckets. Click any bar to drill down to the source invoices — exportable to Excel with ASC 310 ADA reserve rates.' },
    { title: 'Cash Application',           desc: '90%+ auto-match rate. Audit trail of every decision. Match rules panel shows the engine logic. Unapplied cash flagged per ASC 606 contract liability guidance.' },
    { title: 'AI Status Report',           desc: 'GPT-style narrative generated from live data at the top of every tab. Regenerates on demand. Surfaces GAAP compliance flags automatically.' },
  ];

  const fw = (CW - 0.45) / 2;
  const fh = (demoH - 0.2) / 2;
  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (fw + 0.15);
    const y = demoY + row * (fh + 0.2);
    slide.addShape('roundRect', { x, y, w: fw, h: fh, rectRadius: 0.08, fill: { color: C.panel }, line: { color: C.blue, width: 0.5 } });
    slide.addText(f.title, {
      x: x + 0.22, y: y + 0.16, w: fw - 0.44, h: 0.32,
      fontSize: 12, bold: true, color: C.cyan, fontFace: 'Calibri',
    });
    slide.addText(f.desc, {
      x: x + 0.22, y: y + 0.52, w: fw - 0.44, h: fh - 0.65,
      fontSize: 10, color: C.grayMid, fontFace: 'Calibri',
    });
  });
}

// ── Slide 5: Forvis Mazars Roadmap ─────────────────────────────────────────────
function slide5(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'Implementation Roadmap', 'Forvis Mazars · Suggested Path');
  footer(slide);

  const topY = CONTENT_Y + 0.05;

  slide.addText('A phased rollout designed for a multi-office advisory firm. Each phase delivers measurable ROI before the next begins.', {
    x: M, y: topY, w: CW, h: 0.38,
    fontSize: 12, color: C.grayMid, fontFace: 'Calibri',
  });

  const phases = [
    {
      num: '01',
      label: 'Weeks 1–4',
      title: 'Pilot — Chicago Office',
      color: C.cyan,
      items: [
        'Connect ERP (read-only API — no changes to existing workflows)',
        'Deploy WF4 AR Aging Dashboard for one practice group',
        'Baseline DSO measurement established',
        'Staff training: 1-hour Slack-based walkthrough',
      ],
    },
    {
      num: '02',
      label: 'Weeks 5–8',
      title: 'Automate Reminders',
      color: C.blue,
      items: [
        'WF2 Payment Reminders live — escalating 7 / 14 / 30 day sequences via Outlook',
        'VIP client exemption list configured per partner input',
        'Daily AR aging summary posted to practice-group Slack channel',
        'DSO impact measured at 30-day mark',
      ],
    },
    {
      num: '03',
      label: 'Weeks 9–16',
      title: 'Cash Application + Multi-Office',
      color: C.green,
      items: [
        'WF3 Cash Application deployed — bank connected via Plaid / BAI2 / direct API',
        'Match rules configured for firm-specific naming conventions',
        'Roll out to 2–3 additional offices or practice groups',
        'Consolidated AR dashboard across all offices',
      ],
    },
  ];

  const phaseH = (H - topY - 0.38 - 0.32 - 0.55 - 0.5) / 3;

  phases.forEach((p, i) => {
    const y = topY + 0.52 + i * (phaseH + 0.18);

    slide.addShape('roundRect', { x: M, y, w: CW, h: phaseH, rectRadius: 0.1, fill: { color: C.panel }, line: { color: p.color, width: 0.6 } });
    slide.addShape('rect', { x: M, y, w: 0.05, h: phaseH, fill: { color: p.color } });

    slide.addText(p.num, {
      x: M + 0.25, y: y + (phaseH - 1.0) / 2, w: 0.9, h: 1.0,
      fontSize: 52, bold: true, color: p.color, transparency: 78, fontFace: 'Calibri',
    });
    slide.addText(p.label, {
      x: M + 1.3, y: y + 0.12, w: 2.2, h: 0.28,
      fontSize: 9, bold: true, color: p.color, fontFace: 'Calibri', charSpacing: 1.5,
    });
    slide.addText(p.title, {
      x: M + 1.3, y: y + 0.38, w: 3.0, h: 0.42,
      fontSize: 16, bold: true, color: C.white, fontFace: 'Calibri',
    });

    const itemColX = M + 4.6;
    const itemW = CW - 4.6 + M - M;
    p.items.forEach((item, j) => {
      slide.addText('• ' + item, {
        x: itemColX, y: y + 0.12 + j * (phaseH - 0.24) / 4, w: itemW, h: (phaseH - 0.24) / 4,
        fontSize: 10.5, color: C.grayMid, fontFace: 'Calibri', valign: 'middle',
      });
    });
  });
}

// ── Slide 6: Next Step ─────────────────────────────────────────────────────────
function slide6(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  header(slide, 'Next Step', 'One conversation away');
  footer(slide);

  const topY = CONTENT_Y + 0.1;
  const fullH = H - topY - 0.32 - 0.55 - 0.1;

  // Left — value panel
  const leftW = 5.8;
  slide.addShape('roundRect', {
    x: M, y: topY, w: leftW, h: fullH,
    rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.cyan, width: 1.2 },
  });
  slide.addShape('rect', { x: M, y: topY, w: leftW, h: 0.05, fill: { color: C.cyan } });

  slide.addText('WHAT FORVIS MAZARS GETS', {
    x: M + 0.3, y: topY + 0.22, w: leftW - 0.6, h: 0.28,
    fontSize: 9, bold: true, color: C.cyan, fontFace: 'Calibri', charSpacing: 1.5,
  });

  const bullets = [
    { icon: '↓', text: 'DSO reduction — 15–25 days based on firm benchmarks', color: C.green },
    { icon: '⚡', text: '80%+ of cash application handled automatically', color: C.cyan },
    { icon: '👁', text: 'Real-time AR health visible to partners and staff — no ERP login required', color: C.offWhite },
    { icon: '🏢', text: 'Scales across offices and practice groups from a single dashboard', color: C.offWhite },
    { icon: '✓', text: 'Full GAAP alignment — ASC 310, ASC 606, ADA reserve estimation built in', color: C.green },
    { icon: '🛡', text: 'Complete audit trail — every cash application decision logged for SOC 2 / internal controls', color: C.grayMid },
  ];

  bullets.forEach((b, i) => {
    slide.addText(`${b.icon}  ${b.text}`, {
      x: M + 0.3, y: topY + 0.72 + i * 0.65, w: leftW - 0.6, h: 0.55,
      fontSize: 11.5, color: b.color, fontFace: 'Calibri', valign: 'middle',
    });
  });

  // Right — next steps
  const rx = M + leftW + 0.35;
  const rw = CW - leftW - 0.35;

  const steps = [
    { num: '01', title: 'Identify a Pilot Practice Group', desc: 'Select one office or team to run a 30-day parallel test. No changes to your ERP or existing workflows.', color: C.cyan },
    { num: '02', title: 'Read-Only ERP Connection', desc: 'We connect via API in read-only mode. A 2-week parallel run verifies accuracy before anything posts.', color: C.blue },
    { num: '03', title: 'Live in 30 Days — Measure Results', desc: 'AR automation goes live. We track DSO weekly and deliver a monthly impact report.', color: C.green },
  ];

  const stepH = (fullH - 0.4) / 3;
  steps.forEach((s, i) => {
    const y = topY + i * (stepH + 0.2);
    slide.addShape('roundRect', { x: rx, y, w: rw, h: stepH, rectRadius: 0.1, fill: { color: C.panel }, line: { color: s.color, width: 0.6 } });
    slide.addShape('rect', { x: rx, y, w: 0.05, h: stepH, fill: { color: s.color } });
    slide.addText(s.num, {
      x: rx + 0.22, y: y + (stepH - 0.8) / 2, w: 0.7, h: 0.8,
      fontSize: 38, bold: true, color: s.color, transparency: 75, fontFace: 'Calibri',
    });
    slide.addText(s.title, {
      x: rx + 1.0, y: y + 0.15, w: rw - 1.2, h: 0.35,
      fontSize: 13, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(s.desc, {
      x: rx + 1.0, y: y + 0.52, w: rw - 1.2, h: stepH - 0.65,
      fontSize: 10, color: C.grayMid, fontFace: 'Calibri',
    });
  });

  // Contact
  slide.addText('"We earn your business every month through results."  —  Jonathan Rodriguez  ·  jrodriguez@lunarlogic.ai', {
    x: M, y: H - 0.32 - 0.38, w: CW, h: 0.3,
    fontSize: 10, italic: true, color: C.gray, fontFace: 'Calibri', align: 'center',
  });
}

// ── Generate ───────────────────────────────────────────────────────────────────
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title = 'LunarLogic AR Automation — Forvis Mazars Exploratory Call';
pptx.author = 'LunarLogic LLC';
pptx.company = 'LunarLogic LLC';

slide1(pptx);
slide2(pptx);
slide3(pptx);
slide4(pptx);
slide5(pptx);
slide6(pptx);

const buf = await pptx.write({ outputType: 'nodebuffer' });
writeFileSync('/home/user/lunarlogic-dashboard/LunarLogic_ForvisMazars_Deck.pptx', buf);
console.log('Done — LunarLogic_ForvisMazars_Deck.pptx written.');
