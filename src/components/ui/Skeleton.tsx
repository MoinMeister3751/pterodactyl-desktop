import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse-slow rounded-md bg-base-700/60", className)} />;
}

export function SkeletonServerCard() {
  return (
    <div className="rounded-lg border border-base-700 bg-base-850 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-24" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
