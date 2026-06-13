import { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@/common/Pagination/Pagination";
import { useAuth } from "@/context";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import PracticeSubmissionGrader from "@/features/exams/PracticeSubmissionGrader/PracticeSubmissionGrader";
import {
  getSubmissionStatusLabel,
} from "@/features/exams/practiceExamSubmissions";
import {
  SUBMISSION_SORT_OPTIONS,
  SUBMISSION_STATUS_FILTERS,
  usePracticeSubmissionsList,
} from "@/features/exams/usePracticeSubmissionsList";
import { getAdminExams } from "@/features/admin/exams/adminExamData";
import pageStyles from "@/features/moderator/practiceExams/ModeratorPracticeSubmissionsPage.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

function resolveAdminExamLink(courseCode) {
  const exam = getAdminExams().find(
    (e) => e.code === courseCode && e.typeKey === "practice" && e.status === "published",
  );
  return exam ? `/admin/exams/${exam.id}` : "/admin/exams";
}

function AdminPracticeSubmissionsPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    courseFilter,
    setCourseFilter,
    sortPreset,
    setSortPreset,
    courseOptions,
    filteredCount,
    pageSubmissions,
    totalPages,
    safePage,
    rangeStart,
    rangeEnd,
    hasActiveFilters,
    resetFilters,
    handlePageChange,
    pendingCount,
  } = usePracticeSubmissionsList(refreshKey);

  function handleGraded() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <AdminPageLayout
      title="Quản lý bài nộp thực hành"
      subtitle={`Sinh viên Premium nộp GitHub — Admin chấm Đã xem / Đạt / Không đạt. ${pendingCount} bài chờ xử lý.`}
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý đề thi", to: "/admin/exams" },
        { label: "Quản lý bài nộp thực hành" },
      ]}
    >
      <section className={styles.panel}>
        <div className={styles.filterShell}>
          <div className={styles.searchRow}>
            <input
              type="search"
              className={styles.search}
              placeholder="Tìm sinh viên, môn, mã đề, link GitHub..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm bài nộp"
            />
            <span className={styles.resultChip}>
              {filteredCount} bài{hasActiveFilters ? " · đã lọc" : ""}
            </span>
          </div>

          <div className={styles.filterRow}>
            <select
              className={styles.select}
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Lọc môn học"
            >
              <option value="all">Tất cả môn</option>
              {courseOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc trạng thái"
            >
              {SUBMISSION_STATUS_FILTERS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={sortPreset}
              onChange={(e) => setSortPreset(e.target.value)}
              aria-label="Sắp xếp"
            >
              {SUBMISSION_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className={styles.filterActions}>
              <button
                type="button"
                className={styles.btnReset}
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        <p className={styles.hint} style={{ marginTop: 0 }}>
          Mặc định sắp xếp <strong>Nộp mới nhất</strong>. Cũng xem theo đề tại{" "}
          <Link to={resolveAdminExamLink("PRF192")} className={styles.link}>
            PRF192
          </Link>
          .
        </p>

        {filteredCount === 0 ? (
          <p className={pageStyles.empty}>Không có bài nộp phù hợp bộ lọc.</p>
        ) : (
          <>
            <ul className={pageStyles.list}>
              {pageSubmissions.map((sub) => {
                const adminExam = getAdminExams().find((e) => e.code === sub.courseCode);
                return (
                  <li key={sub.id} className={pageStyles.item}>
                    <div className={pageStyles.itemMain}>
                      <div className={pageStyles.itemHead}>
                        <h2 className={pageStyles.studentName}>{sub.displayName}</h2>
                        <span
                          className={`${pageStyles.status} ${pageStyles[`status-${sub.status}`]}`}
                        >
                          {getSubmissionStatusLabel(sub.status)}
                        </span>
                      </div>
                      <p className={pageStyles.meta}>
                        @{sub.student} ·{" "}
                        <Link to={resolveAdminExamLink(sub.courseCode)} className={styles.link}>
                          {sub.courseCode}
                        </Link>{" "}
                        · {sub.examId}
                      </p>
                      <p className={pageStyles.meta}>
                        Nộp: {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                        {sub.gradedAt
                          ? ` · Chấm: ${new Date(sub.gradedAt).toLocaleString("vi-VN")}`
                          : null}
                        {adminExam ? (
                          <>
                            {" "}
                            ·{" "}
                            <Link to={`/admin/exams/${adminExam.id}`} className={styles.link}>
                              Mở đề admin
                            </Link>
                          </>
                        ) : null}
                      </p>
                      <a
                        href={sub.githubUrl}
                        className={pageStyles.repoLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {sub.githubUrl}
                      </a>
                      {sub.feedback ? (
                        <p className={pageStyles.meta} style={{ marginTop: "0.5rem" }}>
                          Nhận xét: {sub.feedback}
                          {sub.grade ? ` · Điểm ${sub.grade}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <PracticeSubmissionGrader
                      submission={sub}
                      gradedBy={user?.username ?? "admin_sehub"}
                      onGraded={handleGraded}
                      compact
                    />
                  </li>
                );
              })}
            </ul>

            <footer className={styles.tableFooter}>
              <p className={styles.tableFooterMeta}>
                Hiển thị {rangeStart}–{rangeEnd} / {filteredCount} bài nộp
              </p>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                ariaLabel="Phân trang bài nộp thực hành"
              />
            </footer>
          </>
        )}
      </section>
    </AdminPageLayout>
  );
}

export default AdminPracticeSubmissionsPage;
