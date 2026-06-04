'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password.');
      } else {
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D1A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span
              className="font-bold tracking-wide text-xl"
              style={{
                fontFamily: 'var(--font-display, sans-serif)',
                color: '#00CFFF',
                textShadow: '0 0 20px rgba(0,207,255,0.6), 0 0 40px rgba(0,207,255,0.3)',
              }}
            >
              lunarlogic
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage onboarding submissions</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/8 p-8"
          style={{ background: 'rgba(10, 16, 32, 0.95)', backdropFilter: 'blur(24px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wider uppercase">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 rounded-lg border border-white/8 bg-white/4 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 focus:ring-1 focus:ring-[#00CFFF]/30 transition-colors"
                placeholder="jonathan@lunarlogic.ai"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wider uppercase">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded-lg border border-white/8 bg-white/4 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 focus:ring-1 focus:ring-[#00CFFF]/30 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[#080D1A]"
              style={{ background: 'linear-gradient(135deg, #00CFFF, #0098C0)', boxShadow: '0 0 20px rgba(0,207,255,0.2)' }}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          LunarLogic LLC · Internal use only
        </p>
      </div>
    </div>
  );
}
