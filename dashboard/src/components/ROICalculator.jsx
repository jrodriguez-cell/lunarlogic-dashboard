import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

/* ── Demo defaults ───────────────────────────────────────────── */
const DEMO = {
  annualRevenue:  2500000,
  monthlyInvoices: 42,
  vertical:       'Commercial Cleaning',
  currentDso:     48,
  paymentTerms:   'Net 30',
  badDebtPct:     1.5,
  unbilledPct:    2.0,
  hoursPerWeek:   6,
  hourlyRate:     65,
  followUpProcess:'Manual email / phone',
  clientTypes:    ['SMB (1–50 employees)'],
};

const VERTICALS = [
  'Commercial Cleaning', 'HVAC', 'Landscaping', 'Staffing Agency',
  'Marketing Agency', 'IT / MSP', 'Consulting', 'Other',
];

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60'];

const FOLLOW_UP = [
  'No formal process', 'Manual email / phone', 'Shared spreadsheet', 'Accounting software reminders',
];

const CLIENT_TYPES = [
  'SMB (1–50 employees)', 'Mid-market (51–500)', 'Enterprise (500+)', 'Government / Nonprofit',
];

const INDUSTRY = {
  dso:       52,
  badDebt:   2.1,
  unbilled:  2.8,
  hours:     7.5,
};

/* ── Calculation logic ───────────────────────────────────────── */
function calcROI(f) {
  const targetDso     = Math.max(18, Math.round(f.currentDso * 0.55));
  const wcBefore      = (f.currentDso / 365) * f.annualRevenue;
  const wcAfter       = (targetDso   / 365) * f.annualRevenue;
  const wcGain        = wcBefore - wcAfter;
  const bdSavings     = f.annualRevenue * (f.badDebtPct  / 100) * 0.70;
  const ubRecovered   = f.annualRevenue * (f.unbilledPct / 100) * 0.85;
  const laborSaved    = f.hoursPerWeek * 52 * f.hourlyRate * 0.80;
  const monthlyInv    = Math.max(500, Math.min(1500, Math.round(f.annualRevenue / 2000 / 100) * 100));
  const llAnnualCost  = monthlyInv * 12;
  const totalValue    = wcGain + bdSavings + ubRecovered + laborSaved;
  const roiMultiple   = Math.round(totalValue / llAnnualCost);
  const paybackMonths = Math.ceil(llAnnualCost / (totalValue / 12));
  return {
    targetDso, wcBefore, wcAfter, wcGain,
    bdSavings, ubRecovered, laborSaved,
    monthlyInv, llAnnualCost, totalValue,
    roiMultiple, paybackMonths,
    hoursSaved: Math.round(f.hoursPerWeek * 52 * 0.80),
  };
}

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt$  = (n) => '$' + Math.round(n).toLocaleString();
const fmtK  = (n) => n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'k' : fmt$(n);

function Slider({ label, value, min, max, step = 1, format, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="roi-field">
      <div className="roi-field-header">
        <span className="roi-field-label">{label}</span>
        <span className="roi-field-value">{format ? format(value) : value}</span>
      </div>
      <div className="roi-slider-wrap">
        <input
          type="range"
          className="roi-slider"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ '--pct': pct + '%' }}
        />
      </div>
      <div className="roi-slider-range">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

function Pills({ label, options, value, onChange, multi = false }) {
  function toggle(opt) {
    if (multi) {
      onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    } else {
      onChange(opt);
    }
  }
  const isActive = (opt) => multi ? value.includes(opt) : value === opt;
  return (
    <div className="roi-field">
      <div className="roi-field-label" style={{ marginBottom: 10 }}>{label}</div>
      <div className="roi-pills">
        {options.map(opt => (
          <button
            key={opt}
            className={`roi-pill${isActive(opt) ? ' active' : ''}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Steps ───────────────────────────────────────────────────── */
function Step1({ f, set }) {
  return (
    <div className="roi-step-body">
      <Slider
        label="Annual Revenue"
        value={f.annualRevenue}
        min={500000} max={10000000} step={50000}
        format={v => fmtK(v)}
        onChange={v => set('annualRevenue', v)}
      />
      <Slider
        label="Monthly Invoice Volume"
        value={f.monthlyInvoices}
        min={10} max={500} step={5}
        format={v => v + ' invoices'}
        onChange={v => set('monthlyInvoices', v)}
      />
      <Pills
        label="Industry Vertical"
        options={VERTICALS}
        value={f.vertical}
        onChange={v => set('vertical', v)}
      />
    </div>
  );
}

function Step2({ f, set }) {
  return (
    <div className="roi-step-body">
      <Slider
        label="Current DSO (Days Sales Outstanding)"
        value={f.currentDso}
        min={15} max={120} step={1}
        format={v => v + ' days'}
        onChange={v => set('currentDso', v)}
      />
      <Pills
        label="Standard Payment Terms"
        options={PAYMENT_TERMS}
        value={f.paymentTerms}
        onChange={v => set('paymentTerms', v)}
      />
      <Slider
        label="Bad Debt Rate"
        value={f.badDebtPct}
        min={0} max={5} step={0.1}
        format={v => v.toFixed(1) + '%'}
        onChange={v => set('badDebtPct', v)}
      />
      <Slider
        label="Unbilled Revenue Estimate"
        value={f.unbilledPct}
        min={0} max={5} step={0.1}
        format={v => v.toFixed(1) + '% of revenue'}
        onChange={v => set('unbilledPct', v)}
      />
    </div>
  );
}

function Step3({ f, set }) {
  return (
    <div className="roi-step-body">
      <Slider
        label="Hours / Week on AR Tasks"
        value={f.hoursPerWeek}
        min={1} max={25} step={0.5}
        format={v => v + ' hrs/wk'}
        onChange={v => set('hoursPerWeek', v)}
      />
      <Slider
        label="Blended Hourly Rate"
        value={f.hourlyRate}
        min={20} max={200} step={5}
        format={v => '$' + v + '/hr'}
        onChange={v => set('hourlyRate', v)}
      />
      <Pills
        label="Current Follow-Up Process"
        options={FOLLOW_UP}
        value={f.followUpProcess}
        onChange={v => set('followUpProcess', v)}
      />
      <Pills
        label="Primary Client Types (select all that apply)"
        options={CLIENT_TYPES}
        value={f.clientTypes}
        onChange={v => set('clientTypes', v)}
        multi
      />
    </div>
  );
}

/* ── Custom tooltip ──────────────────────────────────────────── */
function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{payload[0].payload.name}</div>
      <div className="tooltip-row"><span>{fmt$(payload[0].value)}</span></div>
    </div>
  );
}

/* ── Compare row ─────────────────────────────────────────────── */
function CompareRow({ label, yours, industry, unit = '', higherIsBetter = false }) {
  const yoursWin = higherIsBetter ? yours >= industry : yours <= industry;
  return (
    <div className="roi-compare-row">
      <div className="roi-compare-label">{label}</div>
      <div className="roi-compare-vals">
        <div className={`roi-compare-val ${yoursWin ? 'good' : 'warn'}`}>
          {typeof yours === 'number' && yours % 1 !== 0 ? yours.toFixed(1) : yours}{unit}
          <span className="roi-compare-tag">You (after)</span>
        </div>
        <div className="roi-compare-sep">vs</div>
        <div className="roi-compare-val muted">
          {typeof industry === 'number' && industry % 1 !== 0 ? industry.toFixed(1) : industry}{unit}
          <span className="roi-compare-tag">Industry avg</span>
        </div>
      </div>
    </div>
  );
}

/* ── Results step ────────────────────────────────────────────── */
function Step4({ f, res }) {
  const barData = [
    { name: 'Working Capital', value: Math.round(res.wcGain),      color: '#2563EB' },
    { name: 'Bad Debt Savings', value: Math.round(res.bdSavings),  color: '#10B981' },
    { name: 'Unbilled Recovery', value: Math.round(res.ubRecovered), color: '#F59E0B' },
    { name: 'Labor Savings',    value: Math.round(res.laborSaved), color: '#00d4e8' },
  ];

  function handlePrint() {
    window.print();
  }

  return (
    <div className="roi-results roi-print-results">
      {/* Hero */}
      <div className="roi-hero-card">
        <div className="roi-hero-label">Total Year-1 Value</div>
        <div className="roi-hero-number">{fmtK(res.totalValue)}</div>
        <div className="roi-hero-sub">
          {res.roiMultiple}× ROI · {fmt$(res.monthlyInv)}/mo investment · {res.paybackMonths}-month payback
        </div>
        <div className="roi-hero-ctas roi-no-print">
          <a
            className="btn-primary roi-cta-btn"
            href="https://calendly.com/jrodriguez-lunarlogic/30min"
            target="_blank"
            rel="noreferrer"
          >
            Schedule Demo
          </a>
          <button className="btn-secondary roi-cta-btn" onClick={handlePrint}>
            Print / Export Results
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="roi-metrics-grid">
        <div className="card">
          <div className="roi-metric-label">DSO Before → After</div>
          <div className="roi-metric-value">
            <span style={{ color: 'var(--red)' }}>{f.currentDso}d</span>
            <span className="roi-metric-arrow"> → </span>
            <span style={{ color: 'var(--green)' }}>{res.targetDso}d</span>
          </div>
          <div className="roi-metric-sub">{f.currentDso - res.targetDso} days faster</div>
        </div>
        <div className="card">
          <div className="roi-metric-label">Working Capital Released</div>
          <div className="roi-metric-value" style={{ color: 'var(--teal)' }}>{fmtK(res.wcGain)}</div>
          <div className="roi-metric-sub">cash unlocked from AR</div>
        </div>
        <div className="card">
          <div className="roi-metric-label">Bad Debt Rate</div>
          <div className="roi-metric-value">
            <span style={{ color: 'var(--red)' }}>{f.badDebtPct.toFixed(1)}%</span>
            <span className="roi-metric-arrow"> → </span>
            <span style={{ color: 'var(--green)' }}>{(f.badDebtPct * 0.3).toFixed(1)}%</span>
          </div>
          <div className="roi-metric-sub">{fmt$(res.bdSavings)} saved annually</div>
        </div>
        <div className="card">
          <div className="roi-metric-label">Hours Saved / Year</div>
          <div className="roi-metric-value" style={{ color: 'var(--green)' }}>{res.hoursSaved}</div>
          <div className="roi-metric-sub">{fmt$(res.laborSaved)} labor value</div>
        </div>
      </div>

      {/* Value breakdown chart */}
      <div className="card">
        <div className="card-header"><h2>Value Breakdown</h2></div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 60, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#5a7a9e', fontSize: 11 }} tickFormatter={v => fmtK(v)} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#5a7a9e', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Industry comparison */}
      <div className="card">
        <div className="card-header"><h2>Your Numbers vs. Industry Average</h2></div>
        <div className="roi-compare-list">
          <CompareRow label="Days Sales Outstanding" yours={res.targetDso}  industry={INDUSTRY.dso}     unit=" days" />
          <CompareRow label="Bad Debt Rate"           yours={f.badDebtPct * 0.3} industry={INDUSTRY.badDebt}  unit="%" />
          <CompareRow label="Unbilled Revenue"        yours={f.unbilledPct * 0.15} industry={INDUSTRY.unbilled} unit="%" />
          <CompareRow label="Collections hrs / week"  yours={f.hoursPerWeek * 0.20} industry={INDUSTRY.hours}   unit=" hrs" />
        </div>
      </div>

      {/* What happens next */}
      <div className="card">
        <div className="card-header"><h2>What Happens Next</h2></div>
        <div className="roi-next-steps">
          {[
            { n: 1, title: 'Schedule a 30-min discovery call', sub: 'We walk through your current AR process and confirm fit.' },
            { n: 2, title: 'Live QuickBooks AR audit', sub: 'We run a real-data audit with your QB account — no sandbox.' },
            { n: 3, title: 'Custom implementation plan', sub: 'A written plan scoped to your workflows, volume, and team.' },
            { n: 4, title: 'Full deployment in 2–4 weeks', sub: 'From kickoff to production — usually under a month.' },
          ].map(({ n, title, sub }) => (
            <div key={n} className="roi-next-step">
              <div className="roi-next-step-num">{n}</div>
              <div>
                <div className="roi-next-step-title">{title}</div>
                <div className="roi-next-step-sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>
        <a
          className="btn-primary roi-cta-btn roi-no-print"
          href="https://calendly.com/jrodriguez-lunarlogic/30min"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none', textAlign: 'center' }}
        >
          Schedule Discovery Call →
        </a>
      </div>
    </div>
  );
}

/* ── Progress bar ────────────────────────────────────────────── */
function Progress({ step }) {
  const steps = ['Business Info', 'AR Health', 'Operations', 'Results'];
  return (
    <div className="roi-progress roi-no-print">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done    = idx < step;
        const current = idx === step;
        return (
          <div key={idx} className={`roi-progress-item${done ? ' done' : current ? ' current' : ''}`}>
            <div className="roi-progress-dot">{done ? '✓' : idx}</div>
            <div className="roi-progress-label">{label}</div>
            {i < steps.length - 1 && <div className="roi-progress-line" />}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function ROICalculator() {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ ...DEMO });

  function set(key, val) {
    setF(prev => ({ ...prev, [key]: val }));
  }

  function loadDemo() {
    setF({ ...DEMO });
    setStep(1);
  }

  const res = calcROI(f);

  const STEP_TITLES = [
    null,
    { title: 'Tell us about your business', sub: 'Step 1 of 4 — Business Info' },
    { title: 'How is your AR performing today?', sub: 'Step 2 of 4 — AR Health' },
    { title: 'How much time goes into collections?', sub: 'Step 3 of 4 — Operations' },
    { title: 'Your personalised ROI estimate', sub: 'Step 4 of 4 — Results' },
  ];

  const { title, sub } = STEP_TITLES[step];

  return (
    <div className="roi-wrap">
      {/* Header */}
      <div className="roi-header roi-no-print">
        <div>
          <div className="roi-header-title">{title}</div>
          <div className="roi-header-sub">{sub}</div>
        </div>
        <button className="btn-secondary roi-demo-btn" onClick={loadDemo}>
          Load Demo Data
        </button>
      </div>

      <Progress step={step} />

      {/* Step content */}
      <div className="roi-card">
        {step === 1 && <Step1 f={f} set={set} />}
        {step === 2 && <Step2 f={f} set={set} />}
        {step === 3 && <Step3 f={f} set={set} />}
        {step === 4 && <Step4 f={f} res={res} />}
      </div>

      {/* Nav buttons */}
      <div className="roi-nav roi-no-print">
        {step > 1 && (
          <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
            ← Back
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 && (
          <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
            {step === 3 ? 'Calculate ROI →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
