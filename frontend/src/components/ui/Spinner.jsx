import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ className, size = 'md', message }) {
  return (
    <div className={cn('flex items-center justify-center gap-2', message && 'py-8')}>
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size] || sizeMap.md, className)} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default Spinner;
