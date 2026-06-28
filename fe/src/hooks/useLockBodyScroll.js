import { useEffect } from "react";

/**
 * Locks document scroll while `active` is true (modals, lightboxes).
 */
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousScrollbarGutter = document.documentElement.style.scrollbarGutter;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.scrollbarGutter = "auto";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.scrollbarGutter = previousScrollbarGutter;
    };
  }, [active]);
}
