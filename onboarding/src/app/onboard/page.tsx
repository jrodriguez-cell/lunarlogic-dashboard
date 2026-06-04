'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingData, ROIResult } from '@/types/onboarding';
import { WizardShell } from '@/components/wizard/WizardShell';
import { Step1_BusinessInfo } from '@/components/wizard/Step1_BusinessInfo';
import { Step2_QuickBooks } from '@/components/wizard/Step2_QuickBooks';
import { Step3_ARWorkflow } from '@/components/wizard/Step3_ARWorkflow';
import { Step4_InvoiceVolume } from '@/components/wizard/Step4_InvoiceVolume';
import { Step5_PainPoints } from '@/components/wizard/Step5_PainPoints';
import { Step6_Integrations } from '@/components/wizard/Step6_Integrations';
import { Step7_ModuleSelection } from '@/components/wizard/Step7_ModuleSelection';

const TOTAL_STEPS = 7;

const defaultData: OnboardingData = {
  businessName: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  annualRevenue: '',
  industry: '',
  industryOther: '',
  employeeCount: '',
  qbVersion: '',
  qbDesktopVersion: '',
  qbManager: '',
  qbCurrentState: '',
  invoiceCreation: '',
  invoiceDelivery: '',
  followupProcess: '',
  followupFrequency: '',
  monthlyInvoiceCount: '',
  avgInvoiceSize: '',
  currentDso: '',
  paymentTerms: '',
  biggestArPain: '',
  biggestPainCategory: [],
  nearlyMissedPayroll: false,
  biggestSlowPayer: '',
  usesStripe: false,
  usesSlack: false,
  usesGoogleSheets: false,
  usesQBPayments: false,
  usesEmail: false,
  usesOther: '',
  modulesSelected: ['IA', 'PR'],
  targetStartDate: '',
  additionalNotes: '',
};

export default function OnboardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(defaultData);
  const [stepValid, setStepValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleUpdate = useCallback((data: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleValidChange = useCallback((valid: boolean) => {
    setStepValid(valid);
  }, []);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
      setStepValid(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      setStepValid(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json() as { success: boolean; id?: string; roi?: ROIResult; errors?: unknown; error?: string };

      if (!res.ok || !json.success) {
        const detail = json.error ?? (json.errors ? 'Validation error — check all fields.' : 'Server error');
        setSubmitError(`Submission failed: ${detail}. Email team@lunarlogic.ai if this persists.`);
        return;
      }

      const roiParam = encodeURIComponent(JSON.stringify(json.roi));
      router.push(`/onboard/complete?id=${json.id}&roi=${roiParam}`);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepProps = {
    data: formData,
    onUpdate: handleUpdate,
    onValidChange: handleValidChange,
  };

  return (
    <>
      {submitError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-red-500/30 bg-red-500/20 px-6 py-3 text-red-300 text-sm shadow-lg max-w-md text-center">
          {submitError}
        </div>
      )}
      <WizardShell
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        canProgress={stepValid}
      >
        {currentStep === 1 && <Step1_BusinessInfo {...stepProps} />}
        {currentStep === 2 && <Step2_QuickBooks {...stepProps} />}
        {currentStep === 3 && <Step3_ARWorkflow {...stepProps} />}
        {currentStep === 4 && <Step4_InvoiceVolume {...stepProps} />}
        {currentStep === 5 && <Step5_PainPoints {...stepProps} />}
        {currentStep === 6 && <Step6_Integrations {...stepProps} />}
        {currentStep === 7 && <Step7_ModuleSelection {...stepProps} />}
      </WizardShell>
    </>
  );
}
