// Reminder-cadence engine. Each customer follows a cadence — an ordered list
// of steps (day offset relative to due date + channel + who owns it). The
// platform suggests a cadence from payment history; the client can override it
// per customer since they know the relationship. Config is persisted per
// client in localStorage (demo-first; live setups would sync via n8n).

export const CADENCE_TEAM = ['Jonathan Rodriguez', 'Sarah M. (Admin)', 'Unassigned'];

export const CHANNELS = {
  email: { label: 'Email', color: '#00d4e8' },
  call:  { label: 'Call',  color: '#a78bfa' },
  text:  { label: 'Text',  color: '#f59e0b' },
};

export const TEMPLATES = {
  gentle: {
    name: 'Gentle', desc: 'Soft, email-only — for reliable payers',
    steps: [
      { offset: 2,  channel: 'email', label: 'Friendly reminder' },
      { offset: 10, channel: 'email', label: 'Second reminder' },
      { offset: 21, channel: 'email', label: 'Follow-up' },
    ],
  },
  standard: {
    name: 'Standard', desc: 'Balanced escalation across channels',
    steps: [
      { offset: -7, channel: 'email', label: 'Heads-up' },
      { offset: 1,  channel: 'email', label: 'Payment due' },
      { offset: 7,  channel: 'email', label: 'First follow-up' },
      { offset: 14, channel: 'call',  label: 'Follow-up call' },
      { offset: 21, channel: 'email', label: 'Firm reminder' },
      { offset: 28, channel: 'text',  label: 'Final notice' },
    ],
  },
  assertive: {
    name: 'Assertive', desc: 'Frequent, multi-channel — for slow / at-risk payers',
    steps: [
      { offset: -3, channel: 'email', label: 'Pre-due notice' },
      { offset: 1,  channel: 'email', label: 'Due today' },
      { offset: 3,  channel: 'text',  label: 'Quick nudge' },
      { offset: 7,  channel: 'call',  label: 'Follow-up call' },
      { offset: 12, channel: 'email', label: 'Firm reminder' },
      { offset: 18, channel: 'call',  label: 'Escalation call' },
      { offset: 25, channel: 'text',  label: 'Final notice' },
    ],
  },
  vip: {
    name: 'VIP', desc: 'Light touch — for key accounts',
    steps: [
      { offset: 3,  channel: 'email', label: 'Courtesy reminder' },
      { offset: 14, channel: 'call',  label: 'Personal check-in' },
    ],
  },
};

// Suggest a cadence template from the payment-health score / risk.
export function suggestTemplate(pb, score) {
  if (score == null) return 'standard';
  if (score >= 78) return 'gentle';
  if (score < 45 || pb?.riskLevel === 'high') return 'assertive';
  return 'standard';
}

const key = cid => `ll_cadences_${cid || 'demo'}`;

export function getCadenceConfig(cid) {
  try { return JSON.parse(localStorage.getItem(key(cid))) || {}; }
  catch { return {}; }
}

export function setCustomerCadence(cid, customer, config) {
  const all = getCadenceConfig(cid);
  all[customer] = config;
  try { localStorage.setItem(key(cid), JSON.stringify(all)); } catch { /* private mode */ }
  return all;
}

export function clearCustomerCadence(cid, customer) {
  const all = getCadenceConfig(cid);
  delete all[customer];
  try { localStorage.setItem(key(cid), JSON.stringify(all)); } catch { /* noop */ }
  return all;
}

// The cadence actually in effect for a customer: their saved override, or the
// suggested template if they haven't customized it.
export function effectiveCadence(cid, customer, suggested) {
  const cfg = getCadenceConfig(cid)[customer];
  if (cfg?.steps) {
    return { templateId: cfg.templateId || 'custom', name: cfg.name || 'Custom', steps: cfg.steps, assignee: cfg.assignee || 'Unassigned', escalationAssignee: cfg.escalationAssignee || 'Unassigned', custom: true };
  }
  const t = TEMPLATES[suggested] || TEMPLATES.standard;
  return { templateId: suggested, name: t.name, steps: t.steps, assignee: 'Unassigned', escalationAssignee: 'Unassigned', custom: false };
}
