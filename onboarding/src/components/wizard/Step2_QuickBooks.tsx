'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { OnboardingData } from '@/types/onboarding';
import { step2Schema, type Step2Data } from '@/lib/validations';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  data: Partial<OnboardingData>;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onValidChange: (valid: boolean) => void;
}

const desktopVersionOptions = [
  { value: '2020', label: 'QuickBooks Desktop 2020' },
  { value: '2021', label: 'QuickBooks Desktop 2021' },
  { value: '2022', label: 'QuickBooks Desktop 2022' },
  { value: '2023', label: 'QuickBooks Desktop 2023' },
  { value: '2024', label: 'QuickBooks Desktop 2024' },
  { value: 'Enterprise', label: 'QuickBooks Enterprise' },
  { value: 'Other', label: 'Other / Not sure' },
];

const managerOptions = [
  { value: 'Owner/Founder', label: 'Owner / Founder (me)' },
  { value: 'Office Manager', label: 'Office Manager' },
  { value: 'Bookkeeper (in-house)', label: 'Bookkeeper (in-house)' },
  { value: 'Bookkeeper (outsourced)', label: 'Bookkeeper (outsourced)' },
  { value: 'CPA / Accountant', label: 'CPA / Accountant' },
  { value: 'Controller', label: 'Controller' },
  { value: 'Operations Manager', label: 'Operations Manager' },
];

const stateOptions = [
  { value: 'Clean and up to date', label: 'Clean and up to date' },
  { value: 'Mostly clean, minor issues', label: 'Mostly clean, minor issues' },
  { value: 'Needs some cleanup', label: 'Needs some cleanup' },
  { value: 'Needs significant cleanup', label: 'Needs significant cleanup' },
  { value: "Not sure / haven't looked", label: "Not sure / haven't looked" },
];

export function Step2_QuickBooks({ data, onUpdate, onValidChange }: Props) {
  const {
    register,
    watch,
    formState: { errors, isValid },
    trigger,
    setValue,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      qbVersion: data.qbVersion ?? '',
      qbDesktopVersion: data.qbDesktopVersion ?? '',
      qbManager: data.qbManager ?? '',
      qbCurrentState: data.qbCurrentState ?? '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const qbVersion = watchedValues.qbVersion;
  const qbCurrentState = watchedValues.qbCurrentState;

  useEffect(() => {
    onUpdate(watchedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  useEffect(() => { void trigger(); }, [trigger]);

  const needsCleanup = qbCurrentState?.toLowerCase().includes('cleanup');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">Your QuickBooks setup</h2>
        <p className="text-gray-400 mt-1">LunarLogic connects directly to QuickBooks as your source of truth.</p>
      </div>

      <div>
        <Label>QuickBooks Version *</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {(['Online', 'Desktop'] as const).map((version) => (
            <button
              key={version}
              type="button"
              onClick={() => setValue('qbVersion', version, { shouldValidate: true })}
              className={cn(
                'rounded-xl border p-5 text-left transition-all duration-200 cursor-pointer',
                qbVersion === version
                  ? 'text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/8'
              )}
              style={qbVersion === version ? {
                borderColor: 'rgba(0,207,255,0.5)',
                background: 'rgba(0,207,255,0.08)',
              } : undefined}
            >
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                {version === 'Online' ? 'Cloud' : 'Desktop'}
              </div>
              <div className="font-semibold text-white text-sm">QuickBooks {version}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {version === 'Online' ? 'Browser-based, any device' : 'Installed software'}
              </div>
            </button>
          ))}
        </div>
        {errors.qbVersion && <p className="text-red-400 text-xs mt-1">{String(errors.qbVersion?.message ?? '')}</p>}
      </div>

      {qbVersion === 'Desktop' && (
        <div>
          <Label htmlFor="qbDesktopVersion">Desktop Version</Label>
          <Select
            id="qbDesktopVersion"
            placeholder="Select version..."
            options={desktopVersionOptions}
            {...register('qbDesktopVersion')}
          />
        </div>
      )}

      <div>
        <Label htmlFor="qbManager">Who manages QuickBooks? *</Label>
        <Select
          id="qbManager"
          placeholder="Select role..."
          options={managerOptions}
          {...register('qbManager')}
        />
        {errors.qbManager && <p className="text-red-400 text-xs mt-1">{String(errors.qbManager?.message ?? '')}</p>}
      </div>

      <div>
        <Label htmlFor="qbCurrentState">Current state of your QuickBooks data *</Label>
        <Select
          id="qbCurrentState"
          placeholder="Select current state..."
          options={stateOptions}
          {...register('qbCurrentState')}
        />
        {errors.qbCurrentState && <p className="text-red-400 text-xs mt-1">{String(errors.qbCurrentState?.message ?? '')}</p>}
      </div>

      {needsCleanup && (
        <div className="rounded-lg border p-4" style={{ borderColor: 'rgba(0,207,255,0.2)', background: 'rgba(0,207,255,0.06)' }}>
          <p className="text-sm font-semibold" style={{ color: '#00CFFF' }}>QB cleanup is included in onboarding</p>
          <p className="text-gray-400 text-sm mt-1">
            We audit your chart of accounts, customer records, and open invoices before automating anything. No work required on your end beforehand.
          </p>
        </div>
      )}
    </div>
  );
}
