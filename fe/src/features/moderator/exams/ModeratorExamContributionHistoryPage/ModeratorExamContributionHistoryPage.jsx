import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "@/common/Pagination/Pagination";
import { useAuth } from "@/context";
import ExamContributionAuditList from "@/features/moderator/exams/components/ExamContributionAuditList/ExamContributionAuditList";
import {
  CONTRIBUTION_STATUS_FILTERS,
  CONTRIBUTION_TYPE_FILTERS,
  loadExamContributionAudit,
  loadPendingContributionCount,
} from "@/features/moderator/exams/moderatorExamContributionStore";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import { ModeratorAuditListSkeleton } from "@/features/moderator/components/ModeratorSkeleton/ModeratorSkeleton";
import styles from "./ModeratorExamContributionHistoryPage.module.css";

const PAGE_SIZE = 8;

const HISTORY_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Đóng góp đề" },
  { label: "Lịch sử đóng góp đề" },
];

function ModeratorExamContributionHistoryPage() {
  const { user } = useAuth();
  const moderator = user?.username ?? "mod_sehub";
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type");

  const [typeFilter, setTypeFilter] = useState(
    CONTRIBUTION_TYPE_FILTERS.some((filter) => filter.id === initialType) ? initialType : "all",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingFinal, setPendingFinal] = useState(0);
  const [pendingPractice, setPendingPractice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      loadExamContributionAudit(moderator, { examType: typeFilter, status: statusFilter }),
      loadPendingContributionCount(moderator, "all"),
      loadPendingContributionCount(moderator, "final"),
      loadPendingContributionCount(moderator, "practice"),
    ])
      .then(([items, totalPending, finalPending, practicePending]) => {
        if (cancelled) return;
        setAllItems(items);
        setPendingTotal(totalPending);
        setPendingFinal(finalPending);
        setPendingPractice(practicePending);
        setLoadError(null);
      })
      .catch((error) => {
        if (!cancelled) {
          setAllItems([]);
          setLoadError(error?.message ?? "Không tải được lịch sử đóng góp.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [moderator, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => allItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [allItems, safePage],
  );
  const rangeStart = allItems.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, allItems.length);

  function handleTypeChange(value) {
    setTypeFilter(value);
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <ModeratorPageShell
      title="Lịch sử đóng góp đề"
      description="Nhật ký lưu nháp và gửi duyệt đề cuối kỳ / thực hành — Admin duyệt trước khi public (§2.4)."
      crumbs={HISTORY_CRUMBS}
    >
      <div className={styles.page}>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <p className={styles.metricValue}>{pendingTotal}</p>
            <p className={styles.metricLabel}>Chờ Admin duyệt (tổng)</p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricValue}>{pendingFinal}</p>
            <p className={styles.metricLabel}>Cuối kỳ chờ duyệt</p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricValue}>{pendingPractice}</p>
            <p className={styles.metricLabel}>Thực hành chờ duyệt</p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Loại đề</span>
              <select
                className={styles.select}
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                {CONTRIBUTION_TYPE_FILTERS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Trạng thái</span>
              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {CONTRIBUTION_STATUS_FILTERS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.quickLinks}>
            <Link to="/moderator/final-exams/add">+ Thêm đề cuối kỳ</Link>
            <Link to="/moderator/practice-exams/add">+ Thêm đề thực hành</Link>
          </div>
        </div>

        <section className={styles.panel}>
          {loading ? (
            <ModeratorAuditListSkeleton aria-label="Đang tải lịch sử đóng góp" />
          ) : loadError ? (
            <p className={styles.error}>{loadError}</p>
          ) : (
            <ExamContributionAuditList
              items={pageItems}
              emptyMessage={
                user?.role === "admin"
                  ? "Admin không có đóng góp riêng. Đăng nhập Moderator (moderator@sehub.local) để xem demo, hoặc gửi đề mới từ menu bên trái."
                  : "Không có bản ghi phù hợp bộ lọc. Gửi đề mới từ menu Thêm đề cuối kỳ / Thêm đề thực hành."
              }
              description="Theo dõi mọi lần lưu nháp và gửi Admin duyệt. Trạng thái cập nhật khi Admin duyệt hoặc từ chối trên hàng chờ."
            />
          )}

          {!loading && allItems.length > PAGE_SIZE ? (
            <footer className={styles.footer}>
              <p className={styles.footerMeta}>
                Hiển thị {rangeStart}–{rangeEnd} / {allItems.length} bản ghi
              </p>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                ariaLabel="Phân trang lịch sử đóng góp đề"
                alwaysShow
              />
            </footer>
          ) : null}
        </section>
      </div>
    </ModeratorPageShell>
  );
}

export default ModeratorExamContributionHistoryPage;
