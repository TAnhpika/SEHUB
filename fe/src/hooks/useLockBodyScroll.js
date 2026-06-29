import { useEffect } from "react";

let lockCount = 0;
let savedBodyOverflow = "";
let savedHtmlOverflow = "";
let savedScrollbarGutter = "";

/**
 * Locks document scroll while `active` is true (modals, lightboxes).
 * Reference-counted so nested overlays restore scroll only when all are closed.
 */
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return undefined;

    if (lockCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      savedHtmlOverflow = document.documentElement.style.overflow;
      savedScrollbarGutter = document.documentElement.style.scrollbarGutter;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.scrollbarGutter = "stable";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.body.style.overflow = savedBodyOverflow;
        document.documentElement.style.overflow = savedHtmlOverflow;
        document.documentElement.style.scrollbarGutter = savedScrollbarGutter;
      }
    };
  }, [active]);
}
