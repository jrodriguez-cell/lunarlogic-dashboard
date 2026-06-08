'use client';

import { useState, useCallback } from 'react';
import type { GapAnalysisReport, WorkflowAnalysis, WorkflowGap } from '@/lib/gap-analysis';
import { format } from 'date-fns';

interface Props {
  submissionId: string;
  initialData?: {
    gapAnalysis: GapAnalysisReport;
    proposalDraft: string;
    generatedAt: string;
  } | null;
}

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? '#00CFFF' : score >= 60 ? '#F59E0B' : score >= 30 ? '#F97316' : '#EF4444';
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: WorkflowAnalysis['status'] }) {
  const config: Record<WorkflowAnalysis['status'], { label: string; className: string }> = {
    ready: { label: 'Ready', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    'minor-gaps': { label: 'Minor Gaps', className: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    'major-gaps': { label: 'Major Gaps', className: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
    blocked: { label: 'Blocked', className: 'bg-red-500/15 text-red-400 border-red-500/25' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${c.className}`}>
      {c.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: WorkflowGap['severity'] }) {
  const config: Record<WorkflowGap['severity'], { label: string; className: string }> = {
    blocking: { label: 'Blocking', className: 'bg-red-500/15 text-red-400 border-red-500/25' },
    major: { label: 'Major', className: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    minor: { label: 'Minor', className: 'bg-white/5 text-gray-400 border-white/10' },
  };
  const c = config[severity];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${c.className}`}>
      {c.label}
    </span>
  );
}

function WorkflowCard({ analysis }: { analysis: WorkflowAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor =
    analysis.readinessScore >= 80
      ? 'text-emerald-400'
      : analysis.readinessScore >= 60
      ? 'text-amber-400'
      : analysis.readinessScore >= 30
      ? 'text-orange-400'
      : 'text-red-400';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00CFFF] bg-[#00CFFF]/10 border border-[#00CFFF]/20 px-2 py-0.5 rounded">
              {analysis.workflowId}
            </span>
            <span className="text-white font-semibold text-sm">{analysis.workflowName}</span>
            <StatusBadge status={analysis.status} />
            {!analysis.selected && (
              <span className="text-[10px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5">Not selected</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ReadinessBar score={analysis.readinessScore} />
            <span className={`text-sm font-bold whitespace-nowrap ${scoreColor}`}>
              {analysis.readinessScore}%
            </span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-5 pb-5 pt-4 space-y-4">
          {/* Requirements table */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Requirements</h4>
            <div className="rounded-lg overflow-hidden border border-white/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left px-3 py-2 text-gray-400 font-medium">Requirement</th>
                    <th className="text-left px-3 py-2 text-gray-400 font-medium">Met</th>
                    <th className="text-left px-3 py-2 text-gray-400 font-medium">Client Value</th>
                    <th className="text-left px-3 py-2 text-gray-400 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.requirements.map((req, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2 text-gray-200">
                        {req.name}
                        {req.required && (
                          <span className="ml-1 text-[10px] text-red-400 uppercase font-bold">hard</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {req.met ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-red-400 font-bold">✗</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-300 max-w-[140px] truncate" title={req.clientValue}>
                        {req.clientValue}
                      </td>
                      <td className="px-3 py-2 text-gray-400">{req.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gaps */}
          {analysis.gaps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Gaps ({analysis.gaps.length})
              </h4>
              <div className="space-y-2">
                {analysis.gaps.map((gap, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-start gap-2 mb-1">
                      <SeverityBadge severity={gap.severity} />
                      <span className="text-sm text-white font-medium leading-tight">{gap.item}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      <span className="text-gray-300 font-medium">Resolution:</span> {gap.resolution}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="text-gray-400 font-medium">Effort:</span> {gap.estimatedEffort}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.gaps.length === 0 && (
            <p className="text-sm text-emerald-400">No gaps identified — this workflow is ready to deploy.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ReadinessLabel({ score }: { score: number }) {
  if (score >= 80) return <span className="text-emerald-400">Deployment Ready</span>;
  if (score >= 60) return <span className="text-amber-400">Minor Configuration Needed</span>;
  if (score >= 30) return <span className="text-orange-400">Significant Gaps to Address</span>;
  return <span className="text-red-400">Blocked — Cannot Deploy</span>;
}

export function GapAnalysisReportView({ submissionId, initialData }: Props) {
  const [data, setData] = useState(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy to Clipboard');
  const [slideLabel, setSlideLabel] = useState('Download Slide Deck');
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboard/${submissionId}/analysis`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to generate analysis');
      }
      const body = await res.json() as { gapAnalysis: GapAnalysisReport; proposalDraft: string };
      setData({
        gapAnalysis: body.gapAnalysis,
        proposalDraft: body.proposalDraft,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  const handleCopy = useCallback(() => {
    if (!data?.proposalDraft) return;
    void navigator.clipboard.writeText(data.proposalDraft).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy to Clipboard'), 2000);
    });
  }, [data?.proposalDraft]);

  const handleSlideDeck = useCallback(async () => {
    setSlideLabel('Generating...');
    try {
      const res = await fetch(`/api/onboard/${submissionId}/slides`);
      if (!res.ok) throw new Error('Failed to generate slide deck');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lunarlogic-discovery-${submissionId}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      setSlideLabel('Downloaded!');
      setTimeout(() => setSlideLabel('Download Slide Deck'), 3000);
    } catch {
      setSlideLabel('Error — Retry');
      setTimeout(() => setSlideLabel('Download Slide Deck'), 3000);
    }
  }, [submissionId]);

  const handleDownload = useCallback(() => {
    if (!data?.proposalDraft) return;
    const blob = new Blob([data.proposalDraft], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${submissionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data?.proposalDraft, submissionId]);

  const readinessColor = data
    ? data.gapAnalysis.overallReadiness >= 80
      ? 'text-emerald-400'
      : data.gapAnalysis.overallReadiness >= 60
      ? 'text-amber-400'
      : data.gapAnalysis.overallReadiness >= 30
      ? 'text-orange-400'
      : 'text-red-400'
    : 'text-gray-400';

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
        <p className="text-4xl mb-4">📊</p>
        <p className="text-xl font-semibold text-white mb-2">No Analysis Generated Yet</p>
        <p className="text-gray-400 mb-6 text-sm">
          Run the gap analysis to assess deployment readiness and generate an AI-drafted proposal.
        </p>
        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}
        <button
          onClick={() => void generateAnalysis()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00CFFF] hover:bg-[#00CFFF]/90 disabled:opacity-50 px-6 py-2.5 text-[#080D1A] text-sm font-bold transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            'Generate Analysis'
          )}
        </button>
      </div>
    );
  }

  const { gapAnalysis, proposalDraft, generatedAt } = data;
  const allBlockers = gapAnalysis.blockers;
  const allQuickWins = gapAnalysis.quickWins;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Gap Analysis & Proposal</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Generated {format(new Date(generatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <button
          onClick={() => void generateAnalysis()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-50 px-4 py-2 text-white text-sm font-medium transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Regenerating...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Overall readiness */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="text-center sm:text-left">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Overall Readiness</p>
          <p className={`text-7xl font-black leading-none ${readinessColor}`}>
            {gapAnalysis.overallReadiness}%
          </p>
        </div>
        <div className="flex-1">
          <p className={`text-lg font-semibold mb-3 ${readinessColor}`}>
            <ReadinessLabel score={gapAnalysis.overallReadiness} />
          </p>
          <ReadinessBar score={gapAnalysis.overallReadiness} />
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span>{allBlockers.length} blocker{allBlockers.length !== 1 ? 's' : ''}</span>
            <span>{allQuickWins.length} quick win{allQuickWins.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Blockers callout */}
      {allBlockers.length > 0 && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-5">
          <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-3">
            Blocking Issues ({allBlockers.length})
          </h3>
          <ul className="space-y-1.5">
            {allBlockers.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                <span className="mt-0.5 text-red-500 flex-shrink-0">✗</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick wins callout */}
      {allQuickWins.length > 0 && (
        <div className="rounded-xl border border-[#00CFFF]/25 bg-[#00CFFF]/[0.04] p-5">
          <h3 className="text-[#00CFFF] font-semibold text-sm uppercase tracking-wider mb-3">
            Quick Wins ({allQuickWins.length})
          </h3>
          <ul className="space-y-1.5">
            {allQuickWins.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#00CFFF]/80">
                <span className="mt-0.5 text-[#00CFFF] flex-shrink-0">✓</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Workflow cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Workflow Analysis
        </h3>
        <div className="space-y-3">
          {gapAnalysis.workflowAnalyses.map((analysis) => (
            <WorkflowCard key={analysis.workflowId} analysis={analysis} />
          ))}
        </div>
      </div>

      {/* Implementation notes */}
      {gapAnalysis.implementationNotes.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Implementation Notes
          </h3>
          <ul className="space-y-2">
            {gapAnalysis.implementationNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-[#00CFFF] mt-0.5 flex-shrink-0">→</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Proposal draft */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">AI-Generated Proposal Draft</h3>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-gray-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copyLabel}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-gray-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download .txt
            </button>
            <button
              onClick={() => window.open(`/api/onboard/${submissionId}/proposal-pdf`, '_blank')}
              className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-[#00CFFF]/40 bg-[#00CFFF]/5 hover:bg-[#00CFFF]/10 px-3 py-1.5 text-[#00CFFF] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={() => void handleSlideDeck()}
              disabled={slideLabel === 'Generating...'}
              className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-50 px-3 py-1.5 text-violet-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              {slideLabel}
            </button>
          </div>
        </div>
        <div className="p-5">
          <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {proposalDraft}
          </pre>
        </div>
      </div>
    </div>
  );
}
