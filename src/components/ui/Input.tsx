'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              {icon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              'w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors',
              icon && 'pl-10',
              type === 'password' && 'pr-10',
              error && 'border-danger-border focus:border-danger-border focus:ring-danger-border',
              className
            )}
            ref={ref}
            {...props}
          />
          {type === 'password' && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-accent focus:outline-none transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger-text">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';