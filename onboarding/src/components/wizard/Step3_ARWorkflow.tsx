'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { OnboardingData } from '@/types/onboarding';
import { step3Schema, type Step3Data } from '@/lib/validations';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Props {
  data: Partial<OnboardingData>;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onValidChange: (valid: boolean) => void;
}

const creationOptions = [
  { value: 'Manually in QuickBooks', label: 'Manually in QuickBooks' },
  { value: 'Manually in spreadsheet', label: 'Manually in spreadsheet' },
  { value: 'From sales orders / estimates', label: 'From sales orders / estimates' },
  { value: 'Third-party software', label: 'Third-party software' },
  { value: 'Mostly automated', label: 'Mostly automated already' },
];

const deliveryOptions = [
  { value: 'QuickBooks email', label: 'QuickBooks email' },
  { value: 'Regular email (Gmail/Outlook)', label: 'Regular email (Gmail / Outlook)' },
  { value: 'Printed and mailed', label: 'Printed and mailed' },
  { value: 'Customer portal', label: 'Customer portal' },
  { value: 'Mixed methods', label: 'Mixed methods' },
];

const followupOptions = [
  { value: 'No formal process', label: 'No formal process — ad hoc' },
  { value: 'Manual email/call', label: 'Manual email or phone call' },
  { value: 'Templated emails', label: 'Templated reminder emails' },
  { value: 'Third-party AR tool', label: 'Third-party AR tool' },
];

const frequencyOptions = [
  { value: 'Never / rarely', label: 'Never or rarely' },
  { value: 'Only when severely past due', label: 'Only when severely past due (30+ days)' },
  { value: 'Once per invoice when overdue', label: 'Once per invoice when overdue' },
  { value: 'Weekly reminders', label: 'Weekly reminders' },
  { value: 'Multiple per week', label: 'Multiple times per week' },
];

export function Step3_ARWorkflow({ data, onUpdate, onValidChange }: Props) {
  const {
    watch,
    formState: { errors, isValid },
    trigger,
    register,
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      invoiceCreation: data.invoiceCreation ?? '',
      invoiceDelivery: data.invoiceDelivery ?? '',
      followupProcess: data.followupProcess ?? '',
      followupFrequency: data.followupFrequency ?? '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  useEffect(() => {
    onUpdate(watchedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  useEffect(() => { void trigger(); }, [trigger]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">Your AR workflow today</h2>
        <p className="text-gray-400 mt-1">Help us understand where you are so we can show you where we take you.</p>
      </div>

      <div>
        <Label htmlFor="invoiceCreation">How are invoices currently created? *</Label>
        <Select
          id="invoiceCreation"
          placeholder="Select method..."
          options={creationOptions}
          {...register('invoiceCreation')}
        />
        {errors.invoiceCreation && <p className="text-red-400 text-xs mt-1">{errors.invoiceCreation.message}</p>}
      </div>

      <div>
        <Label htmlFor="invoiceDelivery">How are invoices delivered to customers? *</Label>
        <Select
          id="invoiceDelivery"
          placeholder="Select method..."
          options={deliveryOptions}
          {...register('invoiceDelivery')}
        />
        {errors.invoiceDelivery && <p className="text-red-400 text-xs mt-1">{errors.invoiceDelivery.message}</p>}
      </div>

      <div>
        <Label htmlFor="followupProcess">Current follow-up process *</Label>
        <Select
          id="followupProcess"
          placeholder="Select process..."
          options={followupOptions}
          {...register('followupProcess')}
        />
        {errors.followupProcess && <p className="text-red-400 text-xs mt-1">{errors.followupProcess.message}</p>}
      </div>

      <div>
        <Label htmlFor="followupFrequency">How often do you follow up on overdue invoices? *</Label>
        <Select
          id="followupFrequency"
          placeholder="Select frequency..."
          options={frequencyOptions}
          {...register('followupFrequency')}
        />
        {errors.followupFrequency && <p className="text-red-400 text-xs mt-1">{errors.followupFrequency.message}</p>}
      </div>
    </div>
  );
}
