'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-navy disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20': variant === 'default',
            'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-white/10': variant === 'ghost',
            'bg-transparent border border-white/20 text-white hover:bg-white/5': variant === 'outline',
            'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-8 px-3 py-1 text-xs': size === 'sm',
            'h-12 px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
