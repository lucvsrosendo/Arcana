import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          [
            "flex h-10 w-full px-3.5 py-2 text-base md:text-sm",
            "rounded-[var(--radius-sm)] border border-transparent",
            "bg-[linear-gradient(hsl(var(--background)/0.55),hsl(var(--background)/0.35))_padding-box,linear-gradient(135deg,hsl(var(--foreground)/0.12),hsl(var(--border)/0.5),hsl(var(--primary)/0.16))_border-box]",
            "shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]",
            "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground/70",
            "transition-[box-shadow,background-color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" "),
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
