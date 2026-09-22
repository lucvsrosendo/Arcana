import { cn } from "@/lib/utils";

type FlipCardProps = {
  className?: string;
  front: React.ReactNode;
  back: React.ReactNode;
  flipped?: boolean;
};

/** Aceternity/Magic UI–style 3D flip for tarot card reveals */
export function FlipCard({ className, front, back, flipped = false }: FlipCardProps) {
  return (
    <div className={cn("perspective-[1000px]", className)}>
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">{front}</div>
        <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
          {back}
        </div>
      </div>
    </div>
  );
}
