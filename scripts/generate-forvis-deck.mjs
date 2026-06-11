import PptxGenJS from '/tmp/pptx-gen/node_modules/pptxgenjs/dist/pptxgen.cjs.js';
import { writeFileSync } from 'fs';

const C = {
  navy:     '0A0F1E',
  navyMid:  '0D1526',
  panel:    '152035',
  panelAlt: '0F1C30',
  panelB:   '0B1929',
  blue:     '2D5BE3',
  cyan:     '00CFFF',
  teal:     '00D4E8',
  green:    '22C55E',
  amber:    'F59E0B',
  orange:   'F97316',
  red:      'EF4444',
  white:    'FFFFFF',
  offWhite: 'F0F4FF',
  gray:     '8A94A6',
  grayMid:  'B8C4D6',
  border:   '1E3A5F',
};

const W = 13.33;
const H = 7.5;
const M = 0.6;
const HEADER_H = 0.68;
const CW = W - M * 2;
const TOTAL = 8;

// ── helpers ────────────────────────────────────────────────────────────────────

function bg(slide) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
}

function logo(slide, x, y) {
  slide.addText([
    { text: 'Lunar', options: { color: C.teal, bold: true } },
    { text: 'Logic', options: { color: C.white, bold: true } },
  ], { x, y, w: 2.2, h: 0.42, fontSize: 18, fontFace: 'Calibri' });
}

function topBar(slide, n) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: HEADER_H, fill: { color: C.navyMid } });
  slide.addShape('rect', { x: 0, y: HEADER_H - 0.02, w: W, h: 0.02, fill: { color: C.blue } });
  logo(slide, M, 0.13);
  slide.addText(`${n} / ${TOTAL}`, {
    x: W - M - 0.8, y: 0.18, w: 0.8, h: 0.32,
    fontSize: 10, color: C.gray, fontFace: 'Calibri', align: 'right',
  });
}

function footer(slide) {
  slide.addShape('rect', { x: 0, y: H - 0.28, w: W, h: 0.28, fill: { color: C.navyMid } });
  slide.addText('LunarLogic LLC  ·  Confidential  ·  jrodriguez@lunarlogic.ai', {
    x: M, y: H - 0.28, w: CW, h: 0.28,
    fontSize: 8, color: C.gray, fontFace: 'Calibri', valign: 'middle', align: 'center',
  });
}

function sectionHeader(slide, title, sub, color = C.gray) {
  const topY = HEADER_H + 0.38;
  slide.addText(title, {
    x: M, y: topY, w: CW, h: 0.52,
    fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri',
  });
  if (sub) slide.addText(sub, {
    x: M, y: topY + 0.52, w: CW, h: 0.3,
    fontSize: 13, color, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: M, y: topY + 0.9, w: CW, h: 0.02, fill: { color: C.blue } });
  return topY;
}

function card(slide, x, y, w, h, borderColor, opts = {}) {
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: 0.09,
    fill: { color: opts.bg || C.panel },
    line: { color: borderColor, width: opts.lw || 0.6 },
  });
  if (opts.topBar !== false) {
    slide.addShape('rect', { x, y, w, h: 0.05, fill: { color: borderColor } });
  }
}

// ── Slide 1: Cover ─────────────────────────────────────────────────────────────
function slide1(pptx) {
  const slide = pptx.addSlide();
  bg(slide);

  const pw = W * 0.4;
  slide.addShape('rect', { x: 0, y: 0, w: pw, h: H, fill: { color: C.navyMid } });
  slide.addShape('rect', { x: pw - 0.03, y: 0, w: 0.03, h: H, fill: { color: C.blue } });

  logo(slide, 0.65, 0.55);
  slide.addText('AR AUTOMATION PLATFORM', {
    x: 0.65, y: 0.98, w: pw - 1.1, h: 0.22,
    fontSize: 8, color: C.gray, fontFace: 'Calibri', charSpacing: 2,
  });
  slide.addShape('rect', { x: 0.65, y: 1.32, w: pw - 1.3, h: 0.02, fill: { color: C.blue } });

  slide.addText('PREPARED FOR', {
    x: 0.65, y: 1.55, w: pw - 1.1, h: 0.22,
    fontSize: 8, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2,
  });
  slide.addText('Forvis Mazars', {
    x: 0.65, y: 1.82, w: pw - 1.0, h: 0.52,
    fontSize: 22, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('Peter Sukits', {
    x: 0.65, y: 2.38, w: pw - 1.0, h: 0.32,
    fontSize: 13, color: C.grayMid, fontFace: 'Calibri',
  });
  slide.addText('Accounting Advisory  ·  Chicago', {
    x: 0.65, y: 2.73, w: pw - 1.0, h: 0.26,
    fontSize: 10.5, color: C.gray, fontFace: 'Calibri',
  });
  slide.addText('June 11, 2026', {
    x: 0.65, y: H - 0.62, w: pw - 1.0, h: 0.24,
    fontSize: 9.5, color: C.gray, fontFace: 'Calibri',
  });

  const rx = pw + 0.35;
  const rw = W - rx - 0.5;

  slide.addText('Solving the Cash Application\nProblem in Professional Services', {
    x: rx, y: 1.0, w: rw, h: 1.7,
    fontSize: 34, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('From 58-day DSO to 36 days — in under 90 days', {
    x: rx, y: 2.75, w: rw, h: 0.36,
    fontSize: 14, color: C.teal, fontFace: 'Calibri', italic: true,
  });
  slide.addShape('rect', { x: rx, y: 3.22, w: rw, h: 0.02, fill: { color: C.blue } });

  // Proof-point box
  slide.addShape('roundRect', {
    x: rx, y: 3.42, w: rw, h: 1.95,
    rectRadius: 0.1, fill: { color: C.panel }, line: { color: C.green, width: 0.9 },
  });
  slide.addShape('rect', { x: rx, y: 3.42, w: rw, h: 0.05, fill: { color: C.green } });
  slide.addText('CLIENT PROOF POINT', {
    x: rx + 0.28, y: 3.58, w: rw - 0.56, h: 0.22,
    fontSize: 8.5, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText('"84% reduction in invoice processing time.\n19-day DSO improvement in under 90 days."', {
    x: rx + 0.28, y: 3.86, w: rw - 0.56, h: 0.85,
    fontSize: 14, italic: true, color: C.offWhite, fontFace: 'Calibri',
  });
  slide.addText('— Kaptain Clean LLC  ·  Anchor Client', {
    x: rx + 0.28, y: 4.78, w: rw - 0.56, h: 0.26,
    fontSize: 9.5, color: C.gray, fontFace: 'Calibri',
  });
}

// ── Slide 2: The Problem ────────────────────────────────────────────────────────
function slide2(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 2);
  footer(slide);

  const topY = sectionHeader(slide,
    'The Problem',
    "Cash application: your client's most manual, error-prone AR process",
    C.red
  );

  const startY = topY + 1.1;

  // Left col: pain points
  const pains = [
    { label: '$1.4M total AR', desc: '22 open invoices across 8 customers — matched manually against bank statement line items every close cycle', color: C.red },
    { label: '3–5 day close', desc: 'Staff spend the first week of each month reconciling deposits. One bulk payment from Vantage Healthcare takes a full day alone.', color: C.amber },
    { label: 'Bulk & partial payments', desc: 'Vantage Healthcare sends a single $218k wire covering 11 invoices. Castlebrook remits $62k against a $74k balance. Who decides how to apply?', color: C.amber },
    { label: '58-day DSO baseline', desc: 'Cash is sitting in AR when it could be deployed. Every 10 days of DSO reduction releases ~$150k in working capital.', color: C.orange },
    { label: 'Zero audit trail', desc: 'How was that Castlebrook bulk payment applied? Who decided? There is no log — just a note in a spreadsheet, if that.', color: C.gray },
  ];

  const cardH = 0.96;
  const cardW = CW * 0.56;
  const gap = 0.14;

  pains.forEach((p, i) => {
    const y = startY + i * (cardH + gap);
    slide.addShape('roundRect', {
      x: M, y, w: cardW, h: cardH, rectRadius: 0.08,
      fill: { color: C.panel }, line: { color: p.color, width: 0.5 },
    });
    slide.addShape('rect', { x: M, y, w: 0.04, h: cardH, fill: { color: p.color } });
    slide.addText(p.label, {
      x: M + 0.22, y: y + 0.1, w: cardW - 0.44, h: 0.3,
      fontSize: 13, bold: true, color: p.color, fontFace: 'Calibri',
    });
    slide.addText(p.desc, {
      x: M + 0.22, y: y + 0.44, w: cardW - 0.44, h: 0.46,
      fontSize: 9.5, color: C.grayMid, fontFace: 'Calibri',
    });
  });

  // Right col: "today's workflow"
  const rx = M + cardW + 0.35;
  const rw = W - rx - M;

  slide.addText('TODAY\'S WORKFLOW', {
    x: rx, y: startY, w: rw, h: 0.24,
    fontSize: 8.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 2,
  });

  const steps = [
    { n: '1', t: 'Download bank statement', c: C.gray },
    { n: '2', t: 'Open QB / ERP — pull invoice list', c: C.gray },
    { n: '3', t: 'Match deposits by hand', c: C.amber },
    { n: '4', t: 'Decide how to split bulk wires', c: C.red },
    { n: '5', t: 'Post to ledger — email client', c: C.gray },
    { n: '6', t: 'Repeat for every missed match', c: C.red },
  ];

  steps.forEach((s, i) => {
    const sy = startY + 0.36 + i * 0.72;
    slide.addShape('roundRect', {
      x: rx, y: sy, w: rw, h: 0.6, rectRadius: 0.07,
      fill: { color: C.panelAlt }, line: { color: s.c, width: 0.4 },
    });
    slide.addText(s.n, {
      x: rx + 0.15, y: sy + 0.08, w: 0.32, h: 0.44,
      fontSize: 20, bold: true, color: s.c, fontFace: 'Calibri',
    });
    slide.addText(s.t, {
      x: rx + 0.55, y: sy + 0.13, w: rw - 0.72, h: 0.34,
      fontSize: 11, color: s.c === C.gray ? C.grayMid : s.c, fontFace: 'Calibri',
    });
    if (i < steps.length - 1) {
      slide.addShape('rect', {
        x: rx + 0.28, y: sy + 0.6, w: 0.02, h: 0.12,
        fill: { color: C.border },
      });
    }
  });

  // Summary callout
  const cY = startY + 0.36 + steps.length * 0.72 + 0.08;
  slide.addShape('roundRect', {
    x: rx, y: cY, w: rw, h: 0.78, rectRadius: 0.08,
    fill: { color: '1A0A0A' }, line: { color: C.red, width: 0.9 },
  });
  slide.addText('Result: $280k of receipts sitting unapplied for 3–5 business days every month. Every day of delay worsens DSO and cash flow visibility.', {
    x: rx + 0.18, y: cY + 0.1, w: rw - 0.36, h: 0.58,
    fontSize: 10, color: C.offWhite, fontFace: 'Calibri', italic: true,
  });
}

// ── Slide 3: The Solution ───────────────────────────────────────────────────────
function slide3(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 3);
  footer(slide);

  const topY = sectionHeader(slide,
    'The Solution',
    'Automated payment matching — ERP-connected, confidence-scored, fully audited',
    C.teal
  );

  const startY = topY + 1.1;

  // Flow diagram: 4 boxes left → right
  const boxW = (CW - 0.6) / 4;
  const boxH = 2.0;
  const gap = 0.2;
  const flow = [
    { n: '1', title: 'Bank Feed\nIngestion', desc: 'Plaid webhook captures every incoming wire within seconds. No manual CSV download.', color: C.teal },
    { n: '2', title: 'AI Matching\nEngine', desc: 'Fuzzy-matches each deposit against open QB invoices by amount, date, and payment ref. Confidence-scored 0–100%.', color: C.blue },
    { n: '3', title: 'Auto-Apply\nor Escalate', desc: 'Confidence ≥ 90%: posted automatically. Below threshold: Slack prompt with suggested match for 1-tap approval.', color: C.amber },
    { n: '4', title: 'Audit Trail\n& Dashboard', desc: 'Every decision logged: rule applied, confidence score, who approved. Live AR dashboard updates in real time.', color: C.green },
  ];

  flow.forEach((f, i) => {
    const x = M + i * (boxW + gap);
    card(slide, x, startY, boxW, boxH, f.color);
    slide.addText(f.n, {
      x: x + 0.18, y: startY + 0.18, w: 0.4, h: 0.65,
      fontSize: 36, bold: true, color: f.color, fontFace: 'Calibri',
    });
    slide.addText(f.title, {
      x: x + 0.18, y: startY + 0.8, w: boxW - 0.36, h: 0.55,
      fontSize: 13, bold: true, color: f.color, fontFace: 'Calibri',
    });
    slide.addText(f.desc, {
      x: x + 0.18, y: startY + 1.38, w: boxW - 0.36, h: 0.54,
      fontSize: 9.5, color: C.grayMid, fontFace: 'Calibri',
    });
    if (i < flow.length - 1) {
      slide.addText('→', {
        x: x + boxW + gap * 0.1, y: startY + boxH / 2 - 0.22, w: gap * 0.8, h: 0.44,
        fontSize: 20, bold: true, color: C.gray, fontFace: 'Calibri', align: 'center',
      });
    }
  });

  // Stat strip below flow
  const statY = startY + boxH + 0.28;
  const statW = (CW - 0.45) / 4;
  const stats = [
    { label: 'Auto-Match Rate',    value: '87%',   color: C.green,  sub: '13 of 15 payments applied' },
    { label: 'Avg Application',    value: '< 8 min', color: C.teal,  sub: 'deposit to ledger posting' },
    { label: 'DSO Reduction',      value: '−22d',  color: C.green,  sub: '58d → 36d since go-live' },
    { label: 'Pending Review',     value: '2',     color: C.amber,  sub: '$280k awaiting 1-tap confirm' },
  ];
  const statH = H - statY - 0.28 - 0.2;
  stats.forEach((s, i) => {
    const x = M + i * (statW + 0.15);
    card(slide, x, statY, statW, statH, s.color, { topBar: false });
    slide.addText(s.label.toUpperCase(), {
      x: x + 0.18, y: statY + 0.14, w: statW - 0.36, h: 0.22,
      fontSize: 7.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 1.2,
    });
    slide.addText(s.value, {
      x: x + 0.18, y: statY + 0.38, w: statW - 0.36, h: 0.65,
      fontSize: 30, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(s.sub, {
      x: x + 0.18, y: statY + statH - 0.38, w: statW - 0.36, h: 0.28,
      fontSize: 8.5, color: C.gray, fontFace: 'Calibri',
    });
  });
}

// ── Slide 4: Dashboard Features ─────────────────────────────────────────────────
function slide4(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 4);
  footer(slide);

  const topY = sectionHeader(slide,
    'The Dashboard',
    'Four views built specifically for Forvis Mazars — live with your data today',
    C.teal
  );

  const startY = topY + 1.1;
  const colW = (CW - 0.45) / 2;
  const rowH = (H - startY - 0.28 - 0.25) / 2;
  const gapX = 0.15;
  const gapY = 0.15;

  const features = [
    {
      color: C.teal,
      title: 'DSO Trend + Stat Strip',
      tag: 'OVERVIEW TAB',
      desc: 'Rolling 90-day DSO chart with go-live annotation — the moment LunarLogic went live, the line bends down. Left stat strip shows Current DSO (36d), Pre-LunarLogic baseline (58d), 22-day improvement, period high/low.',
      metrics: ['Current DSO: 36d', 'Improvement: ▼22d', 'Period low: 32d'],
    },
    {
      color: C.green,
      title: 'AR Aging by Customer',
      tag: 'OVERVIEW TAB',
      desc: 'Waterfall chart (Current → 1-30 → 31-60 → 61-90 → 90+d) with a sortable customer table showing risk rating, avg days to pay, and each aging bucket per customer. Click any bar or row to drill to source invoices.',
      metrics: ['Vantage: $318k · High risk · 64d avg', 'Castlebrook: $205k · High risk · 59d avg', 'Total AR: $1.4M · Click-to-export'],
    },
    {
      color: C.amber,
      title: 'Cash Application Queue',
      tag: 'CASH APPLICATION TAB',
      desc: 'Every incoming payment card-matched to its customer. Confidence score, auto-applied flag, and 1-tap Slack confirm for review items. Click any row to open the Payment Drawer with customer running balance — before and after application.',
      metrics: ['FM-T-0919 Vantage $218k → 1-tap review', 'FM-T-0916 Castlebrook $62k → 1-tap review', 'Running balance: Before $318k → After $100k'],
    },
    {
      color: C.blue,
      title: 'Cash Flow Forecast',
      tag: 'CASH APPLICATION TAB',
      desc: 'Weekly stacked bar chart of expected receipts, color-coded by collection risk. Expected date = invoice due date adjusted for each customer\'s historical avg days-to-pay. Horizon toggle: 30 / 60 / 90 days.',
      metrics: ['Next 30d: $412k expected', 'At-risk balance: $523k (high + overdue)', 'Click any week → underlying invoices'],
    },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (colW + gapX);
    const y = startY + row * (rowH + gapY);

    card(slide, x, y, colW, rowH, f.color);

    slide.addText(f.tag, {
      x: x + 0.2, y: y + 0.15, w: 1.6, h: 0.2,
      fontSize: 7.5, bold: true, color: f.color, fontFace: 'Calibri', charSpacing: 1.5,
    });
    slide.addText(f.title, {
      x: x + 0.2, y: y + 0.37, w: colW - 0.4, h: 0.35,
      fontSize: 14, bold: true, color: f.color, fontFace: 'Calibri',
    });
    slide.addText(f.desc, {
      x: x + 0.2, y: y + 0.76, w: colW - 0.4, h: rowH - 1.55,
      fontSize: 9.5, color: C.grayMid, fontFace: 'Calibri',
    });
    f.metrics.forEach((m, j) => {
      slide.addText('· ' + m, {
        x: x + 0.2, y: y + rowH - 0.92 + j * 0.26, w: colW - 0.4, h: 0.24,
        fontSize: 9, color: f.color, fontFace: 'Calibri',
      });
    });
  });
}

// ── Slide 5: Customer Running Balance ───────────────────────────────────────────
function slide5(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 5);
  footer(slide);

  const topY = sectionHeader(slide,
    'Payment Drawer Deep-Dive',
    'Customer running balance — before and after every payment application',
    C.amber
  );

  const startY = topY + 1.1;

  // ── Left: scenario narrative ──
  const lw = CW * 0.44;

  slide.addText('SCENARIO: CASTLEBROOK REAL ESTATE', {
    x: M, y: startY, w: lw, h: 0.22,
    fontSize: 8, bold: true, color: C.amber, fontFace: 'Calibri', charSpacing: 2,
  });

  const scenario = [
    'Castlebrook wires $62,000 against an open balance of $74,200 — a partial payment.',
    'Staff must decide: apply to oldest invoice first? Largest? Split evenly?',
    'LunarLogic\'s default rule: oldest invoice first (ASC 310 aging priority).',
    'The Payment Drawer shows the exact before/after for every open invoice — so the decision is transparent, documented, and defensible.',
  ];
  scenario.forEach((s, i) => {
    slide.addText('▸  ' + s, {
      x: M, y: startY + 0.32 + i * 0.55, w: lw, h: 0.5,
      fontSize: 10.5, color: C.grayMid, fontFace: 'Calibri',
    });
  });

  slide.addShape('rect', { x: M, y: startY + 0.32 + scenario.length * 0.55 + 0.1, w: lw, h: 0.02, fill: { color: C.border } });

  const noteY = startY + 0.32 + scenario.length * 0.55 + 0.24;
  slide.addShape('roundRect', {
    x: M, y: noteY, w: lw, h: 1.0, rectRadius: 0.08,
    fill: { color: '0F1E12' }, line: { color: C.green, width: 0.7 },
  });
  slide.addText('WHY THIS MATTERS', {
    x: M + 0.18, y: noteY + 0.12, w: lw - 0.36, h: 0.22,
    fontSize: 8, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText('Every partial payment decision is timestamped, attributed, and exportable for SOC 2 / internal controls review. No more "it was in the notes" answers during an audit.', {
    x: M + 0.18, y: noteY + 0.38, w: lw - 0.36, h: 0.54,
    fontSize: 10, color: C.offWhite, fontFace: 'Calibri', italic: true,
  });

  // ── Right: mock drawer UI ──
  const rx = M + lw + 0.4;
  const rw = W - rx - M;

  slide.addShape('roundRect', {
    x: rx, y: startY, w: rw, h: H - startY - 0.28 - 0.2, rectRadius: 0.12,
    fill: { color: C.panelAlt }, line: { color: C.border, width: 0.7 },
  });

  let dy = startY + 0.2;

  slide.addText('Payment Detail', {
    x: rx + 0.22, y: dy, w: rw - 0.44, h: 0.3,
    fontSize: 13, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('FM-T-0916  ·  Castlebrook Real Estate  ·  May 14, 2026', {
    x: rx + 0.22, y: dy + 0.32, w: rw - 0.44, h: 0.22,
    fontSize: 9, color: C.gray, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: rx + 0.22, y: dy + 0.6, w: rw - 0.44, h: 0.015, fill: { color: C.border } });

  dy += 0.74;

  // Confidence badge
  slide.addShape('roundRect', {
    x: rx + 0.22, y: dy, w: rw - 0.44, h: 0.45, rectRadius: 0.07,
    fill: { color: '1A2A10' }, line: { color: C.green, width: 0.5 },
  });
  slide.addText('✓  94% confidence  ·  rule: customer name + amount range  ·  Auto-applied', {
    x: rx + 0.35, y: dy + 0.1, w: rw - 0.7, h: 0.26,
    fontSize: 9, color: C.green, fontFace: 'Calibri',
  });

  dy += 0.6;

  // Before / After
  slide.addText('CUSTOMER OUTSTANDING BALANCE', {
    x: rx + 0.22, y: dy, w: rw - 0.44, h: 0.2,
    fontSize: 7.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText('As of May 14, 2026  ·  before this payment', {
    x: rx + 0.22, y: dy + 0.22, w: rw - 0.44, h: 0.2,
    fontSize: 8.5, color: C.gray, fontFace: 'Calibri', italic: true,
  });

  dy += 0.52;

  // Before / After boxes
  const baW = (rw - 0.44 - 0.12) / 2;
  const baH = 0.8;

  // Before
  slide.addShape('roundRect', {
    x: rx + 0.22, y: dy, w: baW, h: baH, rectRadius: 0.07,
    fill: { color: C.panel }, line: { color: C.red, width: 0.5 },
  });
  slide.addText('BEFORE', { x: rx + 0.34, y: dy + 0.1, w: baW - 0.24, h: 0.2, fontSize: 7.5, bold: true, color: C.red, fontFace: 'Calibri', charSpacing: 1 });
  slide.addText('$74,200', { x: rx + 0.34, y: dy + 0.32, w: baW - 0.24, h: 0.36, fontSize: 22, bold: true, color: C.red, fontFace: 'Calibri' });

  // After
  slide.addShape('roundRect', {
    x: rx + 0.22 + baW + 0.12, y: dy, w: baW, h: baH, rectRadius: 0.07,
    fill: { color: C.panel }, line: { color: C.green, width: 0.5 },
  });
  slide.addText('AFTER', { x: rx + 0.34 + baW + 0.12, y: dy + 0.1, w: baW - 0.24, h: 0.2, fontSize: 7.5, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 1 });
  slide.addText('$12,200', { x: rx + 0.34 + baW + 0.12, y: dy + 0.32, w: baW - 0.24, h: 0.36, fontSize: 22, bold: true, color: C.green, fontFace: 'Calibri' });

  dy += baH + 0.18;

  // Open invoice mini-list
  slide.addText('Open invoices applied (oldest first):', {
    x: rx + 0.22, y: dy, w: rw - 0.44, h: 0.22,
    fontSize: 8.5, color: C.gray, fontFace: 'Calibri',
  });
  dy += 0.26;

  const invLines = [
    { id: 'FM-2609', amt: '$28,400', due: 'Apr 2',  days: '42d overdue', c: C.orange },
    { id: 'FM-2621', amt: '$21,200', due: 'Apr 18', days: '26d overdue', c: C.amber },
    { id: 'FM-2634', amt: '$12,400', due: 'May 5',  days: '9d overdue',  c: C.amber },
  ];
  invLines.forEach(inv => {
    slide.addText(`${inv.id}  ${inv.amt}  ·  due ${inv.due}  ·  ${inv.days}`, {
      x: rx + 0.28, y: dy, w: rw - 0.56, h: 0.24,
      fontSize: 9, color: inv.c, fontFace: 'Calibri',
    });
    dy += 0.26;
  });
}

// ── Slide 6: After — Value Unlocked ─────────────────────────────────────────────
function slide6(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 6);
  footer(slide);

  const topY = sectionHeader(slide,
    'After the Problem Is Solved',
    'What becomes possible when AR runs itself',
    C.green
  );

  const startY = topY + 1.1;

  const outcomes = [
    {
      color: C.teal,
      title: 'Staff Reallocation',
      headline: '200+ hrs/yr',
      sub: 'freed from manual AR tasks',
      items: [
        'Collections team → client advisory',
        'Month-end close 3–5 days → same day',
        'CFO time → growth, not reconciliation',
        'AR aging review meeting: eliminated',
      ],
    },
    {
      color: C.green,
      title: 'Working Capital Release',
      headline: '$150k+',
      sub: 'freed per 10-day DSO reduction',
      items: [
        'Deploy cash 3 weeks earlier each cycle',
        'Reduce credit line draw-downs',
        'Improve quarterly cash flow projections',
        'Real-time forecast: 30/60/90d expected',
      ],
    },
    {
      color: C.amber,
      title: 'Advisory Intelligence',
      headline: 'GAAP-ready',
      sub: 'ASC 310 / ASC 606 reporting built in',
      items: [
        'ADA reserve rates by aging bucket',
        'Export-ready for audit package',
        'SOC 2 audit trail of every posting',
        'Monthly impact report auto-generated',
      ],
    },
    {
      color: C.blue,
      title: 'Client Relationships',
      headline: 'Proactive',
      sub: 'outreach replaces reactive chasing',
      items: [
        'Escalating email reminders via Outlook',
        'VIP exemption list for key accounts',
        'Slack daily AR digest for leadership',
        '90+ exposure surfaced before write-off',
      ],
    },
  ];

  const cw = (CW - 0.45) / 4;
  const ch = H - startY - 0.28 - 0.2;
  const gap = 0.15;

  outcomes.forEach((o, i) => {
    const x = M + i * (cw + gap);
    card(slide, x, startY, cw, ch, o.color);

    slide.addText(o.title.toUpperCase(), {
      x: x + 0.18, y: startY + 0.2, w: cw - 0.36, h: 0.22,
      fontSize: 7.5, bold: true, color: o.color, fontFace: 'Calibri', charSpacing: 1.5,
    });
    slide.addText(o.headline, {
      x: x + 0.18, y: startY + 0.46, w: cw - 0.36, h: 0.75,
      fontSize: 28, bold: true, color: o.color, fontFace: 'Calibri',
    });
    slide.addText(o.sub, {
      x: x + 0.18, y: startY + 1.22, w: cw - 0.36, h: 0.28,
      fontSize: 9, color: C.gray, fontFace: 'Calibri', italic: true,
    });
    slide.addShape('rect', {
      x: x + 0.18, y: startY + 1.54, w: cw - 0.36, h: 0.015,
      fill: { color: o.color },
    });

    o.items.forEach((item, j) => {
      slide.addText('• ' + item, {
        x: x + 0.18, y: startY + 1.7 + j * 0.42, w: cw - 0.36, h: 0.38,
        fontSize: 9.5, color: C.grayMid, fontFace: 'Calibri',
      });
    });
  });
}

// ── Slide 7: Next Steps / Onboarding ────────────────────────────────────────────
function slide7(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 7);
  footer(slide);

  const topY = sectionHeader(slide,
    'Next Steps',
    'From this meeting to your first deployed client — in under 30 days',
    C.gray
  );

  const startY = topY + 1.1;

  const steps = [
    {
      num: '1', color: C.teal,
      title: 'Select a Pilot Client (Week 1)',
      desc: 'Pick one professional services client where AR pain is highest — 8–20 staff, ERP already live. QuickBooks Online or NetSuite. No changes to their ERP or accounting workflows. We do a 2-week shadow run first.',
      tags: ['No ERP changes', 'Read-only API', '2-week parallel baseline'],
    },
    {
      num: '2', color: C.blue,
      title: 'Baseline Measurement (Weeks 1–2)',
      desc: 'Read-only connection established. LunarLogic runs in observation mode — tracks DSO, aging buckets, and cash application speed without touching any data. Baseline locked for ROI measurement.',
      tags: ['DSO measured daily', 'Aging buckets logged', 'Cash match rate benchmarked'],
    },
    {
      num: '3', color: C.green,
      title: 'Go Live — 30-Day Proof (Weeks 3–6)',
      desc: 'Automation activates. Daily AR summaries post to Slack. Payment reminders go out on schedule. Cash application matches at 87%+. Monthly impact report delivered. The DSO trend line bends down.',
      tags: ['Daily Slack digest', '87%+ auto-match', 'Monthly impact report'],
    },
    {
      num: '4', color: C.amber,
      title: 'Expand Across Portfolio',
      desc: 'With a documented 19–22 day DSO improvement and 200+ hrs/yr freed for the pilot client, you have an offer you can present to every client with an AR problem. White-label or referral paths available.',
      tags: ['20% recurring referral fee', '60-day satisfaction guarantee', '$2,500 impl. fee waived on annual'],
    },
  ];

  const stepH = (H - startY - 0.28 - 0.2) / 4 - 0.12;

  steps.forEach((s, i) => {
    const y = startY + i * (stepH + 0.12);
    slide.addShape('roundRect', {
      x: M, y, w: CW, h: stepH, rectRadius: 0.1,
      fill: { color: C.panel }, line: { color: s.color, width: 0.6 },
    });
    slide.addShape('rect', { x: M, y, w: 0.05, h: stepH, fill: { color: s.color } });

    slide.addText(s.num, {
      x: M + 0.2, y: y + (stepH - 0.75) / 2, w: 0.72, h: 0.75,
      fontSize: 38, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(s.title, {
      x: M + 1.05, y: y + 0.1, w: CW * 0.38, h: 0.3,
      fontSize: 12.5, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(s.desc, {
      x: M + 1.05, y: y + 0.42, w: CW * 0.38, h: stepH - 0.52,
      fontSize: 9.5, color: C.grayMid, fontFace: 'Calibri',
    });

    // Tags on the right
    s.tags.forEach((tag, j) => {
      const tx = M + CW * 0.56;
      const ty = y + 0.14 + j * 0.38;
      slide.addShape('roundRect', {
        x: tx, y: ty, w: CW * 0.38, h: 0.3, rectRadius: 0.06,
        fill: { color: C.panelAlt }, line: { color: s.color, width: 0.3 },
      });
      slide.addText('✓  ' + tag, {
        x: tx + 0.12, y: ty + 0.04, w: CW * 0.38 - 0.24, h: 0.24,
        fontSize: 9, color: s.color, fontFace: 'Calibri',
      });
    });
  });
}

// ── Slide 8: Closing ────────────────────────────────────────────────────────────
function slide8(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  footer(slide);

  // Gradient accent top
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.06, fill: { color: C.blue } });

  const cx = W / 2;

  logo(slide, cx - 1.1, 0.65);

  slide.addText('We earn your business every month through results.', {
    x: 1.0, y: 1.5, w: W - 2.0, h: 0.75,
    fontSize: 28, bold: true, color: C.white, fontFace: 'Calibri', align: 'center',
  });

  slide.addText('60-day satisfaction guarantee · Cancel any month', {
    x: 1.0, y: 2.32, w: W - 2.0, h: 0.35,
    fontSize: 14, color: C.teal, fontFace: 'Calibri', align: 'center',
  });

  slide.addShape('rect', { x: 2.5, y: 2.82, w: W - 5.0, h: 0.02, fill: { color: C.blue } });

  // Contact
  slide.addText('Jonathan Rodriguez', {
    x: 1.0, y: 3.1, w: W - 2.0, h: 0.45,
    fontSize: 20, bold: true, color: C.white, fontFace: 'Calibri', align: 'center',
  });
  slide.addText('Founder & CEO  ·  LunarLogic LLC', {
    x: 1.0, y: 3.58, w: W - 2.0, h: 0.32,
    fontSize: 13, color: C.gray, fontFace: 'Calibri', align: 'center',
  });
  slide.addText('jrodriguez@lunarlogic.ai', {
    x: 1.0, y: 3.96, w: W - 2.0, h: 0.32,
    fontSize: 13, color: C.teal, fontFace: 'Calibri', align: 'center',
  });

  slide.addShape('rect', { x: 2.5, y: 4.4, w: W - 5.0, h: 0.02, fill: { color: C.border } });

  // Three closing stats
  const sw = (CW - 0.4) / 3;
  const sx = M;
  const sy = 4.7;
  const sh = 1.78;
  const sGap = 0.2;
  const closingStats = [
    { v: '−22d', l: 'DSO improvement', s: 'Forvis Mazars pilot data', c: C.teal },
    { v: '87%',  l: 'auto-match rate', s: 'cash applied without human touch', c: C.green },
    { v: '$2,500', l: 'implementation', s: 'waived on 12-month commitment', c: C.amber },
  ];
  closingStats.forEach((s, i) => {
    const x = sx + i * (sw + sGap);
    card(slide, x, sy, sw, sh, s.c, { topBar: false });
    slide.addText(s.v, {
      x: x + 0.2, y: sy + 0.22, w: sw - 0.4, h: 0.75,
      fontSize: 34, bold: true, color: s.c, fontFace: 'Calibri', align: 'center',
    });
    slide.addText(s.l, {
      x: x + 0.2, y: sy + 0.98, w: sw - 0.4, h: 0.3,
      fontSize: 11, bold: true, color: C.offWhite, fontFace: 'Calibri', align: 'center',
    });
    slide.addText(s.s, {
      x: x + 0.2, y: sy + 1.32, w: sw - 0.4, h: 0.3,
      fontSize: 8.5, color: C.gray, fontFace: 'Calibri', align: 'center',
    });
  });
}

// ── Generate ───────────────────────────────────────────────────────────────────
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title = 'LunarLogic AR Automation — Forvis Mazars';
pptx.author = 'LunarLogic LLC';
pptx.subject = 'Solving Cash Application in Professional Services';

slide1(pptx);
slide2(pptx);
slide3(pptx);
slide4(pptx);
slide5(pptx);
slide6(pptx);
slide7(pptx);
slide8(pptx);

const buf = await pptx.write({ outputType: 'nodebuffer' });
writeFileSync('/home/user/lunarlogic-dashboard/LunarLogic_ForvisMazars_Deck.pptx', buf);
console.log('Done — 8 slides written.');
