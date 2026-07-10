/**
 * Accounts Payable (AP) demo data.
 *
 * Mirrors the AR mock layer in mockData.js but for the procure-to-pay side:
 * vendor bills, GL coding, approval routing, a payment schedule, vendor
 * management, and a DPO (Days Payable Outstanding) trend.
 *
 * Unlike AR — where the goal is the *lowest* DSO — the AP goal is a
 * *controlled* DPO that lands in a target "sweet spot" (≈28–32 days) matched
 * to terms, not the lowest possible number. Paying too early wastes float.
 *
 * This is demo/illustrative data for every login. The live QuickBooks path
 * (see src/lib/quickbooks.js) is AR-only for the qbsandbox client today; AP
 * has no live wiring yet, so these views are honestly labelled as a preview.
 */

const TODAY = new Date('2026-06-11');

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// DPO trend: before go-live the business pays too fast (low, erratic DPO);
// after go-live the scheduling engine walks it UP toward the target sweet
// spot. So — unlike DSO — the healthy line bends upward, then holds flat.
function genDPOTrend(goLiveDate, preLiveDPO, targetDPO) {
  const NOISE = [0.3, -0.5, 0.9, -0.4, 0.6, -0.8, 0.4, -0.3, 0.7, -0.6, 0.5, -0.9, 0.2, -0.4, 0.8, -0.5, 0.3, -0.7, 0.6, -0.2];
  const data = [];
  for (let i = 89; i >= 0; i--) {
    const date = addDays(TODAY, -i);
    const daysFromGoLive = (new Date(date) - new Date(goLiveDate)) / 86400000;
    const noise = NOISE[(89 - i) % NOISE.length];
    let dpo;
    if (daysFromGoLive < 0) {
      // Erratic, too-fast payment before automation — more noise, low base.
      dpo = preLiveDPO + noise * 2.4;
    } else {
      const ramp = Math.min(daysFromGoLive / 55, 1);
      dpo = preLiveDPO + ramp * (targetDPO - preLiveDPO) + noise * 0.7;
    }
    data.push({ date, dpo: Math.round(Math.max(dpo, 4) * 10) / 10 });
  }
  return data;
}

// Payables aging bucket by days relative to due date (negative = not yet due).
export function getPayableBucket(daysToDue) {
  if (daysToDue >= 0) return 'notdue';   // due in the future (on schedule)
  const overdue = -daysToDue;
  if (overdue <= 15) return '1-15';
  if (overdue <= 30) return '16-30';
  if (overdue <= 45) return '31-45';
  return '45+';
}

const BUCKET_LABELS = [
  { bucket: 'Not due', key: 'notdue' },
  { bucket: '1–15',    key: '1-15'   },
  { bucket: '16–30',   key: '16-30'  },
  { bucket: '31–45',   key: '31-45'  },
  { bucket: '45+',     key: '45+'    },
];

/**
 * Per-client AP seed. Each entry defines the vendor roster and the DPO
 * parameters; bills, aging, schedule, and trend are generated deterministically
 * from it so the numbers reconcile with each other.
 */
const AP_SEEDS = {
  kaptain: {
    goLiveDate: '2026-03-17', preLiveDPO: 11, targetDPO: 30, annualPurchases: 384000, discountCaptureRate: 96,
    vendors: [
      { name: 'Brightway Janitorial Supply', terms: 'Net 30', gl: '5010 · Cleaning Supplies',   category: 'Supplies',  discount: '2/10 Net 30', w9: true,  ytdPaid: 68400, avgPayDays: 29 },
      { name: 'FleetFuel Card Services',      terms: 'Net 15', gl: '6120 · Vehicle & Fuel',      category: 'Vehicle',   discount: null,          w9: true,  ytdPaid: 41200, avgPayDays: 14 },
      { name: 'Metro Equipment Rental',       terms: 'Net 30', gl: '6300 · Equipment Rental',    category: 'Equipment', discount: '1/10 Net 30', w9: true,  ytdPaid: 52800, avgPayDays: 31 },
      { name: 'Sunbelt Uniform & Linen',      terms: 'Net 30', gl: '5040 · Uniforms & Linen',    category: 'Supplies',  discount: null,          w9: true,  ytdPaid: 23600, avgPayDays: 27 },
      { name: 'Apex Payroll Services',        terms: 'Net 15', gl: '6600 · Payroll Processing',  category: 'Services',  discount: null,          w9: true,  ytdPaid: 18400, avgPayDays: 12 },
      { name: 'Cornerstone Insurance Grp',    terms: 'Net 30', gl: '6710 · Business Insurance',  category: 'Insurance', discount: null,          w9: false, ytdPaid: 31200, avgPayDays: 33 },
    ],
  },
  gualapack: {
    goLiveDate: '2026-02-10', preLiveDPO: 13, targetDPO: 32, annualPurchases: 940000, discountCaptureRate: 97,
    vendors: [
      { name: 'Polymer Resins Intl',        terms: 'Net 45', gl: '5100 · Raw Materials',       category: 'Materials', discount: '2/10 Net 45', w9: true,  ytdPaid: 214000, avgPayDays: 43 },
      { name: 'PrintPro Flexo Plates',      terms: 'Net 30', gl: '5120 · Printing & Plates',   category: 'Materials', discount: '1/10 Net 30', w9: true,  ytdPaid: 96400,  avgPayDays: 30 },
      { name: 'Midwest Freight Logistics',  terms: 'Net 30', gl: '6210 · Freight & Shipping',  category: 'Logistics', discount: null,          w9: true,  ytdPaid: 128600, avgPayDays: 32 },
      { name: 'Industrial Power & Utility', terms: 'Net 15', gl: '6410 · Utilities',           category: 'Utilities', discount: null,          w9: true,  ytdPaid: 74200,  avgPayDays: 14 },
      { name: 'Precision Tooling Corp',     terms: 'Net 30', gl: '6300 · Tooling & Dies',      category: 'Equipment', discount: '2/15 Net 30', w9: true,  ytdPaid: 58800,  avgPayDays: 28 },
      { name: 'Guardian Facility Services', terms: 'Net 30', gl: '6520 · Facility Maintenance',category: 'Services',  discount: null,          w9: false, ytdPaid: 44600,  avgPayDays: 34 },
    ],
  },
  forvismazars: {
    goLiveDate: '2026-04-07', preLiveDPO: 14, targetDPO: 30, annualPurchases: 2600000, discountCaptureRate: 98,
    vendors: [
      { name: 'Thomson Reuters (Research)', terms: 'Net 30', gl: '6810 · Research & Data',      category: 'Software',  discount: null,          w9: true,  ytdPaid: 486000, avgPayDays: 30 },
      { name: 'Regus Office Leasing',       terms: 'Net 15', gl: '6400 · Office Lease',         category: 'Facilities',discount: null,          w9: true,  ytdPaid: 372000, avgPayDays: 13 },
      { name: 'Deltek / Cloud Software',    terms: 'Net 30', gl: '6820 · Software Licensing',   category: 'Software',  discount: '1/10 Net 30', w9: true,  ytdPaid: 264000, avgPayDays: 29 },
      { name: 'Marsh Professional Liability',terms: 'Net 30',gl: '6710 · Professional Liability',category:'Insurance', discount: null,          w9: false, ytdPaid: 198000, avgPayDays: 32 },
      { name: 'LumenTech IT Managed Svcs',  terms: 'Net 30', gl: '6830 · Managed IT',           category: 'Services',  discount: '2/10 Net 30', w9: true,  ytdPaid: 156000, avgPayDays: 27 },
      { name: 'Ogilvie Recruiting Partners',terms: 'Net 45', gl: '6640 · Recruiting Fees',      category: 'Services',  discount: null,          w9: true,  ytdPaid: 224000, avgPayDays: 44 },
    ],
  },
  meridian: {
    goLiveDate: '2026-04-10', preLiveDPO: 12, targetDPO: 29, annualPurchases: 560000, discountCaptureRate: 95,
    vendors: [
      { name: 'Bloomberg Terminal Svcs',    terms: 'Net 30', gl: '6810 · Market Data',          category: 'Software',  discount: null,          w9: true,  ytdPaid: 132000, avgPayDays: 30 },
      { name: 'WeWork Office Space',         terms: 'Net 15', gl: '6400 · Office Lease',         category: 'Facilities',discount: null,          w9: true,  ytdPaid: 96000,  avgPayDays: 13 },
      { name: 'Salesforce CRM Licensing',   terms: 'Net 30', gl: '6820 · Software Licensing',   category: 'Software',  discount: '1/10 Net 30', w9: true,  ytdPaid: 78000,  avgPayDays: 28 },
      { name: 'Hartwell Travel Management',  terms: 'Net 30', gl: '6510 · Travel & Entertainment',category:'Travel',   discount: null,          w9: true,  ytdPaid: 64400,  avgPayDays: 31 },
      { name: 'Marketing Collective LLC',    terms: 'Net 30', gl: '6910 · Marketing & Ads',      category: 'Marketing', discount: '2/10 Net 30', w9: true,  ytdPaid: 52800,  avgPayDays: 26 },
      { name: 'Beacon Business Insurance',   terms: 'Net 30', gl: '6710 · Business Insurance',   category: 'Insurance', discount: null,          w9: false, ytdPaid: 38600,  avgPayDays: 33 },
    ],
  },
  qbsandbox: {
    goLiveDate: '2026-05-01', preLiveDPO: 12, targetDPO: 30, annualPurchases: 360000, discountCaptureRate: 92,
    vendors: [
      { name: 'Norton Lumber & Building',   terms: 'Net 30', gl: '5000 · Cost of Goods Sold',   category: 'Materials', discount: '2/10 Net 30', w9: true,  ytdPaid: 42800, avgPayDays: 30 },
      { name: 'Cal Telephone',              terms: 'Net 15', gl: '6410 · Utilities',            category: 'Utilities', discount: null,          w9: true,  ytdPaid: 12600, avgPayDays: 14 },
      { name: 'Chin’s Gas and Oil',    terms: 'Net 15', gl: '6120 · Vehicle & Fuel',       category: 'Vehicle',   discount: null,          w9: true,  ytdPaid: 18400, avgPayDays: 13 },
      { name: 'Ellis Equipment Rental',     terms: 'Net 30', gl: '6300 · Equipment Rental',     category: 'Equipment', discount: '1/10 Net 30', w9: true,  ytdPaid: 26200, avgPayDays: 31 },
      { name: 'Tania’s Nursery',        terms: 'Net 30', gl: '5010 · Materials & Supplies', category: 'Supplies',  discount: null,          w9: false, ytdPaid: 15800, avgPayDays: 28 },
      { name: 'Mahoney Mugs (Promo)',       terms: 'Net 30', gl: '6910 · Marketing & Ads',      category: 'Marketing', discount: null,          w9: false, ytdPaid: 9400,  avgPayDays: 34 },
    ],
  },
};

// Bill "shape" per client: a spread of due dates and statuses that produces a
// realistic aging profile weighted toward not-yet-due (healthy, scheduled AP).
// dueOffset is days from TODAY (negative = past due). status drives the queue.
const BILL_TEMPLATE = [
  { vi: 0, mult: 1.00, dueOffset:  18, status: 'scheduled' },
  { vi: 2, mult: 0.72, dueOffset:  12, status: 'scheduled' },
  { vi: 1, mult: 0.34, dueOffset:   9, status: 'approved'  },
  { vi: 4, mult: 0.28, dueOffset:   6, status: 'approved'  },
  { vi: 0, mult: 0.64, dueOffset:  24, status: 'review'    },
  { vi: 3, mult: 0.41, dueOffset:  15, status: 'review'    },
  { vi: 5, mult: 0.55, dueOffset:  21, status: 'review'    },
  { vi: 2, mult: 0.88, dueOffset:  -3, status: 'approved'  },
  { vi: 1, mult: 0.47, dueOffset:  -9, status: 'review'    },
  { vi: 4, mult: 0.38, dueOffset: -22, status: 'review'    },
  { vi: 3, mult: 0.62, dueOffset:  30, status: 'scheduled' },
  { vi: 5, mult: 0.44, dueOffset:  27, status: 'approved'  },
  { vi: 0, mult: 0.91, dueOffset: -14, status: 'paid'      },
  { vi: 2, mult: 0.70, dueOffset: -20, status: 'paid'      },
];

function fmtDoc(prefix, n) { return `${prefix}-${n}`; }

export function getClientAPData(clientId) {
  const seed = AP_SEEDS[clientId] || AP_SEEDS.kaptain;
  const { vendors, goLiveDate, preLiveDPO, targetDPO, annualPurchases, discountCaptureRate } = seed;

  // Base bill size scales with the client's purchasing volume.
  const baseBill = Math.round((annualPurchases / 26) / 100) * 100; // ~biweekly spend

  const bills = BILL_TEMPLATE.map((t, i) => {
    const v = vendors[t.vi % vendors.length];
    const amount = Math.round((baseBill * t.mult) / 50) * 50;
    const dueDate = addDays(TODAY, t.dueOffset);
    const billDate = addDays(dueDate, -Number(v.terms.replace(/\D/g, '')) || -30);
    const hasDiscount = !!v.discount && t.status !== 'paid';
    const discPct = v.discount ? parseFloat(v.discount) : 0;
    return {
      id: fmtDoc('BILL', 4200 + i),
      vendor: v.name,
      amount,
      billDate,
      dueDate,
      daysToDue: t.dueOffset,
      terms: v.terms,
      gl: v.gl,
      category: v.category,
      status: t.status,
      approver: t.status === 'review' ? null : ['J. Rodriguez', 'Controller', 'A. Chen'][i % 3],
      origin: 'ap_capture',
      glConfidence: 88 + ((i * 7) % 11),           // AI GL-coding confidence
      discountTerms: v.discount || null,
      discountEligible: hasDiscount && t.dueOffset > 3,
      discountAmount: hasDiscount ? Math.round(amount * (discPct / 100)) : 0,
    };
  });

  const openBills = bills.filter(b => b.status !== 'paid');

  // Payables aging from open bills.
  const agingMap = { notdue: { amount: 0, count: 0 }, '1-15': { amount: 0, count: 0 }, '16-30': { amount: 0, count: 0 }, '31-45': { amount: 0, count: 0 }, '45+': { amount: 0, count: 0 } };
  openBills.forEach(b => {
    const k = getPayableBucket(b.daysToDue);
    agingMap[k].amount += b.amount;
    agingMap[k].count += 1;
  });
  const payablesAging = BUCKET_LABELS.map(({ bucket, key }) => ({ bucket, key, amount: Math.round(agingMap[key].amount), count: agingMap[key].count }));

  const totalPayable = openBills.reduce((s, b) => s + b.amount, 0);

  // Vendor rollup: attach open balances/counts from the generated bills.
  const vendorRollup = vendors.map(v => {
    const vb = openBills.filter(b => b.vendor === v.name);
    const openAmount = vb.reduce((s, b) => s + b.amount, 0);
    const pastDue = vb.filter(b => b.daysToDue < 0).reduce((s, b) => s + b.amount, 0);
    // 1099 applies to service vendors paid > $600 that are not incorporated (proxy: no W-9 on file OR service category).
    const needs1099 = ['Services', 'Marketing', 'Logistics'].includes(v.category);
    return {
      vendor: v.name,
      terms: v.terms,
      gl: v.gl,
      category: v.category,
      avgPayDays: v.avgPayDays,
      openAmount: Math.round(openAmount),
      openCount: vb.length,
      pastDue: Math.round(pastDue),
      ytdPaid: v.ytdPaid,
      w9: v.w9,
      needs1099,
      form1099Ready: needs1099 ? v.w9 : true,
      discountTerms: v.discount || null,
    };
  }).sort((a, b) => b.openAmount - a.openAmount);

  // Upcoming payment schedule — approved/scheduled bills batched by due date.
  const scheduled = openBills
    .filter(b => b.status === 'scheduled' || b.status === 'approved')
    .sort((a, b) => a.daysToDue - b.daysToDue)
    .map(b => {
      // Schedule the payment to land close to the due date (controlled DPO),
      // or inside the ~10-day discount window when a discount is worth capturing.
      // Never schedule before today; if already past due, pay now (offset 0).
      const payOffset = b.discountEligible
        ? Math.min(Math.max(b.daysToDue, 0), 8)
        : Math.max(b.daysToDue, 0);
      return {
        id: b.id,
        vendor: b.vendor,
        amount: b.amount,
        dueDate: b.dueDate,
        daysToDue: b.daysToDue,
        scheduledDate: addDays(TODAY, Math.max(payOffset, 0)),
        method: b.amount > baseBill * 0.6 ? 'ACH' : 'Check',
        discountCaptured: b.discountEligible,
        discountAmount: b.discountEligible ? b.discountAmount : 0,
        status: b.status,
      };
    });

  const dpoTrend = genDPOTrend(goLiveDate, preLiveDPO, targetDPO);
  const currentDPO = dpoTrend[dpoTrend.length - 1].dpo;

  const discountsAvailable = openBills.filter(b => b.discountEligible).reduce((s, b) => s + b.discountAmount, 0);

  return {
    goLiveDate,
    preLiveDPO,
    targetDPO,
    annualPurchases,
    discountCaptureRate,
    currentDPO,
    totalPayable: Math.round(totalPayable),
    dpoTrend,
    payablesAging,
    bills,
    vendors: vendorRollup,
    scheduledPayments: scheduled,
    discountsAvailable: Math.round(discountsAvailable),
    // Counts used for nav badges / tiles.
    counts: {
      review:    bills.filter(b => b.status === 'review').length,
      approved:  bills.filter(b => b.status === 'approved').length,
      scheduled: bills.filter(b => b.status === 'scheduled').length,
      pastDue:   openBills.filter(b => b.daysToDue < 0).length,
    },
  };
}
