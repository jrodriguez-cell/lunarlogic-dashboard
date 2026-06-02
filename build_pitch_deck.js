const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "LunarLogic — Carolina Turf AR Automation";
pres.author = "Jonathan Rodriguez";

// ── Brand colors (no # prefix) ───────────────────────────────────────────────
const BG_DEEP   = "0A0F1A";   // deepest background (cover, section slides)
const BG_DARK   = "0D1117";   // main slide background
const BG_CARD   = "111827";   // card / panel fill
const BG_CARD2  = "0F1929";   // slightly deeper card
const BORDER    = "1F2937";   // subtle card border
const BORDER_LT = "243044";   // lighter border for hover states

const CYAN      = "00D4FF";   // primary brand accent — logo glow color
const CYAN_DIM  = "0099BB";   // dimmer cyan for secondary elements
const GREEN     = "22C55E";   // positive / good
const AMBER     = "F59E0B";   // warning / mid-age AR
const RED       = "EF4444";   // overdue / danger

const WHITE     = "FFFFFF";
const GRAY_LT   = "E5E7EB";   // light body text
const GRAY_MD   = "9CA3AF";   // muted labels
const GRAY_DK   = "4B5563";   // very muted

// ── Helpers ──────────────────────────────────────────────────────────────────

function footer(slide, light = false) {
  const color = light ? "4B5563" : "374151";
  slide.addText("lunarlogic  ·  AR Automation Platform  ·  lunarlogic.ai", {
    x: 0.4, y: 5.28, w: 9.2, h: 0.26,
    fontSize: 9, color, align: "center", fontFace: "Trebuchet MS", italic: true
  });
}

// Glowing cyan stat — large number with label beneath
function cyanStat(slide, val, label, x, y, w, valSize = 48, labelSize = 11) {
  slide.addText(val, {
    x, y, w, h: (valSize / 72) * 1.6,
    fontSize: valSize, bold: true, color: CYAN,
    fontFace: "Trebuchet MS", align: "left", margin: 0
  });
  slide.addText(label, {
    x, y: y + (valSize / 72) * 1.5, w, h: 0.3,
    fontSize: labelSize, color: GRAY_MD,
    fontFace: "Trebuchet MS", align: "left", margin: 0,
    charSpacing: 1
  });
}

// Dark card with optional top accent bar
function card(slide, cx, cy, cw, ch, accentColor = null) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: cy, w: cw, h: ch,
    fill: { color: BG_CARD },
    line: { color: BORDER, width: 0.75 }
  });
  if (accentColor) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: cy, w: cw, h: 0.06,
      fill: { color: accentColor }, line: { color: accentColor }
    });
  }
}

// ── SLIDE 1: COVER ───────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DEEP };

  // Subtle radial-style glow suggestion — large faded cyan circle behind title
  slide.addShape(pres.shapes.OVAL, {
    x: -1.5, y: -1.0, w: 7, h: 5,
    fill: { color: "001A24", transparency: 0 },
    line: { color: "001A24" }
  });

  // "lunarlogic" wordmark style — cyan glow
  slide.addText("lunarlogic", {
    x: 0.55, y: 0.42, w: 4, h: 0.58,
    fontSize: 26, bold: true, color: CYAN,
    fontFace: "Trebuchet MS", align: "left", margin: 0
  });
  slide.addText("AR AUTOMATION PLATFORM", {
    x: 0.56, y: 0.98, w: 4.5, h: 0.25,
    fontSize: 9, color: GRAY_MD, fontFace: "Trebuchet MS",
    charSpacing: 3, align: "left", margin: 0
  });

  // Thin horizontal rule
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 1.38, w: 8.9, h: 0.02,
    fill: { color: BORDER }, line: { color: BORDER }
  });

  // Main headline
  slide.addText("Reclaim What\nYou've Already Earned", {
    x: 0.55, y: 1.58, w: 9.0, h: 2.0,
    fontSize: 52, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left", valign: "top"
  });

  // Subtitle — cyan
  slide.addText("A Custom AR Automation System for Carolina Turf Lawn and Landscape", {
    x: 0.55, y: 3.65, w: 8.0, h: 0.5,
    fontSize: 16, color: CYAN,
    fontFace: "Trebuchet MS", align: "left", italic: false
  });

  // Bottom meta
  slide.addText("Presented by  Jonathan Rodriguez  ·  jrodriguez@lunarlogic.ai  ·  [Date]", {
    x: 0.55, y: 4.92, w: 9.0, h: 0.28,
    fontSize: 11, color: GRAY_MD, fontFace: "Trebuchet MS", align: "left"
  });
}

// ── SLIDE 2: THE PROBLEM ─────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  // Section label
  slide.addText("THE PROBLEM", {
    x: 0.5, y: 0.28, w: 4, h: 0.22,
    fontSize: 10, color: CYAN, fontFace: "Trebuchet MS",
    charSpacing: 3, bold: true, margin: 0
  });

  slide.addText("You Deliver Excellence.\nYou Shouldn't Have to Wait to Get Paid.", {
    x: 0.5, y: 0.52, w: 9.1, h: 1.05,
    fontSize: 30, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left"
  });

  slide.addText(
    "Carolina Turf runs 8 service lines across 28+ communities — maintenance, hardscapes, HOA contracts, commercial properties. " +
    "That complexity creates billing gaps that quietly erode cash flow. Three patterns keep showing up:",
    {
      x: 0.5, y: 1.62, w: 9.0, h: 0.48,
      fontSize: 13, color: GRAY_MD, fontFace: "Trebuchet MS", align: "left"
    }
  );

  const cols = [
    {
      x: 0.5, accent: CYAN,
      icon: "⏱",
      label: "50+ DAYS TO COLLECT",
      title: "The HOA & Commercial Cash Gap",
      body: "HOA boards and commercial clients run their own AP schedules — 30, 45, even 60-day terms are standard. You've already done the work. The cash won't land for weeks."
    },
    {
      x: 3.62, accent: AMBER,
      icon: "🗂",
      label: "MANUAL FOLLOW-UP",
      title: "Collections When There's Time",
      body: "Your office team is talented and stretched thin. Follow-up happens when someone has bandwidth — which means some invoices age silently while everything else gets prioritized."
    },
    {
      x: 6.75, accent: RED,
      icon: "🔍",
      label: "INVISIBLE LEAKAGE",
      title: "Revenue That Never Gets Billed",
      body: "Project deposits not invoiced at signing. Jobs completed Tuesday, invoiced Friday. Small gaps multiplied across 150–250 invoices per month add real dollars to your DSO."
    }
  ];

  cols.forEach(col => {
    const cw = 2.9;
    card(slide, col.x, 2.2, cw, 3.1, col.accent);

    slide.addText(col.icon, {
      x: col.x + 0.18, y: 2.35, w: 0.55, h: 0.5,
      fontSize: 24, fontFace: "Trebuchet MS", align: "left", margin: 0
    });
    slide.addText(col.label, {
      x: col.x + 0.18, y: 2.92, w: 2.55, h: 0.25,
      fontSize: 9, bold: true, color: col.accent,
      fontFace: "Trebuchet MS", charSpacing: 2, margin: 0
    });
    slide.addText(col.title, {
      x: col.x + 0.18, y: 3.2, w: 2.55, h: 0.45,
      fontSize: 14, bold: true, color: WHITE,
      fontFace: "Trebuchet MS", align: "left", margin: 0
    });
    slide.addText(col.body, {
      x: col.x + 0.18, y: 3.7, w: 2.54, h: 1.42,
      fontSize: 11.5, color: GRAY_LT,
      fontFace: "Trebuchet MS", align: "left", valign: "top", wrap: true, margin: 0
    });
  });

  footer(slide);
}

// ── SLIDE 3: COST OF THE PROBLEM ─────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addText("THE COST", {
    x: 0.5, y: 0.28, w: 4, h: 0.22,
    fontSize: 10, color: CYAN, fontFace: "Trebuchet MS",
    charSpacing: 3, bold: true, margin: 0
  });

  slide.addText("What Slow AR Is Actually Costing Carolina Turf", {
    x: 0.5, y: 0.52, w: 9.1, h: 0.68,
    fontSize: 30, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left"
  });

  // Hero card
  card(slide, 0.5, 1.32, 9.1, 1.28, CYAN);
  slide.addText("$328,767", {
    x: 0.72, y: 1.42, w: 4.5, h: 0.88,
    fontSize: 60, bold: true, color: CYAN,
    fontFace: "Trebuchet MS", align: "left", margin: 0
  });
  slide.addText("currently locked in open receivables — money you've already earned but haven't collected", {
    x: 5.3, y: 1.62, w: 4.1, h: 0.68,
    fontSize: 13, color: GRAY_LT,
    fontFace: "Trebuchet MS", align: "left", valign: "middle", italic: true
  });

  // Three supporting stat cards
  const stats = [
    { val: "$62,500",  label: "UNBILLED / LOST REVENUE", sub: "annually",              color: AMBER, x: 0.5  },
    { val: "$11,700",  label: "STAFF TIME ON COLLECTIONS", sub: "per year",             color: AMBER, x: 3.62 },
    { val: "$11,250",  label: "BAD DEBT LOSSES",           sub: "annually",             color: RED,   x: 6.75 }
  ];

  stats.forEach(s => {
    card(slide, s.x, 2.75, 2.9, 1.65, s.color);
    slide.addText(s.val, {
      x: s.x + 0.18, y: 2.9, w: 2.55, h: 0.72,
      fontSize: 38, bold: true, color: s.color,
      fontFace: "Trebuchet MS", align: "left", margin: 0
    });
    slide.addText(s.label, {
      x: s.x + 0.18, y: 3.65, w: 2.55, h: 0.2,
      fontSize: 9, bold: true, color: s.color,
      fontFace: "Trebuchet MS", charSpacing: 1.5, margin: 0
    });
    slide.addText(s.sub, {
      x: s.x + 0.18, y: 3.87, w: 2.55, h: 0.22,
      fontSize: 10.5, color: GRAY_MD,
      fontFace: "Trebuchet MS", margin: 0
    });
  });

  // Summary line
  slide.addText(
    "That's  $263,532  working against you every year — not from lack of revenue, from lack of collection systems.",
    {
      x: 0.5, y: 4.56, w: 9.1, h: 0.42,
      fontSize: 13.5, color: GRAY_LT,
      fontFace: "Trebuchet MS", align: "center", italic: true
    }
  );

  footer(slide);
}

// ── SLIDE 4: HOW IT WORKS ────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addText("THE SYSTEM", {
    x: 0.5, y: 0.28, w: 4, h: 0.22,
    fontSize: 10, color: CYAN, fontFace: "Trebuchet MS",
    charSpacing: 3, bold: true, margin: 0
  });

  slide.addText("The LunarLogic AR Automation System", {
    x: 0.5, y: 0.52, w: 9.1, h: 0.62,
    fontSize: 30, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left"
  });

  slide.addText("Four automated workflows — runs inside QuickBooks Online, nothing new to learn.", {
    x: 0.5, y: 1.17, w: 9.1, h: 0.32,
    fontSize: 13, color: GRAY_MD, fontFace: "Trebuchet MS"
  });

  const steps = [
    {
      num: "01", tag: "WF1", accent: CYAN,
      title: "Invoice Created\nAutomatically",
      body: "Triggered at job completion. No human touchpoint — the invoice builds itself in QuickBooks instantly.",
      x: 0.3
    },
    {
      num: "02", tag: "WF2", accent: GREEN,
      title: "Reminders Sent\non Schedule",
      body: "Day 1, 7, 14, 30 past due. Escalating tone. Email + SMS via Twilio. Always running, always on-brand.",
      x: 2.72
    },
    {
      num: "03", tag: "WF3", accent: AMBER,
      title: "Payment Link\nDelivered",
      body: "One tap to pay. No login, no friction. Embedded in every reminder — removes every excuse not to pay.",
      x: 5.13
    },
    {
      num: "04", tag: "WF4", accent: CYAN,
      title: "You See\nEverything",
      body: "Live AR aging dashboard. Monday morning Slack report. Full real-time visibility with zero manual work.",
      x: 7.55
    }
  ];

  // Connecting line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.62, y: 2.56, w: 9.25, h: 0.03,
    fill: { color: BORDER }, line: { color: BORDER }
  });

  steps.forEach((s, i) => {
    const cw = 2.22;
    card(slide, s.x, 1.6, cw, 3.65, s.accent);

    // Step number
    slide.addText(s.num, {
      x: s.x + 0.14, y: 1.72, w: 0.75, h: 0.68,
      fontSize: 40, bold: true, color: s.accent,
      fontFace: "Trebuchet MS", align: "left", margin: 0
    });

    // Tag
    slide.addText(s.tag, {
      x: s.x + 0.92, y: 1.87, w: 1.1, h: 0.22,
      fontSize: 10, bold: true, color: GRAY_DK,
      fontFace: "Trebuchet MS", charSpacing: 2, margin: 0
    });

    // Title
    slide.addText(s.title, {
      x: s.x + 0.14, y: 2.48, w: 1.95, h: 0.72,
      fontSize: 16, bold: true, color: WHITE,
      fontFace: "Trebuchet MS", align: "left", valign: "top", margin: 0
    });

    // Body
    slide.addText(s.body, {
      x: s.x + 0.14, y: 3.28, w: 1.96, h: 1.75,
      fontSize: 11.5, color: GRAY_LT,
      fontFace: "Trebuchet MS", align: "left", valign: "top", wrap: true, margin: 0
    });

    // Arrow between cards
    if (i < 3) {
      slide.addText("›", {
        x: s.x + cw + 0.04, y: 2.3, w: 0.3, h: 0.4,
        fontSize: 22, color: CYAN_DIM,
        fontFace: "Trebuchet MS", align: "center", margin: 0
      });
    }
  });

  footer(slide);
}

// ── SLIDE 5: DONE FOR YOU ────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addText("THE DIFFERENCE", {
    x: 0.5, y: 0.28, w: 5, h: 0.22,
    fontSize: 10, color: CYAN, fontFace: "Trebuchet MS",
    charSpacing: 3, bold: true, margin: 0
  });

  slide.addText("We Don't Sell You Software. We Run Your AR.", {
    x: 0.5, y: 0.52, w: 9.1, h: 0.65,
    fontSize: 30, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left"
  });

  // Column headers
  // Without
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.3, w: 4.35, h: 0.5,
    fill: { color: BG_CARD2 }, line: { color: "3B1F1F", width: 1 }
  });
  slide.addText("WITHOUT LUNARLOGIC", {
    x: 0.5, y: 1.3, w: 4.35, h: 0.5,
    fontSize: 12, bold: true, color: RED,
    fontFace: "Trebuchet MS", align: "center", valign: "middle",
    charSpacing: 1.5
  });

  // With
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.15, y: 1.3, w: 4.35, h: 0.5,
    fill: { color: BG_CARD2 }, line: { color: "0A3040", width: 1 }
  });
  slide.addText("WITH LUNARLOGIC", {
    x: 5.15, y: 1.3, w: 4.35, h: 0.5,
    fontSize: 12, bold: true, color: CYAN,
    fontFace: "Trebuchet MS", align: "center", valign: "middle",
    charSpacing: 1.5
  });

  const rows = [
    ["Manual invoice creation after every job",            "Automated invoice triggers at job completion"],
    ["Forgotten follow-ups when staff is stretched",       "Systematic Day 1 / 7 / 14 / 30 reminder sequences"],
    ["Uncomfortable collections calls to clients",         "Payment links do the asking — professionally, automatically"],
    ["No real-time visibility into AR aging",              "Live dashboard every Monday morning in Slack"],
    ["Staff time wasted chasing open invoices",            "Staff focused on clients, crews, and growth"],
  ];

  rows.forEach((row, i) => {
    const yPos = 1.9 + i * 0.64;
    const bg = i % 2 === 0 ? "0D1520" : BG_CARD;

    // Left cell
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: yPos, w: 4.35, h: 0.58,
      fill: { color: bg }, line: { color: BORDER, width: 0.5 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: yPos, w: 0.06, h: 0.58,
      fill: { color: RED }, line: { color: RED }
    });
    slide.addText(row[0], {
      x: 0.68, y: yPos + 0.05, w: 4.08, h: 0.48,
      fontSize: 12.5, color: GRAY_LT,
      fontFace: "Trebuchet MS", align: "left", valign: "middle"
    });

    // Right cell
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.15, y: yPos, w: 4.35, h: 0.58,
      fill: { color: bg }, line: { color: BORDER, width: 0.5 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.15, y: yPos, w: 0.06, h: 0.58,
      fill: { color: CYAN }, line: { color: CYAN }
    });
    slide.addText(row[1], {
      x: 5.33, y: yPos + 0.05, w: 4.08, h: 0.48,
      fontSize: 12.5, bold: true, color: WHITE,
      fontFace: "Trebuchet MS", align: "left", valign: "middle"
    });
  });

  footer(slide);
}

// ── SLIDE 6: ROI ─────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addText("THE ROI", {
    x: 0.5, y: 0.28, w: 4, h: 0.22,
    fontSize: 10, color: CYAN, fontFace: "Trebuchet MS",
    charSpacing: 3, bold: true, margin: 0
  });

  slide.addText("The Numbers for Carolina Turf", {
    x: 0.5, y: 0.52, w: 9.1, h: 0.65,
    fontSize: 30, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left"
  });

  // DSO transformation card
  card(slide, 0.5, 1.28, 9.1, 1.1, CYAN);
  slide.addText("DSO  TODAY", {
    x: 0.72, y: 1.4, w: 2.2, h: 0.22,
    fontSize: 9, color: GRAY_MD, fontFace: "Trebuchet MS", charSpacing: 2, margin: 0
  });
  slide.addText("48 days", {
    x: 0.72, y: 1.62, w: 2.0, h: 0.6,
    fontSize: 34, bold: true, color: RED,
    fontFace: "Trebuchet MS", align: "left", margin: 0
  });
  slide.addText("→", {
    x: 2.85, y: 1.65, w: 0.55, h: 0.55,
    fontSize: 30, color: GRAY_MD,
    fontFace: "Trebuchet MS", align: "center", margin: 0
  });
  slide.addText("DSO  WITH LUNARLOGIC", {
    x: 3.45, y: 1.4, w: 3.0, h: 0.22,
    fontSize: 9, color: CYAN, fontFace: "Trebuchet MS", charSpacing: 2, margin: 0, bold: true
  });
  slide.addText("22 days", {
    x: 3.45, y: 1.62, w: 2.2, h: 0.6,
    fontSize: 34, bold: true, color: CYAN,
    fontFace: "Trebuchet MS", align: "left", margin: 0
  });
  slide.addText("26-day reduction in days sales outstanding", {
    x: 6.1, y: 1.68, w: 3.3, h: 0.4,
    fontSize: 12, color: GRAY_MD,
    fontFace: "Trebuchet MS", align: "right", italic: true, margin: 0
  });

  // Four metric cards
  const metrics = [
    { label: "WORKING CAPITAL RELEASED", val: "$178,082", sub: "cash freed in Year 1",              color: CYAN,  x: 0.5  },
    { label: "TOTAL YEAR 1 VALUE",        val: "$263,532", sub: "working capital + savings + bad debt", color: GREEN, x: 2.82 },
    { label: "LUNARLOGIC INVESTMENT",     val: "$12,000",  sub: "$1,000/month · no long-term contract", color: GRAY_MD, x: 5.13 },
    { label: "YEAR 1 RETURN",             val: "22×",      sub: "return on investment",              color: CYAN,  x: 7.45 }
  ];

  metrics.forEach(m => {
    card(slide, m.x, 2.52, 2.2, 2.5, m.color === GRAY_MD ? BORDER : m.color);

    slide.addText(m.label, {
      x: m.x + 0.15, y: 2.65, w: 1.9, h: 0.4,
      fontSize: 8.5, bold: true, color: m.color,
      fontFace: "Trebuchet MS", charSpacing: 1, margin: 0
    });
    slide.addText(m.val, {
      x: m.x + 0.15, y: 3.08, w: 1.9, h: 0.85,
      fontSize: m.val.length > 6 ? 30 : 38, bold: true, color: m.color,
      fontFace: "Trebuchet MS", align: "left", margin: 0
    });
    slide.addText(m.sub, {
      x: m.x + 0.15, y: 3.98, w: 1.9, h: 0.75,
      fontSize: 10, color: GRAY_MD,
      fontFace: "Trebuchet MS", align: "left", italic: true, margin: 0, wrap: true
    });
  });

  // Sub-line
  slide.addText(
    "This is not projected revenue. This is money you've already earned — collected faster.",
    {
      x: 0.5, y: 5.12, w: 9.1, h: 0.28,
      fontSize: 12, color: GRAY_MD,
      fontFace: "Trebuchet MS", align: "center", italic: true
    }
  );
}

// ── SLIDE 7: IMPLEMENTATION ──────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addText("IMPLEMENTATION", {
    x: 0.5, y: 0.28, w: 5, h: 0.22,
    fontSize: 10, color: CYAN, fontFace: "Trebuchet MS",
    charSpacing: 3, bold: true, margin: 0
  });

  slide.addText("From Zero to Automated in 30 Days", {
    x: 0.5, y: 0.52, w: 9.1, h: 0.65,
    fontSize: 30, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left"
  });

  // Connecting timeline bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 2.55, w: 8.55, h: 0.04,
    fill: { color: BORDER }, line: { color: BORDER }
  });

  const phases = [
    {
      dotX: 1.2, label: "WEEK 1–2", accent: CYAN,
      title: "Discovery & Setup",
      body: "QuickBooks connection established. All four workflows configured to match Carolina Turf's billing rules — maintenance programs, project invoicing, seasonal contracts, and deposit triggers. Every client billing scenario mapped.",
      x: 0.5
    },
    {
      dotX: 4.55, label: "WEEK 3", accent: AMBER,
      title: "Testing & Refinement",
      body: "Live testing with real invoices. Reminder sequences tuned to Carolina Turf's voice and brand standards. Timing, tone, and escalation logic validated. Edge cases handled before go-live.",
      x: 3.55
    },
    {
      dotX: 7.88, label: "WEEK 4", accent: GREEN,
      title: "Go Live",
      body: "Full system active. Dashboard live in Slack. First automated reminder sequences running. AR aging report delivered Monday morning. You're collecting on day one.",
      x: 6.6
    }
  ];

  phases.forEach(p => {
    // Dot on timeline
    slide.addShape(pres.shapes.OVAL, {
      x: p.dotX - 0.12, y: 2.46, w: 0.24, h: 0.24,
      fill: { color: p.accent }, line: { color: p.accent }
    });

    // Week label
    slide.addText(p.label, {
      x: p.x, y: 2.85, w: 2.9, h: 0.25,
      fontSize: 9, bold: true, color: p.accent,
      fontFace: "Trebuchet MS", charSpacing: 2, margin: 0
    });

    // Phase card
    card(slide, p.x, 3.15, 2.9, 2.2, p.accent);

    slide.addText(p.title, {
      x: p.x + 0.15, y: 3.28, w: 2.6, h: 0.45,
      fontSize: 17, bold: true, color: WHITE,
      fontFace: "Trebuchet MS", align: "left", margin: 0
    });
    slide.addText(p.body, {
      x: p.x + 0.15, y: 3.78, w: 2.6, h: 1.42,
      fontSize: 11.5, color: GRAY_LT,
      fontFace: "Trebuchet MS", align: "left", valign: "top", wrap: true, margin: 0
    });
  });

  // Footer note
  slide.addText("You attend one onboarding call. We handle everything else.", {
    x: 0.5, y: 5.22, w: 9.1, h: 0.26,
    fontSize: 12, color: CYAN, fontFace: "Trebuchet MS",
    align: "center", bold: true
  });
}

// ── SLIDE 8: MISSION ALIGNMENT ───────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DEEP };

  slide.addText("WHY THIS MATTERS", {
    x: 0.5, y: 0.28, w: 5, h: 0.22,
    fontSize: 10, color: CYAN, fontFace: "Trebuchet MS",
    charSpacing: 3, bold: true, margin: 0
  });

  slide.addText("13 Years of Excellence Deserves\na Financial System to Match", {
    x: 0.5, y: 0.52, w: 9.1, h: 1.05,
    fontSize: 34, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left"
  });

  // Mission quote card
  card(slide, 0.5, 1.7, 9.1, 0.65, CYAN);
  slide.addText(
    "\" Responsive. Profitable. Professional. \"   —  Carolina Turf Mission",
    {
      x: 0.65, y: 1.82, w: 8.8, h: 0.42,
      fontSize: 16, color: CYAN, fontFace: "Trebuchet MS",
      align: "center", italic: true, bold: false
    }
  );

  // Body
  slide.addText(
    "Carolina Turf has spent 13 years building a reputation for quality, integrity, and client satisfaction across Charlotte metro and beyond. " +
    "You've grown to 8 service lines, 28+ communities, commercial contracts, HOA relationships, and a branded fleet that signals professionalism before anyone picks up a phone.\n\n" +
    "The operational side of this business is already exceptional.\n\n" +
    "LunarLogic installs the financial infrastructure to make sure the revenue from that excellence arrives on time, every time — without anyone on your team having to chase it.\n\n" +
    "Responsive billing. Profitable cash flow. Professional collections — fully automated.",
    {
      x: 0.5, y: 2.5, w: 9.1, h: 2.65,
      fontSize: 14.5, color: GRAY_LT,
      fontFace: "Trebuchet MS", align: "left",
      valign: "top", lineSpacingMultiple: 1.35
    }
  );

  footer(slide);
}

// ── SLIDE 9: NEXT STEPS ──────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addText("NEXT STEPS", {
    x: 0.5, y: 0.28, w: 4, h: 0.22,
    fontSize: 10, color: CYAN, fontFace: "Trebuchet MS",
    charSpacing: 3, bold: true, margin: 0
  });

  slide.addText("Let's Find Out What Your AR Is Actually Worth", {
    x: 0.5, y: 0.52, w: 9.1, h: 0.65,
    fontSize: 30, bold: true, color: WHITE,
    fontFace: "Trebuchet MS", align: "left"
  });

  slide.addText("Three simple steps — the first one costs you 20 minutes.", {
    x: 0.5, y: 1.2, w: 9.1, h: 0.32,
    fontSize: 13, color: GRAY_MD, fontFace: "Trebuchet MS", italic: true
  });

  const steps = [
    {
      num: "01", accent: CYAN,
      title: "AR Audit Call  —  20 Minutes",
      body: "We pull your QuickBooks aging report together on a screen share. You'll see exactly how many dollars are sitting in 30-, 60-, and 90-day buckets before we say another word about solutions."
    },
    {
      num: "02", accent: AMBER,
      title: "Custom ROI Model with Your Actual Numbers",
      body: "We build your specific financial model using your real invoice volume, current DSO, and historical collections data. The numbers in this deck are estimates — we replace them with yours."
    },
    {
      num: "03", accent: GREEN,
      title: "30-Day Installation  —  If It Makes Sense",
      body: "Full system installed in 30 days. Month-to-month engagement. No long-term contract required. 60-day satisfaction guarantee. If it doesn't deliver, you don't pay."
    }
  ];

  steps.forEach((s, i) => {
    const yPos = 1.65 + i * 1.08;
    card(slide, 0.5, yPos, 9.1, 0.95, null);

    // Number circle
    slide.addShape(pres.shapes.OVAL, {
      x: 0.65, y: yPos + 0.16, w: 0.6, h: 0.6,
      fill: { color: s.accent }, line: { color: s.accent }
    });
    slide.addText(s.num, {
      x: 0.65, y: yPos + 0.16, w: 0.6, h: 0.6,
      fontSize: 14, bold: true, color: BG_DARK,
      fontFace: "Trebuchet MS", align: "center", valign: "middle", margin: 0
    });

    // Left accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: yPos, w: 0.06, h: 0.95,
      fill: { color: s.accent }, line: { color: s.accent }
    });

    slide.addText(s.title, {
      x: 1.4, y: yPos + 0.06, w: 7.95, h: 0.36,
      fontSize: 16, bold: true, color: WHITE,
      fontFace: "Trebuchet MS", align: "left", margin: 0
    });
    slide.addText(s.body, {
      x: 1.4, y: yPos + 0.45, w: 7.95, h: 0.42,
      fontSize: 12, color: GRAY_LT,
      fontFace: "Trebuchet MS", align: "left", valign: "top", margin: 0, wrap: true
    });
  });

  // Contact bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 5.0, w: 9.1, h: 0.48,
    fill: { color: BG_CARD2 }, line: { color: CYAN_DIM, width: 0.75 }
  });
  slide.addText(
    "Jonathan Rodriguez  ·  LunarLogic  ·  jrodriguez@lunarlogic.ai  ·  lunarlogic.ai",
    {
      x: 0.55, y: 5.05, w: 9.0, h: 0.38,
      fontSize: 13, color: CYAN, fontFace: "Trebuchet MS", align: "center"
    }
  );
}

// ── WRITE FILE ────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "LunarLogic_CarolinaTurf_PitchDeck.pptx" })
  .then(() => console.log("✅ Saved: LunarLogic_CarolinaTurf_PitchDeck.pptx"))
  .catch(err => { console.error("ERROR:", err); process.exit(1); });
