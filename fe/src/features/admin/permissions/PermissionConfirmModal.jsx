import Button from "@/common/Button/Button";
import permStyles from "@/features/admin/permissions/AdminPermissions.module.css";

/**
 * @param {{
 *   open: boolean;
 *   mode: "grant" | "revoke";
 *   user: { displayName: string; username: string; initial: string } | null;
 *   onClose: () => void;
 *   onConfirm: () => void;
 * }} props
 */
function PermissionConfirmModal({ open, mode, user, onClose, onConfirm }) {
  if (!open || !user) return null;

  const isGrant = mode === "grant";

  return (
    <div className={permStyles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={permStyles.modal}
        role="dialog"
        aria-labelledby="perm-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="perm-confirm-title" className={permStyles.modalTitle}>
          {isGrant ? "Gán quyền Moderator" : "Thu hồi quyền Mod"}
        </h2>
        <p className={permStyles.modalDesc}>
          {isGrant
            ? "Ứng viên sẽ truy cập khu vực /moderator: duyệt báo cáo, bài viết, chấm bài TH."
            : "Tài khoản sẽ mất quyền truy cập Moderator ngay lập tức (mock)."}
        </p>
        <div className={permStyles.modalUser}>
          <span className={permStyles.avatar}>{user.initial}</span>
          <div>
            <strong>{user.displayName}</strong>
            <p className={permStyles.userMeta}>
              <code>@{user.username}</code>
            </p>
          </div>
        </div>
        <footer className={permStyles.modalFooter}>
          <Button type="button" look="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" onClick={onConfirm}>
            {isGrant ? "Xác nhận gán Mod" : "Xác nhận thu hồi"}
          </Button>
        </footer>
      </div>
    </div>
  );
}

export default PermissionConfirmModal;
