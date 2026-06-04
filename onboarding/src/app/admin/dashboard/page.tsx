import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getAllSubmissions } from '@/lib/db';
import type { Submission } from '@/types/onboarding';
import { SubmissionsTable } from '@/components/admin/SubmissionsTable';
import { signOut } from 'next-auth/react';

async function StatsBar({ submissions }: { submissions: Submission[] }) {
  const total = submissions.length;
  const newCount = submissions.filter((s) => s.status === 'new').length;
  const proposalSent = submissions.filter((s) => s.status === 'proposal_sent').length;
  const active = submissions.filter((s) => s.status === 'active').length;

  const stats = [
    { label: 'Total', value: total, color: 'text-white' },
    { label: 'New', value: newCount, color: 'text-amber-400' },
    { label: 'Proposal Sent', value: proposalSent, color: 'text-sky-400' },
    { label: 'Active', value: active, color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider">{stat.label}</p>
          <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/admin/login');
  }

  let submissions: Submission[] = [];
  try {
    submissions = await getAllSubmissions();
  } catch (err) {
    console.error('Failed to load submissions:', err);
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0D1526]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" fill="#4A9FFF" opacity="0.9" />
              <circle cx="6.5" cy="11.5" r="1.5" fill="#F7F9FC" opacity="0.8" />
              <circle cx="9.5" cy="7.5" r="1.5" fill="#F7F9FC" opacity="0.8" />
              <circle cx="14.5" cy="7.5" r="1.5" fill="#F7F9FC" opacity="0.8" />
              <circle cx="17.5" cy="11.5" r="1.5" fill="#F7F9FC" opacity="0.8" />
            </svg>
            <div>
              <span className="text-sky-400 font-black tracking-tight">LUNAR</span>
              <span className="text-white font-black tracking-tight">LOGIC</span>
              <span className="text-gray-400 text-sm ml-3">Admin Dashboard</span>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            {session.user?.email}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Onboarding Submissions</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <a
            href="/onboard"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View Onboarding Form →
          </a>
        </div>

        <StatsBar submissions={submissions} />

        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-16 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-xl font-semibold text-white">No submissions yet</p>
            <p className="text-gray-400 mt-2">Share the onboarding link to start collecting client information.</p>
            <a
              href="/onboard"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-white text-sm font-medium transition-colors"
            >
              View Onboarding Form
            </a>
          </div>
        ) : (
          <SubmissionsTable submissions={submissions} />
        )}
      </div>
    </div>
  );
}
