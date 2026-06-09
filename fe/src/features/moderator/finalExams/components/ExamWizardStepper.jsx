import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { WIZARD_STEPS } from "@/features/moderator/finalExams/finalExamData";
import styles from "./ExamWizardStepper.module.css";

function ExamWizardStepper() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentStep =
    WIZARD_STEPS.find((step) => step.path === location.pathname)?.id ?? 1;

  return (
    <aside className={styles.stepper}>
      <h2 className={styles.title}>Tiến trình</h2>
      <ol className={styles.list}>
        {WIZARD_STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isPending = step.id > currentStep;

          return (
            <li key={step.id} className={styles.item}>
              <button
                type="button"
                className={styles.stepBtn}
                disabled={isPending}
                onClick={() => !isPending && navigate(step.path)}
              >
                <span
                  className={`${styles.marker} ${
                    isCompleted
                      ? styles["marker-done"]
                      : isActive
                        ? styles["marker-active"]
                        : styles["marker-pending"]
                  }`}
                  aria-hidden
                >
                  {isCompleted ? (
                    <FontAwesomeIcon icon={faCheck} />
                  ) : isActive ? (
                    <span className={styles.dot} />
                  ) : (
                    step.id
                  )}
                </span>
                <span className={styles.copy}>
                  <span
                    className={`${styles.stepTitle} ${
                      isActive ? styles["stepTitle-active"] : ""
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className={styles.stepHint}>{step.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <Link to="/moderator/exams/history?type=final" className={styles.historyLink}>
        <FontAwesomeIcon icon={faClockRotateLeft} />
        Lịch sử đóng góp đề
      </Link>
    </aside>
  );
}

export default ExamWizardStepper;
