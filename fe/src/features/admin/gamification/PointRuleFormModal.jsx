import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
import { POINT_RULE_TYPES } from "@/features/admin/gamification/adminGamificationPolicy";
import gStyles from "@/features/admin/gamification/Gamification.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const EMPTY = {
  name: "",
  slug: "",
  eventType: "daily_login",
  points: "5",
  intervalDays: "7",
  description: "",
  active: true,
};

/**
 * @param {{
 *   open: boolean;
 *   editing: object | null;
 *   onClose: () => void;
 *   onSubmit: (payload: object) => void;
 *   error?: string;
 * }} props
 */
function PointRuleFormModal({ open, editing, onClose, onSubmit, error = "" }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        slug: editing.slug,
        eventType: editing.eventType,
        points: String(editing.points),
        intervalDays:
          editing.intervalDays == null ? "7" : String(editing.intervalDays),
        description: editing.description ?? "",
        active: editing.active,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const isStreak = form.eventType === "streak_milestone";

  function patch(updates) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={backdropStyles.overlay}
      panelClassName={gStyles.modal}
      closeOnOverlay
    >
        <header className={gStyles.modalHead}>
          <div>
            <h2 id="rule-form-title" className={gStyles.modalTitle}>
              {editing ? "Sửa quy tắc điểm" : "Thêm quy tắc điểm"}
            </h2>
            <p className={gStyles.modalSubtitle}>
              <FontAwesomeIcon icon={faBolt} /> Cộng điểm tích lũy theo sự kiện hệ thống
            </p>
          </div>
          <button type="button" className={gStyles.modalClose} aria-label="Đóng" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className={gStyles.modalBody} onSubmit={handleSubmit}>
          <div className={gStyles.fieldRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Tên quy tắc *</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Slug</span>
              <input
                className={styles.input}
                value={form.slug}
                onChange={(e) => patch({ slug: e.target.value })}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Loại sự kiện *</span>
            <select
              className={styles.select}
              value={form.eventType}
              onChange={(e) => patch({ eventType: e.target.value })}
            >
              {POINT_RULE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <div className={gStyles.fieldRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Điểm cộng *</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={form.points}
                onChange={(e) => patch({ points: e.target.value })}
                required
              />
            </label>
            {isStreak ? (
              <label className={styles.field}>
                <span className={styles.label}>Chu kỳ (ngày)</span>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={form.intervalDays}
                  onChange={(e) => patch({ intervalDays: e.target.value })}
                />
              </label>
            ) : null}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Mô tả</span>
            <textarea
              className={styles.textarea}
              rows={2}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>

          <label className={gStyles.checkRow}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => patch({ active: e.target.checked })}
            />
            Đang kích hoạt
          </label>

          {error ? <p className={gStyles.hintError}>{error}</p> : null}

          <footer className={gStyles.modalFooter}>
            <Button type="button" look="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{editing ? "Lưu quy tắc" : "Tạo quy tắc"}</Button>
          </footer>
        </form>
    </Modal>
  );
}

export default PointRuleFormModal;
