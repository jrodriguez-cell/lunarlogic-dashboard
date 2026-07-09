import { useState } from 'react';
import { useToast } from '../../lib/toast';
import { customerScore, scoreBand } from '../../lib/scoring';
import {
  TEMPLATES, CHANNELS, CADENCE_TEAM, suggestTemplate,
  getCadenceConfig, setCustomerCadence, clearCustomerCadence, effectiveCadence,
} from '../../lib/cadences';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function ChannelChip({ ch }) {
  const c = CHANNELS[ch];
  if (!c) return null;
  return <span style={{ fontSize: 9, fontWeight: 700, color: c.color, background: `${c.color}18`, borderRadius: 5, padding: '1px 6px' }}>{c.label}</span>;
}

export default function ClientSettings({ data, clientId, isMobile }) {
  const toast = useToast();
  const [config, setConfig] = useState(() => getCadenceConfig(clientId));
  const [editing, setEditing] = useState(null); // customer name

  const pbList = data.paymentBehavior ?? [];
  const openByCustomer = {};
  data.invoices.filter(i => i.status !== 'Paid').forEach(i => { (openByCustomer[i.customer] ||= []).push(i); });

  function stepIndex(customer, stepsLen) {
    const invs = openByCustomer[customer] || [];
    if (!invs.length) return 0;
    const worst = invs.reduce((a, b) => (b.daysOverdue > a.daysOverdue ? b : a));
    return Math.min(worst.reminders?.length ?? 0, stepsLen);
  }

  const rows = pbList.map(pb => {
    const score = customerScore(pb);
    const suggested = suggestTemplate(pb, score);
    const eff = effectiveCadence(clientId, pb.customer, suggested);
    return { pb, score, suggested, eff };
  });

  function applySuggestion(customer, suggested) {
    const t = TEMPLATES[suggested];
    setCustomerCadence(clientId, customer, { templateId: suggested, name: t.name, steps: t.steps, assignee: 'Unassigned', escalationAssignee: CADENCE_TEAM[0] });
    setConfig(getCadenceConfig(clientId));
    toast(`${t.name} cadence applied to ${customer}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Reminder cadences</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.5, maxWidth: 680 }}>
          Configure how LunarLogic chases each customer. We suggest a cadence from their payment history — you have the relationship, so override the channels, timing, and owner however you see fit. Every email reminder includes a one-click pay link. When a cadence is exhausted, LunarLogic opens a task for the assigned owner.
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)' }}>
          <span>✓ Pay link in every email</span>
          <span>✓ Auto-pauses when paid</span>
          <span>✓ Escalation task on exhaustion</span>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>Cadence by customer</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.map(({ pb, score, suggested, eff }) => {
            const band = scoreBand(score);
            const chans = [...new Set(eff.steps.map(s => s.channel))];
            const idx = stepIndex(pb.customer, eff.steps.length);
            return (
              <div key={pb.customer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{pb.customer}</span>
                    {score != null && <span style={{ fontSize: 9.5, color: band.color }}>{score} · {band.label}</span>}
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>· {fmtM(pb.openAmount)} open</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.1)', borderRadius: 5, padding: '2px 8px' }}>{eff.name}{eff.custom ? '' : ' · suggested'}</span>
                    {chans.map(c => <ChannelChip key={c} ch={c} />)}
                  </div>
                </div>
                {/* Step graphic */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} title={`Step ${idx} of ${eff.steps.length}`}>
                  {eff.steps.map((s, i) => (
                    <div key={i} title={`${s.offset > 0 ? '+' : ''}${s.offset}d · ${CHANNELS[s.channel].label} · ${s.label}`}
                      style={{ width: 9, height: 9, borderRadius: '50%', background: i < idx ? CHANNELS[s.channel].color : 'transparent', border: i < idx ? 'none' : `1.5px solid var(--border)` }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {suggested !== eff.templateId && (
                    <button onClick={() => applySuggestion(pb.customer, suggested)} title={`AI suggests the ${TEMPLATES[suggested].name} cadence`}
                      style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--teal)', background: 'none', border: '1px solid var(--teal)', borderRadius: 6, padding: '5px 9px', cursor: 'pointer' }}>
                      Apply {TEMPLATES[suggested].name}
                    </button>
                  )}
                  <button onClick={() => setEditing(pb.customer)} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <CadenceEditor
          customer={editing}
          clientId={clientId}
          suggested={rows.find(r => r.pb.customer === editing)?.suggested ?? 'standard'}
          isMobile={isMobile}
          onClose={() => setEditing(null)}
          onSaved={() => { setConfig(getCadenceConfig(clientId)); setEditing(null); }}
          toast={toast}
        />
      )}
      {/* config state referenced to force re-render after saves */}
      <span style={{ display: 'none' }}>{Object.keys(config).length}</span>
    </div>
  );
}

function CadenceEditor({ customer, clientId, suggested, isMobile, onClose, onSaved, toast }) {
  const start = effectiveCadence(clientId, customer, suggested);
  const [templateId, setTemplateId] = useState(start.templateId);
  const [steps, setSteps] = useState(start.steps.map(s => ({ ...s })));
  const [escalation, setEscalation] = useState(start.escalationAssignee);

  function loadTemplate(id) {
    setTemplateId(id);
    if (TEMPLATES[id]) setSteps(TEMPLATES[id].steps.map(s => ({ ...s, assignee: 'Unassigned' })));
  }
  function updateStep(i, patch) { setSteps(s => s.map((st, j) => (j === i ? { ...st, ...patch } : st))); }
  function removeStep(i) { setSteps(s => s.filter((_, j) => j !== i)); setTemplateId('custom'); }
  function addStep() { setSteps(s => [...s, { offset: (s[s.length - 1]?.offset ?? 0) + 7, channel: 'email', label: 'Reminder', assignee: 'Unassigned' }]); setTemplateId('custom'); }

  function save() {
    const sorted = [...steps].sort((a, b) => a.offset - b.offset);
    setCustomerCadence(clientId, customer, {
      templateId: templateId === 'custom' ? 'custom' : templateId,
      name: templateId === 'custom' ? 'Custom' : TEMPLATES[templateId].name,
      steps: sorted, escalationAssignee: escalation,
    });
    toast(`Cadence saved for ${customer}`);
    onSaved();
  }
  function reset() {
    clearCustomerCadence(clientId, customer);
    toast(`Reset ${customer} to the suggested cadence`);
    onSaved();
  }

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 7px', fontSize: 12, color: 'var(--text)', outline: 'none' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(620px, calc(100vw - 24px))', maxHeight: '86vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, zIndex: 1101, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Edit cadence — {customer}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Start from a template, then adjust timing, channel, and owner per step.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {/* Template selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(TEMPLATES).map(([id, t]) => (
            <button key={id} onClick={() => loadTemplate(id)} title={t.desc}
              style={{ fontSize: 11, fontWeight: 700, borderRadius: 7, padding: '6px 11px', cursor: 'pointer',
                border: `1px solid ${templateId === id ? 'var(--teal)' : 'var(--border)'}`,
                background: templateId === id ? 'rgba(0,212,232,0.1)' : 'none',
                color: templateId === id ? 'var(--teal)' : 'var(--muted)' }}>
              {t.name}{id === suggested ? ' ★' : ''}
            </button>
          ))}
          <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 7, padding: '6px 11px', border: `1px solid ${templateId === 'custom' ? 'var(--teal)' : 'var(--border)'}`, color: templateId === 'custom' ? 'var(--teal)' : 'var(--muted)' }}>Custom</span>
        </div>

        {/* Steps */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Steps (days relative to due date)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
              <input type="number" value={s.offset} onChange={e => updateStep(i, { offset: Number(e.target.value) })} style={{ ...inputStyle, width: 56 }} title="Day offset" />
              <div style={{ display: 'flex', gap: 3 }}>
                {Object.entries(CHANNELS).map(([id, c]) => (
                  <button key={id} onClick={() => updateStep(i, { channel: id })}
                    style={{ fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '4px 8px', cursor: 'pointer',
                      border: `1px solid ${s.channel === id ? c.color : 'var(--border)'}`,
                      background: s.channel === id ? `${c.color}18` : 'none',
                      color: s.channel === id ? c.color : 'var(--muted)' }}>{c.label}</button>
                ))}
              </div>
              <input value={s.label} onChange={e => updateStep(i, { label: e.target.value })} placeholder="Step label" style={{ ...inputStyle, flex: 1, minWidth: 100 }} />
              <select value={s.assignee || 'Unassigned'} onChange={e => updateStep(i, { assignee: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }} title="Owner">
                {CADENCE_TEAM.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => removeStep(i)} title="Remove step" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 15 }}>×</button>
            </div>
          ))}
        </div>
        <button onClick={addStep} style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: 'var(--teal)', background: 'none', border: '1px dashed var(--teal)', borderRadius: 7, padding: '7px 12px', cursor: 'pointer', width: '100%' }}>+ Add step</button>

        {/* Escalation */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>When the cadence is exhausted</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Open a follow-up task for</span>
            <select value={escalation} onChange={e => setEscalation(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {CADENCE_TEAM.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'space-between' }}>
          <button onClick={reset} style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>Reset to suggested</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} disabled={steps.length === 0} style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', background: 'rgba(0,212,232,0.12)', border: '1px solid var(--teal)', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', opacity: steps.length === 0 ? 0.5 : 1 }}>Save cadence</button>
          </div>
        </div>
        {isMobile && <div style={{ height: 8 }} />}
      </div>
    </>
  );
}
