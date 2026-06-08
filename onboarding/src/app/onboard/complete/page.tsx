'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import type { ROIResult } from '@/types/onboarding';
import { formatCurrency } from '@/lib/roi';

function CompleteContent() {
  const searchParams = useSearchParams();
  const roiParam = searchParams.get('roi');
  const submissionId = searchParams.get('id');

  const [emailLabel, setEmailLabel] = useState('Email me a copy');

  let roi: ROIResult | null = null;
  try {
    if (roiParam) roi = JSON.parse(decodeURIComponent(roiParam)) as ROIResult;
  } catch {
    // ignore parse errors
  }

  const isSmallProfile =
    roi &&
    (roi.currentDSO <= 20 || roi.totalYear1 < 15000);

  const handleEmailCopy = async () => {
    if (!submissionId) return;
    setEmailLabel('Sending…');
    try {
      const res = await fetch(`/api/onboard/${submissionId}/send-copy`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setEmailLabel('Sent! Check your inbox');
    } catch {
      setEmailLabel('Failed — try again');
      setTimeout(() => setEmailLabel('Email me a copy'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D1A] flex flex-col items-center justify-center px-4 py-12">
      {/* Animated background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(0,207,255,0.08) 0%, transparent 60%)',
          animation: 'completePulse 4s ease-in-out infinite',
        }}
      />

      <style jsx>{`
        @keyframes completePulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes checkDraw {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes circleScale {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-circle { animation: circleScale 0.5s ease-out forwards; }
        .animate-check { stroke-dasharray: 100; animation: checkDraw 0.4s ease-out 0.4s forwards; stroke-dashoffset: 100; }
        .fade-up-1 { animation: fadeUp 0.5s ease-out 0.3s forwards; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.5s ease-out 0.5s forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.5s ease-out 0.7s forwards; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.5s ease-out 0.9s forwards; opacity: 0; }
        .fade-up-5 { animation: fadeUp 0.5s ease-out 1.1s forwards; opacity: 0; }
      `}</style>

      <div className="relative z-10 w-full max-w-xl text-center">
        {/* Checkmark */}
        <div className="flex justify-center mb-8">
          <div className="animate-circle">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="38" fill="rgba(0, 196, 140, 0.12)" stroke="#00C48C" strokeWidth="2" />
              <path className="animate-check" d="M22 40 L35 53 L58 28" fill="none" stroke="#00C48C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="fade-up-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif' }}>
            Your ROI is ready.
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Book a free 30-minute call and we'll walk through it together.
          </p>
        </div>

        {roi && (
          <div className="fade-up-2 mt-8 rounded-2xl border border-white/8 overflow-hidden text-left" style={{ background: 'rgba(10, 16, 32, 0.9)', backdropFilter: 'blur(20px)' }}>
            <div className="p-6 border-b border-white/8">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 text-center">Your projected Year 1 value</p>
              <p className="text-5xl font-black text-emerald-400 text-center">{formatCurrency(roi.totalYear1)}</p>
              <p className="text-gray-400 text-sm mt-2 text-center">
                DSO: <span className="text-amber-400 font-semibold">{roi.currentDSO} days</span>
                {' → '}
                <span className="text-emerald-400 font-semibold">{roi.targetDSO} days</span>
              </p>

              {/* ROI breakdown */}
              <div className="mt-5 pt-4 border-t border-white/8 space-y-2">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">How we calculated this</p>
                {[
                  { label: 'Working capital released from faster collections', value: roi.wcReleased },
                  { label: 'Bad debt savings from fewer write-offs', value: roi.badDebtSavings },
                  { label: 'Unbilled revenue recovered', value: roi.unbilledRecovered },
                  { label: 'Labor hours saved on manual AR tasks', value: roi.laborSaved },
                ].map((item) => (
                  <div key={item.label} className="flex items-baseline justify-between gap-4">
                    <span className="text-gray-400 text-sm">{item.label}</span>
                    <span className="text-cyan-400 font-semibold text-sm whitespace-nowrap">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <p className="text-gray-600 text-xs italic pt-1">Based on industry benchmarks for your revenue range. Actual results vary.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/8">
              <div className="p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wider">Capital Released</p>
                <p className="font-bold text-lg mt-0.5" style={{ color: '#00CFFF' }}>{formatCurrency(roi.wcReleased)}</p>
              </div>
              <div className="p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wider">ROI Multiple</p>
                <p className="text-amber-400 font-bold text-lg mt-0.5">{roi.roi}x</p>
              </div>
            </div>

            {/* Email copy button */}
            <div className="px-6 py-4 border-t border-white/8">
              <button
                onClick={() => void handleEmailCopy()}
                disabled={!submissionId || emailLabel === 'Sending…' || emailLabel === 'Sent! Check your inbox'}
                className="w-full rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-50 py-2.5 text-sm font-medium text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {emailLabel}
              </button>
              <p className="text-gray-600 text-xs text-center mt-1.5">Sends your ROI breakdown and answers to your email</p>
            </div>
          </div>
        )}

        {/* Reassurance for smaller profiles — moved from inline form steps */}
        {isSmallProfile && (
          <div className="fade-up-2 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 text-left">
            <p className="text-amber-400 text-sm font-semibold">Your numbers are on the smaller side — and that's fine.</p>
            <p className="text-amber-300/70 text-sm mt-1">
              Every client starts somewhere. Our team will review your fit on the discovery call and make sure the ROI makes sense for your specific situation before recommending anything.
            </p>
          </div>
        )}

        {/* Book a call CTA */}
        <div className="fade-up-3 mt-8 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,207,255,0.25)', background: 'rgba(0,207,255,0.05)' }}>
          <div className="p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2">Next step</p>
            <h2 className="text-xl font-bold text-white mb-1">Book your free discovery call</h2>
            <p className="text-gray-400 text-sm mb-5">30 minutes. We'll walk through your ROI model and answer every question.</p>
            <a
              href="https://calendly.com/jrodriguez-lunarlogic/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 font-semibold text-[#080D1A] transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #00CFFF, #0098C0)', boxShadow: '0 0 24px rgba(0,207,255,0.3)' }}
            >
              Schedule Now →
            </a>
            <p className="text-gray-600 text-xs mt-3">No sales pressure. Cancel anytime.</p>
          </div>
        </div>

        <div className="fade-up-4 mt-6 rounded-xl border border-white/8 p-5 text-center" style={{ background: 'rgba(10,16,32,0.7)' }}>
          <p className="text-white font-semibold">Questions? Reach out to our team</p>
          <a href="mailto:support@lunarlogic.ai" className="hover:opacity-80 transition-opacity mt-1 block text-sm" style={{ color: '#00CFFF' }}>
            support@lunarlogic.ai
          </a>
          <p className="text-gray-500 text-sm mt-3 italic">&ldquo;We earn your business every month through results.&rdquo;</p>
        </div>
      </div>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080D1A] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <CompleteContent />
    </Suspense>
  );
}
