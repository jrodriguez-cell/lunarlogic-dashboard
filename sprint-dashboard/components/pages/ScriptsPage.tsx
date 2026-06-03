"use client";
import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Check, X, Minus } from "lucide-react";

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-accent/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="text-base">{title}</CardTitle>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

function QualifyQ({
  q, yes, no, tilde, isNew = false, accent,
}: {
  q: string; yes: string; no?: string; tilde?: string; isNew?: boolean; accent?: string;
}) {
  return (
    <div className={cn(
      "border rounded-lg p-4 mb-3",
      accent ? accent : "border-border"
    )}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-medium text-sm italic">{q}</p>
        {isNew && <Badge variant="info" className="shrink-0 text-[10px] px-1.5 py-0.5">NEW</Badge>}
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
          <span>{yes}</span>
        </div>
        {no && (
          <div className="flex gap-2">
            <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{no}</span>
          </div>
        )}
        {tilde && (
          <div className="flex gap-2">
            <Minus className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{tilde}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function VerticalScript({ name, opener, email, pain }: { name: string; opener: string; email: string; pain: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden mb-2">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-sm">{name}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cold Call Opener</div>
            <div className="bg-secondary rounded-lg p-3 text-sm italic">{opener}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email Subject</div>
            <div className="bg-secondary rounded-lg p-3 text-sm font-medium">{email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pain to Listen For</div>
            <div className="text-sm text-muted-foreground">{pain}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScriptBlock({ title, text, isNew = false }: { title: string; text: string; isNew?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">{title}</div>
          {isNew && <Badge variant="info" className="text-[10px] px-1.5 py-0.5">NEW</Badge>}
        </div>
        <button
          onClick={copy}
          className={cn(
            "text-xs px-2 py-1 rounded border transition-colors shrink-0",
            copied ? "border-green-500 text-green-400" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="bg-secondary rounded-lg p-4 text-sm leading-relaxed text-muted-foreground italic">
        {text}
      </div>
    </div>
  );
}

const SHADOW_CLOSE = "Here's what I want to do. Let me connect to your QuickBooks and run our system in parallel to exactly what you're doing now — you keep doing everything the same way. At the end of 30 days, I show you the delta: how much faster the invoices moved, how many reminders went out automatically, what your DSO looks like. If the numbers don't move, you owe me nothing and we part as friends. If they do, we talk about going full production. No risk, no disruption, no obligation. Can we start Monday?";

const STALLED_RESCUE = "[Name] — I've reached out a few times and haven't heard back. I'm going to assume the timing isn't right and close out your file for now — no hard feelings at all. If that changes and cash flow becomes a priority, just reply to this email and we'll pick up exactly where we left off. Wishing you a strong rest of the month.";

const ROI_CALC = "You're at [X]-day DSO. Healthy benchmark for a service business is 35 days — but with LunarLogic, our clients average 18-28 days. That [X-28] day gap, multiplied by your daily revenue, is working capital sitting in your aging report instead of your bank account. For a business your size, that's roughly $[X] locked up. We typically close that gap in 90 days. That's the number we're going after.";

const COMPOUNDING_MOAT = "Every month LunarLogic runs in your business, it builds a richer picture of your clients' payment behavior, your seasonality, your exceptions. That institutional knowledge doesn't live in a person who can quit — it lives in the system and it compounds. The business that starts this in June has a 12-month head start on the business that starts in January. That gap widens every month. Every month you wait is a month you're giving that head start to someone else.";

const PLATFORM_VISION = "We start with AR because it's where you're bleeding most visibly — the money you've already earned that isn't in your bank account yet. Once your DSO is compressed and cash flow is predictable, we move to AP automation: bill intake, approval workflows, payment scheduling. Then full accounting infrastructure: cash flow forecasting, month-end close, payroll integration. You're not buying a reminder tool. You're building the financial operating layer your business has never had. AR is just the right door to walk in through — because the ROI is visible in 30 days and it funds everything that comes next.";

const DISQUALIFIERS = [
  { dimension: "Billing model", signal: "Point of sale / insurance billing", why: "No AR cycle to automate." },
  { dimension: "Software", signal: "NetSuite / SAP / Oracle", why: "Enterprise system — wrong buyer, wrong cycle." },
  { dimension: "Decision maker", signal: "Committee or CFO approval required", why: "No single owner. Sales cycle becomes months." },
  { dimension: "Technology-resistant mindset", signal: "Wants to hire a person, not build a system", why: "Will not implement correctly or see results. Not worth a demo slot.", isNew: true, qualifying: "When you hit an operational bottleneck, do you hire or automate?" },
];

export default function ScriptsPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Qualify &amp; Scripts</h1>
        <p className="text-muted-foreground text-sm">Reference guide for calls — pull up mid-conversation</p>
      </div>

      <Section title="A — 5-Question Qualifier" defaultOpen={true}>
        <div className="space-y-1">
          <QualifyQ
            q="Do you invoice clients after completing the work, or collect at time of service?"
            yes="Invoice after delivery — continue"
            no="Point of sale / insurance — disqualify"
          />
          <QualifyQ
            q="What do you use for invoicing — QuickBooks, or something else?"
            yes="QuickBooks Online or Desktop — continue"
            no="NetSuite / SAP / Oracle — disqualify"
            tilde="Xero / FreshBooks — note, continue with caveat"
          />
          <QualifyQ
            q="Are you the one who makes decisions about billing and collections, or is someone else involved?"
            yes="Owner, it's my decision — continue"
            no="Committee / CFO approves — deprioritize"
          />
          <QualifyQ
            q="How much time does your team spend chasing invoices each week?"
            yes="Names a real number or 'too much' — Stage 2-3, close fast"
            tilde="'Not that bad' — Stage 1, nurture"
          />
          <QualifyQ
            q="When you hit an operational bottleneck — like collections — do you tend to hire someone to handle it, or look for a system to automate it?"
            yes="'A system' / 'automate it' / 'technology first' — perfect fit, this is the right buyer"
            no="'Hire someone' / 'need a person' — Stage 1 mindset at best, not a June close"
            isNew={true}
            accent="border-blue-500/40 bg-blue-500/5"
          />
        </div>
      </Section>

      <Section title="A2 — Disqualifiers Reference">
        <div className="space-y-2">
          {DISQUALIFIERS.map((d) => (
            <div key={d.dimension} className={cn(
              "border rounded-lg p-3",
              d.isNew ? "border-blue-500/40 bg-blue-500/5" : "border-border"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{d.dimension}</span>
                {d.isNew && <Badge variant="info" className="text-[10px] px-1.5 py-0.5">NEW</Badge>}
              </div>
              <div className="flex gap-2 text-sm mb-1">
                <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{d.signal}</span>
              </div>
              <div className="text-xs text-muted-foreground ml-6">{d.why}</div>
              {d.qualifying && (
                <div className="ml-6 mt-1 text-xs text-blue-400 italic">Qualifying question: &ldquo;{d.qualifying}&rdquo;</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="B — Vertical Cold Call Scripts">
        <VerticalScript
          name="Cleaning"
          opener="Do your property management clients pay you in 30 days, or are you regularly chasing invoices 45-60 days out?"
          email="Property managers owe you money right now — we can get it"
          pain="Property managers deliberately slow-walking payments, owner is ops+HR+sales with no AR system"
        />
        <VerticalScript
          name="HVAC / Plumbing / Electrical"
          opener="When your commercial clients are on net-45 or net-60, do your techs also create the invoices — or does billing happen after the fact and add more days to the wait?"
          email="Your GC clients are sitting on invoices from 60 days ago"
          pain="GC clients pay when draw comes in (60-90 days), field techs create invoices late, zero leverage to withhold service"
        />
        <VerticalScript
          name="Landscaping"
          opener="You're in your busiest season right now — are your HOA and commercial clients paying in 30 days, or are you watching receivables pile up while you're too busy to chase them?"
          email="Peak season billing — are your HOA clients actually paying you?"
          pain="HOA and commercial accounts slowest payers, peak season = peak receivables, most complex billing model"
        />
        <VerticalScript
          name="Staffing"
          opener="You're running payroll every week while your clients are on net-30 or net-60. How many invoices are sitting past due right now?"
          email="You're floating payroll. Your clients are sitting on 30-day invoices."
          pain="Weekly payroll out, net 30-60 in, single slow-paying client can cause crisis, can't stop placing workers"
        />
        <VerticalScript
          name="Agencies"
          opener="Does your account team handle client relationships and invoice follow-up? Because that's a direct conflict — and most agency owners end up not chasing the invoices that matter most."
          email="Your account managers shouldn't be making collections calls"
          pain="Account managers own relationships AND collections (conflict), nobody pushes on big retainer invoices, scope creep disputes"
        />
      </Section>

      <Section title="C — Key Sales Scripts">
        <ScriptBlock title="Shadow Mode Close" text={SHADOW_CLOSE} />
        <ScriptBlock title="Stalled Deal Rescue (Permission to Close File)" text={STALLED_RESCUE} />
        <ScriptBlock title="Live ROI Calculation" text={ROI_CALC} />
        <ScriptBlock title="The Compounding Moat Close" text={COMPOUNDING_MOAT} isNew={true} />
        <ScriptBlock title="The Platform Vision Pitch" text={PLATFORM_VISION} isNew={true} />
      </Section>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="text-primary text-lg font-bold shrink-0">$</div>
            <div>
              <div className="text-sm font-semibold mb-1">Pricing &amp; commitment</div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                We earn your business every month through results. Month-to-month after pilot. Annual contract available with discount. No lock-in contracts.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
