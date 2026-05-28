import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          'flex h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-[color,box-shadow,border-color] outline-none',
          'placeholder:text-muted-foreground/60',
          'selection:bg-primary selection:text-primary-foreground',
          'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-input/30',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
