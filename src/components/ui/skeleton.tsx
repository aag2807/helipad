import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-zinc-200/70",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-zinc-100">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-lg" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-zinc-200">
        <div className="p-3 bg-zinc-50" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="p-3 border-l border-zinc-200">
            <Skeleton className="h-3 w-8 mx-auto mb-2" />
            <Skeleton className="h-7 w-7 rounded-full mx-auto" />
          </div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-8 border-b border-zinc-100">
          <div className="p-2 bg-zinc-50/50">
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
          {Array.from({ length: 7 }).map((_, j) => (
            <div key={j} className="min-h-[48px] border-l border-zinc-100 p-1">
              {Math.random() > 0.8 && (
                <Skeleton className="h-10 w-full rounded-lg" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

