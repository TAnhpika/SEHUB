import { useEffect } from "react";

function findScrollableParent(element) {
  let parent = element?.parentElement;

  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    const canScroll =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight + 1;

    if (canScroll) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return document.scrollingElement ?? document.documentElement;
}

/**
 * When a nested scroll area hits top/bottom, pass wheel delta to the page scroll container.
 */
export function useScrollBoundaryChain(ref) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    function handleWheel(event) {
      const { scrollTop, scrollHeight, clientHeight } = node;
      const canScrollInner = scrollHeight > clientHeight + 1;

      if (!canScrollInner) {
        return;
      }

      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        const parent = findScrollableParent(node);
        parent.scrollTop += event.deltaY;
        event.preventDefault();
      }
    }

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [ref]);
}
