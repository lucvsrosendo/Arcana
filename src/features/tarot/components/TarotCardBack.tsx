import { memo, useCallback, type CSSProperties } from "react";
import { TarotCardBackFace } from "./TarotCardBackFace";

export type VisualTarotDeckCard = {
  id: string;
  name: string;
  symbol: string;
  number?: number;
  image?: string;
  gradient?: string;
  palette?: [string, string, string];
};

type TarotCardBackProps = {
  card: VisualTarotDeckCard;
  index: number;
  isLocked: boolean;
  isSelected: boolean;
  selectedOrder?: number;
  ariaLabel?: string;
  onSelect: (cardId: string) => void;
};

export const TarotCardBack = memo(function TarotCardBack({
  card,
  index,
  isLocked,
  isSelected,
  selectedOrder,
  ariaLabel,
  onSelect,
}: TarotCardBackProps) {
  const [primary, secondary, ink] = card.palette ?? [];
  const frontStyle =
    primary && secondary && ink
      ? ({
          background: `linear-gradient(135deg, ${primary}, ${secondary} 54%, ${ink})`,
        } as CSSProperties)
      : undefined;

  const handleSelect = useCallback(() => {
    onSelect(card.id);
  }, [card.id, onSelect]);

  return (
    <button
      type="button"
      aria-label={ariaLabel ?? `Card ${index + 1}`}
      disabled={isLocked && !isSelected}
      onClick={handleSelect}
      data-index={index}
      className={[
        "free-tarot-choice",
        isSelected ? "is-selected" : "",
        isLocked && !isSelected ? "is-muted" : "",
      ].join(" ")}
      style={{ "--card-index": index } as CSSProperties}
    >
      <span className="free-tarot-choice-inner">
        <TarotCardBackFace />
        <span
          className={`free-tarot-face free-tarot-front bg-gradient-to-br ${
            card.gradient ?? ""
          }`}
          style={frontStyle}
        >
          {card.image ? (
            <img
              src={card.image}
              alt={card.name}
              className="free-tarot-front-art"
              width={540}
              height={810}
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {selectedOrder ? (
            <span className="free-tarot-front-order">{selectedOrder}</span>
          ) : null}
          {!card.image ? (
            <>
              <span className="free-tarot-front-symbol">{card.symbol}</span>
              <span className="free-tarot-front-name">{card.name}</span>
            </>
          ) : null}
        </span>
      </span>
    </button>
  );
});
