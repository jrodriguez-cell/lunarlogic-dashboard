import { useState } from 'react';
import { useToast } from '../lib/toast';

const FORECAST_TODAY = '2026-05-19';

function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function suggestInvoiceNumber(invoices) {
  if (!invoices || invoices.length === 0) return 'INV-001';
  const last = invoices[invoices.length - 1];
  const match = last.id.match(/^([A-Za-z]+-?)(\d+)$/);
  if (!match) return 'INV-001';
  const prefix = match[1];
  const num = parseInt(match[2], 10) + 1;
  return `${prefix}${num}`;
}

let lineIdCounter = 1;
function makeLineItem() {
  return { id: lineIdCounter++, description: '', qty: 1, rate: '' };
}

export default function InvoiceComposer({ invoices, paymentBehavior, onClose, isLive = false, clientId }) {
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [aiText, setAiText] = useState('');
  const [drafting, setDrafting] = useState(false);
  const customers = paymentBehavior ? paymentBehavior.map(c => c.customer) : [];

  const [customer, setCustomer] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [invoiceNum, setInvoiceNum] = useState(() => suggestInvoiceNumber(invoices));
  const [issueDate, setIssueDate] = useState(FORECAST_TODAY);
  const [dueDate, setDueDate] = useState(() => addDays(FORECAST_TODAY, 30));
  const [lineItems, setLineItems] = useState([makeLineItem()]);
  const [notes, setNotes] = useState('');

  function dateDiffDays(from, to) {
    const a = new Date(from + 'T00:00:00');
    const b = new Date(to + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function handleNetQuick(days) {
    setDueDate(addDays(issueDate, days));
  }

  function handleIssueDateChange(val) {
    setIssueDate(val);
    const prevOffset = dateDiffDays(issueDate, dueDate);
    setDueDate(addDays(val, prevOffset > 0 ? prevOffset : 30));
  }

  function updateLine(id, field, value) {
    setLineItems(prev => prev.map(li =>
      li.id === id ? { ...li, [field]: value } : li
    ));
  }

  function addLine() {
    setLineItems(prev => [...prev, makeLineItem()]);
  }

  function removeLine(id) {
    setLineItems(prev => prev.length > 1 ? prev.filter(li => li.id !== id) : prev);
  }

  function lineAmount(li) {
    const q = parseFloat(li.qty) || 0;
    const r = parseFloat(li.rate) || 0;
    return q * r;
  }

  const total = lineItems.reduce((s, li) => s + lineAmount(li), 0);
  const resolvedCustomer = isNewCustomer ? newCustomerName : customer;

  // Local heuristic parse used for demo logins and as a fallback when the n8n
  // AI workflow isn't configured. Not as good as the AI — just enough to
  // populate a sensible draft from a one-line description.
  function localDraft(text) {
    const lower = text.toLowerCase();
    const matchedCustomer = customers.find(c => lower.includes(c.toLowerCase())) || null;
    const qtyMatch = text.match(/(\d+)\s*(month|hour|hr|unit|week|day|seat|licen[cs]e)s?/i);
    const amounts = [...text.matchAll(/\$\s*([\d,]+(?:\.\d{1,2})?)/g)].map(m => parseFloat(m[1].replace(/,/g, '')));
    const rateMatch = text.match(/(?:at|@)\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    let rate = '';
    if (rateMatch) rate = parseFloat(rateMatch[1].replace(/,/g, ''));
    else if (amounts.length) rate = qtyMatch ? amounts[amounts.length - 1] : amounts[0];
    const netMatch = text.match(/net\s*(\d+)/i);
    let description = text
      .replace(/\$\s*[\d,]+(?:\.\d{1,2})?/g, '')
      .replace(/\bnet\s*\d+\b/ig, '')
      .replace(/\b(at|@)\b/ig, '')
      .replace(/\s+/g, ' ').trim();
    if (matchedCustomer) description = description.replace(new RegExp(matchedCustomer, 'i'), '').replace(/\bfor\b\s*$/i, '').trim();
    description = description.replace(/^[,\-\s]+|[,\-\s]+$/g, '') || 'Professional services';
    return {
      customer: matchedCustomer,
      lines: [{ description: description.slice(0, 90), qty, rate }],
      netDays: netMatch ? parseInt(netMatch[1], 10) : null,
      __demo: true,
    };
  }

  function applyDraft(d) {
    if (!d) return;
    if (d.customer) {
      if (customers.includes(d.customer)) { setIsNewCustomer(false); setCustomer(d.customer); }
      else { setIsNewCustomer(true); setNewCustomerName(d.customer); }
    }
    if (Array.isArray(d.lines) && d.lines.length) {
      setLineItems(d.lines.map(l => ({
        id: lineIdCounter++,
        description: l.description || '',
        qty: l.qty ?? 1,
        rate: l.rate != null && l.rate !== '' ? String(l.rate) : '',
      })));
    }
    if (d.netDays) setDueDate(addDays(issueDate, d.netDays));
  }

  async function handleAiDraft() {
    const text = aiText.trim();
    if (!text) { toast('Describe the invoice first', 'error'); return; }
    setDrafting(true);
    try {
      let draft = null;
      if (isLive) {
        const resp = await fetch('/api/ai-draft-invoice', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, text }),
        });
        const json = await resp.json().catch(() => ({}));
        if (resp.ok && json.ok && json.draft) draft = json.draft;
      }
      const demo = !draft;
      if (!draft) draft = localDraft(text);
      applyDraft(draft);
      toast(demo ? 'Drafted with AI (demo) — review below' : 'Drafted with AI — review below', 'info');
    } catch {
      applyDraft(localDraft(text));
      toast('Drafted locally — review below', 'info');
    } finally {
      setDrafting(false);
    }
  }

  function invoicePayload(mode) {
    return {
      clientId, mode,
      customer: resolvedCustomer,
      docNumber: invoiceNum,
      txnDate: issueDate,
      dueDate,
      notes,
      lines: lineItems.map(li => ({ description: li.description, qty: li.qty, rate: li.rate })),
    };
  }

  async function handleSaveDraft() {
    if (!resolvedCustomer) { toast('Select or enter a customer first', 'error'); return; }

    if (!isLive) {
      toast(`Draft saved for ${resolvedCustomer} · ${invoiceNum}`, 'info');
      onClose();
      return;
    }

    setSending(true);
    try {
      const resp = await fetch('/api/create-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload('draft')),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.ok) throw new Error(json.message || json.error || `Request failed (${resp.status})`);
      toast(`Draft saved for ${resolvedCustomer}${json.via === 'n8n' ? ' via your workflow' : ''}`, 'info');
      onClose();
    } catch (e) {
      toast(`Could not save draft: ${e.message}`, 'error');
      setSending(false);
    }
  }

  async function handleSend() {
    if (!resolvedCustomer) { toast('Select or enter a customer first', 'error'); return; }
    if (total <= 0) { toast('Add at least one line item with an amount', 'error'); return; }

    // Demo clients never hit QuickBooks — just confirm locally.
    if (!isLive) {
      toast(`Invoice ${invoiceNum} sent to ${resolvedCustomer}`);
      onClose();
      return;
    }

    // Live-connected client (QB sandbox): create the invoice for real —
    // routed to the n8n workflow when configured, else straight to QuickBooks.
    setSending(true);
    try {
      const resp = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload('send')),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.ok) throw new Error(json.message || json.error || `Request failed (${resp.status})`);
      const where = json.via === 'n8n' ? 'sent to your workflow' : 'created in QuickBooks';
      toast(`Invoice ${json.docNumber ?? invoiceNum} ${where} for ${resolvedCustomer}`);
      onClose();
    } catch (e) {
      toast(`Could not create invoice: ${e.message}`, 'error');
      setSending(false);
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel composer-panel">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">New Invoice</div>
            <div className="drawer-sub">{isLive ? 'Creates a real invoice in QuickBooks' : 'Compose and send an invoice'}</div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l8 8M9 1l-8 8"/>
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {/* AI draft */}
          <div style={{ background: 'rgba(0,212,232,0.05)', border: '1px solid rgba(0,212,232,0.25)', borderRadius: 8, padding: 12, marginBottom: 18 }}>
            <label className="drawer-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Draft with AI
            </label>
            <textarea
              className="composer-input"
              rows={2}
              style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, marginBottom: 8 }}
              placeholder="Describe it in plain English — e.g. “3 months of advisory for Acme at $5,000/mo, net 30”"
              value={aiText}
              onChange={e => setAiText(e.target.value)}
            />
            <button
              onClick={handleAiDraft}
              disabled={drafting}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: drafting ? 'default' : 'pointer', border: '1px solid var(--teal)', background: 'rgba(0,212,232,0.12)', color: 'var(--teal)', opacity: drafting ? 0.6 : 1 }}
            >
              {drafting ? 'Drafting…' : 'Draft invoice'}
            </button>
            <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 10 }}>Fills the fields below — you review before sending.</span>
          </div>

          {/* Customer */}
          <div className="composer-field">
            <label className="drawer-section-title">Customer</label>
            {!isNewCustomer ? (
              <select
                className="composer-select"
                value={customer}
                onChange={e => {
                  if (e.target.value === '__new__') {
                    setIsNewCustomer(true);
                    setCustomer('');
                  } else {
                    setCustomer(e.target.value);
                  }
                }}
              >
                <option value="">Select a customer…</option>
                {customers.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__new__">+ New Customer…</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="composer-input"
                  placeholder="Enter new customer name"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  autoFocus
                />
                <button
                  className="quick-action-btn"
                  style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                  onClick={() => { setIsNewCustomer(false); setNewCustomerName(''); }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Invoice number + dates row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="composer-field" style={{ marginBottom: 0 }}>
              <label className="drawer-section-title">Invoice #</label>
              <input
                className="composer-input"
                value={invoiceNum}
                onChange={e => setInvoiceNum(e.target.value)}
              />
            </div>
            <div className="composer-field" style={{ marginBottom: 0 }}>
              <label className="drawer-section-title">Issue Date</label>
              <input
                type="date"
                className="composer-input"
                value={issueDate}
                onChange={e => handleIssueDateChange(e.target.value)}
              />
            </div>
            <div className="composer-field" style={{ marginBottom: 0 }}>
              <label className="drawer-section-title">Due Date</label>
              <input
                type="date"
                className="composer-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Net quick-select */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[
              { label: 'Net 30', days: 30 },
              { label: 'Net 45', days: 45 },
              { label: 'Net 60', days: 60 },
            ].map(({ label, days }) => {
              const active = dateDiffDays(issueDate, dueDate) === days;
              return (
                <button
                  key={label}
                  className="quick-action-btn"
                  style={active ? { borderColor: 'var(--teal)', color: 'var(--teal)', background: 'var(--teal-dim)' } : {}}
                  onClick={() => handleNetQuick(days)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Line Items */}
          <div className="composer-field">
            <label className="drawer-section-title">Line Items</label>
            <table className="line-items-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Description</th>
                  <th style={{ width: '12%' }}>Qty</th>
                  <th style={{ width: '18%' }}>Rate</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map(li => (
                  <tr key={li.id}>
                    <td>
                      <input
                        className="composer-input"
                        style={{ fontSize: 12, padding: '6px 8px' }}
                        placeholder="Description"
                        value={li.description}
                        onChange={e => updateLine(li.id, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="composer-input"
                        style={{ fontSize: 12, padding: '6px 8px', textAlign: 'right' }}
                        type="number"
                        min="0"
                        value={li.qty}
                        onChange={e => updateLine(li.id, 'qty', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="composer-input"
                        style={{ fontSize: 12, padding: '6px 8px', textAlign: 'right' }}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={li.rate}
                        onChange={e => updateLine(li.id, 'rate', e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text)', paddingRight: 4 }}>
                      {lineAmount(li) > 0
                        ? `$${lineAmount(li).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => removeLine(li.id)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--muted)',
                          cursor: lineItems.length === 1 ? 'default' : 'pointer',
                          fontSize: 14, lineHeight: 1, padding: '2px 4px', borderRadius: 4,
                          opacity: lineItems.length === 1 ? 0.3 : 1,
                          transition: 'color .15s',
                        }}
                        title="Remove line"
                        disabled={lineItems.length === 1}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M1 1l8 8M9 1l-8 8"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="add-line-btn" onClick={addLine}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 1v8M1 5h8"/>
              </svg>
              Add line
            </button>
          </div>

          {/* Notes */}
          <div className="composer-field">
            <label className="drawer-section-title">Notes</label>
            <textarea
              className="composer-input"
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              placeholder="Payment terms, project references, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Total */}
          <div className="composer-total">
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginRight: 12 }}>
              Total
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="drawer-actions">
          <button className="btn-secondary" onClick={handleSaveDraft} disabled={sending}>Save Draft</button>
          <button className="btn-primary" onClick={handleSend} disabled={sending}>
            {sending ? 'Creating…' : isLive ? 'Create in QuickBooks' : 'Send Invoice'}
          </button>
        </div>
      </div>
    </>
  );
}
