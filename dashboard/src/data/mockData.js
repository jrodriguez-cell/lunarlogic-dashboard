const TODAY = new Date('2026-05-16');
const GO_LIVE = new Date('2026-03-17');

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const NOISE = [0.2,-0.4,0.8,-0.3,0.5,-0.7,0.3,-0.2,0.6,-0.5,0.4,-0.8,0.1,-0.3,0.7,-0.4,0.2,-0.6,0.5,-0.1];

export const dsoTrend = (() => {
  const data = [];
  for (let i = 89; i >= 0; i--) {
    const date = addDays(TODAY, -i);
    const daysFromGoLive = (new Date(date) - GO_LIVE) / 86400000;
    const noise = NOISE[(89 - i) % NOISE.length];
    let dso;
    if (daysFromGoLive < 0) {
      dso = 46.5 + noise * 1.4;
    } else {
      const decay = Math.min(daysFromGoLive / 55, 1);
      dso = 47 - decay * 19 + noise * 0.9;
    }
    data.push({ date, dso: Math.round(Math.max(dso, 25) * 10) / 10 });
  }
  return data;
})();

export const GO_LIVE_DATE = GO_LIVE.toISOString().split('T')[0];
export const currentDSO = Math.round(dsoTrend[dsoTrend.length - 1].dso);
export const preLiveDSO = Math.round(
  dsoTrend.slice(0, 30).reduce((s, d) => s + d.dso, 0) / 30
);

export const arAging = [
  { bucket: 'Current',  amount: 52400, count: 14 },
  { bucket: '1–30',     amount: 28600, count: 8  },
  { bucket: '31–60',    amount: 11200, count: 3  },
  { bucket: '61–90',    amount:  4800, count: 2  },
  { bucket: '90+',      amount:  2100, count: 1  },
];

export const invoices = [
  { id: 'INV-1042', customer: 'Kaptain Clean LLC',   amount:  4800, due: '2026-05-28', status: 'Sent',    daysOut: 18 },
  { id: 'INV-1041', customer: 'Gualapack',            amount: 12400, due: '2026-05-15', status: 'Overdue', daysOut: 31 },
  { id: 'INV-1040', customer: 'Westfield Property',   amount:  3200, due: '2026-04-14', status: 'Overdue', daysOut: 62 },
  { id: 'INV-1039', customer: 'Pedro Fernandez Mfg',  amount:  8600, due: '2026-04-27', status: 'Overdue', daysOut: 49 },
  { id: 'INV-1038', customer: 'Summit Advisory',      amount:  2200, due: '2026-05-31', status: 'Viewed',  daysOut: 15 },
  { id: 'INV-1037', customer: 'Bluestone Consulting', amount:  5600, due: '2026-05-20', status: 'Sent',    daysOut: 26 },
  { id: 'INV-1036', customer: 'Gualapack',            amount:  9400, due: '2026-05-01', status: 'Overdue', daysOut: 45 },
  { id: 'INV-1035', customer: 'Kaptain Clean LLC',    amount:  4800, due: '2026-04-27', status: 'Paid',    daysOut: 0  },
  { id: 'INV-1034', customer: 'Westfield Property',   amount:  5600, due: '2026-03-16', status: 'Overdue', daysOut: 91 },
  { id: 'INV-1033', customer: 'Pedro Fernandez Mfg',  amount:  7200, due: '2026-04-09', status: 'Overdue', daysOut: 67 },
  { id: 'INV-1032', customer: 'Summit Advisory',      amount:  2200, due: '2026-05-10', status: 'Paid',    daysOut: 0  },
  { id: 'INV-1031', customer: 'Bluestone Consulting', amount:  4400, due: '2026-06-04', status: 'Sent',    daysOut: 11 },
  { id: 'INV-1030', customer: 'Gualapack',            amount:  6800, due: '2026-06-02', status: 'Viewed',  daysOut: 13 },
  { id: 'INV-1029', customer: 'Kaptain Clean LLC',    amount:  4800, due: '2026-05-28', status: 'Viewed',  daysOut: 18 },
  { id: 'INV-1028', customer: 'Pedro Fernandez Mfg',  amount:  6300, due: '2026-05-08', status: 'Overdue', daysOut: 38 },
];

export const paymentBehavior = [
  { customer: 'Summit Advisory',      avgDays: 14, openCount: 1, openAmount:  2200 },
  { customer: 'Kaptain Clean LLC',    avgDays: 18, openCount: 2, openAmount:  9600 },
  { customer: 'Bluestone Consulting', avgDays: 22, openCount: 2, openAmount: 10000 },
  { customer: 'Gualapack',            avgDays: 31, openCount: 3, openAmount: 28600 },
  { customer: 'Pedro Fernandez Mfg',  avgDays: 52, openCount: 3, openAmount: 22100 },
  { customer: 'Westfield Property',   avgDays: 67, openCount: 2, openAmount:  8800 },
];
