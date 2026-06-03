"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, PhoneCall, CalendarDays, BookOpen, Users, Settings, UserCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMetrics } from "@/lib/store";

const SPRINT_START = new Date("2026-06-01");
const SPRINT_TOTAL_DAYS = 30;

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Target },
  { href: "/contacts", label: "Contacts", icon: PhoneCall },
  { href: "/weekly", label: "Weekly Plan", icon: CalendarDays },
  { href: "/scripts", label: "Scripts", icon: BookOpen },
  { href: "/icp", label: "ICP & Platform", icon: UserCheck },
  { href: "/prospects", label: "Prospect Lists", icon: MapPin },
  { href: "/partners", label: "Referrals", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SprintShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [clientsSigned, setClientsSigned] = useState(0);
  

  useEffect(() => {
    const now = new Date();
    const total = SPRINT_TOTAL_DAYS;
    const elapsed = Math.min(total, Math.max(0, Math.ceil((now.getTime() - SPRINT_START.getTime()) / 86400000)));
    setDaysElapsed(elapsed);
    setDaysRemaining(Math.max(0, total - elapsed));
    const m = getMetrics();
    setClientsSigned(m.clientsSigned);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sprint Banner */}
      <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium px-4">
        June Sprint &nbsp;·&nbsp; <span className="font-bold">{daysRemaining} days remaining</span> &nbsp;·&nbsp;{" "}
        <span className={cn("font-bold", clientsSigned >= 5 ? "text-green-300" : clientsSigned >= 3 ? "text-yellow-300" : "text-white")}>
          {clientsSigned} of 5 clients signed
        </span>
        &nbsp;·&nbsp; Day {daysElapsed} of 30
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className={cn(
          "hidden md:flex flex-col w-56 border-r border-border bg-card shrink-0",
        )}>
          <div className="p-4 border-b border-border">
            <div className="text-lg font-bold text-primary">LunarLogic</div>
            <div className="text-xs text-muted-foreground">AI-Powered Accounting Automation</div>
          </div>
          <div className="flex flex-col gap-1 p-2 flex-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex justify-around px-1 py-2">
          {NAV.filter(n => n.href !== "/settings").map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded text-xs",
                pathname === href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}
          <Link href="/settings" className={cn("flex flex-col items-center gap-0.5 px-2 py-1 rounded text-xs", pathname === "/settings" ? "text-primary" : "text-muted-foreground")}>
            <Settings className="h-5 w-5" />
          </Link>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
