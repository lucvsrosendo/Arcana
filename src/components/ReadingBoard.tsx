import {
  BookOpenCheck,
  Copy,
  Download,
  MessageCircle,
  RotateCcw,
  Share2,
  Shuffle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGesture } from "@use-gesture/react";
import { useDebounce } from "use-debounce";
import {
  dateLocaleByLanguage,
  getLocalizedSpreadDefinition,
  getLocalizedSpreadDefinitions,
  localizeCard,
  localizeReadingRecord,
  localizeReadingSlots,
  uiCopy,
} from "../data/i18n";
import type { TarotCardId } from "../types/tarot";
import { getHomeContent } from "../data/siteNews";
import { trackReadingFunnel } from "../lib/analytics";
import { getMoonPhaseLabel } from "../lib/moonPhase";
import { openNewsArticle } from "../lib/openNews";
import { useNews } from "../hooks/useNews";
import { createReadingRecord, findSpecialCombinations } from "../lib/history";
import { useTarot } from "../hooks/useTarot";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCardInsights } from "@/hooks/useCardInsights";
import { useToast } from "./ToastProvider";
import { Textarea } from "@/components/ui/textarea";
import { createArcanaArtwork } from "@/lib/artwork";
import { Label } from "@/components/ui/label";
import { TarotCardBack } from "../features/tarot/components/TarotCardBack";
import { TarotCardBackFace } from "../features/tarot/components/TarotCardBackFace";
import {
  ShuffleDeckSequence,
  type SlotRect,
} from "../features/tarot/components/ShuffleDeckSequence";

const TarotChat = lazy(() =>
  import("./TarotChat").then((module) => ({ default: module.TarotChat })),
);

type ReadingSlotGestureProps = {
  slotId: string;
  isRevealed: boolean;
  isAllRevealed: boolean;
  isMobile: boolean;
  onReveal: (slotId: string) => void;
  className: string;
  children: ReactNode;
};

function ReadingSlotWithGesture({
  slotId,
  isRevealed,
  isAllRevealed,
  isMobile,
  onReveal,
  className,
  children,
}: ReadingSlotGestureProps) {
  const bind = useGesture(
    {
      onDrag: ({ movement: [, my], velocity: [, vy], direction: [, dy], last }) => {
        if (!isMobile || isRevealed || isAllRevealed || !last) {
          return;
        }

        if (dy < 0 && Math.abs(my) > 48 && vy > 0.25) {
          onReveal(slotId);
        }
      },
    },
    { drag: { axis: "y", filterTaps: true } },
  );

  return (
    <li
      id={`reading-slot-${slotId}`}
      className={className}
      {...(!isRevealed && !isAllRevealed && isMobile ? bind() : {})}
    >
      {children}
    </li>
  );
}

type VirtualDeckProps = {
  cards: ReturnType<typeof localizeCard>[];
  selectedDeckCardIds: string[];
  isAllRevealed: boolean;
  nextPosition: ReturnType<typeof getLocalizedSpreadDefinition>["positions"][number] | undefined;
  copy: (typeof uiCopy)[keyof typeof uiCopy];
  onSelect: (cardId: string) => void;
};

const VirtualReadingDeck = memo(function VirtualReadingDeck({
  cards,
  selectedDeckCardIds,
  isAllRevealed,
  nextPosition,
  copy,
  onSelect,
}: VirtualDeckProps) {
  const visualCards = useMemo(
    () =>
      cards.map((card) => ({
        id: card.id,
        name: card.name,
        number: card.number,
        symbol: card.artwork.symbol,
        image: card.image,
        palette: card.artwork.palette,
      })),
    [cards],
  );

  return (
    <div className="free-tarot-deck reading-deck-grid" aria-label={copy.deckAria}>
      {visualCards.map((card, index) => {
        const selectedIndex = selectedDeckCardIds.indexOf(card.id);

        return (
          <TarotCardBack
            key={card.id}
            card={card}
            index={index}
            isLocked={isAllRevealed}
            isSelected={selectedIndex !== -1}
            selectedOrder={selectedIndex === -1 ? undefined : selectedIndex + 1}
            ariaLabel={
              nextPosition
                ? `${copy.chooseCardAriaPrefix} ${index + 1} ${copy.chooseCardForAria} ${nextPosition.title}`
                : `${copy.chooseCardAriaPrefix} ${index + 1}: ${copy.selectedCardAriaSuffix}`
            }
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
});

export function ReadingBoard() {
  const [focusedChatSlotId, setFocusedChatSlotId] = useState<string | null>(null);
  const [committedQuestion, setCommittedQuestion] = useState("");
  const [shuffleGeometry, setShuffleGeometry] = useState<{
    slotRects: SlotRect[];
    stageSize: { width: number; height: number };
  } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const { pushToast } = useToast();
  const reading = useTarot((state) => state.reading);
  const deck = useTarot((state) => state.deck);
  const spreadId = useTarot((state) => state.spreadId);
  const revealedSlotIds = useTarot((state) => state.revealedSlotIds);
  const selectedDeckCardIds = useTarot((state) => state.selectedDeckCardIds);
  const isShuffling = useTarot((state) => state.isShuffling);
  const dailyCard = useTarot((state) => state.dailyCard);
  const dailyStreak = useTarot((state) => state.dailyStreak);
  const language = useTarot((state) => state.language);
  const learningMode = useTarot((state) => state.learningMode);
  const reversalsMode = useTarot((state) => state.reversalsMode);
  const storeReadingQuestion = useTarot((state) => state.readingQuestion);
  const drawReading = useTarot((state) => state.drawReading);
  const finishShuffle = useTarot((state) => state.finishShuffle);
  const resetReading = useTarot((state) => state.resetReading);
  const setSpread = useTarot((state) => state.setSpread);
  const chooseDeckCard = useTarot((state) => state.chooseDeckCard);
  const revealCard = useTarot((state) => state.revealCard);
  const saveCurrentReading = useTarot((state) => state.saveCurrentReading);
  const toggleLearningMode = useTarot((state) => state.toggleLearningMode);
  const toggleReversalsMode = useTarot((state) => state.toggleReversalsMode);
  const setReadingQuestion = useTarot((state) => state.setReadingQuestion);

  const [readingQuestion, setLocalReadingQuestion] = useState(storeReadingQuestion);
  const copy = uiCopy[language];
  const [debouncedReadingQuestion] = useDebounce(readingQuestion, 700);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setLocalReadingQuestion(storeReadingQuestion);
  }, [storeReadingQuestion]);
  const isMobile = useIsMobile();
  const homeLabels = getHomeContent(language);
  const dateLocale = dateLocaleByLanguage[language];
  const spread = useMemo(
    () => getLocalizedSpreadDefinition(spreadId, language),
    [spreadId, language],
  );
  const spreadOptions = useMemo(
    () => getLocalizedSpreadDefinitions(language),
    [language],
  );
  const localizedReading = useMemo(
    () => localizeReadingSlots(reading, spreadId, language),
    [reading, spreadId, language],
  );
  const hasReadingQuestion = readingQuestion.trim().length > 0;
  const interpretationEnabled = committedQuestion.length > 0;
  const localizedDeck = useMemo(
    () => deck.map((card) => localizeCard(card, language)),
    [deck, language],
  );
  const localizedDailyCard = useMemo(
    () => localizeCard(dailyCard, language),
    [dailyCard, language],
  );
  const exportLabels = {
    documentTitle: copy.exportDocumentTitle,
    combinationsTitle: copy.combinations,
    shareTitle: copy.shareTitle,
    imageFilename: copy.imageFilename,
    pdfFilename: copy.pdfFilename,
    dateLocale,
    reversedLabel:
      language === "en" ? "reversed" : language === "es" ? "invertida" : "invertida",
  };
  const revealedCount = revealedSlotIds.length;
  const isAllRevealed = revealedCount === reading.length;
  const waitingForCard = interpretationEnabled && !isAllRevealed;
  const { getSlotInsight, interpretSlot, interpretAllRevealed, retryInsight } = useCardInsights({
    language,
    question: committedQuestion,
    enabled: interpretationEnabled,
    spread,
    reading: localizedReading,
    revealedSlotIds,
    errorMessage: copy.cardInsightError,
  });
  const isDailyAdviceSpread = spreadId === "daily-advice";
  const nextPosition = spread.positions[revealedCount];
  const combinations = useMemo(
    () => findSpecialCombinations(reading, language),
    [reading, language],
  );
  const { news: allSiteNews } = useNews(language);
  const latestSiteNews = useMemo(
    () => allSiteNews.slice(0, 3),
    [allSiteNews],
  );

  const previousAllRevealedRef = useRef(false);
  const pendingQuestionCommitRef = useRef(false);

  useEffect(() => {
    setFocusedChatSlotId((slotId) =>
      slotId && revealedSlotIds.includes(slotId) ? slotId : null,
    );
  }, [revealedSlotIds]);

  useEffect(() => {
    if (isAllRevealed && !previousAllRevealedRef.current && reading.length > 0) {
      trackReadingFunnel("all_revealed", { spreadId, cardCount: reading.length });
    }

    previousAllRevealedRef.current = isAllRevealed;
  }, [isAllRevealed, reading.length, spreadId]);

  const hasMountedShuffleRef = useRef(false);
  useEffect(() => {
    if (!hasMountedShuffleRef.current) {
      hasMountedShuffleRef.current = true;
      return;
    }
    if (!isShuffling) {
      trackReadingFunnel("shuffle_complete", { spreadId });
      if (pendingQuestionCommitRef.current) {
        pendingQuestionCommitRef.current = false;
        const question = readingQuestion.trim();
        if (question) {
          setCommittedQuestion(question);
        }
      }
    }
  }, [isShuffling, readingQuestion, spreadId]);

  useLayoutEffect(() => {
    if (!isShuffling) {
      setShuffleGeometry(null);
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const stageBox = stage.getBoundingClientRect();
    const cardNodes = stage.querySelectorAll<HTMLElement>(".reading-stage-card");
    const slotRects: SlotRect[] = Array.from(cardNodes).map((node) => {
      const box = node.getBoundingClientRect();
      return {
        x: box.left - stageBox.left,
        y: box.top - stageBox.top,
        width: box.width,
        height: box.height,
      };
    });

    setShuffleGeometry({
      slotRects,
      stageSize: { width: stageBox.width, height: stageBox.height },
    });
  }, [isShuffling, reading.length]);

  const handleActivateInterpretation = () => {
    const question = readingQuestion.trim();
    if (!question || isShuffling) {
      return;
    }

    setReadingQuestion(question);
    const readingNotStarted = revealedSlotIds.length === 0;

    if (readingNotStarted) {
      pendingQuestionCommitRef.current = true;
      drawReading(undefined, { preserveQuestion: true });
      return;
    }

    const wasAlreadyActive = interpretationEnabled && committedQuestion === question;
    setCommittedQuestion(question);

    if (wasAlreadyActive) {
      interpretAllRevealed(true);
    }
  };
  const createCurrentRecord = () => {
    setReadingQuestion(readingQuestion.trim());
    const record =
      saveCurrentReading() ??
      createReadingRecord(
        reading,
        spreadId,
        undefined,
        language,
        readingQuestion.trim() || undefined,
      );
    return localizeReadingRecord(record, language);
  };

  const handleShare = async () => {
    try {
      const { shareReadingImage } = await import("../lib/exportReading");
      await shareReadingImage(createCurrentRecord(), exportLabels);
      pushToast(toastCopy.image, "success");
    } catch {
      pushToast(toastCopy.error, "error");
    }
  };

  const handlePdf = async () => {
    try {
      const { downloadReadingPdf } = await import("../lib/exportReading");
      await downloadReadingPdf(createCurrentRecord(), exportLabels);
      pushToast(toastCopy.pdf, "success");
    } catch {
      pushToast(toastCopy.error, "error");
    }
  };

  const handleCopySummary = async () => {
    try {
      const { copyReadingSummary } = await import("../lib/exportReading");
      await copyReadingSummary(createCurrentRecord(), exportLabels);
      pushToast(toastCopy.copied, "success");
    } catch {
      pushToast(toastCopy.error, "error");
    }
  };

  const getDailyAdviceText = (slot: (typeof localizedReading)[number]) =>
    slot.card.dailyAdvice ?? slot.card.meanings.general;
  const toastCopy =
    language === "en"
      ? {
          image: "Image export started.",
          pdf: "PDF generated.",
          copied: "Summary copied.",
          error: "Could not complete export.",
        }
      : language === "es"
        ? {
            image: "Exportacion de imagen iniciada.",
            pdf: "PDF generado.",
            copied: "Resumen copiado.",
            error: "No se pudo completar la exportacion.",
          }
        : {
            image: "Exportacao de imagem iniciada.",
            pdf: "PDF gerado.",
            copied: "Resumo copiado.",
            error: "Não foi possível concluir a exportação.",
          };

  const handleCardReferenceClick = useCallback((slotId: string) => {
    setFocusedChatSlotId(slotId);
    document
      .getElementById(`reading-slot-${slotId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <PageShell className="reading-page">
      <header className="reading-hero-bar">
        <div className="reading-title-block">
          <h1 className="font-display text-architectural">{copy.reading}</h1>
        </div>
        <div className="reading-hero-actions">
          <button
            type="button"
            className="reading-new-button"
            onClick={() => {
              pendingQuestionCommitRef.current = false;
              setCommittedQuestion("");
              drawReading();
            }}
            disabled={isShuffling}
          >
            <Shuffle className="reading-cta-icon" aria-hidden="true" />
            {copy.newReading}
          </button>
        </div>
      </header>

      <section className="reading-shell">
        <div className="reading-main-column">
          <div className="free-tarot-game reading-main-panel">
              <nav className="reading-mode-tabs" aria-label={copy.activeReading}>
                {spreadOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => {
                      pendingQuestionCommitRef.current = false;
                      setCommittedQuestion("");
                      setSpread(option.id);
                    }}
                    className={option.id === spreadId ? "is-active" : ""}
                    disabled={isShuffling}
                  >
                    {option.title}
                  </button>
                ))}
              </nav>

              <div className="free-tarot-game-header reading-stage-header">
                <div>
                  <p className="text-minimal text-muted-foreground">{copy.activeReading}</p>
                  <h2 className="font-display text-architectural">
                    {isShuffling
                      ? copy.shuffling
                      : isAllRevealed
                        ? copy.allRevealed
                        : nextPosition
                          ? `${revealedCount + 1}/${reading.length} - ${nextPosition.title}`
                          : spread.title}
                  </h2>
                  <p>
                    {isShuffling
                      ? copy.cardsSettling
                      : `${spread.description} ${copy.meditationText}`}
                  </p>
                </div>
              </div>

              <div className="reading-question-panel">
                <Label htmlFor="reading-question">{copy.readingQuestionLabel}</Label>
                <Textarea
                  id="reading-question"
                  value={readingQuestion}
                  onChange={(event) => setLocalReadingQuestion(event.target.value)}
                  placeholder={copy.readingQuestionPlaceholder}
                  rows={2}
                  className="reading-question-input"
                  disabled={isShuffling || (interpretationEnabled && waitingForCard)}
                />
                <div className="reading-question-footer">
                  <p className="reading-question-hint">
                    {isShuffling
                      ? copy.cardsSettling
                      : waitingForCard
                        ? copy.readingChooseCard
                        : interpretationEnabled
                          ? copy.readingQuestionCommitted
                          : copy.readingQuestionHint}
                  </p>
                  <div className="reading-question-actions">
                    <Button
                      type="button"
                      variant={interpretationEnabled ? "outline" : "default"}
                      className={[
                        "reading-interpret-button",
                        interpretationEnabled ? "is-quiet" : "is-gilt",
                      ].join(" ")}
                      onClick={handleActivateInterpretation}
                      disabled={!hasReadingQuestion || isShuffling}
                    >
                      {revealedSlotIds.length === 0 ? (
                        <>
                          <Shuffle className="reading-cta-icon" aria-hidden="true" />
                          {copy.startAndShuffle}
                        </>
                      ) : (
                        copy.interpretRevealedCards
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="reading-reset-button"
                      onClick={() => {
                        pendingQuestionCommitRef.current = false;
                        setCommittedQuestion("");
                        resetReading();
                      }}
                      disabled={isShuffling}
                      title={copy.resetTitle}
                    >
                      <RotateCcw className="reading-cta-icon" aria-hidden="true" />
                      {copy.reset}
                    </Button>
                  </div>
                </div>
              </div>

              {waitingForCard && !isShuffling ? (
                <p className="reading-choose-card-banner" role="status">
                  {copy.readingChooseCard}
                </p>
              ) : null}

              <div
                ref={stageRef}
                className={[
                  "reading-stage",
                  isShuffling && shuffleGeometry ? "is-shuffling" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <ol
                  className={[
                    "reading-stage-grid",
                    reading.length === 3 ? "is-three-card" : "",
                    reading.length <= 1 ? "is-single-card" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {localizedReading.map((slot) => {
                    const isRevealed = revealedSlotIds.includes(slot.id);
                    const slotInsight = getSlotInsight(slot);
                    const slotText = !isRevealed
                      ? slot.position.prompt
                      : !interpretationEnabled
                        ? slot.reversed
                          ? slot.card.meanings.shadow
                          : slot.card.meanings.general
                        : slotInsight.status === "ready"
                          ? slotInsight.text
                          : slotInsight.status === "error"
                            ? slotInsight.message
                            : copy.cardInsightLoading;

                    return (
                      <ReadingSlotWithGesture
                        key={slot.id}
                        slotId={slot.id}
                        isRevealed={isRevealed}
                        isAllRevealed={isAllRevealed}
                        isMobile={isMobile}
                        onReveal={revealCard}
                        className={[
                          "reading-stage-slot",
                          isRevealed ? "is-filled" : "",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "reading-stage-card",
                            isShuffling && shuffleGeometry
                              ? "is-hidden-for-shuffle"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {isRevealed ? (
                            <motion.img
                              src={slot.card.image}
                              alt={`${copy.cardAltPrefix} ${slot.card.name}${slot.reversed ? ` (${language === "en" ? "reversed" : "invertida"})` : ""}`}
                              width={540}
                              height={810}
                              loading="eager"
                              decoding="async"
                              initial={
                                reduceMotion
                                  ? false
                                  : { opacity: 0, rotateY: 90, scale: 0.94 }
                              }
                              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
                              }
                              className={[
                                "reading-reveal-image",
                                slot.reversed ? "is-reversed" : "",
                              ].join(" ")}
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = createArcanaArtwork({
                                  name: slot.card.name,
                                  number: slot.card.number,
                                  artwork: slot.card.artwork,
                                });
                              }}
                            />
                          ) : (
                            <TarotCardBackFace />
                          )}
                        </div>
                        {isRevealed ? (
                          <p className="reading-slot-position">{slot.position.title}</p>
                        ) : null}
                        <h3>{isRevealed ? slot.card.name : slot.position.title}</h3>
                        <p
                          className={[
                            "reading-slot-text",
                            isRevealed &&
                            interpretationEnabled &&
                            (slotInsight.status === "loading" || slotInsight.status === "idle")
                              ? "is-loading"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {slotText}
                        </p>
                        {isRevealed &&
                        interpretationEnabled &&
                        slotInsight.status === "idle" ? (
                          <div className="reading-slot-insight-actions">
                            <button
                              type="button"
                              className="reading-slot-insight-retry"
                              onClick={() => interpretSlot(slot.id)}
                            >
                              {copy.cardInsightGenerate}
                            </button>
                          </div>
                        ) : null}
                        {isRevealed &&
                        interpretationEnabled &&
                        slotInsight.status === "error" ? (
                          <div className="reading-slot-insight-actions">
                            <p className="reading-slot-insight-notice">
                              {copy.cardInsightFallbackNotice}
                            </p>
                            <button
                              type="button"
                              className="reading-slot-insight-retry"
                              onClick={() => retryInsight(slot.id)}
                            >
                              {copy.cardInsightRetry}
                            </button>
                          </div>
                        ) : null}
                        {learningMode ? (
                          <p className="reading-learning-note">
                            <strong>{copy.learningMode}:</strong> {slot.position.learningNote}
                          </p>
                        ) : null}
                        {isRevealed ? (
                          <button
                            type="button"
                            onClick={() => {
                              setFocusedChatSlotId(slot.id);
                              document
                                .querySelector(".reading-chat-below")
                                ?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="card-chat-button"
                          >
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            {copy.askDeeperInOracle}
                          </button>
                        ) : null}
                      </ReadingSlotWithGesture>
                    );
                  })}
                </ol>

                {isShuffling && shuffleGeometry ? (
                  <ShuffleDeckSequence
                    slotRects={shuffleGeometry.slotRects}
                    stageSize={shuffleGeometry.stageSize}
                    onComplete={finishShuffle}
                    ariaLabel={copy.shuffling}
                  />
                ) : null}
              </div>

              <details
                className={[
                  "reading-deck-drawer",
                  waitingForCard ? "is-awaiting-choice" : "",
                  isShuffling ? "is-shuffling" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                open={!isShuffling && (!isAllRevealed || waitingForCard)}
                aria-disabled={isShuffling || undefined}
              >
                <summary>
                  <span>{copy.deckAria}</span>
                  <strong>
                    {revealedCount}/{reading.length}
                  </strong>
                </summary>
                <motion.div
                  initial={false}
                  animate={{ opacity: isShuffling ? 0.45 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <VirtualReadingDeck
                    cards={localizedDeck}
                    selectedDeckCardIds={selectedDeckCardIds}
                    isAllRevealed={isAllRevealed || isShuffling}
                    nextPosition={nextPosition}
                    copy={copy}
                    onSelect={(cardId) => chooseDeckCard(cardId as TarotCardId)}
                  />
                </motion.div>
              </details>

              {isDailyAdviceSpread && isAllRevealed ? (
                <div className="daily-advice-box">
                  <p className="label-text second">{copy.dailyAdvice}</p>
                  {localizedReading.map((slot) => (
                    <p key={slot.id} className="daily-advice-text">
                      {getDailyAdviceText(slot)}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

          <div className="reading-chat-below">
            <Suspense
              fallback={
                <section className="chat-panel">
                  <div className="chat-header">
                    <p className="label-text second">{copy.loading}</p>
                  </div>
                </section>
              }
            >
              <TarotChat
                language={language}
                copy={copy}
                spread={spread}
                reading={localizedReading}
                revealedSlotIds={revealedSlotIds}
                focusedSlotId={focusedChatSlotId}
                learningMode={learningMode}
                question={debouncedReadingQuestion}
                onCardReferenceClick={handleCardReferenceClick}
              />
            </Suspense>
          </div>
        </div>

        <aside className="reading-side-column">
          <div className="reading-rail">
            <section className="reading-rail-block reading-daily" aria-label={copy.dailyCard}>
              <header className="reading-rail-head">
                <p className="reading-rail-kicker">{copy.dailyCard}</p>
                <p className="reading-rail-meta">
                  <span>{getMoonPhaseLabel(language)}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {copy.streakLabel} {dailyStreak}
                  </span>
                </p>
              </header>
              <div className="daily-card-display">
                <img
                  src={localizedDailyCard.image}
                  alt={`${copy.dailyCard}: ${localizedDailyCard.name}`}
                  width={540}
                  height={810}
                  loading="lazy"
                  decoding="async"
                />
                <div className="daily-card-copy">
                  <h3 className="font-display">{localizedDailyCard.name}</h3>
                  <p>
                    {localizedDailyCard.dailyAdvice ?? localizedDailyCard.meanings.general}
                  </p>
                </div>
              </div>
            </section>

            {latestSiteNews.length > 0 ? (
              <section className="reading-rail-block reading-news" aria-label={homeLabels.newsSidebarTitle}>
                <header className="reading-rail-head">
                  <p className="reading-rail-kicker">{homeLabels.newsSidebarTitle}</p>
                </header>
                <div className="reading-news-list">
                  {latestSiteNews.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="reading-news-item is-clickable"
                      aria-label={`${copy.newsOpenArticle}: ${item.title}`}
                      onClick={() => openNewsArticle(item.id)}
                    >
                      <p className="reading-news-meta">
                        <span>{item.tag}</span>
                        <time dateTime={item.date}>{item.date}</time>
                      </p>
                      <h3>{item.title}</h3>
                    </button>
                  ))}
                </div>
                <p className="reading-news-hint">{homeLabels.newsSidebarHint}</p>
              </section>
            ) : null}

            <section className="reading-rail-block reading-progress-panel" aria-label={copy.state}>
              <header className="reading-rail-head">
                <p className="reading-rail-kicker">{copy.state}</p>
              </header>
              <div className="reading-progress-body">
                <p className="reading-progress-count">
                  <span className="reading-progress-fraction">
                    {revealedCount}
                    <span aria-hidden="true">/</span>
                    {reading.length}
                  </span>
                  <span className="reading-progress-caption">{copy.activeReading}</span>
                </p>
                <div className="reading-mode-toggles">
                  <button
                    type="button"
                    onClick={toggleLearningMode}
                    className={
                      learningMode
                        ? "reading-mode-toggle is-active"
                        : "reading-mode-toggle"
                    }
                    title={copy.learningMode}
                    aria-label={copy.learningMode}
                    aria-pressed={learningMode}
                  >
                    <BookOpenCheck className="reading-cta-icon" aria-hidden="true" />
                    <span>{copy.learningMode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleReversalsMode}
                    className={
                      reversalsMode
                        ? "reading-mode-toggle is-active"
                        : "reading-mode-toggle"
                    }
                    title={copy.reversalsMode}
                    aria-label={copy.reversalsMode}
                    aria-pressed={reversalsMode}
                  >
                    <RotateCcw className="reading-cta-icon" aria-hidden="true" />
                    <span>{copy.reversalsMode}</span>
                  </button>
                </div>
              </div>
              <div className="reading-progress-bar" aria-hidden="true">
                <div style={{ width: `${(revealedCount / reading.length) * 100}%` }} />
              </div>
            </section>

            <section className="reading-rail-block reading-export-panel" aria-label={copy.export}>
              <header className="reading-rail-head">
                <p className="reading-rail-kicker">{copy.export}</p>
              </header>
              <div className="reading-export-list">
                <button
                  type="button"
                  className="reading-export-action"
                  onClick={handleShare}
                  disabled={!isAllRevealed}
                >
                  <Share2 className="reading-cta-icon" aria-hidden="true" />
                  {copy.image}
                </button>
                <button
                  type="button"
                  className="reading-export-action"
                  onClick={handlePdf}
                  disabled={!isAllRevealed}
                >
                  <Download className="reading-cta-icon" aria-hidden="true" />
                  {copy.pdf}
                </button>
                <button
                  type="button"
                  className="reading-export-action"
                  onClick={handleCopySummary}
                  disabled={!isAllRevealed}
                >
                  <Copy className="reading-cta-icon" aria-hidden="true" />
                  {copy.txt}
                </button>
              </div>
            </section>

            {combinations.length > 0 ? (
              <section className="reading-rail-block reading-combinations" aria-label={copy.combinations}>
                <header className="reading-rail-head">
                  <p className="reading-rail-kicker">{copy.combinations}</p>
                </header>
                <ul className="reading-combinations-list">
                  {combinations.map((combination) => (
                    <li key={combination}>{combination}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
