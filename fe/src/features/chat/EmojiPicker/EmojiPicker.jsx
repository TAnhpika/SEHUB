import { useEffect, useRef } from "react";
import { CHAT_EMOJIS } from "./chatEmojis";
import styles from "./EmojiPicker.module.css";

function EmojiPicker({ open, onSelect, onClose, anchorRef }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      const anchor = anchorRef?.current;
      if (
        panelRef.current?.contains(event.target) ||
        anchor?.contains(event.target)
      ) {
        return;
      }

      onClose?.();
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Chọn emoji">
      <div className={styles.grid}>
        {CHAT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={styles.emojiBtn}
            onClick={() => onSelect?.(emoji)}
            aria-label={`Chèn ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmojiPicker;
