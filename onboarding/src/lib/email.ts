import { Resend } from 'resend';
import type { OnboardingData, ROIResult } from '@/types/onboarding';
import { formatCurrency } from './roi';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}

export async function sendJonathanNotification(
  data: OnboardingData,
  roi: ROIResult,
  id: string
): Promise<void> {
  try {
    const to = process.env.NOTIFY_EMAIL ?? 'jonathan@lunarlogic.ai';
    const payrollFlag = data.nearlyMissedPayroll ? '🔴 <strong>PAYROLL SCARE — high urgency close</strong>' : '✅ No payroll scare reported';
    const qbFlag = data.qbCurrentState.toLowerCase().includes('cleanup') ? '⚠️ QB needs cleanup — may affect timeline' : '✅ QB state acceptable';
    const moduleList = data.modulesSelected.join(', ');

    await getResend().emails.send({
      from: 'onboard@lunarlogic.ai',
      to,
      subject: `New Onboarding: ${data.businessName} — ${data.industry} — ${data.annualRevenue}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #0A0F1E; color: #F7F9FC; padding: 32px; border-radius: 12px;">
          <h1 style="color: #4A9FFF; margin: 0 0 8px;">New Onboarding Submission</h1>
          <p style="color: #8A94A6; margin: 0 0 24px;">Submitted via lunarlogic.ai/onboard</p>

          <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2D5BE3; margin: 0 0 16px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Flags</h2>
            <p style="margin: 4px 0;">${payrollFlag}</p>
            <p style="margin: 4px 0;">${qbFlag}</p>
          </div>

          <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2D5BE3; margin: 0 0 16px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">ROI Projection</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #8A94A6;">Current DSO</td><td style="text-align: right; color: #F7F9FC;">${roi.currentDSO} days</td></tr>
              <tr><td style="padding: 6px 0; color: #8A94A6;">Target DSO</td><td style="text-align: right; color: #00C48C;">${roi.targetDSO} days</td></tr>
              <tr><td style="padding: 6px 0; color: #8A94A6;">Working Capital Released</td><td style="text-align: right; color: #4A9FFF;">${formatCurrency(roi.wcReleased)}</td></tr>
              <tr><td style="padding: 6px 0; color: #8A94A6;">Bad Debt Savings</td><td style="text-align: right; color: #4A9FFF;">${formatCurrency(roi.badDebtSavings)}</td></tr>
              <tr><td style="padding: 6px 0; color: #8A94A6;">Unbilled Recovered</td><td style="text-align: right; color: #4A9FFF;">${formatCurrency(roi.unbilledRecovered)}</td></tr>
              <tr><td style="padding: 6px 0; color: #8A94A6;">Labor Saved</td><td style="text-align: right; color: #4A9FFF;">${formatCurrency(roi.laborSaved)}</td></tr>
              <tr style="border-top: 1px solid #2D5BE3;"><td style="padding: 8px 0; font-weight: bold;">Total Year 1 Value</td><td style="text-align: right; font-weight: bold; color: #00C48C; font-size: 18px;">${formatCurrency(roi.totalYear1)}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">ROI Multiple</td><td style="text-align: right; color: #F59E0B; font-weight: bold;">${roi.roi}x</td></tr>
            </table>
          </div>

          <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2D5BE3; margin: 0 0 16px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Business Info</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #8A94A6; width: 40%;">Business Name</td><td>${data.businessName}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Owner</td><td>${data.ownerName}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Email</td><td><a href="mailto:${data.ownerEmail}" style="color: #4A9FFF;">${data.ownerEmail}</a></td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Phone</td><td>${data.ownerPhone ?? 'Not provided'}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Annual Revenue</td><td>${data.annualRevenue}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Industry</td><td>${data.industry}${data.industryOther ? ` — ${data.industryOther}` : ''}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Employee Count</td><td>${data.employeeCount ?? 'Not provided'}</td></tr>
            </table>
          </div>

          <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2D5BE3; margin: 0 0 16px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Operations</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #8A94A6; width: 40%;">QB Version</td><td>${data.qbVersion}${data.qbDesktopVersion ? ` (${data.qbDesktopVersion})` : ''}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">QB Manager</td><td>${data.qbManager}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">QB State</td><td>${data.qbCurrentState}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Monthly Invoices</td><td>${data.monthlyInvoiceCount}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Avg Invoice Size</td><td>${data.avgInvoiceSize}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Payment Terms</td><td>${data.paymentTerms}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Modules Selected</td><td>${moduleList}</td></tr>
              <tr><td style="padding: 4px 0; color: #8A94A6;">Target Start</td><td>${data.targetStartDate ?? 'Not specified'}</td></tr>
            </table>
          </div>

          <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #2D5BE3; margin: 0 0 12px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Pain Point</h2>
            <blockquote style="border-left: 3px solid #2D5BE3; margin: 0; padding: 12px 16px; font-style: italic; color: #D1D9E6;">
              ${data.biggestArPain}
            </blockquote>
            <p style="margin: 12px 0 0; color: #8A94A6; font-size: 14px;">Categories: ${data.biggestPainCategory.join(', ')}</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXTAUTH_URL ?? 'https://lunarlogic.ai'}/admin/dashboard/${id}"
               style="background: #2D5BE3; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              View in Admin Dashboard →
            </a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send Jonathan notification:', err);
  }
}

export async function sendClientConfirmation(data: OnboardingData, roi: ROIResult): Promise<void> {
  try {
    const firstName = data.ownerName.split(' ')[0];
    await getResend().emails.send({
      from: 'onboard@lunarlogic.ai',
      to: data.ownerEmail,
      subject: "Your LunarLogic onboarding is complete — what's next",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1E; color: #F7F9FC; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 24px; font-weight: 900; letter-spacing: -1px; color: #4A9FFF;">LUNAR</span>
            <span style="font-size: 24px; font-weight: 900; letter-spacing: -1px; color: #F7F9FC;">LOGIC</span>
          </div>

          <h1 style="color: #F7F9FC; margin: 0 0 8px;">Thanks, ${firstName}!</h1>
          <p style="color: #8A94A6; margin: 0 0 24px;">Your onboarding information for <strong style="color: #F7F9FC;">${data.businessName}</strong> has been received. Here's a quick look at your potential ROI:</p>

          <div style="background: #1a2236; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center;">
            <p style="color: #8A94A6; margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Projected Year 1 Value</p>
            <p style="font-size: 40px; font-weight: 900; color: #00C48C; margin: 0 0 8px;">${formatCurrency(roi.totalYear1)}</p>
            <p style="color: #8A94A6; margin: 0; font-size: 14px;">DSO improvement: ${roi.currentDSO} days → ${roi.targetDSO} days</p>
          </div>

          <h2 style="color: #4A9FFF; margin: 0 0 20px; font-size: 18px;">What happens next:</h2>

          <div style="margin-bottom: 16px;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <div style="width: 32px; height: 32px; background: #2D5BE3; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; text-align: center; line-height: 32px;">1</div>
              <div>
                <p style="margin: 0; font-weight: bold; color: #F7F9FC;">Review & Discovery Call</p>
                <p style="margin: 4px 0 0; color: #8A94A6; font-size: 14px;">Our team will review your submission within 24 hours and schedule a 45-minute discovery call to finalize the scope.</p>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <div style="width: 32px; height: 32px; background: #2D5BE3; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; text-align: center; line-height: 32px;">2</div>
              <div>
                <p style="margin: 0; font-weight: bold; color: #F7F9FC;">Custom Proposal</p>
                <p style="margin: 4px 0 0; color: #8A94A6; font-size: 14px;">You'll receive a detailed proposal with pricing, timeline, and ROI model tailored to ${data.businessName}.</p>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <div style="width: 32px; height: 32px; background: #2D5BE3; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; text-align: center; line-height: 32px;">3</div>
              <div>
                <p style="margin: 0; font-weight: bold; color: #F7F9FC;">QuickBooks Connection</p>
                <p style="margin: 4px 0 0; color: #8A94A6; font-size: 14px;">We'll connect your QuickBooks and run a 2-week parallel test with no changes to your existing process.</p>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <div style="width: 32px; height: 32px; background: #00C48C; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; text-align: center; line-height: 32px;">4</div>
              <div>
                <p style="margin: 0; font-weight: bold; color: #F7F9FC;">Go Live & Measure</p>
                <p style="margin: 4px 0 0; color: #8A94A6; font-size: 14px;">Your AR automation goes live. We track DSO weekly and send you a monthly impact report.</p>
              </div>
            </div>
          </div>

          <div style="background: #1a2236; border-radius: 8px; padding: 20px; margin-top: 24px; border: 1px solid #2D5BE3;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #F7F9FC;">Questions? Reach out directly:</p>
            <p style="margin: 4px 0; color: #8A94A6;">LunarLogic — <a href="mailto:team@lunarlogic.ai" style="color: #4A9FFF;">jrodriguez@lunarlogic.ai</a></p>
            <p style="margin: 4px 0; color: #8A94A6; font-size: 14px; font-style: italic;">"We earn your business every month through results."</p>
          </div>

          <p style="text-align: center; color: #8A94A6; font-size: 12px; margin-top: 24px;">60-day satisfaction guarantee · Cancel anytime · No long-term contracts required</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send client confirmation:', err);
  }
}
