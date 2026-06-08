import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubmission, getAnalysis } from '@/lib/db';
import { sendJonathanNotification, sendAnalysisReport } from '@/lib/email';
import { postSlackNotification } from '@/lib/slack';
import { computeROI, parseRevenueToNumber, parseDSOToNumber } from '@/lib/roi';
import type { GapAnalysisReport } from '@/lib/gap-analysis';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [submission, analysis] = await Promise.all([
    getSubmission(id),
    getAnalysis(id),
  ]);

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const revenue = parseRevenueToNumber(submission.annualRevenue);
  const dso = parseDSOToNumber(submission.currentDso);
  const roi = computeROI(revenue, dso);

  await sendJonathanNotification(submission, roi, id);
  await postSlackNotification(submission, roi, id);

  if (analysis.gapAnalysis && analysis.proposalDraft) {
    await sendAnalysisReport(
      { ...submission, id },
      analysis.gapAnalysis as GapAnalysisReport,
      analysis.proposalDraft
    );
  }

  return NextResponse.json({ success: true });
}
