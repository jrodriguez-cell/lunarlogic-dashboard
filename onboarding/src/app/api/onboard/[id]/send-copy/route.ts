import { NextRequest, NextResponse } from 'next/server';
import { getSubmission } from '@/lib/db';
import { sendAnswersCopy } from '@/lib/email';
import { computeROI, parseRevenueToNumber, parseDSOToNumber } from '@/lib/roi';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const submission = await getSubmission(id);
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const revenue = parseRevenueToNumber(submission.annualRevenue);
  const dso = parseDSOToNumber(submission.currentDso);
  const roi = computeROI(revenue, dso);

  await sendAnswersCopy(submission, roi);

  return NextResponse.json({ success: true });
}
