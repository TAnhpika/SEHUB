import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import PracticeSubmissionGrader from "@/features/exams/PracticeSubmissionGrader/PracticeSubmissionGrader";
import { getSubmissionStatusLabel } from "@/features/exams/practiceExamSubmissions";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import { StaffDetailSkeleton } from "@/common/Skeleton/StaffSkeleton";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import {
  EXAM_STATUS_LABELS,
  getAdminExamEditPath,
  getAdminExamById,
  getExamQuestions,
  getExamSubmissions,
  getSemesterLabel,
  getTrackLabel,
  loadAdminExamById,
  removeAdminExamViaApi,
} from "@/features/admin/exams/adminExamData";
import examStyles from "@/features/admin/exams/AdminExam.module.css";
import AdminExamQuestionViewer from "@/features/admin/exams/AdminExamQuestionViewer";
import ExamAttachmentViewer from "@/features/exams/ExamAttachmentViewer/ExamAttachmentViewer";
import styles from "@/features/admin/shared/adminPage.module.css";
import { getExamListPaperLabel, getExamSubjectCode } from "@/utils/examDisplay";
import { getPrimaryExamAttachment } from "@/utils/examAssetUrl";

function AdminExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exam, setExam] = useState(() => getAdminExamById(id));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAdminExamById(id).then((item) => {
      if (!cancelled) {
        setExam(item);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const questions = exam ? (exam.questionsData ?? getExamQuestions(exam.id)) : [];
  const submissions = useMemo(() => {
    void refreshKey;
    return exam?.typeKey === "practice" ? getExamSubmissions(exam.id) : [];
  }, [exam, refreshKey]);

  if (loading) {
    return (
      <AdminPageLayout
        title="Đang tải..."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý đề thi", to: "/admin/exams" },
          { label: "Chi tiết" },
        ]}
      >
        <StaffDetailSkeleton aria-label="Đang tải đề thi" />
      </AdminPageLayout>
    );
  }

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

  const subjectCode = getExamSubjectCode(exam);
  const paperLabel = getExamListPaperLabel(exam);

  async function handleDelete() {
    if (deleteLoading) return;
    setDeleteLoading(true);
    try {
      const removed = await removeAdminExamViaApi(exam.id);
      if (!removed) {
        showToast("Không xóa được đề thi.");
        return;
      }
      showToast(`Đã xóa ${paperLabel}.`);
      navigate("/admin/exams");
    } catch (error) {
      showToast(error?.message ?? "Không thể xóa đề thi.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleGraded() {
    setRefreshKey((k) => k + 1);
  }

  const practiceAttachment = getPrimaryExamAttachment(exam);

  return (
    <AdminPageLayout
      title={`[${subjectCode}] ${paperLabel}`}
      subtitle={`${exam.type} · ${getTrackLabel(exam.track)} · ${getSemesterLabel(exam.semester)}`}
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý đề thi", to: "/admin/exams" },
        { label: subjectCode },
      ]}
      actions={
        <>
          <Button look="outline" to={getAdminExamEditPath(exam)}>
            Sửa
          </Button>
          <Button look="outline" type="button" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? "Đang xóa…" : "Xóa đề"}
          </Button>
        </>
      }
    >
      <section className={styles.panel}>
        <dl className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <dt>Mã môn</dt>
            <dd>{subjectCode}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt>{exam.typeKey === "final" ? "Mã đề thi" : "Tiêu đề"}</dt>
            <dd>{paperLabel}</dd>
          </div>
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
                <dd>
                  {practiceAttachment ? (
                    <a
                      href={practiceAttachment.url}
                      className={examStyles.linkExternal}
                      download
                      target="_blank"
                      rel="noreferrer"
                    >
                      {practiceAttachment.name}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
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
          <AdminExamQuestionViewer questions={questions} />
        </section>
      ) : null}

      {exam.typeKey === "practice" && exam.attachments?.length > 0 ? (
        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <ExamAttachmentViewer examApiId={exam.id} attachments={exam.attachments} />
        </section>
      ) : null}

      {exam.typeKey === "practice" ? (
        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <h2 className={styles.panelTitle}>Bài nộp GitHub (Thực hành)</h2>
          <p className={styles.panelDesc}>
            Sinh viên Premium nộp link repo — Admin/Mod chấm Đã xem / Đạt / Không đạt (§3.4).{" "}
            <Link to="/admin/moderation/practice-submissions" className={styles.link}>
              Xem tất cả bài nộp thực hành
            </Link>
          </p>
          {submissions.length === 0 ? (
            <p className={styles.hint}>Chưa có bài nộp cho môn {subjectCode}.</p>
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
            <Link to={getAdminExamEditPath(exam)} className={styles.link}>
              Upload & OCR
            </Link>
          </p>
        </section>
      ) : null}
    </AdminPageLayout>
  );
}

export default AdminExamDetailPage;
