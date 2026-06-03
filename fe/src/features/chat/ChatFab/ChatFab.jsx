import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import ChatModal from "@/features/chat/ChatModal/ChatModal";
import styles from "./ChatFab.module.css";

function ChatFab() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      {open && <ChatModal onClose={() => setOpen(false)} />}

      <button
        type="button"
        className={`${styles.fab} ${open ? styles.active : ""}`}
        aria-label={open ? "Đóng tin nhắn" : "Mở tin nhắn"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FontAwesomeIcon icon={faCommentDots} />
      </button>
    </div>
  );
}

export default ChatFab;
