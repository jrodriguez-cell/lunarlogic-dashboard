import PptxGenJS from '/tmp/pptx-gen/node_modules/pptxgenjs/dist/pptxgen.cjs.js';
import { writeFileSync } from 'fs';

const C = {
  navy:    '080E1C',
  navyMid: '0C1526',
  panel:   '112236',
  panelB:  '0A1A2E',
  teal:    '00D4E8',
  white:   'FFFFFF',
  offWhite:'E8F0FF',
  gray:    '6B7FA0',
  grayLt:  'A0B4CC',
  red:     'E84545',
  green:   '22C55E',
  border:  '1B3152',
};

const W      = 13.33;
const H      = 7.5;
const M      = 0.55;
const CW     = W - M * 2;
const BAR_H  = 0.58;   // top bar height
const FOOT_H = 0.28;   // footer height
const CONTENT_TOP = BAR_H + 0.32;
const CONTENT_BOT = H - FOOT_H - 0.16;
const CONTENT_H   = CONTENT_BOT - CONTENT_TOP;
const TOTAL  = 6;

function bg(s) {
  s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
}

function logo(s, x, y, size = 16) {
  s.addText([
    { text: 'Lunar', options: { color: C.teal,  bold: true } },
    { text: 'Logic', options: { color: C.white, bold: true } },
  ], { x, y, w: 2.4, h: 0.4, fontSize: size, fontFace: 'Calibri' });
}

function topBar(s, n) {
  s.addShape('rect', { x: 0, y: 0, w: W, h: BAR_H, fill: { color: C.navyMid } });
  s.addShape('rect', { x: 0, y: BAR_H - 0.03, w: W, h: 0.03, fill: { color: C.teal } });
  logo(s, M, 0.1);
  s.addText(`${n} / ${TOTAL}`, {
    x: W - M - 0.7, y: 0.15, w: 0.7, h: 0.28,
    fontSize: 9, color: C.gray, fontFace: 'Calibri', align: 'right',
  });
}

function footer(s) {
  s.addShape('rect', { x: 0, y: H - FOOT_H, w: W, h: FOOT_H, fill: { color: C.navyMid } });
  s.addText('LunarLogic LLC  ·  Confidential  ·  jrodriguez@lunarlogic.ai  ·  All metrics are illustrative', {
    x: M, y: H - FOOT_H, w: CW, h: FOOT_H,
    fontSize: 7.5, color: C.gray, fontFace: 'Calibri', valign: 'middle', align: 'center',
  });
}

function painBadge(s, cx, y, label) {
  const bw = 1.6, bh = 0.32, bx = cx - bw / 2;
  s.addShape('roundRect', { x: bx, y, w: bw, h: bh, rectRadius: 0.06,
    fill: { color: '2A0808' }, line: { color: C.red, width: 0.6 } });
  s.addText(label, { x: bx + 0.1, y: y + 0.05, w: bw - 0.2, h: bh - 0.1,
    fontSize: 8.5, bold: true, color: C.red, fontFace: 'Calibri', align: 'center' });
}

function winBadge(s, cx, y, label) {
  const bw = 1.6, bh = 0.32, bx = cx - bw / 2;
  s.addShape('roundRect', { x: bx, y, w: bw, h: bh, rectRadius: 0.06,
    fill: { color: '091A0F' }, line: { color: C.green, width: 0.6 } });
  s.addText(label, { x: bx + 0.1, y: y + 0.05, w: bw - 0.2, h: bh - 0.1,
    fontSize: 8.5, bold: true, color: C.green, fontFace: 'Calibri', align: 'center' });
}

// ── Slide 1: Cover ─────────────────────────────────────────────────────────────
function slide1(pptx) {
  const slide = pptx.addSlide();
  bg(slide);

  slide.addShape('rect', { x: 0, y: 0, w: 0.07, h: H, fill: { color: C.teal } });

  logo(slide, 0.58, 0.52, 22);
  slide.addShape('rect', { x: 0.58, y: 1.1, w: 2.8, h: 0.04, fill: { color: C.teal } });

  slide.addText('Cash Application\nAutomation', {
    x: 0.58, y: 1.26, w: 6.5, h: 2.2,
    fontSize: 54, bold: true, color: C.white, fontFace: 'Calibri', lineSpacingMultiple: 1.0,
  });
  slide.addText('Eliminating the manual reconciliation cycle\nfor professional services firms', {
    x: 0.58, y: 3.52, w: 6.2, h: 0.85,
    fontSize: 16, color: C.teal, fontFace: 'Calibri',
  });

  slide.addShape('rect', { x: 0.58, y: 4.52, w: 5.8, h: 0.025, fill: { color: C.border } });

  slide.addText('PREPARED FOR', {
    x: 0.58, y: 4.68, w: 5.8, h: 0.24,
    fontSize: 8, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('Forvis Mazars', {
    x: 0.58, y: 4.96, w: 5.8, h: 0.58,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('Peter Sukits  ·  Accounting Advisory  ·  Chicago  ·  June 2026', {
    x: 0.58, y: 5.6, w: 5.8, h: 0.3,
    fontSize: 11, color: C.grayLt, fontFace: 'Calibri',
  });

  // Right proof-point card
  slide.addShape('roundRect', {
    x: 7.8, y: 1.5, w: 5.0, h: 5.0, rectRadius: 0.14,
    fill: { color: C.panel }, line: { color: C.teal, width: 0.9 },
  });
  slide.addShape('rect', { x: 7.8, y: 1.5, w: 5.0, h: 0.06, fill: { color: C.teal } });

  slide.addText('CLIENT PROOF POINT', {
    x: 8.05, y: 1.7, w: 4.5, h: 0.26,
    fontSize: 8.5, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2,
  });
  slide.addText('84%', {
    x: 8.05, y: 2.02, w: 4.5, h: 1.1,
    fontSize: 80, bold: true, color: C.teal, fontFace: 'Calibri',
  });
  slide.addText('reduction in invoice\nprocessing time', {
    x: 8.05, y: 3.12, w: 4.5, h: 0.7,
    fontSize: 15, color: C.offWhite, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: 8.05, y: 3.9, w: 4.3, h: 0.02, fill: { color: C.border } });
  slide.addText('19-day DSO improvement', {
    x: 8.05, y: 4.0, w: 4.5, h: 0.4,
    fontSize: 17, bold: true, color: C.green, fontFace: 'Calibri',
  });
  slide.addText('achieved in under 90 days', {
    x: 8.05, y: 4.42, w: 4.5, h: 0.28,
    fontSize: 11, color: C.gray, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: 8.05, y: 4.78, w: 4.3, h: 0.02, fill: { color: C.border } });
  slide.addText('Kaptain Clean LLC  ·  Anchor Client', {
    x: 8.05, y: 4.88, w: 4.5, h: 0.3,
    fontSize: 10, color: C.gray, fontFace: 'Calibri', italic: true,
  });
}

// ── Slide 2: The Problem ────────────────────────────────────────────────────────
// Layout: section label + title (top), 6-step flow row (middle), 3 impact cards (bottom)
function slide2(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 2);
  footer(slide);

  // ── Header ─────────────────────────────────────────────────────────────────
  const hY = CONTENT_TOP;
  slide.addText('THE PROBLEM', {
    x: M, y: hY, w: CW, h: 0.26,
    fontSize: 8.5, bold: true, color: C.red, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('How cash application works today', {
    x: M, y: hY + 0.28, w: CW, h: 0.5,
    fontSize: 28, bold: true, color: C.white, fontFace: 'Calibri',
  });

  // ── Flow diagram ───────────────────────────────────────────────────────────
  // Badge row + flow box row together occupy the middle band
  const BADGE_H  = 0.36;
  const BADGE_GAP = 0.1;
  const FLOW_H   = 1.18;
  const CARD_H   = 1.8;
  const GAPS_V   = 0.26; // gap between flow and cards

  // Vertical positions, measured from CONTENT_TOP
  const titleH = 0.28 + 0.5; // label + title
  const remainH = CONTENT_H - titleH;
  // distribute: badge+flow, gap, cards
  const totalNeeded = BADGE_H + BADGE_GAP + FLOW_H + GAPS_V + CARD_H;
  const topPad = (remainH - totalNeeded) / 2;

  const badgeY = CONTENT_TOP + titleH + topPad;
  const flowY  = badgeY + BADGE_H + BADGE_GAP;
  const cardY  = flowY + FLOW_H + GAPS_V;

  // 6-step flow
  const bW  = (CW - 5 * 0.18) / 6;   // 5 gaps between 6 boxes
  const gap = 0.18;

  const steps = [
    { label: 'Bank\nStatement',     sub: 'downloaded daily',     pain: null },
    { label: 'Open Invoice\nList',  sub: 'exported from ERP',    pain: null },
    { label: 'Manual\nMatching',    sub: 'spreadsheet work',     pain: '3–5 day close' },
    { label: 'Split\nBulk Wires',   sub: 'judgment call',        pain: 'No rule, no log' },
    { label: 'Post to\nLedger',     sub: 'manual data re-entry', pain: 'Re-keying errors' },
    { label: 'Chase\nMismatches',   sub: 'cycle repeats',        pain: 'Cycle repeats' },
  ];

  steps.forEach((s, i) => {
    const x  = M + i * (bW + gap);
    const cx = x + bW / 2;
    const isPain = i >= 2;

    if (s.pain) painBadge(slide, cx, badgeY, s.pain);

    slide.addShape('roundRect', {
      x, y: flowY, w: bW, h: FLOW_H, rectRadius: 0.1,
      fill: { color: isPain ? '1C0909' : C.panel },
      line: { color: isPain ? C.red : C.border, width: isPain ? 0.9 : 0.5 },
    });
    slide.addText(s.label, {
      x: x + 0.1, y: flowY + 0.16, w: bW - 0.2, h: 0.56,
      fontSize: 11.5, bold: true,
      color: isPain ? C.red : C.grayLt,
      fontFace: 'Calibri', align: 'center',
    });
    slide.addText(s.sub, {
      x: x + 0.1, y: flowY + FLOW_H - 0.36, w: bW - 0.2, h: 0.28,
      fontSize: 9, color: isPain ? C.red : C.gray,
      fontFace: 'Calibri', align: 'center',
    });

    if (i < steps.length - 1) {
      const ax = x + bW + 0.01;
      const ay = flowY + FLOW_H / 2;
      slide.addShape('rect', { x: ax, y: ay - 0.018, w: gap * 0.62, h: 0.036, fill: { color: C.border } });
      slide.addText('▶', { x: ax + gap * 0.48, y: ay - 0.18, w: 0.26, h: 0.36,
        fontSize: 10, color: C.border, fontFace: 'Calibri', align: 'center' });
    }
  });

  // ── Impact cards ───────────────────────────────────────────────────────────
  const ncards = 3;
  const cW = (CW - (ncards - 1) * 0.26) / ncards;
  const impacts = [
    {
      headline: '3–5 Day Close',
      desc: 'Every month, staff spend the first week manually reconciling bank deposits against open invoices. That time generates no revenue and introduces error at every step.',
      color: C.red,
    },
    {
      headline: 'No Audit Trail',
      desc: 'When a bulk wire arrives covering multiple invoices, the split decision lives in someone\'s head or a spreadsheet note. There is no documented rule, no log, and no defensible record.',
      color: C.red,
    },
    {
      headline: 'DSO Creep',
      desc: 'Unposted cash inflates days-sales-outstanding artificially. Revenue is already recognized, but the balance sheet shows AR that has effectively been collected — delaying working capital deployment.',
      color: C.red,
    },
  ];
  impacts.forEach((c, i) => {
    const x = M + i * (cW + 0.26);
    slide.addShape('roundRect', {
      x, y: cardY, w: cW, h: CARD_H, rectRadius: 0.1,
      fill: { color: '150808' }, line: { color: C.red, width: 0.6 },
    });
    slide.addShape('rect', { x, y: cardY, w: cW, h: 0.05, fill: { color: C.red } });
    slide.addText(c.headline, {
      x: x + 0.22, y: cardY + 0.18, w: cW - 0.44, h: 0.42,
      fontSize: 18, bold: true, color: C.red, fontFace: 'Calibri',
    });
    slide.addText(c.desc, {
      x: x + 0.22, y: cardY + 0.65, w: cW - 0.44, h: CARD_H - 0.8,
      fontSize: 10.5, color: C.grayLt, fontFace: 'Calibri',
    });
  });
}

// ── Slide 3: The Solution ───────────────────────────────────────────────────────
function slide3(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 3);
  footer(slide);

  const hY = CONTENT_TOP;
  slide.addText('THE SOLUTION', {
    x: M, y: hY, w: CW, h: 0.26,
    fontSize: 8.5, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('The same workflow — automated', {
    x: M, y: hY + 0.28, w: CW, h: 0.5,
    fontSize: 28, bold: true, color: C.white, fontFace: 'Calibri',
  });

  const BADGE_H  = 0.36;
  const BADGE_GAP = 0.1;
  const FLOW_H   = 1.18;
  const EX_H     = 0.7;
  const EX_GAP   = 0.2;
  const STAT_H   = 1.7;
  const GAPS_V   = 0.24;

  const titleH = 0.28 + 0.5;
  const remainH = CONTENT_H - titleH;
  const totalNeeded = BADGE_H + BADGE_GAP + FLOW_H + EX_GAP + EX_H + GAPS_V + STAT_H;
  const topPad = (remainH - totalNeeded) / 2;

  const badgeY = CONTENT_TOP + titleH + topPad;
  const flowY  = badgeY + BADGE_H + BADGE_GAP;
  const exY    = flowY + FLOW_H + EX_GAP;
  const statY  = exY + EX_H + GAPS_V;

  const bW  = (CW - 5 * 0.18) / 6;
  const gap = 0.18;

  const steps = [
    { label: 'Bank Feed\nWebhook',      sub: 'real-time ingestion',    win: null },
    { label: 'Open Invoice\nLookup',    sub: 'ERP-connected via API',  win: null },
    { label: 'AI Match\nEngine',        sub: '87%+ auto-apply',        win: 'Seconds, not days' },
    { label: 'Smart\nSplit Rules',      sub: 'oldest-first default',   win: 'Logged, auditable' },
    { label: 'Auto-Post\nto Ledger',    sub: 'no re-entry required',   win: 'Zero keying errors' },
    { label: 'Live AR\nDashboard',      sub: 'always current',         win: 'DSO bends down' },
  ];

  steps.forEach((s, i) => {
    const x  = M + i * (bW + gap);
    const cx = x + bW / 2;
    const isWin = i >= 2;

    if (s.win) winBadge(slide, cx, badgeY, s.win);

    slide.addShape('roundRect', {
      x, y: flowY, w: bW, h: FLOW_H, rectRadius: 0.1,
      fill: { color: i === 5 ? '091E10' : '091828' },
      line: { color: i === 5 ? C.green : C.teal, width: 0.9 },
    });
    slide.addText(s.label, {
      x: x + 0.1, y: flowY + 0.16, w: bW - 0.2, h: 0.56,
      fontSize: 11.5, bold: true,
      color: i === 5 ? C.green : C.teal,
      fontFace: 'Calibri', align: 'center',
    });
    slide.addText(s.sub, {
      x: x + 0.1, y: flowY + FLOW_H - 0.36, w: bW - 0.2, h: 0.28,
      fontSize: 9, color: C.grayLt, fontFace: 'Calibri', align: 'center',
    });

    if (i < steps.length - 1) {
      const ax = x + bW + 0.01;
      const ay = flowY + FLOW_H / 2;
      slide.addShape('rect', { x: ax, y: ay - 0.018, w: gap * 0.62, h: 0.036, fill: { color: C.teal } });
      slide.addText('▶', { x: ax + gap * 0.48, y: ay - 0.18, w: 0.26, h: 0.36,
        fontSize: 10, color: C.teal, fontFace: 'Calibri', align: 'center' });
    }
  });

  // Exception path drop below step 3 (AI Match Engine)
  const ex3x = M + 2 * (bW + gap);
  const exCx = ex3x + bW / 2;
  const exW  = bW * 2.1;
  const exX  = exCx - exW / 2;

  slide.addShape('rect', {
    x: exCx - 0.02, y: flowY + FLOW_H,
    w: 0.04, h: EX_GAP * 0.55, fill: { color: C.border },
  });
  slide.addShape('roundRect', {
    x: exX, y: exY, w: exW, h: EX_H, rectRadius: 0.09,
    fill: { color: C.panel }, line: { color: C.gray, width: 0.5 },
  });
  slide.addText('Confidence < 90%', {
    x: exX + 0.18, y: exY + 0.06, w: exW - 0.36, h: 0.26,
    fontSize: 9.5, bold: true, color: C.grayLt, fontFace: 'Calibri',
  });
  slide.addText('Slack prompt surfaces the suggested match for 1-tap human approval — decision logged with reviewer name and timestamp', {
    x: exX + 0.18, y: exY + 0.34, w: exW - 0.36, h: 0.3,
    fontSize: 9, color: C.gray, fontFace: 'Calibri',
  });

  // Stat strip
  const nstats = 4;
  const sW = (CW - (nstats - 1) * 0.22) / nstats;
  const stats = [
    { v: '< 8 min',  l: 'deposit to ledger',   sub: 'from bank receipt to ERP posting',         c: C.teal  },
    { v: '87%+',     l: 'auto-matched',         sub: 'no human touch required',                  c: C.teal  },
    { v: '−22d',     l: 'DSO improvement',      sub: 'typical outcome at go-live',               c: C.green },
    { v: '100%',     l: 'auditable',            sub: 'every decision logged with rule + score',  c: C.green },
  ];
  stats.forEach((s, i) => {
    const x = M + i * (sW + 0.22);
    slide.addShape('roundRect', {
      x, y: statY, w: sW, h: STAT_H, rectRadius: 0.1,
      fill: { color: C.panel }, line: { color: s.c, width: 0.6 },
    });
    slide.addShape('rect', { x, y: statY, w: sW, h: 0.05, fill: { color: s.c } });
    slide.addText(s.v, {
      x: x + 0.2, y: statY + 0.2, w: sW - 0.4, h: 0.72,
      fontSize: 34, bold: true, color: s.c, fontFace: 'Calibri', align: 'center',
    });
    slide.addText(s.l, {
      x: x + 0.2, y: statY + 0.94, w: sW - 0.4, h: 0.3,
      fontSize: 12, bold: true, color: C.offWhite, fontFace: 'Calibri', align: 'center',
    });
    slide.addText(s.sub, {
      x: x + 0.2, y: statY + 1.26, w: sW - 0.4, h: 0.36,
      fontSize: 9, color: C.gray, fontFace: 'Calibri', align: 'center',
    });
  });
}

// ── Slide 4: Before vs After ────────────────────────────────────────────────────
function slide4(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 4);
  footer(slide);

  const hY = CONTENT_TOP;
  slide.addText('BEFORE vs AFTER', {
    x: M, y: hY, w: CW, h: 0.26,
    fontSize: 8.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('The same process — two different realities', {
    x: M, y: hY + 0.28, w: CW, h: 0.5,
    fontSize: 28, bold: true, color: C.white, fontFace: 'Calibri',
  });

  const colY = CONTENT_TOP + 0.28 + 0.5 + 0.2;
  const colH = CONTENT_BOT - colY;
  const colW = (CW - 0.28) / 2;

  const nRows = 5;
  const rowGap = 0.14;
  const headerH = 0.52;
  const rowH = (colH - headerH - (nRows - 1) * rowGap) / nRows;

  function column(xOff, headerColor, headerLabel, rows, rowFill, rowBorder, textColor) {
    const x = M + xOff;
    // Column header
    slide.addShape('roundRect', {
      x, y: colY, w: colW, h: headerH, rectRadius: 0.08,
      fill: { color: headerColor === C.red ? '200A0A' : '091A0F' },
      line: { color: headerColor, width: 0.9 },
    });
    slide.addText(headerLabel, {
      x: x + 0.22, y: colY + 0.08, w: colW - 0.44, h: 0.36,
      fontSize: 14, bold: true, color: headerColor, fontFace: 'Calibri', align: 'center',
    });

    rows.forEach(([title, sub], i) => {
      const ry = colY + headerH + rowGap + i * (rowH + rowGap);
      slide.addShape('roundRect', {
        x, y: ry, w: colW, h: rowH, rectRadius: 0.08,
        fill: { color: rowFill },
        line: { color: rowBorder, width: 0.5 },
      });
      slide.addShape('rect', { x, y: ry, w: 0.05, h: rowH, fill: { color: headerColor } });
      slide.addText(title, {
        x: x + 0.22, y: ry + 0.12, w: colW - 0.44, h: 0.32,
        fontSize: 12, bold: true, color: C.offWhite, fontFace: 'Calibri',
      });
      slide.addText(sub, {
        x: x + 0.22, y: ry + 0.46, w: colW - 0.44, h: rowH - 0.56,
        fontSize: 10, color: textColor, fontFace: 'Calibri',
      });
    });
  }

  column(0, C.red, 'Without LunarLogic', [
    ['Bank statement arrives',    'Staff downloads file, opens spreadsheet, begins manual work'],
    ['Invoice list pulled',       'Exported from ERP — stale the moment it is printed'],
    ['Deposits matched by hand',  '3–5 hours per close cycle, error-prone, undocumented'],
    ['Bulk wire arrives',         'Who decides how to split it? No rule, no log, no trail'],
    ['Mismatches discovered',     'Posting delayed, DSO inflated, close cycle extends another day'],
  ], '1A0909', '2E1212', C.red);

  column(colW + 0.28, C.green, 'With LunarLogic', [
    ['Plaid webhook fires',        'Payment captured automatically — no download, no delay'],
    ['Invoice list pulled via API', 'Live ERP connection — always current, always accurate'],
    ['AI matches in seconds',      '87%+ confidence threshold — posted without human touch'],
    ['Bulk wire split by rule',    'Oldest-invoice-first default, logged with full audit trail'],
    ['Dashboard updates live',     'DSO improves immediately — close cycle closes same day'],
  ], '0A1A0E', '0F3018', C.green);
}

// ── Slide 5: The Dashboard ──────────────────────────────────────────────────────
function slide5(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 5);
  footer(slide);

  const hY = CONTENT_TOP;
  slide.addText('THE DASHBOARD', {
    x: M, y: hY, w: CW, h: 0.26,
    fontSize: 8.5, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('Your AR — live, in one screen', {
    x: M, y: hY + 0.28, w: CW, h: 0.5,
    fontSize: 28, bold: true, color: C.white, fontFace: 'Calibri',
  });

  const startY = CONTENT_TOP + 0.28 + 0.5 + 0.2;
  const panW = (CW - 0.26) / 2;
  const panH = (CONTENT_BOT - startY - 0.2) / 2 - 0.12;
  const gapX = 0.26;
  const gapY = 0.2;

  const panels = [
    {
      title: 'DSO Trend',
      tag: 'OVERVIEW',
      color: C.teal,
      desc: 'A rolling chart of days-sales-outstanding over 30, 60, or 90 days. A vertical annotation marks the activation date — the precise moment the DSO trend begins to fall. This is the most compelling visual in the demo: the line bends down.',
      bars: [
        { h: 0.62, c: C.gray },
        { h: 0.54, c: C.gray },
        { h: 0.7,  c: C.gray },
        { h: 0.48, c: C.teal },
        { h: 0.36, c: C.teal },
        { h: 0.28, c: C.green },
        { h: 0.22, c: C.green },
        { h: 0.18, c: C.green },
      ],
    },
    {
      title: 'AR Aging by Customer',
      tag: 'OVERVIEW',
      color: C.teal,
      desc: 'Aging waterfall (Current through 90+ days) combined with a sortable customer table showing risk tier, average days to pay, and balance by bucket. Click any bar or customer row to drill directly to source invoices with export.',
      bars: [
        { h: 0.62, c: C.teal  },
        { h: 0.44, c: '22C55E' },
        { h: 0.3,  c: 'F59E0B' },
        { h: 0.18, c: 'F97316' },
        { h: 0.1,  c: C.red   },
      ],
    },
    {
      title: 'Cash Application Queue',
      tag: 'CASH APPLICATION',
      color: C.teal,
      desc: 'Every incoming payment shown as a card — confidence score, match status, and auto-applied flag. Click any row to open the Payment Drawer: customer running balance before and after application, with open invoice breakdown.',
      rows: [
        { label: 'Wire   $218,400', badge: '94%', c: C.green },
        { label: 'ACH    $62,000',  badge: '88%', c: C.green },
        { label: 'Check  $14,200',  badge: '71%', c: 'F59E0B' },
      ],
    },
    {
      title: 'Cash Flow Forecast',
      tag: 'CASH APPLICATION',
      color: C.teal,
      desc: 'Weekly stacked bars of expected receipts, color-coded by collection risk. Expected dates are adjusted for each customer\'s historical payment behavior — not just contract terms. Horizon toggle: 30, 60, or 90 days.',
      bars: [
        { h: 0.38, c: C.green  },
        { h: 0.58, c: C.teal   },
        { h: 0.3,  c: '22C55E' },
        { h: 0.5,  c: 'F59E0B' },
        { h: 0.22, c: C.green  },
        { h: 0.44, c: C.red    },
        { h: 0.34, c: '22C55E' },
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
    slide.addShape('rect', { x, y, w: panW, h: 0.05, fill: { color: p.color } });

    slide.addText(p.tag, {
      x: x + 0.2, y: y + 0.14, w: 2.0, h: 0.22,
      fontSize: 7.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 1.5,
    });
    slide.addText(p.title, {
      x: x + 0.2, y: y + 0.37, w: panW * 0.52, h: 0.36,
      fontSize: 15, bold: true, color: p.color, fontFace: 'Calibri',
    });
    slide.addText(p.desc, {
      x: x + 0.2, y: y + 0.76, w: panW * 0.52, h: panH - 0.88,
      fontSize: 10, color: C.grayLt, fontFace: 'Calibri',
    });

    // Mini visual (right half of panel)
    const vx = x + panW * 0.58;
    const vy = y + 0.18;
    const vw = panW * 0.36;
    const vh = panH - 0.28;

    if (p.bars) {
      const barW = vw / p.bars.length - 0.06;
      const baseY = vy + vh - 0.06;
      p.bars.forEach((bar, j) => {
        slide.addShape('roundRect', {
          x: vx + j * (barW + 0.06), y: baseY - bar.h,
          w: barW, h: bar.h, rectRadius: 0.04,
          fill: { color: bar.c }, line: { color: C.panel, width: 0 },
        });
      });
      // baseline
      slide.addShape('rect', { x: vx, y: baseY, w: vw, h: 0.02, fill: { color: C.border } });
    } else if (p.rows) {
      const rowH2 = (vh - 0.1) / p.rows.length - 0.1;
      p.rows.forEach((r, j) => {
        const ry = vy + j * (rowH2 + 0.1);
        slide.addShape('roundRect', {
          x: vx, y: ry, w: vw, h: rowH2, rectRadius: 0.07,
          fill: { color: C.navyMid }, line: { color: r.c, width: 0.5 },
        });
        slide.addText(r.label, {
          x: vx + 0.12, y: ry + (rowH2 - 0.26) / 2, w: vw * 0.55, h: 0.26,
          fontSize: 9.5, color: C.offWhite, fontFace: 'Calibri',
        });
        const bx2 = vx + vw * 0.62;
        slide.addShape('roundRect', {
          x: bx2, y: ry + (rowH2 - 0.28) / 2, w: vw * 0.3, h: 0.28, rectRadius: 0.05,
          fill: { color: '0A1A0A' }, line: { color: r.c, width: 0.4 },
        });
        slide.addText(r.badge, {
          x: bx2, y: ry + (rowH2 - 0.28) / 2, w: vw * 0.3, h: 0.28,
          fontSize: 9.5, bold: true, color: r.c, fontFace: 'Calibri', align: 'center', valign: 'middle',
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

  const hY = CONTENT_TOP;
  slide.addText('NEXT STEPS', {
    x: M, y: hY, w: CW, h: 0.26,
    fontSize: 8.5, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 2.5,
  });
  slide.addText('Live in 30 days. No ERP changes. 60-day guarantee.', {
    x: M, y: hY + 0.28, w: CW, h: 0.5,
    fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri',
  });

  const startY = CONTENT_TOP + 0.28 + 0.5 + 0.2;
  const nSteps = 3;
  const stepGap = 0.18;
  const stepH = (CONTENT_BOT - startY - (nSteps - 1) * stepGap) / nSteps;

  const steps = [
    {
      n: '1', color: C.teal,
      title: 'Read-Only Connection + 2-Week Baseline',
      duration: 'Weeks 1–2',
      desc: 'We connect to your ERP via a read-only API — no changes to existing workflows, no risk to live data. LunarLogic runs in observation mode, measuring current DSO, AR aging distribution, and cash application cycle time. That baseline becomes the before side of your ROI story.',
      tag: 'No ERP changes required',
    },
    {
      n: '2', color: C.teal,
      title: 'Go Live — Automation Activates',
      duration: 'Week 3',
      desc: 'Payment matching goes live. Incoming deposits are ingested in real time, matched against open invoices, and posted automatically for high-confidence matches. Low-confidence items surface in Slack for one-tap review. The AR dashboard goes live on day one.',
      tag: '87%+ auto-match from day one',
    },
    {
      n: '3', color: C.green,
      title: '30-Day Impact Report',
      duration: 'Day 30',
      desc: 'We deliver a documented before/after: DSO delta, hours reclaimed, auto-match rate, and close cycle improvement. The numbers are drawn directly from your ERP data — not estimates. That report becomes your internal business case for broader deployment.',
      tag: 'Documented ROI with your data',
    },
  ];

  steps.forEach((s, i) => {
    const y = startY + i * (stepH + stepGap);

    slide.addShape('roundRect', {
      x: M, y, w: CW, h: stepH, rectRadius: 0.1,
      fill: { color: C.panel }, line: { color: s.color, width: 0.7 },
    });
    slide.addShape('rect', { x: M, y, w: 0.06, h: stepH, fill: { color: s.color } });

    // Number
    slide.addText(s.n, {
      x: M + 0.2, y: y + (stepH - 0.82) / 2, w: 0.78, h: 0.82,
      fontSize: 46, bold: true, color: s.color, fontFace: 'Calibri',
    });

    // Duration chip
    slide.addShape('roundRect', {
      x: M + 1.12, y: y + 0.16, w: 1.1, h: 0.3, rectRadius: 0.06,
      fill: { color: C.navyMid }, line: { color: s.color, width: 0.4 },
    });
    slide.addText(s.duration, {
      x: M + 1.12, y: y + 0.16, w: 1.1, h: 0.3,
      fontSize: 8.5, bold: true, color: s.color, fontFace: 'Calibri', align: 'center', valign: 'middle',
    });

    slide.addText(s.title, {
      x: M + 1.12, y: y + 0.52, w: CW * 0.48, h: 0.34,
      fontSize: 14, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(s.desc, {
      x: M + 1.12, y: y + 0.88, w: CW * 0.48, h: stepH - 1.0,
      fontSize: 10, color: C.grayLt, fontFace: 'Calibri',
    });

    // Right callout
    const rx = M + CW * 0.62;
    const rw = CW * 0.34;
    const ry = y + (stepH - 0.72) / 2;
    slide.addShape('roundRect', {
      x: rx, y: ry, w: rw, h: 0.72, rectRadius: 0.09,
      fill: { color: C.panelB }, line: { color: s.color, width: 0.5 },
    });
    slide.addText(s.tag, {
      x: rx + 0.18, y: ry + 0.12, w: rw - 0.36, h: 0.48,
      fontSize: 12, bold: true, color: s.color, fontFace: 'Calibri', align: 'center', valign: 'middle',
    });
  });

  // Bottom CTA
  slide.addText('"We earn your business every month through results."  —  Jonathan Rodriguez  ·  jrodriguez@lunarlogic.ai', {
    x: M, y: CONTENT_BOT + 0.04, w: CW, h: 0.26,
    fontSize: 9.5, italic: true, color: C.gray, fontFace: 'Calibri', align: 'center',
  });
}

// ── Generate ───────────────────────────────────────────────────────────────────
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title  = 'LunarLogic — Cash Application Automation for Forvis Mazars';
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
