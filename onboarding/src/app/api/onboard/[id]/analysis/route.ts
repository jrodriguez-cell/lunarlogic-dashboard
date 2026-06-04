import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubmission, saveAnalysis } from '@/lib/db';
import { runGapAnalysis } from '@/lib/gap-analysis';
import { generateProposalDraft } from '@/lib/proposal';
import { sendAnalysisReport } from '@/lib/email';
import { computeROI, parseRevenueToNumber, parseDSOToNumber } from '@/lib/roi';

function isAuthorized(request: NextRequest, session: Awaited<ReturnType<typeof getServerSession>>): boolean {
  if (session) return true;
  const internalKey = request.headers.get('x-internal-key');
  const expectedKey = process.env.INTERNAL_API_KEY;
  if (expectedKey && internalKey === expectedKey) return true;
  return false;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!isAuthorized(request, session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const submission = await getSubmission(id);
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const revenue = parseRevenueToNumber(submission.annualRevenue);
  const dso = parseDSOToNumber(submission.currentDso);
  const roi = computeROI(revenue, dso);

  const gapAnalysis = runGapAnalysis(submission, roi);
  const proposalDraft = await generateProposalDraft(submission, gapAnalysis, roi);

  await saveAnalysis(id, gapAnalysis, proposalDraft);

  // Fire email async — don't block response
  void sendAnalysisReport({ ...submission, id }, gapAnalysis, proposalDraft);

  return NextResponse.json({ success: true, gapAnalysis, proposalDraft });
}
