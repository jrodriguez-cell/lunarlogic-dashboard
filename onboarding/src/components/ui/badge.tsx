import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warn' | 'muted' | 'indigo';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-white/10 text-white': variant === 'default',
          'bg-emerald-500/20 text-emerald-400': variant === 'success',
          'bg-amber-500/20 text-amber-400': variant === 'warn',
          'bg-white/5 text-gray-400': variant === 'muted',
          'bg-indigo-500/20 text-indigo-300': variant === 'indigo',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
