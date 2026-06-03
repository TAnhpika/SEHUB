import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsis,
  faEllipsisVertical,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./PostOwnerMenu.module.css";

function PostOwnerMenu({
  onEdit,
  onDelete,
  editLabel = "Chỉnh sửa",
  deleteLabel = "Xóa bài",
  menuAriaLabel = "Tùy chọn",
  horizontal = false,
  showDivider = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function handleToggle(event) {
    event.stopPropagation();
    setOpen((prev) => !prev);
  }

  function handleEdit(event) {
    event.stopPropagation();
    setOpen(false);
    onEdit?.();
  }

  function handleDelete(event) {
    event.stopPropagation();
    setOpen(false);
    onDelete?.();
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={menuAriaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={handleToggle}
      >
        <FontAwesomeIcon icon={horizontal ? faEllipsis : faEllipsisVertical} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <button type="button" className={styles.item} role="menuitem" onClick={handleEdit}>
            <FontAwesomeIcon icon={faPen} />
            {editLabel}
          </button>
          {showDivider && <div className={styles.divider} aria-hidden="true" />}
          <button
            type="button"
            className={`${styles.item} ${styles.danger}`}
            role="menuitem"
            onClick={handleDelete}
          >
            <FontAwesomeIcon icon={faTrash} />
            {deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default PostOwnerMenu;
