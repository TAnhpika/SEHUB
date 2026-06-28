import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import styles from "./Modal.module.css";

const ModalContext = createContext(null);

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}

export function Modal({
  open,
  onClose,
  title,
  titleId,
  children,
  className,
  panelClassName,
  closeOnOverlay = true,
}) {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const resolvedTitleId = titleId ?? "app-modal-title";

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    (focusables[0] ?? panel)?.focus?.();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const items = getFocusableElements(panel);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={[styles.overlay, className].filter(Boolean).join(" ")}
      role="presentation"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        ref={panelRef}
        className={[styles.panel, panelClassName].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? resolvedTitleId : undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 id={resolvedTitleId} className={styles.srTitle}>
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function ModalProvider({ children }) {
  const value = useMemo(() => ({}), []);
  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModalContext() {
  return useContext(ModalContext);
}

export function useModalState(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  return { open, setOpen, openModal, closeModal };
}
