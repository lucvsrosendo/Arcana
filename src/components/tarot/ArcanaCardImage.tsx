import { useCallback, useState, type ImgHTMLAttributes, type SyntheticEvent } from "react";
import { createArcanaArtwork } from "@/lib/artwork";
import type { ArcanaArtwork, TarotCardId } from "@/types/tarot";

type ArcanaCardImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  cardId: TarotCardId;
  src: string;
  name: string;
  number: number;
  artwork: ArcanaArtwork;
  priority?: boolean;
};

export function ArcanaCardImage({
  cardId,
  src,
  name,
  number,
  artwork,
  priority = false,
  alt = "",
  onError,
  ...props
}: ArcanaCardImageProps) {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(
    (event: SyntheticEvent<HTMLImageElement, Event>) => {
      setFailed(true);
      onError?.(event);
    },
    [onError],
  );

  const resolvedSrc = failed
    ? createArcanaArtwork({ name, number, artwork })
    : src;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={540}
      height={810}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={failed ? undefined : handleError}
      data-card-id={cardId}
      {...props}
    />
  );
}
