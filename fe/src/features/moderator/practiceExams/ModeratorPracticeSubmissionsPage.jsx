import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import { useAuth } from "@/context";
import PracticeSubmissionGrader from "@/features/exams/PracticeSubmissionGrader/PracticeSubmissionGrader";
import {
  getSubmissionStatusLabel,
} from "@/features/exams/practiceExamSubmissions";
import {
  SUBMISSION_SORT_OPTIONS,
  SUBMISSION_STATUS_FILTERS,
  usePracticeSubmissionsList,
} from "@/features/exams/usePracticeSubmissionsList";
import styles from "@/features/moderator/shared/moderatorPage.module.css";
import pageStyles from "./ModeratorPracticeSubmissionsPage.module.css";

/**
 * @fileoverview Trang chấm bài nộp thực hành (GitHub) của Moderator — §3.4.
 *
 * Liệt kê bài nộp sinh viên Premium, lọc theo môn / trạng thái / sắp xếp,
 * phân trang và chấm Đã xem / Đạt / Không đạt qua `PracticeSubmissionGrader`.
 *
 * @module features/moderator/practiceExams/ModeratorPracticeSubmissionsPage
 */

/**
 * Trang danh sách bài nộp thực hành cần chấm.
 *
 * @returns {import('react').ReactElement} Bảng bài nộp kèm bộ lọc và phân trang.
 */
function ModeratorPracticeSubmissionsPage() {
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
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Bài nộp thực hành</h1>
          <p className={styles.subtitle}>
            Sinh viên Premium nộp link GitHub — Mod chấm Đã xem / Đạt / Không đạt (§3.4).
            {pendingCount > 0 ? ` · ${pendingCount} bài chờ chấm` : null}
          </p>
        </div>
        <Button to="/moderator/practice-exams/add" className={pageStyles.addExamBtn}>
          <FontAwesomeIcon icon={faPlus} aria-hidden />
          Thêm đề thực hành
        </Button>
      </header>

      <section className={styles.panel}>
        <div className={pageStyles.filterShell}>
          <div className={pageStyles.searchRow}>
            <input
              type="search"
              className={pageStyles.searchInput}
              placeholder="Tìm sinh viên, môn, mã đề, GitHub..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm bài nộp"
            />
            <span className={pageStyles.countChip}>
              {filteredCount} bài{hasActiveFilters ? " · đã lọc" : ""}
            </span>
          </div>

          <div className={pageStyles.toolbar}>
            <div className={pageStyles.filterGroup}>
              <label className={pageStyles.filterField}>
                <span className={pageStyles.filterLabel}>Môn học</span>
                <select
                  className={pageStyles.select}
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                >
                  <option value="all">Tất cả môn</option>
                  {courseOptions.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
              <label className={pageStyles.filterField}>
                <span className={pageStyles.filterLabel}>Trạng thái</span>
                <select
                  className={pageStyles.select}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {SUBMISSION_STATUS_FILTERS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={pageStyles.filterField}>
                <span className={pageStyles.filterLabel}>Sắp xếp</span>
                <select
                  className={pageStyles.select}
                  value={sortPreset}
                  onChange={(e) => setSortPreset(e.target.value)}
                >
                  {SUBMISSION_SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className={pageStyles.btnReset}
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {filteredCount === 0 ? (
          <p className={pageStyles.empty}>Không có bài nộp phù hợp bộ lọc.</p>
        ) : (
          <>
            <ul className={pageStyles.list}>
              {pageSubmissions.map((sub) => (
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
                      @{sub.student} · {sub.courseCode} · {sub.examId}
                    </p>
                    <p className={pageStyles.meta}>
                      Nộp: {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                      {sub.gradedAt
                        ? ` · Chấm: ${new Date(sub.gradedAt).toLocaleString("vi-VN")}`
                        : null}
                      {sub.gradedBy ? ` · Chấm bởi @${sub.gradedBy}` : null}
                    </p>
                    <a
                      href={sub.githubUrl}
                      className={pageStyles.repoLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {sub.githubUrl}
                    </a>
                  </div>
                  <PracticeSubmissionGrader
                    submission={sub}
                    gradedBy={user?.username ?? "moderator"}
                    onGraded={handleGraded}
                    compact
                  />
                </li>
              ))}
            </ul>

            <footer className={pageStyles.tableFooter}>
              <p className={pageStyles.footerMeta}>
                Hiển thị <strong>{rangeStart}–{rangeEnd}</strong> / {filteredCount} bài nộp
              </p>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                ariaLabel="Phân trang bài nộp thực hành"
                alwaysShow
              />
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

export default ModeratorPracticeSubmissionsPage;
