import type { OnboardingData, ROIResult } from '@/types/onboarding';
import { formatCurrency } from './roi';

export async function postSlackNotification(
  data: OnboardingData,
  roi: ROIResult,
  id: string
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const appUrl = process.env.NEXTAUTH_URL ?? 'https://lunarlogic.ai';
  const painExcerpt = data.biggestArPain.length > 200
    ? data.biggestArPain.substring(0, 197) + '...'
    : data.biggestArPain;

  const payrollFlag = data.nearlyMissedPayroll ? ':red_circle: *PAYROLL SCARE*' : ':white_check_mark: No payroll scare';
  const qbFlag = data.qbCurrentState.toLowerCase().includes('cleanup')
    ? ':warning: QB needs cleanup'
    : ':white_check_mark: QB state OK';

  const body = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚀 New Onboarding: ${data.businessName}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Industry*\n${data.industry}` },
          { type: 'mrkdwn', text: `*Revenue*\n${data.annualRevenue}` },
          { type: 'mrkdwn', text: `*Current DSO*\n${roi.currentDSO} days` },
          { type: 'mrkdwn', text: `*Target DSO*\n${roi.targetDSO} days` },
          { type: 'mrkdwn', text: `*Year 1 Value*\n${formatCurrency(roi.totalYear1)}` },
          { type: 'mrkdwn', text: `*Modules*\n${data.modulesSelected.join(', ')}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Flags:* ${payrollFlag} | ${qbFlag}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Pain Point:*\n_"${painExcerpt}"_`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View in Dashboard', emoji: true },
            url: `${appUrl}/admin/dashboard/${id}`,
            style: 'primary',
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('Slack webhook failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Failed to post Slack notification:', err);
  }
}
