import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import PracticeSubmissionGrader from "@/features/exams/PracticeSubmissionGrader/PracticeSubmissionGrader";
import { getSubmissionStatusLabel } from "@/features/exams/practiceExamSubmissions";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import {
  EXAM_STATUS_LABELS,
  getAdminExamById,
  getExamQuestions,
  getExamSubmissions,
  getSemesterLabel,
  getTrackLabel,
  removeAdminExam,
} from "@/features/admin/exams/adminExamData";
import examStyles from "@/features/admin/exams/AdminExam.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

function AdminExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const exam = getAdminExamById(id);
  const questions = exam ? getExamQuestions(exam.id) : [];
  const submissions = useMemo(() => {
    void refreshKey;
    return exam?.typeKey === "practice" ? getExamSubmissions(exam.id) : [];
  }, [exam, refreshKey]);

  if (!exam) {
    return (
      <AdminPageLayout
        title="Không tìm thấy đề"
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý đề thi", to: "/admin/exams" },
          { label: "Chi tiết" },
        ]}
      >
        <p className={styles.hint}>Đề không tồn tại.</p>
      </AdminPageLayout>
    );
  }

  function handleDelete() {
    removeAdminExam(exam.id);
    showToast(`Đã xóa ${exam.code} (mock).`);
    navigate("/admin/exams");
  }

  function handleGraded() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <AdminPageLayout
      title={`[${exam.code}] ${exam.title}`}
      subtitle={`${exam.type} · ${getTrackLabel(exam.track)} · ${getSemesterLabel(exam.semester)}`}
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý đề thi", to: "/admin/exams" },
        { label: exam.code },
      ]}
      actions={
        <>
          <Button look="outline" to={`/admin/exams/${exam.id}/edit`}>
            Sửa
          </Button>
          <Button look="outline" type="button" onClick={handleDelete}>
            Xóa đề
          </Button>
        </>
      }
    >
      <section className={styles.panel}>
        <dl className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <dt>Trạng thái</dt>
            <dd>
              <StatusBadge
                status={exam.status === "published" ? "published" : "draft"}
                label={EXAM_STATUS_LABELS[exam.status] ?? EXAM_STATUS_LABELS.draft}
              />
            </dd>
          </div>
          {exam.typeKey === "final" ? (
            <>
              <div className={styles.detailItem}>
                <dt>Số câu hỏi</dt>
                <dd>{exam.questionCount > 0 ? exam.questionCount : "—"}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>Thời gian làm bài</dt>
                <dd>{exam.durationMinutes ? `${exam.durationMinutes} phút` : "—"}</dd>
              </div>
            </>
          ) : (
            <>
              <div className={styles.detailItem}>
                <dt>Hạn nộp</dt>
                <dd>{exam.deadline || "—"}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>File đính kèm</dt>
                <dd>{exam.attachments?.length ?? 0} file</dd>
              </div>
            </>
          )}
          <div className={styles.detailItem}>
            <dt>Cập nhật</dt>
            <dd>{exam.updatedAt}</dd>
          </div>
          <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
            <dt>SHA-256</dt>
            <dd>
              <code className={examStyles.shaBox}>{exam.sha256}</code>
            </dd>
          </div>
        </dl>
        {exam.description || exam.githubGuide ? (
          <>
            <div className={styles.divider} />
            {exam.description ? (
              <p className={styles.panelDesc} style={{ whiteSpace: "pre-wrap" }}>
                {exam.description}
              </p>
            ) : null}
            {exam.githubGuide ? (
              <p className={styles.hint}>
                <strong>Hướng dẫn GitHub:</strong> {exam.githubGuide}
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      {exam.typeKey === "final" && questions.length > 0 ? (
        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <h2 className={styles.panelTitle}>Ngân hàng câu hỏi</h2>
          <p className={styles.panelDesc}>Xem trước đáp án đúng (Admin)</p>
          <ul className={examStyles.questionList}>
            {questions.map((q, index) => (
              <li key={q.id} className={examStyles.questionItem}>
                <p className={examStyles.questionText}>
                  Câu {index + 1}. {q.text}
                </p>
                <ol className={examStyles.optionList}>
                  {q.options.map((opt, i) => (
                    <li
                      key={opt}
                      className={i === q.correct ? examStyles.optionCorrect : undefined}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                      {i === q.correct ? " ✓" : ""}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {exam.typeKey === "practice" ? (
        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <h2 className={styles.panelTitle}>Bài nộp GitHub (Thực hành)</h2>
          <p className={styles.panelDesc}>
            Sinh viên Premium nộp link repo — Admin/Mod chấm Đã xem / Đạt / Không đạt (§3.4).{" "}
            <Link to="/admin/exams/submissions" className={styles.link}>
              Xem tất cả bài nộp thực hành
            </Link>
          </p>
          {submissions.length === 0 ? (
            <p className={styles.hint}>Chưa có bài nộp cho môn {exam.code}.</p>
          ) : (
            <ul className={examStyles.submissionList}>
              {submissions.map((sub) => (
                <li key={sub.id} className={examStyles.submissionCard}>
                  <div className={examStyles.submissionCardMain}>
                    <div className={styles.cellMain}>{sub.displayName}</div>
                    <div className={styles.cellSub}>
                      @{sub.student} · {sub.examId}
                    </div>
                    <a
                      href={sub.githubUrl}
                      className={examStyles.linkExternal}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {sub.githubUrl}
                    </a>
                    <p className={styles.hint} style={{ margin: "0.35rem 0 0" }}>
                      Nộp: {new Date(sub.submittedAt).toLocaleString("vi-VN")} ·{" "}
                      <StatusBadge
                        status={
                          sub.status === "pass"
                            ? "active"
                            : sub.status === "fail"
                              ? "banned"
                              : "pending"
                        }
                        label={getSubmissionStatusLabel(sub.status)}
                      />
                      {sub.grade ? ` · Điểm ${sub.grade}` : ""}
                    </p>
                    {sub.feedback ? (
                      <p className={styles.hint} style={{ margin: "0.25rem 0 0" }}>
                        Nhận xét: {sub.feedback}
                      </p>
                    ) : null}
                  </div>
                  <PracticeSubmissionGrader
                    submission={sub}
                    gradedBy={user?.username ?? "admin"}
                    onGraded={handleGraded}
                    compact
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {exam.typeKey === "final" && questions.length === 0 ? (
        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <p className={styles.hint}>
            Chưa có câu hỏi OCR.{" "}
            <Link to={`/admin/exams/${exam.id}/edit`} className={styles.link}>
              Upload & OCR
            </Link>
          </p>
        </section>
      ) : null}
    </AdminPageLayout>
  );
}

export default AdminExamDetailPage;
