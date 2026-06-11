from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import BalancedColumns
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "DSO_Webinar_Episode1_Script.pdf")

# ── Color palette ──────────────────────────────────────────────────────────────
NAVY       = colors.HexColor("#0D1B2A")
SLATE      = colors.HexColor("#1E2D40")
ACCENT     = colors.HexColor("#00B4D8")
GOLD       = colors.HexColor("#F4A261")
LIGHT_GRAY = colors.HexColor("#E8EDF2")
MID_GRAY   = colors.HexColor("#8A9BB0")
WHITE      = colors.white

def build_styles():
    base = getSampleStyleSheet()

    styles = {}

    styles["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName="Helvetica-Bold",
        fontSize=34,
        textColor=WHITE,
        alignment=TA_CENTER,
        spaceAfter=10,
        leading=40,
    )
    styles["cover_sub"] = ParagraphStyle(
        "cover_sub",
        fontName="Helvetica",
        fontSize=16,
        textColor=ACCENT,
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    styles["cover_meta"] = ParagraphStyle(
        "cover_meta",
        fontName="Helvetica",
        fontSize=11,
        textColor=MID_GRAY,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    styles["section_header"] = ParagraphStyle(
        "section_header",
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=ACCENT,
        spaceBefore=18,
        spaceAfter=6,
        borderPad=4,
    )
    styles["segment_label"] = ParagraphStyle(
        "segment_label",
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=GOLD,
        spaceBefore=14,
        spaceAfter=4,
    )
    styles["time_tag"] = ParagraphStyle(
        "time_tag",
        fontName="Helvetica-Oblique",
        fontSize=10,
        textColor=MID_GRAY,
        spaceBefore=2,
        spaceAfter=2,
    )
    styles["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=11,
        textColor=colors.HexColor("#1A1A2E"),
        leading=17,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
    )
    styles["script"] = ParagraphStyle(
        "script",
        fontName="Helvetica",
        fontSize=11,
        textColor=colors.HexColor("#1A1A2E"),
        leading=18,
        spaceAfter=10,
        leftIndent=18,
        alignment=TA_JUSTIFY,
    )
    styles["callout"] = ParagraphStyle(
        "callout",
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=NAVY,
        leading=18,
        spaceAfter=6,
        leftIndent=12,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet",
        fontName="Helvetica",
        fontSize=11,
        textColor=colors.HexColor("#1A1A2E"),
        leading=17,
        spaceAfter=5,
        leftIndent=24,
        bulletIndent=8,
    )
    styles["note"] = ParagraphStyle(
        "note",
        fontName="Helvetica-Oblique",
        fontSize=10,
        textColor=MID_GRAY,
        leading=15,
        spaceAfter=6,
        leftIndent=18,
    )
    styles["toc_head"] = ParagraphStyle(
        "toc_head",
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=ACCENT,
        spaceBefore=4,
        spaceAfter=2,
    )
    styles["toc_item"] = ParagraphStyle(
        "toc_item",
        fontName="Helvetica",
        fontSize=11,
        textColor=colors.HexColor("#1A1A2E"),
        leading=18,
        leftIndent=12,
    )
    return styles


def accent_box(content_paragraphs, bg=LIGHT_GRAY, border=ACCENT):
    data = [[p] for p in content_paragraphs]
    flat = [[content_paragraphs]]
    t = Table(flat, colWidths=[6.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINECOLOR",  (0, 0), (-1, -1), border),
        ("BOX",        (0, 0), (-1, -1), 2, border),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def cover_table(styles):
    inner = [
        Paragraph("DSO DECODED", styles["cover_title"]),
        Paragraph("Why Days Sales Outstanding Is the Most Important<br/>Number in Your Business", styles["cover_sub"]),
        Spacer(1, 0.15 * inch),
        Paragraph("Episode 1 of the LunarLogic AR Mastery Series", styles["cover_meta"]),
        Paragraph("Webinar Script &amp; Presenter Guide — 30 Minutes", styles["cover_meta"]),
        Spacer(1, 0.15 * inch),
        Paragraph("Presented by LunarLogic  |  jrodriguez@lunarlogic.ai", styles["cover_meta"]),
        Paragraph("Series: Accounts Receivable Intelligence for Growing Businesses", styles["cover_meta"]),
    ]
    t = Table([[inner]], colWidths=[7.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
        ("TOPPADDING",    (0, 0), (-1, -1), 48),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 48),
        ("LEFTPADDING",   (0, 0), (-1, -1), 36),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 36),
    ]))
    return t


def formula_table(styles):
    header = [
        Paragraph("DSO Formula", ParagraphStyle(
            "fh", fontName="Helvetica-Bold", fontSize=13,
            textColor=NAVY, alignment=TA_CENTER)),
    ]
    row1 = [Paragraph(
        "<b>DSO  =  (Accounts Receivable ÷ Total Credit Sales)  ×  Number of Days</b>",
        ParagraphStyle("ff", fontName="Helvetica-Bold", fontSize=12,
                       textColor=ACCENT, alignment=TA_CENTER, leading=20)
    )]
    row2 = [Paragraph(
        "Example: $150,000 AR  ÷  $600,000 monthly credit sales  ×  30 days  =  <b>7.5 DSO</b>",
        ParagraphStyle("fe", fontName="Helvetica", fontSize=11,
                       textColor=colors.HexColor("#1A1A2E"), alignment=TA_CENTER, leading=16)
    )]
    data = [header, row1, [Spacer(1, 4)], row2]
    t = Table(data, colWidths=[6.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), LIGHT_GRAY),
        ("BOX",           (0, 0), (-1, -1), 2, ACCENT),
        ("LINEBELOW",     (0, 0), (-1, 0), 1, ACCENT),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
    ]))
    return t


def benchmark_table(styles):
    header_style = ParagraphStyle("bh", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=WHITE, alignment=TA_CENTER)
    cell_style   = ParagraphStyle("bc", fontName="Helvetica", fontSize=11,
                                  textColor=colors.HexColor("#1A1A2E"), alignment=TA_CENTER, leading=16)
    good_style   = ParagraphStyle("bg", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=colors.HexColor("#2D6A4F"), alignment=TA_CENTER, leading=16)
    warn_style   = ParagraphStyle("bw", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=colors.HexColor("#E76F51"), alignment=TA_CENTER, leading=16)

    data = [
        [Paragraph("DSO Range", header_style),
         Paragraph("What It Signals", header_style),
         Paragraph("Cash Impact", header_style)],
        [Paragraph("< 30 days", good_style),
         Paragraph("Excellent collection efficiency", cell_style),
         Paragraph("Strong cash runway", cell_style)],
        [Paragraph("30–45 days", cell_style),
         Paragraph("Healthy, industry-average", cell_style),
         Paragraph("Manageable working capital", cell_style)],
        [Paragraph("45–60 days", warn_style),
         Paragraph("Friction in the process", cell_style),
         Paragraph("Beginning to strain operations", cell_style)],
        [Paragraph("60–90 days", warn_style),
         Paragraph("Collections breakdown", cell_style),
         Paragraph("Borrowing to fund operations", cell_style)],
        [Paragraph("> 90 days", warn_style),
         Paragraph("Crisis territory", cell_style),
         Paragraph("Existential cash-flow risk", cell_style)],
    ]
    col_w = [1.6 * inch, 2.9 * inch, 2.0 * inch]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), NAVY),
        ("BACKGROUND",    (0, 1), (-1, 1), colors.HexColor("#D8F3DC")),
        ("BACKGROUND",    (0, 2), (-1, 2), LIGHT_GRAY),
        ("BACKGROUND",    (0, 3), (-1, 3), colors.HexColor("#FFF3E0")),
        ("BACKGROUND",    (0, 4), (-1, 4), colors.HexColor("#FFE0D0")),
        ("BACKGROUND",    (0, 5), (-1, 5), colors.HexColor("#FFCDD2")),
        ("BOX",           (0, 0), (-1, -1), 1, MID_GRAY),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def ai_impact_table(styles):
    header_style = ParagraphStyle("aih", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=WHITE, alignment=TA_CENTER)
    cell_l = ParagraphStyle("ail", fontName="Helvetica", fontSize=11,
                             textColor=colors.HexColor("#1A1A2E"), leading=16)
    cell_c = ParagraphStyle("aic", fontName="Helvetica", fontSize=11,
                             textColor=colors.HexColor("#1A1A2E"), alignment=TA_CENTER, leading=16)
    bold_c = ParagraphStyle("aib", fontName="Helvetica-Bold", fontSize=11,
                             textColor=colors.HexColor("#2D6A4F"), alignment=TA_CENTER, leading=16)
    data = [
        [Paragraph("AI / Automation Layer", header_style),
         Paragraph("DSO Driver It Fixes", header_style),
         Paragraph("Typical DSO Reduction", header_style)],
        [Paragraph("AI invoice generation & instant delivery", cell_l),
         Paragraph("Invoice lag", cell_c),
         Paragraph("3–8 days", bold_c)],
        [Paragraph("Automated payment reminder sequences", cell_l),
         Paragraph("Reminder gap / inconsistency", cell_c),
         Paragraph("5–10 days", bold_c)],
        [Paragraph("Intelligent cash application (fuzzy match)", cell_l),
         Paragraph("Unapplied payment limbo", cell_c),
         Paragraph("2–5 days", bold_c)],
        [Paragraph("Real-time AR aging dashboard", cell_l),
         Paragraph("Visibility blind spots", cell_c),
         Paragraph("2–4 days (behavioral)", bold_c)],
        [Paragraph("Proactive dispute detection", cell_l),
         Paragraph("Unresolved disputes blocking payment", cell_c),
         Paragraph("4–7 days", bold_c)],
        [Paragraph("Combined LunarLogic stack", cell_l),
         Paragraph("All of the above", cell_c),
         Paragraph("15–25 days", bold_c)],
    ]
    col_w = [2.8 * inch, 2.1 * inch, 1.6 * inch]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [LIGHT_GRAY, WHITE]),
        ("BACKGROUND",    (0, 6), (-1, 6), colors.HexColor("#D8F3DC")),
        ("BOX",           (0, 0), (-1, -1), 1, MID_GRAY),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def series_table(styles):
    header_style = ParagraphStyle("sh", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=WHITE, alignment=TA_CENTER)
    ep_style = ParagraphStyle("se", fontName="Helvetica-Bold", fontSize=11,
                               textColor=ACCENT, alignment=TA_CENTER)
    title_style = ParagraphStyle("st", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=colors.HexColor("#1A1A2E"), leading=16)
    desc_style = ParagraphStyle("sd", fontName="Helvetica", fontSize=10,
                                 textColor=MID_GRAY, leading=14)

    def cell(title, desc):
        return [Paragraph(title, title_style), Paragraph(desc, desc_style)]

    data = [
        [Paragraph("Ep.", header_style),
         Paragraph("Title", header_style),
         Paragraph("Core Question Answered", header_style)],
        [Paragraph("1 ✓", ep_style),
         cell("DSO Decoded",
              "Why it's the most important AR metric"),
         Paragraph("What is DSO and why should I care?", desc_style)],
        [Paragraph("2", ep_style),
         cell("The 5 DSO Killers",
              "Diagnosing what's breaking your cash cycle"),
         Paragraph("What's making my number high?", desc_style)],
        [Paragraph("3", ep_style),
         cell("Automating Reminders That Actually Work",
              "Behavioral science + AI sequencing"),
         Paragraph("How do I get customers to pay faster?", desc_style)],
        [Paragraph("4", ep_style),
         cell("Cash Application & Payment Matching",
              "Eliminating the unapplied payment black hole"),
         Paragraph("Why does my AR look wrong even after payment?", desc_style)],
        [Paragraph("5", ep_style),
         cell("Building an AR Command Center",
              "Dashboards, alerts, and KPI governance"),
         Paragraph("How do I monitor AR without spreadsheets?", desc_style)],
        [Paragraph("6", ep_style),
         cell("The Full Order-to-Cash Playbook",
              "AI from sales order to closed invoice"),
         Paragraph("What does a fully automated AR stack look like?", desc_style)],
    ]
    col_w = [0.5 * inch, 2.8 * inch, 3.2 * inch]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), NAVY),
        ("BACKGROUND",    (0, 1), (-1, 1), colors.HexColor("#E8F4FD")),
        ("ROWBACKGROUNDS",(0, 2), (-1, -1), [LIGHT_GRAY, WHITE]),
        ("BOX",           (0, 0), (-1, -1), 1, MID_GRAY),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def build():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title="DSO Decoded — Webinar Script Episode 1",
        author="LunarLogic",
    )
    s = build_styles()
    story = []

    # ── COVER ──────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.6 * inch))
    story.append(cover_table(s))
    story.append(Spacer(1, 0.4 * inch))

    # Series badge
    badge_data = [[
        Paragraph("AR MASTERY SERIES  |  EPISODE 1 OF 6  |  RUNTIME: ~30 MINUTES",
                  ParagraphStyle("badge", fontName="Helvetica-Bold", fontSize=10,
                                 textColor=WHITE, alignment=TA_CENTER))
    ]]
    badge = Table(badge_data, colWidths=[7.5 * inch])
    badge.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), SLATE),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(badge)
    story.append(Spacer(1, 0.3 * inch))

    # ── HOW TO USE THIS DOCUMENT ───────────────────────────────────────────────
    story.append(Paragraph("How to Use This Document", s["section_header"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
    for line in [
        "This document is the complete presenter guide for Episode 1 of the LunarLogic AR Mastery Webinar Series. It contains:",
        "• <b>Word-for-word script</b> — speak naturally; this is a guide, not a teleprompter. Adapt to your voice.",
        "• <b>Slide cues</b> in [BRACKETS] — advance your deck when you see these markers.",
        "• <b>Timing guides</b> on each segment — stay on pace for the 30-minute format.",
        "• <b>Callout boxes</b> with key facts, formulas, and data you can quote directly.",
        "• <b>Presenter notes</b> with personal story prompts, objection handling, and energy tips.",
    ]:
        story.append(Paragraph(line, s["body"]))

    story.append(PageBreak())

    # ── TABLE OF CONTENTS ──────────────────────────────────────────────────────
    story.append(Paragraph("Episode Outline", s["section_header"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))

    toc_data = [
        ("0:00 – 2:00",  "SEGMENT 1",  "Welcome & Hook — The Silent Cash Killer"),
        ("2:00 – 5:00",  "SEGMENT 2",  "What Is DSO? — The Definition Made Simple"),
        ("5:00 – 10:00", "SEGMENT 3",  "Why DSO Matters More Than Revenue"),
        ("10:00 – 15:00","SEGMENT 4",  "The Anatomy of a High DSO — 5 Root Causes"),
        ("15:00 – 20:00","SEGMENT 5",  "The DSO Benchmark Guide — Where Do You Stand?"),
        ("20:00 – 26:00","SEGMENT 6",  "How AI and Automation Compress DSO"),
        ("26:00 – 28:30","SEGMENT 7",  "Real Result: Kaptain Clean's 19-Day Drop"),
        ("28:30 – 30:00","SEGMENT 8",  "Close, CTA & Series Preview"),
    ]
    for timing, label, title in toc_data:
        row_data = [
            [Paragraph(timing, ParagraphStyle("tt", fontName="Helvetica", fontSize=10,
                                               textColor=MID_GRAY, alignment=TA_CENTER)),
             Paragraph(f"<b>{label}</b>", ParagraphStyle("tl", fontName="Helvetica-Bold",
                                                          fontSize=10, textColor=GOLD)),
             Paragraph(title, ParagraphStyle("ti", fontName="Helvetica", fontSize=11,
                                              textColor=colors.HexColor("#1A1A2E")))]
        ]
        t = Table(row_data, colWidths=[1.3 * inch, 1.2 * inch, 5.0 * inch])
        t.setStyle(TableStyle([
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LINEBELOW",     (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(t)

    story.append(Spacer(1, 0.3 * inch))

    # ── LEARNING OBJECTIVES ────────────────────────────────────────────────────
    story.append(Paragraph("Learning Objectives", s["section_header"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
    story.append(Paragraph("By the end of this episode, viewers will be able to:", s["body"]))
    for obj in [
        "Define DSO and calculate it correctly for their business",
        "Explain why DSO is a leading indicator of business health — not a lagging one",
        "Identify the five most common root causes of a high DSO",
        "Benchmark their own DSO against industry norms",
        "Describe at least three ways AI and automation directly reduce DSO",
        "Understand the roadmap for future episodes in the AR Mastery Series",
    ]:
        story.append(Paragraph(f"✓  {obj}", s["bullet"]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SEGMENT 1
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("SEGMENT 1 — Welcome & Hook", s["section_header"]))
    story.append(Paragraph("The Silent Cash Killer", s["segment_label"]))
    story.append(Paragraph("[0:00 – 2:00]  Slide: Title card with episode branding", s["time_tag"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceAfter=8))

    story.append(Paragraph(
        "Hey everyone — welcome. I'm [Your Name], and today we are talking about the single metric "
        "that separates businesses that grow with confidence from businesses that constantly feel "
        "like they're running on empty — even when their revenue looks great on paper.",
        s["script"]))

    story.append(Paragraph(
        "I want to start with a scenario. Imagine you just had your best sales month ever. "
        "You closed $200,000 in business. Your team is celebrating. The pipeline looks full. "
        "And then, two weeks later, you can't make payroll.",
        s["script"]))

    story.append(Paragraph(
        "That sounds extreme — but it happens. Not because the business failed. "
        "Not because the sales were fake. It happens because the money was earned but not collected. "
        "The cash is sitting inside your accounts receivable, aging — and every day it sits there, "
        "it is costing you.",
        s["script"]))

    story.append(Spacer(1, 6))
    story.append(accent_box([
        Paragraph("The metric that measures this gap — the distance between earning revenue and collecting cash — "
                  "is called Days Sales Outstanding. DSO. And in this episode, we are going to break it "
                  "down completely.", s["callout"])
    ]))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "This is Episode 1 of the LunarLogic AR Mastery Series — a six-part series dedicated entirely "
        "to accounts receivable intelligence. In today's episode we are going to cover what DSO is, "
        "why it matters more than most business owners realize, what causes it to get bad, "
        "where you should benchmark yourself, and how modern AI automation is changing the game.",
        s["script"]))

    story.append(Paragraph(
        "Let's get into it. [ADVANCE SLIDE]",
        s["note"]))

    story.append(Spacer(1, 0.2 * inch))

    # ═══════════════════════════════════════════════════════════════════════════
    # SEGMENT 2
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("SEGMENT 2 — What Is DSO?", s["section_header"]))
    story.append(Paragraph("The Definition Made Simple", s["segment_label"]))
    story.append(Paragraph("[2:00 – 5:00]  Slide: DSO formula on clean background", s["time_tag"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceAfter=8))

    story.append(Paragraph(
        "Days Sales Outstanding — or DSO — is the average number of days it takes your business "
        "to collect payment after a sale is made. That's it. Simple definition.",
        s["script"]))

    story.append(Paragraph(
        "The formula looks like this: [ADVANCE SLIDE]",
        s["script"]))

    story.append(Spacer(1, 6))
    story.append(formula_table(s))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Let me walk through a practical example. Say your business has $150,000 in unpaid "
        "invoices right now — that's your accounts receivable balance. Over the last 30 days, "
        "you invoiced $600,000 in total. Divide 150 by 600, multiply by 30 — you get a DSO of 7.5 days. "
        "That would be outstanding.",
        s["script"]))

    story.append(Paragraph(
        "Now let's flip it. Same $150,000 in AR, but you only invoiced $150,000 last month. "
        "That's a DSO of 30 days. You are waiting a full month on average to collect. "
        "If your payment terms are Net 30, you're right at the line — but any friction "
        "in that process and you start slipping.",
        s["script"]))

    story.append(Paragraph(
        "The important thing to understand is this: DSO is not just a finance number. "
        "It is a health score. A low DSO means your billing process is tight, your customers "
        "are paying on time, and your cash is moving. A high DSO means something in the system "
        "is broken — and cash is pooling instead of flowing. [ADVANCE SLIDE]",
        s["script"]))

    story.append(Paragraph(
        "PRESENTER NOTE: Pause here. Ask the audience: 'Do you know your DSO right now? "
        "Take a moment and think about it.' Let the silence sit for 3 seconds. Most people won't know — "
        "that's the point you're making.",
        s["note"]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SEGMENT 3
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("SEGMENT 3 — Why DSO Matters More Than Revenue", s["section_header"]))
    story.append(Paragraph("The Metric Most Owners Ignore", s["segment_label"]))
    story.append(Paragraph("[5:00 – 10:00]  Slide: Revenue vs. Cash flow illustration", s["time_tag"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceAfter=8))

    story.append(Paragraph(
        "Most small business owners obsess over revenue. 'How much did we sell this month?' "
        "And I get it — revenue is exciting. It's the top line. It's the number you put on "
        "your investor deck. It's what you tell people at dinner.",
        s["script"]))

    story.append(Paragraph(
        "But here's the hard truth: revenue is a promise. Cash is the reality. "
        "And DSO is the bridge — or the gap — between those two things.",
        s["script"]))

    story.append(Spacer(1, 6))
    story.append(accent_box([
        Paragraph(
            "82% of small business failures are caused by cash flow problems — "
            "not lack of revenue, not bad products, not poor marketing. Cash flow.",
            s["callout"]),
        Paragraph("Source: U.S. Bank / SCORE small business research", s["note"]),
    ]))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Think about what a high DSO actually costs you — in concrete terms.",
        s["script"]))

    for point in [
        "<b>Working capital drain.</b> Every dollar sitting in AR is a dollar you can't use "
        "to pay suppliers, fund payroll, invest in growth, or simply keep in the bank as cushion.",
        "<b>Borrowing cost.</b> When cash is stuck in receivables, businesses turn to credit lines. "
        "The average small business line of credit carries 7–12% interest. You are effectively "
        "financing your own customers' delay.",
        "<b>Opportunity cost.</b> Capital you can't deploy doesn't compound. Slow AR is the "
        "invisible drag on every strategic decision you want to make.",
        "<b>Bad debt risk.</b> The longer an invoice ages, the less likely you are to collect it. "
        "Invoices over 90 days past due have a recovery rate below 50% on average.",
        "<b>Team morale and owner stress.</b> Nothing burns out a founder faster than strong "
        "sales that don't produce a livable cash position.",
    ]:
        story.append(Paragraph(f"• {point}", s["bullet"]))
        story.append(Spacer(1, 4))

    story.append(Paragraph(
        "Now flip it. What does a low DSO give you?",
        s["script"]))

    for point in [
        "Predictable payroll — no scrambling at the end of the month",
        "Negotiating power with vendors — you pay early, you get better terms",
        "Ability to reinvest in growth without relying on credit",
        "A more accurate picture of business health when you look at your books",
        "Confidence — the kind that comes from knowing your cash position in real time",
    ]:
        story.append(Paragraph(f"✓  {point}", s["bullet"]))

    story.append(Paragraph(
        "This is why I tell every client: before you hire another salesperson, before you run "
        "another ad campaign, look at your DSO. If your DSO is above 45 days, fixing that "
        "number will do more for your cash flow than almost any revenue initiative you can launch. [ADVANCE SLIDE]",
        s["script"]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SEGMENT 4
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("SEGMENT 4 — The Anatomy of a High DSO", s["section_header"]))
    story.append(Paragraph("5 Root Causes That Break Your Cash Cycle", s["segment_label"]))
    story.append(Paragraph("[10:00 – 15:00]  Slide: 5 cause icons / numbered list", s["time_tag"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceAfter=8))

    story.append(Paragraph(
        "So if DSO is so important, why is it high for so many businesses? "
        "In my experience working with professional services firms, there are five root causes "
        "that account for almost every high-DSO situation I've ever seen. [ADVANCE SLIDE]",
        s["script"]))

    causes = [
        (
            "1. Invoice Lag",
            "The invoice is sent days — sometimes weeks — after the work is completed. "
            "This sounds like a small thing, but it is one of the biggest DSO drivers I see. "
            "Every day between job completion and invoice delivery is a day added directly to your DSO. "
            "If you complete a job on Tuesday and invoice on Friday, you've already given away three days "
            "before the customer even sees the bill.",
        ),
        (
            "2. Inconsistent Follow-Up",
            "Most businesses send one reminder — maybe two — and then it gets awkward. "
            "The invoice sits. Days turn into weeks. The customer isn't malicious; "
            "they're just busy, and your invoice isn't the loudest thing in their inbox. "
            "Systematic, automated follow-up is the single highest-leverage activity in AR management. "
            "Studies show that invoices with three or more follow-ups have a 40% higher collection rate "
            "than invoices with one or none.",
        ),
        (
            "3. Disputes and Errors Sitting Unresolved",
            "A billing dispute doesn't just pause one invoice — it can freeze an entire customer "
            "relationship. Wrong line items, missing PO numbers, wrong contacts — these errors create "
            "a mental block for the customer. They don't pay anything until it's resolved. "
            "Resolving disputes fast is a collection strategy, not just a customer service one.",
        ),
        (
            "4. Unapplied Payments",
            "This one surprises people. A customer has paid — the money hit your bank account — "
            "but it never got matched to the right invoice in your accounting system. "
            "So your AR aging report still shows that invoice as overdue. "
            "You send a reminder. The customer is annoyed. The relationship frays. "
            "And your DSO is artificially inflated by money you've already collected.",
        ),
        (
            "5. No Visibility",
            "You can't manage what you can't see. Most businesses review AR weekly at best — "
            "monthly at worst. By the time they notice an invoice is 60 days old, the window "
            "for easy collection has closed. Real-time AR visibility isn't a luxury. "
            "It is a competitive advantage.",
        ),
    ]

    for title, body in causes:
        story.append(KeepTogether([
            Paragraph(title, s["segment_label"]),
            Paragraph(body, s["script"]),
            Spacer(1, 6),
        ]))

    story.append(Paragraph(
        "Notice something? Four of these five causes have nothing to do with your customers' "
        "willingness to pay. They are internal process failures. That is actually great news — "
        "because it means they're fixable. [ADVANCE SLIDE]",
        s["script"]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SEGMENT 5
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("SEGMENT 5 — The DSO Benchmark Guide", s["section_header"]))
    story.append(Paragraph("Where Do You Stand?", s["segment_label"]))
    story.append(Paragraph("[15:00 – 20:00]  Slide: Benchmark table / color-coded gauge", s["time_tag"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceAfter=8))

    story.append(Paragraph(
        "Now that you understand DSO and what drives it, let's talk about benchmarks. "
        "Because knowing your number doesn't mean much if you don't know what it should be. [ADVANCE SLIDE]",
        s["script"]))

    story.append(Spacer(1, 6))
    story.append(benchmark_table(s))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "These ranges are for businesses with Net 30 payment terms, which is the most common "
        "standard for professional services. If your terms are Net 15, slide everything down "
        "by about 10 days. Net 45 or Net 60 — adjust accordingly.",
        s["script"]))

    story.append(Paragraph(
        "Here is what I find useful: the Best Possible DSO — or BPDSO. "
        "This is the theoretical minimum DSO if every customer paid exactly on their due date. "
        "You calculate it the same way as regular DSO, but you only count current, non-overdue AR. "
        "The gap between your actual DSO and your BPDSO is called the DSO gap — "
        "and that gap represents pure, recoverable working capital.",
        s["script"]))

    story.append(Spacer(1, 6))
    story.append(accent_box([
        Paragraph(
            "DSO Gap  =  Actual DSO − Best Possible DSO",
            ParagraphStyle("gf", fontName="Helvetica-Bold", fontSize=12,
                           textColor=ACCENT, alignment=TA_CENTER)),
        Spacer(1, 6),
        Paragraph(
            "For a $2M/year business, a 10-day DSO gap typically represents $55,000–$65,000 "
            "in chronically tied-up working capital.",
            s["callout"]),
    ]))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Let me give you some industry context. Professional services — consulting, legal, "
        "accounting, IT services — typically see DSO in the 40–60 day range. "
        "That's the average. But average is not the goal. The top-performing firms in these "
        "industries consistently operate at 25–35 days. That's a 15-to-25-day advantage — "
        "and at any meaningful revenue level, that translates to tens or hundreds of thousands "
        "of dollars in freed-up cash.",
        s["script"]))

    story.append(Paragraph(
        "So the question isn't just 'is my DSO good?' The question is: "
        "'how far am I from best-in-class, and what is that gap costing me every single month?' [ADVANCE SLIDE]",
        s["script"]))

    story.append(Paragraph(
        "PRESENTER NOTE: This is a good moment to invite people to share in the chat. "
        "'Drop your current DSO in the chat if you know it — let's see where people are.' "
        "This creates engagement and gives you real-time social proof.",
        s["note"]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SEGMENT 6
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("SEGMENT 6 — How AI and Automation Compress DSO", s["section_header"]))
    story.append(Paragraph("The Modern AR Stack", s["segment_label"]))
    story.append(Paragraph("[20:00 – 26:00]  Slide: Automation layer diagram", s["time_tag"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceAfter=8))

    story.append(Paragraph(
        "Okay — so we know what DSO is, why it matters, what causes it, and how to benchmark it. "
        "Now let's talk about what you actually do about it. And specifically, how AI and "
        "automation have changed what's possible — especially for small and mid-sized businesses "
        "that can't afford a six-person AR team. [ADVANCE SLIDE]",
        s["script"]))

    story.append(Paragraph(
        "I want to walk through five automation layers that directly attack the five root causes "
        "we talked about earlier. This isn't theoretical — each one of these is live in the "
        "workflows we build for our clients today.",
        s["script"]))

    automation_layers = [
        (
            "Layer 1 — AI Invoice Generation & Instant Delivery",
            "Eliminates invoice lag entirely.",
            "When a sales order is processed, AI extracts the line items, validates customer data "
            "against your accounting system, creates the invoice, and sends it — all within minutes "
            "of the work being approved. No manual data entry. No delay. The invoice goes out "
            "while the work is still fresh in the customer's mind, when they are most ready to pay.",
        ),
        (
            "Layer 2 — Automated Reminder Sequences",
            "Eliminates inconsistent follow-up.",
            "Instead of relying on someone to manually chase invoices, you set up intelligent "
            "reminder sequences that fire automatically based on invoice age. Day 1 reminder. "
            "Day 7 escalation. Day 14 urgent notice. Each message is personalized, professional, "
            "and consistent — regardless of how busy your team is. The research here is compelling: "
            "businesses that automate reminder sequences collect an average of 28% faster "
            "than those that rely on manual follow-up.",
        ),
        (
            "Layer 3 — Intelligent Cash Application",
            "Eliminates unapplied payment limbo.",
            "AI-powered cash application tools match incoming payments to open invoices using "
            "fuzzy matching — they can handle partial payments, check references that don't match "
            "exactly, and even interpret remittance advice sent via email. When confidence is above "
            "a threshold — say 90% — the match is applied automatically. Below that threshold, "
            "a human gets a notification with the proposed match and one-click approval. "
            "This eliminates the phantom AR problem almost entirely.",
        ),
        (
            "Layer 4 — Real-Time AR Visibility Dashboard",
            "Eliminates the visibility blind spot.",
            "An AR dashboard that refreshes in real time — showing aging buckets, DSO trend, "
            "invoice status, and customer payment behavior — fundamentally changes how you manage "
            "collections. Instead of waiting for a weekly spreadsheet, your team can see in "
            "one glance: which invoices are at risk, which customers are trending late, "
            "and where DSO is heading. Visibility alone drives behavioral change — "
            "teams that can see the number in real time act on it faster.",
        ),
        (
            "Layer 5 — Proactive Dispute Detection",
            "Eliminates unresolved disputes blocking payment.",
            "AI can monitor email and Slack for language patterns that indicate a billing dispute — "
            "words like 'wrong amount,' 'didn't receive,' 'credit,' 'question about invoice.' "
            "When detected, an alert fires to the right person immediately. "
            "The faster a dispute is resolved, the faster the invoice gets paid. "
            "Average dispute-to-resolution time drops from 8–12 days to under 48 hours "
            "with proactive detection in place.",
        ),
    ]

    for title, subtitle, body in automation_layers:
        story.append(KeepTogether([
            Paragraph(title, s["segment_label"]),
            Paragraph(subtitle, ParagraphStyle("sub", fontName="Helvetica-Oblique", fontSize=11,
                                                textColor=ACCENT, spaceAfter=4, leftIndent=18)),
            Paragraph(body, s["script"]),
            Spacer(1, 6),
        ]))

    story.append(Paragraph(
        "Here's what this looks like in aggregate: [ADVANCE SLIDE]",
        s["script"]))
    story.append(Spacer(1, 6))
    story.append(ai_impact_table(s))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "The combined impact of a well-implemented automation stack is typically a 15-to-25-day "
        "reduction in DSO. For a business doing $2 million in annual revenue, every 10-day "
        "reduction in DSO frees up approximately $55,000 in working capital — permanently. "
        "That money doesn't come back in one check. It just stops leaving. [ADVANCE SLIDE]",
        s["script"]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SEGMENT 7
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("SEGMENT 7 — Real Result: Kaptain Clean's 19-Day Drop", s["section_header"]))
    story.append(Paragraph("Case Study", s["segment_label"]))
    story.append(Paragraph("[26:00 – 28:30]  Slide: Before/After DSO chart", s["time_tag"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceAfter=8))

    story.append(Paragraph(
        "I don't want to just give you frameworks. I want to show you what this looks like in practice. "
        "So let me tell you about Kaptain Clean. [ADVANCE SLIDE]",
        s["script"]))

    story.append(Paragraph(
        "Kaptain Clean LLC is a commercial cleaning company — professional services, "
        "small team, solid client base. They came to us with a familiar problem. "
        "Their revenue was growing. Their team was doing great work. "
        "But the owner was constantly stressed about cash. "
        "He'd have a great month of sales and then spend the next four weeks wondering "
        "when the money would actually show up.",
        s["script"]))

    story.append(Paragraph(
        "We ran the numbers. Their DSO was sitting at 52 days. "
        "For a business on Net 30 terms, that's a 22-day gap — which on their revenue "
        "translated to over $90,000 perpetually locked in AR.",
        s["script"]))

    story.append(Spacer(1, 6))
    story.append(accent_box([
        Paragraph("What We Implemented:", ParagraphStyle(
            "ki", fontName="Helvetica-Bold", fontSize=12, textColor=NAVY, spaceAfter=6)),
        Paragraph("• Automated invoice generation triggered by Slack job completion — invoices "
                  "out within minutes instead of days", s["bullet"]),
        Paragraph("• Three-touch automated reminder sequence (Day 1 / Day 7 / Day 14)", s["bullet"]),
        Paragraph("• Real-time AR aging dashboard with daily Slack summary to ownership", s["bullet"]),
        Paragraph("• AI-powered cash matching for incoming payments", s["bullet"]),
        Spacer(1, 6),
        Paragraph("The Result:", ParagraphStyle(
            "kr", fontName="Helvetica-Bold", fontSize=12, textColor=NAVY, spaceAfter=6)),
        Paragraph("DSO dropped from 52 days to 33 days — a 19-day improvement.",
                  ParagraphStyle("kn", fontName="Helvetica-Bold", fontSize=12,
                                 textColor=ACCENT, leading=20)),
        Paragraph("Invoice processing time reduced by 84%.", s["callout"]),
        Paragraph("Over $65,000 in working capital permanently unlocked.", s["callout"]),
    ], bg=colors.HexColor("#E8F4FD")))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "But here's what I remember most about this engagement. About six weeks after we went live, "
        "the owner sent me a message. He said: 'I don't know how to explain this, but I feel like I "
        "finally own my business again.' That is what a 19-day DSO improvement actually feels like. "
        "Not a spreadsheet. Not a metric. That feeling. [ADVANCE SLIDE]",
        s["script"]))

    story.append(Paragraph(
        "PRESENTER NOTE: Pause here. Let that quote land. This is an emotional anchor. "
        "The audience should hear themselves in that statement.",
        s["note"]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SEGMENT 8
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("SEGMENT 8 — Close, CTA & Series Preview", s["section_header"]))
    story.append(Paragraph("What Comes Next", s["segment_label"]))
    story.append(Paragraph("[28:30 – 30:00]  Slide: Series roadmap", s["time_tag"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceAfter=8))

    story.append(Paragraph(
        "Let's bring it home. Today we covered a lot of ground. You now know what DSO is and "
        "how to calculate it. You know why it matters more than almost any other metric for "
        "your cash health. You know the five root causes that inflate it. You know where you "
        "should benchmark yourself. And you know the five automation layers that compress it "
        "in the businesses we work with.",
        s["script"]))

    story.append(Paragraph(
        "Here's what I want you to do this week — one thing, takes five minutes. "
        "Calculate your current DSO. Take your AR balance right now. Divide it by your "
        "last 30 days of invoiced revenue. Multiply by 30. Write that number down. "
        "That's your baseline. Everything we're going to talk about in this series is "
        "aimed at moving that number down.",
        s["script"]))

    story.append(Spacer(1, 6))
    story.append(accent_box([
        Paragraph(
            "Your 5-Minute Action Item: Calculate Your DSO Today",
            ParagraphStyle("cta_h", fontName="Helvetica-Bold", fontSize=13,
                           textColor=NAVY, spaceAfter=6)),
        Paragraph(
            "AR Balance ÷ Last 30 Days of Revenue × 30  =  Your DSO",
            ParagraphStyle("cta_f", fontName="Helvetica-Bold", fontSize=12,
                           textColor=ACCENT, alignment=TA_CENTER, leading=20)),
        Spacer(1, 6),
        Paragraph(
            "If it's above 45 days, reply to this email or visit lunarlogic.ai — "
            "let's talk about what's driving it and what's possible.",
            s["callout"]),
    ], bg=colors.HexColor("#E8F4FD")))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Coming up in Episode 2: The 5 DSO Killers — we go deep on diagnosing exactly what is "
        "breaking your cash cycle. Not generic advice — a diagnostic framework you can apply "
        "to your business this week. [ADVANCE SLIDE]",
        s["script"]))

    story.append(Spacer(1, 8))
    story.append(Paragraph("The AR Mastery Series — Full Roadmap", s["segment_label"]))
    story.append(Spacer(1, 6))
    story.append(series_table(s))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "If you found value in today's episode, the most helpful thing you can do is "
        "share it with one other business owner who you think is dealing with cash flow stress. "
        "Because in most cases, the stress isn't a revenue problem. It's a DSO problem. "
        "And now you know that — and what to do about it.",
        s["script"]))

    story.append(Paragraph(
        "I'm [Your Name] from LunarLogic. Thank you for being here. "
        "I'll see you in Episode 2.",
        s["script"]))

    story.append(Spacer(1, 0.3 * inch))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=10))

    # Footer contact row
    footer_data = [[
        Paragraph("LunarLogic", ParagraphStyle(
            "fb", fontName="Helvetica-Bold", fontSize=12, textColor=NAVY)),
        Paragraph("jrodriguez@lunarlogic.ai", ParagraphStyle(
            "fe", fontName="Helvetica", fontSize=11, textColor=MID_GRAY, alignment=TA_CENTER)),
        Paragraph("AR Mastery Series — Episode 1", ParagraphStyle(
            "ft", fontName="Helvetica-Oblique", fontSize=10,
            textColor=MID_GRAY, alignment=TA_RIGHT)),
    ]]
    ft = Table(footer_data, colWidths=[2.5 * inch, 2.5 * inch, 2.5 * inch])
    ft.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(ft)

    doc.build(story)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build()
