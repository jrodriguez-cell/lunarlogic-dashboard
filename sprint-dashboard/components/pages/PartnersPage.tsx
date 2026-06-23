"use client";
import { useState, useEffect } from "react";
import { getPartners, savePartners } from "@/lib/store";
import { ReferralPartner, PartnerType, PartnerStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, TrendingUp } from "lucide-react";

const TYPES: PartnerType[] = ["CPA", "QB ProAdvisor", "Agency", "Consultant", "Cowork / Network", "Other"];
const STATUSES: PartnerStatus[] = ["Not Contacted", "Contacted", "Loom Sent", "Agreement Signed", "Delivering Intros", "Inactive"];

const statusColors: Record<PartnerStatus, string> = {
  "Not Contacted": "secondary",
  Contacted: "info",
  "Loom Sent": "warning",
  "Agreement Signed": "success",
  "Delivering Intros": "success",
  Inactive: "secondary",
};

const EMPTY: Omit<ReferralPartner, "id"> = {
  name: "", company: "", type: "CPA", status: "Not Contacted",
  introsDelivered: 0, clientsConverted: 0, lastContactDate: "", nextAction: "", notes: "",
};

function PartnerForm({ initial, onSave, onClose }: { initial: Omit<ReferralPartner, "id">; onSave: (d: Omit<ReferralPartner, "id">) => void; onClose: () => void }) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof typeof form, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs mb-1 block">Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
        <div><Label className="text-xs mb-1 block">Company</Label><Input value={form.company} onChange={e => set("company", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Type</Label>
          <Select value={form.type} onValueChange={v => set("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs mb-1 block">Intros Delivered</Label><Input type="number" min={0} value={form.introsDelivered} onChange={e => set("introsDelivered", parseInt(e.target.value) || 0)} /></div>
        <div><Label className="text-xs mb-1 block">Clients Converted</Label><Input type="number" min={0} value={form.clientsConverted} onChange={e => set("clientsConverted", parseInt(e.target.value) || 0)} /></div>
        <div><Label className="text-xs mb-1 block">Last Contact</Label><Input type="date" value={form.lastContactDate} onChange={e => set("lastContactDate", e.target.value)} /></div>
      </div>
      <div><Label className="text-xs mb-1 block">Next Action</Label><Input value={form.nextAction} onChange={e => set("nextAction", e.target.value)} /></div>
      <div><Label className="text-xs mb-1 block">Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} className="flex-1">Save Partner</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<ReferralPartner[]>([]);
  const [editPartner, setEditPartner] = useState<ReferralPartner | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => { setPartners(getPartners()); }, []);

  function persist(updated: ReferralPartner[]) { setPartners(updated); savePartners(updated); }

  function handleAdd(data: Omit<ReferralPartner, "id">) {
    persist([...partners, { ...data, id: `p${Date.now()}` }]);
    setAddOpen(false);
  }
  function handleEdit(data: Omit<ReferralPartner, "id">) {
    if (!editPartner) return;
    persist(partners.map(p => p.id === editPartner.id ? { ...editPartner, ...data } : p));
    setEditPartner(null);
  }
  function handleDelete(id: string) {
    if (confirm("Delete this partner?")) persist(partners.filter(p => p.id !== id));
  }

  const totalMRR = partners.reduce((sum, p) => sum + p.clientsConverted * 697 * 0.2, 0);
  const totalIntros = partners.reduce((sum, p) => sum + p.introsDelivered, 0);
  const totalClients = partners.reduce((sum, p) => sum + p.clientsConverted, 0);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Referral Partners</h1>
          <p className="text-muted-foreground text-sm">{partners.length} partners tracked</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Partner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Referral Partner</DialogTitle></DialogHeader>
            <PartnerForm initial={EMPTY} onSave={handleAdd} onClose={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-3 pb-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Total Intros</div>
          <div className="text-2xl font-bold text-blue-400">{totalIntros}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Clients Converted</div>
          <div className="text-2xl font-bold text-green-400">{totalClients}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Referral MRR</div>
          <div className="text-2xl font-bold text-primary">${totalMRR.toFixed(0)}/mo</div>
        </CardContent></Card>
      </div>

      {/* Partner cards */}
      <div className="space-y-3">
        {partners.map(p => {
          const mrrGen = p.clientsConverted * 697 * 0.2;
          return (
            <Card key={p.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-muted-foreground text-sm">· {p.company}</span>
                      <Badge variant="outline" className="text-xs">{p.type}</Badge>
                      <Badge variant={statusColors[p.status] as "secondary" | "info" | "warning" | "success"} className="text-xs">
                        {p.status}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                      <div><span className="text-muted-foreground text-xs">Intros: </span><span className="font-medium">{p.introsDelivered}</span></div>
                      <div><span className="text-muted-foreground text-xs">Converted: </span><span className="font-medium">{p.clientsConverted}</span></div>
                      <div><span className="text-muted-foreground text-xs">MRR gen: </span><span className="font-medium text-green-400">${mrrGen.toFixed(0)}/mo</span></div>
                      {p.lastContactDate && <div><span className="text-muted-foreground text-xs">Last: </span><span className="font-medium">{p.lastContactDate}</span></div>}
                    </div>
                    {p.nextAction && (
                      <div className="mt-2 text-xs text-muted-foreground bg-secondary rounded px-2 py-1.5">
                        <TrendingUp className="h-3 w-3 inline mr-1" />{p.nextAction}
                      </div>
                    )}
                    {p.notes && <div className="mt-1.5 text-xs text-muted-foreground">{p.notes}</div>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPartner(p)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editPartner} onOpenChange={o => !o && setEditPartner(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Partner — {editPartner?.name}</DialogTitle></DialogHeader>
          {editPartner && <PartnerForm initial={editPartner} onSave={handleEdit} onClose={() => setEditPartner(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
