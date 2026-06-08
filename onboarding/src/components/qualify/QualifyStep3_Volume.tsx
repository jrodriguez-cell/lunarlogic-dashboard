'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { qualifyStep3Schema, type QualifyStep3Data } from '@/lib/qualify-validations';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { computeROI, parseRevenueToNumber, parseDSOToNumber, formatCurrency } from '@/lib/roi';

interface Props {
  data: Partial<QualifyStep3Data>;
  annualRevenue: string;
  onUpdate: (data: Partial<QualifyStep3Data>) => void;
  onValidChange: (valid: boolean) => void;
}

const invoiceCountOptions = [
  { value: 'Under 30', label: 'Under 30 / month' },
  { value: '30–75', label: '30–75 / month' },
  { value: '76–150', label: '76–150 / month' },
  { value: '151–250', label: '151–250 / month' },
  { value: '251–400', label: '251–400 / month' },
  { value: '400+', label: '400+ / month' },
];

const dsoOptions = [
  { value: "I don't know (we'll estimate)", label: "I'm not sure — use the industry average" },
  { value: 'Under 20 days (very healthy)', label: 'Under 20 days (very fast)' },
  { value: '20 – 30 days', label: '20–30 days' },
  { value: '30 – 45 days', label: '30–45 days' },
  { value: '45 – 60 days', label: '45–60 days' },
  { value: '60 – 90 days', label: '60–90 days' },
  { value: 'Over 90 days', label: 'Over 90 days' },
];

export function QualifyStep3_Volume({ data, annualRevenue, onUpdate, onValidChange }: Props) {
  const { register, watch, formState: { errors, isValid }, trigger } = useForm<QualifyStep3Data>({
    resolver: zodResolver(qualifyStep3Schema),
    defaultValues: {
      monthlyInvoiceCount: data.monthlyInvoiceCount ?? '',
      currentDso: data.currentDso ?? '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  useEffect(() => { onUpdate(watchedValues); }, [JSON.stringify(watchedValues)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onValidChange(isValid); }, [isValid, onValidChange]);
  useEffect(() => { void trigger(); }, [trigger]);

  // Live ROI preview
  const revenue = parseRevenueToNumber(annualRevenue);
  const dso = parseDSOToNumber(watchedValues.currentDso ?? '');
  const showROI = revenue > 0 && dso > 0;
  const roi = showROI ? computeROI(revenue, dso) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">Two quick numbers</h2>
        <p className="text-gray-400 mt-1">This is all we need to model your ROI before the call.</p>
      </div>

      <div>
        <Label htmlFor="monthlyInvoiceCount">How many invoices do you send per month? *</Label>
        <Select
          id="monthlyInvoiceCount"
          placeholder="Select volume..."
          options={invoiceCountOptions}
          {...register('monthlyInvoiceCount')}
        />
        {errors.monthlyInvoiceCount && <p className="text-red-400 text-xs mt-1">{errors.monthlyInvoiceCount.message}</p>}
      </div>

      <div>
        <Label htmlFor="currentDso">How long does it typically take customers to pay? *</Label>
        <p className="text-gray-500 text-xs mb-1.5">This is your Days Sales Outstanding (DSO). If you're not sure, pick "I'm not sure" — we'll estimate from your industry average.</p>
        <Select
          id="currentDso"
          placeholder="Select DSO range..."
          options={dsoOptions}
          {...register('currentDso')}
        />
        {errors.currentDso && <p className="text-red-400 text-xs mt-1">{errors.currentDso.message}</p>}
      </div>

      {/* Live ROI preview */}
      {roi && (
        <div
          className={cn(
            'rounded-xl border p-5 transition-all duration-500',
          )}
          style={{ borderColor: 'rgba(0,196,140,0.3)', background: 'rgba(0,196,140,0.06)' }}
        >
          <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3">Your estimated Year 1 value</p>
          <p className="text-4xl font-black text-emerald-400">{formatCurrency(roi.totalYear1)}</p>
          <p className="text-gray-400 text-sm mt-1.5">
            DSO: <span className="text-amber-400 font-semibold">{roi.currentDSO} days</span>
            {' → '}
            <span className="text-emerald-400 font-semibold">{roi.targetDSO} days</span>
            <span className="text-gray-500 ml-2">·  {roi.roi}x ROI</span>
          </p>
          <p className="text-gray-600 text-xs mt-2 italic">We'll break this down in detail on your discovery call.</p>
        </div>
      )}
    </div>
  );
}
