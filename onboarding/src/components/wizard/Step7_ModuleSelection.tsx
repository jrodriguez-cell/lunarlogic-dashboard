'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { format, addDays } from 'date-fns';
import type { OnboardingData } from '@/types/onboarding';
import { step7Schema, type Step7Data } from '@/lib/validations';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  data: Partial<OnboardingData>;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onValidChange: (valid: boolean) => void;
}

interface Module {
  code: 'IA' | 'PR' | 'SO' | 'AR';
  name: string;
  description: string;
  metrics: string[];
  recommended: boolean;
}

const modules: Module[] = [
  {
    code: 'IA',
    name: 'Invoice Automation',
    description: 'Eliminate manual invoice entry. Invoices are created from PDFs or a Slack message, validated against QuickBooks, and sent for approval — without touching a spreadsheet.',
    metrics: ['84% faster processing', 'Zero manual data entry', 'AI-powered parsing'],
    recommended: true,
  },
  {
    code: 'PR',
    name: 'Proactive Reminders',
    description: 'Stop chasing payments manually. Personalized reminder emails go out automatically on a daily schedule, with AR aging summaries posted to Slack so you always know where things stand.',
    metrics: ['19-day DSO reduction', 'Automated follow-up', 'Outlook integration'],
    recommended: true,
  },
  {
    code: 'SO',
    name: 'Payment Receipt & Cash Application',
    description: 'Automatically match incoming payments to open invoices in QuickBooks. Ambiguous or bulk payments get flagged in Slack for a quick human decision instead of falling through the cracks.',
    metrics: ['90%+ auto-match rate', 'Bank-connected via Plaid', 'Coming Q3 2026'],
    recommended: false,
  },
  {
    code: 'AR',
    name: 'AR Aging Dashboard',
    description: 'A live, bookmarkable view of your AR health — aging buckets, DSO trend over time, invoice status, and which customers pay slowest. No more digging through QuickBooks reports.',
    metrics: ['15-min data refresh', 'DSO trend chart', 'Aging waterfall'],
    recommended: false,
  },
];

export function Step7_ModuleSelection({ data, onUpdate, onValidChange }: Props) {
  const {
    register,
    watch,
    formState: { errors, isValid },
    trigger,
    setValue,
  } = useForm<Step7Data>({
    resolver: zodResolver(step7Schema),
    defaultValues: {
      modulesSelected: (data.modulesSelected ?? ['IA', 'PR']) as ('IA' | 'PR' | 'SO' | 'AR')[],
      targetStartDate: data.targetStartDate ?? '',
      additionalNotes: data.additionalNotes ?? '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const selectedModules = watchedValues.modulesSelected ?? [];

  useEffect(() => {
    onUpdate(watchedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  // Force validation on mount so pre-filled data reports correct validity
  useEffect(() => { void trigger(); }, [trigger]);

  const toggleModule = (code: 'IA' | 'PR' | 'SO' | 'AR') => {
    const current = selectedModules;
    const next = current.includes(code)
      ? current.filter((m) => m !== code)
      : [...current, code];
    setValue('modulesSelected', next, { shouldValidate: true });
  };

  const minDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">What are you most interested in?</h2>
        <p className="text-gray-400 mt-1">Select everything that looks useful — our team will recommend the right starting point on your discovery call.</p>
      </div>

      {errors.modulesSelected && (
        <p className="text-red-400 text-sm">{errors.modulesSelected.message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modules.map((mod) => {
          const isSelected = selectedModules.includes(mod.code);
          return (
            <button
              key={mod.code}
              type="button"
              onClick={() => toggleModule(mod.code)}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all duration-200 flex flex-col gap-3',
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs font-black px-2 py-1 rounded font-mono tracking-wider',
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'
                  )}>
                    {mod.code}
                  </span>
                  {mod.recommended && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      Most popular
                    </span>
                  )}
                </div>
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                  isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/30'
                )}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <p className={cn('font-semibold', isSelected ? 'text-white' : 'text-gray-300')}>
                  {mod.name}
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{mod.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mod.metrics.map((m) => (
                  <span key={m} className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-gray-500'
                  )}>
                    {m}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <Label htmlFor="targetStartDate">Target start date (optional)</Label>
        <Input
          id="targetStartDate"
          type="date"
          min={minDate}
          {...register('targetStartDate')}
          className="mt-1"
        />
        <p className="text-gray-500 text-xs mt-1">Minimum 7 days out — we need time to configure your setup</p>
      </div>

      <div>
        <Label htmlFor="additionalNotes">Anything else we should know? (optional)</Label>
        <Textarea
          id="additionalNotes"
          rows={3}
          placeholder="Seasonal patterns, specific client concerns, upcoming busy periods, integration requirements..."
          {...register('additionalNotes')}
          className="mt-1"
        />
      </div>
    </div>
  );
}
