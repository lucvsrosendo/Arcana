import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ZenHeroProps = {
  brandMark?: string;
  brandName: string;
  title: string;
  intro: string;
  actions?: ReactNode;
  visual?: ReactNode;
  className?: string;
};

export function ZenHero({
  brandMark = "XVIII",
  brandName,
  title,
  intro,
  actions,
  visual,
  className,
}: ZenHeroProps) {
  const titleLines = title
    .split(/\.\s+/)
    .map((line) => line.replace(/\.$/, "").trim())
    .filter(Boolean);
  const lineOne = titleLines[0] ? `${titleLines[0]}.` : title;
  const lineTwo = titleLines
    .slice(1)
    .map((line) => `${line}.`)
    .join(" ")
    .trim();

  return (
    <section
      className={cn(
        "zen-hero relative flex min-h-[100dvh] items-center overflow-hidden bg-background px-6 pt-20 pb-16 md:pt-24 md:pb-20",
        className,
      )}
    >
      <div className="zen-hero-atmosphere pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,1.05fr)] lg:gap-12">
        <div className="zen-hero-copy text-left">
          <p className="zen-hero-brand font-display mb-6">
            <span className="zen-hero-brand__mark" aria-hidden="true">
              {brandMark}
            </span>
            <span className="zen-hero-brand__name">{brandName}</span>
          </p>
          <h1 className="font-display text-architectural mb-6 max-w-[16ch] text-4xl font-light leading-[1.12] pb-1 text-foreground sm:text-5xl md:text-6xl lg:text-[3.75rem]">
            {lineOne}
            {lineTwo ? (
              <>
                <br />
                <span className="text-foreground/85">{lineTwo}</span>
              </>
            ) : null}
          </h1>
          <p className="max-w-[42ch] text-base font-light leading-relaxed text-muted-foreground md:text-lg">
            {intro}
          </p>
          {actions ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">{actions}</div>
          ) : null}
        </div>

        {visual ? (
          <div className="zen-hero-visual-slot relative w-full" aria-hidden="true">
            {visual}
          </div>
        ) : null}
      </div>
    </section>
  );
}
