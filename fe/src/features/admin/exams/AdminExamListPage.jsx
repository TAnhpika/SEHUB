import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import { useToast } from "@/common/Toast/ToastProvider";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import {
  getExamListPaperLabel,
  getExamSubjectCode,
} from "@/utils/examDisplay";
import AdminRowActions from "@/features/admin/shared/AdminRowActions";
import AdminTableSortHeader from "@/features/admin/shared/AdminTableSortHeader";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import {
  ADMIN_EXAMS_PAGE_SIZE,
  EXAM_SEMESTERS,
  EXAM_STATUS_LABELS,
  EXAM_TRACKS,
  getAdminExams,
  getAdminPendingExams,
  getSemesterLabel,
  getTrackLabel,
  loadAdminExams,
  loadAdminPendingExams,
  removeAdminExam,
} from "@/features/admin/exams/adminExamData";
import { getSubmissionCountByCourseCode } from "@/features/exams/practiceExamSubmissions";
import examStyles from "@/features/admin/exams/AdminExam.module.css";
import listStyles from "@/features/admin/exams/AdminExamListPage.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const SORT_PRESETS = [
  { value: "updatedAt:desc", label: "Cập nhật mới nhất" },
  { value: "updatedAt:asc", label: "Cập nhật cũ nhất" },
  { value: "code:asc", label: "Mã môn A → Z" },
  { value: "code:desc", label: "Mã môn Z → A" },
  { value: "title:asc", label: "Tiêu đề A → Z" },
  { value: "title:desc", label: "Tiêu đề Z → A" },
  { value: "questionCount:desc", label: "Số câu nhiều → ít" },
  { value: "questionCount:asc", label: "Số câu ít → nhiều" },
  { value: "status:asc", label: "Trạng thái A → Z" },
];

const TYPE_OPTIONS = [
  { id: "all", label: "Tất cả loại" },
  { id: "final", label: "Cuối kỳ" },
  { id: "practice", label: "Thực hành" },
];

const STATUS_OPTIONS = [
  { id: "all", label: "Tất cả trạng thái" },
  { id: "published", label: EXAM_STATUS_LABELS.published },
  { id: "draft", label: EXAM_STATUS_LABELS.draft },
];

function compareExams(a, b, sortBy, sortDir) {
  const mul = sortDir === "asc" ? 1 : -1;

  if (sortBy === "questionCount") {
    return mul * (a.questionCount - b.questionCount);
  }

  const fields = {
    code: [getExamSubjectCode(a), getExamSubjectCode(b)],
    title: [getExamListPaperLabel(a), getExamListPaperLabel(b)],
    type: [a.type, b.type],
    status: [a.status, b.status],
    updatedAt: [a.updatedAt, b.updatedAt],
  };

  const pair = fields[sortBy];
  if (!pair) return 0;
  return mul * String(pair[0]).localeCompare(String(pair[1]), "vi");
}

function mergeExamLists(primary = [], secondary = []) {
  const merged = new Map();
  [...secondary, ...primary].forEach((exam) => {
    if (exam?.id) {
      merged.set(exam.id, exam);
    }
  });
  return [...merged.values()];
}

function AdminExamListPage() {
  const { showToast } = useToast();
  const location = useLocation();
  const [exams, setExams] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(
    () => location.state?.openStatusFilter ?? "published",
  );
  const [trackFilter, setTrackFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [pendingCount, setPendingCount] = useState(() => getAdminPendingExams().length);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);

    if (location.state?.openStatusFilter) {
      setStatusFilter(location.state.openStatusFilter);
    }

    loadAdminExams().then((items) => {
      if (cancelled) return;
      const preloaded = location.state?.preloadedExams ?? [];
      setExams(mergeExamLists(items, preloaded));
      setListLoading(false);
    });
    loadAdminPendingExams().then((items) => {
      if (!cancelled) setPendingCount(items.length);
    });
    return () => {
      cancelled = true;
    };
  }, [location.key, location.state?.refreshExams]);
  const sortPresetValue = `${sortBy}:${sortDir}`;

  const hasActiveFilters =
    query.trim() !== "" ||
    typeFilter !== "all" ||
    statusFilter !== "published" ||
    trackFilter !== "all" ||
    semesterFilter !== "all" ||
    sortBy !== "updatedAt" ||
    sortDir !== "desc";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exams.filter((exam) => {
      if (typeFilter !== "all" && exam.typeKey !== typeFilter) return false;
      if (statusFilter !== "all" && exam.status !== statusFilter) return false;
      if (trackFilter !== "all" && exam.track !== trackFilter) return false;
      if (semesterFilter !== "all" && exam.semester !== semesterFilter) return false;
      if (!q) return true;
      const subjectCode = getExamSubjectCode(exam).toLowerCase();
      const paperLabel = getExamListPaperLabel(exam).toLowerCase();
      return (
        subjectCode.includes(q)
        || paperLabel.includes(q)
        || exam.code.toLowerCase().includes(q)
        || exam.title.toLowerCase().includes(q)
      );
    });
  }, [exams, query, typeFilter, statusFilter, trackFilter, semesterFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => compareExams(a, b, sortBy, sortDir));
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ADMIN_EXAMS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageExams = useMemo(() => {
    const start = (safePage - 1) * ADMIN_EXAMS_PAGE_SIZE;
    return sorted.slice(start, start + ADMIN_EXAMS_PAGE_SIZE);
  }, [sorted, safePage]);

  const rangeStart = sorted.length === 0 ? 0 : (safePage - 1) * ADMIN_EXAMS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * ADMIN_EXAMS_PAGE_SIZE, sorted.length);

  useEffect(() => {
    setPage(1);
  }, [query, typeFilter, statusFilter, trackFilter, semesterFilter, sortBy, sortDir]);

  function handlePageChange(next) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(column === "updatedAt" || column === "questionCount" ? "desc" : "asc");
    }
  }

  function handleSortPresetChange(event) {
    const [col, dir] = event.target.value.split(":");
    setSortBy(col);
    setSortDir(dir === "asc" ? "asc" : "desc");
  }

  function resetFilters() {
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("published");
    setTrackFilter("all");
    setSemesterFilter("all");
    setSortBy("updatedAt");
    setSortDir("desc");
  }

  function confirmDelete() {
    if (!deleteId) return;
    const target = exams.find((e) => e.id === deleteId);
    removeAdminExam(deleteId);
    setExams(getAdminExams());
    setDeleteId(null);
    showToast(`Đã xóa đề ${target?.code ?? ""}.`);
  }

  const deleteTarget = deleteId ? exams.find((e) => e.id === deleteId) : null;

  return (
    <AdminPageLayout
      title="Quản lý đề thi"
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Quản lý đề thi" }]}
      actions={
        <>
          <Button look="outline" to="/admin/exams/submissions">
            Quản lý bài nộp thực hành
          </Button>
          <Button look="outline" to="/admin/exams/pending">
            Hàng chờ duyệt ({pendingCount})
          </Button>
          <Button to="/admin/exams/new">Thêm đề mới</Button>
        </>
      }
    >
      <section className={styles.panel}>
        <div className={listStyles.filterShell}>
          <div className={listStyles.searchRow}>
            <input
              type="search"
              className={listStyles.searchInput}
              placeholder="Tìm theo mã môn hoặc tiêu đề..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm đề thi"
            />
            <span className={listStyles.resultChip}>
              {sorted.length} đề{hasActiveFilters ? " · đã lọc" : ""}
            </span>
          </div>

          <div className={listStyles.filterRow}>
            <div className={listStyles.selectGroup}>
              <div className={listStyles.selectField}>
                <label htmlFor="exam-type">Loại đề</label>
                <select
                  id="exam-type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={listStyles.selectField}>
                <label htmlFor="exam-status">Trạng thái</label>
                <select
                  id="exam-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={listStyles.selectField}>
                <label htmlFor="exam-track">Ngành</label>
                <select
                  id="exam-track"
                  value={trackFilter}
                  onChange={(e) => setTrackFilter(e.target.value)}
                >
                  {EXAM_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={listStyles.selectField}>
                <label htmlFor="exam-semester">Kỳ học</label>
                <select
                  id="exam-semester"
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                >
                  {EXAM_SEMESTERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`${listStyles.selectField} ${listStyles.sortField}`}>
                <label htmlFor="exam-sort">Sắp xếp</label>
                <select
                  id="exam-sort"
                  value={sortPresetValue}
                  onChange={handleSortPresetChange}
                >
                  {SORT_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={listStyles.metaActions}>
              <button
                type="button"
                className={listStyles.btnReset}
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <AdminTableSortHeader
                  label="Mã môn"
                  column="code"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <AdminTableSortHeader
                  label="Mã đề thi / Tiêu đề"
                  column="title"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <AdminTableSortHeader
                  label="Loại"
                  column="type"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th>Ngành / Kỳ</th>
                <th>Bài nộp</th>
                <AdminTableSortHeader
                  label="Số câu"
                  column="questionCount"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <AdminTableSortHeader
                  label="Trạng thái"
                  column="status"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <AdminTableSortHeader
                  label="Cập nhật"
                  column="updatedAt"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th className={styles.colActions}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pageExams.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "#737686", padding: "2rem" }}>
                    Không có đề thi phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                pageExams.map((exam) => (
                  <tr key={exam.id}>
                    <td>
                      <span className={styles.cellMain}>{getExamSubjectCode(exam)}</span>
                    </td>
                    <td>{getExamListPaperLabel(exam)}</td>
                    <td>{exam.type}</td>
                    <td>
                      <span className={styles.cellSub}>
                        {getTrackLabel(exam.track)} · {getSemesterLabel(exam.semester)}
                      </span>
                    </td>
                    <td>
                      {exam.typeKey === "practice" ? (
                        <Link to={`/admin/exams/${exam.id}`} className={styles.link}>
                          {getSubmissionCountByCourseCode(exam.code)} bài
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{exam.questionCount > 0 ? exam.questionCount : "—"}</td>
                    <td>
                      <StatusBadge
                        status={exam.status === "published" ? "published" : "draft"}
                        label={EXAM_STATUS_LABELS[exam.status] ?? EXAM_STATUS_LABELS.draft}
                      />
                    </td>
                    <td>{exam.updatedAt}</td>
                    <td className={styles.colActions}>
                      <AdminRowActions
                        viewTo={`/admin/exams/${exam.id}`}
                        editTo={`/admin/exams/${exam.id}/edit`}
                        onDelete={() => setDeleteId(exam.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {sorted.length > 0 ? (
          <footer className={listStyles.tableFooter}>
            <p className={listStyles.footerMeta}>
              Hiển thị <strong>{rangeStart}–{rangeEnd}</strong> / {sorted.length} đề
              <span className={listStyles.pageBadge}>
                Trang {safePage}/{totalPages}
              </span>
            </p>
            <div className={listStyles.paginationWrap}>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                ariaLabel="Phân trang danh sách đề thi"
                alwaysShow
              />
            </div>
          </footer>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className={examStyles.modalBackdrop} role="presentation" onClick={() => setDeleteId(null)}>
          <div
            className={examStyles.modal}
            role="alertdialog"
            aria-labelledby="delete-exam-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-exam-title" className={examStyles.modalTitle}>
              Xóa đề thi?
            </h2>
            <p className={examStyles.modalDesc}>
              Đề <strong>[{deleteTarget.code}] {deleteTarget.title}</strong> sẽ bị gỡ khỏi hệ
              thống. Hành động không hoàn tác.
            </p>
            <div className={examStyles.modalActions}>
              <Button look="outline" type="button" onClick={() => setDeleteId(null)}>
                Hủy
              </Button>
              <Button type="button" onClick={confirmDelete}>
                Xóa đề
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageLayout>
  );
}

export default AdminExamListPage;
