'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { OnboardingData } from '@/types/onboarding';
import { step1Schema, type Step1Data } from '@/lib/validations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Props {
  data: Partial<OnboardingData>;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onValidChange: (valid: boolean) => void;
}

const revenueOptions = [
  { value: 'Under $500K', label: 'Under $500K' },
  { value: '$500K – $750K', label: '$500K – $750K' },
  { value: '$750K – $1.5M', label: '$750K – $1.5M' },
  { value: '$1.5M – $2.5M', label: '$1.5M – $2.5M' },
  { value: '$2.5M – $5M', label: '$2.5M – $5M' },
  { value: '$5M – $10M', label: '$5M – $10M' },
  { value: 'Over $10M', label: 'Over $10M' },
];

const industryOptions = [
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Cleaning & Facilities', label: 'Cleaning & Facilities' },
  { value: 'Construction & Trades', label: 'Construction & Trades' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Marketing & Creative', label: 'Marketing & Creative' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Other', label: 'Other' },
];

const employeeOptions = [
  { value: '1–5', label: '1–5 employees' },
  { value: '6–10', label: '6–10 employees' },
  { value: '11–20', label: '11–20 employees' },
  { value: '21–50', label: '21–50 employees' },
  { value: '50+', label: '50+ employees' },
];

export function Step1_BusinessInfo({ data, onUpdate, onValidChange }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: data.businessName ?? '',
      ownerName: data.ownerName ?? '',
      ownerEmail: data.ownerEmail ?? '',
      ownerPhone: data.ownerPhone ?? '',
      annualRevenue: data.annualRevenue ?? '',
      industry: data.industry ?? '',
      industryOther: data.industryOther ?? '',
      employeeCount: data.employeeCount ?? '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const selectedRevenue = watchedValues.annualRevenue;
  const selectedIndustry = watchedValues.industry;

  useEffect(() => {
    onUpdate(watchedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  // Force validation on mount so pre-filled data reports correct validity
  useEffect(() => { void trigger(); }, [trigger]);

  const isSmallRevenue = selectedRevenue === 'Under $500K';

  return (
    <form onSubmit={handleSubmit(() => {})} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">Tell us about your business</h2>
        <p className="text-gray-400 mt-1">We use this to build your custom automation plan and ROI model.</p>
      </div>

      {isSmallRevenue && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-amber-400 text-sm font-medium">ℹ️ Revenue note</p>
          <p className="text-amber-300/80 text-sm mt-1">
            LunarLogic works best for businesses with $500K+ in annual revenue. You may still qualify — our team will review your fit during the discovery call.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input id="businessName" placeholder="Kaptain Clean LLC" {...register('businessName')} />
          {errors.businessName && <p className="text-red-400 text-xs mt-1">{errors.businessName.message}</p>}
        </div>
        <div>
          <Label htmlFor="ownerName">Your Name *</Label>
          <Input id="ownerName" placeholder="Jane Smith" {...register('ownerName')} />
          {errors.ownerName && <p className="text-red-400 text-xs mt-1">{errors.ownerName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ownerEmail">Email Address *</Label>
          <Input id="ownerEmail" type="email" placeholder="jane@example.com" {...register('ownerEmail')} />
          {errors.ownerEmail && <p className="text-red-400 text-xs mt-1">{errors.ownerEmail.message}</p>}
        </div>
        <div>
          <Label htmlFor="ownerPhone">Phone (optional)</Label>
          <Input id="ownerPhone" type="tel" placeholder="(555) 123-4567" {...register('ownerPhone')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="annualRevenue">Annual Revenue *</Label>
          <Select
            id="annualRevenue"
            placeholder="Select range..."
            options={revenueOptions}
            {...register('annualRevenue')}
          />
          {errors.annualRevenue && <p className="text-red-400 text-xs mt-1">{errors.annualRevenue.message}</p>}
        </div>
        <div>
          <Label htmlFor="employeeCount">Employee Count</Label>
          <Select
            id="employeeCount"
            placeholder="Select range..."
            options={employeeOptions}
            {...register('employeeCount')}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="industry">Industry *</Label>
        <Select
          id="industry"
          placeholder="Select industry..."
          options={industryOptions}
          {...register('industry')}
        />
        {errors.industry && <p className="text-red-400 text-xs mt-1">{errors.industry.message}</p>}
      </div>

      {selectedIndustry === 'Other' && (
        <div>
          <Label htmlFor="industryOther">Please describe your industry</Label>
          <Input id="industryOther" placeholder="e.g., Landscape Management" {...register('industryOther')} />
        </div>
      )}
    </form>
  );
}
