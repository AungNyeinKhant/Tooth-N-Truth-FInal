import * as React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-navy mb-1.5">
            {label}
          </label>
        )}
        <textarea
          rows={rows}
          className={cn(
            'flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-text-navy placeholder:text-text-light resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-text-light',
            error && 'border-status-error focus:ring-status-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-status-error">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
