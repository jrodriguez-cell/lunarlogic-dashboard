import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubmission } from '@/lib/db';
import { generatePDF } from '@/lib/pdf';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const submission = await getSubmission(id);

  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const pdfUint8 = await generatePDF(submission);
  const pdfBuffer = pdfUint8.buffer.slice(pdfUint8.byteOffset, pdfUint8.byteOffset + pdfUint8.byteLength) as ArrayBuffer;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="lunarlogic-proposal-${id}.pdf"`,
    },
  });
}
