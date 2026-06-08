import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import PricingContent from "@/features/premium/PricingContent/PricingContent";
import styles from "./PricingModal.module.css";

function PricingModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    const scrollY = window.scrollY;
    const { style: bodyStyle } = document.body;
    const { style: htmlStyle } = document.documentElement;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    const prevBody = {
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      top: bodyStyle.top,
      width: bodyStyle.width,
      paddingRight: bodyStyle.paddingRight,
    };
    const prevHtmlOverflow = htmlStyle.overflow;

    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = "100%";
    if (scrollbarWidth > 0) {
      bodyStyle.paddingRight = `${scrollbarWidth}px`;
    }
    htmlStyle.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      bodyStyle.overflow = prevBody.overflow;
      bodyStyle.position = prevBody.position;
      bodyStyle.top = prevBody.top;
      bodyStyle.width = prevBody.width;
      bodyStyle.paddingRight = prevBody.paddingRight;
      htmlStyle.overflow = prevHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Đóng"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <PricingContent requireLogin onGuestRedirect={onClose} />
      </div>
    </div>
  );
}

export default PricingModal;
