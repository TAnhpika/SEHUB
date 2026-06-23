import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "./ChatImageLightbox.module.css";

function ChatImageLightbox({ image, onClose, onBackdropClick, onImageClick }) {
  useEffect(() => {
    if (!image) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
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
