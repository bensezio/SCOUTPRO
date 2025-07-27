import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  animate?: boolean;
}

export function LoadingSkeleton({ className, lines = 1, animate = true }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded",
            "dark:from-gray-700 dark:via-gray-600 dark:to-gray-700",
            animate && "animate-shimmer bg-[length:200%_100%]"
          )}
          style={{
            width: `${Math.random() * 40 + 60}%`,
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
  showAvatar?: boolean;
  showAction?: boolean;
}

export function CardSkeleton({ className, showAvatar = false, showAction = false }: CardSkeletonProps) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-shimmer bg-[length:200%_100%]" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-3/4 animate-shimmer bg-[length:200%_100%]" />
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/2 animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: '100ms' }} />
        </div>
        {showAction && (
          <div className="w-16 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: '200ms' }} />
        )}
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-full animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: '300ms' }} />
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-5/6 animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}