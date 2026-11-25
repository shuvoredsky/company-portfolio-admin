'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      label,
      disabled,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'inline-flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
            checked
              ? 'border-primary bg-primary'
              : 'border-input bg-muted',
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-card shadow-xs transition-transform',
              checked ? 'translate-x-5.5' : 'translate-x-1',
            )}
          />
        </span>
        {label && (
          <span className="text-sm font-medium text-foreground">{label}</span>
        )}
      </button>
    );
  },
);

Switch.displayName = 'Switch';

