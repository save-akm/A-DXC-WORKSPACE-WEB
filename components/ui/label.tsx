import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    data-slot="label"
    className={cn(
      'flex items-center gap-1 text-sm leading-none font-medium select-none',
      'text-foreground/85',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
      className,
    )}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
