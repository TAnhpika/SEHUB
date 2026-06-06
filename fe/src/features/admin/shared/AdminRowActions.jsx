import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import styles from "@/features/admin/shared/adminPage.module.css";

/**
 * @param {{
 *   viewTo?: string;
 *   editTo?: string;
 *   onDelete?: () => void;
 *   viewLabel?: string;
 *   editLabel?: string;
 *   deleteLabel?: string;
 * }} props
 */
function AdminRowActions({
  viewTo,
  editTo,
  onDelete,
  viewLabel = "Chi tiết",
  editLabel = "Sửa",
  deleteLabel = "Xóa",
}) {
  return (
    <div className={styles.actionGroup} role="group" aria-label="Thao tác">
      {viewTo ? (
        <Link
          to={viewTo}
          className={styles.actionBtn}
          title={viewLabel}
          aria-label={viewLabel}
        >
          <FontAwesomeIcon icon={faEye} />
        </Link>
      ) : null}
      {editTo ? (
        <Link
          to={editTo}
          className={styles.actionBtn}
          title={editLabel}
          aria-label={editLabel}
        >
          <FontAwesomeIcon icon={faPenToSquare} />
        </Link>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
          title={deleteLabel}
          aria-label={deleteLabel}
          onClick={onDelete}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      ) : null}
    </div>
  );
}

export default AdminRowActions;
