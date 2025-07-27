import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AccessibilityLoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  reducedMotion?: boolean;
}

export function AccessibilityLoading({ 
  className, 
  size = 'md', 
  text = "Loading...",
  reducedMotion = false 
}: AccessibilityLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div 
      className={cn("flex items-center justify-center", className)}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="text-center">
        {reducedMotion ? (
          // Static loading indicator for users with reduced motion preference
          <div className={cn(
            "rounded-full border-2 border-blue-600 border-t-transparent",
            sizeClasses[size],
            "mx-auto"
          )} />
        ) : (
          // Animated loading indicator with proper accessibility
          <div 
            className={cn(
              "animate-spin rounded-full border-2 border-blue-600 border-t-transparent",
              sizeClasses[size],
              "mx-auto"
            )}
            style={{
              // Respect user's motion preferences via CSS
              animation: 'var(--loading-animation, spin 1s linear infinite)'
            }}
          />
        )}
        <span className="sr-only">{text}</span>
        {text && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400" aria-hidden="true">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

// Hook to detect user's motion preference
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}