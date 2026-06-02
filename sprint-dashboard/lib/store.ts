"use client";
import { Deal, ContactLog, WeekTask, ReferralPartner, SprintMetrics } from "./types";

const KEYS = {
  deals: "sprint_deals",
  contacts: "sprint_contacts",
  tasks: "sprint_tasks",
  partners: "sprint_partners",
  metrics: "sprint_metrics",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Deals ──────────────────────────────────────────────────────────────────

const DEFAULT_DEALS: Deal[] = [
  {
    id: "d1",
    company: "Gualapack US",
    contact: "Pedro Fernandez",
    vertical: "Other",
    stage: "Proposal",
    lastContactDate: "2026-05-04",
    nextAction: "Call Pedro — force yes/no on materials",
    nextActionDue: "2026-06-02",
    notes:
      "24-day stall. POC agreed May 4. Needs customer list, payment terms, sample invoices. Send permission-to-close-file if no materials by June 5.",
    priority: "High",
    dealValue: "$349/mo",
    status: "Stalled",
    createdAt: "2026-05-04",
  },
  {
    id: "d2",
    company: "James Welborn → PwC",
    contact: "James Welborn",
    vertical: "Agency",
    stage: "Outreach",
    lastContactDate: "2026-05-20",
    nextAction: "Send 20-min Loom product walkthrough",
    nextActionDue: "2026-06-03",
    notes:
      "Referral partner. Unlocks Mike Castro at PwC. Must see product before making intro.",
    priority: "High",
    dealValue: "referral",
    status: "Warm",
    createdAt: "2026-05-20",
  },
  {
    id: "d3",
    company: "Peter Sukits — Forvis Mazars",
    contact: "Peter Sukits",
    vertical: "Other",
    stage: "Discovery",
    lastContactDate: "2026-05-25",
    nextAction: "Schedule 20-min qualification call",
    nextActionDue: "2026-06-05",
    notes:
      "Senior Finance Director. Active vendor evaluation. Qualify on 4 questions — if enterprise cycle, pivot to referral partner.",
    priority: "Medium",
    dealValue: "TBD",
    status: "Warm",
    createdAt: "2026-05-25",
  },
  {
    id: "d4",
    company: "Siegfried Group Miami",
    contact: "Diego Zerga + 4 contacts",
    vertical: "Other",
    stage: "Outreach",
    lastContactDate: "2026-05-28",
    nextAction: "LinkedIn DM + email all 5 contacts",
    nextActionDue: "2026-06-07",
    notes:
      "Referral partners. Diego Zerga, Laxman Nadesapillai, Kate Binder, Alexander Marina, Usama Waheed. Lead with referral commission pitch.",
    priority: "High",
    dealValue: "referral",
    status: "Cold",
    createdAt: "2026-05-28",
  },
  {
    id: "d5",
    company: "Ryan Williams — Assistabyte",
    contact: "Ryan Williams",
    vertical: "Agency",
    stage: "Discovery",
    lastContactDate: "2026-05-22",
    nextAction: "Schedule in-person coffee, bring referral proposal in writing",
    nextActionDue: "2026-06-12",
    notes:
      "AI automation agency. Reciprocal referral partner. Need to formalize commission structure and get commitment on first exchange.",
    priority: "Medium",
    dealValue: "referral",
    status: "Warm",
    createdAt: "2026-05-22",
  },
];

export function getDeals(): Deal[] {
  const stored = load<Deal[] | null>(KEYS.deals, null);
  if (stored) return stored;
  save(KEYS.deals, DEFAULT_DEALS);
  return DEFAULT_DEALS;
}
export function saveDeals(deals: Deal[]): void {
  save(KEYS.deals, deals);
}

// ── Contacts ───────────────────────────────────────────────────────────────

export function getContacts(): ContactLog[] {
  return load<ContactLog[]>(KEYS.contacts, []);
}
export function saveContacts(contacts: ContactLog[]): void {
  save(KEYS.contacts, contacts);
}

// ── Tasks ──────────────────────────────────────────────────────────────────

const DEFAULT_TASKS: WeekTask[] = [
  // Week 1
  { id: "w1t1", week: 1, completed: false, text: "Call Pedro — force yes/no on Gualapack materials by Wednesday June 4" },
  { id: "w1t2", week: 1, completed: false, text: "Send James Welborn 20-min Loom product walkthrough by June 3" },
  { id: "w1t3", week: 1, completed: false, text: "Send Gualapack permission-to-close-file if no materials by June 5" },
  { id: "w1t4", week: 1, completed: false, text: "Build Charlotte prospect list — 50 firms (cleaning, HVAC, landscaping, staffing)" },
  { id: "w1t5", week: 1, completed: false, text: "Contact all 5 Siegfried Group Miami contacts by June 7" },
  { id: "w1t6", week: 1, completed: false, text: "5 cold calls/day June 3–7 (25 total from Charlotte trades list)" },
  { id: "w1t7", week: 1, completed: false, text: "Qualify Peter Sukits — schedule 20-min discovery call" },
  // Week 2
  { id: "w2t1", week: 2, completed: false, text: "Final Gualapack decision — POC build starts or file closed June 8" },
  { id: "w2t2", week: 2, completed: false, text: "Run discovery calls from Week 1 responses — qualify on 4 questions" },
  { id: "w2t3", week: 2, completed: false, text: "In-person coffee with Ryan Williams — bring referral proposal in writing" },
  { id: "w2t4", week: 2, completed: false, text: "QB ProAdvisor outreach — 10 ProAdvisors in Charlotte and Miami" },
  { id: "w2t5", week: 2, completed: false, text: "Attend one Charlotte networking event (trades or small business focus)" },
  { id: "w2t6", week: 2, completed: false, text: "5 cold calls/day (25 total) — use landscaping peak season hook" },
  { id: "w2t7", week: 2, completed: false, text: "Close first client — Shadow Mode pilot offer" },
  // Week 3
  { id: "w3t1", week: 3, completed: false, text: "Close Week 2 demo pipeline — every open proposal gets a close call" },
  { id: "w3t2", week: 3, completed: false, text: "Referral partners deliver first introductions — make ask explicit with specific names" },
  { id: "w3t3", week: 3, completed: false, text: "James Welborn → Mike Castro PwC intro call scheduled" },
  { id: "w3t4", week: 3, completed: false, text: "Onboard clients 1–2 — Shadow Mode, QuickBooks connection, Outlook send-as" },
  { id: "w3t5", week: 3, completed: false, text: "Maintain 5 contacts/day — outbound does not stop during onboarding" },
  { id: "w3t6", week: 3, completed: false, text: "Second client signed" },
  // Week 4
  { id: "w4t1", week: 4, completed: false, text: "Close clients 4 and 5 — every open proposal gets a close call" },
  { id: "w4t2", week: 4, completed: false, text: "Pull Shadow Mode early metrics from clients in Week 2" },
  { id: "w4t3", week: 4, completed: false, text: "PwC Mike Castro meeting — same-week follow-up" },
  { id: "w4t4", week: 4, completed: false, text: "Pre-book 10 discovery calls for first week of July" },
  { id: "w4t5", week: 4, completed: false, text: "Sprint retrospective — which verticals converted, which referral sources delivered" },
  { id: "w4t6", week: 4, completed: false, text: "Draft 2 case studies from June clients" },
];

export function getTasks(): WeekTask[] {
  const stored = load<WeekTask[] | null>(KEYS.tasks, null);
  if (stored) return stored;
  save(KEYS.tasks, DEFAULT_TASKS);
  return DEFAULT_TASKS;
}
export function saveTasks(tasks: WeekTask[]): void {
  save(KEYS.tasks, tasks);
}

// ── Partners ───────────────────────────────────────────────────────────────

const DEFAULT_PARTNERS: ReferralPartner[] = [
  { id: "p1", name: "James Welborn", company: "PwC", type: "Consultant", status: "Contacted", introsDelivered: 0, clientsConverted: 0, lastContactDate: "2026-05-20", nextAction: "Send Loom product walkthrough", notes: "Needs product review (Loom) before intro to Mike Castro" },
  { id: "p2", name: "Ryan Williams", company: "Assistabyte", type: "Agency", status: "Contacted", introsDelivered: 0, clientsConverted: 0, lastContactDate: "2026-05-22", nextAction: "In-person coffee — bring formal agreement", notes: "Reciprocal referral. Need formal agreement with commission structure in writing." },
  { id: "p3", name: "Diego Zerga", company: "Siegfried Group Miami", type: "CPA", status: "Not Contacted", introsDelivered: 0, clientsConverted: 0, lastContactDate: "", nextAction: "LinkedIn DM + email by June 7", notes: "Contact by June 7" },
  { id: "p4", name: "Laxman Nadesapillai", company: "Siegfried Group Miami", type: "CPA", status: "Not Contacted", introsDelivered: 0, clientsConverted: 0, lastContactDate: "", nextAction: "LinkedIn DM + email by June 7", notes: "" },
  { id: "p5", name: "Kate Binder", company: "Siegfried Group Miami", type: "CPA", status: "Not Contacted", introsDelivered: 0, clientsConverted: 0, lastContactDate: "", nextAction: "LinkedIn DM + email by June 7", notes: "" },
  { id: "p6", name: "Alexander Marina", company: "Siegfried Group Miami", type: "CPA", status: "Not Contacted", introsDelivered: 0, clientsConverted: 0, lastContactDate: "", nextAction: "LinkedIn DM + email by June 7", notes: "" },
  { id: "p7", name: "Usama Waheed", company: "Siegfried Group Miami", type: "CPA", status: "Not Contacted", introsDelivered: 0, clientsConverted: 0, lastContactDate: "", nextAction: "LinkedIn DM + email by June 7", notes: "" },
];

export function getPartners(): ReferralPartner[] {
  const stored = load<ReferralPartner[] | null>(KEYS.partners, null);
  if (stored) return stored;
  save(KEYS.partners, DEFAULT_PARTNERS);
  return DEFAULT_PARTNERS;
}
export function savePartners(partners: ReferralPartner[]): void {
  save(KEYS.partners, partners);
}

// ── Metrics ────────────────────────────────────────────────────────────────

const DEFAULT_METRICS: SprintMetrics = {
  clientsSigned: 0,
  contactsMade: 0,
  discoveryCalls: 0,
  demosDelivered: 0,
  proposalsSent: 0,
};

export function getMetrics(): SprintMetrics {
  return load<SprintMetrics>(KEYS.metrics, DEFAULT_METRICS);
}
export function saveMetrics(m: SprintMetrics): void {
  save(KEYS.metrics, m);
}

// ── Reset ──────────────────────────────────────────────────────────────────

export function resetAll(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function exportAll(): string {
  const data = {
    deals: getDeals(),
    contacts: getContacts(),
    tasks: getTasks(),
    partners: getPartners(),
    metrics: getMetrics(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
