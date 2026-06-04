'use client';

import { useState } from 'react';
import type { Submission } from '@/types/onboarding';
import { formatCurrency } from '@/lib/roi';
import { Badge } from '@/components/ui/badge';
import { SubmissionDetail } from './SubmissionDetail';
import { format } from 'date-fns';

interface Props {
  submissions: Submission[];
}

const statusConfig: Record<Submission['status'], { label: string; variant: 'default' | 'success' | 'warn' | 'muted' | 'indigo' }> = {
  new: { label: 'New', variant: 'warn' },
  reviewed: { label: 'Reviewed', variant: 'indigo' },
  proposal_sent: { label: 'Proposal Sent', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
};

export function SubmissionsTable({ submissions: initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = submissions.filter((s) => {
    const matchesSearch =
      search === '' ||
      s.businessName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedSubmission = selectedId ? submissions.find((s) => s.id === selectedId) ?? null : null;

  const handleUpdate = (updated: Submission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by business, owner, or industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all" className="bg-[#0A0F1E]">All statuses</option>
          <option value="new" className="bg-[#0A0F1E]">New</option>
          <option value="reviewed" className="bg-[#0A0F1E]">Reviewed</option>
          <option value="proposal_sent" className="bg-[#0A0F1E]">Proposal Sent</option>
          <option value="active" className="bg-[#0A0F1E]">Active</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search || statusFilter !== 'all' ? 'No submissions match your filters.' : 'No submissions yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {['Submitted', 'Business', 'Owner', 'Industry', 'Revenue', 'DSO', 'Modules', 'Status', 'Flags'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const status = statusConfig[s.status];
                const hasPain = s.nearlyMissedPayroll;
                const hasQBIssue = s.qbCurrentState?.toLowerCase().includes('cleanup');

                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {format(new Date(s.createdAt), 'MMM d, yy')}
                    </td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      {s.businessName}
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{s.ownerName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">{s.industry}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{s.annualRevenue}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {s.roiCurrentDso ? `${s.roiCurrentDso}d` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {s.modulesSelected.map((m) => (
                          <Badge key={m} variant="indigo">{m}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hasPain && <span title="Nearly missed payroll" className="mr-1">🔴</span>}
                      {hasQBIssue && <span title="QB needs cleanup">⚠️</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selectedSubmission && (
        <SubmissionDetail
          submission={selectedSubmission}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
