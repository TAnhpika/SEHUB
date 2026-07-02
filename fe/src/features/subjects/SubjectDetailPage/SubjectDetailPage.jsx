import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faClockRotateLeft,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "@/common/Pagination/Pagination";
import { useAuth } from "@/context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  getAttemptHistoryContinueHref,
  getAttemptHistoryResultHref,
  loadExamAttemptHistory,
} from "@/features/exams/examAttemptHistory";
import {
  EXAMS_PER_PAGE,
  filterExamPapers,
  getSubjectDetailConfig,
  loadExamPapersForCourse,
  TERM_OPTIONS,
  YEAR_OPTIONS,
} from "./subjectDetailData";
import { loadDocumentItemsForCourse } from "@/features/documents/studentDocumentsData";
import SubjectDetailSkeleton from "@/features/subjects/SubjectDetailSkeleton/SubjectDetailSkeleton";
import styles from "./SubjectDetailPage.module.css";

function SubjectDetailPage({ page }) {
  const { courseCode } = useParams();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [yearFilter, setYearFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useRequireAuth();
  const scope = pathname.startsWith("/home/") ? "home" : "community";
  const guestOnCommunity = scope === "community" && !isAuthenticated;
  const config = getSubjectDetailConfig(page, scope);
  const semesterQuery = searchParams.get("semester");
  const backHref =
    semesterQuery && semesterQuery !== "all"
      ? `${config.backTo}?semester=${encodeURIComponent(semesterQuery)}`
      : config.backTo;
  const code = courseCode?.toUpperCase() ?? "";
  const isDocumentsPage = page === "documents";

  const { data: allExams, loading: listLoading } = useAsyncData(
    () =>
      (isDocumentsPage
        ? loadDocumentItemsForCourse(code)
        : loadExamPapersForCourse(code, config.pageKey)
      ).catch(() => []),
    [code, config.pageKey, isDocumentsPage],
    { initialData: [] },
  );

  const exams = useMemo(
    () => filterExamPapers(allExams, yearFilter, termFilter),
    [allExams, yearFilter, termFilter],
  );

  const isReviewPage = page === "review";
  const showAttemptHistory = isReviewPage && isAuthenticated && !guestOnCommunity;

  const { data: attemptHistory, loading: historyLoading } = useAsyncData(
    () => (showAttemptHistory ? loadExamAttemptHistory(code, page) : Promise.resolve([])),
    [code, page, showAttemptHistory],
    { initialData: [] },
  );

  const totalPages = Math.max(1, Math.ceil(exams.length / EXAMS_PER_PAGE));
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const safePage = Math.min(currentPage, totalPages);

  const pageExams = useMemo(() => {
    const start = (safePage - 1) * EXAMS_PER_PAGE;
    return exams.slice(start, start + EXAMS_PER_PAGE);
  }, [exams, safePage]);

  function resetPageParams() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("page");
      return next;
    });
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === safePage) return;
    setSearchParams(page === 1 ? {} : { page: String(page) });
    document.getElementById("feed-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getExamNavState(exam) {
    return exam.apiId ? { apiExamId: exam.apiId } : undefined;
  }

  function getExamHref(exam) {
    return `${config.detailBase}/${code}/${encodeURIComponent(exam.id)}`;
  }

  function handleExamClick(exam) {
    const href = getExamHref(exam);
    const loginMessage = isDocumentsPage
      ? "Vui lòng đăng nhập để xem tài liệu."
      : "Vui lòng đăng nhập để xem đề thi.";

    if (guestOnCommunity) {
      if (!requireAuth(loginMessage, { guestOnly: true, redirectTo: href })) return;
    }

    navigate(href, { state: getExamNavState(exam) });
  }

  if (listLoading) {
    return <SubjectDetailSkeleton isDocuments={isDocumentsPage} />;
  }

  return (
    <div className={styles.page}>
      <Link to={backHref} className={styles.back}>
        <FontAwesomeIcon icon={faChevronLeft} />
        Quay lại
      </Link>

      <header className={styles.header}>
        <span className={styles["header-icon"]} aria-hidden="true">
          <FontAwesomeIcon icon={faFileLines} />
        </span>
        <div>
          <h1 className={styles.title}>
            {config.titlePrefix} - {code}
          </h1>
          <p className={styles.subtitle}>Mã môn: {code}</p>
        </div>
      </header>

      <div className={styles["filter-bar"]}>
        <label className={styles.filter}>
          <select
            value={yearFilter}
            onChange={(event) => {
              setYearFilter(event.target.value);
              resetPageParams();
            }}
            aria-label="Lọc theo năm"
          >
            {YEAR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FontAwesomeIcon icon={faChevronDown} className={styles["filter-icon"]} />
        </label>

        <label className={styles.filter}>
          <select
            value={termFilter}
            onChange={(event) => {
              setTermFilter(event.target.value);
              resetPageParams();
            }}
            aria-label="Lọc theo kỳ học"
          >
            {TERM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FontAwesomeIcon icon={faChevronDown} className={styles["filter-icon"]} />
        </label>
      </div>

      {showAttemptHistory ? (
        <section className={styles.historySection} aria-label={`Lịch sử làm bài ${code}`}>
          <div className={styles.historyHead}>
            <span className={styles.historyIcon} aria-hidden="true">
              <FontAwesomeIcon icon={faClockRotateLeft} />
            </span>
            <div>
              <h2 className={styles.historyTitle}>Lịch sử làm bài</h2>
              <p className={styles.historySubtitle}>Các lần làm đề cuối kỳ môn {code}</p>
            </div>
          </div>

          {historyLoading ? (
            <p className={styles.historyEmpty}>Đang tải lịch sử...</p>
          ) : attemptHistory.length === 0 ? (
            <p className={styles.historyEmpty}>Chưa có lần làm bài nào cho môn này.</p>
          ) : (
            <div className={styles.historyTableWrap}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th scope="col">Mã đề</th>
                    <th scope="col">Thời gian</th>
                    <th scope="col">Điểm</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {attemptHistory.map((item) => (
                    <tr key={item.attemptId}>
                      <td data-label="Mã đề">
                        <span className={styles.historyExamCode}>{item.examPaperCode}</span>
                      </td>
                      <td data-label="Thời gian">
                        <time dateTime={item.submittedAt ?? item.startedAt}>
                          {item.submittedAtLabel ?? item.startedAtLabel}
                        </time>
                      </td>
                      <td data-label="Điểm">
                        {item.isSubmitted && item.scorePercent != null ? (
                          <span className={styles.historyScore}>{item.scorePercent}%</span>
                        ) : (
                          <span className={styles.historyScoreMuted}>—</span>
                        )}
                      </td>
                      <td data-label="Trạng thái">
                        <span
                          className={`${styles.historyStatus} ${
                            item.isSubmitted
                              ? styles.historyStatusSubmitted
                              : item.isInProgress
                                ? styles.historyStatusProgress
                                : ""
                          }`}
                        >
                          {item.statusLabel}
                        </span>
                      </td>
                      <td data-label="Hành động">
                        {item.isSubmitted ? (
                          <Link
                            to={getAttemptHistoryResultHref(item, config, code)}
                            className={styles.historyAction}
                          >
                            Xem kết quả
                          </Link>
                        ) : item.isInProgress ? (
                          <Link
                            to={getAttemptHistoryContinueHref(item, code)}
                            state={{ scope, apiExamId: item.examId }}
                            className={styles.historyAction}
                          >
                            Tiếp tục
                          </Link>
                        ) : (
                          <span className={styles.historyScoreMuted}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section
        className={styles["table-wrap"]}
        aria-label={isDocumentsPage ? `Danh sách tài liệu ${code}` : `Danh sách đề ${code}`}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              {isDocumentsPage ? (
                <>
                  <th scope="col">Tên file</th>
                  <th scope="col">Định dạng</th>
                </>
              ) : (
                <>
                  <th scope="col">Mã đề</th>
                  <th scope="col">Loại đề</th>
                  <th scope="col">Số câu hỏi</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pageExams.map((exam) => (
              <tr key={exam.id}>
                <td>
                  {guestOnCommunity ? (
                    <button
                      type="button"
                      className={styles["exam-link"]}
                      onClick={() => handleExamClick(exam)}
                    >
                      <span className={styles["exam-code"]}>
                        {isDocumentsPage ? exam.name ?? exam.id : exam.id}
                      </span>
                      <FontAwesomeIcon icon={faChevronRight} className={styles.chevron} />
                    </button>
                  ) : (
                    <Link to={getExamHref(exam)} state={getExamNavState(exam)} className={styles["exam-link"]}>
                      <span className={styles["exam-code"]}>
                        {isDocumentsPage ? exam.name ?? exam.id : exam.id}
                      </span>
                      <FontAwesomeIcon icon={faChevronRight} className={styles.chevron} />
                    </Link>
                  )}
                  <time className={styles.time} dateTime={exam.uploadedAt}>
                    {exam.uploadedAt}
                  </time>
                </td>
                {isDocumentsPage ? (
                  <td className={styles.count}>
                    {exam.name?.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ?? "—"}
                  </td>
                ) : (
                  <>
                    <td className={styles.type}>{exam.type}</td>
                    <td className={styles.count}>{exam.questionCount}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {exams.length === 0 && (
          <p className={styles.empty}>
            {isDocumentsPage
              ? "Chưa có tài liệu cho môn này."
              : "Chưa có đề đã xuất bản cho môn này."}
          </p>
        )}
      </section>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={goToPage}
        ariaLabel="Phân trang danh sách đề"
      />
    </div>
  );
}

export default SubjectDetailPage;
