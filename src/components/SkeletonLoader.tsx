function SkeletonBox({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-lg ${className}`} />
}

function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3" aria-hidden="true">
      <SkeletonBox className="h-40 w-full rounded-xl" />
      <SkeletonBox className="h-4 w-3/4" />
      <SkeletonBox className="h-3 w-1/2" />
      <div className="flex items-center gap-2 pt-1">
        <SkeletonBox className="w-10 h-10 rounded-full" />
        <SkeletonBox className="h-3 w-24" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
      aria-hidden="true"
    >
      <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/2" />
      </div>
      <SkeletonBox className="w-12 h-12 rounded-full flex-shrink-0" />
    </div>
  )
}

export interface SkeletonLoaderProps {
  variant?: 'card' | 'list'
  count?: number
}

export function SkeletonLoader({ variant = 'card', count = 3 }: SkeletonLoaderProps) {
  const Skeleton = variant === 'card' ? CardSkeleton : ListSkeleton
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </>
  )
}
