import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import styles from "./ChatImageLightbox.module.css";

function ChatImageLightbox({ image, onClose, onBackdropClick, onImageClick }) {
  useLockBodyScroll(Boolean(image?.url));

  useEffect(() => {
    if (!image?.url) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [image, onClose]);

  if (!image?.url) return null;

  function handleBackdropClick() {
    if (onBackdropClick) {
      onBackdropClick();
      return;
    }
    onClose?.();
  }

  function handleImageClick(event) {
    event.stopPropagation();
    if (onImageClick) {
      onImageClick();
    }
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh phóng to"
      onClick={handleBackdropClick}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="Đóng"
        onClick={handleBackdropClick}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <img
        src={image.url}
        alt={image.alt || "Ảnh đính kèm"}
        className={styles.image}
        onClick={handleImageClick}
      />
    </div>
  );
}

export default ChatImageLightbox;
