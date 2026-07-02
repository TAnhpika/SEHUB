import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { useExamFormFlow } from "@/features/exams/examFormFlow";
import { useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import styles from "./ExamWizardStepper.module.css";

function ExamWizardStepper() {
  const location = useLocation();
  const navigate = useNavigate();
  const flow = useExamFormFlow();
  const { wizardSteps, isRevisionEdit } = useFinalExamWizard();

  const currentStep =
    wizardSteps.find((step) => step.path === location.pathname)?.id ?? 1;

  const historyLink =
    flow.scope === "admin"
      ? { to: flow.examsListPath, label: "Danh sách đề thi" }
      : { to: "/moderator/exams/history?type=final", label: "Lịch sử đóng góp đề" };

  return (
    <aside className={styles.stepper}>
      <h2 className={styles.title}>Tiến trình</h2>
      {isRevisionEdit ? (
        <p className={styles.revisionNote}>
          Đề đang public không thay đổi cho đến khi Admin duyệt bản cập nhật.
        </p>
      ) : null}
      <ol className={styles.list}>
        {wizardSteps.map((step) => {
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
      <Link to={historyLink.to} className={styles.historyLink}>
        <FontAwesomeIcon icon={faClockRotateLeft} />
        {historyLink.label}
      </Link>
    </aside>
  );
}

export default ExamWizardStepper;
