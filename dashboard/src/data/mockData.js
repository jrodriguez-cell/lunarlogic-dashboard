const TODAY = new Date('2026-05-19');

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function genDSOTrend(goLiveDate, preLiveDSO, targetDSO) {
  const NOISE = [0.2,-0.4,0.8,-0.3,0.5,-0.7,0.3,-0.2,0.6,-0.5,0.4,-0.8,0.1,-0.3,0.7,-0.4,0.2,-0.6,0.5,-0.1];
  const data = [];
  for (let i = 89; i >= 0; i--) {
    const date = addDays(TODAY, -i);
    const daysFromGoLive = (new Date(date) - new Date(goLiveDate)) / 86400000;
    const noise = NOISE[(89 - i) % NOISE.length];
    let dso;
    if (daysFromGoLive < 0) {
      dso = preLiveDSO + noise * 1.5;
    } else {
      const decay = Math.min(daysFromGoLive / 55, 1);
      dso = preLiveDSO - decay * (preLiveDSO - targetDSO) + noise * 0.9;
    }
    data.push({ date, dso: Math.round(Math.max(dso, targetDSO - 2) * 10) / 10 });
  }
  return data;
}

export function getAgingBucket(daysOverdue) {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

const CLIENTS = {
  kaptain: {
    name: 'Kaptain Clean LLC',
    industry: 'Commercial Cleaning Services',
    goLiveDate: '2026-03-17',
    preLiveDSO: 47,
    collectionEfficiency: 91,
    dsoTrend: genDSOTrend('2026-03-17', 47, 28),
    arAging: [
      { bucket: 'Current', key: 'current', amount: 52400, count: 14 },
      { bucket: '1–30',    key: '1-30',    amount: 28600, count: 8  },
      { bucket: '31–60',   key: '31-60',   amount: 11200, count: 3  },
      { bucket: '61–90',   key: '61-90',   amount:  4800, count: 2  },
      { bucket: '90+',     key: '90+',     amount:  2100, count: 1  },
    ],
    invoices: [
      { id: 'INV-1042', customer: 'Metro Tower Corp',        amount:  8200, due: '2026-06-05', issued: '2026-05-06', status: 'Sent',    daysOut: 11, daysOverdue: 0  },
      { id: 'INV-1041', customer: 'Riverside Business Park', amount: 12400, due: '2026-05-10', issued: '2026-04-10', status: 'Overdue', daysOut: 37, daysOverdue: 7  },
      { id: 'INV-1040', customer: 'Greenfield Medical',      amount:  5600, due: '2026-04-14', issued: '2026-03-15', status: 'Overdue', daysOut: 63, daysOverdue: 33 },
      { id: 'INV-1039', customer: 'Northgate Offices',       amount:  7800, due: '2026-04-27', issued: '2026-03-28', status: 'Overdue', daysOut: 50, daysOverdue: 20 },
      { id: 'INV-1038', customer: 'Summit Business Plaza',   amount:  3200, due: '2026-05-31', issued: '2026-05-01', status: 'Viewed',  daysOut: 16, daysOverdue: 0  },
      { id: 'INV-1037', customer: 'Harbor View Facilities',  amount:  5600, due: '2026-05-22', issued: '2026-04-22', status: 'Sent',    daysOut: 25, daysOverdue: 0  },
      { id: 'INV-1036', customer: 'Riverside Business Park', amount:  9400, due: '2026-05-03', issued: '2026-04-03', status: 'Overdue', daysOut: 44, daysOverdue: 14 },
      { id: 'INV-1035', customer: 'Metro Tower Corp',        amount:  8200, due: '2026-04-30', issued: '2026-03-31', status: 'Paid',    daysOut: 0,  daysOverdue: 0  },
      { id: 'INV-1034', customer: 'Greenfield Medical',      amount:  5600, due: '2026-03-20', issued: '2026-02-18', status: 'Overdue', daysOut: 88, daysOverdue: 58 },
      { id: 'INV-1033', customer: 'Northgate Offices',       amount:  4800, due: '2026-04-09', issued: '2026-03-10', status: 'Overdue', daysOut: 68, daysOverdue: 38 },
      { id: 'INV-1032', customer: 'Summit Business Plaza',   amount:  3200, due: '2026-05-12', issued: '2026-04-12', status: 'Paid',    daysOut: 0,  daysOverdue: 0  },
      { id: 'INV-1031', customer: 'Harbor View Facilities',  amount:  4800, due: '2026-06-08', issued: '2026-05-09', status: 'Sent',    daysOut: 8,  daysOverdue: 0  },
      { id: 'INV-1030', customer: 'Metro Tower Corp',        amount:  8200, due: '2026-06-06', issued: '2026-05-07', status: 'Viewed',  daysOut: 10, daysOverdue: 0  },
      { id: 'INV-1029', customer: 'Summit Business Plaza',   amount:  3200, due: '2026-05-29', issued: '2026-04-29', status: 'Viewed',  daysOut: 18, daysOverdue: 0  },
      { id: 'INV-1028', customer: 'Riverside Business Park', amount:  6200, due: '2026-05-08', issued: '2026-04-08', status: 'Overdue', daysOut: 39, daysOverdue: 9  },
    ],
    paymentBehavior: [
      { customer: 'Summit Business Plaza',   avgDays: 16, openCount: 2, openAmount:  6400, trend: -3, riskLevel: 'low'    },
      { customer: 'Metro Tower Corp',        avgDays: 21, openCount: 3, openAmount: 24600, trend: -5, riskLevel: 'low'    },
      { customer: 'Harbor View Facilities',  avgDays: 24, openCount: 2, openAmount: 10400, trend: +2, riskLevel: 'low'    },
      { customer: 'Riverside Business Park', avgDays: 34, openCount: 3, openAmount: 28000, trend: +6, riskLevel: 'medium' },
      { customer: 'Northgate Offices',       avgDays: 54, openCount: 2, openAmount: 12600, trend: -8, riskLevel: 'medium' },
      { customer: 'Greenfield Medical',      avgDays: 71, openCount: 2, openAmount: 11200, trend: +4, riskLevel: 'high'   },
    ],
    payments: [
      { txId: 'TXN-8821', amount:  8200, received: '2026-05-19', bank: 'Chase Business',   description: 'METRO TOWER CORP PAYMENT',     matchedCustomer: 'Metro Tower Corp',        matchedInvoice: 'INV-1035', confidence: 97, status: 'Auto-Applied',   appliedAt: '2026-05-19T09:14:22', rule: 'Exact amount + name match',                  candidates: [] },
      { txId: 'TXN-8820', amount:  5600, received: '2026-05-19', bank: 'Chase Business',   description: 'GREENFIELD MEDICAL GROUP',    matchedCustomer: 'Greenfield Medical',      matchedInvoice: 'INV-1034', confidence: 94, status: 'Auto-Applied',   appliedAt: '2026-05-19T08:52:11', rule: 'Amount match + fuzzy name (0.94)',            candidates: [] },
      { txId: 'TXN-8819', amount: 16600, received: '2026-05-18', bank: 'Chase Business',   description: 'RIVERSIDE BSNS PARK BULK PMT', matchedCustomer: 'Riverside Business Park', matchedInvoice: null,       confidence: 72, status: 'Pending Review', appliedAt: null,                  rule: 'Bulk payment — matches 3 open invoices',     candidates: ['INV-1041 ($12,400)', 'INV-1028 ($6,200)', 'INV-1036 ($9,400)'] },
      { txId: 'TXN-8818', amount:  3200, received: '2026-05-18', bank: 'Chase Business',   description: 'SUMMIT BUSINESS PLAZA',       matchedCustomer: 'Summit Business Plaza',   matchedInvoice: 'INV-1032', confidence: 99, status: 'Auto-Applied',   appliedAt: '2026-05-18T10:21:44', rule: 'Exact amount + name match',                  candidates: [] },
      { txId: 'TXN-8817', amount:  4800, received: '2026-05-17', bank: 'Chase Business',   description: 'NORTHGATE OFFICES INC',       matchedCustomer: 'Northgate Offices',       matchedInvoice: 'INV-1033', confidence: 91, status: 'Auto-Applied',   appliedAt: '2026-05-17T14:07:38', rule: 'Amount match + fuzzy name (0.91)',            candidates: [] },
      { txId: 'TXN-8816', amount:  7200, received: '2026-05-17', bank: 'Chase Business',   description: 'HARBOR VIEW FACILITIES LLC',  matchedCustomer: 'Harbor View Facilities',  matchedInvoice: null,       confidence: 61, status: 'Pending Review', appliedAt: null,                  rule: 'Partial payment — $7,200 vs $10,400 open',   candidates: ['INV-1037 ($5,600)', 'INV-1031 ($4,800)'] },
      { txId: 'TXN-8815', amount:  8200, received: '2026-05-16', bank: 'Chase Business',   description: 'METRO TOWER CORP',            matchedCustomer: 'Metro Tower Corp',        matchedInvoice: 'INV-1030', confidence: 96, status: 'Auto-Applied',   appliedAt: '2026-05-16T09:33:51', rule: 'Exact amount + name match',                  candidates: [] },
      { txId: 'TXN-8814', amount:  5600, received: '2026-05-16', bank: 'Chase Business',   description: 'GREENFIELD MED GRP LLC',      matchedCustomer: 'Greenfield Medical',      matchedInvoice: 'INV-1040', confidence: 88, status: 'Manual',         appliedAt: '2026-05-16T16:45:22', rule: 'Below 90% threshold — manually confirmed',   candidates: [] },
      { txId: 'TXN-8813', amount:  3200, received: '2026-05-15', bank: 'Chase Business',   description: 'SUMMIT BUSINESS PLAZA',       matchedCustomer: 'Summit Business Plaza',   matchedInvoice: 'INV-1029', confidence: 99, status: 'Auto-Applied',   appliedAt: '2026-05-15T08:19:07', rule: 'Exact amount + name match',                  candidates: [] },
      { txId: 'TXN-8812', amount:  4800, received: '2026-05-15', bank: 'Chase Business',   description: 'HARBOR VIEW FACILITIES',      matchedCustomer: 'Harbor View Facilities',  matchedInvoice: 'INV-1031', confidence: 93, status: 'Auto-Applied',   appliedAt: '2026-05-15T11:42:33', rule: 'Amount match + fuzzy name (0.93)',            candidates: [] },
      { txId: 'TXN-8811', amount:  9400, received: '2026-05-14', bank: 'Chase Business',   description: 'RIVERSIDE BSNS PARK',         matchedCustomer: 'Riverside Business Park', matchedInvoice: 'INV-1036', confidence: 92, status: 'Auto-Applied',   appliedAt: '2026-05-14T13:28:17', rule: 'Amount match + partial name (0.92)',          candidates: [] },
      { txId: 'TXN-8810', amount:  7800, received: '2026-05-14', bank: 'Chase Business',   description: 'NORTHGATE OFFICES',           matchedCustomer: 'Northgate Offices',       matchedInvoice: 'INV-1039', confidence: 98, status: 'Auto-Applied',   appliedAt: '2026-05-14T10:05:44', rule: 'Exact amount + name match',                  candidates: [] },
      { txId: 'TXN-8809', amount:  6200, received: '2026-05-13', bank: 'Chase Business',   description: 'RIVERSIDE BUSINESS PARK',     matchedCustomer: 'Riverside Business Park', matchedInvoice: 'INV-1028', confidence: 95, status: 'Auto-Applied',   appliedAt: '2026-05-13T15:11:02', rule: 'Exact amount + name match',                  candidates: [] },
      { txId: 'TXN-8808', amount: 12400, received: '2026-05-12', bank: 'Chase Business',   description: 'RIVERSIDE BSNS PARK',         matchedCustomer: 'Riverside Business Park', matchedInvoice: 'INV-1041', confidence: 96, status: 'Auto-Applied',   appliedAt: '2026-05-12T09:44:58', rule: 'Exact amount + name match',                  candidates: [] },
      { txId: 'TXN-8807', amount:  8200, received: '2026-05-11', bank: 'Chase Business',   description: 'METRO TOWER CORP PAYMENT',    matchedCustomer: 'Metro Tower Corp',        matchedInvoice: 'INV-1042', confidence: 97, status: 'Auto-Applied',   appliedAt: '2026-05-11T08:37:19', rule: 'Exact amount + name match',                  candidates: [] },
    ],
  },

  gualapack: {
    name: 'Gualapack',
    industry: 'Packaging Manufacturing',
    goLiveDate: '2026-02-10',
    preLiveDSO: 52,
    collectionEfficiency: 86,
    dsoTrend: genDSOTrend('2026-02-10', 52, 38),
    arAging: [
      { bucket: 'Current', key: 'current', amount:  88200, count: 22 },
      { bucket: '1–30',    key: '1-30',    amount:  51600, count: 14 },
      { bucket: '31–60',   key: '31-60',   amount:  22400, count:  6 },
      { bucket: '61–90',   key: '61-90',   amount:   9800, count:  3 },
      { bucket: '90+',     key: '90+',     amount:   3400, count:  1 },
    ],
    invoices: [
      { id: 'GP-2208', customer: 'Pacific Beverages',   amount: 31400, due: '2026-05-31', issued: '2026-05-01', status: 'Viewed',  daysOut: 16, daysOverdue: 0  },
      { id: 'GP-2207', customer: 'FreshMart Foods',     amount: 22000, due: '2026-05-09', issued: '2026-04-09', status: 'Overdue', daysOut: 38, daysOverdue: 8  },
      { id: 'GP-2206', customer: 'Western Foods LLC',   amount: 19200, due: '2026-04-21', issued: '2026-03-22', status: 'Overdue', daysOut: 56, daysOverdue: 26 },
      { id: 'GP-2205', customer: 'Alpine Snacks Co',    amount: 15600, due: '2026-06-02', issued: '2026-05-03', status: 'Sent',    daysOut: 14, daysOverdue: 0  },
      { id: 'GP-2204', customer: 'Sunrise Dairy',       amount:  8800, due: '2026-05-26', issued: '2026-04-26', status: 'Viewed',  daysOut: 21, daysOverdue: 0  },
      { id: 'GP-2203', customer: 'Pacific Beverages',   amount: 28600, due: '2026-04-30', issued: '2026-03-31', status: 'Overdue', daysOut: 47, daysOverdue: 17 },
      { id: 'GP-2202', customer: 'FreshMart Foods',     amount: 18400, due: '2026-06-10', issued: '2026-05-11', status: 'Sent',    daysOut: 6,  daysOverdue: 0  },
      { id: 'GP-2201', customer: 'Western Foods LLC',   amount: 15800, due: '2026-03-28', issued: '2026-02-26', status: 'Overdue', daysOut: 80, daysOverdue: 50 },
      { id: 'GP-2200', customer: 'Alpine Snacks Co',    amount: 12200, due: '2026-04-14', issued: '2026-03-15', status: 'Overdue', daysOut: 63, daysOverdue: 33 },
      { id: 'GP-2199', customer: 'Sunrise Dairy',       amount:  7600, due: '2026-05-15', issued: '2026-04-15', status: 'Paid',    daysOut: 0,  daysOverdue: 0  },
      { id: 'GP-2198', customer: 'Pacific Beverages',   amount: 24800, due: '2026-05-20', issued: '2026-04-20', status: 'Viewed',  daysOut: 27, daysOverdue: 0  },
    ],
    paymentBehavior: [
      { customer: 'Alpine Snacks Co',  avgDays: 22, openCount: 2, openAmount:  27800, trend: -4, riskLevel: 'low'    },
      { customer: 'Sunrise Dairy',     avgDays: 28, openCount: 1, openAmount:   8800, trend: -2, riskLevel: 'low'    },
      { customer: 'FreshMart Foods',   avgDays: 36, openCount: 2, openAmount:  40400, trend: +3, riskLevel: 'medium' },
      { customer: 'Pacific Beverages', avgDays: 41, openCount: 3, openAmount:  84800, trend: +7, riskLevel: 'medium' },
      { customer: 'Western Foods LLC', avgDays: 63, openCount: 2, openAmount:  35000, trend: +5, riskLevel: 'high'   },
    ],
    payments: [
      { txId: 'GP-T-441', amount: 31400, received: '2026-05-19', bank: 'Wells Fargo Business', description: 'PACIFIC BEVERAGES INC PAYMENT',  matchedCustomer: 'Pacific Beverages',  matchedInvoice: 'GP-2208', confidence: 98, status: 'Auto-Applied',   appliedAt: '2026-05-19T10:02:11', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-440', amount: 22000, received: '2026-05-19', bank: 'Wells Fargo Business', description: 'FRESHMART FOODS LLC',            matchedCustomer: 'FreshMart Foods',    matchedInvoice: 'GP-2207', confidence: 95, status: 'Auto-Applied',   appliedAt: '2026-05-19T09:41:07', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-439', amount: 54200, received: '2026-05-18', bank: 'Wells Fargo Business', description: 'WESTERN FOODS BULK PMT',         matchedCustomer: 'Western Foods LLC',  matchedInvoice: null,      confidence: 68, status: 'Pending Review', appliedAt: null,                  rule: 'Bulk payment — multiple open invoices',        candidates: ['GP-2206 ($19,200)', 'GP-2201 ($15,800)', 'GP-2200 ($12,200)'] },
      { txId: 'GP-T-438', amount: 15600, received: '2026-05-18', bank: 'Wells Fargo Business', description: 'ALPINE SNACKS CO WIRE',          matchedCustomer: 'Alpine Snacks Co',   matchedInvoice: 'GP-2205', confidence: 99, status: 'Auto-Applied',   appliedAt: '2026-05-18T14:22:39', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-437', amount:  8800, received: '2026-05-17', bank: 'Wells Fargo Business', description: 'SUNRISE DAIRY FARMS',            matchedCustomer: 'Sunrise Dairy',      matchedInvoice: 'GP-2204', confidence: 97, status: 'Auto-Applied',   appliedAt: '2026-05-17T11:14:55', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-436', amount: 20000, received: '2026-05-17', bank: 'Wells Fargo Business', description: 'PACIFIC BEVERAGES PARTIAL',      matchedCustomer: 'Pacific Beverages',  matchedInvoice: null,      confidence: 59, status: 'Pending Review', appliedAt: null,                  rule: 'Partial payment — $20,000 vs $28,600 open',    candidates: ['GP-2203 ($28,600)'] },
      { txId: 'GP-T-435', amount: 18400, received: '2026-05-16', bank: 'Wells Fargo Business', description: 'FRESHMART FOODS LLC',            matchedCustomer: 'FreshMart Foods',    matchedInvoice: 'GP-2202', confidence: 99, status: 'Auto-Applied',   appliedAt: '2026-05-16T08:53:44', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-434', amount: 18900, received: '2026-05-16', bank: 'Wells Fargo Business', description: 'WESTERN FOODS LLC ACH',          matchedCustomer: 'Western Foods LLC',  matchedInvoice: 'GP-2206', confidence: 86, status: 'Manual',         appliedAt: '2026-05-16T15:30:22', rule: 'Below 90% threshold — manually confirmed',     candidates: [] },
      { txId: 'GP-T-433', amount: 12200, received: '2026-05-15', bank: 'Wells Fargo Business', description: 'ALPINE SNACKS CO',               matchedCustomer: 'Alpine Snacks Co',   matchedInvoice: 'GP-2200', confidence: 92, status: 'Auto-Applied',   appliedAt: '2026-05-15T10:08:31', rule: 'Amount match + fuzzy name (0.92)',              candidates: [] },
      { txId: 'GP-T-432', amount:  7600, received: '2026-05-14', bank: 'Wells Fargo Business', description: 'SUNRISE DAIRY FARMS INC',        matchedCustomer: 'Sunrise Dairy',      matchedInvoice: 'GP-2199', confidence: 93, status: 'Auto-Applied',   appliedAt: '2026-05-14T13:51:08', rule: 'Amount match + partial name (0.93)',            candidates: [] },
      { txId: 'GP-T-431', amount: 24800, received: '2026-05-13', bank: 'Wells Fargo Business', description: 'PACIFIC BEVERAGES INC',          matchedCustomer: 'Pacific Beverages',  matchedInvoice: 'GP-2198', confidence: 96, status: 'Auto-Applied',   appliedAt: '2026-05-13T09:27:44', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-430', amount: 15800, received: '2026-05-12', bank: 'Wells Fargo Business', description: 'WESTERN FOODS LLC WIRE',         matchedCustomer: 'Western Foods LLC',  matchedInvoice: 'GP-2201', confidence: 94, status: 'Auto-Applied',   appliedAt: '2026-05-12T11:44:22', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-429', amount: 28600, received: '2026-05-11', bank: 'Wells Fargo Business', description: 'PACIFIC BEVERAGES PAYMENT',      matchedCustomer: 'Pacific Beverages',  matchedInvoice: 'GP-2203', confidence: 97, status: 'Auto-Applied',   appliedAt: '2026-05-11T10:12:38', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-428', amount: 19200, received: '2026-05-10', bank: 'Wells Fargo Business', description: 'WESTERN FOODS LLC',              matchedCustomer: 'Western Foods LLC',  matchedInvoice: 'GP-2206', confidence: 98, status: 'Auto-Applied',   appliedAt: '2026-05-10T08:39:55', rule: 'Exact amount + name match',                    candidates: [] },
      { txId: 'GP-T-427', amount: 22000, received: '2026-05-09', bank: 'Wells Fargo Business', description: 'FRESHMART FOODS WIRE PMT',       matchedCustomer: 'FreshMart Foods',    matchedInvoice: 'GP-2207', confidence: 91, status: 'Auto-Applied',   appliedAt: '2026-05-09T14:03:17', rule: 'Amount match + partial name (0.91)',            candidates: [] },
    ],
  },

  forvismazars: {
    name: 'Forvis Mazars',
    industry: 'Professional Services - Audit & Advisory',
    office: 'Chicago Office - POC',
    goLiveDate: '2026-04-07',
    preLiveDSO: 58,
    collectionEfficiency: 89,
    dsoTrend: genDSOTrend('2026-04-07', 58, 34),
    arAging: [
      { bucket: 'Current', key: 'current', amount: 1248000, count: 87 },
      { bucket: '1–30',    key: '1-30',    amount:  614000, count: 42 },
      { bucket: '31–60',   key: '31-60',   amount:  287000, count: 19 },
      { bucket: '61–90',   key: '61-90',   amount:  134000, count:  9 },
      { bucket: '90+',     key: '90+',     amount:   62000, count:  4 },
    ],
    invoices: [
      { id: 'FM-4418', customer: 'Alderton Capital Partners',    amount: 142000, due: '2026-06-05', issued: '2026-05-06', status: 'Sent',    daysOut: 11, daysOverdue: 0  },
      { id: 'FM-4417', customer: 'Meridian Industrial Group',    amount:  98400, due: '2026-05-10', issued: '2026-04-10', status: 'Overdue', daysOut: 37, daysOverdue: 7  },
      { id: 'FM-4416', customer: 'Castlebrook Real Estate',      amount:  74600, due: '2026-04-14', issued: '2026-03-15', status: 'Overdue', daysOut: 63, daysOverdue: 33 },
      { id: 'FM-4415', customer: 'Vantage Healthcare Systems',   amount: 118000, due: '2026-04-27', issued: '2026-03-28', status: 'Overdue', daysOut: 50, daysOverdue: 20 },
      { id: 'FM-4414', customer: 'Northlake Private Equity',     amount:  56200, due: '2026-05-31', issued: '2026-05-01', status: 'Viewed',  daysOut: 16, daysOverdue: 0  },
      { id: 'FM-4413', customer: 'Harborside Technology Corp',   amount:  88000, due: '2026-05-22', issued: '2026-04-22', status: 'Sent',    daysOut: 25, daysOverdue: 0  },
      { id: 'FM-4412', customer: 'Meridian Industrial Group',    amount:  76000, due: '2026-05-03', issued: '2026-04-03', status: 'Overdue', daysOut: 44, daysOverdue: 14 },
      { id: 'FM-4411', customer: 'Alderton Capital Partners',    amount: 135000, due: '2026-04-30', issued: '2026-03-31', status: 'Paid',    daysOut: 0,  daysOverdue: 0  },
      { id: 'FM-4410', customer: 'Castlebrook Real Estate',      amount:  62400, due: '2026-03-20', issued: '2026-02-18', status: 'Overdue', daysOut: 88, daysOverdue: 58 },
      { id: 'FM-4409', customer: 'Vantage Healthcare Systems',   amount:  94000, due: '2026-04-09', issued: '2026-03-10', status: 'Overdue', daysOut: 68, daysOverdue: 38 },
      { id: 'FM-4408', customer: 'Northlake Private Equity',     amount:  48000, due: '2026-05-12', issued: '2026-04-12', status: 'Paid',    daysOut: 0,  daysOverdue: 0  },
      { id: 'FM-4407', customer: 'Harborside Technology Corp',   amount:  72000, due: '2026-06-08', issued: '2026-05-09', status: 'Sent',    daysOut: 8,  daysOverdue: 0  },
      { id: 'FM-4406', customer: 'Alderton Capital Partners',    amount: 128000, due: '2026-06-06', issued: '2026-05-07', status: 'Viewed',  daysOut: 10, daysOverdue: 0  },
      { id: 'FM-4405', customer: 'Lakewood Manufacturing',       amount:  54000, due: '2026-05-29', issued: '2026-04-29', status: 'Viewed',  daysOut: 18, daysOverdue: 0  },
      { id: 'FM-4404', customer: 'Meridian Industrial Group',    amount:  82000, due: '2026-05-08', issued: '2026-04-08', status: 'Overdue', daysOut: 39, daysOverdue: 9  },
      { id: 'FM-4403', customer: 'Summit Ridge Logistics',       amount:  44000, due: '2026-05-15', issued: '2026-04-15', status: 'Sent',    daysOut: 32, daysOverdue: 0  },
      { id: 'FM-4402', customer: 'Castlebrook Real Estate',      amount:  68000, due: '2026-06-01', issued: '2026-05-02', status: 'Sent',    daysOut: 15, daysOverdue: 0  },
      { id: 'FM-4401', customer: 'Vantage Healthcare Systems',   amount: 106000, due: '2026-04-20', issued: '2026-03-21', status: 'Overdue', daysOut: 57, daysOverdue: 27 },
      { id: 'FM-4400', customer: 'Castlebrook Real Estate',      amount:  18000, due: '2026-02-12', issued: '2026-01-13', status: 'Overdue', daysOut: 126, daysOverdue: 96  },
      { id: 'FM-4399', customer: 'Vantage Healthcare Systems',   amount:  16000, due: '2026-02-05', issued: '2026-01-06', status: 'Overdue', daysOut: 133, daysOverdue: 103 },
      { id: 'FM-4398', customer: 'Meridian Industrial Group',    amount:  15000, due: '2026-01-28', issued: '2025-12-29', status: 'Overdue', daysOut: 141, daysOverdue: 111 },
      { id: 'FM-4397', customer: 'Castlebrook Real Estate',      amount:  13000, due: '2026-01-15', issued: '2025-12-16', status: 'Overdue', daysOut: 154, daysOverdue: 124 },
    ],
    paymentBehavior: [
      { customer: 'Northlake Private Equity',   avgDays: 18, openCount: 2,  openAmount:  104200, trend: -4, riskLevel: 'low'    },
      { customer: 'Alderton Capital Partners',  avgDays: 24, openCount: 3,  openAmount:  405000, trend: -6, riskLevel: 'low'    },
      { customer: 'Harborside Technology Corp', avgDays: 27, openCount: 2,  openAmount:  160000, trend: +1, riskLevel: 'low'    },
      { customer: 'Summit Ridge Logistics',     avgDays: 31, openCount: 1,  openAmount:   44000, trend: -2, riskLevel: 'low'    },
      { customer: 'Lakewood Manufacturing',     avgDays: 38, openCount: 1,  openAmount:   54000, trend: +3, riskLevel: 'medium' },
      { customer: 'Meridian Industrial Group',  avgDays: 46, openCount: 3,  openAmount:  256400, trend: +7, riskLevel: 'medium' },
      { customer: 'Castlebrook Real Estate',    avgDays: 59, openCount: 3,  openAmount:  205000, trend: +5, riskLevel: 'high'   },
      { customer: 'Vantage Healthcare Systems', avgDays: 64, openCount: 3,  openAmount:  318000, trend: +9, riskLevel: 'high'   },
    ],
    payments: [
      { txId: 'FM-T-0921', amount: 142000, received: '2026-05-19', bank: 'JPMorgan Treasury', description: 'ALDERTON CAPITAL PARTNERS WIRE',      matchedCustomer: 'Alderton Capital Partners',    matchedInvoice: 'FM-4411', confidence: 98, status: 'Auto-Applied',   appliedAt: '2026-05-19T09:14:22', rule: 'Exact amount + name match',                              candidates: [] },
      { txId: 'FM-T-0920', amount:  98400, received: '2026-05-19', bank: 'JPMorgan Treasury', description: 'MERIDIAN INDUSTRIAL GRP PAYMENT',    matchedCustomer: 'Meridian Industrial Group',    matchedInvoice: 'FM-4417', confidence: 94, status: 'Auto-Applied',   appliedAt: '2026-05-19T08:52:11', rule: 'Amount match + fuzzy name (0.94)',                        candidates: [] },
      { txId: 'FM-T-0919', amount: 218400, received: '2026-05-18', bank: 'JPMorgan Treasury', description: 'VANTAGE HLTHCARE SYS BULK PMT',      matchedCustomer: 'Vantage Healthcare Systems',   matchedInvoice: null,      confidence: 71, status: 'Pending Review', appliedAt: null,                  rule: 'Bulk payment — matches 3 open invoices',                 candidates: ['FM-4415 ($118,000)', 'FM-4409 ($94,000)', 'FM-4401 ($106,000)'] },
      { txId: 'FM-T-0918', amount:  56200, received: '2026-05-18', bank: 'JPMorgan Treasury', description: 'NORTHLAKE PRIVATE EQUITY LLC',       matchedCustomer: 'Northlake Private Equity',     matchedInvoice: 'FM-4408', confidence: 99, status: 'Auto-Applied',   appliedAt: '2026-05-18T10:21:44', rule: 'Exact amount + name match',                              candidates: [] },
      { txId: 'FM-T-0917', amount:  88000, received: '2026-05-17', bank: 'JPMorgan Treasury', description: 'HARBORSIDE TECHNOLOGY CORP',         matchedCustomer: 'Harborside Technology Corp',   matchedInvoice: 'FM-4407', confidence: 96, status: 'Auto-Applied',   appliedAt: '2026-05-17T14:07:38', rule: 'Exact amount + name match',                              candidates: [] },
      { txId: 'FM-T-0916', amount:  62000, received: '2026-05-17', bank: 'JPMorgan Treasury', description: 'CASTLEBROOK RE LLC PARTIAL',         matchedCustomer: 'Castlebrook Real Estate',      matchedInvoice: null,      confidence: 58, status: 'Pending Review', appliedAt: null,                  rule: 'Partial payment — $62,000 vs $205,000 open',             candidates: ['FM-4416 ($74,600)', 'FM-4410 ($62,400)', 'FM-4402 ($68,000)'] },
      { txId: 'FM-T-0915', amount: 135000, received: '2026-05-16', bank: 'JPMorgan Treasury', description: 'ALDERTON CAPITAL PARTNERS',          matchedCustomer: 'Alderton Capital Partners',    matchedInvoice: 'FM-4406', confidence: 97, status: 'Auto-Applied',   appliedAt: '2026-05-16T09:33:51', rule: 'Exact amount + name match',                              candidates: [] },
      { txId: 'FM-T-0914', amount:  74600, received: '2026-05-16', bank: 'JPMorgan Treasury', description: 'CASTLEBROOK REAL EST LLC ACH',       matchedCustomer: 'Castlebrook Real Estate',      matchedInvoice: 'FM-4416', confidence: 87, status: 'Manual',         appliedAt: '2026-05-16T16:45:22', rule: 'Below 90% threshold — manually confirmed',               candidates: [] },
      { txId: 'FM-T-0913', amount:  54000, received: '2026-05-15', bank: 'JPMorgan Treasury', description: 'LAKEWOOD MANUFACTURING WIRE',        matchedCustomer: 'Lakewood Manufacturing',       matchedInvoice: 'FM-4405', confidence: 99, status: 'Auto-Applied',   appliedAt: '2026-05-15T08:19:07', rule: 'Exact amount + name match',                              candidates: [] },
      { txId: 'FM-T-0912', amount:  72000, received: '2026-05-15', bank: 'JPMorgan Treasury', description: 'HARBORSIDE TECHNOLOGY',              matchedCustomer: 'Harborside Technology Corp',   matchedInvoice: 'FM-4413', confidence: 92, status: 'Auto-Applied',   appliedAt: '2026-05-15T11:42:33', rule: 'Amount match + fuzzy name (0.92)',                        candidates: [] },
      { txId: 'FM-T-0911', amount:  76000, received: '2026-05-14', bank: 'JPMorgan Treasury', description: 'MERIDIAN INDUSTRIAL GROUP',          matchedCustomer: 'Meridian Industrial Group',    matchedInvoice: 'FM-4412', confidence: 93, status: 'Auto-Applied',   appliedAt: '2026-05-14T13:28:17', rule: 'Amount match + partial name (0.93)',                      candidates: [] },
      { txId: 'FM-T-0910', amount: 118000, received: '2026-05-14', bank: 'JPMorgan Treasury', description: 'VANTAGE HEALTHCARE SYSTEMS',         matchedCustomer: 'Vantage Healthcare Systems',   matchedInvoice: 'FM-4415', confidence: 98, status: 'Auto-Applied',   appliedAt: '2026-05-14T10:05:44', rule: 'Exact amount + name match',                              candidates: [] },
      { txId: 'FM-T-0909', amount:  82000, received: '2026-05-13', bank: 'JPMorgan Treasury', description: 'MERIDIAN INDUSTRIAL GRP WIRE',       matchedCustomer: 'Meridian Industrial Group',    matchedInvoice: 'FM-4404', confidence: 96, status: 'Auto-Applied',   appliedAt: '2026-05-13T15:11:02', rule: 'Exact amount + name match',                              candidates: [] },
      { txId: 'FM-T-0908', amount:  98000, received: '2026-05-12', bank: 'JPMorgan Treasury', description: 'VANTAGE HLTHCARE SYS WIRE',          matchedCustomer: 'Vantage Healthcare Systems',   matchedInvoice: 'FM-4401', confidence: 95, status: 'Auto-Applied',   appliedAt: '2026-05-12T09:44:58', rule: 'Exact amount + name match',                              candidates: [] },
      { txId: 'FM-T-0907', amount: 128000, received: '2026-05-11', bank: 'JPMorgan Treasury', description: 'ALDERTON CAPITAL PARTNERS PAYMENT',  matchedCustomer: 'Alderton Capital Partners',    matchedInvoice: 'FM-4418', confidence: 97, status: 'Auto-Applied',   appliedAt: '2026-05-11T08:37:19', rule: 'Exact amount + name match',                              candidates: [] },
    ],
  },
};

export function getClientData(clientId) {
  return CLIENTS[clientId] || CLIENTS.kaptain;
}
