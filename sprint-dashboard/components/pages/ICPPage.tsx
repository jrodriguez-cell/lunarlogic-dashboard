"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const FIT_ROWS = [
  {
    dimension: "Revenue",
    good: "$500K–$10M ARR — enough AR complexity to justify automation",
    bad: "Under $300K (not enough volume) or over $20M (enterprise procurement)",
  },
  {
    dimension: "Billing model",
    good: "Invoices issued after work delivery — net 30, 45, or 60",
    bad: "Point-of-sale, insurance, subscription auto-billing",
  },
  {
    dimension: "Software",
    good: "QuickBooks Online or Desktop — we integrate natively",
    bad: "NetSuite, SAP, Oracle, or Sage Enterprise",
  },
  {
    dimension: "Decision maker",
    good: "Owner makes billing decisions — 'it's my call'",
    bad: "CFO committee, board approval, or procurement process",
  },
  {
    dimension: "Team size",
    good: "8–20 employees — owner still close to operations",
    bad: "Solo operator (no leverage) or 50+ (politics slow close)",
  },
  {
    dimension: "DSO",
    good: "45-day+ DSO — real pain, real ROI to show",
    bad: "Under 30 days already — low urgency, long nurture",
  },
  {
    dimension: "Owner mindset",
    good: "Ready to build modern financial infrastructure — believes technology solves operational problems",
    bad: "Wants a tool to manage manually or a report to review — not ready to implement a system",
    isNew: true,
  },
];

const MINDSET_BELIEFS = [
  "Technology is the correct answer to operational problems — not more staff, not more manual process",
  "\"The way we've always done it\" is the problem, not the benchmark",
  "A system that runs without me is more valuable than one that depends on me",
  "Patience during implementation is the price of permanent improvement",
  "Building financial infrastructure now separates businesses that grow from those that plateau",
];

const PHASES = [
  {
    num: 1,
    name: "AR Automation Suite",
    tag: "ACTIVE — current sprint",
    tagVariant: "success" as const,
    items: ["Invoice creation", "Payment reminders", "Payment matching", "AR aging dashboard"],
    color: "border-green-500/40 bg-green-500/5",
  },
  {
    num: 2,
    name: "AP Automation Suite",
    tag: "NEXT",
    tagVariant: "warning" as const,
    items: ["Bill intake", "Approval workflows", "Payment scheduling", "Vendor management"],
    color: "border-amber-500/40 bg-amber-500/5",
  },
  {
    num: 3,
    name: "Full Accounting Suite",
    tag: "ROADMAP",
    tagVariant: "secondary" as const,
    items: ["Cash flow forecasting", "Month-end close", "Payroll integration", "Financial reporting"],
    color: "border-border bg-secondary/30",
  },
];

export default function ICPPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ICP &amp; Platform</h1>
        <p className="text-muted-foreground text-sm">Ideal client profile, fit criteria, and product roadmap</p>
      </div>

      {/* Owner Mindset */}
      <Card className="border-blue-500/40 bg-blue-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Owner mindset profile</CardTitle>
            <Badge variant="info" className="text-[10px]">NEW</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">If the owner does not hold these beliefs, they are a Stage 1 buyer at best. Move on.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {MINDSET_BELIEFS.map((belief, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-blue-400" />
              </div>
              <span className="text-sm">{belief}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fit vs No Fit Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fit vs No Fit</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs text-muted-foreground uppercase tracking-wide font-semibold w-36">Dimension</th>
                  <th className="text-left px-4 py-2.5 text-xs text-green-400 uppercase tracking-wide font-semibold">Good Fit</th>
                  <th className="text-left px-4 py-2.5 text-xs text-red-400 uppercase tracking-wide font-semibold">Not a Fit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FIT_ROWS.map((row) => (
                  <tr key={row.dimension} className={row.isNew ? "bg-blue-500/5" : "hover:bg-accent/20 transition-colors"}>
                    <td className="px-4 py-3 font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        {row.dimension}
                        {row.isNew && <Badge variant="info" className="text-[9px] px-1 py-0">NEW</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground text-xs">{row.good}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <X className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground text-xs">{row.bad}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Platform Roadmap */}
      <div>
        <h2 className="text-base font-semibold mb-3">Platform roadmap</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PHASES.map((phase, i) => (
            <div key={phase.num} className="relative">
              {/* Connector line */}
              {i < PHASES.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-4 h-0.5 bg-border z-10 -translate-x-2" />
              )}
              <Card className={phase.color}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-muted-foreground font-medium">Phase {phase.num}</div>
                    <Badge variant={phase.tagVariant} className="text-[10px]">{phase.tag}</Badge>
                  </div>
                  <CardTitle className="text-sm mt-1">{phase.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-4 py-3 border border-border">
          Every client signed during the June sprint becomes a Phase 2 expansion opportunity in Q4 2026. The beachhead strategy is deliberate — AR trust funds AP adoption.
        </p>
      </div>

      {/* Pricing note */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="text-primary text-lg font-bold shrink-0">$</div>
            <div>
              <div className="text-sm font-semibold mb-1">Commitment &amp; pricing</div>
              <div className="text-sm text-muted-foreground">
                We earn your business every month through results. Month-to-month after pilot. Annual contract available with discount. No lock-in contracts.
              </div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { plan: "Essentials", price: "$697/mo", vol: "150 invoices" },
                  { plan: "Professional", price: "$1,497/mo", vol: "250 invoices" },
                  { plan: "Business", price: "$2,497/mo", vol: "400 invoices" },
                  { plan: "Implementation", price: "$2,500", vol: "Waived w/ annual" },
                ].map((p) => (
                  <div key={p.plan} className="bg-secondary/50 rounded p-2 border border-border">
                    <div className="font-semibold text-foreground">{p.plan}</div>
                    <div className="text-primary font-bold">{p.price}</div>
                    <div className="text-muted-foreground">{p.vol}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
