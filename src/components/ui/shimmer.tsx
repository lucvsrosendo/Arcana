import { cn } from "@/lib/utils";

type ShimmerProps = {
  className?: string;
  children?: React.ReactNode;
};

/** Magic UI–style shimmer overlay for card reveals */
export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
    </div>
  );
}
