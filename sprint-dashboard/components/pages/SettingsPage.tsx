"use client";
import { useState } from "react";
import { resetAll, exportAll } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Trash2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleExport() {
    const json = exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sprint-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function handleReset() {
    resetAll();
    setConfirmOpen(false);
    window.location.reload();
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Data management and backup</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Export Backup</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Download all sprint data as a JSON file. Use this as a backup before any major changes.</p>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export All Data (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-sm text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Permanently delete all sprint data including deals, contacts, tasks, and partners. This cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Reset All Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">About</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>LunarLogic Sprint Dashboard</p>
          <p>June 1–30, 2026 · 5 clients target</p>
          <p>Data stored in localStorage — no external servers</p>
          <p className="pt-2">Jonathan Rodriguez · jrodriguez@lunarlogic.ai</p>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirm Reset
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL sprint data — deals, contacts, weekly tasks, referral partners, and metrics. This action cannot be undone. Are you absolutely sure?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={handleReset} className="flex-1">Yes, delete everything</Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
