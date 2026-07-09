import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import { useAuth } from "@/context";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import PracticeSubmissionGrader from "@/features/exams/PracticeSubmissionGrader/PracticeSubmissionGrader";
import { getSubmissionStatusLabel } from "@/features/exams/practiceExamSubmissions";
import {
  SUBMISSION_SORT_OPTIONS,
  SUBMISSION_STATUS_FILTERS,
  usePracticeSubmissionsList,
} from "@/features/exams/usePracticeSubmissionsList";
import { getAdminExams } from "@/features/admin/exams/adminExamData";
import modPageStyles from "@/features/moderator/shared/moderatorPage.module.css";
import pageStyles from "@/features/moderator/practiceExams/ModeratorPracticeSubmissionsPage.module.css";
import adminStyles from "@/features/admin/shared/adminPage.module.css";

function resolveAdminExamLink(courseCode) {
  const exam = getAdminExams().find(
    (e) => e.code === courseCode && e.typeKey === "practice" && e.status === "published",
  );
  return exam ? `/admin/exams/${exam.id}` : "/admin/exams";
}

function PracticeSubmissionsWorkspace({ portal = "moderator", highlightId = null }) {
  const { user } = useAuth();
  const highlightRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isAdminPortal = portal === "admin";
  const gradedBy = user?.username ?? (isAdminPortal ? "admin_sehub" : "moderator");

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

  useEffect(() => {
    if (!highlightId || !highlightRef.current) {
      return undefined;
    }

    highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(() => {
      highlightRef.current?.classList.remove(pageStyles.itemHighlight);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [highlightId, pageSubmissions]);

  const filterShellClass = isAdminPortal ? adminStyles.filterShell : pageStyles.filterShell;
  const searchRowClass = isAdminPortal ? adminStyles.searchRow : pageStyles.searchRow;
  const searchInputClass = isAdminPortal ? adminStyles.search : pageStyles.searchInput;
  const countChipClass = isAdminPortal ? adminStyles.resultChip : pageStyles.countChip;
  const filterRowClass = isAdminPortal ? adminStyles.filterRow : pageStyles.toolbar;
  const filterGroupClass = isAdminPortal ? undefined : pageStyles.filterGroup;
  const selectClass = isAdminPortal ? adminStyles.select : pageStyles.select;
  const filterActionsClass = isAdminPortal ? adminStyles.filterActions : undefined;
  const panelClass = isAdminPortal ? adminStyles.panel : `${modPageStyles.panel}`;
  const tableFooterClass = isAdminPortal ? adminStyles.tableFooter : pageStyles.tableFooter;
  const footerMetaClass = isAdminPortal ? adminStyles.tableFooterMeta : pageStyles.footerMeta;
  const linkClass = isAdminPortal ? adminStyles.link : undefined;

  const workspaceBody = (
    <section className={panelClass}>
      <div className={filterShellClass}>
        <div className={searchRowClass}>
          <input
            type="search"
            className={searchInputClass}
            placeholder={
              isAdminPortal
                ? "Tìm sinh viên, môn, mã đề, link GitHub..."
                : "Tìm sinh viên, môn, mã đề, GitHub..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm bài nộp"
          />
          <span className={countChipClass}>
            {filteredCount} bài{hasActiveFilters ? " · đã lọc" : ""}
          </span>
        </div>

        <div className={filterRowClass}>
          {filterGroupClass ? (
            <div className={filterGroupClass}>
              <label className={pageStyles.filterField}>
                <span className={pageStyles.filterLabel}>Môn học</span>
                <select
                  className={selectClass}
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
                  className={selectClass}
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
                  className={selectClass}
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
          ) : (
            <>
              <select
                className={selectClass}
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
                className={selectClass}
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
                className={selectClass}
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
              <div className={filterActionsClass}>
                <button
                  type="button"
                  className={adminStyles.btnReset}
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                >
                  Xóa bộ lọc
                </button>
              </div>
            </>
          )}
          {!isAdminPortal ? (
            <button
              type="button"
              className={pageStyles.btnReset}
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              Xóa bộ lọc
            </button>
          ) : null}
        </div>
      </div>

      {isAdminPortal ? (
        <p className={adminStyles.hint}>
          Mặc định sắp xếp <strong>Nộp mới nhất</strong>. Cũng xem theo đề tại{" "}
          <Link to={resolveAdminExamLink("PRF192")} className={linkClass}>
            PRF192
          </Link>
          .
        </p>
      ) : null}

      {filteredCount === 0 ? (
        <p className={pageStyles.empty}>Không có bài nộp phù hợp bộ lọc.</p>
      ) : (
        <>
          <ul className={pageStyles.list}>
            {pageSubmissions.map((sub) => {
              const adminExam = isAdminPortal
                ? getAdminExams().find((e) => e.code === sub.courseCode)
                : null;
              const isHighlighted = highlightId === sub.id;

              return (
                <li
                  key={sub.id}
                  ref={isHighlighted ? highlightRef : null}
                  className={`${pageStyles.item} ${isHighlighted ? pageStyles.itemHighlight : ""}`}
                >
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
                      {isAdminPortal ? (
                        <Link to={resolveAdminExamLink(sub.courseCode)} className={linkClass}>
                          {sub.courseCode}
                        </Link>
                      ) : (
                        sub.courseCode
                      )}{" "}
                      · {sub.examId}
                    </p>
                    <p className={pageStyles.meta}>
                      Nộp: {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                      {sub.gradedAt
                        ? ` · Chấm: ${new Date(sub.gradedAt).toLocaleString("vi-VN")}`
                        : null}
                      {sub.gradedBy ? ` · Chấm bởi @${sub.gradedBy}` : null}
                      {adminExam ? (
                        <>
                          {" "}
                          ·{" "}
                          <Link to={`/admin/exams/${adminExam.id}`} className={linkClass}>
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
                    gradedBy={gradedBy}
                    onGraded={handleGraded}
                    compact
                  />
                </li>
              );
            })}
          </ul>

          <footer className={tableFooterClass}>
            <p className={footerMetaClass}>
              Hiển thị {rangeStart}–{rangeEnd} / {filteredCount} bài nộp
            </p>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              ariaLabel="Phân trang bài nộp thực hành"
              alwaysShow={!isAdminPortal}
            />
          </footer>
        </>
      )}
    </section>
  );

  if (isAdminPortal) {
    return (
      <AdminPageLayout
        title="Bài nộp thực hành"
        subtitle={`Sinh viên Premium nộp GitHub — chấm Đã xem / Đạt / Không đạt. ${pendingCount} bài chờ xử lý.`}
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Kiểm duyệt", to: "/admin/moderation" },
          { label: "Bài nộp thực hành" },
        ]}
      >
        {workspaceBody}
      </AdminPageLayout>
    );
  }

  return (
    <div className={modPageStyles.page}>
      <header className={modPageStyles.header}>
        <div>
          <h1 className={modPageStyles.title}>Bài nộp thực hành</h1>
          <p className={modPageStyles.subtitle}>
            Sinh viên Premium nộp link GitHub — Mod chấm Đã xem / Đạt / Không đạt (§3.4).
            {pendingCount > 0 ? ` · ${pendingCount} bài chờ chấm` : null}
          </p>
        </div>
        <Button to="/moderator/practice-exams/add" className={pageStyles.addExamBtn}>
          <FontAwesomeIcon icon={faPlus} aria-hidden />
          Thêm đề thực hành
        </Button>
      </header>
      {workspaceBody}
    </div>
  );
}

export default PracticeSubmissionsWorkspace;
