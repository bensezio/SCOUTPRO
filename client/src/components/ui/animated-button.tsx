import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonProps {
  animationType?: "pulse" | "bounce" | "scale" | "shimmer" | "slide";
  animationDelay?: string;
  ripple?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, animationType = "scale", animationDelay = "0ms", ripple = false, children, onClick, ...props }, ref) => {
    const [isClicked, setIsClicked] = React.useState(false);

    const getAnimationClass = () => {
      switch (animationType) {
        case "pulse":
          return "hover:animate-pulse-soft";
        case "bounce":
          return "hover:animate-bounce-subtle";
        case "scale":
          return "hover:scale-105 active:scale-95";
        case "shimmer":
          return "hover:animate-shimmer bg-gradient-to-r hover:bg-[length:200%_100%]";
        case "slide":
          return "hover:translate-x-1";
        default:
          return "hover:scale-105 active:scale-95";
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple) {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 200);
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all duration-300 hover:shadow-lg",
          getAnimationClass(),
          isClicked && ripple && "animate-pulse",
          className
        )}
        style={{ animationDelay }}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };