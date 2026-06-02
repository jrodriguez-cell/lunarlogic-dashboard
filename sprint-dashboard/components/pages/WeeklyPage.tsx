"use client";
import { useState, useEffect } from "react";
import { getTasks, saveTasks } from "@/lib/store";
import { WeekTask } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const WEEKS = [
  { week: 1, dates: "June 1–7", focus: "Force Gualapack decision · Lock message · Build the list" },
  { week: 2, dates: "June 8–14", focus: "First close · Discovery call volume · Referral activation" },
  { week: 3, dates: "June 15–21", focus: "Close to 3 clients · Referrals delivering · Onboard clients 1–2" },
  { week: 4, dates: "June 22–30", focus: "Close to 5 · Pull early results · Build July pipeline" },
];

function getWeekStatus(tasks: WeekTask[], week: number): "Not Started" | "In Progress" | "Complete" {
  const wt = tasks.filter((t) => t.week === week);
  if (wt.length === 0) return "Not Started";
  const done = wt.filter((t) => t.completed).length;
  if (done === 0) return "Not Started";
  if (done === wt.length) return "Complete";
  return "In Progress";
}

const statusBadge: Record<string, string> = {
  "Not Started": "secondary",
  "In Progress": "warning",
  "Complete": "success",
};

function currentWeek(): number {
  const now = new Date();
  const sprintStart = new Date("2026-06-01");
  const diff = Math.floor((now.getTime() - sprintStart.getTime()) / (7 * 86400000));
  return Math.min(4, Math.max(1, diff + 1));
}

export default function WeeklyPage() {
  const [tasks, setTasks] = useState<WeekTask[]>([]);
  const active = currentWeek();

  useEffect(() => { setTasks(getTasks()); }, []);

  function toggle(id: string) {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    saveTasks(updated);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Weekly Plan</h1>
        <p className="text-muted-foreground text-sm">30-day sprint roadmap — Week {active} active</p>
      </div>

      <div className="space-y-4">
        {WEEKS.map(({ week, dates, focus }) => {
          const weekTasks = tasks.filter((t) => t.week === week);
          const done = weekTasks.filter((t) => t.completed).length;
          const pct = weekTasks.length > 0 ? Math.round((done / weekTasks.length) * 100) : 0;
          const status = getWeekStatus(tasks, week);
          const isActive = week === active;

          return (
            <Card key={week} className={cn(isActive && "border-primary/50 bg-primary/5")}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Week {week} · {dates}</CardTitle>
                      {isActive && <Badge variant="info" className="text-xs">Current</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{focus}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{done}/{weekTasks.length}</span>
                    <Badge variant={statusBadge[status] as "secondary" | "warning" | "success"}>{status}</Badge>
                  </div>
                </div>
                <Progress value={pct} className="mt-2 h-1.5" />
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {weekTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent/30",
                      task.completed && "opacity-50"
                    )}
                    onClick={() => toggle(task.id)}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggle(task.id)}
                      className="mt-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={cn("text-sm", task.completed && "line-through text-muted-foreground")}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
