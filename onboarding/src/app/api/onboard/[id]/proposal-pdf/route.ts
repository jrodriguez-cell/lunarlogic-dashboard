import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubmission, getAnalysis } from '@/lib/db';
import { generateProposalPDF } from '@/lib/pdf-proposal';
import { computeROI, parseRevenueToNumber, parseDSOToNumber } from '@/lib/roi';

function isAuthorized(request: NextRequest, session: Awaited<ReturnType<typeof getServerSession>>): boolean {
  if (session) return true;
  const internalKey = request.headers.get('x-internal-key');
  const expectedKey = process.env.INTERNAL_API_KEY;
  if (expectedKey && internalKey === expectedKey) return true;
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!isAuthorized(request, session)) {
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

  if (!analysis.gapAnalysis || !analysis.proposalDraft) {
    return NextResponse.json(
      { error: 'Analysis not yet generated. Please run gap analysis first.' },
      { status: 404 }
    );
  }

  const revenue = parseRevenueToNumber(submission.annualRevenue);
  const dso = parseDSOToNumber(submission.currentDso);
  const roi = computeROI(revenue, dso);

  const pdfBuffer = await generateProposalPDF(
    { ...submission, id },
    analysis.gapAnalysis,
    roi,
    analysis.proposalDraft
  );

  const safeBusinessName = submission.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="lunarlogic-proposal-${safeBusinessName}.pdf"`,
    },
  });
}
