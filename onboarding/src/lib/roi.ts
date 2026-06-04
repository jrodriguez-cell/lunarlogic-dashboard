import type { ROIResult } from '@/types/onboarding';

export function parseRevenueToNumber(range: string): number {
  const map: Record<string, number> = {
    'Under $500K': 350000,
    '$500K – $750K': 625000,
    '$750K – $1.5M': 1125000,
    '$1.5M – $2.5M': 2000000,
    '$2.5M – $5M': 3750000,
    '$5M – $10M': 7500000,
    'Over $10M': 12000000,
  };
  return map[range] ?? 1000000;
}

export function parseDSOToNumber(range: string): number {
  const map: Record<string, number> = {
    "I don't know (we'll estimate)": 48,
    'Under 20 days (very healthy)': 15,
    '20 – 30 days': 25,
    '30 – 45 days': 37,
    '45 – 60 days': 52,
    '60 – 90 days': 75,
    'Over 90 days': 105,
  };
  return map[range] ?? 48;
}

export function computeROI(annualRevenue: number, currentDSO: number): ROIResult {
  const targetDSO = Math.round(currentDSO * 0.55);
  const wcLocked = Math.round((currentDSO / 365) * annualRevenue);
  const wcReleased = Math.round(((currentDSO - targetDSO) / 365) * annualRevenue);
  const badDebtSavings = Math.round(annualRevenue * 0.02 * 0.70);
  const unbilledRecovered = Math.round(annualRevenue * 0.025 * 0.85);
  const laborSaved = Math.round(500 * 25 * 0.80);
  const totalYear1 = wcReleased + badDebtSavings + unbilledRecovered + laborSaved;
  const monthlyFee = 1000;
  const roi = Math.round(totalYear1 / (monthlyFee * 12));
  return { currentDSO, targetDSO, wcLocked, wcReleased, badDebtSavings, unbilledRecovered, laborSaved, totalYear1, roi };
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
