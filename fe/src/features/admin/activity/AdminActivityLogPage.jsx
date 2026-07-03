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
import { ADMIN_ACTIVITY_PAGE_SIZE } from "@/features/admin/adminMockData";
import { loadAdminActivityLog } from "@/features/admin/activity/adminActivityData";
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
  },
  exam: {
    label: "Đề thi",
    icon: faFileLines,
  },
  report: {
    label: "Báo cáo",
    icon: faFlag,
  },
  payment: {
    label: "Thanh toán",
    icon: faCreditCard,
  },
  user: {
    label: "Tài khoản",
    icon: faUser,
  },
};

const STAT_TYPES = ["all", "exam", "report", "payment", "user"];

const DEFAULT_PERIOD_FILTER = "week";

const PERIOD_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "7 ngày qua" },
  { value: "month", label: "30 ngày qua" },
  { value: "3months", label: "3 tháng vừa qua" },
  { value: "6months", label: "6 tháng vừa qua" },
  { value: "year", label: "1 năm vừa qua" },
  { value: "all", label: "Mọi thời gian" },
];

const PERIOD_MAX_DAYS = {
  today: 0,
  week: 6,
  month: 29,
  "3months": 89,
  "6months": 179,
  year: 364,
};

function startOfLocalDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseActivityLogTime(time) {
  if (!time) return null;
  const trimmed = time.trim();

  const isoLike = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?/);
  if (isoLike) {
    const [, datePart, timePart] = isoLike;
    const normalizedTime = timePart?.length === 5 ? `${timePart}:00` : (timePart ?? "12:00:00");
    const parsed = new Date(`${datePart}T${normalizedTime}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const now = new Date();

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hours, minutes] = trimmed.split(":");
    const parsed = startOfLocalDay(now);
    parsed.setHours(Number(hours), Number(minutes), 0, 0);
    return parsed;
  }

  if (trimmed.startsWith("Hôm qua")) {
    const parsed = startOfLocalDay(now);
    parsed.setDate(parsed.getDate() - 1);
    return parsed;
  }

  const relative = trimmed.match(/(\d+)\s*ngày trước/);
  if (relative) {
    const parsed = startOfLocalDay(now);
    parsed.setDate(parsed.getDate() - Number(relative[1]));
    return parsed;
  }

  return null;
}

function getItemTimestamp(item) {
  if (item.sortKey) {
    const fromSortKey = new Date(item.sortKey);
    if (!Number.isNaN(fromSortKey.getTime())) {
      return fromSortKey;
    }
  }

  return parseActivityLogTime(item.time);
}

function getItemAgeDays(item, referenceDate = new Date()) {
  const itemDate = getItemTimestamp(item);
  if (!itemDate) return null;

  const todayStart = startOfLocalDay(referenceDate);
  const itemDayStart = startOfLocalDay(itemDate);
  return Math.floor((todayStart.getTime() - itemDayStart.getTime()) / 86400000);
}

function matchesPeriodFilter(item, period, referenceDate = new Date()) {
  if (period === "all") return true;

  const maxDays = PERIOD_MAX_DAYS[period];
  if (maxDays == null) return true;

  const ageDays = getItemAgeDays(item, referenceDate);
  if (ageDays == null) return false;

  return ageDays >= 0 && ageDays <= maxDays;
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
  const [periodFilter, setPeriodFilter] = useState(DEFAULT_PERIOD_FILTER);
  const [query, setQuery] = useState("");
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    let cancelled = false;
    loadAdminActivityLog().then(({ items }) => {
      if (!cancelled) setActivityLog(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const counts = { all: 0, exam: 0, report: 0, payment: 0, user: 0 };
    const periodItems = activityLog.filter((item) => matchesPeriodFilter(item, periodFilter));

    counts.all = periodItems.length;
    for (const item of periodItems) {
      if (counts[item.type] != null) counts[item.type] += 1;
    }

    return counts;
  }, [activityLog, periodFilter]);

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
    query.trim() !== "" ||
    typeFilter !== "all" ||
    periodFilter !== DEFAULT_PERIOD_FILTER;

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
    setPeriodFilter(DEFAULT_PERIOD_FILTER);
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
                role="button"
                tabIndex={0}
                className={`${logStyles.statCard} ${logStyles[`statCard-${type}`]} ${highlight ? logStyles.statCardHighlight : ""}`}
                onClick={() => setTypeFilter(type)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setTypeFilter(type);
                  }
                }}
                aria-pressed={highlight}
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
                            className={`${logStyles.node} ${logStyles[`node-${item.type}`]}`}
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
