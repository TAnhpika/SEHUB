import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import styles from "./WizardBottomActions.module.css";

function WizardBottomActions({
  onSaveDraft,
  onBack,
  onContinue,
  backLabel = "Quay lại",
  continueLabel = "Tiếp tục",
  showBack = true,
  continueDisabled = false,
}) {
  return (
    <div className={styles.bar}>
      <button type="button" className={styles.draft} onClick={onSaveDraft}>
        Lưu nháp
      </button>
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
