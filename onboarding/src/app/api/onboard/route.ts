import { NextRequest, NextResponse } from 'next/server';
import { onboardingSchema } from '@/lib/validations';
import { computeROI, parseRevenueToNumber, parseDSOToNumber } from '@/lib/roi';
import { saveSubmission } from '@/lib/db';
import { sendJonathanNotification, sendClientConfirmation } from '@/lib/email';
import { postSlackNotification } from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const revenue = parseRevenueToNumber(data.annualRevenue);
    const dso = parseDSOToNumber(data.currentDso);
    const roi = computeROI(revenue, dso);

    const id = await saveSubmission(data, roi);

    // Fire notifications async — don't block response
    void Promise.all([
      sendJonathanNotification(data, roi, id),
      sendClientConfirmation(data, roi),
      postSlackNotification(data, roi, id),
    ]);

    return NextResponse.json({ success: true, id, roi });
  } catch (err) {
    console.error('Onboard POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
