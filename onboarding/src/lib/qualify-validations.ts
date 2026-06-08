import { z } from 'zod';

export const qualifyStep1Schema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  ownerName: z.string().min(1, 'Your name is required'),
  ownerEmail: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  ownerPhone: z.string(),
  annualRevenue: z.string().min(1, 'Please select your annual revenue'),
  industry: z.string().min(1, 'Please select your industry'),
  industryOther: z.string(),
  employeeCount: z.string(),
});

export const qualifyStep2Schema = z.object({
  biggestArPain: z.string().min(20, 'Please describe your challenge (at least 20 characters)').max(500),
  biggestPainCategory: z.array(z.string()).min(1, 'Select at least one'),
  nearlyMissedPayroll: z.boolean(),
});

export const qualifyStep3Schema = z.object({
  monthlyInvoiceCount: z.string().min(1, 'Please select your monthly invoice volume'),
  currentDso: z.string().min(1, 'Please select your current DSO'),
});

export type QualifyStep1Data = z.infer<typeof qualifyStep1Schema>;
export type QualifyStep2Data = z.infer<typeof qualifyStep2Schema>;
export type QualifyStep3Data = z.infer<typeof qualifyStep3Schema>;

export type LeadData = QualifyStep1Data & QualifyStep2Data & QualifyStep3Data;
