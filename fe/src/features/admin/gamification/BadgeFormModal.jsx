import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import {
  BADGE_CATEGORIES,
  TRIGGER_TYPES,
  formatTriggerRule,
} from "@/features/admin/gamification/adminGamificationPolicy";
import gStyles from "@/features/admin/gamification/Gamification.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  category: "community",
  triggerType: "post_count",
  triggerValue: "1",
  pointsReward: "50",
  icon: "🏅",
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
function BadgeFormModal({ open, editing, onClose, onSubmit, error = "" }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        slug: editing.slug,
        description: editing.description ?? "",
        category: editing.category,
        triggerType: editing.triggerType,
        triggerValue: String(editing.triggerValue),
        pointsReward: String(editing.pointsReward),
        icon: editing.icon ?? "🏅",
        active: editing.active,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const triggerPreview = useMemo(
    () => formatTriggerRule(form.triggerType, Number(form.triggerValue) || 0),
    [form.triggerType, form.triggerValue],
  );

  if (!open) return null;

  function patch(updates) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className={gStyles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={gStyles.modal}
        role="dialog"
        aria-labelledby="badge-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={gStyles.modalHead}>
          <div>
            <h2 id="badge-form-title" className={gStyles.modalTitle}>
              {editing ? "Sửa danh hiệu" : "Thêm danh hiệu"}
            </h2>
            <p className={gStyles.modalSubtitle}>
              <FontAwesomeIcon icon={faTrophy} /> Event-driven — quét khi có hành động SV
            </p>
          </div>
          <button type="button" className={gStyles.modalClose} aria-label="Đóng" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className={gStyles.modalBody} onSubmit={handleSubmit}>
          <div className={gStyles.fieldRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Tên danh hiệu *</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="VD: First Blogger"
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Icon (emoji)</span>
              <input
                className={styles.input}
                value={form.icon}
                onChange={(e) => patch({ icon: e.target.value })}
                maxLength={4}
              />
            </label>
          </div>

          <div className={gStyles.fieldRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Slug</span>
              <input
                className={styles.input}
                value={form.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                placeholder="first-blogger"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Nhóm *</span>
              <select
                className={styles.select}
                value={form.category}
                onChange={(e) => patch({ category: e.target.value })}
              >
                {BADGE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Mô tả</span>
            <textarea
              className={styles.textarea}
              rows={2}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Điều kiện hiển thị cho sinh viên"
            />
          </label>

          <div className={gStyles.fieldRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Loại điều kiện *</span>
              <select
                className={styles.select}
                value={form.triggerType}
                onChange={(e) => patch({ triggerType: e.target.value })}
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Ngưỡng *</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.triggerValue}
                onChange={(e) => patch({ triggerValue: e.target.value })}
                required
              />
            </label>
          </div>

          <p className={gStyles.triggerPreview}>{triggerPreview}</p>

          <label className={styles.field}>
            <span className={styles.label}>Điểm thưởng khi mở khóa *</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              value={form.pointsReward}
              onChange={(e) => patch({ pointsReward: e.target.value })}
              required
            />
          </label>

          <label className={gStyles.checkRow}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => patch({ active: e.target.checked })}
            />
            Đang kích hoạt (engine sẽ quét điều kiện)
          </label>

          {error ? <p className={gStyles.hintError}>{error}</p> : null}

          <footer className={gStyles.modalFooter}>
            <Button type="button" look="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{editing ? "Lưu danh hiệu" : "Tạo danh hiệu"}</Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default BadgeFormModal;
