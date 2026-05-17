const TODAY = new Date('2026-05-17');

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
  },
};

export function getClientData(clientId) {
  return CLIENTS[clientId] || CLIENTS.kaptain;
}
