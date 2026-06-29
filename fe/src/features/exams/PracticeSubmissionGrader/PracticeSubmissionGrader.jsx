import { useEffect, useState } from "react";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  getSubmissionStatusLabel,
  savePracticeSubmissionReview,
} from "@/features/exams/practiceExamSubmissions";
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

function isSubmissionGraded(submission) {
  return submission.status !== "pending" || Boolean(submission.gradedAt);
}

function PracticeSubmissionGrader({ submission, gradedBy, onGraded, compact = false }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState(() => resolveFormStatus(submission.status));
  const [grade, setGrade] = useState(submission.grade ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(() => !isSubmissionGraded(submission));

  useEffect(() => {
    setStatus(resolveFormStatus(submission.status));
    setGrade(submission.grade ?? "");
    setFeedback(submission.feedback ?? "");
    setIsEditing(!isSubmissionGraded(submission));
  }, [submission.id, submission.status, submission.grade, submission.feedback, submission.gradedAt]);

  const savedStatus = resolveFormStatus(submission.status);
  const isGraded = isSubmissionGraded(submission);
  const fieldsLocked = isGraded && !isEditing;
  const hasUnsavedChanges =
    status !== savedStatus ||
    grade !== (submission.grade ?? "") ||
    feedback !== (submission.feedback ?? "");

  function resetFormFromSubmission() {
    setStatus(resolveFormStatus(submission.status));
    setGrade(submission.grade ?? "");
    setFeedback(submission.feedback ?? "");
  }

  function handleStartEdit() {
    setIsEditing(true);
  }

  function handleCancelEdit() {
    resetFormFromSubmission();
    setIsEditing(false);
  }

  async function handleSave() {
    if ((status === "pass" || status === "fail") && !grade.trim()) {
      showToast("Nhập điểm khi chấm Đạt / Không đạt.");
      return;
    }

    setSaving(true);

    try {
      const updated = await savePracticeSubmissionReview(submission, {
        status,
        grade: grade.trim() || null,
        feedback: feedback.trim(),
        gradedBy,
      });

      if (updated) {
        showToast("Đã cập nhật kết quả chấm.");
        setIsEditing(false);
        onGraded?.(updated);
      }
    } catch (error) {
      showToast(error?.message ?? "Không lưu được kết quả chấm.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={compact ? styles.compact : styles.grader}>
      {!compact ? (
        <div className={styles.meta}>
          <span className={styles.badge}>{getSubmissionStatusLabel(submission.status)}</span>
          {submission.gradedBy ? (
            <span className={styles.gradedBy}>Chấm bởi @{submission.gradedBy}</span>
          ) : null}
        </div>
      ) : null}

      {!isGraded ? (
        <p className={styles.pendingHint}>Bài nộp mới — nhập điểm và nhận xét rồi lưu kết quả.</p>
      ) : null}

      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Trạng thái</span>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={saving || fieldsLocked}
          >
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
            disabled={saving}
            readOnly={fieldsLocked}
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
          disabled={saving}
          readOnly={fieldsLocked}
        />
      </label>

      <div className={styles.actions}>
        {fieldsLocked ? (
          <Button type="button" look="outline" onClick={handleStartEdit} disabled={saving}>
            Chỉnh sửa
          </Button>
        ) : (
          <>
            {isGraded ? (
              <Button type="button" look="outline" onClick={handleCancelEdit} disabled={saving}>
                Hủy
              </Button>
            ) : null}
            <Button type="button" onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
              Lưu kết quả chấm
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default PracticeSubmissionGrader;
