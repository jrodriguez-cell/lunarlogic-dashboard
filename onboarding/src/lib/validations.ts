import { z } from 'zod';

export const step1Schema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  ownerName: z.string().min(1, 'Your name is required'),
  ownerEmail: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  ownerPhone: z.string().optional(),
  annualRevenue: z.string().min(1, 'Please select your annual revenue'),
  industry: z.string().min(1, 'Please select your industry'),
  industryOther: z.string().optional(),
  employeeCount: z.string().optional(),
});

export const step2Schema = z.object({
  qbVersion: z.union([z.literal('Online'), z.literal('Desktop'), z.literal('')]).refine(
    (v): v is 'Online' | 'Desktop' => v !== '',
    { message: 'Please select your QuickBooks version' }
  ),
  qbDesktopVersion: z.string().optional(),
  qbManager: z.string().min(1, 'Please select who manages QuickBooks'),
  qbCurrentState: z.string().min(1, 'Please select the current state of your QuickBooks'),
});

export const step3Schema = z.object({
  invoiceCreation: z.string().min(1, 'Please select how invoices are created'),
  invoiceDelivery: z.string().min(1, 'Please select how invoices are delivered'),
  followupProcess: z.string().min(1, 'Please select your follow-up process'),
  followupFrequency: z.string().min(1, 'Please select your follow-up frequency'),
});

export const step4Schema = z.object({
  monthlyInvoiceCount: z.string().min(1, 'Please select your monthly invoice count'),
  avgInvoiceSize: z.string().min(1, 'Please select your average invoice size'),
  currentDso: z.string().min(1, 'Please select your current DSO'),
  paymentTerms: z.string().min(1, 'Please select your payment terms'),
});

export const step5Schema = z.object({
  biggestArPain: z.string().min(20, 'Please describe your biggest AR pain (at least 20 characters)').max(1000, 'Maximum 1000 characters'),
  biggestPainCategory: z.array(z.string()).min(1, 'Please select at least one pain category'),
  nearlyMissedPayroll: z.boolean(),
  biggestSlowPayer: z.string().optional(),
});

export const step6Schema = z.object({
  usesStripe: z.boolean(),
  usesSlack: z.boolean(),
  usesGoogleSheets: z.boolean(),
  usesQBPayments: z.boolean().optional(),
  usesEmail: z.boolean().optional(),
  usesOther: z.string().optional(),
});

export const step7Schema = z.object({
  modulesSelected: z.array(z.enum(['IA', 'PR', 'SO', 'AR'])).min(1, 'Please select at least one module'),
  targetStartDate: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export const onboardingSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step7Schema);

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step7Data = z.infer<typeof step7Schema>;
export type OnboardingSchemaData = z.infer<typeof onboardingSchema>;
