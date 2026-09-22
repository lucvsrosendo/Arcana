import { cn } from "@/lib/utils";
import tarotCardBack from "@/assets/tarot-card-back.webp";

type TarotCardBackFaceProps = {
  className?: string;
  /** Kept for API compatibility; decorative mark is baked into the artwork. */
  mark?: string;
};

/** Decorative Marseille-style card back — shared across reading, shuffle, and hero. */
export function TarotCardBackFace({ className }: TarotCardBackFaceProps) {
  return (
    <span className={cn("free-tarot-face free-tarot-back", className)} aria-hidden="true">
      <img
        src={tarotCardBack}
        alt=""
        className="free-tarot-back-art"
        width={540}
        height={810}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
