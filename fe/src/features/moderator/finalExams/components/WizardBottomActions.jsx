import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import styles from "./WizardBottomActions.module.css";

/**
 * @fileoverview Thanh hành động dưới cùng của các bước wizard đề cuối kỳ.
 *
 * Cung cấp nút Lưu nháp, Quay lại và Tiếp tục với nhãn / hiển thị tùy chỉnh.
 *
 * @module features/moderator/finalExams/components/WizardBottomActions
 */

/**
 * @typedef {Object} WizardBottomActionsProps
 * @property {() => void} onSaveDraft - Callback khi bấm "Lưu nháp".
 * @property {() => void} onBack - Callback khi bấm "Quay lại".
 * @property {() => void} onContinue - Callback khi bấm nút tiếp tục / gửi.
 * @property {string} [backLabel="Quay lại"] - Nhãn nút quay lại.
 * @property {string} [continueLabel="Tiếp tục"] - Nhãn nút tiếp tục.
 * @property {boolean} [showBack=true] - Ẩn/hiện nút quay lại.
 * @property {boolean} [showSaveDraft=true] - Ẩn/hiện nút lưu nháp.
 * @property {boolean} [continueDisabled=false] - Vô hiệu hóa nút tiếp tục (ví dụ đang submit).
 */

/**
 * Thanh hành động cố định dưới cùng mỗi bước wizard.
 *
 * @param {WizardBottomActionsProps} props - Props của component.
 * @returns {import('react').ReactElement} Thanh nút Lưu nháp / Quay lại / Tiếp tục.
 *
 * @example
 * <WizardBottomActions
 *   onSaveDraft={handleSaveDraft}
 *   onBack={() => navigate(basePath)}
 *   onContinue={handleContinue}
 * />
 */
function WizardBottomActions({
  onSaveDraft,
  onBack,
  onContinue,
  backLabel = "Quay lại",
  continueLabel = "Tiếp tục",
  showBack = true,
  showSaveDraft = true,
  continueDisabled = false,
}) {
  return (
    <div className={styles.bar}>
      {showSaveDraft ? (
        <button type="button" className={styles.draft} onClick={onSaveDraft}>
          Lưu nháp
        </button>
      ) : (
        <span />
      )}
      <div className={styles.right}>
        {showBack && (
          <button type="button" className={styles.back} onClick={onBack}>
            {backLabel}
          </button>
        )}
        <button
          type="button"
          className={styles.continue}
          onClick={onContinue}
          disabled={continueDisabled}
        >
          {continueLabel}
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );
}

export default WizardBottomActions;
