import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

const defaultLabels = [
  'Business',
  'QuickBooks',
  'AR Workflow',
  'Volume',
  'Pain Points',
  'Integrations',
  'Modules',
];

export function StepIndicator({ currentStep, totalSteps, stepLabels = defaultLabels }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-400">
        Step <span className="text-white font-semibold">{currentStep}</span> of{' '}
        <span className="text-white font-semibold">{totalSteps}</span>
      </p>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isFuture = step > currentStep;

          return (
            <div key={step} className="flex items-center">
              <div
                title={stepLabels[i]}
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-300',
                  {
                    'w-7 h-7 bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50': isCurrent,
                    'w-6 h-6 bg-indigo-600/80 text-white text-xs font-semibold': isCompleted,
                    'w-5 h-5 bg-white/10 text-gray-500 text-xs': isFuture,
                  }
                )}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{step}</span>
                )}
              </div>
              {step < totalSteps && (
                <div
                  className={cn('h-0.5 w-4 transition-all duration-300', {
                    'bg-indigo-600': step < currentStep,
                    'bg-white/10': step >= currentStep,
                  })}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm font-medium text-indigo-300">
        {stepLabels[currentStep - 1]}
      </p>
    </div>
  );
}
