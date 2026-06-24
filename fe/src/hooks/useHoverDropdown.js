import { useCallback, useEffect, useRef, useState } from "react";

export function useHoverDropdown(closeDelayMs = 150) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const hideSoon = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), closeDelayMs);
  }, [clearCloseTimer, closeDelayMs]);

  const hide = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  function handleTriggerClick() {
    if (window.matchMedia("(hover: none)").matches) {
      setOpen((prev) => !prev);
    }
  }

  const rootProps = {
    onMouseEnter: show,
    onMouseLeave: hideSoon,
  };

  return { open, setOpen, rootProps, handleTriggerClick, show, hideSoon, hide };
}
