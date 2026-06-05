import { useState } from "react";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  getStudentSubmission,
  getSubmissionStatusLabel,
  isValidGithubUrl,
  submitPracticeExam,
} from "@/features/exams/practiceExamSubmissions";
import styles from "./PracticeExamSubmitPanel.module.css";

/**
 * @param {{ courseCode: string; examId: string; examTitle?: string }} props
 */
function PracticeExamSubmitPanel({ courseCode, examId, examTitle }) {
  const { user, isAuthenticated, isPremium } = useAuth();
  const { showToast } = useToast();
  const [githubUrl, setGithubUrl] = useState("");
  const [submission, setSubmission] = useState(() =>
    user ? getStudentSubmission(courseCode, examId, user.username) : null,
  );

  if (!isAuthenticated) {
    return (
      <section className={styles.panel}>
        <h2 className={styles.title}>Nộp bài thực hành</h2>
        <p className={styles.hint}>Đăng nhập để nộp link GitHub repository.</p>
        <Button to="/login" look="outline">
          Đăng nhập
        </Button>
      </section>
    );
  }

  if (!isPremium) {
    return (
      <section className={styles.panel}>
        <h2 className={styles.title}>Nộp bài thực hành</h2>
        <p className={styles.hint}>
          Tính năng nộp bài qua GitHub dành cho tài khoản <strong>Premium</strong> (§3.4).
        </p>
        <Button to="/home/premium">Nâng cấp Premium</Button>
      </section>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!isValidGithubUrl(githubUrl)) {
      showToast("Nhập link GitHub hợp lệ (https://github.com/...).");
      return;
    }

    const saved = submitPracticeExam({
      courseCode,
      examId,
      student: user.username,
      displayName: user.displayName ?? user.username,
      githubUrl,
    });
    setSubmission(saved);
    setGithubUrl(saved.githubUrl);
    showToast(submission ? "Đã cập nhật bài nộp." : "Đã nộp bài — chờ Mod/Admin chấm.");
  }

  const statusClass =
    submission?.status === "pass"
      ? styles.statusPass
      : submission?.status === "fail"
        ? styles.statusFail
        : submission?.status === "reviewed"
          ? styles.statusReviewed
          : submission
            ? styles.statusPending
            : "";

  return (
    <section className={styles.panel} aria-label="Nộp bài GitHub">
      <h2 className={styles.title}>Nộp bài thực hành</h2>
      <p className={styles.desc}>
        Paste link repository GitHub công khai cho đề{" "}
        <strong>{examTitle ?? examId}</strong>. Moderator/Admin sẽ chấm và phản hồi tại đây.
      </p>

      {submission ? (
        <div className={`${styles.result} ${statusClass}`}>
          <div className={styles.resultHead}>
            <span className={styles.resultLabel}>Trạng thái</span>
            <span className={styles.resultBadge}>
              {getSubmissionStatusLabel(submission.status)}
            </span>
          </div>
          <p className={styles.resultMeta}>
            Nộp lúc {new Date(submission.submittedAt).toLocaleString("vi-VN")}
          </p>
          <a
            href={submission.githubUrl}
            className={styles.repoLink}
            target="_blank"
            rel="noreferrer"
          >
            {submission.githubUrl}
          </a>
          {submission.grade ? (
            <p className={styles.resultGrade}>
              <strong>Điểm:</strong> {submission.grade}
            </p>
          ) : null}
          {submission.feedback ? (
            <p className={styles.resultFeedback}>
              <strong>Nhận xét:</strong> {submission.feedback}
            </p>
          ) : submission.status === "pending" || submission.status === "reviewed" ? (
            <p className={styles.resultWaiting}>Bài đang chờ Mod/Admin chấm.</p>
          ) : null}
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>
            {submission ? "Cập nhật link GitHub" : "Link GitHub repository *"}
          </span>
          <input
            type="url"
            className={styles.input}
            placeholder="https://github.com/username/repo"
            value={githubUrl || submission?.githubUrl || ""}
            onChange={(e) => setGithubUrl(e.target.value)}
            required
          />
        </label>
        <div className={styles.actions}>
          <Button type="submit">{submission ? "Gửi lại bài nộp" : "Nộp bài"}</Button>
        </div>
      </form>

      <p className={styles.footnote}>
        Kết quả chấm (Đạt / Không đạt, điểm, nhận xét) sẽ hiển thị tại đây sau khi Mod/Admin xử lý.
      </p>
    </section>
  );
}

export default PracticeExamSubmitPanel;
