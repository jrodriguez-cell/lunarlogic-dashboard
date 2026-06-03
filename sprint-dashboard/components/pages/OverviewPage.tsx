"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getMetrics, saveMetrics, getContacts } from "@/lib/store";
import { SprintMetrics, ContactLog } from "@/lib/types";
import { TrendingUp, Users, Phone, Presentation, FileText, CheckCircle2, Edit2, Save, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SPRINT_START = new Date("2026-06-01");

const TARGETS = {
  clientsSigned: 5,
  contactsMade: 100,
  discoveryCalls: 18,
  demosDelivered: 12,
  proposalsSent: 8,
};

const WEEKLY_TARGETS = {
  contacts: 25,
  discovery: [4, 5],
  demos: [2, 3],
  closes: [1, 2],
};

function MetricCard({
  label,
  current,
  target,
  icon: Icon,
  prefix = "",
}: {
  label: string;
  current: number;
  target: number;
  icon: React.ElementType;
  prefix?: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const color = pct >= 100 ? "text-green-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`text-3xl font-bold ${color}`}>
          {prefix}{current.toLocaleString()}
          <span className="text-base font-normal text-muted-foreground">/{target.toLocaleString()}</span>
        </div>
        <Progress value={pct} className="mt-2 h-1.5" />
        <div className="text-xs text-muted-foreground mt-1">{pct}% to goal</div>
      </CardContent>
    </Card>
  );
}

const FUNNEL = [
  { label: "Contacts", target: 100, rate: null },
  { label: "Discovery", target: 18, rate: "18%" },
  { label: "Demo", target: 12, rate: "67%" },
  { label: "Proposal", target: 8, rate: "67%" },
  { label: "Signed", target: 5, rate: "63%" },
];

function computeStreak(contacts: ContactLog[]) {
  // Build a set of dates that hit the 5-contact target
  const countByDate: Record<string, number> = {};
  contacts.forEach((c) => {
    countByDate[c.date] = (countByDate[c.date] || 0) + 1;
  });

  const sprintDays: { date: string; hit: boolean; future: boolean }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(SPRINT_START);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    sprintDays.push({
      date: dateStr,
      hit: (countByDate[dateStr] || 0) >= 5,
      future: dateStr > today,
    });
  }

  // Current streak: consecutive hit days ending today (or yesterday if today not done)
  let currentStreak = 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  // Walk backward from today
  for (let i = sprintDays.length - 1; i >= 0; i--) {
    if (sprintDays[i].date > todayStr) continue;
    if (sprintDays[i].hit) currentStreak++;
    else break;
  }

  // Longest streak
  let longest = 0, running = 0;
  sprintDays.forEach((d) => {
    if (d.future) return;
    if (d.hit) { running++; longest = Math.max(longest, running); }
    else running = 0;
  });

  return { sprintDays, currentStreak, longest };
}

function StreakTracker({ contacts }: { contacts: ContactLog[] }) {
  const { sprintDays, currentStreak, longest } = computeStreak(contacts);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" /> Daily Contact Streak
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <span>
              <span className="font-bold text-orange-400">{currentStreak}</span>
              <span className="text-muted-foreground ml-1">current</span>
            </span>
            <span>
              <span className="font-bold text-primary">{longest}</span>
              <span className="text-muted-foreground ml-1">best</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 flex-wrap">
          {sprintDays.map((d) => (
            <div
              key={d.date}
              title={`${d.date}${d.future ? " (future)" : d.hit ? " — hit 5+" : " — missed"}`}
              className={cn(
                "w-5 h-5 rounded-sm transition-colors",
                d.future ? "bg-secondary opacity-30" :
                d.hit ? "bg-green-500" : "bg-red-500/60"
              )}
            />
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> 5+ contacts</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/60 inline-block" /> Missed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-secondary opacity-30 inline-block" /> Upcoming</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<SprintMetrics>({
    clientsSigned: 0,
    contactsMade: 0,
    discoveryCalls: 0,
    demosDelivered: 0,
    proposalsSent: 0,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SprintMetrics>(metrics);
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(30);
  const [todayContacts, setTodayContacts] = useState(0);
  const [weekContacts, setWeekContacts] = useState(0);
  const [allContacts, setAllContacts] = useState<ContactLog[]>([]);

  useEffect(() => {
    const m = getMetrics();
    setMetrics(m);
    setDraft(m);
    const now = new Date();
    const total = 30;
    const elapsed = Math.min(total, Math.max(0, Math.ceil((now.getTime() - SPRINT_START.getTime()) / 86400000)));
    setDaysElapsed(elapsed);
    setDaysRemaining(Math.max(0, total - elapsed));

    const contacts = getContacts();
    setAllContacts(contacts);
    const today = new Date().toISOString().slice(0, 10);
    setTodayContacts(contacts.filter((c) => c.date === today).length);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    setWeekContacts(contacts.filter((c) => new Date(c.date) >= startOfWeek).length);
  }, []);

  function handleSave() {
    saveMetrics(draft);
    setMetrics(draft);
    setEditing(false);
  }

  const sprintPct = Math.round((daysElapsed / 30) * 100);
  const mrrCurrent = metrics.clientsSigned * 697;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sprint Overview</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} &nbsp;·&nbsp; {daysRemaining} days remaining
          </p>
        </div>
        {editing ? (
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit Metrics
          </Button>
        )}
      </div>

      {/* Sprint Progress Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Sprint Progress</span>
            <span className="font-medium">Day {daysElapsed} of 30</span>
          </div>
          <Progress value={sprintPct} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>June 1</span>
            <span>{sprintPct}% elapsed</span>
            <span>June 30</span>
          </div>
        </CardContent>
      </Card>

      {/* Edit panel */}
      {editing && (
        <Card className="border-primary">
          <CardHeader><CardTitle className="text-sm">Update Sprint Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(draft) as (keyof SprintMetrics)[]).map((key) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground capitalize block mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: parseInt(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Big Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Clients Signed" current={metrics.clientsSigned} target={TARGETS.clientsSigned} icon={CheckCircle2} />
        <MetricCard label="MRR" current={mrrCurrent} target={3485} icon={TrendingUp} prefix="$" />
        <MetricCard label="Contacts Made" current={metrics.contactsMade} target={TARGETS.contactsMade} icon={Users} />
        <MetricCard label="Discovery Calls" current={metrics.discoveryCalls} target={TARGETS.discoveryCalls} icon={Phone} />
        <MetricCard label="Demos Delivered" current={metrics.demosDelivered} target={TARGETS.demosDelivered} icon={Presentation} />
        <MetricCard label="Proposals Sent" current={metrics.proposalsSent} target={TARGETS.proposalsSent} icon={FileText} />
      </div>

      {/* Streak Tracker */}
      <StreakTracker contacts={allContacts} />

      {/* Funnel + Weekly KPIs */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Conversion Funnel — Target</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {FUNNEL.map((stage, i) => {
              const actual = [metrics.contactsMade, metrics.discoveryCalls, metrics.demosDelivered, metrics.proposalsSent, metrics.clientsSigned][i];
              const pct = Math.min(100, Math.round((actual / stage.target) * 100));
              return (
                <div key={stage.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      {stage.rate && <span className="text-xs text-muted-foreground">({stage.rate} conv.)</span>}
                      <span className={pct >= 100 ? "text-green-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}>
                        {actual} / {stage.target}
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full h-5 bg-secondary rounded overflow-hidden">
                    <div
                      className={`h-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-overlay">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Weekly KPIs */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">This Week vs Target</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <KPIRow label="Contacts" actual={weekContacts} low={WEEKLY_TARGETS.contacts} high={WEEKLY_TARGETS.contacts} />
              <KPIRow label="Discovery Calls" actual={0} low={WEEKLY_TARGETS.discovery[0]} high={WEEKLY_TARGETS.discovery[1]} />
              <KPIRow label="Demos" actual={0} low={WEEKLY_TARGETS.demos[0]} high={WEEKLY_TARGETS.demos[1]} />
              <KPIRow label="Closes" actual={0} low={WEEKLY_TARGETS.closes[0]} high={WEEKLY_TARGETS.closes[1]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Today&apos;s Contacts</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${todayContacts >= 5 ? "text-green-400" : todayContacts >= 3 ? "text-amber-400" : "text-red-400"}`}>
                  {todayContacts}
                </span>
                <span className="text-muted-foreground">/ 5 target</span>
                <Badge variant={todayContacts >= 5 ? "success" : todayContacts >= 3 ? "warning" : "danger"} className="ml-2">
                  {todayContacts >= 5 ? "On Track" : todayContacts >= 3 ? "Getting There" : "Behind"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPIRow({ label, actual, low, high }: { label: string; actual: number; low: number; high: number }) {
  const target = high;
  const pct = Math.min(100, Math.round((actual / target) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-secondary rounded overflow-hidden">
        <div
          className={`h-full ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-20 text-right">
        {actual} / {low}–{high}
      </span>
    </div>
  );
}
