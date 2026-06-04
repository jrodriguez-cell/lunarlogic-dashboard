'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { ROIResult } from '@/types/onboarding';
import { formatCurrency } from '@/lib/roi';

function CompleteContent() {
  const searchParams = useSearchParams();
  const roiParam = searchParams.get('roi');

  let roi: ROIResult | null = null;
  try {
    if (roiParam) roi = JSON.parse(decodeURIComponent(roiParam)) as ROIResult;
  } catch {
    // ignore parse errors
  }

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
            Onboarding complete.
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Our team will review your submission and reach out within 24 hours.
          </p>
        </div>

        {roi && (
          <div className="fade-up-2 mt-8 rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(10, 16, 32, 0.9)', backdropFilter: 'blur(20px)' }}>
            <div className="p-6 border-b border-white/8">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Your projected Year 1 value</p>
              <p className="text-5xl font-black text-emerald-400">{formatCurrency(roi.totalYear1)}</p>
              <p className="text-gray-400 text-sm mt-2">
                DSO: <span className="text-amber-400 font-semibold">{roi.currentDSO} days</span>
                {' → '}
                <span className="text-emerald-400 font-semibold">{roi.targetDSO} days</span>
              </p>
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
          </div>
        )}

        <div className="fade-up-3 mt-8 text-left rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(10, 16, 32, 0.9)', backdropFilter: 'blur(20px)' }}>
          <div className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">What happens next</h2>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Review (within 24 hrs)', desc: "Our team reviews your submission and prepares your custom ROI model." },
                { step: '2', title: 'Discovery Call', desc: "45-minute call to finalize scope, answer questions, and align on timeline." },
                { step: '3', title: 'Custom Proposal', desc: "You receive a detailed proposal with pricing, timeline, and ROI model." },
                { step: '4', title: 'Go Live & Measure', desc: "Your AR automation activates. We track DSO weekly and send monthly reports." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#080D1A] text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00CFFF, #0098C0)' }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-gray-400 text-sm mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
