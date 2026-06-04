'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { OnboardingData } from '@/types/onboarding';
import { step6Schema, type Step6Data } from '@/lib/validations';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  data: Partial<OnboardingData>;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onValidChange: (valid: boolean) => void;
}

interface IntegrationTile {
  key: keyof Step6Data;
  name: string;
  description: string;
  requiredFor: string;
}

const integrations: IntegrationTile[] = [
  {
    key: 'usesSlack',
    name: 'Slack',
    description: 'Human-in-the-loop approvals, daily AR summaries, invoice notifications',
    requiredFor: 'WF1, WF2',
  },
  {
    key: 'usesStripe',
    name: 'Stripe',
    description: 'Payment processing and reconciliation against QB invoices',
    requiredFor: 'WF3',
  },
  {
    key: 'usesGoogleSheets',
    name: 'Google Sheets',
    description: 'Token storage, VIP exemption lists, audit logs',
    requiredFor: 'WF1, WF2',
  },
  {
    key: 'usesQBPayments',
    name: 'QuickBooks Payments',
    description: 'Built-in QB payment links for customers paying online',
    requiredFor: 'WF3',
  },
  {
    key: 'usesEmail',
    name: 'Outlook / Gmail',
    description: 'Customer-facing reminder emails via Microsoft Graph or Gmail API',
    requiredFor: 'WF2',
  },
];

export function Step6_Integrations({ data, onUpdate, onValidChange }: Props) {
  const {
    register,
    watch,
    formState: { isValid },
    trigger,
    setValue,
  } = useForm<Step6Data>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      usesSlack: data.usesSlack ?? false,
      usesStripe: data.usesStripe ?? false,
      usesGoogleSheets: data.usesGoogleSheets ?? false,
      usesQBPayments: data.usesQBPayments ?? false,
      usesEmail: data.usesEmail ?? false,
      usesOther: data.usesOther ?? '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  useEffect(() => {
    onUpdate(watchedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  useEffect(() => {
    onValidChange(true);
  }, [isValid, onValidChange]);

  useEffect(() => { void trigger(); }, [trigger]);

  const toggleIntegration = (key: keyof Step6Data) => {
    if (key === 'usesOther') return;
    const currentVal = watchedValues[key];
    setValue(key, !currentVal, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-display">Tools & integrations</h2>
        <p className="text-gray-400 mt-1">Toggle the tools you currently use. This helps us configure the right automation stack.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {integrations.map((integration) => {
          const isEnabled = Boolean(watchedValues[integration.key]);
          return (
            <button
              key={integration.key}
              type="button"
              onClick={() => toggleIntegration(integration.key)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all duration-200 flex items-center gap-4',
                !isEnabled && 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
              )}
              style={isEnabled ? {
                borderColor: 'rgba(0,207,255,0.4)',
                background: 'rgba(0,207,255,0.07)',
              } : undefined}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-semibold text-sm', isEnabled ? 'text-white' : 'text-gray-300')}>
                    {integration.name}
                  </span>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded font-mono', {
                    'bg-white/8 text-gray-500': !isEnabled,
                  })}
                  style={isEnabled ? { background: 'rgba(0,207,255,0.15)', color: '#00CFFF' } : undefined}
                  >
                    {integration.requiredFor}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{integration.description}</p>
              </div>
              {/* Toggle switch */}
              <div
                className="w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 relative"
                style={isEnabled
                  ? { background: 'linear-gradient(135deg, #00CFFF, #0098C0)' }
                  : { background: 'rgba(255,255,255,0.1)' }
                }
              >
                <div className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm',
                  isEnabled ? 'left-6' : 'left-1'
                )} />
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <Label htmlFor="usesOther">Any other tools we should know about? (optional)</Label>
        <Input
          id="usesOther"
          placeholder="e.g., FreshBooks, HubSpot CRM, Plaid, Monday.com..."
          {...register('usesOther')}
          className="mt-1"
        />
      </div>

      <div className="rounded-lg border border-white/8 bg-white/3 p-4">
        <p className="text-gray-400 text-sm">
          <strong className="text-gray-300">QuickBooks Online is the only hard requirement.</strong> Jonathan will recommend which additional integrations to activate based on your workflow during the implementation call.
        </p>
      </div>
    </div>
  );
}
