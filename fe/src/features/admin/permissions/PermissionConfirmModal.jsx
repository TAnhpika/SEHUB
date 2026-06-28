import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
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
    <Modal
      open={open}
      onClose={onClose}
      className={backdropStyles.overlay}
      panelClassName={`${backdropStyles.panel} ${permStyles.modal}`}
      closeOnOverlay
    >
      <h2 id="perm-confirm-title" className={permStyles.modalTitle}>
        {isGrant ? "Gán quyền Moderator" : "Thu hồi quyền Mod"}
      </h2>
      <p className={permStyles.modalDesc}>
        {isGrant
          ? "Ứng viên sẽ truy cập khu vực /moderator: duyệt báo cáo, bài viết, chấm bài TH."
          : "Tài khoản sẽ mất quyền truy cập Moderator ngay lập tức."}
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
    </Modal>
  );
}

export default PermissionConfirmModal;
