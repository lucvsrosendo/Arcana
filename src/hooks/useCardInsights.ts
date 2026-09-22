import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LanguageCode, ReadingSlot, SpreadDefinition } from "../types/tarot";
import {
  buildCardInsightCacheKey,
  buildCardInsightPayload,
  getCardInsightFallbackText,
  type SlotInsightState,
} from "../lib/cardInsight";
import { CardInsightError, fetchCardInsight } from "../lib/fetchCardInsight";

const MAX_CONCURRENT_REQUESTS = 2;

type UseCardInsightsOptions = {
  language: LanguageCode;
  question: string;
  enabled: boolean;
  spread: SpreadDefinition;
  reading: ReadingSlot[];
  revealedSlotIds: string[];
  errorMessage: string;
};

export const useCardInsights = ({
  language,
  question,
  enabled,
  spread,
  reading,
  revealedSlotIds,
  errorMessage,
}: UseCardInsightsOptions) => {
  const [insights, setInsights] = useState<Record<string, SlotInsightState>>({});
  const cacheRef = useRef(new Map<string, string>());
  const abortControllersRef = useRef(new Map<string, AbortController>());
  const inFlightRef = useRef(0);
  const queueRef = useRef<Array<() => void>>([]);
  const previousRevealedRef = useRef<string[]>([]);
  const previousEnabledRef = useRef(false);
  const previousQuestionRef = useRef("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const committedQuestion = question.trim();

  const revealedSlots = useMemo(
    () => reading.filter((slot) => revealedSlotIds.includes(slot.id)),
    [reading, revealedSlotIds],
  );

  const runWithConcurrency = useCallback((task: () => Promise<void>) => {
    const execute = () => {
      inFlightRef.current += 1;

      void task().finally(() => {
        inFlightRef.current -= 1;
        const next = queueRef.current.shift();
        if (next) {
          next();
        }
      });
    };

    if (inFlightRef.current < MAX_CONCURRENT_REQUESTS) {
      execute();
      return;
    }

    queueRef.current.push(execute);
  }, []);

  const requestInsight = useCallback(
    (slot: ReadingSlot, insightQuestion: string, force = false) => {
      const trimmedQuestion = insightQuestion.trim();
      if (!trimmedQuestion) {
        return;
      }

      const cacheKey = buildCardInsightCacheKey(trimmedQuestion, slot);
      const cached = cacheRef.current.get(cacheKey);

      if (cached && !force) {
        setInsights((current) => ({
          ...current,
          [slot.id]: { status: "ready", text: cached },
        }));
        return;
      }

      abortControllersRef.current.get(slot.id)?.abort();
      const controller = new AbortController();
      abortControllersRef.current.set(slot.id, controller);

      const fallbackText = getCardInsightFallbackText(slot);

      setInsights((current) => ({
        ...current,
        [slot.id]: { status: "loading" },
      }));

      runWithConcurrency(async () => {
        try {
          const payload = buildCardInsightPayload(
            language,
            trimmedQuestion,
            spread,
            slot,
            revealedSlots.filter((entry) => entry.id !== slot.id),
          );
          const insight = await fetchCardInsight(payload, controller.signal);

          if (controller.signal.aborted || !isMountedRef.current) {
            return;
          }

          cacheRef.current.set(cacheKey, insight);
          setInsights((current) => ({
            ...current,
            [slot.id]: { status: "ready", text: insight },
          }));
        } catch (error) {
          if (controller.signal.aborted || !isMountedRef.current) {
            return;
          }

          const message =
            error instanceof CardInsightError
              ? error.message
              : error instanceof Error
                ? error.message
                : errorMessage;

          setInsights((current) => ({
            ...current,
            [slot.id]: {
              status: "error",
              message,
              fallbackText,
            },
          }));
        } finally {
          if (abortControllersRef.current.get(slot.id) === controller) {
            abortControllersRef.current.delete(slot.id);
          }
        }
      });
    },
    [errorMessage, language, revealedSlots, runWithConcurrency, spread],
  );

  const interpretSlot = useCallback(
    (slotId: string, force = true) => {
      const slot = reading.find((entry) => entry.id === slotId);
      if (slot && enabled && committedQuestion) {
        requestInsight(slot, committedQuestion, force);
      }
    },
    [committedQuestion, enabled, reading, requestInsight],
  );

  const interpretAllRevealed = useCallback(
    (force = true) => {
      if (!enabled || !committedQuestion) {
        return;
      }

      revealedSlots.forEach((slot) => {
        requestInsight(slot, committedQuestion, force);
      });
    },
    [committedQuestion, enabled, revealedSlots, requestInsight],
  );

  const retryInsight = useCallback(
    (slotId: string) => {
      interpretSlot(slotId, true);
    },
    [interpretSlot],
  );

  useEffect(() => {
    if (enabled && committedQuestion) {
      return;
    }

    previousEnabledRef.current = false;
    previousQuestionRef.current = "";
    previousRevealedRef.current = [];
    cacheRef.current.clear();
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    setInsights({});
  }, [committedQuestion, enabled]);

  useEffect(() => {
    if (!enabled || !committedQuestion) {
      previousRevealedRef.current = revealedSlotIds;
      return;
    }

    const enabledJustNow = !previousEnabledRef.current && enabled;
    const questionChanged = previousQuestionRef.current !== committedQuestion;
    previousEnabledRef.current = enabled;
    previousQuestionRef.current = committedQuestion;

    if (enabledJustNow || questionChanged) {
      previousRevealedRef.current = revealedSlotIds;
      interpretAllRevealed(true);
      return;
    }

    const previous = new Set(previousRevealedRef.current);
    const newlyRevealed = revealedSlotIds.filter((slotId) => !previous.has(slotId));
    previousRevealedRef.current = revealedSlotIds;

    newlyRevealed.forEach((slotId) => {
      const slot = reading.find((entry) => entry.id === slotId);
      if (slot) {
        requestInsight(slot, committedQuestion);
      }
    });

    const revealedSet = new Set(revealedSlotIds);
    setInsights((current) => {
      const next = { ...current };
      let changed = false;

      Object.keys(next).forEach((slotId) => {
        if (!revealedSet.has(slotId)) {
          delete next[slotId];
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [
    committedQuestion,
    enabled,
    interpretAllRevealed,
    reading,
    requestInsight,
    revealedSlotIds,
  ]);

  useEffect(
    () => () => {
      abortControllersRef.current.forEach((controller) => controller.abort());
      abortControllersRef.current.clear();
    },
    [],
  );

  const getSlotInsight = useCallback(
    (slot: ReadingSlot): SlotInsightState => {
      if (!enabled || !committedQuestion) {
        return { status: "idle" };
      }

      return insights[slot.id] ?? { status: "idle" };
    },
    [committedQuestion, enabled, insights],
  );

  return {
    getSlotInsight,
    interpretSlot,
    interpretAllRevealed,
    retryInsight,
  };
};
