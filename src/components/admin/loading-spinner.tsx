import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner Component
 * Consistent loading spinner across the admin panel
 */
export function LoadingSpinner({
  size = 'md',
  className,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const container = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center';

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  return (
    <div className={cn(container, className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', iconSize[size])} />
      {text && (
        <p className="text-sm text-muted-foreground mt-3">{text}</p>
      )}
    </div>
  );
}

/**
 * PageLoading Component
 * Full-page loading state for admin pages
 */
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner text={text} />
    </div>
  );
}

/**
 * TableSkeleton Component
 * Skeleton rows for table loading state
 */
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 space-y-2">
              <div className="h-5 bg-muted animate-pulse rounded" />
              {colIndex === 1 && <div className="h-4 bg-muted/60 animate-pulse rounded w-2/3" />}
            </div>
          ))}
          <div className="h-6 w-8 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * CardSkeleton Component
 * Skeleton for card content
 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

/**
 * StatsCardSkeleton Component
 * Skeleton for stats cards
 */
export function StatsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-20" />
              <div className="h-8 bg-muted animate-pulse rounded w-16" />
            </div>
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
