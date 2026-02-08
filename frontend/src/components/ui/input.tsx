import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-navy mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-text-navy placeholder:text-text-light',
              'focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-text-light',
              error && 'border-status-error focus:ring-status-error',
              icon && 'pl-10',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-status-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
