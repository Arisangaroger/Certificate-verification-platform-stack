export function SkeletonCard() {
  return (
    <div className="card">
      <div className="skeleton-shimmer h-6 w-3/4 mb-4"></div>
      <div className="skeleton-shimmer h-4 w-1/2 mb-2"></div>
      <div className="skeleton-shimmer h-4 w-2/3 mb-4"></div>
      <div className="flex gap-2">
        <div className="skeleton-shimmer h-10 flex-1"></div>
        <div className="skeleton-shimmer h-10 flex-1"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-shimmer h-16 w-full rounded-lg"></div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-4 w-full"></div>
      ))}
    </div>
  );
}
