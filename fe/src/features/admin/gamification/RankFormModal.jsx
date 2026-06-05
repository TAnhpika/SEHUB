import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMedal, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { RANK_COLORS } from "@/features/admin/gamification/adminGamificationPolicy";
import gStyles from "@/features/admin/gamification/Gamification.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const EMPTY = {
  name: "",
  slug: "",
  minPoints: "0",
  sortOrder: "1",
  colorKey: "bronze",
  voucherDiscount: "",
  rewardLabel: "",
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
function RankFormModal({ open, editing, onClose, onSubmit, error = "" }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        slug: editing.slug,
        minPoints: String(editing.minPoints),
        sortOrder: String(editing.sortOrder),
        colorKey: editing.colorKey,
        voucherDiscount:
          editing.voucherDiscount == null ? "" : String(editing.voucherDiscount),
        rewardLabel: editing.rewardLabel ?? "",
        description: editing.description ?? "",
        active: editing.active,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

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
        aria-labelledby="rank-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={gStyles.modalHead}>
          <div>
            <h2 id="rank-form-title" className={gStyles.modalTitle}>
              {editing ? "Sửa cấp hạng" : "Thêm cấp hạng"}
            </h2>
            <p className={gStyles.modalSubtitle}>
              <FontAwesomeIcon icon={faMedal} /> Ngưỡng điểm & voucher gắn theo rank
            </p>
          </div>
          <button type="button" className={gStyles.modalClose} aria-label="Đóng" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className={gStyles.modalBody} onSubmit={handleSubmit}>
          <div className={gStyles.fieldRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Tên cấp *</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="VD: Gold"
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Slug</span>
              <input
                className={styles.input}
                value={form.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                placeholder="Tự sinh từ tên nếu để trống"
              />
            </label>
          </div>

          <div className={gStyles.fieldRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Ngưỡng điểm *</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={form.minPoints}
                onChange={(e) => patch({ minPoints: e.target.value })}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Thứ tự hiển thị</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.sortOrder}
                onChange={(e) => patch({ sortOrder: e.target.value })}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Màu hạng</span>
            <select
              className={styles.select}
              value={form.colorKey}
              onChange={(e) => patch({ colorKey: e.target.value })}
            >
              {RANK_COLORS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className={gStyles.fieldRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Voucher giảm (%)</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                max={100}
                value={form.voucherDiscount}
                onChange={(e) => patch({ voucherDiscount: e.target.value })}
                placeholder="Để trống nếu không có"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Nhãn phần thưởng</span>
              <input
                className={styles.input}
                value={form.rewardLabel}
                onChange={(e) => patch({ rewardLabel: e.target.value })}
                placeholder="VD: Voucher FTES 10%"
              />
            </label>
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
            Đang kích hoạt (hiển thị trên hồ sơ SV)
          </label>

          {error ? <p className={gStyles.hintError}>{error}</p> : null}

          <footer className={gStyles.modalFooter}>
            <Button type="button" look="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{editing ? "Lưu thay đổi" : "Tạo cấp hạng"}</Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default RankFormModal;
