'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function IntakeCompleteContent() {
  const searchParams = useSearchParams();
  const ownerName = searchParams.get('name') ?? 'there';

  return (
    <div className="min-h-screen bg-[#080D1A] flex flex-col items-center justify-center px-4 py-12">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(0,207,255,0.07) 0%, transparent 60%)' }}
      />

      <style jsx>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes circleScale {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkDraw {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-circle { animation: circleScale 0.5s ease-out forwards; }
        .animate-check { stroke-dasharray: 100; animation: checkDraw 0.4s ease-out 0.4s forwards; stroke-dashoffset: 100; }
        .fade-up-1 { animation: fadeUp 0.5s ease-out 0.3s forwards; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.5s ease-out 0.5s forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.5s ease-out 0.7s forwards; opacity: 0; }
      `}</style>

      <div className="relative z-10 w-full max-w-xl text-center">
        <div className="flex justify-center mb-8">
          <div className="animate-circle">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="38" fill="rgba(0, 196, 140, 0.12)" stroke="#00C48C" strokeWidth="2" />
              <path className="animate-check" d="M22 40 L35 53 L58 28" fill="none" stroke="#00C48C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="fade-up-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-display, Space Grotesk, sans-serif)' }}>
            You're all set, {ownerName.split(' ')[0]}.
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Your implementation intake is complete. Our team will be in touch shortly to confirm your go-live timeline.
          </p>
        </div>

        <div className="fade-up-2 mt-8 rounded-2xl border border-white/8 p-6 text-left" style={{ background: 'rgba(10, 16, 32, 0.9)', backdropFilter: 'blur(20px)' }}>
          <h2 className="text-lg font-bold text-white mb-4">What happens next</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Setup Review (48 hrs)', desc: "We review your QuickBooks setup, integrations, and module selections to build your implementation plan." },
              { step: '2', title: 'Kickoff Call', desc: "We schedule a kickoff to walk through the plan, confirm timelines, and get credentials set up." },
              { step: '3', title: 'Go Live', desc: "Your automation workflows activate. We monitor everything in the first week and adjust as needed." },
              { step: '4', title: 'Monthly Reports', desc: "You receive a monthly DSO report tracking your improvement vs. baseline — starting from day one." },
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

        <div className="fade-up-3 mt-6 rounded-xl border border-white/8 p-5 text-center" style={{ background: 'rgba(10,16,32,0.7)' }}>
          <p className="text-white font-semibold">Questions? Reach out directly</p>
          <a href="mailto:support@lunarlogic.ai" className="hover:opacity-80 transition-opacity mt-1 block text-sm" style={{ color: '#00CFFF' }}>
            support@lunarlogic.ai
          </a>
          <p className="text-gray-500 text-sm mt-3 italic">&ldquo;We earn your business every month through results.&rdquo;</p>
        </div>
      </div>
    </div>
  );
}

export default function IntakeCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080D1A] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <IntakeCompleteContent />
    </Suspense>
  );
}
