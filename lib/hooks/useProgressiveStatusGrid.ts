"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

// Seeded PRNG (mulberry32) — produces the same sequence for the same seed
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function shuffleArray<T>(array: T[], seed?: string): T[] {
  const shuffled = [...array];
  const rand = seed ? seededRandom(hashString(seed)) : Math.random;
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type UseProgressiveStatusGridArgs<TAns extends Record<string, any>> = {
  itemsBase: string[];
  // key inside your answers object where the grid responses live: "d1a", "d2a", ...
  gridKey: string;
  // full answers object + setter from your page
  ans: TAns;
  setAns: Dispatch<SetStateAction<TAns>>;
  // callback when grid is touched (for validation)
  markTouched?: (fieldName: string) => void;
  // optional behaviors
  shuffle?: boolean;
  shuffleSeed?: string; // stable seed for consistent shuffle order (e.g. surveyId + gridKey)
  autoAdvanceDelayMs?: number;
  transitionMs?: number;
  enableLabelDriftWarn?: boolean;
};

export function useProgressiveStatusGrid<TAns extends Record<string, any>>({
  itemsBase,
  gridKey,
  ans,
  setAns,
  markTouched,
  shuffle = true,
  shuffleSeed,
  autoAdvanceDelayMs = 500,
  transitionMs = 250,
  enableLabelDriftWarn = true,
}: UseProgressiveStatusGridArgs<TAns>) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const initializedRef = useRef(false);

  const ansRef = useRef<TAns>(ans);
  const currentIndexRef = useRef<number>(0);

  // Keep refs in sync with state
  useEffect(() => {
    ansRef.current = ans;
  }, [ans]);

  useEffect(() => {
    currentIndexRef.current = currentItemIndex;
  }, [currentItemIndex]);

  // Shuffle items once on mount (stable across re-renders AND page reloads when seeded)
  const items = useMemo(
    () => (shuffle ? shuffleArray(itemsBase, shuffleSeed) : [...itemsBase]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shuffle, itemsBase, shuffleSeed]
  );

  // On mount: if returning user has partial answers, start at the first unanswered item
  useEffect(() => {
    if (initializedRef.current) return;
    const grid = (ans as any)?.[gridKey] || {};
    const answeredKeys = Object.keys(grid);
    if (answeredKeys.length > 0 && answeredKeys.length < items.length) {
      const firstUnanswered = items.findIndex(itm => !grid[itm]);
      if (firstUnanswered !== -1) {
        setCurrentItemIndex(firstUnanswered);
      }
      initializedRef.current = true;
    } else if (answeredKeys.length > 0) {
      initializedRef.current = true;
    }
  }, [ans, gridKey, items]);

  // Label drift diagnostic (dev safety net)
  useEffect(() => {
    if (!enableLabelDriftWarn) return;
    const grid = (ans as any)?.[gridKey] || {};
    const keys = Object.keys(grid);
    const extra = keys.filter((k) => !itemsBase.includes(k));
    if (extra.length) {
      console.warn(`[${gridKey}] label mismatch: saved keys not in current items:`, extra);
    }
  }, [ans, gridKey, itemsBase, enableLabelDriftWarn]);

  const goToItem = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentItemIndex(index);
      setTimeout(() => setIsTransitioning(false), transitionMs);
    }, autoAdvanceDelayMs);
  };

  const setStatus = (item: string, status: string) => {
    setAns((prev: any) => ({
      ...prev,
      [gridKey]: { ...(prev?.[gridKey] || {}), [item]: status },
    }));

    // Call markTouched if provided
    if (markTouched) {
      markTouched(gridKey);
    }

    // ALWAYS advance on any click - user can use dots to go back if needed
    setIsTransitioning(true);

    setTimeout(() => {
      const latest = ansRef.current as any;
      const currentIdx = currentIndexRef.current;
      const grid = latest?.[gridKey] || {};

      // Next unanswered after current position
      const nextAfter = items.findIndex((itm, idx) => idx > currentIdx && !grid[itm]);

      if (nextAfter !== -1) {
        // Found unanswered item ahead — go there
        setCurrentItemIndex(nextAfter);
      } else {
        // Nothing unanswered ahead — check if there are any unanswered at all
        const firstUnanswered = items.findIndex((itm) => !grid[itm]);
        if (firstUnanswered !== -1) {
          // There's an unanswered element earlier — wrap to it
          setCurrentItemIndex(firstUnanswered);
        } else if (currentIdx < items.length - 1) {
          // All answered — advance to show completion state
          setCurrentItemIndex(currentIdx + 1);
        }
      }

      setTimeout(() => setIsTransitioning(false), transitionMs);
    }, autoAdvanceDelayMs);
  };

  const answeredCount = Object.keys(((ans as any)?.[gridKey] || {}) as Record<string, any>).length;

  return {
    items,
    currentItemIndex,
    setCurrentItemIndex,
    isTransitioning,
    setStatus,
    goToItem,
    answeredCount,
  };
}
