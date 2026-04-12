"use client";

import { useEffect } from "react";

// Module-level counter so multiple modals can stack correctly.
// When the first modal locks, we save the original overflow. When the last
// one unlocks, we restore it. Nested modals see a consistent locked state.
let lockCount = 0;
let savedOverflow: string | null = null;

/**
 * Lock `document.body` overflow while `active` is true. Safe to nest.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount++;
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = savedOverflow ?? "";
        savedOverflow = null;
      }
    };
  }, [active]);
}
