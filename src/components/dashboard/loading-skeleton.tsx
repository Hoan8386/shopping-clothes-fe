"use client";

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({
  rows = 5,
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}

export function CardLoadingSkeleton() {
  return <div className="bg-gray-200 rounded-lg h-32 animate-pulse" />;
}

export function ChartLoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
