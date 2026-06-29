import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faEye,
  faLock,
  faPlus,
  faTriangleExclamation,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { ApiError } from "@/api/httpClient";
import * as adminApi from "@/api/adminApi";
import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import Pagination from "@/common/Pagination/Pagination";
import { useToast } from "@/common/Toast/ToastProvider";
import ModeratorBadge from "@/features/moderator/components/ModeratorBadge/ModeratorBadge";
import ConfirmDialog from "@/common/ConfirmDialog/ConfirmDialog";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import ModeratorToolbar from "@/features/moderator/components/ModeratorToolbar/ModeratorToolbar";
import ViolatingAccountDetailPanel from "@/features/moderator/violations/components/ViolatingAccountDetailPanel/ViolatingAccountDetailPanel";
import EscalatedReportDetailModal from "@/features/moderator/violations/components/EscalatedReportDetailModal/EscalatedReportDetailModal";
import {
  DEFAULT_BAN_REASON,
  getAccountLockInfo,
  getLockSeverityMeta,
  getLockSeverityTone,
  loadViolatingAccountDetail,
  loadViolatingAccounts,
  LOCK_DURATION_OPTIONS,
  RANK_META,
  RANK_OPTIONS,
  SORT_OPTIONS,
  STATUS_META,
  STATUS_OPTIONS,
  submitViolatingAccountBan,
  submitViolatingAccountUnban,
  submitViolatingAccountWarning,
  VIOLATIONS_PAGE_SIZE,
} from "@/features/moderator/violations/violationsData";
import styles from "./ViolatingAccountsPage.module.css";

const VIOLATIONS_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Quản lý" },
  { label: "Tài khoản vi phạm" },
];

const SEARCH_DEBOUNCE_MS = 350;

function StatusBadge({ account }) {
  const lockInfo = getAccountLockInfo(account);

  if (lockInfo.isActive) {
    return (
      <div className={styles.statusWrap}>
        <ModeratorBadge
          label={lockInfo.statusLabel}
          tone={getLockSeverityTone(lockInfo.severity)}
          dot
        />
        <p className={styles.statusDetail}>{lockInfo.detailLabel}</p>
      </div>
    );
  }

  if (lockInfo.expired) {
    return (
      <div className={styles.statusWrap}>
        <ModeratorBadge label={lockInfo.statusLabel} tone="warning" dot />
        <p className={styles.statusDetail}>{lockInfo.detailLabel}</p>
      </div>
    );
  }

  const meta = STATUS_META[account.status] ?? STATUS_META.normal;
  return <ModeratorBadge label={meta.label} tone={meta.tone} dot />;
}

function RankBadge({ rank }) {
  const meta = RANK_META[rank] ?? RANK_META.bronze;
  return (
    <span className={`${styles.rank} ${styles[`rank-${meta.tone}`]}`}>
      <FontAwesomeIcon icon={faTrophy} className={styles["rank-icon"]} />
      {meta.label}
    </span>
  );
}

function ViolatingAccountsPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusUserId = searchParams.get("userId");
  const focusUsername = searchParams.get("username");
  const focusReason = searchParams.get("reason") ?? "";
  const focusReportCode = searchParams.get("code") ?? "";
  const focusReporter = searchParams.get("reporter") ?? "";
  const focusHandledRef = useRef(false);
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState(() => focusUsername?.replace(/^@/, "") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [sort, setSort] = useState("violations-desc");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lockTarget, setLockTarget] = useState(null);
  const [lockDays, setLockDays] = useState(7);
  const [lockReason, setLockReason] = useState(DEFAULT_BAN_REASON);
  const [warnTarget, setWarnTarget] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [unbanLoading, setUnbanLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadViolatingAccounts({
        page,
        pageSize: VIOLATIONS_PAGE_SIZE,
        search: debouncedQuery,
        status: statusFilter,
        rank: rankFilter,
        sort,
      });
      setAccounts(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      if (result.page !== page) {
        setPage(result.page);
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không tải được danh sách tài khoản vi phạm.";
      showToast(message);
      setAccounts([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, rankFilter, showToast, sort, statusFilter]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (!focusUserId || !focusUsername || focusHandledRef.current) {
      return;
    }

    focusHandledRef.current = true;
    if (focusReason) {
      setLockReason(focusReason);
    }
    setReportModalOpen(true);
  }, [focusUserId, focusUsername, focusReason]);

  function clearReportFocusParams() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("userId");
        next.delete("username");
        next.delete("reason");
        next.delete("code");
        next.delete("reporter");
        return next;
      },
      { replace: true },
    );
  }

  function closeReportModal() {
    setReportModalOpen(false);
    clearReportFocusParams();
  }

  function handleViewAccountFromReport() {
    if (focusUserId) {
      setDetailId(focusUserId);
    }
    closeReportModal();
  }

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return undefined;
    }

    let cancelled = false;
    setDetailLoading(true);

    loadViolatingAccountDetail(detailId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((error) => {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : "Không tải được chi tiết tài khoản.";
          showToast(message);
          setDetailId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailId, showToast]);

  const safePage = Math.min(page, totalPages);
  const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * VIOLATIONS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * VIOLATIONS_PAGE_SIZE, totalCount);

  function handleFilterChange(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  async function handleExport() {
    try {
      await adminApi.downloadModerationViolationsExport();
      showToast("Đã tải file CSV tài khoản vi phạm.");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Không xuất được báo cáo.", "error");
    }
  }

  function handleAddWarning() {
    setStatusFilter("normal");
    setPage(1);
    showToast(
      "Đã lọc tài khoản Bình thường — bấm Cảnh báo trên từng dòng (§2.4: Mod cảnh báo tài khoản vi phạm).",
    );
  }

  function handleDetail(account) {
    setDetailId(account.id);
  }

  function closeDetail() {
    setDetailId(null);
    setDetail(null);
  }

  function openLockModal(account, days = 7) {
    setLockTarget(account);
    setLockDays(days);
    setLockReason(DEFAULT_BAN_REASON);
  }

  function closeLockModal() {
    setLockTarget(null);
  }

  function openWarnModal(account) {
    setWarnTarget(account);
  }

  function closeWarnModal() {
    setWarnTarget(null);
  }

  async function confirmLock() {
    if (!lockTarget || actionLoading) return;

    setActionLoading(true);
    try {
      await submitViolatingAccountBan(lockTarget.id, lockDays, lockReason);
      showToast(
        `Đã khóa tạm tài khoản ${lockTarget.username} trong ${lockDays} ngày (${getLockSeverityMeta(lockDays).severityLabel}).`,
      );
      closeLockModal();
      await refreshList();
      if (detailId === lockTarget.id) {
        setDetailId(lockTarget.id);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể khóa tài khoản.";
      showToast(message);
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmWarn() {
    if (!warnTarget || actionLoading) return;

    setActionLoading(true);
    try {
      await submitViolatingAccountWarning(warnTarget.id);
      showToast(`Đã gửi cảnh báo cho tài khoản ${warnTarget.username}.`);
      closeWarnModal();
      await refreshList();
      if (detailId === warnTarget.id) {
        setDetailId(warnTarget.id);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể gửi cảnh báo.";
      showToast(message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnban() {
    if (!detailId || unbanLoading) return;

    setUnbanLoading(true);
    try {
      await submitViolatingAccountUnban(detailId);
      showToast("Đã gỡ khóa tạm cho tài khoản.");
      await refreshList();
      setDetailId(detailId);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể gỡ khóa.";
      showToast(message);
    } finally {
      setUnbanLoading(false);
    }
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
      variant="wide"
      title="Quản lý Tài khoản vi phạm"
      description="Cảnh báo hoặc khóa tạm tài khoản vi phạm: 1 ngày / 7 ngày / 30 ngày (Moderator)."
      crumbs={VIOLATIONS_CRUMBS}
      actions={headerActions}
    >
      <div className={styles.layout}>
        <section className={styles.card}>
          <ModeratorToolbar
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm kiếm theo Tên, Email hoặc username..."
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
                  <th>Cảnh báo / khóa tạm</th>
                  <th aria-label="Thao tác khác" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      Đang tải danh sách...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      {focusUserId
                        ? "Tài khoản chưa có lịch sử vi phạm — bấm Chi tiết để xem và xử lý."
                        : "Không có tài khoản vi phạm nào. Hiển thị user đã bị cảnh báo, khóa tạm hoặc được chuyển từ báo cáo."}
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => {
                    const lockInfo = getAccountLockInfo(account);
                    const lockDisabled = lockInfo.isActive;
                    const isSelected = detailId === account.id;

                    return (
                      <tr key={account.id} className={isSelected ? styles.rowSelected : undefined}>
                        <td>
                          <div className={styles.account}>
                            <div className={styles.avatar} aria-hidden>
                              {account.initial}
                            </div>
                            <div>
                              <p className={styles.accountName}>{account.displayName}</p>
                              <p className={styles.accountId}>@{account.username}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className={styles.email}>{account.email}</p>
                          <p className={styles.dept}>{account.studentId}</p>
                        </td>
                        <td>
                          <RankBadge rank={account.rank} />
                        </td>
                        <td>
                          <span className={styles.violations}>{account.violations}</span>
                        </td>
                        <td>
                          <StatusBadge account={account} />
                        </td>
                        <td>
                          <div className={styles.sanctionActions}>
                            <button
                              type="button"
                              className={styles.warnBtn}
                              onClick={() => openWarnModal(account)}
                              disabled={lockDisabled || actionLoading}
                            >
                              <FontAwesomeIcon icon={faTriangleExclamation} />
                              Cảnh báo
                            </button>
                            <div className={styles.lockGroup} role="group" aria-label="Khóa tạm">
                              {LOCK_DURATION_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`${styles.lockChip} ${styles[`lockChip-${option.severity}`]}`}
                                  onClick={() => openLockModal(account, option.value)}
                                  disabled={lockDisabled || actionLoading}
                                  title={`Khóa tạm ${option.label} — ${option.severityLabel}`}
                                >
                                  <FontAwesomeIcon icon={faLock} />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className={styles.detailCell}>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className={styles.tableFooter}>
            <p className={styles.summary}>
              Hiển thị <strong>{rangeStart}–{rangeEnd}</strong> / {totalCount} tài khoản
            </p>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              ariaLabel="Phân trang tài khoản vi phạm"
              alwaysShow
              flush
            />
            <p className={styles.footerBalance} aria-hidden="true">
              Hiển thị <strong>{rangeStart}–{rangeEnd}</strong> / {totalCount} tài khoản
            </p>
          </footer>
        </section>
      </div>

      <ViolatingAccountDetailPanel
        open={Boolean(detailId)}
        detail={detail}
        loading={detailLoading}
        onClose={closeDetail}
        onUnban={handleUnban}
        unbanLoading={unbanLoading}
      />

      <ConfirmDialog
        open={Boolean(lockTarget)}
        title="Khóa tạm tài khoản"
        description={
          lockTarget
            ? `Xác nhận khóa tạm tài khoản ${lockTarget.username} (${lockTarget.displayName}).`
            : ""
        }
        confirmLabel={actionLoading ? "Đang xử lý..." : "Xác nhận khóa"}
        variant="danger"
        onConfirm={confirmLock}
        onCancel={closeLockModal}
      >
        <div className={styles.lockOptions} role="radiogroup" aria-label="Thời hạn khóa">
          {LOCK_DURATION_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`${styles.lockOption} ${styles[`lockOption-${option.severity}`]} ${
                lockDays === option.value ? styles.lockOptionActive : ""
              }`}
            >
              <input
                type="radio"
                name="lockDuration"
                value={option.value}
                checked={lockDays === option.value}
                onChange={() => setLockDays(option.value)}
              />
              <span className={styles.lockOptionBody}>
                <span className={styles.lockOptionMain}>
                  <span className={styles.lockOptionLabel}>{option.label}</span>
                  <ModeratorBadge
                    label={option.severityLabel}
                    tone={getLockSeverityTone(option.severity)}
                    size="sm"
                  />
                </span>
                <span className={styles.lockOptionMeta}>{option.description}</span>
              </span>
            </label>
          ))}
        </div>
        <label className={styles.reasonField}>
          <span className={styles.reasonLabel}>Lý do khóa</span>
          <textarea
            className={styles.reasonInput}
            rows={3}
            value={lockReason}
            onChange={(event) => setLockReason(event.target.value)}
            placeholder={DEFAULT_BAN_REASON}
          />
        </label>
        <p className={styles.lockHint}>
          Moderator chỉ được khóa tạm 1 / 7 / 30 ngày. Khóa vĩnh viễn thuộc quyền Admin.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(warnTarget)}
        title="Gửi cảnh báo"
        description={
          warnTarget
            ? `Gửi cảnh báo vi phạm tiêu chuẩn cộng đồng cho ${warnTarget.username} (${warnTarget.displayName}).`
            : ""
        }
        confirmLabel={actionLoading ? "Đang gửi..." : "Gửi cảnh báo"}
        variant="primary"
        onConfirm={confirmWarn}
        onCancel={closeWarnModal}
      />

      <EscalatedReportDetailModal
        open={reportModalOpen}
        onClose={closeReportModal}
        reportCode={focusReportCode}
        username={focusUsername}
        reporterUsername={focusReporter}
        detail={focusReason}
        onViewAccount={handleViewAccountFromReport}
      />
    </ModeratorPageShell>
  );
}

export default ViolatingAccountsPage;
