import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faClock,
  faCreditCard,
  faFileLines,
  faFlag,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import DashboardBadge from "@/features/admin/dashboard/DashboardBadge";
import { ACTIVITY_BADGE_VARIANT } from "@/features/admin/dashboard/dashboardConstants";
import {
  ADMIN_ACTIVITY_PAGE_SIZE,
  getMergedActivityLog,
} from "@/features/admin/adminMockData";
import logStyles from "./AdminActivityLogPage.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const ACTIVITY_TYPE_LABEL = {
  exam: "Đề thi",
  report: "Báo cáo",
  payment: "Thanh toán",
  user: "Tài khoản",
};

const TYPE_META = {
  all: {
    label: "Tất cả",
    icon: faClipboardList,
    accent: "#004ac6",
    bg: "#e8f0fe",
  },
  exam: {
    label: "Đề thi",
    icon: faFileLines,
    accent: "#2563eb",
    bg: "#dbeafe",
  },
  report: {
    label: "Báo cáo",
    icon: faFlag,
    accent: "#dc2626",
    bg: "#fee2e2",
  },
  payment: {
    label: "Thanh toán",
    icon: faCreditCard,
    accent: "#059669",
    bg: "#d1fae5",
  },
  user: {
    label: "Tài khoản",
    icon: faUser,
    accent: "#7c3aed",
    bg: "#ede9fe",
  },
};

const STAT_TYPES = ["all", "exam", "report", "payment", "user"];

const PERIOD_OPTIONS = [
  { value: "all", label: "Mọi thời gian" },
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "7 ngày qua" },
  { value: "month", label: "30 ngày qua" },
];

/** Mock “hôm nay” — đồng bộ dữ liệu demo */
const MOCK_TODAY = new Date("2026-06-04T12:00:00");

function getItemAgeDays(time) {
  if (!time) return 999;
  const trimmed = time.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return 0;
  if (trimmed.startsWith("Hôm qua")) return 1;
  const relative = trimmed.match(/(\d+)\s*ngày trước/);
  if (relative) return parseInt(relative[1], 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed.slice(0, 10) + "T12:00:00");
    const diffMs = MOCK_TODAY.getTime() - parsed.getTime();
    return Math.max(0, Math.floor(diffMs / 86400000));
  }
  return 999;
}

function matchesPeriodFilter(item, period) {
  if (period === "all") return true;
  const days = getItemAgeDays(item.time);
  if (period === "today") return days === 0;
  if (period === "week") return days <= 7;
  if (period === "month") return days <= 30;
  return true;
}

function resolveTimeGroup(time) {
  if (!time) return "Khác";
  if (/^\d{1,2}:\d{2}$/.test(time.trim())) return "Hôm nay";
  if (time.startsWith("Hôm qua")) return "Hôm qua";
  if (time.includes("ngày trước")) return time;
  if (/^\d{4}-\d{2}-\d{2}/.test(time)) {
    const [datePart] = time.split(" ");
    const [y, m, d] = datePart.split("-");
    return `${d}/${m}/${y}`;
  }
  return time;
}

function groupTimelineItems(items) {
  /** @type {Array<{ label: string, items: typeof items }>} */
  const groups = [];
  let currentLabel = null;

  for (const item of items) {
    const label = resolveTimeGroup(item.time);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, items: [item] });
    } else {
      groups[groups.length - 1].items.push(item);
    }
  }

  return groups;
}

function AdminActivityLogPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [query, setQuery] = useState("");

  const activityLog = getMergedActivityLog();

  const stats = useMemo(() => {
    const counts = { all: activityLog.length, exam: 0, report: 0, payment: 0, user: 0 };
    for (const item of activityLog) {
      if (counts[item.type] != null) counts[item.type] += 1;
    }
    return counts;
  }, [activityLog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activityLog.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!matchesPeriodFilter(item, periodFilter)) return false;
      if (!q) return true;
      return (
        item.text.toLowerCase().includes(q) ||
        item.time.toLowerCase().includes(q) ||
        (ACTIVITY_TYPE_LABEL[item.type] ?? "").toLowerCase().includes(q)
      );
    });
  }, [activityLog, typeFilter, periodFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_ACTIVITY_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * ADMIN_ACTIVITY_PAGE_SIZE;
    return filtered.slice(start, start + ADMIN_ACTIVITY_PAGE_SIZE);
  }, [filtered, safePage]);

  const groupedPage = useMemo(() => groupTimelineItems(pageItems), [pageItems]);

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * ADMIN_ACTIVITY_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * ADMIN_ACTIVITY_PAGE_SIZE, filtered.length);

  const hasActiveFilters =
    query.trim() !== "" || typeFilter !== "all" || periodFilter !== "all";

  useEffect(() => {
    setPage(1);
  }, [typeFilter, periodFilter, query]);

  function handlePageChange(next) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFilters() {
    setQuery("");
    setTypeFilter("all");
    setPeriodFilter("all");
  }

  return (
    <AdminPageLayout
      title="Nhật ký hoạt động"
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Nhật ký hoạt động" },
      ]}
    >
      <div className={logStyles.page}>
        <div className={logStyles.statsRow}>
          {STAT_TYPES.map((type) => {
            const meta = TYPE_META[type];
            const highlight = typeFilter === type;
            return (
              <div
                key={type}
                className={`${logStyles.statCard} ${highlight ? logStyles.statCardHighlight : ""}`}
                style={{
                  "--stat-accent": meta.accent,
                  "--stat-bg": meta.bg,
                }}
              >
                <span className={logStyles.statIcon}>
                  <FontAwesomeIcon icon={meta.icon} />
                </span>
                <span className={logStyles.statBody}>
                  <span className={logStyles.statValue}>{stats[type]}</span>
                  <span className={logStyles.statLabel}>{meta.label}</span>
                </span>
              </div>
            );
          })}
        </div>

        <section className={styles.panel}>
          <div className={styles.filterShell}>
            <div className={styles.searchRow}>
              <input
                type="search"
                className={styles.search}
                placeholder="Tìm nội dung, thời gian, loại sự kiện..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Tìm trong nhật ký"
              />
              <span className={styles.resultChip}>
                {filtered.length} sự kiện{hasActiveFilters ? " · đã lọc" : ""}
              </span>
            </div>

            <div className={styles.filterRow}>
              <select
                className={styles.select}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Lọc loại sự kiện"
              >
                <option value="all">Tất cả loại</option>
                <option value="exam">Đề thi</option>
                <option value="report">Báo cáo</option>
                <option value="payment">Thanh toán</option>
                <option value="user">Tài khoản</option>
              </select>

              <select
                className={styles.select}
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                aria-label="Lọc thời gian"
              >
                {PERIOD_OPTIONS.map((opt) => (
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

          <header className={logStyles.panelHead}>
            <div>
              <h2 className={logStyles.panelTitle}>Dòng thời gian</h2>
              <p className={logStyles.panelDesc}>
                Sắp xếp mới nhất trước — gồm audit thao tác Admin trên tài khoản.
              </p>
            </div>
          </header>

          {filtered.length === 0 ? (
            <div className={logStyles.empty}>
              <span className={logStyles.emptyIcon}>
                <FontAwesomeIcon icon={faClipboardList} />
              </span>
              <p className={logStyles.emptyTitle}>Không có sự kiện phù hợp</p>
              <p className={logStyles.emptyDesc}>
                Thử đổi loại sự kiện, khoảng thời gian hoặc bấm Xóa bộ lọc.
              </p>
            </div>
          ) : (
            <ul className={logStyles.timeline}>
              {groupedPage.map((group) => (
                <li key={group.label} className={logStyles.group}>
                  <div className={logStyles.groupLabel}>
                    <span className={logStyles.groupLabelDot} aria-hidden />
                    {group.label}
                  </div>
                  <ul className={logStyles.timeline}>
                    {group.items.map((item) => {
                      const meta = TYPE_META[item.type] ?? TYPE_META.all;
                      return (
                        <li key={item.id} className={logStyles.timelineItem}>
                          <span
                            className={logStyles.node}
                            style={{
                              "--node-accent": meta.accent,
                              "--node-bg": meta.bg,
                            }}
                            aria-hidden
                          >
                            <FontAwesomeIcon icon={meta.icon} />
                          </span>
                          <article className={logStyles.card}>
                            <div className={logStyles.cardMain}>
                              <p className={logStyles.cardText}>{item.text}</p>
                              <div className={logStyles.cardMeta}>
                                <span className={logStyles.cardTime}>
                                  <FontAwesomeIcon
                                    icon={faClock}
                                    className={logStyles.cardTimeIcon}
                                  />
                                  {item.time}
                                </span>
                              </div>
                            </div>
                            <div className={logStyles.cardAside}>
                              <DashboardBadge
                                variant={ACTIVITY_BADGE_VARIANT[item.type] ?? "neutral"}
                              >
                                {ACTIVITY_TYPE_LABEL[item.type] ?? item.type}
                              </DashboardBadge>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          <AdminTableFooter
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={filtered.length}
            unit="sự kiện"
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            ariaLabel="Phân trang nhật ký hoạt động"
          />
        </section>
      </div>
    </AdminPageLayout>
  );
}

export default AdminActivityLogPage;
