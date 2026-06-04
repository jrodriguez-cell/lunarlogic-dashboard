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
    <div className="min-h-screen bg-[#0A0F1E] relative overflow-hidden">
      {/* Animated radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, #2D5BE3 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #1A3A6B 0%, transparent 50%)',
          opacity: 0.15,
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.05); }
        }
      `}</style>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 8px rgba(45,91,227,0.6)',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"
              fill="#4A9FFF"
              opacity="0.9"
            />
            <circle cx="6.5" cy="11.5" r="1.5" fill="#F7F9FC" opacity="0.8" />
            <circle cx="9.5" cy="7.5" r="1.5" fill="#F7F9FC" opacity="0.8" />
            <circle cx="14.5" cy="7.5" r="1.5" fill="#F7F9FC" opacity="0.8" />
            <circle cx="17.5" cy="11.5" r="1.5" fill="#F7F9FC" opacity="0.8" />
          </svg>
          <div>
            <span className="text-sky-400 font-black tracking-tight text-lg leading-none">LUNAR</span>
            <span className="text-white font-black tracking-tight text-lg leading-none">LOGIC</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex justify-center px-4 pb-12 pt-4">
        <div className="w-full max-w-2xl">
          {/* Card */}
          <div
            className="relative rounded-2xl border border-white/10 overflow-hidden"
            style={{
              background: 'rgba(14, 20, 40, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Card inner glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(45,91,227,0.05) 0%, transparent 60%)' }} />

            <div className="relative p-8">
              <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

              <div className="mt-8">
                {children}
              </div>

              {/* Navigation */}
              <div className={cn('flex mt-8 pt-6 border-t border-white/10', {
                'justify-between': !isFirstStep,
                'justify-end': isFirstStep,
              })}>
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    onClick={onPrevious}
                    disabled={isLoading}
                    className="gap-2"
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
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Complete My Onboarding
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={onNext}
                    disabled={isLoading || !canProgress}
                    className="gap-2"
                  >
                    Continue
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
