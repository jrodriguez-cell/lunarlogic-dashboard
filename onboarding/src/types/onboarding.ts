export interface OnboardingData {
  // Step 1
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  annualRevenue: string;
  industry: string;
  industryOther?: string;
  employeeCount?: string;
  // Step 2
  qbVersion: 'Online' | 'Desktop' | '';
  qbDesktopVersion?: string;
  qbManager: string;
  qbCurrentState: string;
  // Step 3
  invoiceCreation: string;
  invoiceDelivery: string;
  followupProcess: string;
  followupFrequency: string;
  // Step 4
  monthlyInvoiceCount: string;
  avgInvoiceSize: string;
  currentDso: string;
  paymentTerms: string;
  // Step 5
  biggestArPain: string;
  biggestPainCategory: string[];
  nearlyMissedPayroll: boolean;
  biggestSlowPayer?: string;
  // Step 6
  usesStripe: boolean;
  usesSlack: boolean;
  usesGoogleSheets: boolean;
  usesQBPayments?: boolean;
  usesEmail?: boolean;
  usesOther?: string;
  // Step 7
  modulesSelected: ('IA' | 'PR' | 'SO' | 'AR')[];
  targetStartDate?: string;
  additionalNotes?: string;
}

export interface ROIResult {
  currentDSO: number;
  targetDSO: number;
  wcLocked: number;
  wcReleased: number;
  badDebtSavings: number;
  unbilledRecovered: number;
  laborSaved: number;
  totalYear1: number;
  roi: number;
}

export interface Submission extends OnboardingData {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'new' | 'reviewed' | 'proposal_sent' | 'active';
  adminNotes?: string;
  roiAnnualRevenue?: number;
  roiCurrentDso?: number;
  roiWorkingCapital?: number;
  roiWcReleased?: number;
}
