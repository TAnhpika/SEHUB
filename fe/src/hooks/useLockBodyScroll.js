import { useEffect } from "react";

const SCROLLABLE_SELECTOR = "[data-scroll-lock-scrollable]";
const SCROLL_KEYS = new Set([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"]);

let lockCount = 0;

function isInsideScrollableTarget(target) {
  return target instanceof Element && Boolean(target.closest(SCROLLABLE_SELECTOR));
}

function preventBackgroundScroll(event) {
  if (isInsideScrollableTarget(event.target)) {
    return;
  }

  event.preventDefault();
}

function preventBackgroundScrollKeys(event) {
  if (!SCROLL_KEYS.has(event.key)) {
    return;
  }

  if (isInsideScrollableTarget(event.target)) {
    return;
  }

  event.preventDefault();
}

/**
 * Blocks background scroll without changing body overflow/layout.
 * Reference-counted so nested overlays restore behavior when all are closed.
 */
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return undefined;

    if (lockCount === 0) {
      document.addEventListener("wheel", preventBackgroundScroll, {
        passive: false,
        capture: true,
      });
      document.addEventListener("touchmove", preventBackgroundScroll, {
        passive: false,
        capture: true,
      });
      document.addEventListener("keydown", preventBackgroundScrollKeys, {
        capture: true,
      });
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.removeEventListener("wheel", preventBackgroundScroll, { capture: true });
        document.removeEventListener("touchmove", preventBackgroundScroll, { capture: true });
        document.removeEventListener("keydown", preventBackgroundScrollKeys, { capture: true });
      }
    };
  }, [active]);
}
