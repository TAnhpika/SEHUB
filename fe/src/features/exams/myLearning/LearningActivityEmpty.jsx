import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList, faLaptopCode } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import styles from "./LearningActivitySection.module.css";

/**
 * @param {{ tab: "exams" | "practice" }} props
 */
function LearningActivityEmpty({ tab }) {
  const isExams = tab === "exams";

  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon} aria-hidden="true">
        <FontAwesomeIcon icon={isExams ? faClipboardList : faLaptopCode} />
      </span>
      <p className={styles.emptyTitle}>
        {isExams ? "Chưa có đề cuối kỳ nào" : "Chưa nộp bài thực hành"}
      </p>
      <p className={styles.emptyDesc}>
        {isExams
          ? "Làm bài trắc nghiệm để lưu lịch sử và nhận +15 điểm SEHUB mỗi đề."
          : "Nộp link GitHub trên trang đề thực hành để Mod/Admin chấm và phản hồi."}
      </p>
      <Button
        to={isExams ? "/home/final-exam" : "/home/practical-exam"}
        look="outline"
        size="sm"
      >
        {isExams ? "Khám phá đề thi" : "Xem đề thực hành"}
      </Button>
    </div>
  );
}

export default LearningActivityEmpty;
