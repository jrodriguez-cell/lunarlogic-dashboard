const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "LunarLogic — Carolina Turf AR Automation";
pres.author = "Jonathan Rodriguez";

// Color constants (no # prefix)
const GREEN = "1B4332";
const GREEN_MID = "2D6A4F";
const GREEN_LIGHT = "40916C";
const GOLD = "D4A017";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "F1F5F2";
const DARK_TEXT = "1A1A1A";
const MID_GRAY = "6B7280";

function footerLL(slide) {
  slide.addText("LunarLogic  |  AR Automation for Service Businesses", {
    x: 0.4, y: 5.25, w: 9.2, h: 0.3,
    fontSize: 9, color: MID_GRAY, align: "center",
    fontFace: "Calibri", italic: true
  });
}

// ─── SLIDE 1: COVER ───────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: GREEN };

  // Gold accent bar on left
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625,
    fill: { color: GOLD }, line: { color: GOLD }
  });

  // Main title
  slide.addText("Reclaim What\nYou've Already Earned", {
    x: 0.55, y: 1.1, w: 8.8, h: 1.8,
    fontSize: 44, bold: true, color: WHITE, fontFace: "Calibri",
    align: "left", valign: "top"
  });

  // Subtitle
  slide.addText("A Custom AR Automation System for Carolina Turf Lawn and Landscape", {
    x: 0.55, y: 3.05, w: 8.0, h: 0.7,
    fontSize: 18, color: GOLD, fontFace: "Calibri",
    align: "left", bold: false, italic: true
  });

  // Divider line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 3.85, w: 3.5, h: 0.04,
    fill: { color: "40916C" }, line: { color: "40916C" }
  });

  // Presenter / date placeholders
  slide.addText([
    { text: "Presented by: ", options: { bold: false } },
    { text: "Jonathan Rodriguez", options: { bold: true } }
  ], { x: 0.55, y: 4.05, w: 5, h: 0.3, fontSize: 13, color: WHITE, fontFace: "Calibri" });

  slide.addText("LunarLogic  ·  jrodriguez@lunarlogic.ai  ·  [Date]", {
    x: 0.55, y: 4.42, w: 8, h: 0.25,
    fontSize: 11, color: "95B5A4", fontFace: "Calibri"
  });
}

// ─── SLIDE 2: THE PROBLEM ─────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addText("You Deliver Excellence.\nYou Shouldn't Have to Wait to Get Paid.", {
    x: 0.45, y: 0.3, w: 9.1, h: 0.95,
    fontSize: 28, bold: true, color: GREEN, fontFace: "Calibri", align: "left"
  });

  slide.addText(
    "Carolina Turf runs 8 service lines, serves HOAs, commercial properties, and homeowners across 28+ communities. " +
    "That operational complexity shouldn't mean delayed cash flow. These three patterns keep showing up in landscaping companies your size:",
    {
      x: 0.45, y: 1.3, w: 9.1, h: 0.55,
      fontSize: 13, color: MID_GRAY, fontFace: "Calibri", align: "left"
    }
  );

  const cols = [
    {
      x: 0.45, icon: "⏱", accent: GREEN,
      title: "50+ Days to Collect",
      body: "HOA boards and commercial clients run their own AP schedules — 30, 45, even 60-day payment terms are standard. You've already delivered the work, but the cash won't land for weeks."
    },
    {
      x: 3.75, icon: "🗂", accent: GREEN_MID,
      title: "Manual Follow-Up",
      body: "Your office team is talented and stretched thin. Collections calls happen when someone has bandwidth — which means some invoices age silently while your staff handles everything else."
    },
    {
      x: 7.05, icon: "🔍", accent: GOLD,
      title: "Invisible Leakage",
      body: "Project deposits not invoiced at signing. Crew completes a job Tuesday; invoice goes out Friday. Small gaps that, multiplied across 150–250 invoices per month, add real dollars to your DSO."
    }
  ];

  cols.forEach(col => {
    // Card background
    slide.addShape(pres.shapes.RECTANGLE, {
      x: col.x, y: 1.95, w: 2.85, h: 3.1,
      fill: { color: LIGHT_GRAY }, line: { color: "E5E7EB", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.08 }
    });
    // Top accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: col.x, y: 1.95, w: 2.85, h: 0.07,
      fill: { color: col.accent }, line: { color: col.accent }
    });
    // Icon
    slide.addText(col.icon, {
      x: col.x + 0.15, y: 2.1, w: 0.6, h: 0.55,
      fontSize: 28, align: "left", fontFace: "Calibri"
    });
    // Title
    slide.addText(col.title, {
      x: col.x + 0.15, y: 2.7, w: 2.55, h: 0.45,
      fontSize: 15, bold: true, color: GREEN, fontFace: "Calibri", align: "left"
    });
    // Body
    slide.addText(col.body, {
      x: col.x + 0.15, y: 3.2, w: 2.55, h: 1.7,
      fontSize: 12, color: DARK_TEXT, fontFace: "Calibri", align: "left",
      valign: "top", wrap: true
    });
  });

  footerLL(slide);
}

// ─── SLIDE 3: COST OF THE PROBLEM ─────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: GREEN };

  slide.addText("What Slow AR Is Actually Costing Carolina Turf", {
    x: 0.45, y: 0.28, w: 9.1, h: 0.7,
    fontSize: 30, bold: true, color: WHITE, fontFace: "Calibri", align: "left"
  });

  // Hero stat box
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 1.1, w: 9.1, h: 1.35,
    fill: { color: GREEN_MID }, line: { color: GREEN_LIGHT, width: 1 },
    shadow: { type: "outer", color: "000000", blur: 10, offset: 3, angle: 135, opacity: 0.2 }
  });
  slide.addText("$328,767", {
    x: 0.6, y: 1.18, w: 4.2, h: 0.75,
    fontSize: 56, bold: true, color: GOLD, fontFace: "Calibri", align: "left", margin: 0
  });
  slide.addText("Currently locked in open receivables — money you've earned but haven't collected", {
    x: 0.6, y: 1.95, w: 8.7, h: 0.38,
    fontSize: 14, color: WHITE, fontFace: "Calibri", align: "left", italic: true, margin: 0
  });

  // Supporting stats — 3 cards + bottom line
  const stats = [
    { val: "$62,500", label: "in unbilled or\nlost revenue annually", x: 0.45 },
    { val: "$11,700", label: "in staff time spent on\nmanual collections each year", x: 3.62 },
    { val: "$11,250", label: "lost to bad debt\nannually", x: 6.78 }
  ];

  stats.forEach(s => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: s.x, y: 2.65, w: 2.9, h: 1.45,
      fill: { color: "163326" }, line: { color: GREEN_LIGHT, width: 1 }
    });
    slide.addText(s.val, {
      x: s.x + 0.12, y: 2.72, w: 2.66, h: 0.6,
      fontSize: 32, bold: true, color: GOLD, fontFace: "Calibri", align: "left", margin: 0
    });
    slide.addText(s.label, {
      x: s.x + 0.12, y: 3.35, w: 2.66, h: 0.65,
      fontSize: 12, color: WHITE, fontFace: "Calibri", align: "left", margin: 0
    });
  });

  // Bottom summary line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 4.25, w: 9.1, h: 0.72,
    fill: { color: GOLD }, line: { color: GOLD }
  });
  slide.addText(
    "That's $263,532 working against you every year — not from lack of revenue, from lack of collection systems.",
    {
      x: 0.6, y: 4.3, w: 8.8, h: 0.6,
      fontSize: 14, bold: true, color: GREEN, fontFace: "Calibri", align: "center"
    }
  );

  // Footer (light version)
  slide.addText("LunarLogic  |  AR Automation for Service Businesses", {
    x: 0.4, y: 5.25, w: 9.2, h: 0.3,
    fontSize: 9, color: "95B5A4", align: "center", fontFace: "Calibri", italic: true
  });
}

// ─── SLIDE 4: HOW IT WORKS ────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addText("The LunarLogic AR Automation System", {
    x: 0.45, y: 0.28, w: 9.1, h: 0.6,
    fontSize: 30, bold: true, color: GREEN, fontFace: "Calibri", align: "left"
  });

  slide.addText("Four automated workflows that run inside QuickBooks Online — no new software, no training required.", {
    x: 0.45, y: 0.92, w: 9.1, h: 0.38,
    fontSize: 14, color: MID_GRAY, fontFace: "Calibri", align: "left"
  });

  const steps = [
    {
      num: "01", label: "WF1", title: "Invoice Created\nAutomatically",
      body: "Triggered at job completion. No human touchpoint needed — the invoice builds itself.",
      color: GREEN, x: 0.3
    },
    {
      num: "02", label: "WF2", title: "Reminders Sent\non Schedule",
      body: "Day 1, 7, 14, 30 past due. Escalating tone. Email + SMS via Twilio. Always on.",
      color: GREEN_MID, x: 2.65
    },
    {
      num: "03", label: "WF3", title: "Payment Link\nDelivered",
      body: "One tap to pay. No login, no friction. Embedded in every reminder automatically.",
      color: GREEN_LIGHT, x: 4.98
    },
    {
      num: "04", label: "WF4", title: "You See\nEverything",
      body: "Live AR aging dashboard. Monday morning Slack report. Full visibility, zero effort.",
      color: GOLD, x: 7.32
    }
  ];

  steps.forEach((s, i) => {
    const cardW = 2.35;
    // Card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: s.x, y: 1.48, w: cardW, h: 3.55,
      fill: { color: LIGHT_GRAY }, line: { color: "E5E7EB", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.08 }
    });
    // Top color bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: s.x, y: 1.48, w: cardW, h: 0.1,
      fill: { color: s.color }, line: { color: s.color }
    });
    // Step number
    slide.addText(s.num, {
      x: s.x + 0.12, y: 1.65, w: 0.7, h: 0.6,
      fontSize: 36, bold: true, color: s.color === GOLD ? GOLD : s.color,
      fontFace: "Calibri", align: "left", margin: 0
    });
    // Workflow label
    slide.addText(s.label, {
      x: s.x + 0.82, y: 1.75, w: 1.4, h: 0.35,
      fontSize: 10, color: MID_GRAY, fontFace: "Calibri",
      align: "left", bold: true, margin: 0
    });
    // Title
    slide.addText(s.title, {
      x: s.x + 0.12, y: 2.3, w: 2.1, h: 0.75,
      fontSize: 16, bold: true, color: GREEN, fontFace: "Calibri",
      align: "left", valign: "top", margin: 0
    });
    // Body
    slide.addText(s.body, {
      x: s.x + 0.12, y: 3.15, w: 2.12, h: 1.65,
      fontSize: 12, color: DARK_TEXT, fontFace: "Calibri",
      align: "left", valign: "top", wrap: true, margin: 0
    });

    // Arrow between cards
    if (i < 3) {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: s.x + cardW + 0.04, y: 3.1, w: 0.18, h: 0.04,
        fill: { color: GREEN_LIGHT }, line: { color: GREEN_LIGHT }
      });
      // Arrow head approximation using text
      slide.addText("▶", {
        x: s.x + cardW + 0.12, y: 2.98, w: 0.2, h: 0.28,
        fontSize: 12, color: GREEN_LIGHT, fontFace: "Calibri", align: "center", margin: 0
      });
    }
  });

  // Footer note
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 5.1, w: 9.4, h: 0.35,
    fill: { color: "EEF4F0" }, line: { color: "D1E8DB", width: 1 }
  });
  slide.addText("Runs inside QuickBooks Online. Nothing new to learn. No new software to manage.", {
    x: 0.4, y: 5.15, w: 9.2, h: 0.26,
    fontSize: 11, color: GREEN, fontFace: "Calibri", align: "center", bold: true
  });
}

// ─── SLIDE 5: DONE FOR YOU ────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addText("We Don't Sell You Software. We Run Your AR.", {
    x: 0.45, y: 0.28, w: 9.1, h: 0.65,
    fontSize: 30, bold: true, color: GREEN, fontFace: "Calibri", align: "left"
  });

  // Two column headers
  // Without column
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.05, w: 4.4, h: 0.52,
    fill: { color: "4B0000" }, line: { color: "4B0000" }
  });
  slide.addText("✗  WITHOUT LunarLogic", {
    x: 0.4, y: 1.05, w: 4.4, h: 0.52,
    fontSize: 16, bold: true, color: WHITE, fontFace: "Calibri", align: "center"
  });

  // With column
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.05, w: 4.4, h: 0.52,
    fill: { color: GREEN }, line: { color: GREEN }
  });
  slide.addText("✓  WITH LunarLogic", {
    x: 5.2, y: 1.05, w: 4.4, h: 0.52,
    fontSize: 16, bold: true, color: WHITE, fontFace: "Calibri", align: "center"
  });

  const rows = [
    ["Manual invoice creation after every job", "Automated invoice triggers at job completion"],
    ["Forgotten follow-ups when staff is stretched", "Systematic reminder sequences — Day 1, 7, 14, 30"],
    ["Uncomfortable collections calls to clients", "Payment links do the asking — professionally, automatically"],
    ["No real-time visibility into AR health", "Live dashboard every Monday morning in Slack"],
    ["Staff time wasted chasing open invoices", "Staff focused on clients, crews, and growth"],
  ];

  rows.forEach((row, i) => {
    const yPos = 1.73 + i * 0.65;
    const bg = i % 2 === 0 ? "FAFAFA" : WHITE;

    // Left cell
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.4, y: yPos, w: 4.4, h: 0.58,
      fill: { color: bg }, line: { color: "E5E7EB", width: 1 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.4, y: yPos, w: 0.08, h: 0.58,
      fill: { color: "990000" }, line: { color: "990000" }
    });
    slide.addText(row[0], {
      x: 0.6, y: yPos + 0.06, w: 4.1, h: 0.46,
      fontSize: 13, color: "5C1A1A", fontFace: "Calibri", align: "left", valign: "middle"
    });

    // Right cell
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.2, y: yPos, w: 4.4, h: 0.58,
      fill: { color: bg }, line: { color: "E5E7EB", width: 1 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.2, y: yPos, w: 0.08, h: 0.58,
      fill: { color: GREEN_LIGHT }, line: { color: GREEN_LIGHT }
    });
    slide.addText(row[1], {
      x: 5.4, y: yPos + 0.06, w: 4.1, h: 0.46,
      fontSize: 13, color: GREEN, fontFace: "Calibri", align: "left", valign: "middle", bold: true
    });
  });

  footerLL(slide);
}

// ─── SLIDE 6: ROI ─────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: GREEN };

  slide.addText("The Numbers for Carolina Turf", {
    x: 0.45, y: 0.25, w: 9.1, h: 0.65,
    fontSize: 32, bold: true, color: WHITE, fontFace: "Calibri", align: "left"
  });

  // DSO transformation block
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 1.0, w: 9.1, h: 1.15,
    fill: { color: GREEN_MID }, line: { color: GREEN_LIGHT, width: 1 }
  });
  slide.addText("DSO:", {
    x: 0.65, y: 1.08, w: 0.85, h: 0.5,
    fontSize: 16, color: "95B5A4", fontFace: "Calibri", bold: true, align: "left", margin: 0
  });
  slide.addText("48 days", {
    x: 1.5, y: 1.05, w: 1.8, h: 0.6,
    fontSize: 32, color: WHITE, fontFace: "Calibri", bold: true, align: "left", margin: 0
  });
  slide.addText("→", {
    x: 3.3, y: 1.08, w: 0.5, h: 0.55,
    fontSize: 28, color: GOLD, fontFace: "Calibri", align: "center", margin: 0
  });
  slide.addText("22 days", {
    x: 3.8, y: 1.05, w: 1.8, h: 0.6,
    fontSize: 32, color: GOLD, fontFace: "Calibri", bold: true, align: "left", margin: 0
  });
  slide.addText("26-day reduction in days sales outstanding", {
    x: 5.65, y: 1.15, w: 3.7, h: 0.45,
    fontSize: 13, color: "95B5A4", fontFace: "Calibri", italic: true, align: "right", margin: 0
  });

  // Four metric cards
  const metrics = [
    { label: "Working Capital Released", val: "$178,082", note: "cash freed in Year 1", color: GOLD, x: 0.45 },
    { label: "Total Year 1 Value", val: "$263,532", note: "working capital + savings + bad debt", color: WHITE, x: 2.82 },
    { label: "LunarLogic Investment", val: "$12,000", note: "$1,000/month, no long-term contract", color: "95B5A4", x: 5.18 },
    { label: "Year 1 ROI", val: "22x", note: "return on investment", color: GOLD, x: 7.55 }
  ];

  metrics.forEach(m => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: m.x, y: 2.3, w: 2.2, h: 2.3,
      fill: { color: "163326" }, line: { color: GREEN_LIGHT, width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.2 }
    });
    slide.addText(m.label, {
      x: m.x + 0.12, y: 2.38, w: 1.96, h: 0.5,
      fontSize: 11, color: "95B5A4", fontFace: "Calibri", align: "left", bold: true, margin: 0
    });
    slide.addText(m.val, {
      x: m.x + 0.12, y: 2.88, w: 1.96, h: 0.85,
      fontSize: 34, color: m.color, fontFace: "Calibri", bold: true, align: "left", margin: 0
    });
    slide.addText(m.note, {
      x: m.x + 0.12, y: 3.78, w: 1.96, h: 0.6,
      fontSize: 10.5, color: "6B9E84", fontFace: "Calibri", align: "left", italic: true, margin: 0
    });
  });

  // Sub-line
  slide.addText(
    "This is not projected revenue. This is money you've already earned — collected faster.",
    {
      x: 0.45, y: 4.78, w: 9.1, h: 0.38,
      fontSize: 14, color: GOLD, fontFace: "Calibri", align: "center", italic: true, bold: false
    }
  );

  // Footer light
  slide.addText("LunarLogic  |  AR Automation for Service Businesses", {
    x: 0.4, y: 5.25, w: 9.2, h: 0.3,
    fontSize: 9, color: "95B5A4", align: "center", fontFace: "Calibri", italic: true
  });
}

// ─── SLIDE 7: IMPLEMENTATION ──────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addText("From Zero to Automated in 30 Days", {
    x: 0.45, y: 0.28, w: 9.1, h: 0.65,
    fontSize: 30, bold: true, color: GREEN, fontFace: "Calibri", align: "left"
  });

  // Timeline bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 1.08, w: 9.1, h: 0.12,
    fill: { color: "D1E8DB" }, line: { color: "D1E8DB" }
  });

  const phases = [
    {
      label: "WEEK 1–2", title: "Discovery & Setup",
      body: "QuickBooks connection established. Workflow configuration built to match Carolina Turf's billing rules — maintenance programs, project invoicing, seasonal contracts. Billing triggers mapped.",
      x: 0.45, dotX: 0.9, color: GREEN
    },
    {
      label: "WEEK 3", title: "Testing & Refinement",
      body: "Live testing with real invoices. Reminder sequences tuned to Carolina Turf's voice and brand. Timing, tone, and escalation logic confirmed. Edge cases handled.",
      x: 3.55, dotX: 4.78, color: GREEN_MID
    },
    {
      label: "WEEK 4", title: "Go Live",
      body: "Full system active. Dashboard live in Slack. First automated reminder sequences running. AR aging report delivered Monday morning.",
      x: 6.65, dotX: 8.65, color: GOLD
    }
  ];

  phases.forEach(p => {
    // Dot on timeline
    slide.addShape(pres.shapes.OVAL, {
      x: p.dotX - 0.15, y: 1.0, w: 0.28, h: 0.28,
      fill: { color: p.color }, line: { color: p.color }
    });
    // Week label
    slide.addText(p.label, {
      x: p.x, y: 1.35, w: 2.9, h: 0.32,
      fontSize: 11, bold: true, color: p.color, fontFace: "Calibri", align: "left"
    });
    // Phase card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: p.x, y: 1.72, w: 2.9, h: 3.0,
      fill: { color: LIGHT_GRAY }, line: { color: "E5E7EB", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.07 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: p.x, y: 1.72, w: 2.9, h: 0.09,
      fill: { color: p.color }, line: { color: p.color }
    });
    slide.addText(p.title, {
      x: p.x + 0.15, y: 1.88, w: 2.6, h: 0.5,
      fontSize: 17, bold: true, color: GREEN, fontFace: "Calibri", align: "left"
    });
    slide.addText(p.body, {
      x: p.x + 0.15, y: 2.45, w: 2.6, h: 2.1,
      fontSize: 12.5, color: DARK_TEXT, fontFace: "Calibri", align: "left", valign: "top", wrap: true
    });
  });

  // Footer bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 4.9, w: 9.4, h: 0.45,
    fill: { color: "EEF4F0" }, line: { color: "D1E8DB", width: 1 }
  });
  slide.addText("You attend one onboarding call. We handle everything else.", {
    x: 0.4, y: 4.97, w: 9.2, h: 0.3,
    fontSize: 13, color: GREEN, fontFace: "Calibri", align: "center", bold: true
  });
}

// ─── SLIDE 8: MISSION ALIGNMENT ───────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: GREEN };

  slide.addText("13 Years of Excellence Deserves a Financial System to Match", {
    x: 0.45, y: 0.28, w: 9.1, h: 0.88,
    fontSize: 28, bold: true, color: WHITE, fontFace: "Calibri", align: "left"
  });

  // Mission banner
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 1.28, w: 9.1, h: 0.58,
    fill: { color: GREEN_MID }, line: { color: GREEN_LIGHT, width: 1 }
  });
  slide.addText('"Responsive. Profitable. Professional."  — Carolina Turf Mission', {
    x: 0.6, y: 1.32, w: 8.8, h: 0.5,
    fontSize: 16, color: GOLD, fontFace: "Calibri", align: "center", italic: true, bold: true
  });

  // Body text
  slide.addText(
    "Carolina Turf has spent 13 years building a reputation for quality, integrity, and client satisfaction across Charlotte metro and beyond. " +
    "You've grown to 8 service lines, 28+ communities, commercial contracts, HOA relationships, and a branded fleet that signals professionalism before anyone picks up a phone.\n\n" +
    "The operational side is already exceptional.\n\n" +
    "LunarLogic installs the financial infrastructure to make sure the revenue from that excellence arrives on time, every time — without anyone on your team having to chase it.\n\n" +
    "Responsive billing. Profitable cash flow. Professional collections — automated.",
    {
      x: 0.55, y: 2.02, w: 8.9, h: 3.0,
      fontSize: 14.5, color: WHITE, fontFace: "Calibri", align: "left",
      valign: "top", lineSpacingMultiple: 1.3
    }
  );

  // Footer
  slide.addText("LunarLogic  |  AR Automation for Service Businesses", {
    x: 0.4, y: 5.25, w: 9.2, h: 0.3,
    fontSize: 9, color: "95B5A4", align: "center", fontFace: "Calibri", italic: true
  });
}

// ─── SLIDE 9: NEXT STEPS ──────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addText("Let's Find Out What Your AR Is Actually Worth", {
    x: 0.45, y: 0.28, w: 9.1, h: 0.7,
    fontSize: 30, bold: true, color: GREEN, fontFace: "Calibri", align: "left"
  });

  slide.addText("Three simple steps — the first one costs you 20 minutes.", {
    x: 0.45, y: 1.02, w: 9.1, h: 0.38,
    fontSize: 14, color: MID_GRAY, fontFace: "Calibri", align: "left", italic: true
  });

  const steps = [
    {
      num: "1", title: "AR Audit Call — 20 Minutes",
      body: "We pull your QuickBooks aging report together on a screen share. You'll see exactly how many dollars are sitting in 30-, 60-, and 90-day buckets before we say another word about solutions.",
      color: GREEN
    },
    {
      num: "2", title: "Custom ROI Model",
      body: "We build your specific financial model using your actual invoice volume, current DSO, and historical collections data. The numbers in this deck are estimates — we'll replace them with yours.",
      color: GREEN_MID
    },
    {
      num: "3", title: "30-Day Installation — If It Makes Sense",
      body: "If the numbers work, we install the full system in 30 days. Month-to-month engagement. No long-term contract required. 60-day satisfaction guarantee.",
      color: GOLD
    }
  ];

  steps.forEach((s, i) => {
    const yPos = 1.6 + i * 1.15;
    slide.addShape(pres.shapes.OVAL, {
      x: 0.45, y: yPos + 0.12, w: 0.62, h: 0.62,
      fill: { color: s.color }, line: { color: s.color }
    });
    slide.addText(s.num, {
      x: 0.45, y: yPos + 0.12, w: 0.62, h: 0.62,
      fontSize: 22, bold: true, color: WHITE, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.25, y: yPos, w: 8.25, h: 0.9,
      fill: { color: LIGHT_GRAY }, line: { color: "E5E7EB", width: 1 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.25, y: yPos, w: 0.08, h: 0.9,
      fill: { color: s.color }, line: { color: s.color }
    });
    slide.addText(s.title, {
      x: 1.45, y: yPos + 0.04, w: 2.6, h: 0.38,
      fontSize: 15, bold: true, color: s.color === GOLD ? "7A5C00" : GREEN,
      fontFace: "Calibri", align: "left", margin: 0
    });
    slide.addText(s.body, {
      x: 1.45, y: yPos + 0.42, w: 7.9, h: 0.45,
      fontSize: 12, color: DARK_TEXT, fontFace: "Calibri", align: "left", valign: "top", margin: 0, wrap: true
    });
  });

  // Contact card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 5.0, w: 9.1, h: 0.55,
    fill: { color: GREEN }, line: { color: GREEN }
  });
  slide.addText(
    "Jonathan Rodriguez  ·  LunarLogic  ·  jrodriguez@lunarlogic.ai  ·  [Phone]",
    {
      x: 0.55, y: 5.05, w: 9.0, h: 0.45,
      fontSize: 13, color: WHITE, fontFace: "Calibri", align: "center", bold: false
    }
  );
}

// ─── WRITE FILE ───────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "LunarLogic_CarolinaTurf_PitchDeck.pptx" })
  .then(() => console.log("✅ Saved: LunarLogic_CarolinaTurf_PitchDeck.pptx"))
  .catch(err => { console.error("ERROR:", err); process.exit(1); });
