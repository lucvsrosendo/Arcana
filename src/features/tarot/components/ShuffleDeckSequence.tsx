import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import {
  buildShufflePlan,
  getAbsorbPose,
  getBridgePose,
  getExtraBirthPose,
  getInterleavedRiffleOrder,
  getPackedPose,
  getPackOrigin,
  getRiffleFlightPose,
  getRiffleLandPose,
  getSlotPose,
  getSplitPose,
  getSquaredPose,
  offsetPose,
  poseToMotion,
  type ShuffleCardPlan,
  type SlotRect,
} from "../shuffleChoreography";
import {
  SHUFFLE_CARD_COUNT,
  SHUFFLE_REDUCED_MS,
  SHUFFLE_REDUCED_SEGMENTS_MS,
  SHUFFLE_SEGMENTS_MS,
  SHUFFLE_SEQUENCE_MS,
} from "../shuffleTiming";
import { TarotCardBackFace } from "./TarotCardBackFace";

export { SHUFFLE_REDUCED_MS, SHUFFLE_SEQUENCE_MS } from "../shuffleTiming";
export type { SlotRect };

type ShuffleDeckSequenceProps = {
  slotRects: SlotRect[];
  stageSize: { width: number; height: number };
  cardCount?: number;
  seed?: number;
  onComplete: () => void;
  ariaLabel?: string;
};

const easeSoft = [0.22, 1, 0.36, 1] as const;
const easeCard = [0.33, 1, 0.32, 1] as const;

const cardSelector = (index: number) => `[data-shuffle-card="${index}"]`;

async function animateCardsToPose(
  plan: ShuffleCardPlan[],
  getPose: (card: ShuffleCardPlan) => ReturnType<typeof poseToMotion>,
  options: {
    duration: number;
    stagger?: number;
    order?: number[];
    ease?: readonly [number, number, number, number];
  },
) {
  const order = options.order ?? plan.map((card) => card.index);
  const stagger = options.stagger ?? 0;

  await animate(
    order.map((index, step) => {
      const card = plan[index] ?? plan.find((entry) => entry.index === index)!;
      return [
        cardSelector(index),
        getPose(card),
        {
          duration: options.duration,
          ease: options.ease ?? easeCard,
          at: step * stagger,
        },
      ] as const;
    }),
  );
}

export function ShuffleDeckSequence({
  slotRects,
  stageSize,
  cardCount = SHUFFLE_CARD_COUNT,
  seed,
  onComplete,
  ariaLabel = "Shuffling",
}: ShuffleDeckSequenceProps) {
  const reduceMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  const animationSeed = useMemo(
    () => seed ?? Math.floor(Math.random() * 10_000),
    [seed],
  );

  const cardSize = useMemo(() => {
    const sample = slotRects[0];
    if (sample && sample.width > 0 && sample.height > 0) {
      return { width: sample.width, height: sample.height };
    }
    return { width: 96, height: 144 };
  }, [slotRects]);

  const origin = useMemo(
    () => getPackOrigin(stageSize, cardSize),
    [cardSize, stageSize],
  );

  const plan = useMemo(
    () => buildShufflePlan(Math.max(cardCount, slotRects.length), slotRects.length),
    [cardCount, slotRects.length],
  );
  const riffleOrder = useMemo(() => getInterleavedRiffleOrder(plan), [plan]);

  const initialPoses = useMemo(
    () =>
      plan.map((card) => {
        if (card.isSlotCard && card.slotIndex !== null && slotRects[card.slotIndex]) {
          return getSlotPose(slotRects[card.slotIndex]!);
        }
        return getExtraBirthPose(card.index, origin, animationSeed);
      }),
    [animationSeed, origin, plan, slotRects],
  );

  useEffect(() => {
    completedRef.current = false;
    let cancelled = false;

    const finish = () => {
      if (cancelled || completedRef.current) {
        return;
      }
      completedRef.current = true;
      onCompleteRef.current();
    };

    const atOrigin =
      (getRelative: (card: ShuffleCardPlan) => ReturnType<typeof getPackedPose>) =>
      (card: ShuffleCardPlan) =>
        poseToMotion(offsetPose(origin, getRelative(card)));

    const run = async () => {
      // Snap to measured/born poses without visible transition.
      await animate(
        plan.map((card) => [
          cardSelector(card.index),
          poseToMotion(initialPoses[card.index]!),
          { duration: 0 },
        ]),
      );
      if (cancelled) return;

      if (reduceMotion) {
        await animateCardsToPose(plan, atOrigin((card) => getPackedPose(card.index, animationSeed)), {
          duration: SHUFFLE_REDUCED_SEGMENTS_MS.gather / 1000,
          stagger: 0.008,
        });
        if (cancelled) return;

        await animateCardsToPose(plan, atOrigin((card) => getSplitPose(card, animationSeed)), {
          duration: SHUFFLE_REDUCED_SEGMENTS_MS.split / 1000,
          stagger: 0.01,
        });
        if (cancelled) return;

        await animate(
          plan.map((card, step) => {
            if (card.isSlotCard && card.slotIndex !== null && slotRects[card.slotIndex]) {
              return [
                cardSelector(card.index),
                poseToMotion(getSlotPose(slotRects[card.slotIndex]!)),
                {
                  duration: SHUFFLE_REDUCED_SEGMENTS_MS.close / 1000,
                  ease: easeSoft,
                  at: step * 0.01,
                },
              ] as const;
            }
            return [
              cardSelector(card.index),
              poseToMotion(getAbsorbPose(card.index, origin, animationSeed)),
              {
                duration: SHUFFLE_REDUCED_SEGMENTS_MS.close / 1000,
                ease: easeSoft,
                at: step * 0.008,
              },
            ] as const;
          }),
        );
        if (cancelled) return;
        finish();
        return;
      }

      // 1) Gather into a packed deck at stage center
      await animateCardsToPose(plan, atOrigin((card) => getPackedPose(card.index, animationSeed)), {
        duration: SHUFFLE_SEGMENTS_MS.gather / 1000,
        stagger: 0.014,
        ease: easeSoft,
      });
      if (cancelled) return;

      // 2) Split
      await animateCardsToPose(plan, atOrigin((card) => getSplitPose(card, animationSeed)), {
        duration: SHUFFLE_SEGMENTS_MS.split / 1000,
        stagger: 0.014,
        ease: easeSoft,
      });
      if (cancelled) return;

      // 3) Riffle
      const riffleBudget = SHUFFLE_SEGMENTS_MS.riffle / 1000;
      const riffleStagger = Math.min(0.07, riffleBudget / Math.max(plan.length, 1));
      const flightDuration = Math.min(0.28, riffleBudget * 0.35);

      await animate(
        riffleOrder.flatMap((index, step) => {
          const card = plan[index]!;
          const at = step * riffleStagger;
          return [
            [
              cardSelector(index),
              poseToMotion(offsetPose(origin, getRiffleFlightPose(card, animationSeed))),
              { duration: flightDuration, ease: easeCard, at },
            ] as const,
            [
              cardSelector(index),
              poseToMotion(offsetPose(origin, getRiffleLandPose(card, animationSeed))),
              {
                duration: Math.max(0.22, flightDuration * 0.85),
                ease: easeSoft,
                at: at + flightDuration * 0.55,
              },
            ] as const,
          ];
        }),
      );
      if (cancelled) return;

      // 4) Bridge then settle
      await animateCardsToPose(
        plan,
        atOrigin((card) => getBridgePose(card, plan.length, animationSeed)),
        {
          duration: (SHUFFLE_SEGMENTS_MS.bridge / 1000) * 0.55,
          stagger: 0.01,
          order: riffleOrder,
          ease: easeSoft,
        },
      );
      if (cancelled) return;

      await animateCardsToPose(
        plan,
        atOrigin((card) => getSquaredPose(card.riffleOrder, animationSeed)),
        {
          duration: (SHUFFLE_SEGMENTS_MS.bridge / 1000) * 0.45,
          stagger: 0.008,
          order: riffleOrder,
          ease: easeCard,
        },
      );
      if (cancelled) return;

      // 5) Square
      await animateCardsToPose(plan, atOrigin((card) => getSquaredPose(card.index, animationSeed)), {
        duration: SHUFFLE_SEGMENTS_MS.square / 1000,
        stagger: 0.006,
        ease: easeSoft,
      });
      if (cancelled) return;

      // 6) Slot cards return home; extras absorb into the pack
      await animate(
        plan.map((card, step) => {
          if (card.isSlotCard && card.slotIndex !== null && slotRects[card.slotIndex]) {
            return [
              cardSelector(card.index),
              poseToMotion(getSlotPose(slotRects[card.slotIndex]!)),
              {
                duration: SHUFFLE_SEGMENTS_MS.deal / 1000,
                ease: easeSoft,
                at: step * 0.02,
              },
            ] as const;
          }
          return [
            cardSelector(card.index),
            poseToMotion(getAbsorbPose(card.index, origin, animationSeed)),
            {
              duration: (SHUFFLE_SEGMENTS_MS.deal / 1000) * 0.7,
              ease: easeSoft,
              at: step * 0.012,
            },
          ] as const;
        }),
      );
      if (cancelled) return;

      finish();
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    animationSeed,
    initialPoses,
    origin,
    plan,
    reduceMotion,
    riffleOrder,
    slotRects,
  ]);

  return (
    <div
      className="shuffle-overlay"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      style={{ width: stageSize.width, height: stageSize.height }}
    >
      <div className="shuffle-overlay-scene" aria-hidden="true">
        {plan.map((card) => {
          const initial = initialPoses[card.index]!;

          return (
            <motion.div
              key={card.index}
              data-shuffle-card={card.index}
              className={[
                "shuffle-card-3d",
                "is-flight-ready",
                card.isSlotCard ? "is-slot-card" : "is-extra-card",
              ].join(" ")}
              initial={poseToMotion(initial)}
              style={{
                width: cardSize.width,
                height: cardSize.height,
                zIndex: initial.zIndex,
              }}
            >
              <TarotCardBackFace className="shuffle-card-face" />
              <span className="shuffle-card-edge" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
