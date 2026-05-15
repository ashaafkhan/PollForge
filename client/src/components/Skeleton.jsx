export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`animate-shimmer h-20 rounded-2xl border border-[#1E1E2E] ${className}`}
    />
  );
}

export function SkeletonStat({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-4 ${className}`}>
      <div className="animate-shimmer h-3 w-20 rounded" />
      <div className="animate-shimmer mt-3 h-6 w-12 rounded" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer h-3 rounded"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
