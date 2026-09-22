import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ZenEmptyProps = {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  body?: string;
  className?: string;
};

export function ZenEmpty({ icon, eyebrow, title, body, className }: ZenEmptyProps) {
  return (
    <div
      className={cn(
        "zen-empty flex flex-col items-center gap-3 rounded-[var(--radius-sm)] border border-border/70 bg-card/30 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      ) : (
        <span className="zen-empty-mark" aria-hidden="true" />
      )}
      {eyebrow ? <p className="text-minimal text-muted-foreground">{eyebrow}</p> : null}
      <p className="font-display text-architectural text-2xl font-light md:text-3xl">{title}</p>
      {body ? (
        <p className="max-w-md text-pretty text-sm leading-6 text-muted-foreground">{body}</p>
      ) : null}
    </div>
  );
}
