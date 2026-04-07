'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-surface-light text-text-primary border border-border',
    success: 'bg-success-bg/60 text-success-text border border-success-border',
    warning: 'bg-warning-bg/60 text-warning-text border border-warning-border',
    danger: 'bg-danger-bg/60 text-danger-text border border-danger-border',
    info: 'bg-info-bg/60 text-info-text border border-info-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}