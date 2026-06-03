import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "@/common/Pagination/Pagination";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  EXAMS_PER_PAGE,
  filterExamPapers,
  getExamPapersForCourse,
  SUBJECT_DETAIL_CONFIG,
  TERM_OPTIONS,
  YEAR_OPTIONS,
} from "./subjectDetailData";
import styles from "./SubjectDetailPage.module.css";

function SubjectDetailPage({ page }) {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [yearFilter, setYearFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");

  const { requireAuth } = useRequireAuth();

  const config = SUBJECT_DETAIL_CONFIG[page];
  const code = courseCode?.toUpperCase() ?? "";
  const allExams = useMemo(
    () => getExamPapersForCourse(code, config.examType, config.codePrefix),
    [code, config.examType, config.codePrefix],
  );

  const exams = useMemo(
    () => filterExamPapers(allExams, yearFilter, termFilter),
    [allExams, yearFilter, termFilter],
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

  function handleExamClick(exam) {
    if (!requireAuth("Vui lòng đăng nhập để xem đề thi.")) return;
    navigate(`${config.detailBase}/${code}/${encodeURIComponent(exam.id)}`);
  }

  return (
    <div className={styles.page}>
      <Link to={config.backTo} className={styles.back}>
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

      <section className={styles["table-wrap"]} aria-label={`Danh sách đề ${code}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Mã đề</th>
              <th scope="col">Loại đề</th>
              <th scope="col">Số câu hỏi</th>
            </tr>
          </thead>
          <tbody>
            {pageExams.map((exam) => (
              <tr key={exam.id}>
                <td>
                  <button
                    type="button"
                    className={styles["exam-link"]}
                    onClick={() => handleExamClick(exam)}
                  >
                    <span className={styles["exam-code"]}>{exam.id}</span>
                    <FontAwesomeIcon icon={faChevronRight} className={styles.chevron} />
                  </button>
                  <time className={styles.time} dateTime={exam.uploadedAt}>
                    {exam.uploadedAt}
                  </time>
                </td>
                <td className={styles.type}>{exam.type}</td>
                <td className={styles.count}>{exam.questionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {exams.length === 0 && (
          <p className={styles.empty}>Không có đề phù hợp với bộ lọc.</p>
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
