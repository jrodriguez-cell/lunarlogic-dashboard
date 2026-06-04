'use client';

import { useState } from 'react';
import type { Submission } from '@/types/onboarding';
import { computeROI, formatCurrency, parseRevenueToNumber, parseDSOToNumber } from '@/lib/roi';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface Props {
  submission: Submission;
  onClose: () => void;
  onUpdate: (updated: Submission) => void;
}

export function SubmissionDetail({ submission, onClose, onUpdate }: Props) {
  const [notes, setNotes] = useState(submission.adminNotes ?? '');
  const [status, setStatus] = useState<Submission['status']>(submission.status);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const revenue = parseRevenueToNumber(submission.annualRevenue);
  const dso = parseDSOToNumber(submission.currentDso);
  const roi = computeROI(revenue, dso);

  const saveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await fetch(`/api/onboard/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: notes }),
      });
      onUpdate({ ...submission, adminNotes: notes });
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const saveStatus = async (newStatus: Submission['status']) => {
    setIsSavingStatus(true);
    setStatus(newStatus);
    try {
      await fetch(`/api/onboard/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate({ ...submission, status: newStatus });
    } catch (err) {
      console.error('Failed to save status:', err);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const downloadPDF = () => {
    window.open(`/api/onboard/${submission.id}/pdf`, '_blank');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Slide-over */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl z-50 flex flex-col bg-[#0D1526] border-l border-white/10 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0D1526] z-10">
          <div>
            <h2 className="text-lg font-bold text-white">{submission.businessName}</h2>
            <p className="text-gray-400 text-sm">{submission.ownerName} · {submission.ownerEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* ROI Box */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Projected Year 1 Value</p>
            <p className="text-3xl font-black text-emerald-400">{formatCurrency(roi.totalYear1)}</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-gray-500 text-xs">DSO: {roi.currentDSO}d → {roi.targetDSO}d</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Capital: {formatCurrency(roi.wcReleased)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">ROI: {roi.roi}x</p>
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => saveStatus(e.target.value as Submission['status'])}
              disabled={isSavingStatus}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="new" className="bg-[#0A0F1E]">New</option>
              <option value="reviewed" className="bg-[#0A0F1E]">Reviewed</option>
              <option value="proposal_sent" className="bg-[#0A0F1E]">Proposal Sent</option>
              <option value="active" className="bg-[#0A0F1E]">Active</option>
            </select>
            <button
              onClick={downloadPDF}
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate PDF
            </button>
            <span className="text-gray-500 text-xs">
              {format(new Date(submission.createdAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>

          {/* Flags */}
          {(submission.nearlyMissedPayroll || submission.qbCurrentState?.toLowerCase().includes('cleanup')) && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
              {submission.nearlyMissedPayroll && (
                <p className="text-amber-300 text-sm font-semibold">🔴 Nearly missed payroll — high urgency close</p>
              )}
              {submission.qbCurrentState?.toLowerCase().includes('cleanup') && (
                <p className="text-amber-300 text-sm">⚠️ QB needs cleanup — may affect go-live timeline</p>
              )}
            </div>
          )}

          {/* Step 1: Business */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Business Info</h3>
            <div className="space-y-2">
              {[
                ['Business', submission.businessName],
                ['Owner', submission.ownerName],
                ['Email', submission.ownerEmail],
                ['Phone', submission.ownerPhone ?? '—'],
                ['Revenue', submission.annualRevenue],
                ['Industry', submission.industry + (submission.industryOther ? ` — ${submission.industryOther}` : '')],
                ['Employees', submission.employeeCount ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Step 2: QuickBooks */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">QuickBooks</h3>
            <div className="space-y-2">
              {[
                ['Version', submission.qbVersion + (submission.qbDesktopVersion ? ` (${submission.qbDesktopVersion})` : '')],
                ['Manager', submission.qbManager],
                ['State', submission.qbCurrentState],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Step 3+4: AR & Volume */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">AR Workflow & Volume</h3>
            <div className="space-y-2">
              {[
                ['Invoice Creation', submission.invoiceCreation],
                ['Invoice Delivery', submission.invoiceDelivery],
                ['Follow-up Process', submission.followupProcess],
                ['Follow-up Frequency', submission.followupFrequency],
                ['Monthly Invoices', submission.monthlyInvoiceCount],
                ['Avg Invoice Size', submission.avgInvoiceSize],
                ['Payment Terms', submission.paymentTerms],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white text-right max-w-xs">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Pain Point */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Pain Point</h3>
            <blockquote className="border-l-2 border-indigo-500 pl-4 text-gray-300 text-sm italic leading-relaxed">
              {submission.biggestArPain}
            </blockquote>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {submission.biggestPainCategory.map((c) => (
                <Badge key={c} variant="indigo">{c}</Badge>
              ))}
            </div>
            {submission.biggestSlowPayer && (
              <p className="text-gray-400 text-sm mt-2">Slowest payer type: {submission.biggestSlowPayer}</p>
            )}
          </section>

          {/* Integrations */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Integrations</h3>
            <div className="flex flex-wrap gap-2">
              {submission.usesSlack && <Badge variant="success">Slack</Badge>}
              {submission.usesStripe && <Badge variant="success">Stripe</Badge>}
              {submission.usesGoogleSheets && <Badge variant="success">Google Sheets</Badge>}
              {submission.usesQBPayments && <Badge variant="success">QB Payments</Badge>}
              {submission.usesEmail && <Badge variant="success">Email</Badge>}
              {submission.usesOther && <Badge variant="muted">{submission.usesOther}</Badge>}
            </div>
          </section>

          {/* Modules */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Selected Modules</h3>
            <div className="flex gap-2 flex-wrap">
              {submission.modulesSelected.map((m) => (
                <Badge key={m} variant="indigo">{m}</Badge>
              ))}
            </div>
            {submission.targetStartDate && (
              <p className="text-gray-400 text-sm mt-2">Target start: {submission.targetStartDate}</p>
            )}
            {submission.additionalNotes && (
              <p className="text-gray-300 text-sm mt-2 italic">{submission.additionalNotes}</p>
            )}
          </section>

          {/* Admin Notes */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Admin Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Internal notes (auto-saved on blur)..."
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
            {isSavingNotes && <p className="text-gray-500 text-xs mt-1">Saving...</p>}
          </section>
        </div>
      </div>
    </>
  );
}
