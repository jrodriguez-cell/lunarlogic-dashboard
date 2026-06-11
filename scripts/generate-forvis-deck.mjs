import PptxGenJS from '/tmp/pptx-gen/node_modules/pptxgenjs/dist/pptxgen.cjs.js';
import { writeFileSync } from 'fs';

// ── Palette: navy + white + teal only. Red for pain, green for gain. ──────────
const C = {
  navy:    '080E1C',
  navyMid: '0C1526',
  panel:   '112236',
  teal:    '00D4E8',
  white:   'FFFFFF',
  offWhite:'E8F0FF',
  gray:    '6B7FA0',
  grayLt:  'A0B4CC',
  red:     'E84545',
  green:   '22C55E',
  border:  '1B3152',
};

const W = 13.33;
const H = 7.5;
const M = 0.55;
const CW = W - M * 2;
const TOTAL = 6;

// ── helpers ───────────────────────────────────────────────────────────────────

function bg(slide) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
}

function logo(slide, x, y, size = 18) {
  slide.addText([
    { text: 'Lunar', options: { color: C.teal,  bold: true } },
    { text: 'Logic', options: { color: C.white, bold: true } },
  ], { x, y, w: 2.4, h: 0.44, fontSize: size, fontFace: 'Calibri' });
}

function topBar(slide, n) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.56, fill: { color: C.navyMid } });
  slide.addShape('rect', { x: 0, y: 0.54, w: W, h: 0.03, fill: { color: C.teal } });
  logo(slide, M, 0.08, 16);
  slide.addText(`${n} / ${TOTAL}`, {
    x: W - M - 0.7, y: 0.14, w: 0.7, h: 0.28,
    fontSize: 9, color: C.gray, fontFace: 'Calibri', align: 'right',
  });
}

function footer(slide) {
  slide.addShape('rect', { x: 0, y: H - 0.26, w: W, h: 0.26, fill: { color: C.navyMid } });
  slide.addText('LunarLogic LLC  ·  Confidential  ·  jrodriguez@lunarlogic.ai  ·  Dashboard data is illustrative', {
    x: M, y: H - 0.26, w: CW, h: 0.26,
    fontSize: 7.5, color: C.gray, fontFace: 'Calibri', valign: 'middle', align: 'center',
  });
}

// Draw a process box and return its right edge x
function procBox(slide, x, y, w, h, label, sublabel, fillColor, textColor) {
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: fillColor || C.panel },
    line: { color: C.border, width: 0.6 },
  });
  if (label) slide.addText(label, {
    x: x + 0.1, y: y + (sublabel ? 0.08 : (h - 0.32) / 2), w: w - 0.2, h: sublabel ? 0.34 : 0.32,
    fontSize: sublabel ? 10.5 : 11, bold: true, color: textColor || C.white,
    fontFace: 'Calibri', align: 'center', valign: 'middle',
  });
  if (sublabel) slide.addText(sublabel, {
    x: x + 0.1, y: y + h - 0.36, w: w - 0.2, h: 0.3,
    fontSize: 8.5, color: C.grayLt, fontFace: 'Calibri', align: 'center',
  });
  return x + w;
}

// Draw arrow between two x positions at given y
function arrow(slide, x1, x2, y, color) {
  const mid = (x1 + x2) / 2;
  const len = x2 - x1;
  slide.addShape('rect', { x: x1, y: y - 0.018, w: len * 0.72, h: 0.036, fill: { color: color || C.border } });
  slide.addText('▶', {
    x: x1 + len * 0.68, y: y - 0.16, w: 0.3, h: 0.32,
    fontSize: 10, color: color || C.border, fontFace: 'Calibri', align: 'center',
  });
}

// Pain callout (red badge above a box)
function painBadge(slide, cx, y, label) {
  const bw = 1.55;
  const bh = 0.3;
  const bx = cx - bw / 2;
  slide.addShape('roundRect', {
    x: bx, y, w: bw, h: bh, rectRadius: 0.06,
    fill: { color: '2A0A0A' }, line: { color: C.red, width: 0.5 },
  });
  slide.addText('⚠  ' + label, {
    x: bx + 0.08, y: y + 0.03, w: bw - 0.16, h: bh - 0.06,
    fontSize: 8, color: C.red, fontFace: 'Calibri', align: 'center',
  });
}

// Win callout (green badge above a box)
function winBadge(slide, cx, y, label) {
  const bw = 1.55;
  const bh = 0.3;
  const bx = cx - bw / 2;
  slide.addShape('roundRect', {
    x: bx, y, w: bw, h: bh, rectRadius: 0.06,
    fill: { color: '0A1F12' }, line: { color: C.green, width: 0.5 },
  });
  slide.addText('✓  ' + label, {
    x: bx + 0.08, y: y + 0.03, w: bw - 0.16, h: bh - 0.06,
    fontSize: 8, color: C.green, fontFace: 'Calibri', align: 'center',
  });
}

// ── Slide 1: Cover ─────────────────────────────────────────────────────────────
function slide1(pptx) {
  const slide = pptx.addSlide();
  bg(slide);

  // Left accent bar
  slide.addShape('rect', { x: 0, y: 0, w: 0.06, h: H, fill: { color: C.teal } });

  logo(slide, 0.55, 0.55, 22);
  slide.addShape('rect', { x: 0.55, y: 1.12, w: 2.6, h: 0.03, fill: { color: C.teal } });

  slide.addText('Cash Application\nAutomation', {
    x: 0.55, y: 1.3, w: 6.2, h: 2.0,
    fontSize: 52, bold: true, color: C.white, fontFace: 'Calibri', lineSpacingMultiple: 1.05,
  });
  slide.addText('Eliminating manual reconciliation\nfor professional services firms', {
    x: 0.55, y: 3.38, w: 6.0, h: 0.9,
    fontSize: 17, color: C.teal, fontFace: 'Calibri',
  });

  slide.addShape('rect', { x: 0.55, y: 4.42, w: 6.0, h: 0.02, fill: { color: C.border } });

  slide.addText('PREPARED FOR', {
    x: 0.55, y: 4.58, w: 6.0, h: 0.24,
    fontSize: 8, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('Forvis Mazars', {
    x: 0.55, y: 4.86, w: 6.0, h: 0.52,
    fontSize: 24, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('Peter Sukits  ·  Accounting Advisory  ·  Chicago  ·  June 2026', {
    x: 0.55, y: 5.44, w: 6.0, h: 0.28,
    fontSize: 11, color: C.grayLt, fontFace: 'Calibri',
  });

  // Right: proof point box
  slide.addShape('roundRect', {
    x: 8.0, y: 1.8, w: 4.7, h: 3.6, rectRadius: 0.14,
    fill: { color: C.panel }, line: { color: C.teal, width: 0.8 },
  });
  slide.addShape('rect', { x: 8.0, y: 1.8, w: 4.7, h: 0.05, fill: { color: C.teal } });
  slide.addText('PROOF POINT', {
    x: 8.22, y: 2.0, w: 4.26, h: 0.24,
    fontSize: 8, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2,
  });
  slide.addText('84%', {
    x: 8.22, y: 2.3, w: 4.26, h: 0.95,
    fontSize: 64, bold: true, color: C.teal, fontFace: 'Calibri',
  });
  slide.addText('reduction in invoice processing time', {
    x: 8.22, y: 3.22, w: 4.26, h: 0.32,
    fontSize: 12, color: C.offWhite, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: 8.22, y: 3.62, w: 4.06, h: 0.015, fill: { color: C.border } });
  slide.addText('19-day DSO improvement', {
    x: 8.22, y: 3.74, w: 4.26, h: 0.32,
    fontSize: 14, bold: true, color: C.green, fontFace: 'Calibri',
  });
  slide.addText('Kaptain Clean LLC  ·  Anchor Client', {
    x: 8.22, y: 4.1, w: 4.26, h: 0.24,
    fontSize: 9.5, color: C.gray, fontFace: 'Calibri', italic: true,
  });
}

// ── Slide 2: The Problem (Manual Workflow) ─────────────────────────────────────
function slide2(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 2);
  footer(slide);

  const TY = 0.56 + 0.28;

  // Section label
  slide.addText('THE PROBLEM', {
    x: M, y: TY, w: CW, h: 0.24,
    fontSize: 8, bold: true, color: C.red, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('How cash application works today', {
    x: M, y: TY + 0.26, w: CW, h: 0.46,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri',
  });

  // ── Flow row 1: steps ──────────────────────────────────────────────────────
  const bY = TY + 0.84;
  const bH = 0.85;
  const bW = 1.72;
  const gap = 0.22;
  const steps = [
    { label: 'Bank\nStatement',  sub: 'downloaded daily' },
    { label: 'Open QB\nInvoice List', sub: 'exported manually' },
    { label: 'Manual\nMatching', sub: 'spreadsheet' },
    { label: 'Split\nBulk Wires', sub: 'judgment call' },
    { label: 'Post to\nLedger',  sub: 'data re-entry' },
    { label: 'Chase\nMismatches', sub: 'repeat cycle' },
  ];

  const totalW = steps.length * bW + (steps.length - 1) * gap;
  const startX = (W - totalW) / 2;

  steps.forEach((s, i) => {
    const x = startX + i * (bW + gap);
    const cx = x + bW / 2;

    // pain badge above steps 2-5 (the manual pain points)
    const pains = [null, null, '3–5 day close', 'No rule, no log', 'Re-keying errors', 'Cycle repeats'];
    if (pains[i]) painBadge(slide, cx, bY - 0.4, pains[i]);

    // highlight pain steps
    const isPain = i >= 2 && i <= 5;
    slide.addShape('roundRect', {
      x, y: bY, w: bW, h: bH, rectRadius: 0.09,
      fill: { color: isPain ? '1A0C0C' : C.panel },
      line: { color: isPain ? C.red : C.border, width: isPain ? 0.8 : 0.5 },
    });
    slide.addText(s.label, {
      x: x + 0.1, y: bY + 0.08, w: bW - 0.2, h: 0.46,
      fontSize: 10.5, bold: true, color: isPain ? C.red : C.grayLt,
      fontFace: 'Calibri', align: 'center',
    });
    slide.addText(s.sub, {
      x: x + 0.1, y: bY + 0.55, w: bW - 0.2, h: 0.24,
      fontSize: 8, color: isPain ? '#E84545' : C.gray,
      fontFace: 'Calibri', align: 'center',
    });

    if (i < steps.length - 1) {
      const ax = x + bW + 0.02;
      const ay = bY + bH / 2;
      slide.addShape('rect', { x: ax, y: ay - 0.016, w: gap * 0.65, h: 0.032, fill: { color: C.border } });
      slide.addText('▶', {
        x: ax + gap * 0.52, y: ay - 0.17, w: 0.24, h: 0.34,
        fontSize: 9, color: C.border, fontFace: 'Calibri', align: 'center',
      });
    }
  });

  // ── Impact callouts ────────────────────────────────────────────────────────
  const cY = bY + bH + 0.34;
  const cW = (CW - 0.45) / 3;
  const cH = 1.65;
  const impacts = [
    { icon: '⏱', headline: '3–5 Days', desc: 'to close monthly cash application cycle', color: C.red },
    { icon: '❓', headline: 'No Audit Trail', desc: 'Bulk payment splits undocumented — no rule, no record', color: C.red },
    { icon: '📉', headline: 'DSO Creep', desc: 'Cash sits unposted while revenue is already recognized', color: C.red },
  ];
  impacts.forEach((c, i) => {
    const x = M + i * (cW + 0.225);
    slide.addShape('roundRect', {
      x, y: cY, w: cW, h: cH, rectRadius: 0.1,
      fill: { color: '150808' }, line: { color: C.red, width: 0.5 },
    });
    slide.addText(c.icon, {
      x: x + 0.15, y: cY + 0.2, w: 0.5, h: 0.5,
      fontSize: 24, fontFace: 'Calibri',
    });
    slide.addText(c.headline, {
      x: x + 0.15, y: cY + 0.68, w: cW - 0.3, h: 0.38,
      fontSize: 16, bold: true, color: C.red, fontFace: 'Calibri',
    });
    slide.addText(c.desc, {
      x: x + 0.15, y: cY + 1.1, w: cW - 0.3, h: 0.5,
      fontSize: 9.5, color: C.grayLt, fontFace: 'Calibri',
    });
  });
}

// ── Slide 3: The Solution (Same Workflow, Fixed) ───────────────────────────────
function slide3(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 3);
  footer(slide);

  const TY = 0.56 + 0.28;

  slide.addText('THE SOLUTION', {
    x: M, y: TY, w: CW, h: 0.24,
    fontSize: 8, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('The same workflow — automated', {
    x: M, y: TY + 0.26, w: CW, h: 0.46,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri',
  });

  // ── Flow row ───────────────────────────────────────────────────────────────
  const bY = TY + 0.84;
  const bH = 0.85;
  const bW = 1.72;
  const gap = 0.22;

  const steps = [
    { label: 'Bank Feed\nWebhook',    sub: 'real-time',      win: null,             color: C.teal },
    { label: 'Open Invoice\nLookup',  sub: 'API-connected',  win: null,             color: C.teal },
    { label: 'AI Match\nEngine',      sub: '87%+ auto-apply', win: 'Seconds, not days', color: C.teal },
    { label: 'Smart\nSplit Rules',    sub: 'oldest-first default', win: 'Logged & auditable', color: C.teal },
    { label: 'Auto-Post\nto Ledger',  sub: 'no re-entry',    win: 'Zero keying errors', color: C.teal },
    { label: 'Live AR\nDashboard',    sub: 'always current', win: 'DSO bends down',  color: C.green },
  ];

  const totalW = steps.length * bW + (steps.length - 1) * gap;
  const startX = (W - totalW) / 2;

  steps.forEach((s, i) => {
    const x = startX + i * (bW + gap);
    const cx = x + bW / 2;

    if (s.win) winBadge(slide, cx, bY - 0.4, s.win);

    slide.addShape('roundRect', {
      x, y: bY, w: bW, h: bH, rectRadius: 0.09,
      fill: { color: i === steps.length - 1 ? '0A1F12' : '0A1B2A' },
      line: { color: s.color, width: 0.8 },
    });
    slide.addText(s.label, {
      x: x + 0.1, y: bY + 0.08, w: bW - 0.2, h: 0.46,
      fontSize: 10.5, bold: true, color: s.color, fontFace: 'Calibri', align: 'center',
    });
    slide.addText(s.sub, {
      x: x + 0.1, y: bY + 0.55, w: bW - 0.2, h: 0.24,
      fontSize: 8, color: C.grayLt, fontFace: 'Calibri', align: 'center',
    });

    if (i < steps.length - 1) {
      const ax = x + bW + 0.02;
      const ay = bY + bH / 2;
      slide.addShape('rect', { x: ax, y: ay - 0.016, w: gap * 0.65, h: 0.032, fill: { color: C.teal } });
      slide.addText('▶', {
        x: ax + gap * 0.52, y: ay - 0.17, w: 0.24, h: 0.34,
        fontSize: 9, color: C.teal, fontFace: 'Calibri', align: 'center',
      });
    }
  });

  // ── Exception path (below step 3) ─────────────────────────────────────────
  const ex3x = startX + 2 * (bW + gap) + bW / 2 - 1.1;
  const exY = bY + bH + 0.18;
  const exW = 2.2;
  const exH = 0.6;

  slide.addShape('rect', {
    x: startX + 2 * (bW + gap) + bW / 2 - 0.02, y: bY + bH,
    w: 0.04, h: 0.18, fill: { color: C.border },
  });
  slide.addShape('roundRect', {
    x: ex3x, y: exY, w: exW, h: exH, rectRadius: 0.08,
    fill: { color: C.panel }, line: { color: C.gray, width: 0.5 },
  });
  slide.addText('< 90% confidence → Slack 1-tap review', {
    x: ex3x + 0.14, y: exY + 0.13, w: exW - 0.28, h: 0.34,
    fontSize: 9, color: C.grayLt, fontFace: 'Calibri', align: 'center',
  });

  // ── Outcome strip ──────────────────────────────────────────────────────────
  const cY = exY + exH + 0.28;
  const cW = (CW - 0.6) / 4;
  const cH = H - cY - 0.26 - 0.22;
  const outcomes = [
    { v: '< 8 min', l: 'deposit to ledger',     c: C.teal  },
    { v: '87%+',    l: 'auto-matched',           c: C.teal  },
    { v: '−22d',    l: 'DSO improvement',        c: C.green },
    { v: '100%',    l: 'auditable decisions',    c: C.green },
  ];
  outcomes.forEach((o, i) => {
    const x = M + i * (cW + 0.2);
    slide.addShape('roundRect', {
      x, y: cY, w: cW, h: cH, rectRadius: 0.08,
      fill: { color: C.panel }, line: { color: o.c, width: 0.5 },
    });
    slide.addShape('rect', { x, y: cY, w: cW, h: 0.04, fill: { color: o.c } });
    slide.addText(o.v, {
      x: x + 0.12, y: cY + 0.16, w: cW - 0.24, h: 0.56,
      fontSize: 26, bold: true, color: o.c, fontFace: 'Calibri', align: 'center',
    });
    slide.addText(o.l, {
      x: x + 0.12, y: cY + 0.72, w: cW - 0.24, h: 0.3,
      fontSize: 9.5, color: C.grayLt, fontFace: 'Calibri', align: 'center',
    });
  });
  slide.addText('* Illustrative — based on typical deployment outcomes', {
    x: M, y: cY + cH + 0.04, w: CW, h: 0.18,
    fontSize: 7.5, color: C.gray, fontFace: 'Calibri', align: 'right', italic: true,
  });
}

// ── Slide 4: Side-by-side Before → After ──────────────────────────────────────
function slide4(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 4);
  footer(slide);

  const TY = 0.56 + 0.28;

  slide.addText('BEFORE vs AFTER', {
    x: M, y: TY, w: CW, h: 0.24,
    fontSize: 8, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('The same process, two different realities', {
    x: M, y: TY + 0.26, w: CW, h: 0.46,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri',
  });

  const colY = TY + 0.9;
  const colH = H - colY - 0.26 - 0.2;
  const colW = (CW - 0.3) / 2;

  // Before column
  slide.addShape('roundRect', {
    x: M, y: colY, w: colW, h: colH, rectRadius: 0.12,
    fill: { color: '100808' }, line: { color: C.red, width: 0.8 },
  });
  slide.addShape('rect', { x: M, y: colY, w: colW, h: 0.05, fill: { color: C.red } });
  slide.addText('WITHOUT LUNARLOGIC', {
    x: M + 0.24, y: colY + 0.16, w: colW - 0.48, h: 0.24,
    fontSize: 8, bold: true, color: C.red, fontFace: 'Calibri', charSpacing: 1.5,
  });

  const befores = [
    ['Bank statement arrives', 'Staff downloads, opens spreadsheet'],
    ['Manual invoice matching', '3–5 hours per close cycle'],
    ['Bulk wire arrives ($218k)', 'Who decides how to split it?'],
    ['Entry posted to QB', 'Risk of mismatch or double-post'],
    ['Mismatches discovered later', 'Cycle repeats — close delayed'],
  ];

  befores.forEach(([title, sub], i) => {
    const iy = colY + 0.54 + i * 0.82;
    slide.addShape('roundRect', {
      x: M + 0.2, y: iy, w: colW - 0.4, h: 0.68, rectRadius: 0.07,
      fill: { color: '1A0C0C' }, line: { color: '3A1010', width: 0.4 },
    });
    slide.addText(title, {
      x: M + 0.34, y: iy + 0.06, w: colW - 0.68, h: 0.28,
      fontSize: 10.5, bold: true, color: C.offWhite, fontFace: 'Calibri',
    });
    slide.addText(sub, {
      x: M + 0.34, y: iy + 0.36, w: colW - 0.68, h: 0.24,
      fontSize: 9, color: C.red, fontFace: 'Calibri', italic: true,
    });
    if (i < befores.length - 1) {
      slide.addText('↓', {
        x: M + colW / 2 - 0.12, y: iy + 0.68, w: 0.24, h: 0.14,
        fontSize: 10, color: C.border, fontFace: 'Calibri', align: 'center',
      });
    }
  });

  // After column
  const ax = M + colW + 0.3;
  slide.addShape('roundRect', {
    x: ax, y: colY, w: colW, h: colH, rectRadius: 0.12,
    fill: { color: '08130D' }, line: { color: C.green, width: 0.8 },
  });
  slide.addShape('rect', { x: ax, y: colY, w: colW, h: 0.05, fill: { color: C.green } });
  slide.addText('WITH LUNARLOGIC', {
    x: ax + 0.24, y: colY + 0.16, w: colW - 0.48, h: 0.24,
    fontSize: 8, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 1.5,
  });

  const afters = [
    ['Plaid webhook fires instantly', 'No download — automatic ingestion'],
    ['AI matches invoices', 'Seconds, not hours — 87%+ confidence'],
    ['Bulk wire split by rule', 'Oldest-first, logged with audit trail'],
    ['Auto-posted to QB', 'Zero re-entry, zero mismatch risk'],
    ['Live dashboard updates', 'DSO bends down. Cycle closed same day.'],
  ];

  afters.forEach(([title, sub], i) => {
    const iy = colY + 0.54 + i * 0.82;
    slide.addShape('roundRect', {
      x: ax + 0.2, y: iy, w: colW - 0.4, h: 0.68, rectRadius: 0.07,
      fill: { color: '0A1A0F' }, line: { color: '0F3018', width: 0.4 },
    });
    slide.addText(title, {
      x: ax + 0.34, y: iy + 0.06, w: colW - 0.68, h: 0.28,
      fontSize: 10.5, bold: true, color: C.offWhite, fontFace: 'Calibri',
    });
    slide.addText(sub, {
      x: ax + 0.34, y: iy + 0.36, w: colW - 0.68, h: 0.24,
      fontSize: 9, color: C.green, fontFace: 'Calibri', italic: true,
    });
    if (i < afters.length - 1) {
      slide.addText('↓', {
        x: ax + colW / 2 - 0.12, y: iy + 0.68, w: 0.24, h: 0.14,
        fontSize: 10, color: C.teal, fontFace: 'Calibri', align: 'center',
      });
    }
  });
}

// ── Slide 5: The Dashboard ──────────────────────────────────────────────────────
function slide5(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 5);
  footer(slide);

  const TY = 0.56 + 0.28;

  slide.addText('THE DASHBOARD', {
    x: M, y: TY, w: CW, h: 0.24,
    fontSize: 8, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('Your AR — live, in one screen', {
    x: M, y: TY + 0.26, w: 7.0, h: 0.46,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri',
  });

  // 2×2 feature grid
  const startY = TY + 0.9;
  const panW = (CW - 0.25) / 2;
  const panH = (H - startY - 0.26 - 0.2) / 2 - 0.12;
  const gapX = 0.25;
  const gapY = 0.22;

  const panels = [
    {
      title: 'DSO Trend',
      tag: 'OVERVIEW',
      color: C.teal,
      desc: 'Rolling chart of days-sales-outstanding. A vertical line marks activation date — the moment the trend begins to fall.',
      visual: [ // mini chart bars, rough sparkline
        { h: 0.55, c: C.teal },
        { h: 0.45, c: C.teal },
        { h: 0.58, c: C.teal },
        { h: 0.38, c: C.teal },
        { h: 0.28, c: C.green },
        { h: 0.22, c: C.green },
        { h: 0.18, c: C.green },
      ],
    },
    {
      title: 'AR Aging by Customer',
      tag: 'OVERVIEW',
      color: C.teal,
      desc: 'Aging buckets (Current → 90+d) with a sortable customer table showing risk tier and outstanding balance. Click any row to drill to invoices.',
      visual: [
        { h: 0.58, c: C.teal },
        { h: 0.4,  c: '22C55E' },
        { h: 0.28, c: C.amber || 'F59E0B' },
        { h: 0.18, c: 'F97316' },
        { h: 0.12, c: C.red },
      ],
    },
    {
      title: 'Cash Application Queue',
      tag: 'CASH APPLICATION',
      color: C.teal,
      desc: 'Every incoming payment with confidence score and match status. Click any row to see customer running balance — before and after application.',
      visual: null,
      rows: [
        { label: 'Wire  $218k', badge: '94%', c: C.green },
        { label: 'ACH   $62k',  badge: '88%', c: C.green },
        { label: 'Check $14k',  badge: '71%', c: 'F59E0B' },
      ],
    },
    {
      title: 'Cash Flow Forecast',
      tag: 'CASH APPLICATION',
      color: C.teal,
      desc: 'Weekly expected receipts, color-coded by collection risk. Expected date adjusted for each customer\'s actual payment history. 30/60/90d horizon toggle.',
      visual: [
        { h: 0.35, c: C.green },
        { h: 0.52, c: C.teal },
        { h: 0.28, c: C.green },
        { h: 0.44, c: 'F59E0B' },
        { h: 0.2,  c: C.green },
        { h: 0.38, c: C.red },
        { h: 0.3,  c: C.green },
      ],
    },
  ];

  panels.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (panW + gapX);
    const y = startY + row * (panH + gapY);

    slide.addShape('roundRect', {
      x, y, w: panW, h: panH, rectRadius: 0.1,
      fill: { color: C.panel }, line: { color: C.border, width: 0.6 },
    });
    slide.addShape('rect', { x, y, w: panW, h: 0.04, fill: { color: p.color } });

    // Tag + title
    slide.addText(p.tag, {
      x: x + 0.18, y: y + 0.14, w: panW * 0.5, h: 0.2,
      fontSize: 7.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 1.5,
    });
    slide.addText(p.title, {
      x: x + 0.18, y: y + 0.35, w: panW - 0.36, h: 0.32,
      fontSize: 13, bold: true, color: p.color, fontFace: 'Calibri',
    });
    slide.addText(p.desc, {
      x: x + 0.18, y: y + 0.7, w: panW * 0.52, h: panH - 0.86,
      fontSize: 9.5, color: C.grayLt, fontFace: 'Calibri',
    });

    // Mini visual: bars or row list
    const vx = x + panW * 0.58;
    const vy = y + 0.16;
    const vw = panW * 0.36;
    const vh = panH - 0.26;

    if (p.visual) {
      // bar sparkline
      const barW = vw / p.visual.length - 0.05;
      const baseY = vy + vh - 0.06;
      p.visual.forEach((bar, j) => {
        slide.addShape('roundRect', {
          x: vx + j * (barW + 0.06), y: baseY - bar.h,
          w: barW, h: bar.h, rectRadius: 0.04,
          fill: { color: bar.c }, line: { color: C.panel, width: 0 },
        });
      });
    } else if (p.rows) {
      p.rows.forEach((r, j) => {
        const ry = vy + j * 0.46;
        slide.addShape('roundRect', {
          x: vx, y: ry, w: vw, h: 0.38, rectRadius: 0.06,
          fill: { color: C.navyMid }, line: { color: r.c, width: 0.4 },
        });
        slide.addText(r.label, {
          x: vx + 0.1, y: ry + 0.06, w: vw * 0.55, h: 0.26,
          fontSize: 8.5, color: C.offWhite, fontFace: 'Calibri',
        });
        slide.addShape('roundRect', {
          x: vx + vw * 0.65, y: ry + 0.06, w: vw * 0.28, h: 0.26, rectRadius: 0.04,
          fill: { color: '0A2010' }, line: { color: r.c, width: 0.4 },
        });
        slide.addText(r.badge, {
          x: vx + vw * 0.65, y: ry + 0.06, w: vw * 0.28, h: 0.26,
          fontSize: 8.5, bold: true, color: r.c, fontFace: 'Calibri', align: 'center',
        });
      });
    }
  });
}

// ── Slide 6: Next Steps ─────────────────────────────────────────────────────────
function slide6(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 6);
  footer(slide);

  const TY = 0.56 + 0.28;

  slide.addText('NEXT STEPS', {
    x: M, y: TY, w: CW, h: 0.24,
    fontSize: 8, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('Live in 30 days. No ERP changes. 60-day guarantee.', {
    x: M, y: TY + 0.26, w: CW, h: 0.46,
    fontSize: 24, bold: true, color: C.white, fontFace: 'Calibri',
  });

  const startY = TY + 0.9;
  const stepH = (H - startY - 0.26 - 0.22) / 3 - 0.14;

  const steps = [
    {
      n: '1', color: C.teal,
      title: 'Read-Only Connection',
      desc: 'We connect to your ERP via read-only API. No changes to existing workflows. 2-week observation run — we measure baseline DSO, aging, and match rate.',
      duration: 'Week 1–2',
    },
    {
      n: '2', color: C.teal,
      title: 'Go Live',
      desc: 'Automation activates. Payments match and post automatically. Exceptions surface to Slack for 1-tap review. Dashboard goes live.',
      duration: 'Week 3',
    },
    {
      n: '3', color: C.green,
      title: '30-Day Impact Report',
      desc: 'We deliver a documented before/after: DSO delta, hours saved, match rate, close cycle time. The numbers speak for themselves.',
      duration: 'Day 30',
    },
  ];

  steps.forEach((s, i) => {
    const y = startY + i * (stepH + 0.14);

    slide.addShape('roundRect', {
      x: M, y, w: CW, h: stepH, rectRadius: 0.1,
      fill: { color: C.panel }, line: { color: s.color, width: 0.6 },
    });
    slide.addShape('rect', { x: M, y, w: 0.05, h: stepH, fill: { color: s.color } });

    // Step number
    slide.addText(s.n, {
      x: M + 0.2, y: y + (stepH - 0.72) / 2, w: 0.7, h: 0.72,
      fontSize: 40, bold: true, color: s.color, fontFace: 'Calibri',
    });

    // Duration badge
    slide.addShape('roundRect', {
      x: M + 1.06, y: y + 0.12, w: 0.95, h: 0.28, rectRadius: 0.06,
      fill: { color: C.navyMid }, line: { color: s.color, width: 0.4 },
    });
    slide.addText(s.duration, {
      x: M + 1.06, y: y + 0.12, w: 0.95, h: 0.28,
      fontSize: 8, bold: true, color: s.color, fontFace: 'Calibri', align: 'center', valign: 'middle',
    });

    slide.addText(s.title, {
      x: M + 1.06, y: y + 0.46, w: CW * 0.38, h: 0.32,
      fontSize: 13, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(s.desc, {
      x: M + 1.06, y: y + 0.8, w: CW * 0.44, h: stepH - 0.92,
      fontSize: 10, color: C.grayLt, fontFace: 'Calibri',
    });

    // Right: callout
    const tags = [
      ['$697/mo', 'Essentials — 150 invoices'],
      ['60-day', 'Satisfaction guarantee'],
      ['$2,500', 'Impl. fee waived on annual'],
    ];
    const t = tags[i];
    const tx = M + CW * 0.58;
    const tw = CW * 0.38;
    slide.addShape('roundRect', {
      x: tx, y: y + (stepH - 0.68) / 2, w: tw, h: 0.68, rectRadius: 0.08,
      fill: { color: C.navyMid }, line: { color: C.border, width: 0.5 },
    });
    slide.addText(t[0], {
      x: tx + 0.18, y: y + (stepH - 0.68) / 2 + 0.06, w: tw - 0.36, h: 0.32,
      fontSize: 20, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(t[1], {
      x: tx + 0.18, y: y + (stepH - 0.68) / 2 + 0.38, w: tw - 0.36, h: 0.24,
      fontSize: 9.5, color: C.gray, fontFace: 'Calibri',
    });
  });

  // Bottom CTA
  slide.addText('"We earn your business every month through results."  —  Jonathan Rodriguez  ·  jrodriguez@lunarlogic.ai', {
    x: M, y: H - 0.26 - 0.34, w: CW, h: 0.28,
    fontSize: 9.5, italic: true, color: C.gray, fontFace: 'Calibri', align: 'center',
  });
}

// ── Generate ───────────────────────────────────────────────────────────────────
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title = 'LunarLogic — Cash Application Automation for Forvis Mazars';
pptx.author = 'LunarLogic LLC';

slide1(pptx);
slide2(pptx);
slide3(pptx);
slide4(pptx);
slide5(pptx);
slide6(pptx);

const buf = await pptx.write({ outputType: 'nodebuffer' });
writeFileSync('/home/user/lunarlogic-dashboard/LunarLogic_ForvisMazars_Deck.pptx', buf);
console.log('Done — 6 slides.');
