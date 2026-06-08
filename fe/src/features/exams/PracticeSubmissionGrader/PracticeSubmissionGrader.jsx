import { useEffect, useState } from "react";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { gradePracticeSubmission } from "@/features/exams/practiceExamSubmissions";
import styles from "./PracticeSubmissionGrader.module.css";

const STATUS_OPTIONS = [
  { value: "reviewed", label: "Đã xem" },
  { value: "pass", label: "Đạt" },
  { value: "fail", label: "Không đạt" },
];

/**
 * @param {{
 *   submission: import("@/features/exams/practiceExamSubmissions").PracticeExamSubmission;
 *   gradedBy: string;
 *   onGraded?: (updated: object) => void;
 *   compact?: boolean;
 * }} props
 */
function resolveFormStatus(submissionStatus) {
  return submissionStatus === "pending" ? "reviewed" : submissionStatus;
}

function PracticeSubmissionGrader({ submission, gradedBy, onGraded, compact = false }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState(() => resolveFormStatus(submission.status));
  const [grade, setGrade] = useState(submission.grade ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");

  useEffect(() => {
    setStatus(resolveFormStatus(submission.status));
    setGrade(submission.grade ?? "");
    setFeedback(submission.feedback ?? "");
  }, [submission.id, submission.status, submission.grade, submission.feedback, submission.gradedAt]);

  const savedStatus = resolveFormStatus(submission.status);
  const hasUnsavedChanges =
    status !== savedStatus ||
    grade !== (submission.grade ?? "") ||
    feedback !== (submission.feedback ?? "");

  function handleSave() {
    if ((status === "pass" || status === "fail") && !grade.trim()) {
      showToast("Nhập điểm khi chấm Đạt / Không đạt.");
      return;
    }

    const updated = gradePracticeSubmission(submission.id, {
      status,
      grade: grade.trim() || null,
      feedback: feedback.trim(),
      gradedBy,
    });

    if (updated) {
      showToast("Đã cập nhật kết quả chấm.");
      onGraded?.(updated);
    }
  }

  return (
    <div className={compact ? styles.compact : styles.grader}>
      <div className={styles.meta}>
        {submission.gradedBy ? (
          <span className={styles.gradedBy}>
            Chấm bởi @{submission.gradedBy}
            {submission.gradedAt
              ? ` · ${new Date(submission.gradedAt).toLocaleString("vi-VN")}`
              : ""}
          </span>
        ) : (
          <span className={styles.gradedBy}>Chưa chấm — cập nhật trạng thái bên dưới</span>
        )}
        {hasUnsavedChanges ? (
          <span className={styles.draftHint}>Thay đổi chưa lưu</span>
        ) : null}
      </div>

      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Trạng thái</span>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Chờ chấm</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Điểm</span>
          <input
            className={styles.input}
            type="text"
            inputMode="decimal"
            placeholder="VD: 8.5"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Nhận xét</span>
        <textarea
          className={styles.textarea}
          rows={compact ? 2 : 3}
          placeholder="Nhận xét ngắn cho sinh viên..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </label>

      <Button type="button" onClick={handleSave}>
        Lưu kết quả chấm
      </Button>
    </div>
  );
}

export default PracticeSubmissionGrader;
