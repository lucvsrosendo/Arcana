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
  /** Rendered width hint; enables the 300px thumbnail via srcset. */
  sizes?: string;
};

const CARD_SRC_PATTERN = /^\/tarot\/cards\/([a-z-]+)\.webp$/;

function getCardSrcSet(src: string) {
  const match = CARD_SRC_PATTERN.exec(src);
  return match ? `/tarot/thumbs/${match[1]}.webp 300w, ${src} 540w` : undefined;
}

export function ArcanaCardImage({
  cardId,
  src,
  name,
  number,
  artwork,
  priority = false,
  sizes,
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
  const srcSet = !failed && sizes ? getCardSrcSet(src) : undefined;
  // React 18 only forwards the lowercase attribute to the DOM.
  const priorityAttrs = { fetchpriority: priority ? "high" : "auto" } as Record<string, string>;

  return (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={540}
      height={810}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...priorityAttrs}
      onError={failed ? undefined : handleError}
      data-card-id={cardId}
      {...props}
    />
  );
}
