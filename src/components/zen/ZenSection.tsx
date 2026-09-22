import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ZenSectionProps = {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
  subtitle?: string;
  compactHeader?: boolean;
  headerClassName?: string;
  showAccent?: boolean;
};

export function ZenSection({
  eyebrow,
  title,
  children,
  className,
  muted = false,
  id,
  subtitle,
  compactHeader = false,
  headerClassName,
  showAccent = false,
}: ZenSectionProps) {
  return (
    <section
      id={id}
      className={cn("zen-section", muted ? "bg-transparent" : "bg-background", className)}
    >
      <div className="zen-container">
        <div>
          <div className={cn(compactHeader ? "mb-10" : "mb-16", headerClassName)}>
            {eyebrow ? (
              <h2 className="mb-3 text-[0.78rem] font-medium tracking-[0.06em] text-muted-foreground">
                {eyebrow}
              </h2>
            ) : null}
            {showAccent ? <div className="zen-accent-bar mb-5 w-14" aria-hidden="true" /> : null}
            <h3 className="font-display text-architectural max-w-4xl text-3xl font-light leading-[1.12] md:text-5xl">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-muted-foreground md:text-lg">
                {subtitle}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
