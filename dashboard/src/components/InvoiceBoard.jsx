import { useState } from 'react';
import { getAgingBucket } from '../data/mockData';

const STATUS_COLOR = {
  Paid:    '#22c55e',
  Sent:    '#00d4e8',
  Viewed:  '#f59e0b',
  Overdue: '#ef4444',
};

const TABS = ['All', 'Overdue', 'Sent', 'Viewed', 'Paid'];

function fmtDue(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function InvoiceBoard({ invoices, filterBucket, onClearBucket, onOpenInvoice }) {
  const [tab, setTab] = useState('All');

  const bucketFiltered = filterBucket
    ? invoices.filter(inv => getAgingBucket(inv.daysOverdue) === filterBucket)
    : invoices;

  const displayed = tab === 'All'
    ? bucketFiltered
    : bucketFiltered.filter(inv => inv.status === tab);

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? invoices.length : invoices.filter(inv => inv.status === t).length;
    return acc;
  }, {});

  return (
    <div className="card">
      <div className="card-header">
        <h2>Invoice Status</h2>
      </div>

      <div className="status-tabs">
        {TABS.map(t => (
          <button key={t} className={`status-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
            <span className="tab-count">{counts[t]}</span>
          </button>
        ))}
      </div>

      {filterBucket && (
        <div className="filter-banner">
          <span className="filter-banner-text">Filtered: {filterBucket} aging bucket</span>
          <button className="filter-banner-clear" onClick={onClearBucket}>Clear ×</button>
        </div>
      )}

      <div className="invoice-list">
        {displayed.length === 0 ? (
          <div className="empty-state">No invoices in this filter</div>
        ) : (
          displayed.map(inv => (
            <div key={inv.id} className="invoice-row" onClick={() => onOpenInvoice(inv)}>
              <div className="invoice-left">
                <span className="invoice-id">{inv.id}</span>
                <span className="invoice-customer">{inv.customer}</span>
                <span className="invoice-due">Due {fmtDue(inv.due)}</span>
              </div>
              <div className="invoice-right">
                <span className="invoice-amount">${inv.amount.toLocaleString()}</span>
                <span
                  className="invoice-status"
                  style={{ color: STATUS_COLOR[inv.status], borderColor: STATUS_COLOR[inv.status] }}
                >
                  {inv.status}
                </span>
                <span className={`invoice-days${inv.daysOverdue > 0 ? ' warn' : ''}`}>
                  {inv.status === 'Paid' ? '—' : inv.daysOverdue > 0 ? `${inv.daysOverdue}d over` : `${inv.daysOut}d out`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
