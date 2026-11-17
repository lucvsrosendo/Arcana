import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArcanaCardImage } from "@/components/tarot/ArcanaCardImage";
import { getMarseilleNumeral } from "@/lib/artwork";
import type { TarotCard } from "@/types/tarot";

type LocalizedCard = TarotCard;

const easeRitual = [0.32, 0.72, 0, 1] as const;
const HERO_POSITIONS = ["left", "center", "right"] as const;
const ARCANA_COUNT = 22;
const RING_NUMERALS = Array.from({ length: ARCANA_COUNT }, (_, index) => getMarseilleNumeral(index));

/** Moon disc lit according to its age (0 new, 0.5 full). */
export function MoonGlyph({ age }: { age: number }) {
  const r = 7;
  const waxing = age < 0.5;
  const q = waxing ? age : 1 - age;
  const rx = Math.abs(Math.cos(q * 2 * Math.PI)) * r;
  const sweep = q < 0.25 ? 0 : 1;
  const lit = `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx.toFixed(2)} ${r} 0 0 ${sweep} 0 ${-r}Z`;

  return (
    <svg className="home-moon" viewBox="-8 -8 16 16" width="16" height="16" aria-hidden="true">
      <circle r={r} className="home-moon__shadow" />
      <path d={lit} className="home-moon__lit" transform={waxing ? undefined : "scale(-1 1)"} />
    </svg>
  );
}

function ArcanaRing({ highlighted }: { highlighted: number[] }) {
  const highlightedSet = new Set(highlighted);

  return (
    <svg className="home-ring" viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="196" className="home-ring__line" />
      <circle cx="200" cy="200" r="150" className="home-ring__line home-ring__line--dashed" />
      {RING_NUMERALS.map((numeral, index) => {
        const angle = (index * 360) / ARCANA_COUNT;
        return (
          <g key={numeral} transform={`rotate(${angle} 200 200)`}>
            <line x1="200" y1="4" x2="200" y2="12" className="home-ring__tick" />
            <text
              x="200"
              y="32"
              className={highlightedSet.has(index) ? "home-ring__numeral is-lit" : "home-ring__numeral"}
            >
              {numeral}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HeroDeck({ cards }: { cards: LocalizedCard[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="home-hero-visual">
      {cards.map((card, index) => (
        <motion.figure
          key={card.id}
          className={`home-hero-card home-hero-card--${HERO_POSITIONS[index]}`}
          initial={reduceMotion ? false : { opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: easeRitual, delay: 0.15 + index * 0.12 }}
        >
          <ArcanaCardImage
            cardId={card.id}
            src={card.image}
            name={card.name}
            number={card.number}
            artwork={card.artwork}
            alt=""
            className="home-hero-card__image"
            priority={index === 1}
          />
          <figcaption className="home-hero-card__caption">{card.name}</figcaption>
        </motion.figure>
      ))}
      <p className="home-hero-legend">
        Tarot de Marseille · {cards.map((card) => getMarseilleNumeral(card.number)).join(" · ")}
      </p>
    </div>
  );
}

type HomeHeroProps = {
  kicker: ReactNode;
  title: string;
  titleAccent: string;
  intro: string;
  actions: ReactNode;
  facts: string[];
  cards: LocalizedCard[];
};

function HeroTitle({ title, accent }: { title: string; accent: string }) {
  const start = accent ? title.indexOf(accent) : -1;
  if (start < 0) {
    return <>{title}</>;
  }

  return (
    <>
      {title.slice(0, start)}
      <em>{accent}</em>
      {title.slice(start + accent.length)}
    </>
  );
}

export function HomeHero({ kicker, title, titleAccent, intro, actions, facts, cards }: HomeHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = heroRef.current;
    if (!node || reduceMotion || !window.matchMedia?.("(pointer: fine)").matches) {
      return;
    }

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const paint = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--candle-x", `${((pointerX - rect.left) / rect.width) * 100}%`);
      node.style.setProperty("--candle-y", `${((pointerY - rect.top) / rect.height) * 100}%`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) {
        frame = requestAnimationFrame(paint);
      }
    };

    node.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      node.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  return (
    <section ref={heroRef} className="home-hero">
      <div className="home-hero__candle" aria-hidden="true" />
      <div className="home-container home-hero__grid">
        <motion.div
          className="home-hero__copy"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeRitual }}
        >
          <p className="home-hero__kicker">{kicker}</p>
          <h1 className="home-hero__title font-display">
            <HeroTitle title={title} accent={titleAccent} />
          </h1>
          <p className="home-hero__intro">{intro}</p>
          <div className="home-hero__actions">{actions}</div>
          <ul className="home-hero__facts">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </motion.div>

        <div className="home-hero__stage" aria-hidden="true">
          <ArcanaRing highlighted={cards.map((card) => card.number)} />
          <HeroDeck cards={cards} />
        </div>
      </div>
    </section>
  );
}
