export type Vertical = "Cleaning" | "HVAC" | "Landscaping" | "Staffing" | "Agency" | "IT/MSP" | "Other";
export type DealStage = "Outreach" | "Discovery" | "Demo" | "Proposal" | "Pilot" | "Archived";
export type Priority = "High" | "Medium" | "Low";
export type DealStatus = "Hot" | "Warm" | "Cold" | "Stalled";
export type OutreachMethod = "Phone Call" | "Voicemail + Email" | "Email Only" | "LinkedIn" | "In-Person";
export type ContactOutcome =
  | "Connected - Qualified"
  | "Connected - Disqualified"
  | "Voicemail Left"
  | "No Answer"
  | "Not Interested"
  | "Discovery Call Booked"
  | "Demo Booked";
export type PartnerType = "CPA" | "QB ProAdvisor" | "Agency" | "Consultant" | "Other";
export type PartnerStatus = "Not Contacted" | "Contacted" | "Loom Sent" | "Agreement Signed" | "Delivering Intros" | "Inactive";

export interface Deal {
  id: string;
  company: string;
  contact: string;
  vertical: Vertical;
  stage: DealStage;
  lastContactDate: string; // ISO date
  nextAction: string;
  nextActionDue: string; // ISO date
  notes: string;
  priority: Priority;
  dealValue: string; // could be "$X/mo" or "referral" or "TBD"
  status: DealStatus;
  createdAt: string;
}

export interface ContactLog {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  vertical: Vertical;
  method: OutreachMethod;
  outcome: ContactOutcome;
  notes: string;
  date: string; // ISO date
}

export interface WeekTask {
  id: string;
  text: string;
  completed: boolean;
  week: number;
}

export interface ReferralPartner {
  id: string;
  name: string;
  company: string;
  type: PartnerType;
  status: PartnerStatus;
  introsDelivered: number;
  clientsConverted: number;
  lastContactDate: string;
  nextAction: string;
  notes: string;
}

export interface SprintMetrics {
  clientsSigned: number;
  contactsMade: number;
  discoveryCalls: number;
  demosDelivered: number;
  proposalsSent: number;
}
