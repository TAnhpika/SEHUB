import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faDownload,
  faEye,
  faMagnifyingGlass,
  faPlus,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import { useToast } from "@/common/Toast/ToastProvider";
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

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
    <span className={`${styles.status} ${styles[`status-${meta.tone}`]}`}>
      <span className={styles["status-dot"]} aria-hidden />
      {meta.label}
    </span>
  );
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [sort, setSort] = useState("violations-desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      filterViolatingAccounts(VIOLATING_ACCOUNTS_MOCK, {
        query,
        status: statusFilter,
        rank: rankFilter,
        sort,
      }),
    [query, statusFilter, rankFilter, sort],
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

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/home">Trang chủ</Link>
        <span className={styles.sep}>/</span>
        <span>Quản lý</span>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>Tài khoản vi phạm</span>
      </nav>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Tài khoản vi phạm</h1>
          <p className={styles.subtitle}>
            Giám sát và xử lý các tài khoản vi phạm tiêu chuẩn cộng đồng.
          </p>
        </div>
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
      </header>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Tìm kiếm theo Tên, Email hoặc MSSV..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
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
        </div>

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
                      <button
                        type="button"
                        className={styles.detailBtn}
                        onClick={() => handleDetail(account)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                        Chi tiết
                      </button>
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
    </div>
  );
}

export default ViolatingAccountsPage;
