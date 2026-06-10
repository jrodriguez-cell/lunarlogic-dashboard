import PptxGenJS from '/tmp/pptx-gen/node_modules/pptxgenjs/dist/pptxgen.cjs.js';
import { writeFileSync } from 'fs';

const C = {
  navy:    '0A0F1E',
  navyMid: '0D1526',
  panel:   '152035',
  panelAlt:'0F1C30',
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
const M = 0.6;
const HEADER_H = 0.68;
const CW = W - M * 2;

function bg(slide) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
}

function logo(slide, x, y) {
  slide.addText([
    { text: 'Lunar', options: { color: C.cyan, bold: true } },
    { text: 'Logic', options: { color: C.white, bold: true } },
  ], { x, y, w: 2.2, h: 0.42, fontSize: 18, fontFace: 'Calibri' });
}

function topBar(slide, pageNum, total) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: HEADER_H, fill: { color: C.navyMid } });
  slide.addShape('rect', { x: 0, y: HEADER_H - 0.02, w: W, h: 0.02, fill: { color: C.blue } });
  logo(slide, M, 0.13);
  slide.addText(`${pageNum} / ${total}`, {
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

const TOTAL = 7;

// ── Slide 1: Cover ─────────────────────────────────────────────────────────────
function slide1(pptx) {
  const slide = pptx.addSlide();
  bg(slide);

  // Left dark panel
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
    fontSize: 8, bold: true, color: C.cyan, fontFace: 'Calibri', charSpacing: 2,
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

  // Right content
  const rx = pw + 0.35;
  const rw = W - rx - 0.5;

  slide.addText('Transforming Manual AR\nInto Automated Workflows', {
    x: rx, y: 1.0, w: rw, h: 1.5,
    fontSize: 36, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('for professional services firms', {
    x: rx, y: 2.55, w: rw, h: 0.36,
    fontSize: 15, color: C.cyan, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: rx, y: 3.06, w: rw, h: 0.02, fill: { color: C.blue } });

  // Proof point
  slide.addShape('roundRect', {
    x: rx, y: 3.28, w: rw, h: 1.95,
    rectRadius: 0.1, fill: { color: C.panel }, line: { color: C.green, width: 0.9 },
  });
  slide.addShape('rect', { x: rx, y: 3.28, w: rw, h: 0.04, fill: { color: C.green } });
  slide.addText('CLIENT PROOF POINT', {
    x: rx + 0.28, y: 3.42, w: rw - 0.56, h: 0.24,
    fontSize: 8.5, bold: true, color: C.green, fontFace: 'Calibri', charSpacing: 1.5,
  });
  slide.addText('"84% reduction in invoice processing time.\n19-day DSO improvement in under 90 days."', {
    x: rx + 0.28, y: 3.72, w: rw - 0.56, h: 0.85,
    fontSize: 14.5, italic: true, color: C.offWhite, fontFace: 'Calibri',
  });
  slide.addText('— Kaptain Clean LLC  ·  Anchor Client', {
    x: rx + 0.28, y: 4.62, w: rw - 0.56, h: 0.26,
    fontSize: 9.5, color: C.gray, fontFace: 'Calibri',
  });
}

// ── Slide 2: Before ────────────────────────────────────────────────────────────
function slide2(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 2, TOTAL);
  footer(slide);

  const topY = HEADER_H + 0.38;

  slide.addText('Before', {
    x: M, y: topY, w: CW, h: 0.52,
    fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('How your clients manage AR today', {
    x: M, y: topY + 0.52, w: CW, h: 0.3,
    fontSize: 13, color: C.gray, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: M, y: topY + 0.9, w: CW, h: 0.02, fill: { color: C.blue } });

  const pains = [
    { label: '3–8 hrs/week',   desc: 'chasing invoices manually — staff time that generates zero revenue', color: C.red },
    { label: '45–60 day DSO',  desc: 'industry average for professional services — cash locked in AR', color: C.amber },
    { label: '3–5 day close',  desc: 'to match bank deposits against open invoices — manual reconciliation', color: C.amber },
    { label: '2% bad debt',    desc: 'industry average write-off rate — preventable with proactive outreach', color: C.red },
    { label: 'Zero visibility', desc: 'AR health lives in ERP exports and spreadsheets — stale by the time anyone sees it', color: C.gray },
    { label: 'No audit trail', desc: 'cash application decisions undocumented — SOC 2 and internal controls gap', color: C.gray },
  ];

  const cols = 2;
  const cardW = (CW - 0.3) / cols;
  const cardH = 1.05;
  const gapX = 0.3;
  const gapY = 0.18;
  const startY = topY + 1.08;

  pains.forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = M + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    slide.addShape('roundRect', { x, y, w: cardW, h: cardH, rectRadius: 0.08, fill: { color: C.panel }, line: { color: p.color, width: 0.5 } });
    slide.addShape('rect', { x, y, w: 0.04, h: cardH, fill: { color: p.color } });
    slide.addText(p.label, {
      x: x + 0.22, y: y + 0.12, w: cardW - 0.44, h: 0.32,
      fontSize: 14, bold: true, color: p.color, fontFace: 'Calibri',
    });
    slide.addText(p.desc, {
      x: x + 0.22, y: y + 0.46, w: cardW - 0.44, h: 0.48,
      fontSize: 10, color: C.grayMid, fontFace: 'Calibri',
    });
  });
}

// ── Slide 3: After ─────────────────────────────────────────────────────────────
function slide3(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 3, TOTAL);
  footer(slide);

  const topY = HEADER_H + 0.38;

  slide.addText('After', {
    x: M, y: topY, w: CW, h: 0.52,
    fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('Automated Order-to-Cash — ERP-agnostic, multi-office ready', {
    x: M, y: topY + 0.52, w: CW, h: 0.3,
    fontSize: 13, color: C.cyan, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: M, y: topY + 0.9, w: CW, h: 0.02, fill: { color: C.blue } });

  const afters = [
    { label: '<1 hr/week',     desc: 'Automated reminders, aging reports, and cash matching — staff focused on exceptions only', color: C.green },
    { label: '15–25 day drop', desc: 'DSO improvement observed at go-live — the trend line bends down within 30 days', color: C.cyan },
    { label: '8 min avg',      desc: 'Bank deposit to ledger posting — 90%+ auto-matched with full audit trail', color: C.green },
    { label: '0.6% bad debt',  desc: 'Proactive escalating reminders prevent write-offs before balances age past recovery', color: C.green },
    { label: 'Live dashboard', desc: 'AR aging, DSO trend, invoice status — bookmarkable URL, no ERP login required', color: C.cyan },
    { label: 'Full audit log', desc: 'Every cash application decision logged — confidence score, rule applied, reviewer', color: C.cyan },
  ];

  const cols = 2;
  const cardW = (CW - 0.3) / cols;
  const cardH = 1.05;
  const gapX = 0.3;
  const gapY = 0.18;
  const startY = topY + 1.08;

  afters.forEach((a, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = M + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    slide.addShape('roundRect', { x, y, w: cardW, h: cardH, rectRadius: 0.08, fill: { color: C.panel }, line: { color: a.color, width: 0.5 } });
    slide.addShape('rect', { x, y, w: 0.04, h: cardH, fill: { color: a.color } });
    slide.addText(a.label, {
      x: x + 0.22, y: y + 0.12, w: cardW - 0.44, h: 0.32,
      fontSize: 14, bold: true, color: a.color, fontFace: 'Calibri',
    });
    slide.addText(a.desc, {
      x: x + 0.22, y: y + 0.46, w: cardW - 0.44, h: 0.48,
      fontSize: 10, color: C.grayMid, fontFace: 'Calibri',
    });
  });
}

// ── Slide 4: The Value ─────────────────────────────────────────────────────────
function slide4(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 4, TOTAL);
  footer(slide);

  const topY = HEADER_H + 0.38;

  slide.addText('The Value', {
    x: M, y: topY, w: CW, h: 0.52,
    fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('Three compounding outcomes for every client you serve', {
    x: M, y: topY + 0.52, w: CW, h: 0.3,
    fontSize: 13, color: C.gray, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: M, y: topY + 0.9, w: CW, h: 0.02, fill: { color: C.blue } });

  const values = [
    {
      color: C.cyan,
      title: 'Time Savings',
      headline: '85–90%',
      sub: 'reduction in collections work',
      items: [
        '5–15 hrs/week  →  <1 hr/week',
        '200–700 hours freed annually',
        '$13K–$40K labor cost savings',
        'Staff reallocated to advisory work',
      ],
    },
    {
      color: C.amber,
      title: 'Working Capital',
      headline: '15–25 days',
      sub: 'DSO improvement at go-live',
      items: [
        '50 days  →  35 days (typical)',
        '$200K+ in freed capital per firm',
        'Near-term cash flow visibility',
        'Trend chart bends at go-live',
      ],
    },
    {
      color: C.green,
      title: 'Bad Debt Prevention',
      headline: '2%  →  0.6%',
      sub: 'write-off rate with proactive outreach',
      items: [
        '$70K+ prevented annually (est.)',
        'Escalating reminders via Outlook',
        '90+ day exposure surfaced weekly',
        'ASC 310-10-35 ADA reserve support',
      ],
    },
  ];

  const cardW = (CW - 0.4) / 3;
  const cardH = H - topY - 1.12 - 0.28 - 0.1;
  const gap = 0.2;

  values.forEach((v, i) => {
    const x = M + i * (cardW + gap);
    const y = topY + 1.1;

    slide.addShape('roundRect', { x, y, w: cardW, h: cardH, rectRadius: 0.1, fill: { color: C.panel }, line: { color: v.color, width: 0.8 } });
    slide.addShape('rect', { x, y, w: cardW, h: 0.05, fill: { color: v.color } });

    slide.addText(v.title.toUpperCase(), {
      x: x + 0.22, y: y + 0.2, w: cardW - 0.44, h: 0.22,
      fontSize: 8.5, bold: true, color: v.color, fontFace: 'Calibri', charSpacing: 1.5,
    });
    slide.addText(v.headline, {
      x: x + 0.22, y: y + 0.46, w: cardW - 0.44, h: 0.8,
      fontSize: 36, bold: true, color: v.color, fontFace: 'Calibri',
    });
    slide.addText(v.sub, {
      x: x + 0.22, y: y + 1.28, w: cardW - 0.44, h: 0.3,
      fontSize: 10, color: C.gray, fontFace: 'Calibri', italic: true,
    });
    slide.addShape('rect', { x: x + 0.22, y: y + 1.65, w: cardW - 0.44, h: 0.015, fill: { color: v.color } });

    v.items.forEach((item, j) => {
      slide.addText('• ' + item, {
        x: x + 0.22, y: y + 1.82 + j * 0.4, w: cardW - 0.44, h: 0.36,
        fontSize: 10.5, color: C.grayMid, fontFace: 'Calibri',
      });
    });
  });
}

// ── Slide 5: The Question ──────────────────────────────────────────────────────
function slide5(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 5, TOTAL);
  footer(slide);

  const topY = HEADER_H + 0.55;

  slide.addText('The Question', {
    x: M, y: topY, w: CW, h: 0.55,
    fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri',
  });

  slide.addText('With 200–700 hours freed up annually across your client portfolio...', {
    x: M, y: topY + 0.65, w: CW, h: 0.45,
    fontSize: 18, italic: true, color: C.grayMid, fontFace: 'Calibri',
  });
  slide.addText('What becomes possible for your advisory practice?', {
    x: M, y: topY + 1.15, w: CW, h: 0.5,
    fontSize: 24, bold: true, color: C.cyan, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: M, y: topY + 1.75, w: CW, h: 0.02, fill: { color: C.blue } });

  const cols = [
    {
      heading: 'For Your Clients',
      color: C.green,
      items: ['Reallocate AR staff to higher-value work', 'Improve cash flow forecasting accuracy', 'Reduce period-close cycle time', 'Eliminate manual reconciliation backlog'],
    },
    {
      heading: 'For Forvis Mazars',
      color: C.cyan,
      items: ['Differentiated advisory offering', 'Recurring technology revenue stream', 'Stickier client relationships', 'GAAP-aligned reporting built in (ASC 310 / 606)'],
    },
    {
      heading: 'For the Engagement',
      color: C.amber,
      items: ['Live demo available today', '30-day parallel pilot — no ERP changes', 'White-label or referral partnership paths', '60-day satisfaction guarantee'],
    },
  ];

  const colW = (CW - 0.4) / 3;
  const gap = 0.2;

  cols.forEach((c, i) => {
    const x = M + i * (colW + gap);
    const y = topY + 1.95;

    slide.addText(c.heading, {
      x, y, w: colW, h: 0.35,
      fontSize: 13, bold: true, color: c.color, fontFace: 'Calibri',
    });
    c.items.forEach((item, j) => {
      slide.addText('→  ' + item, {
        x, y: y + 0.42 + j * 0.42, w: colW, h: 0.38,
        fontSize: 10.5, color: C.grayMid, fontFace: 'Calibri',
      });
    });
  });
}

// ── Slide 6: Live Demo ─────────────────────────────────────────────────────────
function slide6(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 6, TOTAL);
  footer(slide);

  const topY = HEADER_H + 0.38;

  slide.addText('Live Demo', {
    x: M, y: topY, w: CW, h: 0.52,
    fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('AR Dashboard — Forvis Mazars Chicago data', {
    x: M, y: topY + 0.52, w: CW, h: 0.3,
    fontSize: 13, color: C.gray, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: M, y: topY + 0.9, w: CW, h: 0.02, fill: { color: C.blue } });

  // Metric row
  const mW = (CW - 0.6) / 5;
  const mH = 1.2;
  const mGap = 0.15;
  const mY = topY + 1.08;
  const metrics = [
    { label: 'Current DSO',       value: '36d',   color: C.cyan,     sub: 'down from 58d' },
    { label: 'Improvement',       value: '−22d',  color: C.green,    sub: 'since go-live' },
    { label: 'Total AR',          value: '$892k', color: C.offWhite, sub: '22 open invoices' },
    { label: 'Overdue',           value: '7',     color: C.amber,    sub: '$218k at risk' },
    { label: 'Auto-Match Rate',   value: '89%',   color: C.green,    sub: 'cash applied' },
  ];
  metrics.forEach((m, i) => {
    const x = M + i * (mW + mGap);
    slide.addShape('roundRect', { x, y: mY, w: mW, h: mH, rectRadius: 0.08, fill: { color: C.panel }, line: { color: '1E3A5F', width: 0.6 } });
    slide.addText(m.label.toUpperCase(), {
      x: x + 0.18, y: mY + 0.14, w: mW - 0.36, h: 0.22,
      fontSize: 7.5, bold: true, color: C.gray, fontFace: 'Calibri', charSpacing: 1.2,
    });
    slide.addText(m.value, {
      x: x + 0.18, y: mY + 0.38, w: mW - 0.36, h: 0.55,
      fontSize: 28, bold: true, color: m.color, fontFace: 'Calibri',
    });
    if (m.sub) slide.addText(m.sub, {
      x: x + 0.18, y: mY + 0.92, w: mW - 0.36, h: 0.2,
      fontSize: 8.5, color: C.gray, fontFace: 'Calibri',
    });
  });

  // Feature callouts
  const fY = mY + mH + 0.28;
  const fH = H - fY - 0.28 - 0.28;
  const features = [
    { title: 'DSO Trend',        desc: '90-day rolling chart. Go-live annotation shows the inflection point — the line bends down. Most compelling retention visual in the demo.', color: C.cyan },
    { title: 'AR Aging Drill',   desc: 'Click any aging bucket → source invoices with ASC 310 ADA reserve rates. Exportable to Excel. Full GAAP disclosure support.', color: C.blue },
    { title: 'Cash Application', desc: '90%+ auto-match. Confidence distribution chart. Audit trail of every decision — confidence score, rule used, who reviewed.', color: C.amber },
    { title: 'AI Status Report', desc: 'Data-driven narrative at the top of every tab. GAAP flags surfaced automatically. Regenerates on demand.', color: C.green },
  ];
  const fw = (CW - 0.45) / 4;
  features.forEach((f, i) => {
    const x = M + i * (fw + 0.15);
    slide.addShape('roundRect', { x, y: fY, w: fw, h: fH, rectRadius: 0.08, fill: { color: C.panelAlt }, line: { color: f.color, width: 0.5 } });
    slide.addShape('rect', { x, y: fY, w: fw, h: 0.04, fill: { color: f.color } });
    slide.addText(f.title, {
      x: x + 0.18, y: fY + 0.14, w: fw - 0.36, h: 0.3,
      fontSize: 11, bold: true, color: f.color, fontFace: 'Calibri',
    });
    slide.addText(f.desc, {
      x: x + 0.18, y: fY + 0.5, w: fw - 0.36, h: fH - 0.65,
      fontSize: 9.5, color: C.grayMid, fontFace: 'Calibri',
    });
  });
}

// ── Slide 7: Next Steps ────────────────────────────────────────────────────────
function slide7(pptx) {
  const slide = pptx.addSlide();
  bg(slide);
  topBar(slide, 7, TOTAL);
  footer(slide);

  const topY = HEADER_H + 0.38;

  slide.addText('Next Steps', {
    x: M, y: topY, w: CW, h: 0.52,
    fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri',
  });
  slide.addText('From this conversation to your first client deployment', {
    x: M, y: topY + 0.52, w: CW, h: 0.3,
    fontSize: 13, color: C.gray, fontFace: 'Calibri',
  });
  slide.addShape('rect', { x: M, y: topY + 0.9, w: CW, h: 0.02, fill: { color: C.blue } });

  const steps = [
    {
      num: '1',
      title: 'Identify a Pilot Client',
      desc: 'Select one client where AR pain is highest — professional services, 8–20 staff, ERP already in place. We run a 30-day parallel test. No changes to their ERP or accounting workflows.',
      color: C.cyan,
    },
    {
      num: '2',
      title: 'Read-Only Connection + Baseline',
      desc: 'We connect via read-only API. A 2-week shadow run measures DSO, aging, and cash application speed before automation begins. Baseline established for ROI measurement.',
      color: C.blue,
    },
    {
      num: '3',
      title: 'Go Live — Measure in 30 Days',
      desc: 'Automation goes live. We track DSO weekly, post AR summaries to Slack daily, and deliver a monthly impact report. You see the line bending down within the first month.',
      color: C.green,
    },
  ];

  const stepH = (H - topY - 1.12 - 0.28 - 0.45) / 3;
  steps.forEach((s, i) => {
    const y = topY + 1.08 + i * (stepH + 0.2);
    slide.addShape('roundRect', { x: M, y, w: CW, h: stepH, rectRadius: 0.1, fill: { color: C.panel }, line: { color: s.color, width: 0.6 } });
    slide.addShape('rect', { x: M, y, w: 0.05, h: stepH, fill: { color: s.color } });
    slide.addText(s.num, {
      x: M + 0.22, y: y + (stepH - 0.9) / 2, w: 0.8, h: 0.9,
      fontSize: 44, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(s.title, {
      x: M + 1.15, y: y + 0.15, w: CW - 1.35, h: 0.35,
      fontSize: 14, bold: true, color: s.color, fontFace: 'Calibri',
    });
    slide.addText(s.desc, {
      x: M + 1.15, y: y + 0.52, w: CW - 1.35, h: stepH - 0.65,
      fontSize: 10.5, color: C.grayMid, fontFace: 'Calibri',
    });
  });

  slide.addText('"We earn your business every month through results."  —  Jonathan Rodriguez  ·  jrodriguez@lunarlogic.ai', {
    x: M, y: H - 0.28 - 0.35, w: CW, h: 0.28,
    fontSize: 9.5, italic: true, color: C.gray, fontFace: 'Calibri', align: 'center',
  });
}

// ── Generate ───────────────────────────────────────────────────────────────────
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title = 'LunarLogic AR Automation — Forvis Mazars Exploratory Call';
pptx.author = 'LunarLogic LLC';

slide1(pptx);
slide2(pptx);
slide3(pptx);
slide4(pptx);
slide5(pptx);
slide6(pptx);
slide7(pptx);

const buf = await pptx.write({ outputType: 'nodebuffer' });
writeFileSync('/home/user/lunarlogic-dashboard/LunarLogic_ForvisMazars_Deck.pptx', buf);
console.log('Done.');
