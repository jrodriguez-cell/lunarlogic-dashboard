"use client";
import { useState, useEffect } from "react";
import { getContacts, saveContacts } from "@/lib/store";
import { ContactLog, Vertical, OutreachMethod, ContactOutcome } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Filter, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const VERTICALS: Vertical[] = ["Cleaning", "HVAC", "Landscaping", "Staffing", "Agency", "IT/MSP", "Other"];
const METHODS: OutreachMethod[] = ["Phone Call", "Voicemail + Email", "Email Only", "LinkedIn", "In-Person"];
const OUTCOMES: ContactOutcome[] = [
  "Connected - Qualified", "Connected - Disqualified", "Voicemail Left",
  "No Answer", "Not Interested", "Discovery Call Booked", "Demo Booked"
];

const outcomeColors: Record<ContactOutcome, string> = {
  "Connected - Qualified": "success",
  "Discovery Call Booked": "success",
  "Demo Booked": "success",
  "Connected - Disqualified": "warning",
  "Voicemail Left": "info",
  "No Answer": "outline",
  "Not Interested": "danger",
};

const EMPTY: Omit<ContactLog, "id"> = {
  company: "",
  contact: "",
  phone: "",
  email: "",
  vertical: "Cleaning",
  method: "Phone Call",
  outcome: "No Answer",
  notes: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactLog[]>([]);
  const [form, setForm] = useState<Omit<ContactLog, "id">>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [filterVertical, setFilterVertical] = useState<string>("All");
  const [filterOutcome, setFilterOutcome] = useState<string>("All");
  const [filterDate, setFilterDate] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => { setContacts(getContacts()); }, []);

  function persist(updated: ContactLog[]) {
    setContacts(updated);
    saveContacts(updated);
  }

  function handleAdd() {
    if (!form.company || !form.contact) return;
    persist([{ ...form, id: `c${Date.now()}` }, ...contacts]);
    setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
  }

  function handleDelete(id: string) {
    persist(contacts.filter((c) => c.id !== id));
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = contacts.filter((c) => c.date === today).length;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const weekCount = contacts.filter((c) => new Date(c.date) >= startOfWeek).length;

  const filtered = contacts
    .filter((c) => filterVertical === "All" || c.vertical === filterVertical)
    .filter((c) => filterOutcome === "All" || c.outcome === filterOutcome)
    .filter((c) => !filterDate || c.date === filterDate)
    .sort((a, b) => sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));

  function exportCsv() {
    const header = "Date,Company,Contact,Phone,Email,Vertical,Method,Outcome,Notes";
    const rows = contacts.map((c) =>
      [c.date, c.company, c.contact, c.phone, c.email, c.vertical, c.method, c.outcome, c.notes]
        .map((v) => `"${v?.replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sprint-contacts.csv";
    a.click();
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Daily Contacts Log</h1>
          <p className="text-muted-foreground text-sm">{contacts.length} total contacts logged</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Log Contact</Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Today</div>
            <div className="flex items-center gap-2">
              <span className={cn("text-3xl font-bold", todayCount >= 5 ? "text-green-400" : todayCount >= 3 ? "text-amber-400" : "text-red-400")}>{todayCount}</span>
              <span className="text-muted-foreground text-sm">/ 5</span>
              {todayCount >= 5 && <Flame className="h-4 w-4 text-orange-400" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xs text-muted-foreground mb-1">This Week</div>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-3xl font-bold", weekCount >= 25 ? "text-green-400" : weekCount >= 15 ? "text-amber-400" : "text-red-400")}>{weekCount}</span>
              <span className="text-muted-foreground text-sm">/ 25</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Connected</div>
            <span className="text-3xl font-bold text-green-400">
              {contacts.filter(c => c.outcome.startsWith("Connected") || c.outcome.includes("Booked")).length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Calls Booked</div>
            <span className="text-3xl font-bold text-blue-400">
              {contacts.filter(c => c.outcome === "Discovery Call Booked" || c.outcome === "Demo Booked").length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-primary">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Log New Contact</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div><Label className="text-xs mb-1 block">Company *</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div><Label className="text-xs mb-1 block">Contact Name *</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
              <div><Label className="text-xs mb-1 block">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label className="text-xs mb-1 block">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <Label className="text-xs mb-1 block">Vertical</Label>
                <Select value={form.vertical} onValueChange={(v) => setForm({ ...form, vertical: v as Vertical })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VERTICALS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as OutreachMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Outcome</Label>
                <Select value={form.outcome} onValueChange={(v) => setForm({ ...form, outcome: v as ContactOutcome })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs mb-1 block">Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label className="text-xs mb-1 block">Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Log Contact</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterVertical} onValueChange={setFilterVertical}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Vertical" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Verticals</SelectItem>
            {VERTICALS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOutcome} onValueChange={setFilterOutcome}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Outcome" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Outcomes</SelectItem>
            {OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-36 h-8 text-xs" />
        {(filterVertical !== "All" || filterOutcome !== "All" || filterDate) && (
          <Button size="sm" variant="ghost" onClick={() => { setFilterVertical("All"); setFilterOutcome("All"); setFilterDate(""); }}>Clear</Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left cursor-pointer" onClick={() => setSortDesc(!sortDesc)}>Date {sortDesc ? "↓" : "↑"}</th>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2 text-left hidden sm:table-cell">Contact</th>
              <th className="px-3 py-2 text-left hidden md:table-cell">Vertical</th>
              <th className="px-3 py-2 text-left hidden lg:table-cell">Method</th>
              <th className="px-3 py-2 text-left">Outcome</th>
              <th className="px-3 py-2 text-left hidden xl:table-cell">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground text-sm">No contacts logged yet</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">{c.date}</td>
                  <td className="px-3 py-2 font-medium">{c.company}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{c.contact}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{c.vertical}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{c.method}</td>
                  <td className="px-3 py-2">
                    <Badge variant={outcomeColors[c.outcome] as "success" | "warning" | "info" | "outline" | "danger"} className="text-xs whitespace-nowrap">
                      {c.outcome}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs max-w-[200px] truncate hidden xl:table-cell">{c.notes}</td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(c.id)}>×</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
