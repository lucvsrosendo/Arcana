import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import tarotCardBack from "@/assets/tarot-card-back.webp";
import { ArcanaCardImage } from "@/components/tarot/ArcanaCardImage";
import { StreakBadge } from "@/components/trophy/StreakBadge";
import { getMarseilleNumeral } from "@/lib/artwork";
import type { HomeContent } from "@/data/siteNews";
import type { SpreadDefinition, SpreadId, TarotCard, TarotCardId } from "@/types/tarot";

export function HomeSectionHeader({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <header className="home-section__header">
      <div>
        {eyebrow ? <p className="home-section__eyebrow">{eyebrow}</p> : null}
        <h2 className="home-section__title font-display">{title}</h2>
        {text ? <p className="home-section__text">{text}</p> : null}
      </div>
      {action}
    </header>
  );
}

/** Flips from the deck back to the face the first time it scrolls into view. */
function useRevealOnView<T extends Element>() {
  const ref = useRef<T>(null);
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduceMotion || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.55 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return { ref, revealed };
}

type DailyCardFeatureProps = {
  card: TarotCard;
  streak: number;
  streakLabel: string;
  title: string;
  hint: string;
  openLabel: string;
  onOpen: (cardId: TarotCardId) => void;
};

export function DailyCardFeature({
  card,
  streak,
  streakLabel,
  title,
  hint,
  openLabel,
  onOpen,
}: DailyCardFeatureProps) {
  const { ref, revealed } = useRevealOnView<HTMLSpanElement>();

  return (
    <button
      type="button"
      className="home-daily"
      aria-label={`${openLabel}: ${card.name}`}
      onClick={() => onOpen(card.id)}
    >
      <span ref={ref} className="home-daily__flip" data-revealed={revealed}>
        <span className="home-daily__face home-daily__face--back">
          <img src={tarotCardBack} alt="" width={540} height={810} loading="lazy" decoding="async" />
        </span>
        <span className="home-daily__face home-daily__face--front">
          <ArcanaCardImage
            cardId={card.id}
            src={card.image}
            name={card.name}
            number={card.number}
            artwork={card.artwork}
            alt={`${title}: ${card.name}`}
          />
        </span>
      </span>
      <span className="home-daily__body">
        <span className="home-daily__numeral">{getMarseilleNumeral(card.number)}</span>
        <span className="home-daily__name font-display">{card.name}</span>
        <span className="home-daily__advice">{card.dailyAdvice ?? card.meanings.general}</span>
        <span className="home-daily__meta">
          <StreakBadge streak={streak} label={streakLabel} />
          <span className="home-daily__hint">{hint}</span>
        </span>
        <span className="home-link">
          {openLabel}
          <ArrowRight className="home-link__arrow" strokeWidth={1.5} aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

export function ArcanaRail({
  cards,
  openLabel,
  onOpen,
}: {
  cards: TarotCard[];
  openLabel: string;
  onOpen: (cardId: TarotCardId) => void;
}) {
  return (
    <ol className="home-rail" aria-label={openLabel}>
      {cards.map((card) => (
        <li key={card.id} className="home-rail__item">
          <button
            type="button"
            className="home-rail__card"
            aria-label={`${openLabel}: ${card.name}`}
            onClick={() => onOpen(card.id)}
          >
            <span className="home-rail__numeral" aria-hidden="true">
              {getMarseilleNumeral(card.number)}
            </span>
            <ArcanaCardImage
              cardId={card.id}
              src={card.image}
              name={card.name}
              number={card.number}
              artwork={card.artwork}
              alt=""
              className="home-rail__image"
              sizes="132px"
            />
            <span className="home-rail__name">{card.name}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

type DiagramSlot = { x: number; y: number; turned?: boolean };

const SPREAD_DIAGRAMS: Partial<Record<SpreadId, DiagramSlot[]>> = {
  single: [{ x: 50, y: 50 }],
  "three-card": [
    { x: 27, y: 50 },
    { x: 50, y: 50 },
    { x: 73, y: 50 },
  ],
  "celtic-cross": [
    { x: 36, y: 50 },
    { x: 36, y: 50, turned: true },
    { x: 36, y: 84 },
    { x: 15, y: 50 },
    { x: 36, y: 16 },
    { x: 57, y: 50 },
    { x: 84, y: 86 },
    { x: 84, y: 62 },
    { x: 84, y: 38 },
    { x: 84, y: 14 },
  ],
};

export const FEATURED_SPREAD_IDS = Object.keys(SPREAD_DIAGRAMS) as SpreadId[];

export function SpreadShowcase({
  spreads,
  content,
  onChoose,
}: {
  spreads: SpreadDefinition[];
  content: Pick<HomeContent, "spreadsAction" | "spreadsCardUnit">;
  onChoose: (spreadId: SpreadId) => void;
}) {
  return (
    <ul className="home-spreads">
      {spreads.map((spread) => {
        const slots = SPREAD_DIAGRAMS[spread.id] ?? [];
        const count = spread.positions.length;
        return (
          <li key={spread.id}>
            <button type="button" className="home-spread" onClick={() => onChoose(spread.id)}>
              <span
                className={`home-spread__diagram home-spread__diagram--${slots.length > 3 ? "dense" : "open"}`}
                aria-hidden="true"
              >
                {slots.map((slot, index) => (
                  <span
                    key={`${slot.x}-${slot.y}-${index}`}
                    className={slot.turned ? "home-spread__slot is-turned" : "home-spread__slot"}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%`, transitionDelay: `${index * 35}ms` }}
                  />
                ))}
              </span>
              <span className="home-spread__count">
                {count} {count === 1 ? content.spreadsCardUnit.one : content.spreadsCardUnit.other}
              </span>
              <span className="home-spread__title font-display">{spread.title}</span>
              <span className="home-spread__text">{spread.description}</span>
              <span className="home-link">
                {content.spreadsAction}
                <ArrowRight className="home-link__arrow" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const PILLAR_GLYPHS: Record<HomeContent["pillars"][number]["icon"], ReactNode> = {
  layers: (
    <>
      <rect x="6" y="7" width="10" height="16" rx="1.2" transform="rotate(-16 11 15)" />
      <rect x="12" y="6" width="10" height="16" rx="1.2" transform="rotate(12 17 14)" />
    </>
  ),
  book: (
    <path d="M14 8.5c-2.6-1.8-6-2-9-1v14c3-1 6.4-.8 9 1m0-14c2.6-1.8 6-2 9-1v14c-3-1-6.4-.8-9 1m0-14v14" />
  ),
  journal: <path d="M22.5 4.5C15 6 10.5 11.5 8 20l-1.5 4M8 20c4.5-.5 8-3 10-7.5M11 13.5c2.6.2 5-.7 7-2.7" />,
  shield: (
    <>
      <ellipse cx="14" cy="11.5" rx="6.5" ry="7.5" />
      <path d="M14 19v5.5M11 24.5h6M16.5 8.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" />
    </>
  ),
};

export function PillarGlyph({ icon }: { icon: HomeContent["pillars"][number]["icon"] }) {
  return (
    <svg
      className="home-pillar__glyph"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PILLAR_GLYPHS[icon]}
    </svg>
  );
}
