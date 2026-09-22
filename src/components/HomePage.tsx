import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getMoonPhaseLabel } from "@/lib/moonPhase";
import { Button } from "@/components/ui/button";
import { ZenHero } from "@/components/zen/ZenHero";
import { ZenSection } from "@/components/zen/ZenSection";
import { majorArcana } from "@/data/majorArcana";
import { getHomeContent } from "@/data/siteNews";
import { localizeCard, uiCopy } from "@/data/i18n";
import { useTarot } from "@/hooks/useTarot";
import { useNews } from "@/hooks/useNews";
import { openNewsArticle } from "@/lib/openNews";
import { StreakBadge } from "@/components/trophy/StreakBadge";
import { ArcanaCardImage } from "@/components/tarot/ArcanaCardImage";
import type { AppPage, TarotCardId } from "@/types/tarot";

type HomePageProps = {
  onNavigate: (page: AppPage) => void;
};

const HERO_CARD_IDS: TarotCardId[] = ["the-moon", "the-star", "the-sun"];

const easeRitual = [0.32, 0.72, 0, 1] as const;

function HeroDeckVisual({
  cards,
}: {
  cards: Array<ReturnType<typeof localizeCard>>;
}) {
  const reduceMotion = useReducedMotion();
  const positions = ["left", "center", "right"] as const;

  return (
    <motion.div
      className="home-hero-visual"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: easeRitual, delay: 0.12 }}
    >
      {cards.map((card, index) => (
        <figure
          key={card.id}
          className={`home-hero-card home-hero-card--${positions[index]}`}
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
        </figure>
      ))}
      <p className="home-hero-legend">Marseille, XVIII, XVII, XIX</p>
    </motion.div>
  );
}

export function HomePage({ onNavigate }: HomePageProps) {
  const dailyCard = useTarot((state) => state.dailyCard);
  const dailyStreak = useTarot((state) => state.dailyStreak);
  const language = useTarot((state) => state.language);
  const content = getHomeContent(language);
  const copy = uiCopy[language];
  const { news } = useNews(language);
  const localizedDailyCard = useMemo(
    () => localizeCard(dailyCard, language),
    [dailyCard, language],
  );
  const heroCards = useMemo(
    () =>
      HERO_CARD_IDS.map((id) => {
        const found = majorArcana.find((card) => card.id === id) ?? majorArcana[0]!;
        return localizeCard(found, language);
      }),
    [language],
  );

  const go = (page: AppPage) => {
    onNavigate(page);
  };

  const openDailyCard = (cardId: TarotCardId) => {
    onNavigate("arcana");
    window.dispatchEvent(
      new CustomEvent("arcana:focus", {
        detail: { cardId },
      }),
    );
  };

  return (
    <div className="home-zen min-h-[100dvh]">
      <ZenHero
        className="home-zen-hero"
        brandName={content.brandName}
        title={content.title}
        intro={content.intro}
        actions={
          <>
            <Button
              onClick={() => go("reading")}
              variant="ritual"
              className="home-cta-primary"
            >
              {content.primaryAction}
            </Button>
            <button
              type="button"
              className="home-cta-link"
              onClick={() => go("learn")}
            >
              {content.secondaryAction}
              <ArrowRight className="h-4 w-4 home-cta-link__arrow" strokeWidth={1.5} />
            </button>
          </>
        }
        visual={<HeroDeckVisual cards={heroCards} />}
      />

      <div>
        <ZenSection
          className="home-daily-section"
          title={content.dailyTitle}
          compactHeader
        >
          <button
            type="button"
            className="home-daily-feature"
            aria-label={`${content.dailyOpenLabel}: ${localizedDailyCard.name}`}
            onClick={() => openDailyCard(localizedDailyCard.id)}
          >
            <div className="home-daily-feature__art">
              <ArcanaCardImage
                cardId={localizedDailyCard.id}
                src={localizedDailyCard.image}
                name={localizedDailyCard.name}
                number={localizedDailyCard.number}
                artwork={localizedDailyCard.artwork}
                alt={`${content.dailyTitle}: ${localizedDailyCard.name}`}
                className="home-daily-feature__image"
              />
            </div>
            <div className="home-daily-feature__body">
              <p className="home-daily-feature__eyebrow">
                {getMoonPhaseLabel(language)}
              </p>
              <h5 className="font-display home-daily-feature__title">
                {localizedDailyCard.name}
              </h5>
              <div className="mt-2">
                <StreakBadge streak={dailyStreak} label={copy.streakLabel} />
              </div>
              <p className="home-daily-feature__advice">
                {localizedDailyCard.dailyAdvice ?? localizedDailyCard.meanings.general}
              </p>
              <p className="home-daily-feature__hint">{content.dailyText}</p>
              <span className="home-daily-feature__cta">
                {content.dailyOpenLabel}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </span>
            </div>
          </button>
        </ZenSection>
      </div>

      <div>
        <ZenSection
          className="home-pillars-section"
          title={content.pillarsTitle}
          compactHeader
        >
          <ol className="home-pillars-list">
            {content.pillars.map((pillar) => (
              <li key={pillar.title} className="home-pillar-item">
                <div className="home-pillar-item__body">
                  <h4 className="home-pillar-item__title font-display">{pillar.title}</h4>
                  <p className="home-pillar-item__text">{pillar.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </ZenSection>
      </div>

      <ZenSection
        className="home-about-section"
        title={content.aboutTitle}
        compactHeader
      >
        <div className="home-editorial">
          <div className="home-editorial__copy">
            <p className="home-about-lead">{content.aboutText}</p>
            <div className="home-approach">
              <h4 className="home-approach__label">{copy.homeApproach}</h4>
              <ul className="home-approach__list">
                {content.aboutPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ZenSection>

      {news.length > 0 ? (
        <ZenSection
          className="home-news-section"
          title={content.newsTitle}
          subtitle={content.newsSubtitle}
          compactHeader
        >
          <div className="md:hidden">
            <Carousel className="mx-auto w-full max-w-xl">
              <CarouselContent>
                {news.slice(0, 6).map((item) => (
                  <CarouselItem key={item.id}>
                    <button
                      type="button"
                      className={[
                        "home-news-item group w-full text-left",
                        item.coverImageUrl ? "home-news-item--has-cover" : "",
                      ].join(" ")}
                      aria-label={`${copy.newsOpenArticle}: ${item.title}`}
                      onClick={() => openNewsArticle(item.id)}
                    >
                      {item.coverImageUrl ? (
                        <figure className="home-news-item__media">
                          <img
                            src={item.coverImageUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        </figure>
                      ) : null}
                      <div className="home-news-item__meta">
                        <span>{item.tag}</span>
                        <span>{item.date}</span>
                      </div>
                      <h4 className="font-display home-news-item__title">{item.title}</h4>
                      <p className="home-news-item__summary">{item.summary}</p>
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>

          <div className="home-news-index hidden md:block">
            {news.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                className={[
                  "home-news-item group w-full text-left",
                  item.coverImageUrl ? "home-news-item--has-cover" : "",
                ].join(" ")}
                aria-label={`${copy.newsOpenArticle}: ${item.title}`}
                onClick={() => openNewsArticle(item.id)}
              >
                <div
                  className={[
                    "home-news-item__grid",
                    item.coverImageUrl ? "home-news-item__grid--with-media" : "",
                  ].join(" ")}
                >
                  {item.coverImageUrl ? (
                    <figure className="home-news-item__media">
                      <img
                        src={item.coverImageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    </figure>
                  ) : null}
                  <div>
                    <div className="home-news-item__meta">
                      <span>{item.tag}</span>
                      <span>{item.date}</span>
                    </div>
                    <h4 className="font-display home-news-item__title">{item.title}</h4>
                  </div>
                  <div>
                    <p className="home-news-item__summary">{item.summary}</p>
                    <span className="home-news-item__cta">
                      {copy.newsOpenArticle}
                      <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ZenSection>
      ) : null}
    </div>
  );
}
