'use client';

import { useState } from 'react';

export function ResendNotificationButton({ submissionId }: { submissionId: string }) {
  const [label, setLabel] = useState('Resend Notification');

  const handleClick = async () => {
    setLabel('Sending...');
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/resend-notification`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setLabel('Sent!');
    } catch {
      setLabel('Failed — Retry');
    } finally {
      setTimeout(() => setLabel('Resend Notification'), 3000);
    }
  };

  return (
    <button
      onClick={() => void handleClick()}
      disabled={label === 'Sending...'}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 px-3 py-1.5 text-amber-300 text-sm font-medium transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {label}
    </button>
  );
}
