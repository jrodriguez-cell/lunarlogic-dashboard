'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { OnboardingData } from '@/types/onboarding';
import { step3Schema, type Step3Data } from '@/lib/validations';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  data: Partial<OnboardingData>;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onValidChange: (valid: boolean) => void;
}

const creationOptions = [
  { value: 'Manually in QuickBooks', label: 'Manually in QuickBooks', icon: '✍️' },
  { value: 'Manually in spreadsheet', label: 'Manually in spreadsheet', icon: '📊' },
  { value: 'From sales orders / estimates', label: 'From sales orders / estimates', icon: '📋' },
  { value: 'Third-party software', label: 'Third-party software', icon: '🔧' },
  { value: 'Mostly automated', label: 'Mostly automated already', icon: '⚡' },
];

const deliveryOptions = [
  { value: 'QuickBooks email', label: 'QuickBooks email', icon: '📧' },
  { value: 'Regular email (Gmail/Outlook)', label: 'Regular email', icon: '✉️' },
  { value: 'Printed and mailed', label: 'Printed and mailed', icon: '📬' },
  { value: 'Customer portal', label: 'Customer portal', icon: '🌐' },
  { value: 'Mixed methods', label: 'Mixed methods', icon: '🔀' },
];

const followupOptions = [
  { value: 'No formal process', label: 'No formal process — ad hoc', icon: '🤷' },
  { value: 'Manual email/call', label: 'Manual email or phone call', icon: '📞' },
  { value: 'Templated emails', label: 'Templated reminder emails', icon: '📝' },
  { value: 'Third-party AR tool', label: 'Third-party AR tool', icon: '🛠️' },
];

const frequencyOptions = [
  { value: 'Never / rarely', label: 'Never or rarely' },
  { value: 'Only when severely past due', label: 'Only when severely past due (30+ days)' },
  { value: 'Once per invoice when overdue', label: 'Once per invoice when overdue' },
  { value: 'Weekly reminders', label: 'Weekly reminders' },
  { value: 'Multiple per week', label: 'Multiple times per week' },
];

interface RadioCardProps {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function RadioCard({ selected, onClick, icon, label }: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border-2 p-3 text-left transition-all duration-200 flex items-center gap-3 w-full',
        selected
          ? 'border-indigo-500 bg-indigo-500/10 text-white'
          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export function Step3_ARWorkflow({ data, onUpdate, onValidChange }: Props) {
  const {
    watch,
    formState: { errors, isValid },
    setValue,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">Your AR workflow today</h2>
        <p className="text-gray-400 mt-1">Help us understand where you are so we can show you where we take you.</p>
      </div>

      <div>
        <Label>How are invoices currently created? *</Label>
        {errors.invoiceCreation && <p className="text-red-400 text-xs mb-1">{errors.invoiceCreation.message}</p>}
        <div className="space-y-2 mt-2">
          {creationOptions.map((opt) => (
            <RadioCard
              key={opt.value}
              selected={watchedValues.invoiceCreation === opt.value}
              onClick={() => setValue('invoiceCreation', opt.value, { shouldValidate: true })}
              icon={opt.icon}
              label={opt.label}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>How are invoices delivered to customers? *</Label>
        {errors.invoiceDelivery && <p className="text-red-400 text-xs mb-1">{errors.invoiceDelivery.message}</p>}
        <div className="space-y-2 mt-2">
          {deliveryOptions.map((opt) => (
            <RadioCard
              key={opt.value}
              selected={watchedValues.invoiceDelivery === opt.value}
              onClick={() => setValue('invoiceDelivery', opt.value, { shouldValidate: true })}
              icon={opt.icon}
              label={opt.label}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Current follow-up process *</Label>
        {errors.followupProcess && <p className="text-red-400 text-xs mb-1">{errors.followupProcess.message}</p>}
        <div className="space-y-2 mt-2">
          {followupOptions.map((opt) => (
            <RadioCard
              key={opt.value}
              selected={watchedValues.followupProcess === opt.value}
              onClick={() => setValue('followupProcess', opt.value, { shouldValidate: true })}
              icon={opt.icon}
              label={opt.label}
            />
          ))}
        </div>
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
