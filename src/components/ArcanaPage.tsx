import {
  Star,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PageShell } from "@/components/layout/PageShell";
import { ZenEmpty } from "@/components/zen/ZenEmpty";
import { arcanaDetails } from "../data/arcanaDetails";
import { localizeCard, meaningLabels, uiCopy } from "../data/i18n";
import { majorArcana } from "../data/majorArcana";
import { useTarot } from "../hooks/useTarot";
import { ArcanaCardImage } from "@/components/tarot/ArcanaCardImage";
import type {
  LanguageCode,
  MeaningCategory,
  TarotCardId,
} from "../types/tarot";

type ArcanaRange = "all" | "0-7" | "8-14" | "15-21";
type ArcanaOrder = "ascending" | "descending";

const meaningMarkers: Record<MeaningCategory, string> = {
  general: "I.",
  love: "II.",
  work: "III.",
  spirituality: "IV.",
  shadow: "V.",
};

const arcanaPageCopy: Record<
  LanguageCode,
  {
    searchPlaceholder: string;
    order: string;
    all: string;
    ascending: string;
    descending: string;
    result: string;
    results: string;
    chooseHint: string;
    noResults: string;
  }
> = {
  pt: {
    searchPlaceholder: "Buscar arcano...",
    order: "Ordenar",
    all: "Todos",
    ascending: "Crescente",
    descending: "Decrescente",
    result: "arcano",
    results: "arcanos",
    chooseHint: "Toque em um arcano pra ver significados, simbolos e exemplos de leitura.",
    noResults: "Nenhum arcano encontrado. Tente outro nome ou palavra-chave.",
  },
  en: {
    searchPlaceholder: "Search arcana...",
    order: "Sort",
    all: "All",
    ascending: "Ascending",
    descending: "Descending",
    result: "arcana",
    results: "arcana",
    chooseHint: "Tap an arcana to see meanings, symbols, and reading examples.",
    noResults: "No arcana found. Try another name or keyword.",
  },
  es: {
    searchPlaceholder: "Buscar arcano...",
    order: "Ordenar",
    all: "Todos",
    ascending: "Ascendente",
    descending: "Descendente",
    result: "arcano",
    results: "arcanos",
    chooseHint: "Toca un arcano para ver significados, simbolos y ejemplos de lectura.",
    noResults: "Ningun arcano encontrado. Prueba otro nombre o palabra clave.",
  },
};

const rangeOptions: Array<{ id: ArcanaRange; label: string }> = [
  { id: "all", label: "" },
  { id: "0-7", label: "0 a 7" },
  { id: "8-14", label: "8 a 14" },
  { id: "15-21", label: "15 a 21" },
];

export function ArcanaPage() {
  const language = useTarot((state) => state.language);
  const favorites = useTarot((state) => state.favorites);
  const toggleFavorite = useTarot((state) => state.toggleFavorite);
  const copy = uiCopy[language];
  const pageCopy = arcanaPageCopy[language];
  const labels = meaningLabels[language];
  const localizedArcana = useMemo(
    () => majorArcana.map((card) => localizeCard(card, language)),
    [language],
  );
  const [selectedCardId, setSelectedCardId] = useState<TarotCardId>("the-fool");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<ArcanaRange>("all");
  const [order, setOrder] = useState<ArcanaOrder>("ascending");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  useEffect(() => {
    const handleFocusArcana = (event: Event) => {
      const customEvent = event as CustomEvent<{ cardId?: TarotCardId }>;
      if (!customEvent.detail?.cardId) {
        return;
      }

      setSelectedCardId(customEvent.detail.cardId);
      setQuery("");
      setRange("all");
    };

    window.addEventListener("arcana:focus", handleFocusArcana);
    return () => window.removeEventListener("arcana:focus", handleFocusArcana);
  }, []);
  const selectedCard = useMemo(
    () =>
      localizedArcana.find((card) => card.id === selectedCardId) ??
      localizedArcana[0],
    [localizedArcana, selectedCardId],
  );
  const visibleArcana = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const [minimum, maximum] =
      range === "all" ? [0, 21] : range.split("-").map(Number);

    return localizedArcana
      .filter(
        (card) =>
          card.number >= minimum &&
          card.number <= maximum &&
          (!normalizedQuery ||
            card.name.toLocaleLowerCase().includes(normalizedQuery) ||
            String(card.number).padStart(2, "0").includes(normalizedQuery)) &&
          (!onlyFavorites || favorites.includes(card.id)),
      )
      .sort((first, second) =>
        order === "ascending"
          ? first.number - second.number
          : second.number - first.number,
      );
  }, [favorites, localizedArcana, onlyFavorites, order, query, range]);
  const selectedDetail = arcanaDetails[selectedCard.id];

  const isSelectedFavorite = favorites.includes(selectedCard.id);

  return (
    <PageShell>
      <div className="arcana-page">
        <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 font-display text-2xl font-light tabular-nums tracking-[0.02em] text-muted-foreground">
              {String(localizedArcana.length).padStart(2, "0")}
            </p>
            <h1 className="font-display text-architectural text-4xl font-light md:text-6xl">{copy.majorArcana}</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">{pageCopy.chooseHint}</p>
          </div>

          <label className="arcana-search shrink-0">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={pageCopy.searchPlaceholder}
            />
          </label>
        </header>

        <div className="arcana-layout">
          <section className="arcana-library-panel">
          <header className="arcana-library-toolbar">
            <div className="arcana-range-filters" aria-label={copy.majorArcana}>
              {rangeOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setRange(option.id)}
                  className={range === option.id ? "is-active" : ""}
                >
                  <span>{option.id === "all" ? pageCopy.all : option.label}</span>
                  {option.id === "all" ? <strong>22</strong> : null}
                </button>
              ))}
            </div>

            <label className="arcana-order-control">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{pageCopy.order}</span>
              <select
                value={order}
                onChange={(event) => setOrder(event.target.value as ArcanaOrder)}
              >
                <option value="ascending">{pageCopy.ascending}</option>
                <option value="descending">{pageCopy.descending}</option>
              </select>
            </label>
            <button
              type="button"
              className={onlyFavorites ? "arcana-filter-button is-active" : "arcana-filter-button"}
              onClick={() => setOnlyFavorites((value) => !value)}
            >
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{copy.favorites}</span>
            </button>
          </header>

          <div className="arcana-grid hidden md:grid">
            {visibleArcana.map((card) => (
              <button
                type="button"
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={[
                  "arcana-tile",
                  card.id === selectedCard.id ? "arcana-tile-active" : "",
                ].join(" ")}
              >
                <span className="arcana-tile-art">
                  <ArcanaCardImage
                    cardId={card.id}
                    src={card.image}
                    name={card.name}
                    number={card.number}
                    artwork={card.artwork}
                    className="arcana-tile-image"
                  />
                </span>
                <span className="arcana-tile-number">
                  {String(card.number).padStart(2, "0")}
                </span>
                <span className="arcana-tile-name">{card.name}</span>
              </button>
            ))}
          </div>

          <div className="md:hidden">
            <Carousel className="mx-auto w-full px-10">
              <CarouselContent>
                {visibleArcana.map((card) => (
                  <CarouselItem key={card.id} className="basis-1/3 sm:basis-1/4">
                    <button
                      type="button"
                      onClick={() => setSelectedCardId(card.id)}
                      className={[
                        "arcana-tile w-full",
                        card.id === selectedCard.id ? "arcana-tile-active" : "",
                      ].join(" ")}
                    >
                      <span className="arcana-tile-art">
                        <ArcanaCardImage
                          cardId={card.id}
                          src={card.image}
                          name={card.name}
                          number={card.number}
                          artwork={card.artwork}
                          className="arcana-tile-image"
                        />
                      </span>
                      <span className="arcana-tile-number">
                        {String(card.number).padStart(2, "0")}
                      </span>
                      <span className="arcana-tile-name">{card.name}</span>
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>

          {visibleArcana.length === 0 ? (
            <ZenEmpty
              icon={<Search className="h-5 w-5" aria-hidden="true" />}
              title={pageCopy.noResults}
            />
          ) : null}

          <footer className="arcana-library-footer">
            <span aria-live="polite">
              {visibleArcana.length}{" "}
              {visibleArcana.length === 1 ? pageCopy.result : pageCopy.results}
            </span>
          </footer>
          </section>

          <section className="arcana-detail-panel">
          <header className="arcana-detail-hero">
            <div className="arcana-detail-art-frame">
              <ArcanaCardImage
                cardId={selectedCard.id}
                src={selectedCard.image}
                name={selectedCard.name}
                number={selectedCard.number}
                artwork={selectedCard.artwork}
                alt={`${copy.cardAltPrefix} ${selectedCard.name}`}
                className="arcana-detail-art"
                priority
              />
            </div>
            <div className="arcana-detail-intro">
              <p>
                {copy.arcanePrefix} {String(selectedCard.number).padStart(2, "0")}
              </p>
              <h2>{selectedCard.name}</h2>
              <span>{selectedCard.description}</span>
              <button
                type="button"
                className={isSelectedFavorite ? "arcana-favorite-button is-active" : "arcana-favorite-button"}
                onClick={() => toggleFavorite(selectedCard.id)}
              >
                <Star
                  className={isSelectedFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"}
                  aria-hidden="true"
                />
                {isSelectedFavorite ? copy.removeFavorite : copy.addFavorite}
              </button>
              <div className="arcana-reading-example">
                <strong>{copy.readingExample}</strong>
                <p>{selectedDetail.readingExample[language]}</p>
              </div>
            </div>
          </header>

          <div className="arcana-meanings">
            {(Object.keys(labels) as MeaningCategory[]).map((category) => (
              <article key={category} className="arcana-meaning-row">
                <span
                  className="arcana-meaning-marker"
                  aria-hidden="true"
                >
                  {meaningMarkers[category]}
                </span>
                <div>
                  <h3>{labels[category]}</h3>
                  <p>{selectedCard.meanings[category]}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="arcana-detail-meta">
            <section>
              <h3>{copy.symbols}</h3>
              <div className="arcana-chip-list">
                {(selectedCard.symbols ?? selectedDetail.symbols[language]).map((symbol) => (
                  <span key={symbol} className="keyword-chip">
                    {symbol}
                  </span>
                ))}
              </div>
            </section>

            {selectedCard.correspondences ? (
              <section>
                <h3>{copy.correspondences}</h3>
                <dl>
                  <div className="correspondence-row">
                    <dt>{copy.element}</dt>
                    <dd>{selectedCard.correspondences.element}</dd>
                  </div>
                  <div className="correspondence-row">
                    <dt>{copy.planetOrSign}</dt>
                    <dd>{selectedCard.correspondences.planetOrSign}</dd>
                  </div>
                  <div className="correspondence-row">
                    <dt>{copy.hebrewLetter}</dt>
                    <dd>{selectedCard.correspondences.hebrewLetter}</dd>
                  </div>
                  <div className="correspondence-row">
                    <dt>{copy.path}</dt>
                    <dd>{selectedCard.correspondences.path}</dd>
                  </div>
                </dl>
              </section>
            ) : null}
          </div>

          <div className="arcana-keyword-sections">
            <section>
              <h3>{copy.positiveWords}</h3>
              <div className="arcana-chip-list">
                {selectedCard.positiveKeywords.map((keyword) => (
                  <span key={keyword} className="keyword-chip">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
            <section>
              <h3>{copy.cautionWords}</h3>
              <div className="arcana-chip-list">
                {selectedCard.cautionKeywords.map((keyword) => (
                  <span key={keyword} className="keyword-chip caution">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
