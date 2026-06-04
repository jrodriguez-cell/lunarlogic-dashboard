'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { OnboardingData } from '@/types/onboarding';
import { step4Schema, type Step4Data } from '@/lib/validations';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  data: Partial<OnboardingData>;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onValidChange: (valid: boolean) => void;
}

const invoiceCountTiers = [
  { value: 'Under 30', label: 'Under 30', sublabel: 'Starter volume', tier: 'Essentials', flag: true },
  { value: '30–75', label: '30–75', sublabel: 'Small business sweet spot', tier: 'Essentials', flag: false },
  { value: '76–150', label: '76–150', sublabel: 'Essentials plan range', tier: 'Essentials', flag: false },
  { value: '151–250', label: '151–250', sublabel: 'Professional plan range', tier: 'Professional', flag: false },
  { value: '251–400', label: '251–400', sublabel: 'Business plan range', tier: 'Business', flag: false },
  { value: '400+', label: '400+', sublabel: 'Enterprise volume', tier: 'Business+', flag: false },
];

const invoiceSizeTiers = [
  { value: 'Under $500', label: 'Under $500' },
  { value: '$500 – $2,500', label: '$500 – $2,500' },
  { value: '$2,500 – $10,000', label: '$2,500 – $10,000' },
  { value: '$10,000 – $50,000', label: '$10,000 – $50,000' },
  { value: 'Over $50,000', label: 'Over $50,000' },
];

const dsoOptions = [
  { value: "I don't know (we'll estimate)", label: "I don't know — use industry average" },
  { value: 'Under 20 days (very healthy)', label: 'Under 20 days (very healthy)' },
  { value: '20 – 30 days', label: '20 – 30 days' },
  { value: '30 – 45 days', label: '30 – 45 days' },
  { value: '45 – 60 days', label: '45 – 60 days' },
  { value: '60 – 90 days', label: '60 – 90 days' },
  { value: 'Over 90 days', label: 'Over 90 days' },
];

const paymentTermOptions = [
  { value: 'Due on receipt', label: 'Due on receipt' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Milestone-based', label: 'Milestone-based' },
  { value: 'Mixed terms', label: 'Mixed terms (varies by customer)' },
];

export function Step4_InvoiceVolume({ data, onUpdate, onValidChange }: Props) {
  const {
    register,
    watch,
    formState: { errors, isValid },
    trigger,
    setValue,
  } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      monthlyInvoiceCount: data.monthlyInvoiceCount ?? '',
      avgInvoiceSize: data.avgInvoiceSize ?? '',
      currentDso: data.currentDso ?? '',
      paymentTerms: data.paymentTerms ?? '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const selectedCount = watchedValues.monthlyInvoiceCount;
  const selectedSize = watchedValues.avgInvoiceSize;

  useEffect(() => {
    onUpdate(watchedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  // Force validation on mount so pre-filled data reports correct validity
  useEffect(() => { void trigger(); }, [trigger]);

  const selectedTier = invoiceCountTiers.find((t) => t.value === selectedCount);
  const showSoftDisqualifier = selectedTier?.flag;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">Invoice volume & metrics</h2>
        <p className="text-gray-400 mt-1">This determines your pricing tier and helps us model your ROI accurately.</p>
      </div>

      <div>
        <Label>Monthly invoice count *</Label>
        {errors.monthlyInvoiceCount && <p className="text-red-400 text-xs mb-1">{errors.monthlyInvoiceCount.message}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {invoiceCountTiers.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => setValue('monthlyInvoiceCount', tier.value, { shouldValidate: true })}
              className={cn(
                'rounded-xl border-2 p-3 text-left transition-all duration-200',
                selectedCount === tier.value
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
              )}
            >
              <div className="text-lg font-bold text-white">{tier.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{tier.sublabel}</div>
              <div className={cn('text-xs mt-1 font-semibold', {
                'text-indigo-400': tier.tier === 'Essentials',
                'text-sky-400': tier.tier === 'Professional',
                'text-emerald-400': tier.tier === 'Business' || tier.tier === 'Business+',
              })}>
                {tier.tier}
              </div>
            </button>
          ))}
        </div>
        {showSoftDisqualifier && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-amber-300 text-sm">
              💡 At under 30 invoices/month, automation ROI is smaller but still meaningful. Jonathan will help you determine if LunarLogic is the right fit.
            </p>
          </div>
        )}
      </div>

      <div>
        <Label>Average invoice size *</Label>
        {errors.avgInvoiceSize && <p className="text-red-400 text-xs mb-1">{errors.avgInvoiceSize.message}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {invoiceSizeTiers.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => setValue('avgInvoiceSize', tier.value, { shouldValidate: true })}
              className={cn(
                'rounded-xl border-2 p-3 text-left transition-all duration-200',
                selectedSize === tier.value
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
              )}
            >
              <span className="text-sm font-semibold">{tier.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="currentDso">Current DSO (Days Sales Outstanding) *</Label>
        <p className="text-gray-500 text-xs mb-2">Average days between invoice sent and payment received</p>
        <Select
          id="currentDso"
          placeholder="Select your current DSO..."
          options={dsoOptions}
          {...register('currentDso')}
        />
        {errors.currentDso && <p className="text-red-400 text-xs mt-1">{errors.currentDso.message}</p>}
      </div>

      <div>
        <Label htmlFor="paymentTerms">Standard payment terms *</Label>
        <Select
          id="paymentTerms"
          placeholder="Select terms..."
          options={paymentTermOptions}
          {...register('paymentTerms')}
        />
        {errors.paymentTerms && <p className="text-red-400 text-xs mt-1">{errors.paymentTerms.message}</p>}
      </div>
    </div>
  );
}
