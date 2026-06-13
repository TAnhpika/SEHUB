import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "./ChatImageLightbox.module.css";

function ChatImageLightbox({ image, onClose }) {
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

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh phóng to"
      onClick={() => onClose?.()}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="Đóng"
        onClick={() => onClose?.()}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <img
        src={image.url}
        alt={image.alt || "Ảnh đính kèm"}
        className={styles.image}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

export default ChatImageLightbox;
