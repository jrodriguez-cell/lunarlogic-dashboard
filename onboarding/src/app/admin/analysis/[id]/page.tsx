import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getSubmission, getAnalysis } from '@/lib/db';
import { GapAnalysisReportView } from '@/components/admin/GapAnalysisReport';
import { ResendNotificationButton } from '@/components/admin/ResendNotificationButton';
import { format } from 'date-fns';
import type { GapAnalysisReport } from '@/lib/gap-analysis';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/admin/login');
  }

  const { id } = await params;

  const [submission, analysis] = await Promise.all([
    getSubmission(id),
    getAnalysis(id),
  ]);

  if (!submission) {
    redirect('/admin/dashboard');
  }

  const initialData =
    analysis.gapAnalysis && analysis.proposalDraft
      ? {
          gapAnalysis: analysis.gapAnalysis as GapAnalysisReport,
          proposalDraft: analysis.proposalDraft,
          generatedAt: analysis.analysisGeneratedAt ?? new Date().toISOString(),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0D1526]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <a
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </a>
          <span className="text-white/20">/</span>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-sky-400 font-black tracking-tight text-sm">LUNAR</span>
                <span className="text-white font-black tracking-tight text-sm">LOGIC</span>
              </div>
              <span className="text-gray-400 text-sm">|</span>
              <div className="min-w-0">
                <span className="text-white font-semibold truncate block">{submission.businessName}</span>
              </div>
              <span className="text-gray-500 text-sm whitespace-nowrap hidden sm:block">
                {format(new Date(submission.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            <ResendNotificationButton submissionId={id} />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Gap Analysis & Proposal</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {submission.ownerName} · {submission.industry} · {submission.annualRevenue}
          </p>
        </div>

        <GapAnalysisReportView submissionId={id} initialData={initialData} />
      </div>
    </div>
  );
}
