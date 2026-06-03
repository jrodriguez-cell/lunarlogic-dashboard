"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerticalData {
  name: string;
  icon: string;
  sources: string;
  ownerContact: string;
  signal: string;
  juneAngle: string;
}

const VERTICALS: VerticalData[] = [
  {
    name: "Cleaning & Janitorial",
    icon: "🧹",
    sources: `Google Maps ("commercial cleaning Charlotte NC", "janitorial service Charlotte NC", "office cleaning Charlotte NC") · Yelp filtered to "Locally owned" · BBB Charlotte directory`,
    ownerContact: `Google Maps listing → website → About/Contact page. If no website, call listed number and ask for owner directly. LinkedIn: search company name + Charlotte to find owner profile.`,
    signal: `Mentions "property management," "HOA," or "corporate" clients in description`,
    juneAngle: `Property managers are their slowest payers — this is a chronic, structural problem`,
  },
  {
    name: "Landscaping & Lawn Care",
    icon: "🌿",
    sources: `Google Maps ("commercial landscaping Charlotte NC", "landscape maintenance Charlotte") · Yelp "landscaping" with commercial filter · Angi Pro Charlotte listings`,
    ownerContact: `Most owner-operated — owner answers the phone before 7am. Google Maps → website → Contact. LinkedIn company page → People tab → Owner/President.`,
    signal: `HOA or commercial property clients mentioned; multiple crews = higher invoice volume`,
    juneAngle: `Peak season right now — maximum receivables, minimum time to chase them. Lead with this.`,
  },
  {
    name: "HVAC, Plumbing & Electrical",
    icon: "⚡",
    sources: `Google Maps ("HVAC company Charlotte NC", "commercial plumbing Charlotte", "electrical contractor Charlotte") · NC Licensing Board at nclbgc.org (searchable by city and trade) · BBB Charlotte licensed contractor listings`,
    ownerContact: `NC Licensing Board lists owner name on license. Google Maps → website. Call main number and ask for owner — "I'd like to speak with [name] about their billing process."`,
    signal: `Website mentions "commercial," "GC," "new construction," or "property management" — these have 60-90 day GC payment cycles. Residential-only firms have shorter cycles and less pain.`,
    juneAngle: `Commercial construction season is peak — GC draws are backed up right now.`,
  },
  {
    name: "Staffing & Temp Labor",
    icon: "👥",
    sources: `LinkedIn ("staffing agency Charlotte NC", "temporary staffing Charlotte", "workforce solutions Charlotte") · American Staffing Association directory at americanstaffing.net filtered by NC · Indeed employer listings Charlotte`,
    ownerContact: `LinkedIn company page → People tab → filter "Owner" or "President" or "Founder." Direct InMail or connection request. Call main number and ask for the owner directly.`,
    signal: `Active job postings = actively placing workers = active AR cycle. Industrial or logistics staffing = longest DSO.`,
    juneAngle: `Summer hiring surge — they're placing more workers right now, which means more invoices, more float.`,
  },
  {
    name: "Marketing & Creative Agencies",
    icon: "🎨",
    sources: `Clutch.co Charlotte agency directory · UpCity Charlotte · LinkedIn ("marketing agency Charlotte NC", "creative agency Charlotte", "digital agency Charlotte NC")`,
    ownerContact: `Agency websites almost always list founder/CEO with direct email (firstname@agencyname.com). LinkedIn agency page → People → Owner/Founder/CEO. LinkedIn connection request converts better than cold call for this vertical.`,
    signal: `Multiple client logos on website (indicates recurring invoicing). B2B focus. Lists retainer or ongoing engagements.`,
    juneAngle: `Mid-year is when retainer clients go quiet on payments — "out of office" culture slows AR in June.`,
  },
  {
    name: "IT Managed Service Providers",
    icon: "💻",
    sources: `LinkedIn ("managed service provider Charlotte NC", "IT services Charlotte", "MSP Charlotte") · CompTIA member directory · Clutch.co IT services Charlotte`,
    ownerContact: `LinkedIn → company page → People. MSP owners are often the technical founder — active on LinkedIn. ConnectWise/Autotask user communities also surface Charlotte MSPs.`,
    signal: `Mentions both recurring managed services AND project work — hybrid billing = most AR complexity.`,
    juneAngle: `Mid-year project billing creates a backlog — clients push Q2 project invoices into Q3.`,
  },
];

function VerticalCard({ v }: { v: VerticalData }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-accent/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{v.icon}</span>
          <span className="font-semibold text-sm">{v.name}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <CardContent className="pt-0 border-t border-border space-y-4">
          <Row label="Where to find prospects" value={v.sources} />
          <Row label="How to get owner name & direct number" value={v.ownerContact} />
          <Row label="Qualifying signal before calling" value={v.signal} highlight="amber" />
          <Row label="June urgency angle" value={v.juneAngle} highlight="teal" />
        </CardContent>
      )}
    </Card>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: "amber" | "teal" }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 font-semibold">{label}</div>
      <div className={cn(
        "text-sm rounded-lg p-3",
        highlight === "amber" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
        highlight === "teal" ? "bg-primary/10 text-primary border border-primary/20" :
        "bg-secondary text-muted-foreground"
      )}>
        {value}
      </div>
    </div>
  );
}

const QB_SCRIPT = `Go to quickbooks.intuit.com/find-an-accountant → filter Charlotte NC and Miami FL → filter by QuickBooks Online certification → look for ProAdvisors listing "small business" or "service industry" clients. Target 5 Charlotte + 5 Miami = 10 total.

Call directly — don't email first.

Pitch: "Your clients in cleaning, HVAC, landscaping — the ones struggling with collections — I can compress their DSO by 40% in 90 days. You get 20% recurring. One client at $697/month = $139/month to you. Five clients = $695/month passive income. Want to try it with your 2 worst AR headache clients?"`;

export default function ProspectsPage() {
  const [qbOpen, setQbOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prospect Lists</h1>
        <p className="text-muted-foreground text-sm">How to build your Charlotte prospect list — vertical by vertical</p>
      </div>

      <div className="space-y-3">
        {VERTICALS.map((v) => (
          <VerticalCard key={v.name} v={v} />
        ))}
      </div>

      {/* QB ProAdvisor section */}
      <Card className="border-amber-500/30">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/20 transition-colors"
          onClick={() => setQbOpen(!qbOpen)}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤝</span>
            <div>
              <div className="font-semibold text-sm">QB ProAdvisors — Referral Partner Sourcing</div>
              <div className="text-xs text-muted-foreground">Charlotte + Miami · 10 targets</div>
            </div>
          </div>
          {qbOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        {qbOpen && (
          <CardContent className="pt-0 border-t border-border">
            <div className="mt-4 bg-secondary rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {QB_SCRIPT}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Target verticals", value: "6" },
          { label: "Target list size", value: "50" },
          { label: "QB ProAdvisors", value: "10" },
          { label: "Daily call target", value: "5" },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-3 pb-3 text-center">
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
