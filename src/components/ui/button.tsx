import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[var(--radius-sm)] text-sm font-medium tracking-[0.04em]",
    "ring-offset-background",
    "transition-[color,background-color,border-color,opacity,transform,box-shadow]",
    "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
    "active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.35]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "border border-primary/35",
          "shadow-none",
          "hover:bg-primary/90",
        ].join(" "),
        ritual: [
          "bg-foreground text-background",
          "border border-foreground/80",
          "shadow-none",
          "hover:bg-foreground/92",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "border border-destructive/50",
          "shadow-none",
          "hover:bg-destructive/90",
        ].join(" "),
        outline: [
          "border border-border/70 bg-transparent text-foreground",
          "shadow-none",
          "hover:bg-muted/30 hover:border-border hover:text-foreground",
        ].join(" "),
        secondary: [
          "bg-secondary/90 text-secondary-foreground",
          "border border-border/60",
          "shadow-none",
          "hover:bg-secondary",
        ].join(" "),
        ghost: [
          "text-muted-foreground border border-transparent",
          "hover:bg-muted/30 hover:text-foreground hover:border-border/40",
        ].join(" "),
        link: "rounded-none text-foreground underline-offset-4 hover:underline shadow-none tracking-[0.02em]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs tracking-[0.06em]",
        lg: "h-11 px-7",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
