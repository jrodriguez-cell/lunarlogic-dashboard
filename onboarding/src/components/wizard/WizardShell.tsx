'use client';

import React from 'react';
import { StepIndicator } from './StepIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WizardShellProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
  canProgress?: boolean;
}

export function WizardShell({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSubmit,
  isLoading = false,
  children,
  canProgress = true,
}: WizardShellProps) {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[#080D1A] relative overflow-hidden">
      {/* Subtle animated background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 15% 10%, rgba(0,207,255,0.07) 0%, transparent 50%), radial-gradient(ellipse at 85% 90%, rgba(0,150,200,0.05) 0%, transparent 50%)',
          animation: 'bgpulse 12s ease-in-out infinite',
        }}
      />

      <style jsx>{`
        @keyframes bgpulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/5 z-50">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #00CFFF, #0098C0)',
            boxShadow: '0 0 10px rgba(0,207,255,0.5)',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center px-6 py-5">
        <span
          className="font-bold tracking-wide text-base leading-none"
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            color: '#00CFFF',
            textShadow: '0 0 20px rgba(0,207,255,0.6), 0 0 40px rgba(0,207,255,0.3)',
          }}
        >
          lunarlogic
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex justify-center px-4 pb-12 pt-2">
        <div className="w-full max-w-2xl">
          {/* Card */}
          <div
            className="relative rounded-2xl border border-white/8 overflow-hidden"
            style={{
              background: 'rgba(10, 16, 32, 0.9)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Top cyan accent line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,207,255,0.4), transparent)' }} />

            <div className="relative p-8">
              <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

              <div className="mt-8">
                {children}
              </div>

              {/* Navigation */}
              <div className={cn('flex mt-8 pt-6 border-t border-white/8', {
                'justify-between': !isFirstStep,
                'justify-end': isFirstStep,
              })}>
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    onClick={onPrevious}
                    disabled={isLoading}
                    className="gap-2 text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </Button>
                )}

                {isLastStep ? (
                  <Button
                    onClick={onSubmit}
                    disabled={isLoading || !canProgress}
                    size="lg"
                    className="gap-2 text-[#080D1A] font-semibold"
                    style={{
                      background: canProgress && !isLoading ? 'linear-gradient(135deg, #00CFFF, #0098C0)' : 'rgba(255,255,255,0.1)',
                      boxShadow: canProgress && !isLoading ? '0 0 20px rgba(0,207,255,0.25)' : 'none',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-white">Submitting...</span>
                      </>
                    ) : (
                      <span className={canProgress ? 'text-[#080D1A]' : 'text-gray-500'}>
                        Complete My Onboarding →
                      </span>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={onNext}
                    disabled={isLoading || !canProgress}
                    className="gap-2 text-[#080D1A] font-semibold"
                    style={{
                      background: canProgress ? 'linear-gradient(135deg, #00CFFF, #0098C0)' : 'rgba(255,255,255,0.1)',
                      boxShadow: canProgress ? '0 0 16px rgba(0,207,255,0.2)' : 'none',
                    }}
                  >
                    <span className={canProgress ? 'text-[#080D1A]' : 'text-gray-500'}>Continue</span>
                    <svg className={cn('w-4 h-4', canProgress ? 'text-[#080D1A]' : 'text-gray-500')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
