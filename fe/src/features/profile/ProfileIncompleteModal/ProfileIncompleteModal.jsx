import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import styles from "./ProfileIncompleteModal.module.css";

function ProfileIncompleteModal({ open, onDismiss, onUpdate }) {
  return (
    <Modal
      open={open}
      onClose={onDismiss}
      title="Hoàn thiện thông tin cá nhân"
      panelClassName={styles.panel}
      closeOnOverlay
    >
      <div className={styles.content}>
        <h2 className={styles.title}>Hoàn thiện thông tin cá nhân</h2>
        <p className={styles.description}>
          Hồ sơ của bạn còn thiếu một số thông tin cá nhân. Hãy cập nhật để mọi người nhận diện
          bạn dễ hơn trên SEHub.
        </p>
        <div className={styles.actions}>
          <Button type="button" look="outline" onClick={onDismiss}>
            Để sau
          </Button>
          <Button type="button" onClick={onUpdate}>
            Cập nhật ngay
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ProfileIncompleteModal;
