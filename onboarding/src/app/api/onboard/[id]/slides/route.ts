import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubmission, getAnalysis } from '@/lib/db';
import { runGapAnalysis } from '@/lib/gap-analysis';
import { generateSlideDeck } from '@/lib/slides';
import { computeROI, parseRevenueToNumber, parseDSOToNumber } from '@/lib/roi';
import type { GapAnalysisReport } from '@/lib/gap-analysis';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [submission, analysis] = await Promise.all([
    getSubmission(id),
    getAnalysis(id),
  ]);

  if (!submission) {
    return Response.json({ error: 'Submission not found' }, { status: 404 });
  }

  const revenue = parseRevenueToNumber(submission.annualRevenue);
  const dso = parseDSOToNumber(submission.currentDso);
  const roi = computeROI(revenue, dso);

  const gapAnalysis: GapAnalysisReport =
    analysis.gapAnalysis ?? runGapAnalysis(submission, roi);

  const buffer = await generateSlideDeck(submission, gapAnalysis, roi);

  const safeName = submission.businessName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const filename = `lunarlogic-discovery-${safeName}.pptx`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  });
}
