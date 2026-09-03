import { cn } from '@/lib/utils';

export function Spinner({ className, size = 'default' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    default: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-muted-foreground/30 border-t-primary',
        sizeClasses[size] || sizeClasses.default,
        className
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <Spinner size="lg" />
    </div>
  );
}
