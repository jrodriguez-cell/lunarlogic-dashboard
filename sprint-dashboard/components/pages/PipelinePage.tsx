"use client";
import { useState, useEffect } from "react";
import { getDeals, saveDeals } from "@/lib/store";
import { Deal, DealStage, Priority, DealStatus, Vertical } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES: DealStage[] = ["Outreach", "Discovery", "Demo", "Proposal", "Pilot", "Archived"];
const VERTICALS: Vertical[] = ["Cleaning", "HVAC", "Landscaping", "Staffing", "Agency", "IT/MSP", "Other"];
const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const STATUSES: DealStatus[] = ["Hot", "Warm", "Cold", "Stalled"];

function daysSince(dateStr: string): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

const statusColors: Record<DealStatus, string> = {
  Hot: "text-red-400 border-red-500/30 bg-red-500/10",
  Warm: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Cold: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  Stalled: "text-gray-400 border-gray-500/30 bg-gray-500/10",
};

const priorityColors: Record<Priority, string> = {
  High: "text-red-400",
  Medium: "text-amber-400",
  Low: "text-muted-foreground",
};

const EMPTY_DEAL: Omit<Deal, "id" | "createdAt"> = {
  company: "",
  contact: "",
  vertical: "Other",
  stage: "Outreach",
  lastContactDate: new Date().toISOString().slice(0, 10),
  nextAction: "",
  nextActionDue: "",
  notes: "",
  priority: "Medium",
  dealValue: "",
  status: "Warm",
};

function DealForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Omit<Deal, "id" | "createdAt">;
  onSave: (d: Omit<Deal, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof typeof form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs mb-1 block">Company</Label><Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Co" /></div>
        <div><Label className="text-xs mb-1 block">Contact</Label><Input value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Jane Smith" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Vertical</Label>
          <Select value={form.vertical} onValueChange={(v) => set("vertical", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{VERTICALS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Stage</Label>
          <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Priority</Label>
          <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs mb-1 block">Deal Value</Label><Input value={form.dealValue} onChange={(e) => set("dealValue", e.target.value)} placeholder="$697/mo or referral" /></div>
        <div><Label className="text-xs mb-1 block">Last Contact Date</Label><Input type="date" value={form.lastContactDate} onChange={(e) => set("lastContactDate", e.target.value)} /></div>
      </div>
      <div><Label className="text-xs mb-1 block">Next Action</Label><Input value={form.nextAction} onChange={(e) => set("nextAction", e.target.value)} placeholder="Schedule demo..." /></div>
      <div><Label className="text-xs mb-1 block">Next Action Due</Label><Input type="date" value={form.nextActionDue} onChange={(e) => set("nextActionDue", e.target.value)} /></div>
      <div><Label className="text-xs mb-1 block">Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} /></div>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} className="flex-1">Save Deal</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function DealCard({ deal, onEdit, onDelete }: { deal: Deal; onEdit: () => void; onDelete: () => void }) {
  const daysSinceContact = daysSince(deal.lastContactDate);
  const overdueAction = deal.nextActionDue && isOverdue(deal.nextActionDue);

  return (
    <Card className={cn("mb-2", deal.priority === "High" && "border-l-2 border-l-red-500/50")}>
      <CardContent className="pt-3 pb-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm truncate">{deal.company}</span>
              <span className={cn("text-xs border rounded px-1.5 py-0.5 shrink-0", statusColors[deal.status])}>{deal.status}</span>
            </div>
            <div className="text-xs text-muted-foreground">{deal.contact} · {deal.vertical}</div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}><Pencil className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
          </div>
        </div>

        {deal.nextAction && (
          <div className={cn("mt-2 text-xs rounded px-2 py-1.5", overdueAction ? "bg-red-500/10 text-red-400" : "bg-secondary text-muted-foreground")}>
            {overdueAction && <AlertCircle className="h-3 w-3 inline mr-1" />}
            {deal.nextAction}
            {deal.nextActionDue && <span className="ml-1 opacity-70">· {deal.nextActionDue}</span>}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
          <span className={cn("text-xs font-medium", priorityColors[deal.priority])}>{deal.priority}</span>
          <span className="text-xs text-muted-foreground">{deal.dealValue}</span>
          <span className={cn("text-xs font-medium",
            daysSinceContact >= 6 ? "text-red-400" :
            daysSinceContact >= 3 ? "text-amber-400" :
            "text-green-400"
          )}>
            {daysSinceContact}d since contact
            {daysSinceContact >= 6 && <span className="ml-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1 py-0.5 text-[10px] font-bold">OVERDUE</span>}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filterStage, setFilterStage] = useState<DealStage | "All">("All");

  useEffect(() => { setDeals(getDeals()); }, []);

  function persist(updated: Deal[]) {
    setDeals(updated);
    saveDeals(updated);
  }

  function handleAdd(data: Omit<Deal, "id" | "createdAt">) {
    const deal: Deal = { ...data, id: `d${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    persist([...deals, deal]);
    setAddOpen(false);
  }

  function handleEdit(data: Omit<Deal, "id" | "createdAt">) {
    if (!editDeal) return;
    persist(deals.map((d) => (d.id === editDeal.id ? { ...editDeal, ...data } : d)));
    setEditDeal(null);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this deal?")) persist(deals.filter((d) => d.id !== id));
  }

  const overdueCount = deals.filter((d) => d.nextActionDue && isOverdue(d.nextActionDue) && d.stage !== "Archived").length;
  const staleCount = deals.filter((d) => d.stage !== "Archived" && daysSince(d.lastContactDate) >= 6).length;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {overdueCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center gap-2 text-red-400 text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {overdueCount} deal{overdueCount > 1 ? "s have" : " has"} overdue actions — address these first.
          {staleCount > 0 && <span className="ml-2 opacity-80">· {staleCount} deal{staleCount > 1 ? "s" : ""} not contacted in 6+ days.</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground text-sm">{deals.filter(d => d.stage !== "Archived").length} active deals</p>
        </div>
        <div className="flex gap-2 items-center">
          {overdueCount > 0 && (
            <Badge variant="danger" className="gap-1">
              <AlertCircle className="h-3 w-3" /> {overdueCount} overdue
            </Badge>
          )}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Deal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
              <DealForm initial={EMPTY_DEAL} onSave={handleAdd} onClose={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stage filter */}
      <div className="flex gap-1.5 flex-wrap">
        {(["All", ...STAGES] as (DealStage | "All")[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStage(s)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition-colors",
              filterStage === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground"
            )}
          >
            {s} {s !== "All" ? `(${deals.filter(d => d.stage === s).length})` : ""}
          </button>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          if (filterStage !== "All" && filterStage !== stage) return null;
          const stageDeals = deals.filter((d) => d.stage === stage);
          return (
            <div key={stage} className={cn("min-h-[100px]", filterStage === "All" ? "" : "col-span-full sm:col-span-2 lg:col-span-3 xl:col-span-6")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</span>
                <span className="text-xs bg-secondary rounded-full px-2 py-0.5">{stageDeals.length}</span>
              </div>
              {stageDeals.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg h-16 flex items-center justify-center text-xs text-muted-foreground">
                  No deals
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={() => setEditDeal(deal)}
                    onDelete={() => handleDelete(deal.id)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editDeal} onOpenChange={(o) => !o && setEditDeal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Deal — {editDeal?.company}</DialogTitle></DialogHeader>
          {editDeal && (
            <DealForm
              initial={editDeal}
              onSave={handleEdit}
              onClose={() => setEditDeal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
