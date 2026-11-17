import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getMoonAgeFraction, getMoonPhaseLabel } from "@/lib/moonPhase";
import { Button } from "@/components/ui/button";
import { HomeHero, MoonGlyph } from "@/components/home/HomeHero";
import {
  ArcanaRail,
  DailyCardFeature,
  FEATURED_SPREAD_IDS,
  HomeSectionHeader,
  PillarGlyph,
  SpreadShowcase,
} from "@/components/home/HomeSections";
import { majorArcana } from "@/data/majorArcana";
import { spreadDefinitions } from "@/data/spreads";
import { getHomeContent } from "@/data/siteNews";
import { getLocalizedSpreadDefinitions, localizeCard, uiCopy } from "@/data/i18n";
import { useTarot } from "@/hooks/useTarot";
import { useNews } from "@/hooks/useNews";
import { openNewsArticle } from "@/lib/openNews";
import type { AppPage, LanguageCode, SpreadId, TarotCardId } from "@/types/tarot";

type HomePageProps = {
  onNavigate: (page: AppPage) => void;
};

const HERO_CARD_IDS: TarotCardId[] = ["the-moon", "the-star", "the-sun"];
const FEATURED_SPREADS = new Set<SpreadId>(FEATURED_SPREAD_IDS);
const DATE_LOCALES: Record<LanguageCode, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1);

export function HomePage({ onNavigate }: HomePageProps) {
  const dailyCard = useTarot((state) => state.dailyCard);
  const dailyStreak = useTarot((state) => state.dailyStreak);
  const language = useTarot((state) => state.language);
  const setSpread = useTarot((state) => state.setSpread);
  const content = getHomeContent(language);
  const copy = uiCopy[language];
  const { news } = useNews(language);

  const localizedDailyCard = useMemo(
    () => localizeCard(dailyCard, language),
    [dailyCard, language],
  );
  const localizedArcana = useMemo(
    () =>
      majorArcana
        .map((card) => localizeCard(card, language))
        .sort((first, second) => first.number - second.number),
    [language],
  );
  const heroCards = useMemo(
    () =>
      HERO_CARD_IDS.map(
        (id) => localizedArcana.find((card) => card.id === id) ?? localizedArcana[0]!,
      ),
    [localizedArcana],
  );
  const featuredSpreads = useMemo(
    () => getLocalizedSpreadDefinitions(language).filter((spread) => FEATURED_SPREADS.has(spread.id)),
    [language],
  );

  const today = new Date();
  const todayLabel = capitalize(
    new Intl.DateTimeFormat(DATE_LOCALES[language], {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(today),
  );

  const go = (page: AppPage) => {
    onNavigate(page);
  };

  const openCard = (cardId: TarotCardId) => {
    onNavigate("arcana");
    window.dispatchEvent(
      new CustomEvent("arcana:focus", {
        detail: { cardId },
      }),
    );
  };

  const chooseSpread = (spreadId: SpreadId) => {
    setSpread(spreadId);
    onNavigate("reading");
  };

  return (
    <div className="home-zen home-marseille">
      <HomeHero
        kicker={
          <>
            <MoonGlyph age={getMoonAgeFraction(today)} />
            <time dateTime={today.toISOString().slice(0, 10)}>{todayLabel}</time>
            <span aria-hidden="true">·</span>
            <span>{getMoonPhaseLabel(language)}</span>
          </>
        }
        title={content.title}
        titleAccent={content.titleAccent}
        intro={content.intro}
        facts={[content.heroFactArcana, `${spreadDefinitions.length} ${content.heroFactSpreads}`]}
        cards={heroCards}
        actions={
          <>
            <Button onClick={() => go("reading")} className="home-cta-primary">
              {content.primaryAction}
            </Button>
            <button type="button" className="home-link home-link--quiet" onClick={() => go("learn")}>
              {content.secondaryAction}
              <ArrowRight className="home-link__arrow" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </>
        }
      />

      <section className="home-section home-section--daily">
        <div className="home-container">
          <HomeSectionHeader title={content.dailyTitle} />
          <DailyCardFeature
            card={localizedDailyCard}
            streak={dailyStreak}
            streakLabel={copy.streakLabel}
            title={content.dailyTitle}
            hint={content.dailyText}
            openLabel={content.dailyOpenLabel}
            onOpen={openCard}
          />
        </div>
      </section>

      <section className="home-section home-section--arcana">
        <div className="home-container">
          <HomeSectionHeader
            title={content.arcanaTitle}
            text={content.arcanaText}
            action={
              <button type="button" className="home-link" onClick={() => go("arcana")}>
                {content.arcanaAction}
                <ArrowRight className="home-link__arrow" strokeWidth={1.5} aria-hidden="true" />
              </button>
            }
          />
        </div>
        <ArcanaRail cards={localizedArcana} openLabel={content.arcanaOpenLabel} onOpen={openCard} />
      </section>

      <section className="home-section home-section--spreads">
        <div className="home-container">
          <HomeSectionHeader title={content.spreadsTitle} text={content.spreadsText} />
          <SpreadShowcase spreads={featuredSpreads} content={content} onChoose={chooseSpread} />
        </div>
      </section>

      <section className="home-section home-section--pillars">
        <div className="home-container">
          <HomeSectionHeader title={content.pillarsTitle} />
          <ul className="home-pillars">
            {content.pillars.map((pillar) => (
              <li key={pillar.title} className="home-pillar">
                <PillarGlyph icon={pillar.icon} />
                <h3 className="home-pillar__title font-display">{pillar.title}</h3>
                <p className="home-pillar__text">{pillar.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="home-section home-section--about">
        <div className="home-container home-about">
          <div className="home-about__statement">
            <div className="zen-accent-bar home-about__rule" aria-hidden="true" />
            <h2 className="home-about__title font-display">{content.aboutTitle}</h2>
            <p className="home-about__lead">{content.aboutText}</p>
          </div>
          <div className="home-about__approach">
            <h3 className="home-section__eyebrow">{copy.homeApproach}</h3>
            <ul className="home-about__list">
              {content.aboutPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {news.length > 0 ? (
        <section className="home-section home-section--news home-news-section">
          <div className="home-container">
            <HomeSectionHeader title={content.newsTitle} text={content.newsSubtitle} />

            <div className="md:hidden">
              <Carousel className="mx-auto w-full max-w-xl">
                <CarouselContent>
                  {news.slice(0, 6).map((item) => (
                    <CarouselItem key={item.id}>
                      <button
                        type="button"
                        className="home-news-item group w-full text-left"
                        aria-label={`${copy.newsOpenArticle}: ${item.title}`}
                        onClick={() => openNewsArticle(item.id)}
                      >
                        {item.coverImageUrl ? (
                          <span className="home-news-item__media">
                            <img src={item.coverImageUrl} alt="" loading="lazy" decoding="async" />
                          </span>
                        ) : null}
                        <span className="home-news-item__meta">
                          <span>{item.tag}</span>
                          <span>{item.date}</span>
                        </span>
                        <span className="font-display home-news-item__title">{item.title}</span>
                        <span className="home-news-item__summary">{item.summary}</span>
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
                  className="home-news-item group w-full text-left"
                  aria-label={`${copy.newsOpenArticle}: ${item.title}`}
                  onClick={() => openNewsArticle(item.id)}
                >
                  <span
                    className={[
                      "home-news-item__grid",
                      item.coverImageUrl ? "home-news-item__grid--with-media" : "",
                    ].join(" ")}
                  >
                    {item.coverImageUrl ? (
                      <span className="home-news-item__media">
                        <img src={item.coverImageUrl} alt="" loading="lazy" decoding="async" />
                      </span>
                    ) : null}
                    <span>
                      <span className="home-news-item__meta">
                        <span>{item.tag}</span>
                        <span>{item.date}</span>
                      </span>
                      <span className="font-display home-news-item__title">{item.title}</span>
                    </span>
                    <span>
                      <span className="home-news-item__summary">{item.summary}</span>
                      <span className="home-link">
                        {copy.newsOpenArticle}
                        <ArrowRight className="home-link__arrow" strokeWidth={1.5} aria-hidden="true" />
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
