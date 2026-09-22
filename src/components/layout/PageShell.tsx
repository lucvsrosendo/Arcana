import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  fullBleed?: boolean;
  editorial?: boolean;
};

export function PageShell({
  children,
  className,
  fullBleed = false,
  editorial = true,
}: PageShellProps) {
  return (
    <div
      className={cn(
        fullBleed ? "w-full" : editorial ? "zen-container py-20 md:py-28" : "px-0 py-8",
        !fullBleed && !editorial && "zen-page",
        className,
      )}
    >
      {children}
    </div>
  );
}
