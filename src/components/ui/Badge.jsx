import React from 'react';
import { cn } from '../../utils/cn';

const badgeVariants = {
  variant: {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-negative text-white hover:bg-negative/80',
    outline: 'text-foreground',
    positive: 'border-transparent bg-positive text-white hover:bg-positive/80',
    negative: 'border-transparent bg-negative text-white hover:bg-negative/80',
  },
};

function Badge({ className, variant = 'default', ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        badgeVariants.variant[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

