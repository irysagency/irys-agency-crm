import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-white/5 rounded',
        className
      )}
    />
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-card p-5">
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-8 w-24" />
    </div>
  )
}
