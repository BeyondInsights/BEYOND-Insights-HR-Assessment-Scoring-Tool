"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
  autoAdvanceDelayMs = 500,
  transitionMs = 250,
  enableLabelDriftWarn = true,
}: UseProgressiveStatusGridArgs<TAns>) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const ansRef = useRef<TAns>(ans);
  const currentIndexRef = useRef<number>(0);

  // Keep refs in sync with state
  useEffect(() => {
    ansRef.current = ans;
  }, [ans]);

  useEffect(() => {
    currentIndexRef.current = currentItemIndex;
  }, [currentItemIndex]);

  // Shuffle items once on mount (stable across re-renders)
  const items = useMemo(
    () => (shuffle ? shuffleArray(itemsBase) : [...itemsBase]),
    [shuffle, itemsBase]
  );

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
        setCurrentItemIndex(nextAfter);
      } else {
        // First unanswered anywhere
        const firstUnanswered = items.findIndex((itm) => !grid[itm]);
        if (firstUnanswered !== -1) {
          setCurrentItemIndex(firstUnanswered);
        } else {
          // All answered - go to next item sequentially
          if (currentIdx < items.length - 1) {
            setCurrentItemIndex(currentIdx + 1);
          }
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
