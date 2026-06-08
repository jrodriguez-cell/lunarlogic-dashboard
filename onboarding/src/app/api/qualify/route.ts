import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { qualifyStep1Schema, qualifyStep2Schema, qualifyStep3Schema } from '@/lib/qualify-validations';
import { saveLead } from '@/lib/qualify-db';
import { computeROI, parseRevenueToNumber, parseDSOToNumber } from '@/lib/roi';
import { Resend } from 'resend';
import { formatCurrency } from '@/lib/roi';

const leadSchema = qualifyStep1Schema.merge(qualifyStep2Schema).merge(qualifyStep3Schema);

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const revenue = parseRevenueToNumber(data.annualRevenue);
    const dso = parseDSOToNumber(data.currentDso);
    const roi = computeROI(revenue, dso);

    const id = await saveLead(data, roi);

    // Fire-and-forget notifications
    void (async () => {
      try {
        const appUrl = process.env.NEXTAUTH_URL ?? 'https://lunarlogic.ai';
        const to = process.env.NOTIFY_EMAIL ?? 'jrodriguez@lunarlogic.ai';
        const payrollFlag = data.nearlyMissedPayroll
          ? '🔴 <strong>PAYROLL SCARE — high urgency</strong>'
          : '✅ No payroll scare';
        const categoriesHtml = data.biggestPainCategory.join(', ');

        await getResend().emails.send({
          from: 'LunarLogic <onboarding@resend.dev>',
          to,
          subject: `New Lead: ${data.businessName} — ${data.industry} — ${data.annualRevenue}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #0A0F1E; color: #F7F9FC; padding: 32px; border-radius: 12px;">
              <h1 style="color: #4A9FFF; margin: 0 0 4px;">New Discovery Call Lead</h1>
              <p style="color: #8A94A6; margin: 0 0 24px;">Submitted via lunarlogic.ai/onboard</p>

              <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #2D5BE3; margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Flags</h2>
                <p style="margin: 4px 0;">${payrollFlag}</p>
              </div>

              <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #2D5BE3; margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">ROI Preview</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Current DSO</td><td style="text-align:right;">${roi.currentDSO} days → ${roi.targetDSO} days</td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Year 1 Value</td><td style="text-align:right; color: #00C48C; font-weight:bold; font-size:18px;">${formatCurrency(roi.totalYear1)}</td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">ROI Multiple</td><td style="text-align:right; color: #F59E0B; font-weight:bold;">${roi.roi}x</td></tr>
                </table>
              </div>

              <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #2D5BE3; margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Contact</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; color: #8A94A6; width:40%;">Business</td><td>${data.businessName}</td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Name</td><td>${data.ownerName}</td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Email</td><td><a href="mailto:${data.ownerEmail}" style="color:#4A9FFF;">${data.ownerEmail}</a></td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Phone</td><td>${data.ownerPhone || 'Not provided'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Revenue</td><td>${data.annualRevenue}</td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Industry</td><td>${data.industry}${data.industryOther ? ` — ${data.industryOther}` : ''}</td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Employees</td><td>${data.employeeCount || 'Not provided'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #8A94A6;">Monthly Invoices</td><td>${data.monthlyInvoiceCount}</td></tr>
                </table>
              </div>

              <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #2D5BE3; margin: 0 0 10px; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Pain Point</h2>
                <blockquote style="border-left: 3px solid #2D5BE3; margin: 0; padding: 10px 16px; font-style: italic; color: #D1D9E6;">${data.biggestArPain}</blockquote>
                <p style="margin: 10px 0 0; color: #8A94A6; font-size: 14px;">Categories: ${categoriesHtml}</p>
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}/admin/analysis/${id}" style="background: #2D5BE3; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  View in Admin Dashboard →
                </a>
              </div>
            </div>
          `,
        });
      } catch (err) {
        console.error('Failed to send lead notification email:', err);
      }

      try {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (webhookUrl) {
          const appUrl = process.env.NEXTAUTH_URL ?? 'https://lunarlogic.ai';
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blocks: [
                { type: 'header', text: { type: 'plain_text', text: `🎯 New Lead: ${data.businessName}`, emoji: true } },
                { type: 'section', fields: [
                  { type: 'mrkdwn', text: `*Industry*\n${data.industry}` },
                  { type: 'mrkdwn', text: `*Revenue*\n${data.annualRevenue}` },
                  { type: 'mrkdwn', text: `*Year 1 Value*\n${formatCurrency(roi.totalYear1)}` },
                  { type: 'mrkdwn', text: `*ROI*\n${roi.roi}x` },
                ]},
                { type: 'section', text: { type: 'mrkdwn', text: `*Pain:*\n_"${data.biggestArPain.substring(0, 200)}"_` } },
                { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'View in Dashboard', emoji: true }, url: `${appUrl}/admin/analysis/${id}`, style: 'primary' }] },
              ],
            }),
          });
        }
      } catch (err) {
        console.error('Failed to post Slack notification:', err);
      }
    })();

    return NextResponse.json({ success: true, id, roi });
  } catch (err) {
    console.error('Qualify submission error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
