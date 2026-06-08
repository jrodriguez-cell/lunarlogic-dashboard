'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { qualifyStep2Schema, type QualifyStep2Data } from '@/lib/qualify-validations';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Props {
  data: Partial<QualifyStep2Data>;
  onUpdate: (data: Partial<QualifyStep2Data>) => void;
  onValidChange: (valid: boolean) => void;
}

const painCategories = [
  { value: 'Late payments dragging DSO up', label: 'Late payments dragging DSO up' },
  { value: 'Manually chasing customers', label: 'Manually chasing customers' },
  { value: 'Invoices falling through cracks', label: 'Invoices falling through cracks' },
  { value: 'No visibility into AR status', label: 'No visibility into AR status' },
  { value: 'Reconciliation taking too long', label: 'Reconciliation taking too long' },
  { value: 'Cash flow unpredictability', label: 'Cash flow unpredictability' },
  { value: 'Too much time on QB data entry', label: 'Too much time on QB data entry' },
  { value: 'Inconsistent payment terms', label: 'Inconsistent payment terms' },
];

export function QualifyStep2_Pain({ data, onUpdate, onValidChange }: Props) {
  const { register, watch, formState: { errors, isValid }, trigger, setValue } = useForm<QualifyStep2Data>({
    resolver: zodResolver(qualifyStep2Schema),
    defaultValues: {
      biggestArPain: data.biggestArPain ?? '',
      biggestPainCategory: data.biggestPainCategory ?? [],
      nearlyMissedPayroll: data.nearlyMissedPayroll ?? false,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const painText = watchedValues.biggestArPain ?? '';
  const selectedCategories = watchedValues.biggestPainCategory ?? [];
  const nearlyMissedPayroll = watchedValues.nearlyMissedPayroll;

  useEffect(() => { onUpdate(watchedValues); }, [JSON.stringify(watchedValues)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onValidChange(isValid); }, [isValid, onValidChange]);
  useEffect(() => { void trigger(); }, [trigger]);

  const toggleCategory = (value: string) => {
    const next = selectedCategories.includes(value)
      ? selectedCategories.filter((c) => c !== value)
      : [...selectedCategories, value];
    setValue('biggestPainCategory', next, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">What's your biggest AR headache?</h2>
        <p className="text-gray-400 mt-1">This is the most important question. Be specific — it helps us prepare a useful discovery call.</p>
      </div>

      <div>
        <Label htmlFor="biggestArPain">Describe your situation *</Label>
        <Textarea
          id="biggestArPain"
          rows={4}
          placeholder="e.g., We have 3 clients who pay 60–90 days late no matter what. I spend 4 hours a week chasing payments and still missed a $12,000 invoice last month..."
          {...register('biggestArPain')}
          className="mt-1"
        />
        <div className="flex justify-between mt-1">
          <span>{errors.biggestArPain && <span className="text-red-400 text-xs">{errors.biggestArPain.message}</span>}</span>
          <span className={cn('text-xs', {
            'text-gray-500': painText.length < 20,
            'text-emerald-400': painText.length >= 20,
            'text-red-400': painText.length > 500,
          })}>
            {painText.length}/500
          </span>
        </div>
      </div>

      <div>
        <Label>Which of these resonates most? * (select all that apply)</Label>
        {errors.biggestPainCategory && <p className="text-red-400 text-xs mt-0.5">{errors.biggestPainCategory.message}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {painCategories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.value);
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-all duration-200',
                  isSelected ? 'text-white' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/8'
                )}
                style={isSelected ? { borderColor: 'rgba(0,207,255,0.5)', background: 'rgba(0,207,255,0.08)' } : undefined}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center"
                    style={isSelected ? { borderColor: '#00CFFF', background: '#00CFFF' } : { borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-[#080D1A]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Have you ever nearly missed payroll due to slow AR? *</Label>
        <div className="flex gap-3 mt-2">
          {[
            { value: true, label: 'Yes — this has happened' },
            { value: false, label: 'No, not yet' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setValue('nearlyMissedPayroll', opt.value, { shouldValidate: true })}
              className={cn(
                'flex-1 rounded-xl border p-4 text-center transition-all duration-200 font-semibold text-sm',
                nearlyMissedPayroll === opt.value
                  ? opt.value ? 'border-amber-500/60 bg-amber-500/10 text-amber-300' : 'text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
              )}
              style={nearlyMissedPayroll === opt.value && !opt.value ? { borderColor: 'rgba(0,207,255,0.4)', background: 'rgba(0,207,255,0.07)' } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
