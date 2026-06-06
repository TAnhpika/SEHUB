import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faDownload,
  faEye,
  faLock,
  faPlus,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import { useToast } from "@/common/Toast/ToastProvider";
import ModeratorBadge from "@/features/moderator/components/ModeratorBadge/ModeratorBadge";
import ModeratorConfirmDialog from "@/features/moderator/components/ModeratorConfirmDialog/ModeratorConfirmDialog";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import ModeratorToolbar from "@/features/moderator/components/ModeratorToolbar/ModeratorToolbar";
import {
  filterViolatingAccounts,
  RANK_META,
  RANK_OPTIONS,
  SORT_OPTIONS,
  STATUS_META,
  STATUS_OPTIONS,
  VIOLATING_ACCOUNTS_MOCK,
  VIOLATIONS_PAGE_SIZE,
} from "@/features/moderator/violations/violationsData";
import styles from "./ViolatingAccountsPage.module.css";

const VIOLATIONS_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Quản lý" },
  { label: "Tài khoản vi phạm" },
];

const LOCK_DURATIONS = [
  { value: 1, label: "1 ngày" },
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return <ModeratorBadge label={meta.label} tone={meta.tone} dot />;
}

function RankBadge({ rank }) {
  const meta = RANK_META[rank];
  return (
    <span className={`${styles.rank} ${styles[`rank-${meta.tone}`]}`}>
      <FontAwesomeIcon icon={faTrophy} className={styles["rank-icon"]} />
      {meta.label}
    </span>
  );
}

function ViolatingAccountsPage() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState(VIOLATING_ACCOUNTS_MOCK);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [sort, setSort] = useState("violations-desc");
  const [page, setPage] = useState(1);
  const [lockTarget, setLockTarget] = useState(null);
  const [lockDays, setLockDays] = useState(7);

  const filtered = useMemo(
    () =>
      filterViolatingAccounts(accounts, {
        query,
        status: statusFilter,
        rank: rankFilter,
        sort,
      }),
    [accounts, query, statusFilter, rankFilter, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / VIOLATIONS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * VIOLATIONS_PAGE_SIZE;
    return filtered.slice(start, start + VIOLATIONS_PAGE_SIZE);
  }, [filtered, safePage]);

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * VIOLATIONS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * VIOLATIONS_PAGE_SIZE, filtered.length);

  function handleFilterChange(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function handleExport() {
    showToast("Đang xuất báo cáo tài khoản vi phạm (mock).");
  }

  function handleAddWarning() {
    showToast("Chức năng thêm cảnh báo sẽ được nối API sau.");
  }

  function handleDetail(account) {
    showToast(`Xem chi tiết: ${account.displayName} (${account.studentId})`);
  }

  function openLockModal(account) {
    setLockTarget(account);
    setLockDays(7);
  }

  function closeLockModal() {
    setLockTarget(null);
  }

  function confirmLock() {
    if (!lockTarget) return;

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === lockTarget.id ? { ...account, status: "locked" } : account,
      ),
    );
    showToast(
      `Đã khóa tạm tài khoản ${lockTarget.username} trong ${lockDays} ngày (mock).`,
    );
    closeLockModal();
  }

  const headerActions = (
    <div className={styles.headerActions}>
      <button type="button" className={styles.btnOutline} onClick={handleExport}>
        <FontAwesomeIcon icon={faDownload} />
        Xuất báo cáo
      </button>
      <button type="button" className={styles.btnPrimary} onClick={handleAddWarning}>
        <FontAwesomeIcon icon={faPlus} />
        Thêm cảnh báo
      </button>
    </div>
  );

  return (
    <ModeratorPageShell
      title="Quản lý Tài khoản vi phạm"
      description="Giám sát và xử lý các tài khoản vi phạm tiêu chuẩn cộng đồng."
      crumbs={VIOLATIONS_CRUMBS}
      actions={headerActions}
    >
      <section className={styles.card}>
        <ModeratorToolbar
          searchValue={query}
          onSearchChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          searchPlaceholder="Tìm kiếm theo Tên, Email hoặc MSSV..."
        >
          <FilterDropdown
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
            ariaLabel="Lọc trạng thái"
          />
          <FilterDropdown
            options={RANK_OPTIONS}
            value={rankFilter}
            onChange={handleFilterChange(setRankFilter)}
            ariaLabel="Lọc hạng thành viên"
          />
          <FilterDropdown
            options={SORT_OPTIONS}
            value={sort}
            onChange={handleFilterChange(setSort)}
            ariaLabel="Sắp xếp"
          />
        </ModeratorToolbar>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Email / Liên hệ</th>
                <th>Hạng thành viên</th>
                <th>Số vi phạm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    Không tìm thấy tài khoản phù hợp.
                  </td>
                </tr>
              ) : (
                pageItems.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className={styles.account}>
                        <div className={styles.avatar} aria-hidden>
                          {account.initial}
                        </div>
                        <div>
                          <p className={styles.accountName}>{account.username}</p>
                          <p className={styles.accountId}>{account.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className={styles.email}>{account.email}</p>
                      <p className={styles.dept}>{account.department}</p>
                    </td>
                    <td>
                      <RankBadge rank={account.rank} />
                    </td>
                    <td>
                      <span className={styles.violations}>{account.violations}</span>
                    </td>
                    <td>
                      <StatusBadge status={account.status} />
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.lockBtn}
                          onClick={() => openLockModal(account)}
                          disabled={account.status === "locked"}
                        >
                          <FontAwesomeIcon icon={faLock} />
                          Khóa tạm
                        </button>
                        <button
                          type="button"
                          className={styles.detailBtn}
                          onClick={() => handleDetail(account)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.footer}>
          <p className={styles.summary}>
            Hiển thị {rangeStart}-{rangeEnd} trong số {filtered.length} kết quả
          </p>
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pageArrow}
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              aria-label="Trang trước"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`${styles.pageNum} ${
                    pageNumber === safePage ? styles.pageNumActive : ""
                  }`}
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === safePage ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              type="button"
              className={styles.pageArrow}
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              aria-label="Trang sau"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </footer>
      </section>

      <ModeratorConfirmDialog
        open={Boolean(lockTarget)}
        title="Khóa tạm tài khoản"
        description={
          lockTarget
            ? `Chọn thời hạn khóa cho tài khoản ${lockTarget.username} (${lockTarget.studentId}).`
            : ""
        }
        confirmLabel="Xác nhận khóa"
        variant="danger"
        onConfirm={confirmLock}
        onCancel={closeLockModal}
      >
        <div className={styles.lockOptions} role="radiogroup" aria-label="Thời hạn khóa">
          {LOCK_DURATIONS.map((option) => (
            <label key={option.value} className={styles.lockOption}>
              <input
                type="radio"
                name="lockDuration"
                value={option.value}
                checked={lockDays === option.value}
                onChange={() => setLockDays(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </ModeratorConfirmDialog>
    </ModeratorPageShell>
  );
}

export default ViolatingAccountsPage;
