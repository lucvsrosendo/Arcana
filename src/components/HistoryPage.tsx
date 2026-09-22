import {
  Download,
  History as HistoryIcon,
  Image,
  Trash2,
} from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ZenEmpty } from "@/components/zen/ZenEmpty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dateLocaleByLanguage,
  localizeCard,
  localizeReadingRecord,
  uiCopy,
} from "../data/i18n";
import { formatAppDate } from "../lib/formatDate";
import { majorArcana } from "../data/majorArcana";
import { useTarot } from "../hooks/useTarot";
import { ArcanaCardImage } from "@/components/tarot/ArcanaCardImage";
import type { TarotCardId } from "../types/tarot";

const majorArcanaById = new Map(majorArcana.map((card) => [card.id, card]));

export function HistoryPage() {
  const history = useTarot((state) => state.history);
  const clearHistory = useTarot((state) => state.clearHistory);
  const language = useTarot((state) => state.language);
  const copy = uiCopy[language];
  const dateLocale = dateLocaleByLanguage[language];
  const reduceMotion = useReducedMotion();
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const listRef = useRef<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    setScrollMargin(listRef.current?.offsetTop ?? 0);
  }, [history.length, filterDate]);

  const frequentCards = useMemo(() => {
    const counts = new Map<string, number>();

    history.forEach((record) => {
      record.cards.forEach((card) => {
        counts.set(card.cardId, (counts.get(card.cardId) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cardId, count]) => {
        const card = majorArcanaById.get(cardId as TarotCardId);
        return {
          card: card ? localizeCard(card, language) : undefined,
          count,
        };
      })
      .filter((item) => item.card);
  }, [history, language]);
  const maxFrequency = Math.max(1, ...frequentCards.map((item) => item.count));
  const filteredHistory = useMemo(() => {
    if (!filterDate) {
      return history;
    }
    const day = filterDate.toDateString();
    return history.filter((record) => new Date(record.createdAt).toDateString() === day);
  }, [filterDate, history]);
  const localizedHistory = useMemo(
    () => filteredHistory.map((record) => localizeReadingRecord(record, language)),
    [filteredHistory, language],
  );
  const localizedTimeline = useMemo(
    () => history.slice(0, 8).map((record) => localizeReadingRecord(record, language)),
    [history, language],
  );
  const exportLabels = {
    documentTitle: copy.exportDocumentTitle,
    combinationsTitle: copy.combinations,
    shareTitle: copy.shareTitle,
    imageFilename: copy.imageFilename,
    pdfFilename: copy.pdfFilename,
    dateLocale,
  };

  const rowVirtualizer = useWindowVirtualizer({
    count: localizedHistory.length,
    estimateSize: () => 292,
    overscan: 4,
    scrollMargin,
  });

  return (
    <PageShell>
      <div className="history-page">
        <header className="history-hero">
          <div className="history-hero-copy">
            <h1 className="font-display text-architectural text-4xl font-light md:text-6xl">{copy.history}</h1>
            <p className="history-hero-lede text-muted-foreground">{copy.historySubtitle}</p>
          </div>
        <Button
          type="button"
          variant="outline"
          onClick={clearHistory}
          disabled={history.length === 0}
          className="justify-self-start md:justify-self-end"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {copy.clear}
        </Button>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button" className="text-minimal">
              {filterDate ? formatAppDate(filterDate, language) : copy.newsDateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={setFilterDate}
            />
          </PopoverContent>
        </Popover>
        {filterDate ? (
          <Button variant="ghost" type="button" size="sm" onClick={() => setFilterDate(undefined)}>
            {copy.cancel}
          </Button>
        ) : null}
      </div>

      <section className="history-summary-grid">
        <Card className="history-summary-panel history-timeline-panel shadow-none border-border/70">
          <CardHeader className="history-panel-heading flex-row items-center justify-center space-y-0 pb-2">
            <CardTitle className="text-base">{copy.timeline}</CardTitle>
          </CardHeader>

          <CardContent className="history-timeline">
            {localizedTimeline.map((localizedRecord) => (
              <article key={`timeline-${localizedRecord.id}`} className="history-timeline-item">
                <span className="history-timeline-dot" aria-hidden="true" />
                <div>
                  <time dateTime={localizedRecord.createdAt}>
                    {formatAppDate(localizedRecord.createdAt, language, "PPp")}
                  </time>
                  <h3>{localizedRecord.spreadTitle}</h3>
                  <p>{localizedRecord.cards.map((card) => card.cardName).join(", ")}</p>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="history-summary-panel history-frequency-panel shadow-none border-border/70">
          <CardHeader className="history-panel-heading flex-row items-center justify-center space-y-0 pb-2">
            <CardTitle className="text-base">{copy.frequentCards}</CardTitle>
          </CardHeader>

          <CardContent className="p-6 pt-0">
          <ol className="history-frequency-list">
            {frequentCards.map(({ card, count }, index) =>
              card ? (
                <li key={card.id} className="history-frequency-row">
                  <span className="history-frequency-rank">{index + 1}</span>
                  <ArcanaCardImage
                    cardId={card.id}
                    src={card.image}
                    name={card.name}
                    number={card.number}
                    artwork={card.artwork}
                  />
                  <div className="history-frequency-name">
                    <p>{card.name}</p>
                    <span>
                      <i style={{ width: `${(count / maxFrequency) * 100}%` }} />
                    </span>
                  </div>
                  <span className="history-frequency-count tabular-nums">{count}</span>
                </li>
              ) : null,
            )}
          </ol>

          {frequentCards.length === 0 ? (
            <p className="history-empty-copy">{copy.noFrequentCards}</p>
          ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="history-records" ref={listRef}>
        {localizedHistory.length > 0 ? (
          <div
            className="history-records-virtual"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const localizedRecord = localizedHistory[virtualRow.index]!;
              const recordIndex = virtualRow.index;

              return (
                <div
                  key={localizedRecord.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="history-records-virtual-item"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                  }}
                >
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.35, ease: [0.32, 0.72, 0, 1] }
                    }
                  >
                    <Card className="history-record shadow-none border-border/70">
                      <div className="history-record-mark" aria-hidden="true">
                        <span>{String(recordIndex + 1).padStart(2, "0")}</span>
                      </div>

                      <header className="history-record-header">
                        <time dateTime={localizedRecord.createdAt}>
                          {formatAppDate(localizedRecord.createdAt, language, "PPp")}
                        </time>
                        <h2>{localizedRecord.spreadTitle}</h2>
                        {localizedRecord.question ? (
                          <p className="text-sm text-muted">{localizedRecord.question}</p>
                        ) : null}
                      </header>

                      <ol className="history-record-cards">
                        {localizedRecord.cards.map((card) => (
                          <li key={`${localizedRecord.id}-${card.position}`}>
                            <span>{card.position}</span>
                            <p>
                              {String(card.number).padStart(2, "0")} - {card.cardName}
                            </p>
                          </li>
                        ))}
                      </ol>

                      {localizedRecord.combinations.length > 0 ? (
                        <div className="history-record-combinations">
                          {localizedRecord.combinations.map((combination) => (
                            <p key={combination}>{combination}</p>
                          ))}
                        </div>
                      ) : null}

                      <div className="history-record-actions">
                        <button
                          type="button"
                          className="history-export-action"
                          onClick={async () => {
                            const { shareReadingImage } = await import("../lib/exportReading");
                            await shareReadingImage(localizedRecord, exportLabels);
                          }}
                        >
                          <Image className="h-4 w-4" aria-hidden="true" />
                          {copy.image}
                        </button>
                        <button
                          type="button"
                          className="history-export-action"
                          onClick={async () => {
                            const { downloadReadingPdf } = await import("../lib/exportReading");
                            await downloadReadingPdf(localizedRecord, exportLabels);
                          }}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          {copy.pdf}
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              );
            })}
          </div>
        ) : null}

        {history.length === 0 ? (
          <ZenEmpty
            icon={<HistoryIcon className="h-8 w-8" aria-hidden="true" />}
            title={copy.noHistoryTitle}
            body={copy.noHistoryText}
          />
        ) : null}
      </section>
      </div>
    </PageShell>
  );
}
